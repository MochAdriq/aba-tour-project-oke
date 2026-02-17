import React, { useRef, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import RichTextEditor from "../../../components/RichTextEditor/RichTextEditor";
import ImagePickerField from "../../../components/ImagePickerField/ImagePickerField";
import {
  confirmAction,
  notifyError,
  notifySuccess,
  notifyWarning,
} from "../../../utils/notify";
// Import Lucide Icons
import {
  ArrowLeft,
  FileText,
  Plane,
  Settings,
  List,
  Upload,
  PlusCircle,
  Image as ImageIcon,
  Save,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";

const AddProduct = () => {
  const navigate = useNavigate();
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // --- STATE DATA UTAMA ---
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    category: "umroh",
    price_quad: "",
    price_triple: "",
    price_double: "",
    duration: 1,
    departure_date: "",
    closing_date: "",
    airline: "",
    quota: 45,
    product_status: "open",
    hotel_makkah: "",
    hotel_madinah: "",
    description: "",
    included: "",
    excluded: "",
  });

  // --- STATE ITINERARY ---
  const [itineraryList, setItineraryList] = useState([
    { day: 1, title: "", activity: "" },
  ]);
  const [activeDay, setActiveDay] = useState(1);

  // --- STATE MODAL IMPORT ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const summaryEditorRef = useRef(null);

  const [mainImages, setMainImages] = useState([]);
  const [mainPreviews, setMainPreviews] = useState([]);
  const [hotelMakkahImages, setHotelMakkahImages] = useState([]);
  const [hotelMakkahPreviews, setHotelMakkahPreviews] = useState([]);
  const [hotelMadinahImages, setHotelMadinahImages] = useState([]);
  const [hotelMadinahPreviews, setHotelMadinahPreviews] = useState([]);

  // --- LOGIKA UTAMA ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDurationChange = async (e) => {
    const newDuration = parseInt(e.target.value) || 1;
    const oldDuration = itineraryList.length;

    if (newDuration > oldDuration) {
      const newDays = [];
      for (let i = oldDuration + 1; i <= newDuration; i++) {
        newDays.push({ day: i, title: "", activity: "" });
      }
      setItineraryList([...itineraryList, ...newDays]);
      setFormData({ ...formData, duration: newDuration });
    } else if (newDuration < oldDuration) {
      const confirmDelete = await confirmAction({
        title: "Kurangi Durasi?",
        text: `Durasi dikurangi dari ${oldDuration} ke ${newDuration}. Data itinerary hari ke-${newDuration + 1} s.d ${oldDuration} akan dihapus.`,
        confirmButtonText: "Ya, lanjutkan",
      });
      if (confirmDelete) {
        const slicedItinerary = itineraryList.slice(0, newDuration);
        setItineraryList(slicedItinerary);
        setFormData({ ...formData, duration: newDuration });
        if (activeDay > newDuration) setActiveDay(newDuration);
      } else {
        e.target.value = oldDuration;
      }
    }
  };

  const handleItineraryChange = (field, value) => {
    const updatedList = [...itineraryList];
    updatedList[activeDay - 1][field] = value;
    setItineraryList(updatedList);
  };

  const nextDay = (e) => {
    e.preventDefault();
    if (activeDay < itineraryList.length) setActiveDay(activeDay + 1);
  };
  const prevDay = (e) => {
    e.preventDefault();
    if (activeDay > 1) setActiveDay(activeDay - 1);
  };

  // --- LOGIKA IMPORT MASSAL ---
  const processImport = async () => {
    if (!importText.trim()) return;

    const rawDays = importText.split(/(?=Hari \d+:|Day \d+:)/i);
    const newItinerary = [];
    let dayCounter = 1;

    rawDays.forEach((block) => {
      const cleanBlock = block.trim();
      if (!cleanBlock) return;

      const lines = cleanBlock.split("\n");
      let title = lines[0].replace(/^(Hari|Day) \d+[:.]?\s*/i, "").trim();
      let activity = lines.slice(1).join("\n").trim();

      if (title || activity) {
        newItinerary.push({
          day: dayCounter,
          title: title || `Kegiatan Hari ${dayCounter}`,
          activity: activity,
        });
        dayCounter++;
      }
    });

    if (newItinerary.length > 0) {
      const shouldReplace = await confirmAction({
        title: "Timpa Itinerary Lama?",
        text: `Berhasil membaca ${newItinerary.length} hari kegiatan. Data itinerary lama akan ditimpa.`,
        confirmButtonText: "Ya, timpa",
      });
      if (shouldReplace) {
        setItineraryList(newItinerary);
        setFormData({ ...formData, duration: newItinerary.length });
        setActiveDay(1);
        setShowImportModal(false);
        setImportText("");
      }
    } else {
      await notifyWarning(
        "Format Tidak Dikenali",
        "Pastikan menggunakan format 'Hari 1: Judul...'",
      );
    }
  };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "summary") {
        const safeSummary = DOMPurify.sanitize(formData.summary || "", {
          USE_PROFILES: { html: true },
        });
        data.append(key, safeSummary);
        return;
      }
      data.append(key, formData[key]);
    });
    data.append("itinerary", JSON.stringify(itineraryList));
    mainImages.forEach((file) => data.append("images", file));
    hotelMakkahImages.forEach((file) =>
      data.append("hotel_makkah_images", file),
    );
    hotelMadinahImages.forEach((file) =>
      data.append("hotel_madinah_images", file),
    );

    try {
      await axios.post("http://localhost:5000/api/products", data, {
        ...getAuthConfig(),
        headers: {
          ...getAuthConfig().headers,
          "Content-Type": "multipart/form-data",
        },
      });
      await notifySuccess("Berhasil", "Paket berhasil disimpan.");
      navigate("/dashboard/products");
    } catch (error) {
      console.error(error);
      await notifyError("Gagal", "Gagal menyimpan paket.");
    }
  };

  const handleSummaryImageUpload = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const payload = new FormData();
      payload.append("image", file);

      try {
        const res = await axios.post(
          "http://localhost:5000/api/products/editor-image",
          payload,
          {
            ...getAuthConfig(),
            headers: {
              ...getAuthConfig().headers,
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const editor = summaryEditorRef.current?.getEditor();
        if (!editor) return;
        const range = editor.getSelection(true) || {
          index: editor.getLength(),
          length: 0,
        };
        editor.insertEmbed(range.index, "image", res.data.imageUrl, "user");
        editor.setSelection(range.index + 1, 0);
      } catch (error) {
        console.error("Upload gambar editor gagal:", error);
        await notifyError("Upload Gagal", "Upload gambar gagal.");
      }
    };
  };

  const handlePickMainImages = (e) => {
    const files = Array.from(e.target.files || []);
    setMainImages(files);
    setMainPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handlePickHotelMakkahImages = (e) => {
    const files = Array.from(e.target.files || []);
    setHotelMakkahImages(files);
    setHotelMakkahPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handlePickHotelMadinahImages = (e) => {
    const files = Array.from(e.target.files || []);
    setHotelMadinahImages(files);
    setHotelMadinahPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const removePickedImage = (type, index) => {
    if (type === "main") {
      setMainImages((prev) => prev.filter((_, i) => i !== index));
      setMainPreviews((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    if (type === "makkah") {
      setHotelMakkahImages((prev) => prev.filter((_, i) => i !== index));
      setHotelMakkahPreviews((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setHotelMadinahImages((prev) => prev.filter((_, i) => i !== index));
    setHotelMadinahPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        paddingBottom: "100px",
        position: "relative",
      }}
    >
      {/* --- MODAL IMPORT POP-UP --- */}
      {showImportModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "16px",
              width: "600px",
              maxWidth: "90%",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Upload size={20} /> Import Itinerary Massal
            </h3>

            <div
              style={{
                background: "#f0f9ff",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "15px",
                fontSize: "13px",
                color: "#0c4a6e",
              }}
            >
              <strong>Panduan Format:</strong>
              <br />
              Gunakan kata kunci <code>Hari X:</code> atau <code>Day X:</code>{" "}
              untuk memisahkan setiap hari.
              <br />
              <br />
              <em>Contoh:</em>
              <br />
              Hari 1: Keberangkatan
              <br />
              Jamaah berkumpul di bandara...
              <br />
              <br />
              Hari 2: Tiba di Madinah
              <br />
              Check-in hotel dan istirahat...
            </div>

            <textarea
              rows="10"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontFamily: "monospace",
              }}
              placeholder="Paste teks itinerary Boss di sini..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            ></textarea>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowImportModal(false)}
                style={{ ...btnNavStyle, background: "#fff" }}
              >
                Batal
              </button>
              <button
                onClick={processImport}
                style={{
                  ...btnNavStyle,
                  background: "#0f172a",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <PlusCircle size={16} /> Proses & Masukkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="dash-header">
        <div className="dash-title">
          <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <PlusCircle size={28} color="#0f172a" /> Tambah Paket Pro
          </h2>
          <p>Input data lengkap dengan Itinerary sistem slide.</p>
        </div>
        <Link
          to="/dashboard/products"
          className="btn-add"
          style={{
            background: "#fff",
            color: "#333",
            border: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <ArrowLeft size={16} /> Batal
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}
      >
        {/* --- KOLOM KIRI --- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* INFO PAKET */}
          <div className="table-card" style={{ padding: "24px" }}>
            <h4
              style={{
                margin: "0 0 20px",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FileText size={20} /> Info Paket
            </h4>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Judul Paket</label>
              <input
                type="text"
                name="title"
                onChange={handleChange}
                style={inputStyle}
                placeholder="Contoh: Umroh Akbar 2026"
                required
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Deksripsi Program</label>
              <RichTextEditor
                editorRef={summaryEditorRef}
                value={formData.summary}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, summary: value }))
                }
                onImageUpload={handleSummaryImageUpload}
              />
            </div>

            {/* KATEGORI */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Kategori</label>
              <select
                name="category"
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="umroh">Umroh</option>
                <option value="haji">Haji Khusus</option>
                <option value="tour">Wisata Halal</option>
                <option value="umroh_plus">Umroh Plus</option>
              </select>
            </div>

            {/* HARGA VARIAN (INPUT HARGA LAMA SUDAH DIHAPUS) */}
            <div
              style={{
                background: "#f8fafc",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label
                style={{
                  ...labelStyle,
                  color: "#0f172a",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <DollarSign size={14} /> Varian Harga (Per Pax)
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: "#64748b",
                    }}
                  >
                    Quad (Sekamar 4)
                  </label>
                  <input
                    type="number"
                    name="price_quad"
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Rp..."
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: "#64748b",
                    }}
                  >
                    Triple (Sekamar 3)
                  </label>
                  <input
                    type="number"
                    name="price_triple"
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Rp..."
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: "#64748b",
                    }}
                  >
                    Double (Sekamar 2)
                  </label>
                  <input
                    type="number"
                    name="price_double"
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Rp..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ITINERARY WIZARD */}
          <div
            className="table-card"
            style={{ padding: "24px", border: "2px solid #e0e7ff" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  color: "#4338ca",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Plane size={20} /> Itinerary Planner
              </h4>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  style={{
                    fontSize: "12px",
                    background: "#e0f2fe",
                    color: "#0284c7",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Upload size={14} /> Import Teks
                </button>
                <div
                  style={{
                    fontSize: "12px",
                    background: "#e0e7ff",
                    color: "#4338ca",
                    padding: "6px 12px",
                    borderRadius: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Hari {activeDay} / {formData.duration}
                </div>
              </div>
            </div>

            <div
              style={{
                marginBottom: "20px",
                paddingBottom: "20px",
                borderBottom: "1px solid #eee",
              }}
            >
              <label style={labelStyle}>Total Durasi (Hari)</label>
              <input
                type="number"
                name="duration"
                min="1"
                value={formData.duration}
                onChange={handleDurationChange}
                style={{ ...inputStyle, width: "100px", fontWeight: "bold" }}
              />
              <span
                style={{ fontSize: "12px", color: "#666", marginLeft: "10px" }}
              >
                (Ubah manual atau gunakan Import Teks)
              </span>
            </div>

            <div
              style={{
                background: "#f8fafc",
                padding: "20px",
                borderRadius: "12px",
                animation: "fadeIn 0.3s",
              }}
            >
              <h5 style={{ marginTop: 0, color: "#0f172a" }}>
                Kegiatan Hari ke-{activeDay}
              </h5>
              <div style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>Judul Kegiatan</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="Contoh: Keberangkatan / Ziarah Makkah"
                  value={itineraryList[activeDay - 1]?.title || ""}
                  onChange={(e) =>
                    handleItineraryChange("title", e.target.value)
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Detail Aktivitas</label>
                <textarea
                  rows="4"
                  style={inputStyle}
                  placeholder="Jelaskan detail kegiatan hari ini..."
                  value={itineraryList[activeDay - 1]?.activity || ""}
                  onChange={(e) =>
                    handleItineraryChange("activity", e.target.value)
                  }
                ></textarea>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "20px",
              }}
            >
              <button
                onClick={prevDay}
                disabled={activeDay === 1}
                style={{
                  ...btnNavStyle,
                  opacity: activeDay === 1 ? 0.5 : 1,
                  cursor: activeDay === 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ChevronLeft size={16} /> Hari Sebelumnya
              </button>
              <button
                onClick={nextDay}
                disabled={activeDay === itineraryList.length}
                style={{
                  ...btnNavStyle,
                  background:
                    activeDay === itineraryList.length ? "#ccc" : "#0f172a",
                  cursor:
                    activeDay === itineraryList.length
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Hari Berikutnya <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* DETAIL LAINNYA */}
          <div className="table-card" style={{ padding: "24px" }}>
            <h4
              style={{
                margin: "0 0 20px",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <List size={20} /> Detail Fasilitas
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Termasuk (Included)</label>
                <textarea
                  name="included"
                  onChange={handleChange}
                  rows="4"
                  style={inputStyle}
                  placeholder="Tiket Pesawat, Visa, Hotel..."
                ></textarea>
              </div>
              <div>
                <label style={labelStyle}>Tidak Termasuk (Excluded)</label>
                <textarea
                  name="excluded"
                  onChange={handleChange}
                  rows="4"
                  style={inputStyle}
                  placeholder="Pembuatan Paspor, Vaksin..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* --- KOLOM KANAN --- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="table-card" style={{ padding: "24px" }}>
            <h4
              style={{
                margin: "0 0 20px",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Settings size={20} /> Pengaturan
            </h4>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Tanggal Keberangkatan</label>
              <input
                type="date"
                name="departure_date"
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Batas Pendaftaran (Closing)</label>
              <input
                type="date"
                name="closing_date"
                onChange={handleChange}
                style={inputStyle}
              />
              <small style={{ color: "#64748b", fontSize: "11px" }}>
                Lewat tanggal ini status jadi "Expired"
              </small>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Kuota Kursi</label>
                <input
                  type="number"
                  name="quota"
                  defaultValue={45}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Status Manual</label>
                <select
                  name="product_status"
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="open">Otomatis (Open)</option>
                  <option value="closed">Paksa Tutup</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Maskapai</label>
              <input
                type="text"
                name="airline"
                placeholder="Saudia / Garuda"
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {/* HOTEL */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Hotel Makkah</label>
              <input
                type="text"
                name="hotel_makkah"
                placeholder="Movenpick / setaraf"
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Hotel Madinah</label>
              <input
                type="text"
                name="hotel_madinah"
                placeholder="Ruve / setaraf"
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <ImagePickerField
              label="Galeri Hotel Makkah"
              hint="Bisa upload lebih dari 1 foto"
              previews={hotelMakkahPreviews}
              onPick={handlePickHotelMakkahImages}
              onRemove={(index) => removePickedImage("makkah", index)}
            />

            <ImagePickerField
              label="Galeri Hotel Madinah"
              hint="Bisa upload lebih dari 1 foto"
              previews={hotelMadinahPreviews}
              onPick={handlePickHotelMadinahImages}
              onRemove={(index) => removePickedImage("madinah", index)}
            />
          </div>

          <div className="table-card" style={{ padding: "24px" }}>
            <h4
              style={{
                margin: "0 0 20px",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ImageIcon size={20} /> Foto
            </h4>
            <ImagePickerField
              label="Foto Utama Produk"
              hint="Gambar pertama akan jadi cover di card"
              previews={mainPreviews}
              onPick={handlePickMainImages}
              onRemove={(index) => removePickedImage("main", index)}
            />
          </div>

          <button
            type="submit"
            className="btn-add"
            style={{
              width: "100%",
              padding: "16px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Save size={18} /> Simpan Paket
          </button>
        </div>
      </form>
    </div>
  );
};

// Styles (Sama)
const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: "700",
  color: "#64748b",
  marginBottom: "6px",
  textTransform: "uppercase",
};
const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  fontFamily: "inherit",
};
const btnNavStyle = {
  padding: "8px 16px",
  background: "#fff",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  color: "#334155",
};

export default AddProduct;
