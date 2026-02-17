import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { CalendarDays, User2, ArrowRight } from "lucide-react";
import "./NewsGalleryPage.css";

const parseJsonArray = (value) => {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

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

const isUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());

const toYoutubeThumbnail = (rawUrl = "") => {
  const normalized = normalizeVideoEmbedUrl(rawUrl);
  try {
    const url = new URL(normalized);
    const segments = url.pathname.split("/").filter(Boolean);
    const embedIndex = segments.indexOf("embed");
    const id = embedIndex >= 0 ? segments[embedIndex + 1] : "";
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  } catch {
    return "";
  }
};

const NewsGalleryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/news")
      .then((res) => setItems(res.data || []))
      .catch((error) => {
        console.error("Gagal memuat data news:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  const normalizedItems = useMemo(
    () =>
      items.map((item) => {
        const gallery = parseJsonArray(item.gallery_images);
        const image = item.cover_image || gallery[0] || "";
        return {
          ...item,
          gallery,
          image,
          dateText: formatDate(item.published_at || item.created_at),
          authorText: item.created_by || "Admin ABA Tour",
        };
      }),
    [items],
  );

  return (
    <section className="section news-page">
      <div className="container">
        <div className="news-page-head">
          <small>Berita Terbaru</small>
          <h1>News & Gallery</h1>
          <p>Informasi terbaru seputar program, kegiatan, dan update ABA Tour.</p>
        </div>

        <div className="news-grid">
          {loading ? (
            <div className="news-empty">Memuat berita...</div>
          ) : normalizedItems.length === 0 ? (
            <div className="news-empty">Belum ada artikel dipublikasikan.</div>
          ) : (
            normalizedItems.map((item) => (
              <article className="news-card" key={item.id}>
                <div className="news-media-wrap">
                  {item.media_type === "video" && item.video_url && isUrl(item.video_url) ? (
                    toYoutubeThumbnail(item.video_url) ? (
                      <div className="news-video-preview-wrap">
                        <img
                          className="news-media"
                          src={toYoutubeThumbnail(item.video_url)}
                          alt={item.title}
                        />
                        <span className="news-video-badge">Video</span>
                      </div>
                    ) : (
                      <div className="news-media news-media-fallback">Video tersedia di detail</div>
                    )
                  ) : item.image ? (
                    <img
                      className="news-media"
                      src={`http://localhost:5000/uploads/${item.image}`}
                      alt={item.title}
                    />
                  ) : (
                    <div className="news-media news-media-fallback">ABA TOUR</div>
                  )}
                </div>

                <div className="news-card-body">
                  <h3>{item.title}</h3>
                  <div className="news-meta-row">
                    <span>
                      <User2 size={14} />
                      {item.authorText}
                    </span>
                    <span>
                      <CalendarDays size={14} />
                      {item.dateText}
                    </span>
                  </div>
                  <p>{item.excerpt || "Klik untuk membaca informasi lengkap."}</p>
                  <Link to={`/news/${item.slug}`} className="news-link">
                    Baca Selengkapnya <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsGalleryPage;
