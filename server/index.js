const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path"); // Tambahkan ini di paling atas

// Import Routes
const productRoutes = require("./routes/productRoutes");
const promoRoutes = require("./routes/promoRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 5000;

const allowedOrigins = (process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://localhost:5174,http://localhost:3000")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin tidak diizinkan oleh CORS."));
    },
    credentials: true,
  }),
);
app.use("/api/payments", paymentRoutes);
app.use(express.json({ limit: "200kb" }));

// Menggunakan Routes
app.use("/api/products", productRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API ABA Tour Aktif, Boss!");
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
