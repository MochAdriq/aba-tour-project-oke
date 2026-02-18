const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const db = require("../config/db");

const productSchemaPatchQueries = [
  "ALTER TABLE products ADD COLUMN hotel_images TEXT NULL",
  "ALTER TABLE products ADD COLUMN image_urls TEXT NULL",
  "ALTER TABLE products ADD COLUMN hotel_makkah_images TEXT NULL",
  "ALTER TABLE products ADD COLUMN hotel_madinah_images TEXT NULL",
  "ALTER TABLE products MODIFY COLUMN category ENUM('umroh','haji','umroh_plus','tour') NOT NULL DEFAULT 'umroh'",
];

productSchemaPatchQueries.forEach((query) => {
  db.query(query, (err) => {
    if (err && err.code !== "ER_DUP_FIELDNAME") {
      console.error("Product schema patch error:", err.message);
    }
  });
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
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Hanya file gambar yang diizinkan."));
    }
    return cb(null, true);
  },
});

const uploadProductMedia = upload.fields([
  { name: "image", maxCount: 1 }, // legacy field
  { name: "images", maxCount: 12 },
  { name: "hotel_images", maxCount: 12 }, // legacy field
  { name: "hotel_makkah_images", maxCount: 12 },
  { name: "hotel_madinah_images", maxCount: 12 },
]);

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

router.post(
  "/editor-image",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "File gambar wajib diupload." });
    }
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    return res.json({
      message: "Upload gambar editor berhasil.",
      filename: req.file.filename,
      imageUrl,
    });
  },
);

// --- 4. POST (TAMBAH PRODUK BARU - UPDATED) ---
router.post("/", requireAuth, requireAdmin, uploadProductMedia, (req, res) => {
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

    const mainImageFiles = [
      ...(req.files?.images || []),
      ...(req.files?.image || []),
    ];
    const mainImages = mainImageFiles.map((file) => file.filename);
    const image_url = mainImages[0] || null;
    const imageUrlsJson = JSON.stringify(mainImages);

    const makkahImageFiles = req.files?.hotel_makkah_images || [];
    const madinahImageFiles = req.files?.hotel_madinah_images || [];
    const legacyHotelImageFiles = req.files?.hotel_images || [];

    const makkahImages = makkahImageFiles.map((file) => file.filename);
    const madinahImages = madinahImageFiles.map((file) => file.filename);
    const combinedHotelImages = [
      ...makkahImages,
      ...madinahImages,
      ...legacyHotelImageFiles.map((file) => file.filename),
    ];

    const hotelImagesJson = JSON.stringify(combinedHotelImages);
    const hotelMakkahImagesJson = JSON.stringify(makkahImages);
    const hotelMadinahImagesJson = JSON.stringify(madinahImages);

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
    (title, slug, summary, category, price, price_quad, price_triple, price_double, duration, departure_date, closing_date, airline, quota, product_status, hotel_makkah, hotel_madinah, hotel_images, hotel_makkah_images, hotel_madinah_images, description, included, excluded, itinerary, image_url, image_urls) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
      hotelImagesJson,
      hotelMakkahImagesJson,
      hotelMadinahImagesJson,
      description,
      included,
      excluded,
      itinerary,
      image_url,
      imageUrlsJson,
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
  uploadProductMedia,
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
      hotel_images_existing,
      image_urls_existing,
      hotel_makkah_images_existing,
      hotel_madinah_images_existing,
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
  const mainImageFiles = [
    ...(req.files?.images || []),
    ...(req.files?.image || []),
  ];
  const newHotelImageFiles = req.files?.hotel_images || [];
  const newHotelMakkahImageFiles = req.files?.hotel_makkah_images || [];
  const newHotelMadinahImageFiles = req.files?.hotel_madinah_images || [];

  const existingMainImages = (() => {
    if (!image_urls_existing) return [];
    try {
      const parsed = JSON.parse(image_urls_existing);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const existingHotelImages = (() => {
    if (!hotel_images_existing) return [];
    try {
      const parsed = JSON.parse(hotel_images_existing);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const existingHotelMakkahImages = (() => {
    if (!hotel_makkah_images_existing) return [];
    try {
      const parsed = JSON.parse(hotel_makkah_images_existing);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const existingHotelMadinahImages = (() => {
    if (!hotel_madinah_images_existing) return [];
    try {
      const parsed = JSON.parse(hotel_madinah_images_existing);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const newMainImages = mainImageFiles.map((file) => file.filename);
  const mergedMainImages = [...new Set([...existingMainImages, ...newMainImages])];

  const newHotelImages = newHotelImageFiles.map((file) => file.filename);
  const newHotelMakkahImages = newHotelMakkahImageFiles.map((file) => file.filename);
  const newHotelMadinahImages = newHotelMadinahImageFiles.map((file) => file.filename);

  const mergedHotelMakkahImages = [
    ...new Set([...existingHotelMakkahImages, ...newHotelMakkahImages]),
  ];
  const mergedHotelMadinahImages = [
    ...new Set([...existingHotelMadinahImages, ...newHotelMadinahImages]),
  ];
  const mergedHotelImages = [
    ...new Set([
      ...existingHotelImages,
      ...newHotelImages,
      ...mergedHotelMakkahImages,
      ...mergedHotelMadinahImages,
    ]),
  ];

  const imageUrlForMain = mergedMainImages[0] || null;
  const imageUrlsJson = JSON.stringify(mergedMainImages);
  const hotelImagesJson = JSON.stringify(mergedHotelImages);
  const hotelMakkahImagesJson = JSON.stringify(mergedHotelMakkahImages);
  const hotelMadinahImagesJson = JSON.stringify(mergedHotelMadinahImages);

  let sql;
  let values;

  if (mainImageFiles.length > 0) {
    // Update dengan perubahan gambar utama
    sql = `UPDATE products SET 
           title=?, slug=?, summary=?, category=?, price=?, 
           price_quad=?, price_triple=?, price_double=?, 
           duration=?, departure_date=?, closing_date=?, airline=?, quota=?, product_status=?, 
           hotel_makkah=?, hotel_madinah=?, hotel_images=?, hotel_makkah_images=?, hotel_madinah_images=?, description=?, itinerary=?, 
           included=?, excluded=?, image_url=? 
           , image_urls=? WHERE id=?`;

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
      hotelImagesJson,
      hotelMakkahImagesJson,
      hotelMadinahImagesJson,
      description,
      itinerary,
      included,
      excluded,
      imageUrlForMain,
      imageUrlsJson,
      id,
    ];
  } else {
    // Update tanpa ganti gambar
    sql = `UPDATE products SET 
           title=?, slug=?, summary=?, category=?, price=?, 
           price_quad=?, price_triple=?, price_double=?, 
           duration=?, departure_date=?, closing_date=?, airline=?, quota=?, product_status=?, 
           hotel_makkah=?, hotel_madinah=?, hotel_images=?, hotel_makkah_images=?, hotel_madinah_images=?, description=?, itinerary=?, 
           included=?, excluded=? 
           , image_url=?, image_urls=? WHERE id=?`;

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
      hotelImagesJson,
      hotelMakkahImagesJson,
      hotelMadinahImagesJson,
      description,
      itinerary,
      included,
      excluded,
      imageUrlForMain,
      imageUrlsJson,
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

