import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import "./Navbar.css";
import logoAba from "../../assets/images/logo_aba_sukalarang.webp";

const Navbar = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowDropdown(false);
    closeMobileMenu();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="container">
        <div className="nav">
          <div className="brand">
            <Link to="/" onClick={closeMobileMenu}>
              <img src={logoAba} alt="ABA TOUR" />
            </Link>
          </div>

          <nav className="navlinks">
            <Link to="/">Beranda</Link>
            <Link to="/about">Tentang Kami</Link>
            <Link to="/umroh">Umroh</Link>
            <Link to="/haji-khusus">Haji Khusus</Link>
            <Link to="/news">News & Gallery</Link>
          </nav>

          <div className="navcta">
            {user ? (
              <div className="userDropdown">
                <button
                  className="dropdownToggle"
                  onClick={() => setShowDropdown((prev) => !prev)}
                >
                  Halo, {user.username}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "0.2s",
                    }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="dropdownMenu">
                    {(user.role === "super_admin" || user.role === "publisher") && (
                      <Link
                        to="/dashboard"
                        className="dropdownItem"
                        onClick={() => setShowDropdown(false)}
                      >
                        Dashboard Admin
                      </Link>
                    )}

                    <div
                      style={{ borderTop: "1px solid #eee", margin: "4px 0" }}
                    ></div>

                    <button onClick={handleLogout} className="dropdownItem logout">
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost">
                  Masuk
                </Link>
                <Link to="/register" className="btn btn--primary">
                  Daftar
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="mobileMenuBtn"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobileMenu">
            <div className="mobileLinks">
              <Link to="/" onClick={closeMobileMenu}>
                Beranda
              </Link>
              <Link to="/about" onClick={closeMobileMenu}>
                Tentang Kami
              </Link>
              <Link to="/umroh" onClick={closeMobileMenu}>
                Umroh
              </Link>
              <Link to="/haji-khusus" onClick={closeMobileMenu}>
                Haji Khusus
              </Link>
              <Link to="/news" onClick={closeMobileMenu}>
                News & Gallery
              </Link>
            </div>
            <div className="mobileAuth">
              {user ? (
                <>
                  {(user.role === "super_admin" || user.role === "publisher") && (
                    <Link
                      to="/dashboard"
                      className="btn btn--ghost"
                      onClick={closeMobileMenu}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={handleLogout}
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn--ghost"
                    onClick={closeMobileMenu}
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn--primary"
                    onClick={closeMobileMenu}
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
