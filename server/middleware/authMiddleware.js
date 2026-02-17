const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "BOSS_SECRET_KEY_123";

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token tidak valid atau expired." });
  }
};

const requireAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (!role || (role !== "admin" && role !== "super_admin")) {
    return res.status(403).json({ error: "Akses admin dibutuhkan." });
  }
  return next();
};

module.exports = {
  requireAuth,
  requireAdmin,
};
