import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { Save, ChevronLeft, ChevronRight } from "lucide-react";
import RichTextEditor from "../../../components/RichTextEditor/RichTextEditor";
import ImagePickerField from "../../../components/ImagePickerField/ImagePickerField";
import { notifyApiError, notifySuccess } from "../../../utils/notify";
import "./HajiKhususForm.css";

const initialForm = {
  title: "",
  summary: "",
  price_quad: "",
  price_triple: "",
  price_double: "",
  duration: 1,
  departure_date: "",
  closing_date: "",
  airline: "",
  quota: 0,
  product_status: "open",
  hotel_makkah: "",
  hotel_madinah: "",
  description: "",
  included: "",
  excluded: "",
};

const parseJsonArray = (value) => {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const HajiKhususForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [itineraryList, setItineraryList] = useState([{ day: 1, title: "", activity: "" }]);
  const [activeDay, setActiveDay] = useState(1);
  const summaryEditorRef = useRef(null);

  const [oldMainImages, setOldMainImages] = useState([]);
  const [oldHotelMakkahImages, setOldHotelMakkahImages] = useState([]);
  const [oldHotelMadinahImages, setOldHotelMadinahImages] = useState([]);
  const [mainImages, setMainImages] = useState([]);
  const [hotelMakkahImages, setHotelMakkahImages] = useState([]);
  const [hotelMadinahImages, setHotelMadinahImages] = useState([]);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "http://localhost:5000/api/haji-khusus/admin",
          getAuthConfig(),
        );
        const item = res.data?.item;
        if (!item) return;

        setFormData({
          title: item.title || "",
          summary: item.summary || "",
          price_quad: item.price_quad || "",
          price_triple: item.price_triple || "",
          price_double: item.price_double || "",
          duration: Number(item.duration || 1),
          departure_date: item.departure_date ? item.departure_date.split("T")[0] : "",
          closing_date: item.closing_date ? item.closing_date.split("T")[0] : "",
          airline: item.airline || "",
          quota: Number(item.quota || 0),
          product_status: item.product_status || "open",
          hotel_makkah: item.hotel_makkah || "",
          hotel_madinah: item.hotel_madinah || "",
          description: item.description || "",
          included: item.included || "",
          excluded: item.excluded || "",
        });

        const parsedItinerary =
          typeof item.itinerary === "string" ? JSON.parse(item.itinerary || "[]") : item.itinerary;
        if (Array.isArray(parsedItinerary) && parsedItinerary.length > 0) {
          setItineraryList(parsedItinerary);
          setActiveDay(1);
        }

        const parsedMainImages = parseJsonArray(item.image_urls);
        setOldMainImages(
          parsedMainImages.length ? parsedMainImages : item.image_url ? [item.image_url] : [],
        );
        setOldHotelMakkahImages(parseJsonArray(item.hotel_makkah_images));
        setOldHotelMadinahImages(parseJsonArray(item.hotel_madinah_images));
      } catch (error) {
        await notifyApiError(error, "Gagal memuat data Haji Khusus.", "Gagal Memuat Data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mainPreviews = useMemo(
    () => mainImages.map((file) => URL.createObjectURL(file)),
    [mainImages],
  );
  const makkahPreviews = useMemo(
    () => hotelMakkahImages.map((file) => URL.createObjectURL(file)),
    [hotelMakkahImages],
  );
  const madinahPreviews = useMemo(
    () => hotelMadinahImages.map((file) => URL.createObjectURL(file)),
    [hotelMadinahImages],
  );

  useEffect(
    () => () => {
      mainPreviews.forEach((url) => URL.revokeObjectURL(url));
      makkahPreviews.forEach((url) => URL.revokeObjectURL(url));
      madinahPreviews.forEach((url) => URL.revokeObjectURL(url));
    },
    [mainPreviews, makkahPreviews, madinahPreviews],
  );

  const mergedMainPreviews = [
    ...oldMainImages.map((name) => `http://localhost:5000/uploads/${name}`),
    ...mainPreviews,
  ];
  const mergedMakkahPreviews = [
    ...oldHotelMakkahImages.map((name) => `http://localhost:5000/uploads/${name}`),
    ...makkahPreviews,
  ];
  const mergedMadinahPreviews = [
    ...oldHotelMadinahImages.map((name) => `http://localhost:5000/uploads/${name}`),
    ...madinahPreviews,
  ];

  const removeMainImageAt = (index) => {
    if (index < oldMainImages.length) {
      setOldMainImages((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    const localIndex = index - oldMainImages.length;
    setMainImages((prev) => prev.filter((_, i) => i !== localIndex));
  };

  const removeMakkahImageAt = (index) => {
    if (index < oldHotelMakkahImages.length) {
      setOldHotelMakkahImages((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    const localIndex = index - oldHotelMakkahImages.length;
    setHotelMakkahImages((prev) => prev.filter((_, i) => i !== localIndex));
  };

  const removeMadinahImageAt = (index) => {
    if (index < oldHotelMadinahImages.length) {
      setOldHotelMadinahImages((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    const localIndex = index - oldHotelMadinahImages.length;
    setHotelMadinahImages((prev) => prev.filter((_, i) => i !== localIndex));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDurationChange = (e) => {
    const newDuration = Math.max(1, Number(e.target.value || 1));
    const oldDuration = itineraryList.length;

    if (newDuration > oldDuration) {
      const additions = [];
      for (let day = oldDuration + 1; day <= newDuration; day += 1) {
        additions.push({ day, title: "", activity: "" });
      }
      setItineraryList((prev) => [...prev, ...additions]);
    } else if (newDuration < oldDuration) {
      setItineraryList((prev) => prev.slice(0, newDuration));
      if (activeDay > newDuration) setActiveDay(newDuration);
    }
    setFormData((prev) => ({ ...prev, duration: newDuration }));
  };

  const handleItineraryChange = (field, value) => {
    setItineraryList((prev) =>
      prev.map((item, idx) =>
        idx === activeDay - 1 ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSummaryImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const data = new FormData();
      data.append("image", file);

      try {
        const res = await axios.post(
          "http://localhost:5000/api/haji-khusus/editor-image",
          data,
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
        const range = editor.getSelection(true) || { index: editor.getLength(), length: 0 };
        editor.insertEmbed(range.index, "image", res.data.imageUrl, "user");
        editor.setSelection(range.index + 1, 0);
      } catch (error) {
        await notifyApiError(error, "Upload gambar gagal.", "Upload Gagal");
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    const safeSummary = DOMPurify.sanitize(formData.summary || "", {
      USE_PROFILES: { html: true },
    });

    Object.entries({ ...formData, summary: safeSummary }).forEach(([key, value]) => {
      payload.append(key, value);
    });

    payload.append("itinerary", JSON.stringify(itineraryList));
    payload.append("image_urls_existing", JSON.stringify(oldMainImages));
    payload.append("hotel_makkah_images_existing", JSON.stringify(oldHotelMakkahImages));
    payload.append("hotel_madinah_images_existing", JSON.stringify(oldHotelMadinahImages));
    payload.append(
      "hotel_images_existing",
      JSON.stringify([...oldHotelMakkahImages, ...oldHotelMadinahImages]),
    );

    mainImages.forEach((file) => payload.append("images", file));
    hotelMakkahImages.forEach((file) => payload.append("hotel_makkah_images", file));
    hotelMadinahImages.forEach((file) => payload.append("hotel_madinah_images", file));

    try {
      setSaving(true);
      await axios.post("http://localhost:5000/api/haji-khusus/admin", payload, {
        ...getAuthConfig(),
        headers: {
          ...getAuthConfig().headers,
          "Content-Type": "multipart/form-data",
        },
      });
      await notifySuccess("Berhasil", "Data Haji Khusus berhasil disimpan.");
    } catch (error) {
      await notifyApiError(error, "Gagal menyimpan data Haji Khusus.", "Simpan Gagal");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="table-card hk-loading-card">Memuat data Haji Khusus...</div>;
  }

  return (
    <div>
      <div className="dash-header">
        <div className="dash-title">
          <h2>Pengelolaan Haji Khusus</h2>
          <p>Form tunggal untuk mengatur konten halaman Haji Khusus.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="table-card hk-form-card">
        <div className="hk-grid hk-grid-2">
          <div>
            <label className="hk-label">Judul Program</label>
            <input name="title" value={formData.title} onChange={handleChange} className="hk-input" required />
          </div>
          <div>
            <label className="hk-label">Airline</label>
            <input name="airline" value={formData.airline} onChange={handleChange} className="hk-input" />
          </div>
        </div>

        <div className="hk-grid hk-grid-3">
          <div>
            <label className="hk-label">Harga Quad</label>
            <input name="price_quad" type="number" value={formData.price_quad} onChange={handleChange} className="hk-input" required />
          </div>
          <div>
            <label className="hk-label">Harga Triple</label>
            <input name="price_triple" type="number" value={formData.price_triple} onChange={handleChange} className="hk-input" required />
          </div>
          <div>
            <label className="hk-label">Harga Double</label>
            <input name="price_double" type="number" value={formData.price_double} onChange={handleChange} className="hk-input" required />
          </div>
        </div>

        <div className="hk-grid hk-grid-4">
          <div>
            <label className="hk-label">Durasi (hari)</label>
            <input name="duration" type="number" min={1} value={formData.duration} onChange={handleDurationChange} className="hk-input" />
          </div>
          <div>
            <label className="hk-label">Kuota</label>
            <input name="quota" type="number" min={0} value={formData.quota} onChange={handleChange} className="hk-input" />
          </div>
          <div>
            <label className="hk-label">Tanggal Berangkat</label>
            <input name="departure_date" type="date" value={formData.departure_date} onChange={handleChange} className="hk-input" />
          </div>
          <div>
            <label className="hk-label">Tanggal Closing</label>
            <input name="closing_date" type="date" value={formData.closing_date} onChange={handleChange} className="hk-input" />
          </div>
        </div>

        <div className="hk-grid hk-grid-3">
          <div>
            <label className="hk-label">Status</label>
            <select name="product_status" value={formData.product_status} onChange={handleChange} className="hk-input">
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="hk-label">Hotel Makkah</label>
            <input name="hotel_makkah" value={formData.hotel_makkah} onChange={handleChange} className="hk-input" />
          </div>
          <div>
            <label className="hk-label">Hotel Madinah</label>
            <input name="hotel_madinah" value={formData.hotel_madinah} onChange={handleChange} className="hk-input" />
          </div>
        </div>

        <label className="hk-label">Ringkasan Program (Rich Text)</label>
        <RichTextEditor
          value={formData.summary}
          onChange={(html) => setFormData((prev) => ({ ...prev, summary: html }))}
          onImageUpload={handleSummaryImageUpload}
          editorRef={summaryEditorRef}
        />

        <div className="hk-section-gap">
          <ImagePickerField
            label="Galeri Utama"
            hint="Gambar slider hero di halaman Haji Khusus."
            previews={mergedMainPreviews}
            onPick={(e) => setMainImages(Array.from(e.target.files || []))}
            onRemove={removeMainImageAt}
          />
        </div>

        <div className="hk-section-gap">
          <ImagePickerField
            label="Galeri Hotel Makkah"
            hint="Gambar slider hotel Makkah."
            previews={mergedMakkahPreviews}
            onPick={(e) => setHotelMakkahImages(Array.from(e.target.files || []))}
            onRemove={removeMakkahImageAt}
          />
        </div>

        <div className="hk-section-gap">
          <ImagePickerField
            label="Galeri Hotel Madinah"
            hint="Gambar slider hotel Madinah."
            previews={mergedMadinahPreviews}
            onPick={(e) => setHotelMadinahImages(Array.from(e.target.files || []))}
            onRemove={removeMadinahImageAt}
          />
        </div>

        <div className="hk-section-gap hk-itinerary-wrap">
          <label className="hk-label">Itinerary Harian</label>
          <div className="hk-day-tabs-wrap">
            <button type="button" className="hk-day-nav-btn" onClick={() => setActiveDay((d) => Math.max(1, d - 1))}>
              <ChevronLeft size={16} />
            </button>
            {itineraryList.map((item) => (
              <button
                key={item.day}
                type="button"
                className={item.day === activeDay ? "hk-day-btn hk-day-btn-active" : "hk-day-btn"}
                onClick={() => setActiveDay(item.day)}
              >
                Hari {item.day}
              </button>
            ))}
            <button
              type="button"
              className="hk-day-nav-btn"
              onClick={() =>
                setActiveDay((d) => Math.min(itineraryList.length || 1, d + 1))
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="hk-grid hk-grid-2">
            <div>
              <label className="hk-label">Judul Hari {activeDay}</label>
              <input
                value={itineraryList[activeDay - 1]?.title || ""}
                onChange={(e) => handleItineraryChange("title", e.target.value)}
                className="hk-input"
              />
            </div>
            <div>
              <label className="hk-label">Aktivitas Hari {activeDay}</label>
              <textarea
                rows={4}
                value={itineraryList[activeDay - 1]?.activity || ""}
                onChange={(e) => handleItineraryChange("activity", e.target.value)}
                className="hk-input hk-textarea"
              />
            </div>
          </div>
        </div>

        <div className="hk-grid hk-grid-3">
          <div>
            <label className="hk-label">Deskripsi Tambahan</label>
            <textarea rows={4} name="description" value={formData.description} onChange={handleChange} className="hk-input hk-textarea" />
          </div>
          <div>
            <label className="hk-label">Include</label>
            <textarea rows={4} name="included" value={formData.included} onChange={handleChange} className="hk-input hk-textarea" />
          </div>
          <div>
            <label className="hk-label">Exclude</label>
            <textarea rows={4} name="excluded" value={formData.excluded} onChange={handleChange} className="hk-input hk-textarea" />
          </div>
        </div>

        <button type="submit" className="btn-add hk-save-btn" disabled={saving}>
          <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Haji Khusus"}
        </button>
      </form>
    </div>
  );
};

export default HajiKhususForm;
