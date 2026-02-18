const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "BOSS_SECRET_KEY_123";

// --- REGISTER ---
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')";
    db.query(sql, [username, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ error: "Email sudah terdaftar!" });
      res.json({ message: "Registrasi Berhasil!" });
    });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

// --- LOGIN ---
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, result) => {
    if (err || result.length === 0)
      return res.status(400).json({ error: "User tidak ditemukan!" });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ error: "Password salah!" });

    // Buat Token JWT
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login Berhasil",
      token,
      user: { username: user.username, role: user.role },
    });
  });
});

module.exports = router;

