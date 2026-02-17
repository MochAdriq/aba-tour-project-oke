import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import "./HomeNewsSection.css";

const parseJsonArray = (value) => {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    }
    return text;
  } catch {
    return text;
  }
};

const toYoutubeThumbnail = (rawUrl = "") => {
  const normalized = normalizeVideoEmbedUrl(rawUrl);
  try {
    const url = new URL(normalized);
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("embed");
    const id = idx >= 0 ? parts[idx + 1] : "";
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  } catch {
    return "";
  }
};

const HomeNewsSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/news")
      .then((res) => setItems((res.data || []).slice(0, 3)))
      .catch((error) => {
        console.error("Gagal memuat berita beranda:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  const normalized = useMemo(
    () =>
      items.map((item) => {
        const gallery = parseJsonArray(item.gallery_images);
        const image = item.cover_image || gallery[0] || "";
        const videoThumb = toYoutubeThumbnail(item.video_url || "");
        return {
          ...item,
          image,
          videoThumb,
          dateText: new Date(item.published_at || item.created_at).toLocaleDateString(
            "id-ID",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            },
          ),
        };
      }),
    [items],
  );

  return (
    <section className="section home-news">
      <div className="container">
        <div className="home-news-head">
          <div>
            <small>News Update</small>
            <h2>Berita Terbaru</h2>
          </div>
          <Link to="/news" className="home-news-more">
            Lihat Semua News <ArrowRight size={16} />
          </Link>
        </div>

        <div className="home-news-grid">
          {loading ? (
            <div className="home-news-empty">Memuat berita...</div>
          ) : normalized.length === 0 ? (
            <div className="home-news-empty">Belum ada berita terbaru.</div>
          ) : (
            normalized.map((item) => (
              <article key={item.id} className="home-news-card">
                <div className="home-news-thumb-wrap">
                  {item.media_type === "video" && item.videoThumb ? (
                    <>
                      <img
                        className="home-news-thumb"
                        src={item.videoThumb}
                        alt={item.title}
                      />
                      <span className="home-news-video-badge">Video</span>
                    </>
                  ) : item.image ? (
                    <img
                      className="home-news-thumb"
                      src={`http://localhost:5000/uploads/${item.image}`}
                      alt={item.title}
                    />
                  ) : (
                    <div className="home-news-thumb home-news-thumb-fallback">
                      ABA TOUR
                    </div>
                  )}
                </div>

                <div className="home-news-body">
                  <h3>{item.title}</h3>
                  <span className="home-news-date">
                    <CalendarDays size={14} />
                    {item.dateText}
                  </span>
                  <p>{item.excerpt || "Klik untuk membaca detail artikel terbaru."}</p>
                  <Link to={`/news/${item.slug}`} className="home-news-link">
                    Baca Artikel <ArrowRight size={14} />
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

export default HomeNewsSection;
