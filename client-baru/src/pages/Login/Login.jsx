import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { notifyApiError, notifySuccess } from "../../utils/notify";
import "./Auth.css"; // Pastikan Auth.css ada

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      // 1. SIMPAN TOKEN (Sudah ada)
      localStorage.setItem("token", res.data.token);

      // 2. TAMBAHKAN INI: SIMPAN DATA USER (Agar Navbar tahu siapa yang login)
      localStorage.setItem("user", JSON.stringify(res.data.user));

      await notifySuccess(
        "Login Berhasil",
        `Selamat datang, ${res.data.user.username}`,
      );
      navigate("/");

      // Reload halaman agar Navbar langsung berubah
      window.location.reload();
    } catch (err) {
      await notifyApiError(err, "Login Gagal", "Login Gagal");
    }
  };

  return (
    // Wrapper khusus agar layout tengah & background muncul HANYA di sini
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Selamat Datang</h2>
          <p>Silakan masuk untuk melanjutkan</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="contoh@mail.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-auth">
            Masuk Sekarang
          </button>
        </form>

        <div className="auth-footer">
          Belum punya akun? <Link to="/register">Daftar Sekarang</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
