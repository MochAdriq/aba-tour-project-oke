import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
// Import Icon Lucide
import {
  Calendar,
  Plane,
  Clock,
  CheckCircle2,
  XCircle,
  Hotel,
  FileText,
  Map,
  Star,
  ChevronDown,
  ChevronUp,
  BedDouble,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "../ProductDetail/ProductDetail.css";

const HajiKhususPage = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- STATE ROOM COMPOSER (LOGIC BARU) ---
  const [roomQty, setRoomQty] = useState({
    quad: 0, // Jumlah jamaah yang memilih harga Quad
    triple: 0, // Jumlah jamaah yang memilih harga Triple
    double: 0, // Jumlah jamaah yang memilih harga Double
  });

  // State Accordion
  const [openDay, setOpenDay] = useState(0);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [activeHotelMakkahSlide, setActiveHotelMakkahSlide] = useState(0);
  const [activeHotelMadinahSlide, setActiveHotelMadinahSlide] = useState(0);
  const safeProgramDescription = useMemo(() => {
    const html = product?.summary || product?.description || "";
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
    });
  }, [product?.summary, product?.description]);
  const mainProductImages = useMemo(() => {
    if (!product) return [];
    if (product.image_urls) {
      try {
        const parsed =
          typeof product.image_urls === "string"
            ? JSON.parse(product.image_urls)
            : product.image_urls;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .map((name) => String(name || "").trim())
            .filter(Boolean)
            .map((name) => `http://localhost:5000/uploads/${name}`);
        }
      } catch {
        // fallback ke image_url
      }
    }
    return product.image_url
      ? [`http://localhost:5000/uploads/${product.image_url}`]
      : [];
  }, [product]);

  const hotelMakkahGalleryImages = useMemo(() => {
    if (!product?.hotel_makkah_images) return [];
    try {
      const parsed =
        typeof product.hotel_makkah_images === "string"
          ? JSON.parse(product.hotel_makkah_images)
          : product.hotel_makkah_images;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((name) => String(name || "").trim())
        .filter(Boolean)
        .map((name) => `http://localhost:5000/uploads/${name}`);
    } catch {
      return [];
    }
  }, [product?.hotel_makkah_images]);

  const hotelMadinahGalleryImages = useMemo(() => {
    if (!product?.hotel_madinah_images) return [];
    try {
      const parsed =
        typeof product.hotel_madinah_images === "string"
          ? JSON.parse(product.hotel_madinah_images)
          : product.hotel_madinah_images;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((name) => String(name || "").trim())
        .filter(Boolean)
        .map((name) => `http://localhost:5000/uploads/${name}`);
    } catch {
      return [];
    }
  }, [product?.hotel_madinah_images]);
  const heroGalleryImages = useMemo(() => {
    return mainProductImages;
  }, [mainProductImages]);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/haji-khusus");
        const data = res.data;

        // Parsing Itinerary JSON
        if (typeof data.itinerary === "string") {
          try {
            data.itinerary = JSON.parse(data.itinerary);
          } catch {
            data.itinerary = [];
          }
        }

        setProduct(data);
        // Default: Set 1 jamaah pada kategori Quad saat load pertama
        setRoomQty({ quad: 1, triple: 0, double: 0 });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, []);

  useEffect(() => {
    setActiveHotelMakkahSlide(0);
  }, [hotelMakkahGalleryImages.length]);

  useEffect(() => {
    setActiveHotelMadinahSlide(0);
  }, [hotelMadinahGalleryImages.length]);

  useEffect(() => {
    setActiveHeroSlide(0);
  }, [heroGalleryImages.length]);

  // --- 2. FUNGSI UPDATE QUANTITY ---
  const updateQty = (type, delta) => {
    setRoomQty((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta), // Mencegah minus
    }));
  };

  // --- 3. FUNGSI SCROLL ---
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // --- 4. KALKULASI TOTAL (LOGIC INTI) ---
  const totalPax = roomQty.quad + roomQty.triple + roomQty.double;
  const totalRooms =
    Math.ceil(roomQty.quad / 4) +
    Math.ceil(roomQty.triple / 3) +
    Math.ceil(roomQty.double / 2);

  const totalPrice =
    roomQty.quad * (product?.price_quad || 0) +
    roomQty.triple * (product?.price_triple || 0) +
    roomQty.double * (product?.price_double || 0);
  // --- 5. HANDLING BOOKING WA ---
  const handleWhatsApp = () => {
    const roomText = [];
    if (roomQty.quad > 0) {
      roomText.push(
        `- Quad: ${roomQty.quad} pax (Rp ${Number(product?.price_quad || 0).toLocaleString("id-ID")}/pax)`,
      );
    }
    if (roomQty.triple > 0) {
      roomText.push(
        `- Triple: ${roomQty.triple} pax (Rp ${Number(product?.price_triple || 0).toLocaleString("id-ID")}/pax)`,
      );
    }
    if (roomQty.double > 0) {
      roomText.push(
        `- Double: ${roomQty.double} pax (Rp ${Number(product?.price_double || 0).toLocaleString("id-ID")}/pax)`,
      );
    }

    const message = `Halo Admin ABA Tour, saya tertarik konsultasi paket: *${product.title}*.

*Detail Pilihan Pax:*
Total Jamaah: ${totalPax} orang
Estimasi Kamar: ${totalRooms} kamar
Estimasi Total Biaya: $ ${Number(totalPrice).toLocaleString("id-ID")}

Mohon info ketersediaan dan cara pembayarannya.`;

    const url = `https://wa.me/628567619000?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const nextHotelMakkahSlide = () => {
    if (!hotelMakkahGalleryImages.length) return;
    setActiveHotelMakkahSlide(
      (prev) => (prev + 1) % hotelMakkahGalleryImages.length,
    );
  };

  const prevHotelMakkahSlide = () => {
    if (!hotelMakkahGalleryImages.length) return;
    setActiveHotelMakkahSlide(
      (prev) =>
        (prev - 1 + hotelMakkahGalleryImages.length) %
        hotelMakkahGalleryImages.length,
    );
  };

  const nextHotelMadinahSlide = () => {
    if (!hotelMadinahGalleryImages.length) return;
    setActiveHotelMadinahSlide(
      (prev) => (prev + 1) % hotelMadinahGalleryImages.length,
    );
  };

  const prevHotelMadinahSlide = () => {
    if (!hotelMadinahGalleryImages.length) return;
    setActiveHotelMadinahSlide(
      (prev) =>
        (prev - 1 + hotelMadinahGalleryImages.length) %
        hotelMadinahGalleryImages.length,
    );
  };

  const nextHeroSlide = () => {
    if (!heroGalleryImages.length) return;
    setActiveHeroSlide((prev) => (prev + 1) % heroGalleryImages.length);
  };

  const prevHeroSlide = () => {
    if (!heroGalleryImages.length) return;
    setActiveHeroSlide(
      (prev) =>
        (prev - 1 + heroGalleryImages.length) % heroGalleryImages.length,
    );
  };

  // --- RENDER LOADING / ERROR ---
  if (loading)
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        Memuat Paket...
      </div>
    );
  if (!product)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        Paket Tidak Ditemukan
      </div>
    );

  return (
    <div className="detail-page">
      {/* --- HERO SECTION --- */}
      <div className="detail-hero">
        <img src={heroGalleryImages[activeHeroSlide]} alt={product.title} />
        {heroGalleryImages.length > 1 && (
          <>
            <button
              type="button"
              className="hero-nav hero-nav-left"
              onClick={prevHeroSlide}
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="hero-nav hero-nav-right"
              onClick={nextHeroSlide}
              aria-label="Foto berikutnya"
            >
              <ChevronRight size={20} />
            </button>
            <div className="hero-dots">
              {heroGalleryImages.map((_, index) => (
                <button
                  key={`hero-dot-${index}`}
                  type="button"
                  className={`hero-dot ${index === activeHeroSlide ? "active" : ""}`}
                  onClick={() => setActiveHeroSlide(index)}
                  aria-label={`Buka foto ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
        <div className="detail-hero-overlay">
          <div className="detail-container-inner">
            <span className="category-badge">HAJI KHUSUS</span>
            <h1 className="hero-title">{product.title}</h1>

            <div className="hero-meta">
              <div className="meta-item">
                <Calendar size={18} />
                <span>{"TBA"}</span>
              </div>
              <div className="meta-item">
                <Plane size={18} />
                <span>{product.airline || "Direct Flight"}</span>
              </div>
              <div className="meta-item">
                <Clock size={18} />
                <span>{product.duration} Hari</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="detail-container">
        {/* === KOLOM KIRI (KONTEN) === */}
        <div className="content-left">
          {/* Sticky Tabs */}
          <div className="sticky-tabs">
            <span
              className="tab-link"
              onClick={() => scrollToSection("ringkasan")}
            >
              Ringkasan
            </span>
            <span
              className="tab-link"
              onClick={() => scrollToSection("itinerary")}
            >
              Itinerary
            </span>
            <span
              className="tab-link"
              onClick={() => scrollToSection("fasilitas")}
            >
              Fasilitas
            </span>
            <span className="tab-link" onClick={() => scrollToSection("hotel")}>
              Hotel
            </span>
          </div>

          {/* 1. Ringkasan */}
          <div id="ringkasan" className="detail-card">
            <h3 className="section-title">
              <FileText size={20} className="icon-gold" /> Deskripsi Program
            </h3>
            <div
              className="text-desc text-desc-html"
              dangerouslySetInnerHTML={{ __html: safeProgramDescription }}
            />
          </div>

          {/* 2. Itinerary Accordion */}
          <div id="itinerary" className="detail-card">
            <h3 className="section-title">
              <Map size={20} className="icon-gold" /> Itinerary
            </h3>
            <div className="accordion-wrapper">
              {product.itinerary &&
                product.itinerary.map((day, index) => (
                  <div key={index} className="accordion-item">
                    <div
                      className="accordion-header"
                      onClick={() => setOpenDay(openDay === index ? -1 : index)}
                    >
                      <div className="accordion-left">
                        <span className="day-badge">Hari {day.day}</span>
                        <span className="day-title">{day.title}</span>
                      </div>
                      {openDay === index ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>

                    {openDay === index && (
                      <div className="accordion-body">{day.activity}</div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* 3. Fasilitas */}
          <div id="fasilitas" className="detail-card">
            <h3 className="section-title">
              <CheckCircle2 size={20} className="icon-gold" /> Fasilitas
              Termasuk
            </h3>
            <ul className="check-list">
              {product.included ? (
                product.included.split("\n").map((item, i) => (
                  <li key={i}>
                    <CheckCircle2 size={16} color="green" /> {item}
                  </li>
                ))
              ) : (
                <li>Tidak ada data included.</li>
              )}
            </ul>

            <h3 className="section-title mt-4">
              <XCircle size={20} color="#ef4444" /> Tidak Termasuk
            </h3>
            <ul className="check-list">
              {product.excluded ? (
                product.excluded.split("\n").map((item, i) => (
                  <li key={i}>
                    <XCircle size={16} color="#ef4444" /> {item}
                  </li>
                ))
              ) : (
                <li>Tidak ada data excluded.</li>
              )}
            </ul>
          </div>

          {/* 4. Hotel */}
          <div id="hotel" className="detail-card">
            <h3 className="section-title">
              <Hotel size={20} className="icon-gold" /> Akomodasi Hotel
            </h3>
            <div className="hotel-grid">
              <div className="hotel-box">
                <small>Makkah</small>
                <div className="hotel-name">{product.hotel_makkah}</div>
                <div className="stars">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} size={14} fill="#eab308" color="#eab308" />
                  ))}
                </div>
              </div>
              <div className="hotel-box">
                <small>Madinah</small>
                <div className="hotel-name">{product.hotel_madinah}</div>
                <div className="stars">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} size={14} fill="#eab308" color="#eab308" />
                  ))}
                </div>
              </div>
            </div>

            {hotelMakkahGalleryImages.length > 0 && (
              <div className="hotel-slider-wrap">
                <div className="hotel-slider-head">
                  <h4>Galeri Hotel Makkah</h4>
                  <span>
                    {activeHotelMakkahSlide + 1} /{" "}
                    {hotelMakkahGalleryImages.length}
                  </span>
                </div>

                <div className="hotel-slider">
                  <button
                    type="button"
                    className="hotel-nav hotel-nav-left"
                    onClick={prevHotelMakkahSlide}
                    aria-label="Slide sebelumnya"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <img
                    src={hotelMakkahGalleryImages[activeHotelMakkahSlide]}
                    alt={`Hotel Makkah ${activeHotelMakkahSlide + 1}`}
                    className="hotel-slider-image"
                  />

                  <button
                    type="button"
                    className="hotel-nav hotel-nav-right"
                    onClick={nextHotelMakkahSlide}
                    aria-label="Slide berikutnya"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="hotel-slider-dots">
                  {hotelMakkahGalleryImages.map((_, index) => (
                    <button
                      key={`hotel-makkah-dot-${index}`}
                      type="button"
                      className={`hotel-dot ${index === activeHotelMakkahSlide ? "active" : ""}`}
                      onClick={() => setActiveHotelMakkahSlide(index)}
                      aria-label={`Buka slide hotel makkah ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {hotelMadinahGalleryImages.length > 0 && (
              <div className="hotel-slider-wrap">
                <div className="hotel-slider-head">
                  <h4>Galeri Hotel Madinah</h4>
                  <span>
                    {activeHotelMadinahSlide + 1} /{" "}
                    {hotelMadinahGalleryImages.length}
                  </span>
                </div>

                <div className="hotel-slider">
                  <button
                    type="button"
                    className="hotel-nav hotel-nav-left"
                    onClick={prevHotelMadinahSlide}
                    aria-label="Slide sebelumnya"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <img
                    src={hotelMadinahGalleryImages[activeHotelMadinahSlide]}
                    alt={`Hotel Madinah ${activeHotelMadinahSlide + 1}`}
                    className="hotel-slider-image"
                  />

                  <button
                    type="button"
                    className="hotel-nav hotel-nav-right"
                    onClick={nextHotelMadinahSlide}
                    aria-label="Slide berikutnya"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="hotel-slider-dots">
                  {hotelMadinahGalleryImages.map((_, index) => (
                    <button
                      key={`hotel-madinah-dot-${index}`}
                      type="button"
                      className={`hotel-dot ${index === activeHotelMadinahSlide ? "active" : ""}`}
                      onClick={() => setActiveHotelMadinahSlide(index)}
                      aria-label={`Buka slide hotel madinah ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === KOLOM KANAN (SIDEBAR BOOKING) === */}
        <div className="content-right">
          <div className="booking-card">
            {/* HARGA TOTAL */}
            <div className="price-tag">
              <small>Estimasi Total ({totalPax} Jamaah)</small>
              <div className="amount">
                $USD {Number(totalPrice).toLocaleString("id-ID")}
              </div>
            </div>

            <div className="sidebar-info">
              {/* ROOM COMPOSER */}
              <div style={{ marginBottom: "10px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    fontWeight: "800",
                    marginBottom: "16px",
                    color: "#0f172a",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <BedDouble size={16} color="#c9a227" /> Atur Komposisi Kamar
                </label>

                {/* QUAD ROW */}
                <div className="room-selector-row">
                  <div className="room-label">
                    <span className="room-name">Quad - Sekamar Ber 4</span>
                    <span className="room-price">
                      $USD {Number(product.price_quad).toLocaleString("id-ID")}
                      /Jamaah
                    </span>
                  </div>
                  <div className="qty-control">
                    <button
                      className="qty-btn"
                      onClick={() => updateQty("quad", -1)}
                    >
                      -
                    </button>
                    <span className="qty-value">{roomQty.quad}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQty("quad", 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* TRIPLE ROW */}
                <div className="room-selector-row">
                  <div className="room-label">
                    <span className="room-name">Triple - Sekamar Ber 3</span>
                    <span className="room-price">
                      $USD{" "}
                      {Number(product.price_triple).toLocaleString("id-ID")}
                      /Jamaah
                    </span>
                  </div>
                  <div className="qty-control">
                    <button
                      className="qty-btn"
                      onClick={() => updateQty("triple", -1)}
                    >
                      -
                    </button>
                    <span className="qty-value">{roomQty.triple}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQty("triple", 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* DOUBLE ROW */}
                <div className="room-selector-row">
                  <div className="room-label">
                    <span className="room-name">Double - Sekamar Ber 2</span>
                    <span className="room-price">
                      $USD{" "}
                      {Number(product.price_double).toLocaleString("id-ID")}
                      /Jamaah
                    </span>
                  </div>
                  <div className="qty-control">
                    <button
                      className="qty-btn"
                      onClick={() => updateQty("double", -1)}
                    >
                      -
                    </button>
                    <span className="qty-value">{roomQty.double}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQty("double", 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* SUMMARY BOX */}
              <div className="info-summary">
                <div className="summary-row">
                  <span>Total Kamar</span>
                  <strong>{totalRooms} Estimasi Kamar</strong>
                </div>
                <div className="summary-row">
                  <span>Total Jamaah</span>
                  <strong>{totalPax} Orang</strong>
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#475569",
                  }}
                >
                  {roomQty.quad > 0 && (
                    <div>
                      • Quad: {roomQty.quad} jamaah (estimasi{" "}
                      {Math.ceil(roomQty.quad / 4)} kamar)
                    </div>
                  )}
                  {roomQty.triple > 0 && (
                    <div>
                      • Triple: {roomQty.triple} jamaah (estimasi{" "}
                      {Math.ceil(roomQty.triple / 3)} kamar)
                    </div>
                  )}
                  {roomQty.double > 0 && (
                    <div>
                      • Double: {roomQty.double} jamaah (estimasi{" "}
                      {Math.ceil(roomQty.double / 2)} kamar)
                    </div>
                  )}
                </div>
              </div>

              {/* STATUS BOX */}
              <div className="sidebar-status">
                <span>Status: Tersedia</span>
                <span style={{ color: "#b45309" }}>Sisa: ∞ Pax</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={totalPax === 0}
              style={{
                width: "100%",
                marginTop: "10px",
                border: "1px solid #0f172a",
                background: totalPax === 0 ? "#e2e8f0" : "#fff",
                color: totalPax === 0 ? "#64748b" : "#0f172a",
                borderRadius: "12px",
                padding: "12px",
                fontWeight: "700",
                cursor: totalPax === 0 ? "not-allowed" : "pointer",
              }}
            >
              Hubungi CS via WhatsApp
            </button>

            <div className="note-text">
              *Harga yang tertera adalah estimasi. Harga final akan dikonfirmasi
              oleh admin.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HajiKhususPage;
