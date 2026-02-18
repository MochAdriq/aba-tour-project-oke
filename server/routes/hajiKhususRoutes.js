const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

const db = require("../config/db");


db.query(
  `CREATE TABLE IF NOT EXISTS haji_khusus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary LONGTEXT NULL,
    price_quad BIGINT NOT NULL DEFAULT 0,
    price_triple BIGINT NOT NULL DEFAULT 0,
    price_double BIGINT NOT NULL DEFAULT 0,
    duration INT NOT NULL DEFAULT 1,
    departure_date DATE NULL,
    closing_date DATE NULL,
    airline VARCHAR(120) NULL,
    quota INT NOT NULL DEFAULT 0,
    product_status VARCHAR(20) NOT NULL DEFAULT 'open',
    hotel_makkah VARCHAR(255) NULL,
    hotel_madinah VARCHAR(255) NULL,
    hotel_images TEXT NULL,
    hotel_makkah_images TEXT NULL,
    hotel_madinah_images TEXT NULL,
    description LONGTEXT NULL,
    included LONGTEXT NULL,
    excluded LONGTEXT NULL,
    itinerary LONGTEXT NULL,
    image_url VARCHAR(255) NULL,
    image_urls TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  (err) => {
    if (err) console.error("Create haji_khusus table error:", err.message);
  },
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Hanya file gambar yang diizinkan."));
    }
    return cb(null, true);
  },
});

const uploadHajiMedia = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 12 },
  { name: "hotel_images", maxCount: 12 },
  { name: "hotel_makkah_images", maxCount: 12 },
  { name: "hotel_madinah_images", maxCount: 12 },
]);

const parseArrayField = (value) => {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};


router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM haji_khusus ORDER BY updated_at DESC LIMIT 1",
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Gagal memuat data haji khusus." });
      }
      if (!rows.length) {
        return res.status(404).json({ error: "Data haji khusus belum tersedia." });
      }
      return res.json(rows[0]);
    },
  );
});

router.get("/admin", requireAuth, requireAdmin, (req, res) => {
  db.query(
    "SELECT * FROM haji_khusus ORDER BY updated_at DESC LIMIT 1",
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Gagal memuat data haji khusus." });
      }
      return res.json({ item: rows[0] || null });
    },
  );
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

router.post("/admin", requireAuth, requireAdmin, uploadHajiMedia, (req, res) => {
  const {
    title,
    summary,
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
    image_urls_existing,
    hotel_images_existing,
    hotel_makkah_images_existing,
    hotel_madinah_images_existing,
  } = req.body;

  if (!String(title || "").trim()) {
    return res.status(400).json({ error: "Judul haji khusus wajib diisi." });
  }

  db.query(
    "SELECT id, image_urls, hotel_images, hotel_makkah_images, hotel_madinah_images FROM haji_khusus ORDER BY updated_at DESC LIMIT 1",
    (findErr, rows) => {
      if (findErr) {
        return res.status(500).json({ error: "Gagal menyimpan data haji khusus." });
      }

      const existing = rows[0] || null;
      const oldMainImages = parseArrayField(
        image_urls_existing || existing?.image_urls,
      );
      const oldHotelImages = parseArrayField(
        hotel_images_existing || existing?.hotel_images,
      );
      const oldHotelMakkahImages = parseArrayField(
        hotel_makkah_images_existing || existing?.hotel_makkah_images,
      );
      const oldHotelMadinahImages = parseArrayField(
        hotel_madinah_images_existing || existing?.hotel_madinah_images,
      );

      const mainImageFiles = [...(req.files?.images || []), ...(req.files?.image || [])];
      const newMainImages = mainImageFiles.map((file) => file.filename);
      const mergedMainImages = [...new Set([...oldMainImages, ...newMainImages])];

      const newLegacyHotelImages = (req.files?.hotel_images || []).map(
        (file) => file.filename,
      );
      const newHotelMakkahImages = (req.files?.hotel_makkah_images || []).map(
        (file) => file.filename,
      );
      const newHotelMadinahImages = (req.files?.hotel_madinah_images || []).map(
        (file) => file.filename,
      );

      const mergedHotelMakkahImages = [
        ...new Set([...oldHotelMakkahImages, ...newHotelMakkahImages]),
      ];
      const mergedHotelMadinahImages = [
        ...new Set([...oldHotelMadinahImages, ...newHotelMadinahImages]),
      ];
      const mergedHotelImages = [
        ...new Set([
          ...oldHotelImages,
          ...newLegacyHotelImages,
          ...mergedHotelMakkahImages,
          ...mergedHotelMadinahImages,
        ]),
      ];

      const values = [
        title,
        summary || null,
        Number(price_quad || 0),
        Number(price_triple || 0),
        Number(price_double || 0),
        Number(duration || 1),
        departure_date || null,
        closing_date || null,
        airline || null,
        Number(quota || 0),
        product_status || "open",
        hotel_makkah || null,
        hotel_madinah || null,
        JSON.stringify(mergedHotelImages),
        JSON.stringify(mergedHotelMakkahImages),
        JSON.stringify(mergedHotelMadinahImages),
        description || null,
        included || null,
        excluded || null,
        itinerary || null,
        mergedMainImages[0] || null,
        JSON.stringify(mergedMainImages),
      ];

      if (existing?.id) {
        db.query(
          `UPDATE haji_khusus SET
           title=?, summary=?, price_quad=?, price_triple=?, price_double=?,
           duration=?, departure_date=?, closing_date=?, airline=?, quota=?,
           product_status=?, hotel_makkah=?, hotel_madinah=?, hotel_images=?,
           hotel_makkah_images=?, hotel_madinah_images=?, description=?, included=?,
           excluded=?, itinerary=?, image_url=?, image_urls=?
           WHERE id=?`,
          [...values, existing.id],
          (updateErr) => {
            if (updateErr) {
              return res
                .status(500)
                .json({ error: "Gagal memperbarui data haji khusus." });
            }
            return res.json({
              message: "Data haji khusus berhasil diperbarui.",
              id: existing.id,
            });
          },
        );
        return;
      }

      db.query(
        `INSERT INTO haji_khusus
         (title, summary, price_quad, price_triple, price_double, duration, departure_date, closing_date, airline, quota, product_status, hotel_makkah, hotel_madinah, hotel_images, hotel_makkah_images, hotel_madinah_images, description, included, excluded, itinerary, image_url, image_urls)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values,
        (insertErr, insertRes) => {
          if (insertErr) {
            return res
              .status(500)
              .json({ error: "Gagal menyimpan data haji khusus." });
          }
          return res.status(201).json({
            message: "Data haji khusus berhasil dibuat.",
            id: insertRes.insertId,
          });
        },
      );
    },
  );
});

module.exports = router;

