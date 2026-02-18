const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

const db = require("../config/db");

router.get("/summary", requireAuth, requireAdmin, (req, res) => {
  const bookingStatsSql = `
    SELECT
      status,
      COUNT(*) AS booking_count,
      COALESCE(SUM(total_pax), 0) AS pax_count,
      COALESCE(SUM(total_price), 0) AS total_value
    FROM bookings
    GROUP BY status
  `;

  const categoryStatsSql = `
    SELECT category, COUNT(*) AS total_products
    FROM products
    GROUP BY category
  `;

  const paymentStatsSql = `
    SELECT payment_status, COUNT(*) AS total_bookings
    FROM bookings
    GROUP BY payment_status
  `;

  const quotaDetailsSql = `
    SELECT
      id,
      title,
      category,
      quota,
      product_status,
      departure_date,
      closing_date
    FROM products
    ORDER BY departure_date ASC, id DESC
    LIMIT 100
  `;

  db.query(bookingStatsSql, (bookingErr, bookingRows) => {
    if (bookingErr) {
      console.error("Dashboard booking stats error:", bookingErr.message);
      return res.status(500).json({ error: "Gagal memuat ringkasan dashboard." });
    }

    db.query(categoryStatsSql, (categoryErr, categoryRows) => {
      if (categoryErr) {
        console.error("Dashboard category stats error:", categoryErr.message);
        return res
          .status(500)
          .json({ error: "Gagal memuat ringkasan dashboard." });
      }

      db.query(paymentStatsSql, (paymentErr, paymentRows) => {
        if (paymentErr) {
          console.error("Dashboard payment stats error:", paymentErr.message);
          return res
            .status(500)
            .json({ error: "Gagal memuat ringkasan dashboard." });
        }

        db.query(quotaDetailsSql, (quotaErr, quotaRows) => {
          if (quotaErr) {
            console.error("Dashboard quota details error:", quotaErr.message);
            return res
              .status(500)
              .json({ error: "Gagal memuat ringkasan dashboard." });
          }

          const bookingMap = {
            pending: { booking_count: 0, pax_count: 0, total_value: 0 },
            confirmed: { booking_count: 0, pax_count: 0, total_value: 0 },
            paid: { booking_count: 0, pax_count: 0, total_value: 0 },
            cancelled: { booking_count: 0, pax_count: 0, total_value: 0 },
          };

          bookingRows.forEach((row) => {
            if (bookingMap[row.status]) {
              bookingMap[row.status] = {
                booking_count: Number(row.booking_count || 0),
                pax_count: Number(row.pax_count || 0),
                total_value: Number(row.total_value || 0),
              };
            }
          });

          const categoryMap = {};
          categoryRows.forEach((row) => {
            categoryMap[row.category] = Number(row.total_products || 0);
          });

          const paymentMap = {
            unpaid: 0,
            paid: 0,
            failed: 0,
            refunded: 0,
          };
          paymentRows.forEach((row) => {
            if (paymentMap[row.payment_status] !== undefined) {
              paymentMap[row.payment_status] = Number(row.total_bookings || 0);
            }
          });

          const totals = {
            total_bookings:
              bookingMap.pending.booking_count +
              bookingMap.confirmed.booking_count +
              bookingMap.paid.booking_count +
              bookingMap.cancelled.booking_count,
            total_pax_all:
              bookingMap.pending.pax_count +
              bookingMap.confirmed.pax_count +
              bookingMap.paid.pax_count +
              bookingMap.cancelled.pax_count,
            total_revenue_paid_confirmed:
              bookingMap.confirmed.total_value + bookingMap.paid.total_value,
            total_products: quotaRows.length,
            low_quota_products: quotaRows.filter(
              (item) => Number(item.quota) <= 10,
            ).length,
          };

          res.json({
            booking_stats: bookingMap,
            payment_stats: paymentMap,
            product_category_stats: categoryMap,
            quota_details: quotaRows,
            totals,
          });
        });
      });
    });
  });
});

module.exports = router;

