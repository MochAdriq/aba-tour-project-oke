const crypto = require("crypto");
const express = require("express");
const mysql = require("mysql2");

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
