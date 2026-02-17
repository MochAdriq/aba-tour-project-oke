import React, { useRef, useState } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import RichTextEditor from "../../../components/RichTextEditor/RichTextEditor";
import { notifyApiError, notifySuccess } from "../../../utils/notify";

const normalizeVideoEmbedUrl = (rawUrl = "") => {
  const text = String(rawUrl || "").trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : text;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : text;
      }
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : text;
      }
      if (url.pathname.startsWith("/embed/")) {
        return text;
      }
    }
    return text;
  } catch {
    return text;
  }
};

const AddNews = () => {
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const [coverPreview, setCoverPreview] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [videoEmbedUrl, setVideoEmbedUrl] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    media_type: "image",
    published_at: "",
    is_published: "1",
  });

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    setCoverImage(file || null);
    setCoverPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []);
    setGalleryImages(files);
    setGalleryPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const removeGalleryItem = (index) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditorImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const payload = new FormData();
      payload.append("image", file);

      try {
        const res = await axios.post(
          "http://localhost:5000/api/news/editor-image",
          payload,
          {
            ...getAuthConfig(),
            headers: {
              ...getAuthConfig().headers,
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const editor = editorRef.current?.getEditor();
        if (!editor) return;
        const range = editor.getSelection(true) || {
          index: editor.getLength(),
          length: 0,
        };
        editor.insertEmbed(range.index, "image", res.data.imageUrl, "user");
        editor.setSelection(range.index + 1, 0);
      } catch (error) {
        await notifyApiError(error, "Upload gambar editor gagal.", "Upload Gagal");
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("excerpt", formData.excerpt);
    payload.append(
      "content",
      DOMPurify.sanitize(formData.content || "", {
        USE_PROFILES: { html: true },
      }),
    );
    payload.append("media_type", formData.media_type);
    payload.append("published_at", formData.published_at || "");
    payload.append("is_published", formData.is_published);
    if (formData.media_type === "image") {
      if (coverImage) payload.append("cover_image", coverImage);
      galleryImages.forEach((file) => payload.append("gallery_images", file));
    }
    if (formData.media_type === "video") {
      payload.append("video_embed_url", normalizeVideoEmbedUrl(videoEmbedUrl));
    }

    try {
      setSaving(true);
      await axios.post("http://localhost:5000/api/news/admin", payload, {
        ...getAuthConfig(),
        headers: {
          ...getAuthConfig().headers,
          "Content-Type": "multipart/form-data",
        },
      });
      await notifySuccess("Berhasil", "News & Gallery berhasil ditambahkan.");
      navigate("/dashboard/news");
    } catch (error) {
      await notifyApiError(error, "Gagal menambahkan data.", "Gagal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="dash-header">
        <div className="dash-title">
          <h2>Tambah News & Gallery</h2>
          <p>Artikel berita dengan dukungan galeri foto dan video.</p>
        </div>
        <Link
          to="/dashboard/news"
          className="btn-add"
          style={{
            background: "#fff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ArrowLeft size={16} /> Kembali
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="table-card" style={{ padding: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Judul Berita</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Tanggal Publish</label>
            <input
              type="date"
              name="published_at"
              value={formData.published_at}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Ringkasan Singkat</label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Konten Artikel</label>
          <RichTextEditor
            editorRef={editorRef}
            value={formData.content}
            onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
            onImageUpload={handleEditorImageUpload}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div>
            {formData.media_type === "image" ? (
              <>
                <label style={labelStyle}>Cover</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  style={inputStyle}
                />
                {coverPreview && (
                  <img
                    src={coverPreview}
                    alt="Preview cover"
                    style={previewStyle}
                  />
                )}
              </>
            ) : (
              <div style={emptyStyle}>
                Mode video aktif. Upload media pada field video di bawah.
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Tipe Media Utama</label>
            <select
              name="media_type"
              value={formData.media_type}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="image">Foto</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              name="is_published"
              value={formData.is_published}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="1">Publish</option>
              <option value="0">Draft</option>
            </select>
          </div>
        </div>

        {formData.media_type === "image" ? (
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Galeri Foto (Multi Upload)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleGalleryChange}
              style={inputStyle}
            />
            {galleryPreviews.length > 0 && (
              <div style={thumbGridStyle}>
                {galleryPreviews.map((url, index) => (
                  <div key={`gallery-new-${index}`} style={{ position: "relative" }}>
                    <img src={url} alt={`Gallery ${index + 1}`} style={thumbStyle} />
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(index)}
                      style={removeBtnStyle}
                      aria-label={`Hapus gambar ${index + 1}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Video Utama</label>
            <input
              type="url"
              value={videoEmbedUrl}
              onChange={(e) => setVideoEmbedUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/xxxxx"
              style={inputStyle}
            />
            {videoEmbedUrl && (
              <iframe
                style={videoStyle}
                src={normalizeVideoEmbedUrl(videoEmbedUrl)}
                title="Preview Embed Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        )}

        <button
          type="submit"
          className="btn-add"
          disabled={saving}
          style={{
            marginTop: 18,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Save size={16} /> {saving ? "Menyimpan..." : "Simpan News & Gallery"}
        </button>
      </form>
    </div>
  );
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  color: "#64748b",
  marginBottom: 6,
  fontWeight: 700,
  textTransform: "uppercase",
};

const inputStyle = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
  fontFamily: "inherit",
};

const previewStyle = {
  marginTop: 10,
  width: "100%",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  maxHeight: 260,
  objectFit: "cover",
};

const thumbGridStyle = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
};

const thumbStyle = {
  width: "100%",
  height: 82,
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
};

const removeBtnStyle = {
  position: "absolute",
  top: 4,
  right: 4,
  width: 20,
  height: 20,
  borderRadius: 999,
  border: "none",
  background: "rgba(15,23,42,0.8)",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const videoStyle = {
  marginTop: 10,
  width: "100%",
  minHeight: 240,
  borderRadius: 10,
  border: "1px solid #e2e8f0",
};

const emptyStyle = {
  border: "1px dashed #cbd5e1",
  borderRadius: 10,
  padding: "12px 14px",
  color: "#64748b",
  fontSize: 13,
};

export default AddNews;
