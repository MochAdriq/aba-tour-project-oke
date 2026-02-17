import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import RichTextEditor from "../../../components/RichTextEditor/RichTextEditor";
import ImagePickerField from "../../../components/ImagePickerField/ImagePickerField";
import {
  confirmAction,
  notifyError,
  notifySuccess,
} from "../../../utils/notify";
// Import Lucide Icons (Tambahkan DollarSign)
import {
  Pencil,
  ArrowLeft,
  FileText,
  Plane,
  Calendar,
  Image as ImageIcon, // Rename biar gak bentrok sama state image
  Save,
  ChevronLeft,
  ChevronRight,
  Settings,
  List,
  DollarSign, // <-- Icon Baru
} from "lucide-react";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // --- STATE DATA UTAMA (Update Field Baru) ---
  const [formData, setFormData] = useState({
    title: "",
    summary: "", // <-- BARU
    category: "umroh",
    price_quad: "", // <-- BARU
    price_triple: "", // <-- BARU
    price_double: "", // <-- BARU
    price: "", // Legacy (disimpan di background)
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

  const [itineraryList, setItineraryList] = useState([
    { day: 1, title: "", activity: "" },
  ]);
  const [activeDay, setActiveDay] = useState(1);
  const [mainImages, setMainImages] = useState([]);
  const [mainPreviews, setMainPreviews] = useState([]);
  const [oldMainImages, setOldMainImages] = useState([]);
  const [hotelMakkahImages, setHotelMakkahImages] = useState([]);
  const [hotelMakkahPreviews, setHotelMakkahPreviews] = useState([]);
  const [oldHotelMakkahImages, setOldHotelMakkahImages] = useState([]);
  const [hotelMadinahImages, setHotelMadinahImages] = useState([]);
  const [hotelMadinahPreviews, setHotelMadinahPreviews] = useState([]);
  const [oldHotelMadinahImages, setOldHotelMadinahImages] = useState([]);
  const summaryEditorRef = useRef(null);

  // --- AMBIL DATA ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/products/${id}`,
          getAuthConfig(),
        );
        const data = res.data;

        setFormData({
          title: data.title,
          slug: data.slug,
          summary: data.summary || "", // <-- Load Summary
          category: data.category,
          price: data.price,
          price_quad: data.price_quad || "", // <-- Load Harga Varian
          price_triple: data.price_triple || "",
          price_double: data.price_double || "",
          duration: data.duration,
          departure_date: data.departure_date
            ? data.departure_date.split("T")[0]
            : "",
          closing_date: data.closing_date
            ? data.closing_date.split("T")[0]
            : "",
          airline: data.airline,
          quota: data.quota,
          product_status: data.product_status,
          hotel_makkah: data.hotel_makkah,
          hotel_madinah: data.hotel_madinah,
          description: data.description,
          included: data.included,
          excluded: data.excluded,
        });

        if (data.itinerary) {
          const parsedItin =
            typeof data.itinerary === "string"
              ? JSON.parse(data.itinerary)
              : data.itinerary;
          setItineraryList(
            parsedItin.length > 0
              ? parsedItin
              : [{ day: 1, title: "", activity: "" }],
          );
        }

        if (data.image_urls) {
          try {
            const parsedMainImages =
              typeof data.image_urls === "string"
                ? JSON.parse(data.image_urls)
                : data.image_urls;
            setOldMainImages(
              Array.isArray(parsedMainImages) ? parsedMainImages : [],
            );
          } catch {
            setOldMainImages([]);
          }
        } else if (data.image_url) {
          setOldMainImages([data.image_url]);
        }

        if (data.hotel_makkah_images) {
          try {
            const parsedMakkahImages =
              typeof data.hotel_makkah_images === "string"
                ? JSON.parse(data.hotel_makkah_images)
                : data.hotel_makkah_images;
            setOldHotelMakkahImages(
              Array.isArray(parsedMakkahImages) ? parsedMakkahImages : [],
            );
          } catch {
            setOldHotelMakkahImages([]);
          }
        }

        if (data.hotel_madinah_images) {
          try {
            const parsedMadinahImages =
              typeof data.hotel_madinah_images === "string"
                ? JSON.parse(data.hotel_madinah_images)
                : data.hotel_madinah_images;
            setOldHotelMadinahImages(
              Array.isArray(parsedMadinahImages) ? parsedMadinahImages : [],
            );
          } catch {
            setOldHotelMadinahImages([]);
          }
        }
      } catch (error) {
        await notifyError("Gagal", "Gagal mengambil data paket!");
        console.error(error);
      }
    };
    fetchProduct();
  }, [id]);

  // --- LOGIC FORM ---
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleItineraryChange = (field, value) => {
    const updatedList = [...itineraryList];
    updatedList[activeDay - 1][field] = value;
    setItineraryList(updatedList);
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
      const shouldReduce = await confirmAction({
        title: "Kurangi Durasi?",
        text: `Data hari ${newDuration + 1}-${oldDuration} akan hilang.`,
        confirmButtonText: "Ya, lanjutkan",
      });
      if (shouldReduce) {
        setItineraryList(itineraryList.slice(0, newDuration));
        setFormData({ ...formData, duration: newDuration });
        if (activeDay > newDuration) setActiveDay(newDuration);
      } else {
        e.target.value = oldDuration;
      }
    }
  };

  const nextDay = (e) => {
    e.preventDefault();
    if (activeDay < itineraryList.length) setActiveDay(activeDay + 1);
  };
  const prevDay = (e) => {
    e.preventDefault();
    if (activeDay > 1) setActiveDay(activeDay - 1);
  };

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
    data.append("image_urls_existing", JSON.stringify(oldMainImages));
    data.append(
      "hotel_makkah_images_existing",
      JSON.stringify(oldHotelMakkahImages),
    );
    data.append(
      "hotel_madinah_images_existing",
      JSON.stringify(oldHotelMadinahImages),
    );
    data.append(
      "hotel_images_existing",
      JSON.stringify([...oldHotelMakkahImages, ...oldHotelMadinahImages]),
    );
    mainImages.forEach((file) => data.append("images", file));
    hotelMakkahImages.forEach((file) =>
      data.append("hotel_makkah_images", file),
    );
    hotelMadinahImages.forEach((file) =>
      data.append("hotel_madinah_images", file),
    );

    try {
      await axios.put(`http://localhost:5000/api/products/${id}`, data, {
        ...getAuthConfig(),
        headers: {
          ...getAuthConfig().headers,
          "Content-Type": "multipart/form-data",
        },
      });
      await notifySuccess("Berhasil", "Paket berhasil diupdate.");
      navigate("/dashboard/products");
    } catch (error) {
      console.error(error);
      await notifyError("Gagal", "Gagal update paket.");
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
      style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "100px" }}
    >
      {/* HEADER */}
      <div className="dash-header">
        <div className="dash-title">
          <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Pencil size={24} color="#0f172a" /> Edit Paket
          </h2>
          <p>Ubah informasi paket yang sudah ada.</p>
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
        {/* KOLOM KIRI */}
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
                value={formData.title}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Deskripsi Program</label>
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
                value={formData.category}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="umroh">Umroh</option>
                <option value="haji">Haji Khusus</option>
                <option value="umroh_plus">Umroh Plus</option>
                <option value="tour">Wisata Halal</option>
              </select>
            </div>

            {/* HARGA VARIAN (INPUT HARGA LAMA DIHAPUS) */}
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
                    value={formData.price_quad}
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
                    value={formData.price_triple}
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
                    value={formData.price_double}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Rp..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ITINERARY */}
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
            </div>

            <div
              style={{
                background: "#f8fafc",
                padding: "20px",
                borderRadius: "12px",
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
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={nextDay}
                disabled={activeDay === itineraryList.length}
                style={{
                  ...btnNavStyle,
                  background:
                    activeDay === itineraryList.length ? "#ccc" : "#0f172a",
                  color: activeDay === itineraryList.length ? "#333" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Next <ChevronRight size={16} />
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
                <label style={labelStyle}>Included (Termasuk)</label>
                <textarea
                  name="included"
                  value={formData.included}
                  onChange={handleChange}
                  rows="4"
                  style={inputStyle}
                ></textarea>
              </div>
              <div>
                <label style={labelStyle}>Excluded (Tidak Termasuk)</label>
                <textarea
                  name="excluded"
                  value={formData.excluded}
                  onChange={handleChange}
                  rows="4"
                  style={inputStyle}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* PENGATURAN */}
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
              <label style={labelStyle}>Keberangkatan</label>
              <input
                type="date"
                name="departure_date"
                value={formData.departure_date}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Closing Date</label>
              <input
                type="date"
                name="closing_date"
                value={formData.closing_date}
                onChange={handleChange}
                style={inputStyle}
              />
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
                <label style={labelStyle}>Kuota</label>
                <input
                  type="number"
                  name="quota"
                  value={formData.quota}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  name="product_status"
                  value={formData.product_status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="open">Otomatis</option>
                  <option value="closed">Paksa Tutup</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Maskapai</label>
              <input
                type="text"
                name="airline"
                value={formData.airline}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Hotel Makkah</label>
              <input
                type="text"
                name="hotel_makkah"
                value={formData.hotel_makkah}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Hotel Madinah</label>
              <input
                type="text"
                name="hotel_madinah"
                value={formData.hotel_madinah}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {oldHotelMakkahImages.length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>
                  Galeri Hotel Makkah Saat Ini:
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                  }}
                >
                  {oldHotelMakkahImages.map((imageName, index) => (
                    <img
                      key={`old-makkah-${index}`}
                      src={`http://localhost:5000/uploads/${imageName}`}
                      alt={`Makkah lama ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "78px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <ImagePickerField
              label="Tambah Galeri Hotel Makkah"
              hint="Upload tambahan foto hotel Makkah"
              previews={hotelMakkahPreviews}
              onPick={handlePickHotelMakkahImages}
              onRemove={(index) => removePickedImage("makkah", index)}
            />

            {oldHotelMadinahImages.length > 0 && (
              <div style={{ marginTop: "14px", marginBottom: "10px" }}>
                <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>
                  Galeri Hotel Madinah Saat Ini:
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                  }}
                >
                  {oldHotelMadinahImages.map((imageName, index) => (
                    <img
                      key={`old-madinah-${index}`}
                      src={`http://localhost:5000/uploads/${imageName}`}
                      alt={`Madinah lama ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "78px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <ImagePickerField
              label="Tambah Galeri Hotel Madinah"
              hint="Upload tambahan foto hotel Madinah"
              previews={hotelMadinahPreviews}
              onPick={handlePickHotelMadinahImages}
              onRemove={(index) => removePickedImage("madinah", index)}
            />
          </div>

          {/* FOTO */}
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
            <div style={{ marginTop: "8px" }}>
              <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>
                Galeri Foto Utama Saat Ini:
              </p>
              {oldMainImages.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                  Belum ada foto utama.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  {oldMainImages.map((imageName, index) => (
                    <img
                      key={`old-main-${index}`}
                      src={`http://localhost:5000/uploads/${imageName}`}
                      alt={`Foto utama lama ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "78px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  ))}
                </div>
              )}
              <ImagePickerField
                label="Tambah Foto Utama Produk"
                hint="Upload tambahan foto utama paket"
                previews={mainPreviews}
                onPick={handlePickMainImages}
                onRemove={(index) => removePickedImage("main", index)}
              />
            </div>
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
            <Save size={18} /> Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
};

// ... Styles (Sama seperti sebelumnya) ...

// Styles
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

export default EditProduct;
