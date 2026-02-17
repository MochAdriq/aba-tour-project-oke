const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "db_aba_tour",
});

const BOOKING_STATUSES = ["pending", "confirmed", "paid", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{9,15}$/;
const createBookingHitMap = new Map();
const PAYMENT_WEBHOOK_SECRET =
  process.env.PAYMENT_WEBHOOK_SECRET || "DEV_PAYMENT_WEBHOOK_SECRET";

const toInt = (value) => Number.parseInt(value, 10) || 0;
const normalizePhone = (value) => String(value || "").replace(/\s|-/g, "");

const RESERVING_STATUSES = new Set(["confirmed", "paid"]);
const ALLOWED_TRANSITIONS = {
  pending: new Set(["confirmed", "paid", "cancelled"]),
  confirmed: new Set(["paid", "cancelled"]),
  paid: new Set(["cancelled"]),
  cancelled: new Set([]),
};

db.query(
  `CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(24) NOT NULL UNIQUE,
    product_id INT NOT NULL,
    product_title VARCHAR(255) NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_email VARCHAR(120) NULL,
    qty_quad INT NOT NULL DEFAULT 0,
    qty_triple INT NOT NULL DEFAULT 0,
    qty_double INT NOT NULL DEFAULT 0,
    total_pax INT NOT NULL,
    total_price BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_note TEXT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    payment_method VARCHAR(50) NULL,
    payment_provider VARCHAR(50) NULL,
    external_txn_id VARCHAR(120) NULL,
    paid_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bookings_product_id (product_id),
    INDEX idx_bookings_status (status),
    INDEX idx_bookings_payment_status (payment_status),
    INDEX idx_bookings_created_at (created_at)
  )`,
  (err) => {
    if (err) console.error("Create bookings table error:", err.message);
  },
);

db.query(
  `CREATE TABLE IF NOT EXISTS booking_status_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    from_status VARCHAR(20) NULL,
    to_status VARCHAR(20) NOT NULL,
    changed_by_user_id INT NULL,
    changed_by_role VARCHAR(30) NULL,
    source VARCHAR(30) NOT NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_booking_status_logs_booking_id (booking_id),
    INDEX idx_booking_status_logs_created_at (created_at)
  )`,
  (err) => {
    if (err) console.error("Create booking_status_logs table error:", err.message);
  },
);

const schemaPatchQueries = [
  "ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'",
  "ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) NULL",
  "ALTER TABLE bookings ADD COLUMN payment_provider VARCHAR(50) NULL",
  "ALTER TABLE bookings ADD COLUMN external_txn_id VARCHAR(120) NULL",
  "ALTER TABLE bookings ADD COLUMN paid_at DATETIME NULL",
  "ALTER TABLE bookings ADD INDEX idx_bookings_payment_status (payment_status)",
];

schemaPatchQueries.forEach((query) => {
  db.query(query, (err) => {
    if (
      err &&
      err.code !== "ER_DUP_FIELDNAME" &&
      err.code !== "ER_DUP_KEYNAME"
    ) {
      console.error("Booking schema patch error:", err.message);
    }
  });
});

const insertStatusLog = ({
  bookingId,
  fromStatus,
  toStatus,
  source,
  userId = null,
  role = null,
  note = null,
}) => {
  db.query(
    `INSERT INTO booking_status_logs
    (booking_id, from_status, to_status, changed_by_user_id, changed_by_role, source, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [bookingId, fromStatus, toStatus, userId, role, source, note],
    (err) => {
      if (err) console.error("Insert booking log error:", err.message);
    },
  );
};

const shouldReserveQuota = (fromStatus, toStatus) =>
  !RESERVING_STATUSES.has(fromStatus) && RESERVING_STATUSES.has(toStatus);

const shouldReleaseQuota = (fromStatus, toStatus) =>
  RESERVING_STATUSES.has(fromStatus) && toStatus === "cancelled";

const isTransitionAllowed = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) return true;
  return ALLOWED_TRANSITIONS[fromStatus]?.has(toStatus) || false;
};

const createBookingRateLimit = (req, res, next) => {
  const key = req.ip || "unknown-ip";
  const now = Date.now();
  const bucket = createBookingHitMap.get(key) || [];
  const freshBucket = bucket.filter((ts) => now - ts <= 60 * 1000);

  if (freshBucket.length >= 10) {
    return res
      .status(429)
      .json({ error: "Terlalu banyak request, coba lagi sebentar." });
  }

  freshBucket.push(now);
  createBookingHitMap.set(key, freshBucket);
  return next();
};

router.post("/", createBookingRateLimit, (req, res) => {
  const {
    product_id,
    customer_name,
    customer_phone,
    customer_email,
    qty_quad,
    qty_triple,
    qty_double,
  } = req.body;

  const cleanProductId = toInt(product_id);
  const cleanQuad = Math.max(0, toInt(qty_quad));
  const cleanTriple = Math.max(0, toInt(qty_triple));
  const cleanDouble = Math.max(0, toInt(qty_double));
  const totalPax = cleanQuad + cleanTriple + cleanDouble;

  if (!cleanProductId) {
    return res.status(400).json({ error: "Produk tidak valid." });
  }
  const cleanName = String(customer_name || "").trim();
  const cleanPhone = normalizePhone(customer_phone);
  const cleanEmail = String(customer_email || "").trim();

  if (!cleanName || !cleanPhone) {
    return res.status(400).json({ error: "Nama dan nomor WA wajib diisi." });
  }
  if (cleanName.length < 3 || cleanName.length > 120) {
    return res.status(400).json({ error: "Nama harus 3-120 karakter." });
  }
  if (!PHONE_REGEX.test(cleanPhone)) {
    return res
      .status(400)
      .json({ error: "Format nomor WA tidak valid (9-15 digit)." });
  }
  if (cleanEmail && !EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: "Format email tidak valid." });
  }
  if (totalPax <= 0) {
    return res.status(400).json({ error: "Pilih minimal 1 jamaah." });
  }

  db.query(
    "SELECT id, title, price_quad, price_triple, price_double, quota, product_status FROM products WHERE id = ?",
    [cleanProductId],
    (productErr, productRows) => {
      if (productErr) {
        console.error("Booking product lookup error:", productErr.message);
        return res.status(500).json({ error: "Gagal memproses booking." });
      }
      if (productRows.length === 0) {
        return res.status(404).json({ error: "Produk tidak ditemukan." });
      }

      const product = productRows[0];
      const isClosed =
        String(product.product_status || "").toLowerCase() === "closed";
      if (isClosed) {
        return res.status(400).json({ error: "Paket sedang ditutup." });
      }
      if (totalPax > Number(product.quota || 0)) {
        return res
          .status(400)
          .json({ error: "Jumlah jamaah melebihi kuota tersedia." });
      }

      const totalPrice =
        cleanQuad * Number(product.price_quad || 0) +
        cleanTriple * Number(product.price_triple || 0) +
        cleanDouble * Number(product.price_double || 0);

      const bookingCode = `BK-${Date.now()}`;
      const insertSql = `INSERT INTO bookings
        (booking_code, product_id, product_title, customer_name, customer_phone, customer_email,
         qty_quad, qty_triple, qty_double, total_pax, total_price, status, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')`;

      const insertValues = [
        bookingCode,
        cleanProductId,
        product.title,
        cleanName,
        cleanPhone,
        cleanEmail || null,
        cleanQuad,
        cleanTriple,
        cleanDouble,
        totalPax,
        totalPrice,
      ];

      db.query(insertSql, insertValues, (insertErr, result) => {
        if (insertErr) {
          console.error("Booking insert error:", insertErr.message);
          return res.status(500).json({ error: "Gagal menyimpan booking." });
        }

        insertStatusLog({
          bookingId: result.insertId,
          fromStatus: null,
          toStatus: "pending",
          source: "customer",
          note: "Booking dibuat oleh customer",
        });

        return res.status(201).json({
          message: "Booking berhasil dibuat.",
          booking: {
            id: result.insertId,
            booking_code: bookingCode,
            status: "pending",
            payment_status: "unpaid",
            total_pax: totalPax,
            total_price: totalPrice,
          },
        });
      });
    },
  );
});

