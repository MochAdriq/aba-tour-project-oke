import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  notifyApiError,
  notifySuccess,
  notifyWarning,
} from "../../utils/notify";
import "./PaymentProofPage.css";

const PaymentProofPage = () => {
  const { bookingCode } = useParams();
  const navigate = useNavigate();

  const [channels, setChannels] = useState([]);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const [formData, setFormData] = useState({
    payment_channel_id: "",
    sender_name: "",
    sender_bank: "",
    amount: "",
    transfer_date: "",
    note: "",
  });
  const [proofImage, setProofImage] = useState(null);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchInitialData = async () => {
      try {
        const [channelsRes, bookingRes] = await Promise.all([
          axios.get("http://localhost:5000/api/payments/instructions"),
          axios.get(
            `http://localhost:5000/api/payments/booking/${bookingCode}`,
            getAuthConfig(),
          ),
        ]);
        setChannels(channelsRes.data.channels || []);
        setBooking(bookingRes.data.booking || null);
      } catch (error) {
        console.error("Gagal memuat data pembayaran:", error);
        if (error?.response?.status === 401) {
          await notifyWarning(
            "Sesi Login Berakhir",
            "Sesi login habis, silakan login kembali.",
          );
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [bookingCode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofImage) {
      await notifyWarning(
        "Bukti Transfer Wajib",
        "Upload bukti transfer wajib diisi.",
      );
      return;
    }

    setSubmitting(true);
    setResultMessage("");

    const payload = new FormData();
    payload.append("booking_code", bookingCode);
    Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
    payload.append("proof_image", proofImage);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/payments/proof",
        payload,
        {
          ...getAuthConfig(),
          headers: {
            ...getAuthConfig().headers,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setResultMessage(
        res.data?.message || "Bukti pembayaran berhasil dikirim ke admin.",
      );
      setProofImage(null);
      setFormData({
        payment_channel_id: "",
        sender_name: "",
        sender_bank: "",
        amount: "",
        transfer_date: "",
        note: "",
      });
      await notifySuccess(
        "Bukti Pembayaran Terkirim",
        res.data?.message || "Bukti pembayaran berhasil dikirim ke admin.",
      );
    } catch (error) {
      console.error("Gagal kirim bukti:", error);
      await notifyApiError(
        error,
        "Gagal kirim bukti pembayaran.",
        "Pengiriman Gagal",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="section payment-page">
        <div className="container payment-card">Memuat data pembayaran...</div>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="section payment-page">
        <div className="container payment-card">
          Booking tidak ditemukan. Pastikan link pembayaran benar.
        </div>
      </section>
    );
  }

  return (
    <section className="section payment-page">
      <div className="container payment-layout">
        <div className="payment-card">
          <small className="payment-chip">Form Bukti Bayar</small>
          <h1>Upload Bukti Pembayaran</h1>
          <p className="payment-subtitle">
            Kode Booking: <strong>{booking.booking_code}</strong>
          </p>
          <div className="booking-summary">
            <div>
              <span>Paket</span>
              <strong>{booking.product_title}</strong>
            </div>
            <div>
              <span>Total Tagihan</span>
              <strong>
                Rp {Number(booking.total_price || 0).toLocaleString("id-ID")}
              </strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <label>
              Pilih Rekening Tujuan
              <select
                name="payment_channel_id"
                value={formData.payment_channel_id}
                onChange={handleChange}
                required
              >
                <option value="">Pilih bank tujuan</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.bank_name} - {channel.account_number} a.n.{" "}
                    {channel.account_holder}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Nama Pengirim
              <input
                type="text"
                name="sender_name"
                value={formData.sender_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Bank Pengirim
              <input
                type="text"
                name="sender_bank"
                value={formData.sender_bank}
                onChange={handleChange}
                required
              />
            </label>

            <div className="payment-row">
              <label>
                Nominal Transfer
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Tanggal Transfer
                <input
                  type="date"
                  name="transfer_date"
                  value={formData.transfer_date}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label>
              Catatan (opsional)
              <textarea
                rows="3"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Contoh: transfer via mobile banking"
              />
            </label>

            <label>
              Upload Bukti Transfer
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                required
              />
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? "Mengirim..." : "Kirim Bukti Pembayaran"}
            </button>
          </form>

          {resultMessage && <div className="payment-success">{resultMessage}</div>}
        </div>

        <aside className="payment-card payment-side">
          <h2>Informasi Transfer</h2>
          <p>Pilih salah satu rekening resmi ABA Tour di bawah ini.</p>
          <div className="channel-list">
            {channels.length === 0 ? (
              <div className="channel-item">Belum ada data rekening aktif.</div>
            ) : (
              channels.map((channel) => (
                <div className="channel-item" key={channel.id}>
                  <strong>{channel.bank_name}</strong>
                  <span>No. Rek: {channel.account_number}</span>
                  <span>a.n. {channel.account_holder}</span>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default PaymentProofPage;
