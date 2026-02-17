import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
// Import Icon Lucide
import { Plus, Edit, Trash2, ImageOff } from "lucide-react";
import { confirmAction, notifyError, notifySuccess } from "../../utils/notify";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const loadProducts = () => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: "Hapus Paket?",
      text: "Data paket yang dihapus tidak bisa dikembalikan.",
      confirmButtonText: "Ya, hapus",
    });
    if (!confirmed) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/products/${id}`,
        getAuthConfig(),
      );
      loadProducts();
      await notifySuccess("Berhasil", "Paket berhasil dihapus.");
    } catch {
      await notifyError("Gagal", "Gagal menghapus paket.");
    }
  };

  return (
    <div>
      {/* Header Modern */}
      <div className="dash-header">
        <div className="dash-title">
          <h2>Kelola Paket</h2>
          <p>Atur semua paket Umroh & Haji yang tersedia di website.</p>
        </div>
        <Link
          to="/dashboard/products/add"
          className="btn-add"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={18} /> Tambah Paket Baru
        </Link>
      </div>

      {/* Tabel Modern */}
      <div className="table-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Nama Paket</th>
              <th>Harga</th>
              <th>Kategori</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#94a3b8",
                  }}
                >
                  Belum ada data paket. Silakan tambah baru.
                </td>
              </tr>
            ) : (
              products.map((item) => (
                <tr key={item.id}>
                  {/* KOLOM GAMBAR */}
                  <td>
                    {item.image_url ? (
                      <img
                        src={`http://localhost:5000/uploads/${item.image_url}`}
                        alt={item.title}
                        className="table-thumb"
                      />
                    ) : (
                      <div
                        className="table-thumb"
                        style={{
                          display: "grid",
                          placeItems: "center",
                          background: "#f1f5f9",
                          color: "#cbd5e1",
                        }}
                      >
                        <ImageOff size={18} />
                      </div>
                    )}
                  </td>

                  {/* KOLOM INFO */}
                  <td>
                    <div style={{ fontWeight: "700", color: "#0f172a" }}>
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        marginTop: "4px",
                      }}
                    >
                      {item.duration} Hari •{" "}
                      {item.airline || "Pesawat Belum Set"}
                    </div>
                  </td>

                  {/* KOLOM HARGA */}
                  <td style={{ fontWeight: "600", color: "#059669" }}>
                    Rp {Number(item.price).toLocaleString("id-ID")}
                  </td>

                  {/* KOLOM KATEGORI */}
                  <td>
                    <span
                      className={`badge ${item.category === "haji" ? "badge-haji" : "badge-umroh"}`}
                    >
                      {item.category.toUpperCase()}
                    </span>
                  </td>

                  {/* KOLOM AKSI */}
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <Link
                        to={`/dashboard/products/edit/${item.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#e0f2fe",
                          color: "#0284c7",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontWeight: "bold",
                          fontSize: "12px",
                        }}
                      >
                        <Edit size={14} /> Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn-delete"
                        title="Hapus Paket"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "8px",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
