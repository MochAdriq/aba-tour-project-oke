const crypto = require("crypto");
const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "db_aba_tour",
});

const WEBHOOK_SECRET =
  process.env.PAYMENT_WEBHOOK_SECRET || "DEV_PAYMENT_WEBHOOK_SECRET";

const timingSafeEqualHex = (a, b) => {
  try {
    const aBuf = Buffer.from(a || "", "hex");
    const bBuf = Buffer.from(b || "", "hex");
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch (error) {
    return false;
  }
};

const signPayload = (rawBody) =>
  crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");

const toInt = (value) => Number.parseInt(value, 10) || 0;
const RESERVING_STATUSES = new Set(["confirmed", "paid"]);

const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/payment-proofs/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `proof-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
        file.originalname,
      )}`,
    );
  },
});

const paymentProofUpload = multer({
  storage: paymentProofStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("File bukti harus berupa gambar."));
    }
    return cb(null, true);
  },
});

db.query(
  `CREATE TABLE IF NOT EXISTS payment_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(60) NOT NULL,
    account_number VARCHAR(60) NOT NULL,
    account_holder VARCHAR(120) NOT NULL,
    branch_info VARCHAR(120) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_bank_account (bank_name, account_number)
  )`,
  (err) => {
    if (err) console.error("Create payment_channels table error:", err.message);
  },
);

db.query(
  `INSERT IGNORE INTO payment_channels
   (bank_name, account_number, account_holder, branch_info, is_active)
   VALUES
   ('BCA', '1234567890', 'PT ABA Tour Travel', 'KCP Sukabumi', 1),
   ('BNI', '0091234567890', 'PT ABA Tour Travel', 'KC Sukabumi', 1),
   ('BRI', '002301234567890', 'PT ABA Tour Travel', 'KC Cibadak', 1),
   ('BSI', '7123456789', 'PT ABA Tour Travel', 'KCP Sukalarang', 1),
   ('Mandiri', '1450012345678', 'PT ABA Tour Travel', 'KC Sukabumi', 1),
   ('CIMB Niaga', '800123456700', 'PT ABA Tour Travel', 'KC Bogor', 1),
   ('PermataBank', '5230012345678', 'PT ABA Tour Travel', 'KC Jakarta', 1),
   ('BTN', '0002312345678', 'PT ABA Tour Travel', 'KC Bandung', 1),
   ('Danamon', '0119012345678', 'PT ABA Tour Travel', 'KC Depok', 1),
   ('OCBC NISP', '028123456789', 'PT ABA Tour Travel', 'KC Tangerang', 1)`,
  (err) => {
    if (err) console.error("Seed payment channels error:", err.message);
  },
);

db.query(
  `CREATE TABLE IF NOT EXISTS payment_proofs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    payment_channel_id INT NOT NULL,
    sender_name VARCHAR(120) NOT NULL,
    sender_bank VARCHAR(80) NOT NULL,
    amount BIGINT NOT NULL,
    transfer_date DATE NOT NULL,
    note TEXT NULL,
    proof_image_url VARCHAR(255) NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    verified_by_user_id INT NULL,
    verified_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payment_proofs_booking_id (booking_id),
    INDEX idx_payment_proofs_verification_status (verification_status)
  )`,
  (err) => {
    if (err) console.error("Create payment_proofs table error:", err.message);
  },
);

const insertStatusLog = ({
  bookingId,
  fromStatus,
  toStatus,
  source,
  note = null,
}) => {
  db.query(
    `INSERT INTO booking_status_logs
    (booking_id, from_status, to_status, source, note)
    VALUES (?, ?, ?, ?, ?)`,
    [bookingId, fromStatus, toStatus, source, note],
    (err) => {
      if (err) console.error("Insert booking log (webhook) error:", err.message);
    },
  );
};

router.get("/instructions", (req, res) => {
  db.query(
    `SELECT id, bank_name, account_number, account_holder, branch_info
     FROM payment_channels
     WHERE is_active = 1
     ORDER BY bank_name ASC`,
    (err, rows) => {
      if (err) {
        console.error("Get payment channels error:", err.message);
        return res.status(500).json({ error: "Gagal memuat rekening pembayaran." });
      }
      return res.json({ channels: rows });
    },
  );
});

