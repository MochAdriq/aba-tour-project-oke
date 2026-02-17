import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, ImageOff } from "lucide-react";
import { confirmAction, notifyApiError, notifySuccess } from "../../../utils/notify";

const NewsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const loadNews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/news/admin",
        getAuthConfig(),
      );
      setItems(res.data || []);
    } catch (error) {
      await notifyApiError(error, "Gagal mengambil data berita.", "Gagal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: "Hapus Berita?",
      text: "Artikel yang dihapus tidak bisa dikembalikan.",
      confirmButtonText: "Ya, hapus",
    });
    if (!confirmed) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/news/admin/${id}`,
        getAuthConfig(),
      );
      await notifySuccess("Berhasil", "Berita berhasil dihapus.");
      loadNews();
    } catch (error) {
      await notifyApiError(error, "Gagal menghapus berita.", "Gagal");
    }
  };

  return (
    <div>
      <div className="dash-header">
        <div className="dash-title">
          <h2>Kelola News & Gallery</h2>
          <p>Manajemen artikel, galeri foto, dan video.</p>
        </div>
        <Link
          to="/dashboard/news/add"
          className="btn-add"
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Plus size={18} /> Tambah News & Gallery
        </Link>
      </div>

      <div className="table-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Cover</th>
              <th>Judul</th>
              <th>Media</th>
              <th>Pembuat</th>
              <th>Status</th>
              <th>Tanggal Publish</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: 28 }}>
                  Memuat berita...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: 28 }}>
                  Belum ada berita.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.cover_image ? (
                      <img
                        src={`http://localhost:5000/uploads/${item.cover_image}`}
                        alt={item.title}
                        className="table-thumb"
                      />
                    ) : (
                      <div
                        className="table-thumb"
                        style={{ display: "grid", placeItems: "center", color: "#94a3b8" }}
                      >
                        <ImageOff size={16} />
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.title}</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                      /news/{item.slug}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: "#475569" }}>
                      Foto: {(() => {
                        try {
                          const parsed = JSON.parse(item.gallery_images || "[]");
                          return Array.isArray(parsed) ? parsed.length : 0;
                        } catch {
                          return 0;
                        }
                      })()}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                      Video: {item.video_url ? "Ada" : "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                      Tipe: {item.media_type === "video" ? "Video" : "Foto"}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>
                      {item.created_by || "Admin ABA Tour"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: Number(item.is_published) ? "#dcfce7" : "#fee2e2",
                        color: Number(item.is_published) ? "#166534" : "#991b1b",
                      }}
                    >
                      {Number(item.is_published) ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>
                    {item.published_at
                      ? new Date(item.published_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link
                        to={`/dashboard/news/edit/${item.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#e0f2fe",
                          color: "#0284c7",
                          padding: "8px 10px",
                          borderRadius: 8,
                          textDecoration: "none",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        <Edit size={14} /> Edit
                      </Link>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDelete(item.id)}
                        title="Hapus berita"
                      >
                        <Trash2 size={14} />
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

export default NewsList;
