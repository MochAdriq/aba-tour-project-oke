import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

// Import Components Public
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

// Import Pages Public
import Home from "./pages/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";

// Import System Dashboard
import PrivateRoute from "./components/PrivateRoute";
import DashboardLayout from "./layouts/DashboardLayout";

import ProductList from "./pages/ProductList/ProductList";
import AddProduct from "./pages/Dashboard/Products/AddProduct";
import EditProduct from "./pages/Dashboard/Products/EditProduct";

import PromoList from "./pages/Dashboard/Promos/PromoList"; // Import ini
import BookingList from "./pages/Dashboard/Bookings/BookingList";
import DashboardHome from "./pages/Dashboard/Home/DashboardHome";
import BankAccounts from "./pages/Dashboard/Payments/BankAccounts";
import HajiKhususForm from "./pages/Dashboard/HajiKhusus/HajiKhususForm";
import NewsList from "./pages/Dashboard/News/NewsList";
import AddNews from "./pages/Dashboard/News/AddNews";
import EditNews from "./pages/Dashboard/News/EditNews";

import ProductDetail from "./pages/ProductDetail/ProductDetail"; // Import ini
import AboutPage from "./pages/About/AboutPage";
import UmrohPage from "./pages/Umroh/UmrohPage";
import HajiKhususPage from "./pages/HajiKhusus/HajiKhususPage";
import PaymentProofPage from "./pages/Payment/PaymentProofPage";
import NewsGalleryPage from "./pages/News/NewsGalleryPage";
import NewsDetailPage from "./pages/News/NewsDetailPage";
import ContactPage from "./pages/Contact/ContactPage";

// --- LAYOUT PUBLIC (Navbar + Content + Footer) ---
const PublicLayout = () => (
  <>
    <Navbar />
    <main>
      <Outlet />
    </main>
    <Footer />
  </>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* === JALUR UMUM (Ada Navbar & Footer) === */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/umroh" element={<UmrohPage />} />
          <Route path="/haji-khusus" element={<HajiKhususPage />} />
          <Route path="/news" element={<NewsGalleryPage />} />
          <Route path="/news/:slug" element={<NewsDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/payment/:bookingCode" element={<PaymentProofPage />} />
          </Route>
        </Route>

        {/* === JALUR KHUSUS ADMIN (Dashboard) === */}
        {/* Cek dulu: Login gak? Kalau ya, pakai Layout Dashboard */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* Halaman Dashboard Utama */}
            <Route
              index
              element={<DashboardHome />}
            />

            {/* Nanti kita tambah route Produk & Promo di sini */}
            <Route path="products" element={<ProductList />} />
            <Route path="products/add" element={<AddProduct />} />
            <Route path="products/edit/:id" element={<EditProduct />} />
            <Route path="promos" element={<PromoList />} />
            <Route path="bookings" element={<BookingList />} />
            <Route path="banks" element={<BankAccounts />} />
            <Route path="haji-khusus" element={<HajiKhususForm />} />
            <Route path="news" element={<NewsList />} />
            <Route path="news/add" element={<AddNews />} />
            <Route path="news/edit/:id" element={<EditNews />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
// ini kenapalah

export default App;
