import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./PromoSection.css";

const PromoSection = () => {
  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/promos/active");
        if (res.data.length > 0) {
          const data = res.data[0];
          // Parsing JSON content
          if (typeof data.content_json === "string") {
            try {
              data.content_json = JSON.parse(data.content_json);
            } catch {
              data.content_json = [];
            }
          }
          setPromo(data);
        }
      } catch (err) {
        console.error("Gagal ambil data promo:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromo();
  }, []);

  if (loading) return null;
  if (!promo) return null; // Jika tidak ada promo aktif, section hilang

  return (
    <section className="section">
      <div className="container">
        <div className="gridPromo">
          {/* --- KIRI: PROMO CARD (GAMBAR) --- */}
          <div className="promoCard">
            <img
              src={`http://localhost:5000/uploads/${promo.hero_image}`}
              alt={promo.promo_name}
            />
            {/* Tombol Link ke Produk */}
            <Link
              to={
                promo.product_slug ? `/product/${promo.product_slug}` : "/umroh"
              }
              className="btnBlock"
            >
              Pesan Paket Sekarang
            </Link>
          </div>

          {/* --- KANAN: BENTO STATS (DYNAMIC) --- */}
          <div className="statsWrap">
            {promo.content_json &&
              promo.content_json.map((block) => {
                // TIPE 1: KOTAK BESAR
                if (block.type === "big") {
                  return (
                    <div key={block.id} className="statBig">
                      <h3 className="statTitle">{block.data.title}</h3>
                      <div className="statSubtitle">{block.data.subtitle}</div>
                      <p className="statDesc">{block.data.desc}</p>
                    </div>
                  );
                }

                // TIPE 2: BARIS (2 KOLOM)
                else if (block.type === "row") {
                  return (
                    <div key={block.id} className="statRow">
                      {block.items.map((item, i) => (
                        <div key={i} className="statMini">
                          <h4 className="statTitleMini">{item.title}</h4>
                          <div className="statSubtitleMini">
                            {item.subtitle}
                          </div>
                          <p className="statDescMini">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
