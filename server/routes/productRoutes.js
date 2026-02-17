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

// Konfigurasi Upload Gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// --- 1. GET ALL PRODUCTS ---
router.get("/", (req, res) => {
  const sql = "SELECT * FROM products ORDER BY created_at DESC";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// --- 2. GET SINGLE PRODUCT BY ID ---
router.get("/:id", requireAuth, requireAdmin, (req, res) => {
  const sql = "SELECT * FROM products WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0)
      return res.status(404).json({ error: "Not found" });
    res.json(result[0]);
  });
});

// --- 3. GET PRODUCT BY SLUG (Untuk Website Depan) ---
router.get("/slug/:slug", (req, res) => {
  const { slug } = req.params;
  const sql = "SELECT * FROM products WHERE slug = ?";
  db.query(sql, [slug], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ error: "Paket tidak ditemukan" });
    res.json(result[0]);
  });
});

// --- 4. POST (TAMBAH PRODUK BARU - UPDATED) ---
router.post("/", requireAuth, requireAdmin, upload.single("image"), (req, res) => {
  try {
    const {
      title,
      summary,
      category,
      price_quad,
      price_triple,
      price_double,
      duration,
      departure_date,
      closing_date,
      airline,
      quota,
      product_status,
      hotel_makkah,
      hotel_madinah,
      description,
      included,
      excluded,
      itinerary,
    } = req.body;

    const image_url = req.file ? req.file.filename : null;

    // Buat Slug
    const slug = title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");

    // Logic: Harga Display (Utama) diambil dari Harga Quad
    const displayPrice = price_quad || 0;

    // Bersihkan Tanggal (Hindari error date '0000-00-00' atau empty string)
    const cleanDeparture = departure_date || null;
    const cleanClosing = closing_date || null;

    const sql = `INSERT INTO products 
    (title, slug, summary, category, price, price_quad, price_triple, price_double, duration, departure_date, closing_date, airline, quota, product_status, hotel_makkah, hotel_madinah, description, included, excluded, itinerary, image_url) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      title,
      slug,
      summary,
      category,
      displayPrice, // Masuk ke kolom 'price'
      price_quad,
      price_triple,
      price_double,
      duration,
      cleanDeparture,
      cleanClosing,
      airline,
      quota,
      product_status,
      hotel_makkah,
      hotel_madinah,
      description,
      included,
      excluded,
      itinerary,
      image_url,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("SQL Error:", err.message); // Cek Terminal jika error 500
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Paket berhasil dibuat!" });
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

// --- 5. PUT (UPDATE PRODUK - UPDATED) ---
router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  (req, res) => {
  const { id } = req.params;
  const {
    title,
    summary,
    category,
    price_quad,
    price_triple,
    price_double,
    duration,
    departure_date,
    closing_date,
    airline,
    quota,
    product_status,
    hotel_makkah,
    hotel_madinah,
    description,
    included,
    excluded,
    itinerary,
  } = req.body;

  const slug = title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
  const displayPrice = price_quad || 0;

  const cleanDeparture =
    departure_date === "" || departure_date === "null" ? null : departure_date;
  const cleanClosing =
    closing_date === "" || closing_date === "null" ? null : closing_date;

  let sql;
  let values;

  if (req.file) {
    // Update dengan gambar baru
    sql = `UPDATE products SET 
           title=?, slug=?, summary=?, category=?, price=?, 
           price_quad=?, price_triple=?, price_double=?, 
           duration=?, departure_date=?, closing_date=?, airline=?, quota=?, product_status=?, 
           hotel_makkah=?, hotel_madinah=?, description=?, itinerary=?, 
           included=?, excluded=?, image_url=? 
           WHERE id=?`;

    values = [
      title,
      slug,
      summary,
      category,
      displayPrice,
      price_quad,
      price_triple,
      price_double,
      duration,
      cleanDeparture,
      cleanClosing,
      airline,
      quota,
      product_status,
      hotel_makkah,
      hotel_madinah,
      description,
      itinerary,
      included,
      excluded,
      req.file.filename,
      id,
    ];
  } else {
    // Update tanpa ganti gambar
    sql = `UPDATE products SET 
           title=?, slug=?, summary=?, category=?, price=?, 
           price_quad=?, price_triple=?, price_double=?, 
           duration=?, departure_date=?, closing_date=?, airline=?, quota=?, product_status=?, 
           hotel_makkah=?, hotel_madinah=?, description=?, itinerary=?, 
           included=?, excluded=? 
           WHERE id=?`;

    values = [
      title,
      slug,
      summary,
      category,
      displayPrice,
      price_quad,
      price_triple,
      price_double,
      duration,
      cleanDeparture,
      cleanClosing,
      airline,
      quota,
      product_status,
      hotel_makkah,
      hotel_madinah,
      description,
      itinerary,
      included,
      excluded,
      id,
    ];
  }

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("SQL Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Paket berhasil diperbarui!" });
  });
  },
);

// --- 6. DELETE PRODUCT ---
router.delete("/:id", requireAuth, requireAdmin, (req, res) => {
  const sql = "DELETE FROM products WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Deleted successfully" });
  });
});

module.exports = router;
