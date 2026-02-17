import React from "react";
import "./Hero.css";

// Import Video (Sudah benar)
import heroVideo from "../../assets/videos/hero-bg.mp4";

// 1. IMPORT SEARCH BAR
import SearchBar from "../SearchBar/SearchBar";

const Hero = () => {
  return (
    <section className="heroWrap">
      <div className="container">
        {/* BAGIAN ATAS: GRID TEKS & VIDEO */}
        <div className="hero">
          {/* --- KIRI: TEXT & ACTION --- */}
          <div className="heroLeft">
            <div className="kicker">
              <span className="dot"></span> Aman • Nyaman • Terpercaya
            </div>

            <h1>
              Melayani Jama’ah
              <br />
              Dari Pintu Rumah
              <br />
              Hingga Pintu
              <br />
              Ka’bah
            </h1>

            <p className="sub">
              Mendampingi setiap langkah ibadah jama’ah, dari rumah hingga tiba
              di hadapan Ka’bah, dengan pelayanan penuh amanah, kenyamanan, dan
              ketulusan.
            </p>

            <div className="heroActions">
              <button className="btn btn--gold">CARI PAKET UMROH</button>
              <button className="btn btn--ghost">Lihat Itinerary</button>
            </div>
          </div>

          {/* --- KANAN: VIDEO --- */}
          <aside className="heroRight">
            <div className="heroMedia">
              {/* Video Player */}
              <video
                autoPlay
                muted
                loop
                playsInline
                src={heroVideo}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              ></video>

              {/* Note: Div "VIDEO AREA" saya hapus agar tidak menutupi video aslinya */}

              <div className="badgeCorner">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2 3 6v6c0 5 3.8 9.8 9 10 5.2-.2 9-5 9-10V6l-9-4Zm0 6.2 4.6 4.6-1.4 1.4L12 11l-3.2 3.2-1.4-1.4L12 8.2Z" />
                </svg>
                A Sight to Remember
              </div>
            </div>
          </aside>
        </div>

        {/* 2. PENEMPATAN SEARCH BAR (Full Width di bawah Grid Hero) */}
        <SearchBar />
      </div>
    </section>
  );
};

export default Hero;