router.get("/", requireAuth, requireAdmin, (req, res) => {
  const { status, payment_status } = req.query;
  const q = String(req.query.q || "").trim();
  const page = Math.max(1, toInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, toInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  let whereSql = " WHERE 1=1";
  const values = [];

  if (status && BOOKING_STATUSES.includes(status)) {
    whereSql += " AND status = ?";
    values.push(status);
  }

  if (payment_status && PAYMENT_STATUSES.includes(payment_status)) {
    whereSql += " AND payment_status = ?";
    values.push(payment_status);
  }

  if (q) {
    const cleanQ = q.slice(0, 80);
    whereSql +=
      " AND (booking_code LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR product_title LIKE ?)";
    values.push(`%${cleanQ}%`, `%${cleanQ}%`, `%${cleanQ}%`, `%${cleanQ}%`);
  }

  const countSql = `SELECT COUNT(*) as total FROM bookings${whereSql}`;
  const listSql = `SELECT * FROM bookings${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

  db.query(countSql, values, (countErr, countRows) => {
    if (countErr) {
      console.error("Booking list count error:", countErr.message);
      return res.status(500).json({ error: "Gagal memuat data booking." });
    }

    const total = Number(countRows?.[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    db.query(listSql, [...values, limit, offset], (err, rows) => {
      if (err) {
        console.error("Booking list error:", err.message);
        return res.status(500).json({ error: "Gagal memuat data booking." });
      }
      res.json({
        items: rows,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      });
    });
  });
});

router.get("/:id", requireAuth, requireAdmin, (req, res) => {
  db.query(
    "SELECT * FROM bookings WHERE id = ?",
    [req.params.id],
    (err, rows) => {
      if (err) {
        console.error("Booking detail error:", err.message);
        return res.status(500).json({ error: "Gagal memuat detail booking." });
      }
      if (rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(rows[0]);
    },
  );
});

router.get("/:id/logs", requireAuth, requireAdmin, (req, res) => {
  db.query(
    `SELECT id, booking_id, from_status, to_status, changed_by_user_id, changed_by_role, source, note, created_at
     FROM booking_status_logs
     WHERE booking_id = ?
     ORDER BY created_at DESC, id DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) {
        console.error("Booking logs error:", err.message);
        return res.status(500).json({ error: "Gagal memuat log booking." });
      }
      res.json(rows);
    },
  );
});

