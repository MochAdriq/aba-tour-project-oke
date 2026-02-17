import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  // Cek apakah ada token di penyimpanan browser
  const token = localStorage.getItem("token");

  // Jika ada token, izinkan masuk (Outlet). Jika tidak, lempar ke Login.
  return token ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
