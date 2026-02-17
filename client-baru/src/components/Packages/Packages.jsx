import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
// Import Lucide Icons
import { Plane, Calendar, ArrowRight } from "lucide-react";
import "./Packages.css";

const Packages = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. AMBIL DATA PRODUK ---
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal ambil produk:", err);
        setLoading(false);
      });
  }, []);

  // --- 2. LOGIKA FILTER ---
  const filteredProducts =
    activeTab === "all"
      ? products
      : products.filter((item) => item.category === activeTab);

  return (
    <section className="section">
      <div className="container">
        {/* HEADER */}
        <div className="packagesHead">
          <div>
            <small>ABA Packages</small>
            <h2>Pilih Paket Terbaik Anda</h2>
          </div>
          <Link to="/umroh" className="btnExplore">
            Lihat Semua Paket <ArrowRight size={16} />
          </Link>
        </div>

        {/* TABS */}
        <div className="tabs">
          <div
            className={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            Semua Paket
          </div>
          <div
            className={`tab ${activeTab === "umroh" ? "active" : ""}`}
            onClick={() => setActiveTab("umroh")}
          >
            Umroh
          </div>
          <div
            className={`tab ${activeTab === "tour" ? "active" : ""}`}
            onClick={() => setActiveTab("tour")}
          >
            Wisata Halal
          </div>
        </div>

        {/* GRID CARD */}
        <div className="cards">
          {loading ? (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "40px",
              }}
            >
              Memuat paket...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "40px",
                color: "#999",
              }}
            >
              Belum ada paket untuk kategori ini.
            </div>
          ) : (
            filteredProducts.map((item) => (
              <article className="card" key={item.id}>
                {/* GAMBAR */}
                <div
                  className="thumb"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%), url('http://localhost:5000/uploads/${item.image_url}')`,
                  }}
                >
                  <div className="tag">{item.category.toUpperCase()}</div>
                </div>

                <div className="cardBody">
                  {/* META INFO */}
                  <div className="meta">
                    <span className="dot"></span> {item.duration} Hari •{" "}
                    {item.hotel_makkah || "Hotel Bintang 4"}
                  </div>

                  {/* JUDUL */}
                  <h3 className="cardTitle">{item.title}</h3>

                  {/* FASILITAS SINGKAT (Updated to Lucide) */}
                  <ul
                    className="list"
                    style={{ marginTop: "12px", marginBottom: "auto" }}
                  >
                    <li>
                      <Plane size={16} color="#166534" />
                      {item.airline || "Maskapai Premium"}
                    </li>
                    <li>
                      <Calendar size={16} color="#166534" />
                      {new Date(item.departure_date).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </li>
                  </ul>

                  {/* HARGA & TOMBOL */}
                  <div className="priceRow">
                    <div>
                      <div className="from">Mulai dari</div>
                      <div className="price">
                        Rp {Number(item.price).toLocaleString("id-ID")}
                      </div>
                    </div>

                    {/* Link dengan Icon Panah */}
                    <Link to={`/product/${item.slug}`} className="btnDetails">
                      Lihat Detail <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Packages;
