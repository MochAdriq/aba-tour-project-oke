import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
// Import Icon Lucide
import {
  LayoutTemplate,
  PlusSquare,
  Columns,
  X,
  Save,
  Smartphone,
  Trash2,
  Power,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  confirmAction,
  notifyError,
  notifySuccess,
  notifyWarning,
} from "../../../utils/notify";

const PromoList = () => {
  const [promos, setPromos] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // --- STATE UTAMA ---
  const [promoName, setPromoName] = useState("");
  const [productId, setProductId] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // --- STATE BENTO BLOCKS ---
  const [blocks, setBlocks] = useState([]);

  // --- LOAD DATA ---
  const loadData = useCallback(async () => {
    try {
      const [promoRes, productRes] = await Promise.all([
        axios.get("http://localhost:5000/api/promos", getAuthConfig()),
        axios.get("http://localhost:5000/api/products"),
      ]);
      setPromos(promoRes.data);
      setProducts(productRes.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- BENTO BUILDER LOGIC ---

  const addBigBlock = () => {
    setBlocks([
      ...blocks,
      {
        id: Date.now(),
        type: "big",
        data: { title: "", subtitle: "", desc: "" },
      },
    ]);
  };

  const addRowBlock = () => {
    setBlocks([
      ...blocks,
      {
        id: Date.now(),
        type: "row",
        items: [
          { title: "", subtitle: "", desc: "" },
          { title: "", subtitle: "", desc: "" },
        ],
      },
    ]);
  };

  const removeBlock = (index) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
  };

  const updateBlockData = (blockIndex, field, value, itemIndex = null) => {
    const newBlocks = [...blocks];
    if (itemIndex === null) {
      newBlocks[blockIndex].data[field] = value;
    } else {
      newBlocks[blockIndex].items[itemIndex][field] = value;
    }
    setBlocks(newBlocks);
  };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      await notifyWarning("Gambar Wajib", "Gambar hero wajib diupload.");
      return;
    }
    if (blocks.length === 0) {
      await notifyWarning("Konten Belum Lengkap", "Minimal isi 1 block konten.");
      return;
    }

    setIsSubmitting(true);
    const data = new FormData();
    data.append("promo_name", promoName);
    data.append("product_id", productId);
    data.append("hero_image", image);
    data.append("content_json", JSON.stringify(blocks));

    try {
      await axios.post("http://localhost:5000/api/promos", data, {
        ...getAuthConfig(),
        headers: {
          ...getAuthConfig().headers,
          "Content-Type": "multipart/form-data",
        },
      });
      await notifySuccess("Berhasil", "Promo bento berhasil disimpan.");
      setPromoName("");
      setProductId("");
      setImage(null);
      setPreview(null);
      setBlocks([]);
      loadData();
    } catch {
      await notifyError("Gagal", "Gagal upload promo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- TOGGLE STATUS ---
  const toggleActive = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      await axios.put(
        `http://localhost:5000/api/promos/${id}/status`,
        {
          is_active: newStatus,
        },
        getAuthConfig(),
      );
      loadData();
    } catch {
      await notifyError("Gagal", "Gagal mengubah status promo.");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: "Hapus Promo?",
      text: "Promo yang dihapus tidak bisa dikembalikan.",
      confirmButtonText: "Ya, hapus",
    });
    if (confirmed) {
      await axios.delete(`http://localhost:5000/api/promos/${id}`, getAuthConfig());
      loadData();
      await notifySuccess("Berhasil", "Promo berhasil dihapus.");
    }
  };

  return (
    <div style={{ maxWidth: "1400px", paddingBottom: "100px" }}>
      <div className="dash-header">
        <div className="dash-title">
          <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LayoutTemplate size={28} color="#0f172a" /> Bento Promo Builder
          </h2>
          <p>Buat layout promo: Judul, Sub Judul, dan Deskripsi.</p>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "40% 60%", gap: "30px" }}
      >
        {/* --- EDITOR (KIRI) --- */}
        <div
          className="table-card"
          style={{ padding: "24px", height: "fit-content" }}
        >
          <h4 style={{ marginTop: 0, color: "#0f172a" }}>1. Info Utama</h4>

          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyle}>Nama Promo (Internal)</label>
            <input
              type="text"
              value={promoName}
              onChange={(e) => setPromoName(e.target.value)}
              style={inputStyle}
              placeholder="Promo Lebaran"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyle}>Link ke Produk</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Pilih Paket (Opsional) --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Gambar Hero</label>
            <div style={{ position: "relative" }}>
              <input
                type="file"
                id="file-upload"
                style={{ display: "none" }}
                onChange={(e) => {
                  setImage(e.target.files[0]);
                  setPreview(URL.createObjectURL(e.target.files[0]));
                }}
              />
              <label
                htmlFor="file-upload"
                style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  background: "#f8fafc",
                  color: "#64748b",
                }}
              >
                <ImageIcon size={18} /> {image ? image.name : "Pilih Gambar..."}
              </label>
            </div>
          </div>

          <hr
            style={{
              border: "0",
              borderTop: "1px solid #eee",
              margin: "20px 0",
            }}
          />

          <h4 style={{ marginTop: 0, color: "#0f172a" }}>2. Susun Konten</h4>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={addBigBlock}
              style={{
                ...btnAddStyle,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <PlusSquare size={16} /> 1 Kotak Besar
            </button>
            <button
              type="button"
              onClick={addRowBlock}
              style={{
                ...btnAddStyle,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Columns size={16} /> 2 Kotak Kecil
            </button>
          </div>

          {/* LIST BLOCK EDITOR */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {blocks.map((block, index) => (
              <div
                key={block.id}
                style={{
                  background: "#f8fafc",
                  padding: "15px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => removeBlock(index)}
                  style={{
                    position: "absolute",
                    top: "-10px",
                    right: "-10px",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <X size={14} strokeWidth={3} />
                </button>

                {block.type === "big" ? (
                  <>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#64748b",
                        marginBottom: "8px",
                      }}
                    >
                      KOTAK BESAR (FULL)
                    </div>
                    <input
                      placeholder="JUDUL UTAMA (Paling Atas)"
                      value={block.data.title}
                      onChange={(e) =>
                        updateBlockData(index, "title", e.target.value)
                      }
                      style={{
                        ...inputStyle,
                        marginBottom: "5px",
                        fontWeight: "bold",
                      }}
                    />
                    <input
                      placeholder="Sub Judul (Warna Emas)"
                      value={block.data.subtitle}
                      onChange={(e) =>
                        updateBlockData(index, "subtitle", e.target.value)
                      }
                      style={{
                        ...inputStyle,
                        marginBottom: "5px",
                        color: "#b8921f",
                      }}
                    />
                    <textarea
                      placeholder="Deskripsi lengkap..."
                      rows="3"
                      value={block.data.desc}
                      onChange={(e) =>
                        updateBlockData(index, "desc", e.target.value)
                      }
                      style={inputStyle}
                    ></textarea>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#64748b",
                        marginBottom: "8px",
                      }}
                    >
                      BARIS (2 KOLOM)
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                      }}
                    >
                      {/* Item Kiri */}
                      <div
                        style={{
                          borderRight: "1px solid #eee",
                          paddingRight: "10px",
                        }}
                      >
                        <input
                          placeholder="Judul Kiri"
                          value={block.items[0].title}
                          onChange={(e) =>
                            updateBlockData(index, "title", e.target.value, 0)
                          }
                          style={{
                            ...inputStyle,
                            marginBottom: "5px",
                            fontWeight: "bold",
                          }}
                        />
                        <input
                          placeholder="Sub Judul Kiri"
                          value={block.items[0].subtitle}
                          onChange={(e) =>
                            updateBlockData(
                              index,
                              "subtitle",
                              e.target.value,
                              0,
                            )
                          }
                          style={{
                            ...inputStyle,
                            marginBottom: "5px",
                            color: "#b8921f",
                          }}
                        />
                        <textarea
                          placeholder="Desc Kiri..."
                          rows="2"
                          value={block.items[0].desc}
                          onChange={(e) =>
                            updateBlockData(index, "desc", e.target.value, 0)
                          }
                          style={inputStyle}
                        ></textarea>
                      </div>
                      {/* Item Kanan */}
                      <div>
                        <input
                          placeholder="Judul Kanan"
                          value={block.items[1].title}
                          onChange={(e) =>
                            updateBlockData(index, "title", e.target.value, 1)
                          }
                          style={{
                            ...inputStyle,
                            marginBottom: "5px",
                            fontWeight: "bold",
                          }}
                        />
                        <input
                          placeholder="Sub Judul Kanan"
                          value={block.items[1].subtitle}
                          onChange={(e) =>
                            updateBlockData(
                              index,
                              "subtitle",
                              e.target.value,
                              1,
                            )
                          }
                          style={{
                            ...inputStyle,
                            marginBottom: "5px",
                            color: "#b8921f",
                          }}
                        />
                        <textarea
                          placeholder="Desc Kanan..."
                          rows="2"
                          value={block.items[1].desc}
                          onChange={(e) =>
                            updateBlockData(index, "desc", e.target.value, 1)
                          }
                          style={inputStyle}
                        ></textarea>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-add"
            style={{
              width: "100%",
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Save size={18} /> {isSubmitting ? "Menyimpan..." : "SIMPAN PROMO"}
          </button>
        </div>

        {/* --- LIVE PREVIEW (KANAN) --- */}
        <div>
          <h4
            style={{
              marginTop: 0,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Smartphone size={20} /> Preview Tampilan
          </h4>

          {/* CONTAINER SIMULASI */}
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              border: "1px solid #eee",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.2fr",
                gap: "20px",
                alignItems: "start",
              }}
            >
              {/* KIRI: IMAGE CARD */}
              <div
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  height: "400px",
                  background: "#f1f5f9",
                }}
              >
                <img
                  src={
                    preview ||
                    "https://via.placeholder.com/400x600?text=Hero+Image"
                  }
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* KANAN: BENTO STATS */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                {blocks.length === 0 && (
                  <div
                    style={{
                      color: "#94a3b8",
                      textAlign: "center",
                      marginTop: "150px",
                      border: "2px dashed #e2e8f0",
                      padding: "20px",
                      borderRadius: "10px",
                    }}
                  >
                    Tambahkan Block di Kiri...
                  </div>
                )}

                {blocks.map((block) => {
                  if (block.type === "big") {
                    return (
                      <div key={block.id} style={cardStyle}>
                        <h3
                          style={{
                            margin: "0 0 5px 0",
                            fontSize: "18px",
                            color: "#0f172a",
                          }}
                        >
                          {block.data.title || "Judul Utama"}
                        </h3>
                        <div
                          style={{
                            color: "#b8921f",
                            fontWeight: "bold",
                            fontSize: "14px",
                            marginBottom: "8px",
                          }}
                        >
                          {block.data.subtitle || "Sub Judul Aksen"}
                        </div>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#64748b",
                            lineHeight: "1.5",
                            margin: 0,
                          }}
                        >
                          {block.data.desc ||
                            "Deskripsi panjang akan muncul di sini..."}
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={block.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "15px",
                        }}
                      >
                        {block.items.map((item, i) => (
                          <div key={i} style={cardStyle}>
                            <h4
                              style={{
                                margin: "0 0 5px 0",
                                fontSize: "15px",
                                color: "#0f172a",
                              }}
                            >
                              {item.title || "Judul Mini"}
                            </h4>
                            <div
                              style={{
                                color: "#b8921f",
                                fontWeight: "bold",
                                fontSize: "12px",
                                marginBottom: "6px",
                              }}
                            >
                              {item.subtitle || "Sub Judul"}
                            </div>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#64748b",
                                lineHeight: "1.4",
                                margin: 0,
                              }}
                            >
                              {item.desc || "Deskripsi singkat..."}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </div>

          {/* LIST EXISTING PROMOS */}
          <div style={{ marginTop: "30px" }}>
            <h4 style={{ color: "#0f172a" }}>Daftar Promo Tersimpan</h4>
            {promos.map((p) => (
              <div
                key={p.id}
                className="table-card"
                style={{
                  padding: "12px",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <img
                    src={`http://localhost:5000/uploads/${p.hero_image}`}
                    style={{
                      width: "60px",
                      height: "40px",
                      objectFit: "cover",
                      borderRadius: "6px",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        color: "#0f172a",
                      }}
                    >
                      {p.promo_name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      ID Produk: {p.product_id || "-"}
                    </div>
                  </div>
                </div>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  {/* TOMBOL TOGGLE ON/OFF */}
                  <button
                    onClick={() => toggleActive(p.id, p.is_active)}
                    style={{
                      cursor: "pointer",
                      border: "none",
                      background: p.is_active ? "#dcfce7" : "#f1f5f9",
                      color: p.is_active ? "#166534" : "#64748b",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontWeight: "bold",
                      fontSize: "12px",
                      transition: "0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {p.is_active ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                    {p.is_active ? "AKTIF" : "NON-AKTIF"}
                  </button>

                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      cursor: "pointer",
                      border: "none",
                      background: "#fee2e2",
                      color: "#ef4444",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS Styles Helper
const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: "700",
  color: "#64748b",
  marginBottom: "4px",
  textTransform: "uppercase",
};
const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "13px",
  fontFamily: "inherit",
};
const btnAddStyle = {
  padding: "10px 15px",
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "12px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
};
const cardStyle = {
  background: "#f8f9fa",
  padding: "15px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
};

export default PromoList;
