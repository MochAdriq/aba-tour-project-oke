import React from "react";
import "./FAQ.css";

const FAQ = () => {
  return (
    <section className="section">
      <div className="container">
        {/* Header Section */}
        <div className="faqHead">
          <h2>Pertanyaan Umum (FAQ)</h2>
          <button className="btnExplore">Lihat Semua FAQ</button>
        </div>

        {/* List Pertanyaan */}
        <div className="faqList">
          {/* Item 1 */}
          <details open>
            <summary>
              Apa itu platform ABA TOUR?
              <span className="chev" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 15.5 5 8.5l1.4-1.4 5.6 5.6 5.6-5.6L19 8.5l-7 7Z" />
                </svg>
              </span>
            </summary>
            <p>
              ABA TOUR adalah layanan perjalanan Umroh & Haji Khusus dengan
              fokus pada pendampingan jama’ah dari rumah sampai kembali,
              termasuk persiapan dokumen, manasik, akomodasi, hingga pendamping
              lapangan yang berpengalaman.
            </p>
          </details>

          {/* Item 2 */}
          <details>
            <summary>
              Bagaimana cara memilih paket yang tepat?
              <span className="chev" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 15.5 5 8.5l1.4-1.4 5.6 5.6 5.6-5.6L19 8.5l-7 7Z" />
                </svg>
              </span>
            </summary>
            <p>
              Gunakan fitur pencarian di halaman utama. Filter berdasarkan
              Program (Umroh/Haji), Waktu Keberangkatan, dan Jumlah Jama’ah.
              Bandingkan fasilitas hotel dan jaraknya ke Masjidil Haram untuk
              kenyamanan maksimal Anda.
            </p>
          </details>

          {/* Item 3 */}
          <details>
            <summary>
              Apa langkah setelah pendaftaran online?
              <span className="chev" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 15.5 5 8.5l1.4-1.4 5.6 5.6 5.6-5.6L19 8.5l-7 7Z" />
                </svg>
              </span>
            </summary>
            <p>
              Tim kami akan menghubungi Anda via WhatsApp/Telepon untuk
              verifikasi data. Selanjutnya adalah Itinerarymanasik, penyerahan
              dokumen fisik (Paspor/Buku Kuning), dan pembayaran termin sesuai
              kesepakatan.
            </p>
          </details>

          {/* Item 4 (Tambahan agar list terlihat penuh) */}
          <details>
            <summary>
              Apakah bisa request paket Private Umroh?
              <span className="chev" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 15.5 5 8.5l1.4-1.4 5.6 5.6 5.6-5.6L19 8.5l-7 7Z" />
                </svg>
              </span>
            </summary>
            <p>
              Tentu bisa. Silakan pilih opsi "Request Special Package" pada menu
              paket, atau hubungi Customer Service kami untuk menyusun jadwal
              dan fasilitas khusus bagi rombongan keluarga atau korporat.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