router.get("/channels/admin", requireAuth, requireAdmin, (req, res) => {
  db.query(
    `SELECT id, bank_name, account_number, account_holder, branch_info, is_active, created_at, updated_at
     FROM payment_channels
     ORDER BY is_active DESC, bank_name ASC`,
    (err, rows) => {
      if (err) {
        console.error("Admin get channels error:", err.message);
        return res.status(500).json({ error: "Gagal memuat akun bank." });
      }
      return res.json({ channels: rows });
    },
  );
});

router.post("/channels/admin", requireAuth, requireAdmin, (req, res) => {
  const bankName = String(req.body.bank_name || "").trim();
  const accountNumber = String(req.body.account_number || "").trim();
  const accountHolder = String(req.body.account_holder || "").trim();
  const branchInfo = String(req.body.branch_info || "").trim();
  const isActive = Number(req.body.is_active) === 0 ? 0 : 1;

  if (!bankName || !accountNumber || !accountHolder) {
    return res.status(400).json({
      error: "Nama bank, nomor rekening, dan nama pemilik wajib diisi.",
    });
  }

  db.query(
    `INSERT INTO payment_channels
     (bank_name, account_number, account_holder, branch_info, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [bankName, accountNumber, accountHolder, branchInfo || null, isActive],
    (err, result) => {
      if (err) {
        console.error("Admin create channel error:", err.message);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "Rekening bank sudah ada." });
        }
        return res.status(500).json({ error: "Gagal menambah akun bank." });
      }
      return res.status(201).json({
        message: "Akun bank berhasil ditambahkan.",
        id: result.insertId,
      });
    },
  );
});

router.put("/channels/admin/:id", requireAuth, requireAdmin, (req, res) => {
  const channelId = toInt(req.params.id);
  if (!channelId) {
    return res.status(400).json({ error: "ID akun bank tidak valid." });
  }

  const bankName = String(req.body.bank_name || "").trim();
  const accountNumber = String(req.body.account_number || "").trim();
  const accountHolder = String(req.body.account_holder || "").trim();
  const branchInfo = String(req.body.branch_info || "").trim();
  const isActive = Number(req.body.is_active) === 0 ? 0 : 1;

  if (!bankName || !accountNumber || !accountHolder) {
    return res.status(400).json({
      error: "Nama bank, nomor rekening, dan nama pemilik wajib diisi.",
    });
  }

  db.query(
    `UPDATE payment_channels
     SET bank_name = ?, account_number = ?, account_holder = ?, branch_info = ?, is_active = ?
     WHERE id = ?`,
    [bankName, accountNumber, accountHolder, branchInfo || null, isActive, channelId],
    (err, result) => {
      if (err) {
        console.error("Admin update channel error:", err.message);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "Rekening bank sudah ada." });
        }
        return res.status(500).json({ error: "Gagal memperbarui akun bank." });
      }
      if (!result.affectedRows) {
        return res.status(404).json({ error: "Akun bank tidak ditemukan." });
      }
      return res.json({ message: "Akun bank berhasil diperbarui." });
    },
  );
});

router.patch(
  "/channels/admin/:id/toggle-active",
  requireAuth,
  requireAdmin,
  (req, res) => {
    const channelId = toInt(req.params.id);
    if (!channelId) {
      return res.status(400).json({ error: "ID akun bank tidak valid." });
    }

    db.query(
      "UPDATE payment_channels SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?",
      [channelId],
      (err, result) => {
        if (err) {
          console.error("Admin toggle channel error:", err.message);
          return res.status(500).json({ error: "Gagal mengubah status akun bank." });
        }
        if (!result.affectedRows) {
          return res.status(404).json({ error: "Akun bank tidak ditemukan." });
        }
        return res.json({ message: "Status akun bank berhasil diperbarui." });
      },
    );
  },
);

router.get("/booking/:bookingCode", requireAuth, (req, res) => {
  const bookingCode = String(req.params.bookingCode || "").trim();
  if (!bookingCode) {
    return res.status(400).json({ error: "Kode booking tidak valid." });
  }

  db.query(
    `SELECT id, booking_code, product_title, customer_name, total_price, status, payment_status
     FROM bookings
     WHERE booking_code = ?`,
    [bookingCode],
    (err, rows) => {
      if (err) {
        console.error("Get booking for payment error:", err.message);
        return res.status(500).json({ error: "Gagal memuat data booking." });
      }
      if (!rows.length) {
        return res.status(404).json({ error: "Booking tidak ditemukan." });
      }
      return res.json({ booking: rows[0] });
    },
  );
});

router.post("/proof", requireAuth, paymentProofUpload.single("proof_image"), (req, res) => {
  const bookingCode = String(req.body.booking_code || "").trim();
  const paymentChannelId = toInt(req.body.payment_channel_id);
  const senderName = String(req.body.sender_name || "").trim();
  const senderBank = String(req.body.sender_bank || "").trim();
  const amount = Math.max(0, toInt(req.body.amount));
  const transferDate = String(req.body.transfer_date || "").trim();
  const note = String(req.body.note || "").trim();

  if (!bookingCode) {
    return res.status(400).json({ error: "Kode booking wajib diisi." });
  }
  if (!paymentChannelId) {
    return res.status(400).json({ error: "Bank tujuan transfer wajib dipilih." });
  }
  if (!senderName || senderName.length < 3) {
    return res.status(400).json({ error: "Nama pengirim minimal 3 karakter." });
  }
  if (!senderBank) {
    return res.status(400).json({ error: "Bank pengirim wajib diisi." });
  }
  if (!amount) {
    return res.status(400).json({ error: "Nominal transfer wajib diisi." });
  }
  if (!transferDate) {
    return res.status(400).json({ error: "Tanggal transfer wajib diisi." });
  }
  if (!req.file) {
    return res.status(400).json({ error: "Bukti transfer wajib diupload." });
  }

  db.query(
    "SELECT id, booking_code, payment_status FROM bookings WHERE booking_code = ? LIMIT 1",
    [bookingCode],
    (bookingErr, bookingRows) => {
      if (bookingErr) {
        console.error("Find booking for proof error:", bookingErr.message);
        return res.status(500).json({ error: "Gagal memproses bukti pembayaran." });
      }
      if (!bookingRows.length) {
        return res.status(404).json({ error: "Booking tidak ditemukan." });
      }
      if (bookingRows[0].payment_status === "paid") {
        return res.status(400).json({ error: "Booking ini sudah lunas." });
      }

      db.query(
        "SELECT id FROM payment_channels WHERE id = ? AND is_active = 1 LIMIT 1",
        [paymentChannelId],
        (channelErr, channelRows) => {
          if (channelErr) {
            console.error("Find payment channel error:", channelErr.message);
            return res
              .status(500)
              .json({ error: "Gagal memproses bukti pembayaran." });
          }
          if (!channelRows.length) {
            return res
              .status(400)
              .json({ error: "Rekening tujuan tidak ditemukan." });
          }

          const insertSql = `INSERT INTO payment_proofs
            (booking_id, payment_channel_id, sender_name, sender_bank, amount, transfer_date, note, proof_image_url, verification_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;

          db.query(
            insertSql,
            [
              bookingRows[0].id,
              paymentChannelId,
              senderName,
              senderBank,
              amount,
              transferDate,
              note || null,
              req.file.filename,
            ],
            (insertErr, insertRes) => {
              if (insertErr) {
                console.error("Insert payment proof error:", insertErr.message);
                return res
                  .status(500)
                  .json({ error: "Gagal menyimpan bukti pembayaran." });
              }

              return res.status(201).json({
                message: "Bukti pembayaran berhasil dikirim dan menunggu verifikasi admin.",
                proof: {
                  id: insertRes.insertId,
                  booking_code: bookingRows[0].booking_code,
                  verification_status: "pending",
                },
              });
            },
          );
        },
      );
    },
  );
});

