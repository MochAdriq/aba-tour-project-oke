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

db.query(
  `CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT NULL,
    content LONGTEXT NOT NULL,
    media_type ENUM('image','video') NOT NULL DEFAULT 'image',
    cover_image VARCHAR(255) NULL,
    gallery_images TEXT NULL,
    video_url VARCHAR(255) NULL,
    created_by VARCHAR(120) NULL,
    published_at DATETIME NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  (err) => {
    if (err) console.error("News schema init error:", err.message);
  },
);

const newsSchemaPatchQueries = [
  "ALTER TABLE news ADD COLUMN media_type ENUM('image','video') NOT NULL DEFAULT 'image'",
  "ALTER TABLE news ADD COLUMN gallery_images TEXT NULL",
  "ALTER TABLE news ADD COLUMN video_url VARCHAR(255) NULL",
  "ALTER TABLE news ADD COLUMN created_by VARCHAR(120) NULL",
];

newsSchemaPatchQueries.forEach((query) => {
  db.query(query, (err) => {
    if (err && err.code !== "ER_DUP_FIELDNAME") {
      console.error("News schema patch error:", err.message);
    }
  });
});

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

const uploadEditorImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Hanya file gambar yang diizinkan."));
    }
    return cb(null, true);
  },
});

const uploadNewsMedia = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("File gambar tidak valid."));
    }
    return cb(null, true);
  },
}).fields([
  { name: "cover_image", maxCount: 1 },
  { name: "gallery_images", maxCount: 20 },
]);

const parseJsonArray = (value) => {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeVideoEmbedUrl = (rawUrl = "") => {
  const text = String(rawUrl || "").trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : text;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : text;
      }
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : text;
      }
      if (url.pathname.startsWith("/embed/")) {
        return text;
      }
    }

    return text;
  } catch {
    return text;
  }
};

const normalizeSlug = (title = "") =>
  title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const ensureUniqueSlug = (baseSlug, excludeId = null) =>
  new Promise((resolve, reject) => {
    const rawSlug = baseSlug || `news-${Date.now()}`;
    let candidate = rawSlug;
    let seq = 1;

    const checkNext = () => {
      const sql = excludeId
        ? "SELECT id FROM news WHERE slug = ? AND id <> ? LIMIT 1"
        : "SELECT id FROM news WHERE slug = ? LIMIT 1";
      const values = excludeId ? [candidate, excludeId] : [candidate];
      db.query(sql, values, (err, rows) => {
        if (err) return reject(err);
        if (!rows.length) return resolve(candidate);
        candidate = `${rawSlug}-${seq}`;
        seq += 1;
        return checkNext();
      });
    };

    checkNext();
  });

const buildMediaByType = ({
  mediaType,
  uploadedCover,
  uploadedGallery,
  videoEmbedUrl,
  existingCover = "",
  existingGallery = [],
  existingVideoUrl = "",
}) => {
  if (mediaType === "video") {
    return {
      coverImage: null,
      galleryImages: [],
      videoUrl: videoEmbedUrl || existingVideoUrl || null,
    };
  }
  return {
    coverImage: uploadedCover || existingCover || null,
    galleryImages: [...new Set([...(existingGallery || []), ...(uploadedGallery || [])])],
    videoUrl: null,
  };
};

router.get("/", (req, res) => {
  const sql = `SELECT id, title, slug, excerpt, content, media_type, cover_image, gallery_images, video_url, created_by, published_at, created_at, updated_at
               FROM news
               WHERE is_published = 1
               ORDER BY COALESCE(published_at, created_at) DESC`;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json(rows);
  });
});

router.get("/admin", requireAuth, requireAdmin, (req, res) => {
  const sql = `SELECT id, title, slug, excerpt, media_type, cover_image, gallery_images, video_url, created_by, is_published, published_at, created_at, updated_at
               FROM news
               ORDER BY created_at DESC`;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json(rows);
  });
});

router.get("/admin/:id", requireAuth, requireAdmin, (req, res) => {
  const sql = "SELECT * FROM news WHERE id = ? LIMIT 1";
  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length)
      return res.status(404).json({ error: "News & Gallery tidak ditemukan." });
    return res.json(rows[0]);
  });
});

router.post(
  "/editor-image",
  requireAuth,
  requireAdmin,
  uploadEditorImage.single("image"),
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

router.post("/admin", requireAuth, requireAdmin, uploadNewsMedia, async (req, res) => {
  try {
    const {
      title,
      excerpt = "",
      content = "",
      media_type = "image",
      video_embed_url = "",
      published_at = null,
      is_published = 1,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Judul wajib diisi." });
    }
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: "Konten wajib diisi." });
    }

    const mediaType = media_type === "video" ? "video" : "image";
    const uploadedCover = req.files?.cover_image?.[0]?.filename || "";
    const uploadedGallery = (req.files?.gallery_images || []).map(
      (file) => file.filename,
    );
    const videoEmbedUrl = normalizeVideoEmbedUrl(video_embed_url);

    if (mediaType === "video" && !videoEmbedUrl) {
      return res.status(400).json({ error: "Media video dipilih, link embed video wajib diisi." });
    }
    if (mediaType === "video" && videoEmbedUrl && !/^https?:\/\//i.test(videoEmbedUrl)) {
      return res.status(400).json({ error: "Link embed video harus diawali http:// atau https://." });
    }
    if (mediaType === "image" && !uploadedCover && uploadedGallery.length === 0) {
      return res.status(400).json({ error: "Media foto dipilih, upload cover atau galeri foto." });
    }

    const slug = await ensureUniqueSlug(normalizeSlug(title));
    const media = buildMediaByType({
      mediaType,
      uploadedCover,
      uploadedGallery,
      videoEmbedUrl,
    });

    const sql = `INSERT INTO news
      (title, slug, excerpt, content, media_type, cover_image, gallery_images, video_url, created_by, published_at, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      String(title).trim(),
      slug,
      excerpt,
      content,
      mediaType,
      media.coverImage,
      JSON.stringify(media.galleryImages),
      media.videoUrl,
      req.user?.username || "Admin ABA Tour",
      published_at || null,
      Number(is_published) ? 1 : 0,
    ];

    db.query(sql, values, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ message: "News & Gallery berhasil ditambahkan." });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put(
  "/admin/:id",
  requireAuth,
  requireAdmin,
  uploadNewsMedia,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        excerpt = "",
        content = "",
        media_type = "image",
        video_embed_url = "",
        published_at = null,
        is_published = 1,
        cover_image_existing = "",
        gallery_images_existing = "[]",
        video_url_existing = "",
      } = req.body;

      if (!title || !String(title).trim()) {
        return res.status(400).json({ error: "Judul wajib diisi." });
      }
      if (!content || !String(content).trim()) {
        return res.status(400).json({ error: "Konten wajib diisi." });
      }

      const mediaType = media_type === "video" ? "video" : "image";
      const existingGalleryImages = parseJsonArray(gallery_images_existing);
      const uploadedCover = req.files?.cover_image?.[0]?.filename || "";
      const uploadedGallery = (req.files?.gallery_images || []).map(
        (file) => file.filename,
      );
      const videoEmbedUrl = normalizeVideoEmbedUrl(video_embed_url);
      const existingVideoUrl = normalizeVideoEmbedUrl(video_url_existing);

      if (mediaType === "video" && !videoEmbedUrl && !existingVideoUrl) {
        return res.status(400).json({ error: "Media video dipilih, link embed video wajib tersedia." });
      }
      if (mediaType === "video" && videoEmbedUrl && !/^https?:\/\//i.test(videoEmbedUrl)) {
        return res.status(400).json({ error: "Link embed video harus diawali http:// atau https://." });
      }
      if (
        mediaType === "image" &&
        !uploadedCover &&
        !cover_image_existing &&
        uploadedGallery.length === 0 &&
        existingGalleryImages.length === 0
      ) {
        return res.status(400).json({ error: "Media foto dipilih, upload cover atau galeri foto." });
      }

      const slug = await ensureUniqueSlug(normalizeSlug(title), id);
      const media = buildMediaByType({
        mediaType,
        uploadedCover,
        uploadedGallery,
        videoEmbedUrl,
        existingCover: cover_image_existing,
        existingGallery: existingGalleryImages,
        existingVideoUrl,
      });

      const sql = `UPDATE news SET
        title = ?,
        slug = ?,
        excerpt = ?,
        content = ?,
        media_type = ?,
        cover_image = ?,
        gallery_images = ?,
        video_url = ?,
        created_by = ?,
        published_at = ?,
        is_published = ?
        WHERE id = ?`;
      const values = [
        String(title).trim(),
        slug,
        excerpt,
        content,
        mediaType,
        media.coverImage,
        JSON.stringify(media.galleryImages),
        media.videoUrl,
        req.user?.username || "Admin ABA Tour",
        published_at || null,
        Number(is_published) ? 1 : 0,
        id,
      ];

      db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result.affectedRows) {
          return res.status(404).json({ error: "News & Gallery tidak ditemukan." });
        }
        return res.json({ message: "News & Gallery berhasil diperbarui." });
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
);

router.delete("/admin/:id", requireAuth, requireAdmin, (req, res) => {
  const sql = "DELETE FROM news WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) {
      return res.status(404).json({ error: "News & Gallery tidak ditemukan." });
    }
    return res.json({ message: "News & Gallery berhasil dihapus." });
  });
});

router.get("/:slug", (req, res) => {
  const sql = `SELECT id, title, slug, excerpt, content, media_type, cover_image, gallery_images, video_url, created_by, published_at, created_at, updated_at
               FROM news
               WHERE slug = ? AND is_published = 1
               LIMIT 1`;
  db.query(sql, [req.params.slug], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length)
      return res.status(404).json({ error: "News & Gallery tidak ditemukan." });
    return res.json(rows[0]);
  });
});

module.exports = router;
