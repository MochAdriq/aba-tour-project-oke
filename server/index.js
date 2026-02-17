const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path"); // Tambahkan ini di paling atas

// Import Routes
const productRoutes = require("./routes/productRoutes");
const promoRoutes = require("./routes/promoRoutes");
const authRoutes = require("./routes/authRoutes");

dotenv.config();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Menggunakan Routes
app.use("/api/products", productRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API ABA Tour Aktif, Boss!");
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
