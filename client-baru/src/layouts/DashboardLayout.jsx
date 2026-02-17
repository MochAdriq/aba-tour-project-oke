import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
// Import Icon Lucide
import {
  LayoutDashboard,
  Package,
  Megaphone,
  ClipboardList,
  Landmark,
  Shield,
  Newspaper,
  Globe,
  LogOut,
  Command,
  Menu,
  X,
} from "lucide-react";
import "./Dashboard.css";
import { useState } from "react";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const closeSidebar = () => setMobileSidebarOpen(false);

  // Fungsi helper class aktif
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
      ? "dash-link active"
      : "dash-link";

  return (
    <div className="dash-container">
      <button
        type="button"
        className="dash-menu-btn"
        onClick={() => setMobileSidebarOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {mobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileSidebarOpen && (
        <button
          type="button"
          className="dash-backdrop"
          aria-label="Close sidebar"
          onClick={closeSidebar}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`dash-sidebar ${mobileSidebarOpen ? "open" : ""}`}>
        <div className="dash-brand">
          <Command size={24} color="#c9a227" /> {/* Icon Brand Emas */}
          <span>ABA ADMIN</span>
        </div>

        <nav className="dash-nav">
          <Link to="/dashboard" className={isActive("/dashboard")} onClick={closeSidebar}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/dashboard/products"
            className={isActive("/dashboard/products")}
            onClick={closeSidebar}
          >
            <Package size={20} />
            <span>Paket Umroh</span>
          </Link>

          <Link
            to="/dashboard/promos"
            className={isActive("/dashboard/promos")}
            onClick={closeSidebar}
          >
            <Megaphone size={20} />
            <span>Promo Banner</span>
          </Link>

          <Link
            to="/dashboard/bookings"
            className={isActive("/dashboard/bookings")}
            onClick={closeSidebar}
          >
            <ClipboardList size={20} />
            <span>Booking</span>
          </Link>

          <Link
            to="/dashboard/banks"
            className={isActive("/dashboard/banks")}
            onClick={closeSidebar}
          >
            <Landmark size={20} />
            <span>Akun Bank</span>
          </Link>

          <Link
            to="/dashboard/haji-khusus"
            className={isActive("/dashboard/haji-khusus")}
            onClick={closeSidebar}
          >
            <Shield size={20} />
            <span>Haji Khusus</span>
          </Link>

          <Link
            to="/dashboard/news"
            className={isActive("/dashboard/news")}
            onClick={closeSidebar}
          >
            <Newspaper size={20} />
            <span>News & Gallery</span>
          </Link>

          <div
            style={{
              marginTop: "20px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "20px",
            }}
          >
            <Link to="/" className="dash-link" target="_blank" onClick={closeSidebar}>
              <Globe size={20} />
              <span>Lihat Website</span>
            </Link>
          </div>
        </nav>

        <button onClick={handleLogout} className="dash-logout">
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </aside>

      {/* --- CONTENT AREA --- */}
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
