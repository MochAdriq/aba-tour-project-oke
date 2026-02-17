const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "db_aba_tour",
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, "promo-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// --- 1. GET ALL PROMOS (JOIN dengan Products untuk ambil Slug) ---
router.get("/", requireAuth, requireAdmin, (req, res) => {
  const sql = `
        SELECT promos.*, products.title as product_title, products.slug as product_slug 
        FROM promos 
        LEFT JOIN products ON promos.product_id = products.id 
        ORDER BY promos.created_at DESC
    `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// GET ACTIVE (Untuk Web Depan)
router.get("/active", (req, res) => {
  const sql = `
        SELECT promos.*, products.slug as product_slug 
        FROM promos 
        LEFT JOIN products ON promos.product_id = products.id 
        WHERE promos.is_active = 1 
        ORDER BY promos.created_at DESC LIMIT 1
    `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// POST (SIMPAN BENTO LAYOUT)
router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.single("hero_image"),
  (req, res) => {
  try {
    // 1. Cek data yang masuk di Terminal (Untuk Debugging)
    console.log("📥 Data Promo Masuk:", req.body);

    const { promo_name, wa_link, product_id, content_json } = req.body;
    const hero_image = req.file ? req.file.filename : null;

    if (!hero_image) {
      return res.status(400).json({ error: "Gambar Wajib Diupload!" });
    }

    // 2. PEMBERSIHAN DATA (CLEANING)

    // Fix product_id: Jika kosong "", ubah jadi NULL biar MySQL senang
    const cleanProductId =
      product_id === "" || product_id === "null" ? null : product_id;

    // Fix wa_link: Karena kolom ini NOT NULL di DB, kita isi string kosong jika undefined
    const cleanWaLink = wa_link || "";

    const sql = `INSERT INTO promos 
    (promo_name, hero_image, wa_link, product_id, content_json, is_active) 
    VALUES (?, ?, ?, ?, ?, 1)`;

    const values = [
      promo_name,
      hero_image,
      cleanWaLink, // Pakai yang sudah dibersihkan
      cleanProductId, // Pakai yang sudah dibersihkan
      content_json,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        // 3. TAMPILKAN ERROR ASLI MYSQL DI TERMINAL
        console.error("❌ SQL Error:", err.message);
        return res
          .status(500)
          .json({ error: "Database Error: " + err.message });
      }

      console.log("✅ Promo Berhasil Disimpan!");
      res.json({ message: "Promo Bento berhasil dibuat!" });
    });
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
  },
);

// PUT (UPDATE STATUS)
router.put("/:id/status", requireAuth, requireAdmin, (req, res) => {
  const { is_active } = req.body; // Menerima 1 atau 0
  const id = req.params.id;

  // SKENARIO 1: Boss mau MENGAKTIFKAN promo ini
  if (is_active == 1) {
    // Langkah A: Matikan DULU semua promo di database
    db.query("UPDATE promos SET is_active = 0", (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Gagal reset status" });
      }

      // Langkah B: Baru nyalakan promo yang dipilih
      db.query(
        "UPDATE promos SET is_active = 1 WHERE id = ?",
        [id],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal update status" });
          }
          res.json({ message: "Promo diaktifkan! Promo lain otomatis mati." });
        },
      );
    });
  }

  // SKENARIO 2: Boss mau MEMATIKAN promo ini
  else {
    db.query(
      "UPDATE promos SET is_active = 0 WHERE id = ?",
      [id],
      (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Promo dimatikan." });
      },
    );
  }
});

// DELETE
router.delete("/:id", requireAuth, requireAdmin, (req, res) => {
  db.query(
    "DELETE FROM promos WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Hapus berhasil" });
    },
  );
});

module.exports = router;
