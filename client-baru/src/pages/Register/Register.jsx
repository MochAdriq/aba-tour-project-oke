import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { notifyApiError, notifySuccess } from "../../utils/notify";
// Kita pakai CSS yang sama dengan Login agar hemat file dan konsisten
import "../Login/Auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData,
      );
      await notifySuccess("Registrasi Berhasil", res.data.message);
      navigate("/login");
    } catch (err) {
      await notifyApiError(err, "Terjadi kesalahan!", "Registrasi Gagal");
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Buat Akun Baru</h2>
          <p>Bergabunglah bersama ribuan jamaah lainnya</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input
              type="text"
              name="username"
              placeholder="Nama Anda"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="nama@email.com"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Min. 6 Karakter"
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-auth">
            Daftar Sekarang
          </button>
        </form>

        <div className="auth-footer">
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
