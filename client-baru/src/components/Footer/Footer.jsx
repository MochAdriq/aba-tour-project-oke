import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

// 1. IMPORT LOGO YANG SAMA
// (Kita ambil dari folder assets yang sama)
import logoAba from "../../assets/images/logo_aba_sukalarang.webp";

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footerGrid">
          {/* KOLOM 1: BRAND & LOGO */}
          <div>
            {/* Tampilkan Logo di sini */}
            <img src={logoAba} alt="ABA TOUR Logo" className="footLogo" />

            <p className="footDesc">
              Melayani Jama’ah Dari Pintu Rumah Hingga Pintu Ka’bah. Platform
              layanan Umroh & Haji Khusus dengan standar pendampingan amanah dan
              profesional.
            </p>
          </div>

          {/* KOLOM 2: MENU */}
          <div>
            <p className="footTitle">Perusahaan</p>
            <div className="footLinks">
              <Link to="/about">Tentang Kami</Link>
              <Link to="/legal">Legalitas & Izin</Link>
              <Link to="/gallery">Galeri Jamaah</Link>
              <Link to="/contact">Hubungi Kami</Link>
            </div>
          </div>

          {/* KOLOM 3: DUKUNGAN */}
          <div>
            <p className="footTitle">Dukungan</p>
            <div className="footLinks">
              <Link to="/faq">Pusat Bantuan (FAQ)</Link>
              <Link to="/terms">Syarat & Ketentuan</Link>
              <Link to="/privacy">Kebijakan Privasi</Link>
              <a href="https://wa.me/+628567619000">Konsultasi via WhatsApp</a>
            </div>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="footBottom">
          <div>
            © Copyright 2026 • ABA TOUR Sukalarang. All rights reserved.
          </div>
          <div>Dibuat dengan ❤️ untuk Tamu Allah</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
