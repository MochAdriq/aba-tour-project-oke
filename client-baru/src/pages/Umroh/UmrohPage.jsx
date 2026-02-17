import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Calendar, Plane } from "lucide-react";
import "./UmrohPage.css";

const FILTERS = {
  all: "Semua",
  nearest: "Berangkat Terdekat",
  cheap: "Harga Terendah",
  short: "Durasi Singkat",
};

const UmrohPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchParams] = useSearchParams();
  const selectedProgram = (searchParams.get("program") || "umroh").toLowerCase();
  const selectedMonth = searchParams.get("month") || "";
  const selectedPax = Number(searchParams.get("pax") || 0);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => {
        setProducts(res.data || []);
      })
      .catch((err) => {
        console.error("Gagal ambil paket umroh:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const baseProducts = useMemo(() => {
    if (selectedProgram === "all") return products;
    return products.filter(
      (item) => String(item.category || "").toLowerCase() === selectedProgram,
    );
  }, [products, selectedProgram]);

  const searchedProducts = useMemo(() => {
    return baseProducts.filter((item) => {
      const monthMatch = selectedMonth
        ? String(item.departure_date || "").slice(0, 7) === selectedMonth
        : true;
      const paxMatch = selectedPax > 0 ? Number(item.quota || 0) >= selectedPax : true;
      return monthMatch && paxMatch;
    });
  }, [baseProducts, selectedMonth, selectedPax]);

  const filteredProducts = useMemo(() => {
    const list = [...searchedProducts];
    if (activeFilter === "nearest") {
      return list.sort(
        (a, b) => new Date(a.departure_date) - new Date(b.departure_date),
      );
    }
    if (activeFilter === "cheap") {
      return list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }
    if (activeFilter === "short") {
      return list.sort(
        (a, b) => Number(a.duration || 0) - Number(b.duration || 0),
      );
    }
    return list;
  }, [activeFilter, searchedProducts]);

  return (
    <section className="section umroh-page">
      <div className="container">
        <div className="umroh-head">
          <small>Program Umroh</small>
          <h1>
            {selectedProgram === "all"
              ? "Semua Paket"
              : `Paket ${selectedProgram.charAt(0).toUpperCase()}${selectedProgram.slice(1)}`}
          </h1>
          <p>
            Jelajahi seluruh paket umroh dengan klasifikasi yang memudahkan
            perbandingan.
          </p>
        </div>

        <div className="umroh-filters">
          {Object.entries(FILTERS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`umroh-filter-btn ${activeFilter === key ? "active" : ""}`}
              onClick={() => setActiveFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="umroh-grid">
          {loading ? (
            <div className="umroh-empty">Memuat paket...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="umroh-empty">Belum ada paket umroh tersedia.</div>
          ) : (
            filteredProducts.map((item) => (
              <article className="umroh-card" key={item.id}>
                <div
                  className="umroh-thumb"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%), url('http://localhost:5000/uploads/${item.image_url}')`,
                  }}
                >
                  <span className="umroh-tag">UMROH</span>
                </div>
                <div className="umroh-body">
                  <h3>{item.title}</h3>
                  <div className="umroh-meta">
                    <span>
                      <Calendar size={15} />
                      {item.departure_date
                        ? new Date(item.departure_date).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "Tanggal belum tersedia"}
                    </span>
                    <span>
                      <Plane size={15} />
                      {item.airline || "Maskapai belum diisi"}
                    </span>
                  </div>
                  <div className="umroh-price-row">
                    <div>
                      <small>Mulai dari</small>
                      <strong>
                        Rp {Number(item.price || 0).toLocaleString("id-ID")}
                      </strong>
                    </div>
                    <Link to={`/product/${item.slug}`} className="umroh-link">
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

export default UmrohPage;