router.patch("/:id/status", requireAuth, requireAdmin, (req, res) => {
  const { status, admin_note } = req.body;
  const bookingId = toInt(req.params.id);

  if (!bookingId) return res.status(400).json({ error: "ID booking tidak valid." });
  if (!BOOKING_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Status booking tidak valid." });
  }

  db.beginTransaction((trxErr) => {
    if (trxErr) {
      console.error("Booking trx error:", trxErr.message);
      return res.status(500).json({ error: "Gagal update status booking." });
    }

    db.query(
      "SELECT id, product_id, total_pax, status, payment_status FROM bookings WHERE id = ? FOR UPDATE",
      [bookingId],
      (findErr, rows) => {
        if (findErr) {
          return db.rollback(() =>
            res.status(500).json({ error: "Gagal update status booking." }),
          );
        }
        if (rows.length === 0) {
          return db.rollback(() =>
            res.status(404).json({ error: "Booking tidak ditemukan." }),
          );
        }

        const booking = rows[0];
        const fromStatus = booking.status;
        const toStatus = status;

        if (!isTransitionAllowed(fromStatus, toStatus)) {
          return db.rollback(() =>
            res.status(400).json({
              error: `Transisi status tidak valid dari ${fromStatus} ke ${toStatus}.`,
            }),
          );
        }

        const nextPaymentStatus =
          toStatus === "paid"
            ? "paid"
            : toStatus === "cancelled" && booking.payment_status !== "paid"
              ? "failed"
              : booking.payment_status;

        const updateBooking = () => {
          db.query(
            `UPDATE bookings
             SET status = ?, payment_status = ?, admin_note = ?, paid_at = CASE WHEN ? = 'paid' AND paid_at IS NULL THEN NOW() ELSE paid_at END
             WHERE id = ?`,
            [toStatus, nextPaymentStatus, admin_note || null, toStatus, bookingId],
            (updateErr) => {
              if (updateErr) {
                return db.rollback(() =>
                  res.status(500).json({ error: "Gagal update status booking." }),
                );
              }

              insertStatusLog({
                bookingId,
                fromStatus,
                toStatus,
                source: "admin",
                userId: req.user?.id || null,
                role: req.user?.role || null,
                note: admin_note || null,
              });

              db.commit((commitErr) => {
                if (commitErr) {
                  return db.rollback(() =>
                    res.status(500).json({ error: "Gagal update status booking." }),
                  );
                }
                return res.json({
                  message: "Status booking berhasil diperbarui.",
                });
              });
            },
          );
        };

        if (shouldReserveQuota(fromStatus, toStatus)) {
          db.query(
            "UPDATE products SET quota = quota - ? WHERE id = ? AND quota >= ?",
            [booking.total_pax, booking.product_id, booking.total_pax],
            (quotaErr, quotaRes) => {
              if (quotaErr) {
                return db.rollback(() =>
                  res.status(500).json({ error: "Gagal update status booking." }),
                );
              }
              if (!quotaRes.affectedRows) {
                return db.rollback(() =>
                  res.status(400).json({ error: "Kuota tidak mencukupi." }),
                );
              }
              return updateBooking();
            },
          );
          return;
        }

        if (shouldReleaseQuota(fromStatus, toStatus)) {
          db.query(
            "UPDATE products SET quota = quota + ? WHERE id = ?",
            [booking.total_pax, booking.product_id],
            (quotaErr) => {
              if (quotaErr) {
                return db.rollback(() =>
                  res.status(500).json({ error: "Gagal update status booking." }),
                );
              }
              return updateBooking();
            },
          );
          return;
        }

        updateBooking();
      },
    );
  });
});