router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-aba-signature"];
  const rawBody = req.body;

  if (!signature || !rawBody) {
    return res.status(400).json({ error: "Webhook payload tidak valid." });
  }

  const expectedSignature = signPayload(rawBody);
  if (!timingSafeEqualHex(signature, expectedSignature)) {
    return res.status(401).json({ error: "Signature webhook tidak valid." });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch (error) {
    return res.status(400).json({ error: "JSON webhook tidak valid." });
  }

  const event = payload?.event;
  const data = payload?.data || {};
  const bookingId = toInt(data.booking_id);
  const bookingCode = String(data.booking_code || "").trim();

  if (!event || (!bookingId && !bookingCode)) {
    return res.status(400).json({ error: "Data webhook tidak lengkap." });
  }

  const findSql = bookingId
    ? "SELECT id, booking_code, status, payment_status, product_id, total_pax FROM bookings WHERE id = ? FOR UPDATE"
    : "SELECT id, booking_code, status, payment_status, product_id, total_pax FROM bookings WHERE booking_code = ? FOR UPDATE";
  const findValue = bookingId || bookingCode;

  db.beginTransaction((trxErr) => {
    if (trxErr) return res.status(500).json({ error: "Gagal proses webhook." });

    db.query(findSql, [findValue], (findErr, rows) => {
      if (findErr) {
        return db.rollback(() =>
          res.status(500).json({ error: "Gagal proses webhook." }),
        );
      }
      if (!rows.length) {
        return db.rollback(() =>
          res.status(404).json({ error: "Booking tidak ditemukan." }),
        );
      }

      const booking = rows[0];
      const currentStatus = booking.status;
      const currentPaymentStatus = booking.payment_status;

      if (event === "payment.paid") {
        const shouldReserve =
          !RESERVING_STATUSES.has(currentStatus) && currentStatus !== "cancelled";

        const continueAfterQuota = () => {
          db.query(
            `UPDATE bookings
             SET status = CASE WHEN status = 'cancelled' THEN status ELSE 'paid' END,
                 payment_status = 'paid',
                 payment_method = ?,
                 payment_provider = ?,
                 external_txn_id = ?,
                 paid_at = COALESCE(paid_at, NOW())
             WHERE id = ?`,
            [
              data.payment_method || null,
              data.payment_provider || "gateway",
              data.external_txn_id || null,
              booking.id,
            ],
            (updateErr) => {
              if (updateErr) {
                return db.rollback(() =>
                  res.status(500).json({ error: "Gagal proses webhook." }),
                );
              }

              if (currentStatus !== "paid" && currentStatus !== "cancelled") {
                insertStatusLog({
                  bookingId: booking.id,
                  fromStatus: currentStatus,
                  toStatus: "paid",
                  source: "webhook",
                  note: `Payment paid. External Txn: ${data.external_txn_id || "-"}`,
                });
              }

              db.commit((commitErr) => {
                if (commitErr) {
                  return db.rollback(() =>
                    res.status(500).json({ error: "Gagal proses webhook." }),
                  );
                }
                return res.json({ message: "Webhook paid diproses." });
              });
            },
          );
        };

        if (shouldReserve) {
          db.query(
            "UPDATE products SET quota = quota - ? WHERE id = ? AND quota >= ?",
            [booking.total_pax, booking.product_id, booking.total_pax],
            (quotaErr, quotaRes) => {
              if (quotaErr) {
                return db.rollback(() =>
                  res.status(500).json({ error: "Gagal proses webhook." }),
                );
              }
              if (!quotaRes.affectedRows) {
                return db.rollback(() =>
                  res.status(400).json({ error: "Kuota tidak mencukupi." }),
                );
              }
              return continueAfterQuota();
            },
          );
          return;
        }

        return continueAfterQuota();
      }

      if (event === "payment.failed") {
        db.query(
          "UPDATE bookings SET payment_status = 'failed', payment_provider = ?, external_txn_id = ? WHERE id = ?",
          [
            data.payment_provider || "gateway",
            data.external_txn_id || null,
            booking.id,
          ],
          (updateErr) => {
            if (updateErr) {
              return db.rollback(() =>
                res.status(500).json({ error: "Gagal proses webhook." }),
              );
            }

            if (currentPaymentStatus !== "failed") {
              insertStatusLog({
                bookingId: booking.id,
                fromStatus: currentStatus,
                toStatus: currentStatus,
                source: "webhook",
                note: `Payment failed. External Txn: ${data.external_txn_id || "-"}`,
              });
            }

            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() =>
                  res.status(500).json({ error: "Gagal proses webhook." }),
                );
              }
              return res.json({ message: "Webhook failed diproses." });
            });
          },
        );
        return;
      }

      db.rollback(() =>
        res.status(400).json({ error: `Event webhook tidak didukung: ${event}` }),
      );
    });
  });
});

module.exports = router;
