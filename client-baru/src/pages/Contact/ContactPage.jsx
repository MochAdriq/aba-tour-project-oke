import React, { useState } from "react";
import { MessageCircle, Mail, Clock3, Send, MapIcon } from "lucide-react";
import "./ContactPage.css";

const WHATSAPP_NUMBER = "628567619000";

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "Paket Umroh",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = `Halo ABA Tour, saya ingin dihubungi.

Nama: ${form.name}
Email: ${form.email}
No. HP: ${form.phone}
Minat: ${form.interest}
Pesan: ${form.message || "-"}`;
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  return (
    <section className="section contact-page">
      <div className="container contact-wrap">
        <div className="contact-head">
          <small>Hubungi Kami</small>
          <h1>Konsultasi Cepat Bersama Tim ABA Tour</h1>
          <p>
            Tinggalkan data Anda, tim kami akan follow up seperti alur lead
            HubSpot: cepat, jelas, dan terarah.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-info-card">
              <MessageCircle size={18} />
              <div>
                <strong>WhatsApp</strong>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  +62 856-7619-000
                </a>
              </div>
            </div>
            <div className="contact-info-card">
              <Mail size={18} />
              <div>
                <strong>Email</strong>
                <span>abatourofcsukalarang@gmail.com</span>
              </div>
            </div>
            <div className="contact-info-card">
              <Clock3 size={18} />
              <div>
                <strong>Jam Operasional</strong>
                <span>Senin - Sabtu, 08.00 - 17.00 WIB</span>
              </div>
            </div>
            <div className="contact-info-card">
              <MapIcon size={18} />
              <div>
                <strong>Alamat</strong>
                <span>
                  <b>Kantor ABA Tour Sukalarang:</b> <br /> Jl. Cianjur Sukabumi
                  KM 10 No. 98 Pasekon, Margaluyuh Kab. Sukabumi. <br />
                  <b>Kantor Pusat:</b> <br />
                  Jl. Garuda No. 20 Baros Kota Sukabumi <br />
                  Phone:(0266) 218218, 085797077888 <br />
                  Email: abatourdigital@gmail.com <br /> Website : abatour.co.id
                </span>
              </div>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-row">
              <div>
                <label>Nama Lengkap</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan nama Anda"
                />
              </div>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div className="contact-form-row">
              <div>
                <label>No. WhatsApp</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label>Minat Program</label>
                <select
                  name="interest"
                  value={form.interest}
                  onChange={handleChange}
                >
                  <option value="Paket Umroh">Paket Umroh</option>
                  <option value="Haji Khusus">Haji Khusus</option>
                  <option value="Konsultasi Umum">Konsultasi Umum</option>
                </select>
              </div>
            </div>

            <div>
              <label>Pesan</label>
              <textarea
                rows={5}
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Ceritakan kebutuhan Anda..."
              />
            </div>

            <button type="submit">
              <Send size={16} /> Kirim ke WhatsApp
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