router.post("/:id/payment-intent", requireAuth, requireAdmin, (req, res) => {
  const bookingId = toInt(req.params.id);
  if (!bookingId) return res.status(400).json({ error: "ID booking tidak valid." });

  db.query(
    "SELECT id, booking_code, total_price, payment_status, status FROM bookings WHERE id = ?",
    [bookingId],
    (err, rows) => {
      if (err) {
        console.error("Payment intent booking lookup error:", err.message);
        return res.status(500).json({ error: "Gagal membuat payment intent." });
      }
      if (!rows.length) {
        return res.status(404).json({ error: "Booking tidak ditemukan." });
      }

      const booking = rows[0];
      if (booking.status === "cancelled") {
        return res.status(400).json({ error: "Booking sudah dibatalkan." });
      }
      if (booking.payment_status === "paid") {
        return res.status(400).json({ error: "Booking sudah lunas." });
      }

      const payload = {
        event: "payment.requested",
        data: {
          booking_id: booking.id,
          booking_code: booking.booking_code,
          amount: Number(booking.total_price || 0),
          currency: "IDR",
          external_ref: `PAY-${booking.booking_code}-${Date.now()}`,
        },
      };

      const rawPayload = JSON.stringify(payload);
      const signature = crypto
        .createHmac("sha256", PAYMENT_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest("hex");

      return res.json({
        message: "Payment intent mock berhasil dibuat.",
        payment_intent: payload,
        webhook_signature_example: signature,
      });
    },
  );
});

module.exports = router;
