import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./AboutPage.css";
import aboutImage from "../../assets/images/abatour_about.jpeg";

const AboutPage = () => {
  const [sidebarPackages, setSidebarPackages] = useState([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  useEffect(() => {
    const loadSidebarPackages = async () => {
      try {
        setSidebarLoading(true);
        const res = await axios.get("http://localhost:5000/api/products");
        setSidebarPackages((res.data || []).slice(0, 5));
      } catch (error) {
        console.error("Gagal memuat paket sidebar:", error);
      } finally {
        setSidebarLoading(false);
      }
    };
    loadSidebarPackages();
  }, []);

  const getProductImage = (item) => {
    if (item?.image_url)
      return `http://localhost:5000/uploads/${item.image_url}`;
    try {
      const urls =
        typeof item?.image_urls === "string"
          ? JSON.parse(item.image_urls)
          : item?.image_urls;
      if (Array.isArray(urls) && urls.length > 0) {
        return `http://localhost:5000/uploads/${urls[0]}`;
      }
    } catch {
      return "";
    }
    return "";
  };

  return (
    <section className="section about-page">
      <div className="container about-layout">
        <div className="about-card">
          {/* --- Header Section --- */}
          <div className="about-header">
            <small className="about-eyebrow">Tentang Kami</small>
            <h1 className="about-title">ABA Tour & Travel</h1>
            <p className="about-lead">
              Penyelenggara Perjalanan Ibadah Umroh (PPIU) & Haji Khusus yang
              Amanah, Profesional, dan Sesuai Syariah.
            </p>
          </div>

          <div className="about-image-wrap">
            <img
              src={aboutImage}
              alt="Tentang ABA Tour"
              className="about-image"
            />
          </div>

          <hr className="divider" />

          {/* --- Profile & History Section --- */}
          <div className="about-content">
            <h3>Sekilas Tentang Kami</h3>
            <p>
              PT. Alif Berkah Amanah Wisata (ABA TOUR dan TRAVEL) adalah Biro
              Perjalanan Wisata Umroh dan Haji Khusus. Kami hadir memberikan
              bimbingan ibadah yang benar sesuai sunnah Nabi Muhammad SAW, serta
              mengedepankan profesionalisme berbasis kejujuran dan amanah.
            </p>
            <p>
              ABA TOUR dipercaya oleh Kementerian Agama RI sebagai PPIU dengan
              SK Kemenag No. 435 Tahun 2016 (Perpanjangan No. 795 Tahun 2019)
              dan telah <strong>Terakreditasi A</strong>.
            </p>

            <h3>Sejarah & Filosofi</h3>
            <p>
              Berdiri sejak 21 April 2012, ABA Tour & Travel lahir dari
              keprihatinan akan layanan travel yang kurang mengedepankan esensi
              ibadah. Kami ingin mengubah stigma bahwa Umroh hanya sekadar
              "wisata".
            </p>
            <p>
              Melalui konsep <strong>"Bimbingan Qolbu"</strong>, kami mengajak
              jamaah menyelami makna perjalanan suci. Bukan hanya ritual fisik,
              tapi juga <em>Ruhiyah</em> (hati-akal) dan <em>Maaliyah</em>{" "}
              (harta). Harapan kami, setiap jamaah pulang membawa perubahan diri
              ke arah yang lebih baik (Mabrur).
            </p>
          </div>

          {/* --- Vision & Mission Section --- */}
          <div className="vision-mission-box">
            <div className="vm-item">
              <h4>Visi</h4>
              <p>
                Membangun kekuatan pelayanan berbasis profesionalisme dan
                persaudaran yang ditujukan untuk mendapat keridhoan Allah SWT
                dalam ibadah, niaga, dan persaudaraan.
              </p>
            </div>
            <div className="vm-item">
              <h4>Misi</h4>
              <ul>
                <li>
                  Memberikan semangat beribadah ke Baitullah (Haji & Umroh)
                  untuk mendapatkan Ridho Ilahi.
                </li>
                <li>
                  Memberikan bimbingan ibadah yang benar sesuai Sunnah Nabi SAW.
                </li>
                <li>
                  Menyebarkan keteladanan profesionalisme kerja berbasis
                  Kejujuran, Amanah, dan Syariah.
                </li>
              </ul>
            </div>
          </div>

          {/* --- Office Channeling Section --- */}
          <div className="channeling-section">
            <h3>Office Channeling Sukalarang</h3>
            <p className="subtitle">
              Excellence in Service. Focused on Worship. Committed to Departure
              Certainty.
            </p>
            <p>
              Sebagai perpanjangan resmi, Office Channeling Sukalarang
              menghadirkan layanan dengan standar tinggi:
              <em>"Melayani jamaah dari pintu Rumah sampai pintu Ka’bah"</em>.
            </p>
            <div className="service-list">
              <strong>Keunggulan Layanan Kami:</strong>
              <ul>
                <li>Manajemen perjalanan terstruktur & terjadwal.</li>
                <li>Pendampingan profesional & responsif.</li>
                <li>Fasilitas akomodasi & transportasi berkualitas.</li>
                <li>Fokus pada kekhusyukan ibadah.</li>
                <li>Kepastian jadwal keberangkatan.</li>
              </ul>
            </div>
          </div>

          <hr className="divider" />

          {/* --- Legalitas Section --- */}
          <div className="legal-section">
            <h3>Legalitas Perusahaan</h3>
            <p className="legal-intro">
              Keamanan dan kenyamanan Anda terjamin dengan legalitas lengkap
              kami:
            </p>
            <ul className="legal-list">
              <li>Akta Pendirian PT No. 62 (21 Maret 2013)</li>
              <li>SK Menkumham RI No. AHU-27880.AH.01.01.Tahun 2013</li>
              <li>Izin PPIU Kemenag RI No. 795 Tahun 2019 (Perpanjangan)</li>
              <li>Akreditasi B dari Kemenag RI</li>
              <li>Nomor Induk Berusaha (NIB): 8120118190091</li>
              <li>Tanda Daftar Usaha Pariwisata (TDUP)</li>
              <li>NPWP: 31.754.982.2-405.00</li>
              <li>Anggota ASITA Jawa Barat & AMPHURI</li>
              <li>Sertifikat KAN No. WIN. 0160217</li>
              <li>Bank Garansi untuk PPIU & PIHK dari Bank Mandiri Syariah</li>
            </ul>
            <p className="legal-note">
              *Daftar lengkap legalitas tersedia di kantor pusat kami.
            </p>
          </div>
        </div>

        <aside className="about-sidebar">
          <div className="about-sidebar-card">
            <small className="about-sidebar-eyebrow">Paket Pilihan</small>
            <h3>Paket Umroh Lainnya</h3>
            <p>
              Lihat beberapa paket terbaru untuk membantu Anda memilih program
              yang paling sesuai.
            </p>

            <div className="about-package-list">
              {sidebarLoading ? (
                <div className="about-package-empty">Memuat paket...</div>
              ) : sidebarPackages.length === 0 ? (
                <div className="about-package-empty">
                  Belum ada paket tersedia.
                </div>
              ) : (
                sidebarPackages.map((item) => {
                  const image = getProductImage(item);
                  return (
                    <Link
                      to={`/product/${item.slug}`}
                      key={item.id}
                      className="about-package-item"
                    >
                      <div className="about-package-thumb-wrap">
                        {image ? (
                          <img
                            src={image}
                            alt={item.title}
                            className="about-package-thumb"
                          />
                        ) : (
                          <div className="about-package-thumb about-package-thumb-fallback">
                            ABA TOUR
                          </div>
                        )}
                      </div>
                      <div className="about-package-body">
                        <strong>{item.title}</strong>
                        <span>
                          Rp{" "}
                          {Number(
                            item.price_quad ||
                              item.price_triple ||
                              item.price_double ||
                              item.price ||
                              0,
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <Link to="/umroh" className="about-sidebar-btn">
              Lihat Semua Paket Umroh
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default AboutPage;
