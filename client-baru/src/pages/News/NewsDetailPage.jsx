import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, User2, Facebook, MessageCircle, Link2 } from "lucide-react";
import "./NewsDetailPage.css";
import { notifyError, notifySuccess } from "../../utils/notify";

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

const toAutoplayUrl = (rawUrl = "") => {
  const normalized = normalizeVideoEmbedUrl(rawUrl);
  if (!normalized) return "";
  try {
    const url = new URL(normalized);
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("mute", "1");
    return url.toString();
  } catch {
    return normalized;
  }
};

const NewsDetailPage = () => {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [latest, setLatest] = useState([]);
  const [sidebarPackages, setSidebarPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [detailRes, latestRes, productRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/news/${slug}`),
          axios.get("http://localhost:5000/api/news"),
          axios.get("http://localhost:5000/api/products"),
        ]);
        setItem(detailRes.data || null);
        setLatest(
          (latestRes.data || []).filter((x) => x.slug !== slug).slice(0, 5),
        );
        setSidebarPackages((productRes?.data || []).slice(0, 4));
      } catch (error) {
        console.error("Gagal memuat detail news:", error);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  const safeHtml = useMemo(() => {
    return DOMPurify.sanitize(item?.content || "", {
      USE_PROFILES: { html: true },
    });
  }, [item?.content]);

  const mainImage = useMemo(() => {
    const gallery = parseJsonArray(item?.gallery_images);
    return item?.cover_image || gallery[0] || "";
  }, [item?.cover_image, item?.gallery_images]);

  const getProductImage = (product) => {
    if (product?.image_url) return `http://localhost:5000/uploads/${product.image_url}`;
    try {
      const parsed = parseJsonArray(product?.image_urls);
      return parsed.length > 0 ? `http://localhost:5000/uploads/${parsed[0]}` : "";
    } catch {
      return "";
    }
  };

  const handleShare = async (type) => {
    const pageUrl = window.location.href;
    const text = item?.title || "News ABA Tour";
    if (type === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
        "_blank",
      );
      return;
    }
    if (type === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${text} - ${pageUrl}`)}`,
        "_blank",
      );
      return;
    }
    if (type === "x") {
      window.open(
        `https://x.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(text)}`,
        "_blank",
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(pageUrl);
      await notifySuccess("Berhasil", "Link artikel berhasil disalin.");
    } catch {
      await notifyError("Gagal", "Tidak bisa menyalin link.");
    }
  };

  if (loading) {
    return (
      <section className="section news-detail-page">Memuat artikel...</section>
    );
  }

  if (!item) {
    return (
      <section className="section news-detail-page">
        <div className="container">
          <div className="news-detail-empty">Artikel tidak ditemukan.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="section news-detail-page">
      <div className="container news-detail-layout">
        <article className="news-detail-card">
          <h1 className="news-detail-title">{item.title}</h1>

          <div className="news-detail-meta">
            <span>
              <User2 size={15} />
              {item.created_by || "Admin ABA Tour"}
            </span>
            <span>
              <CalendarDays size={15} />
              {formatDate(item.published_at || item.created_at)}
            </span>
          </div>

          <div
            className={`news-detail-media ${item.media_type === "video" ? "news-detail-media-video" : ""}`}
          >
            {item.media_type === "video" &&
            item.video_url &&
            isUrl(item.video_url) ? (
              <iframe
                className="news-detail-media-el"
                src={toAutoplayUrl(item.video_url)}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : mainImage ? (
              <img
                className="news-detail-media-el"
                src={`http://localhost:5000/uploads/${mainImage}`}
                alt={item.title}
              />
            ) : (
              <div className="news-detail-media-fallback">
                Media tidak tersedia
              </div>
            )}
          </div>

          <div
            className="news-detail-content"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          <div className="news-share-wrap">
            <span>Bagikan artikel ini:</span>
            <div className="news-share-buttons">
              <button type="button" onClick={() => handleShare("facebook")}>
                <Facebook size={15} /> Facebook
              </button>
              <button type="button" onClick={() => handleShare("whatsapp")}>
                <MessageCircle size={15} /> WhatsApp
              </button>
              <button type="button" onClick={() => handleShare("x")}>
                X
              </button>
              <button type="button" onClick={() => handleShare("copy")}>
                <Link2 size={15} /> Copy Link
              </button>
            </div>
          </div>
        </article>

        <aside className="news-detail-sidebar">
          <div className="news-detail-sidecard">
            <small>Paket Pilihan</small>
            <h3>Paket Umroh</h3>
            <div className="news-detail-package-list">
              {sidebarPackages.length === 0 ? (
                <div className="news-detail-side-empty">Belum ada paket.</div>
              ) : (
                sidebarPackages.map((pkg) => {
                  const pkgImage = getProductImage(pkg);
                  return (
                    <Link
                      to={`/product/${pkg.slug}`}
                      key={pkg.id}
                      className="news-detail-package-item"
                    >
                      <div className="news-detail-package-thumb-wrap">
                        {pkgImage ? (
                          <img
                            src={pkgImage}
                            alt={pkg.title}
                            className="news-detail-package-thumb"
                          />
                        ) : (
                          <div className="news-detail-package-thumb news-detail-package-thumb-fallback">
                            ABA TOUR
                          </div>
                        )}
                      </div>
                      <div className="news-detail-package-copy">
                        <strong>{pkg.title}</strong>
                        <span>
                          Rp{" "}
                          {Number(
                            pkg.price_quad ||
                              pkg.price_triple ||
                              pkg.price_double ||
                              pkg.price ||
                              0,
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            <Link to="/news" className="news-detail-side-btn">
              Lihat Semua News
            </Link>
          </div>

          <div className="news-detail-sidecard">
            <small>Artikel Lainnya</small>
            <h3>News Terbaru</h3>
            <div className="news-detail-side-list">
              {latest.length === 0 ? (
                <div className="news-detail-side-empty">
                  Belum ada artikel lain.
                </div>
              ) : (
                latest.map((news) => {
                  const gallery = parseJsonArray(news.gallery_images);
                  const image = news.cover_image || gallery[0] || "";
                  const videoThumb = toYoutubeThumbnail(news.video_url || "");
                  return (
                    <Link
                      to={`/news/${news.slug}`}
                      key={news.id}
                      className="news-detail-side-item"
                    >
                      <div className="news-detail-side-thumb-wrap">
                        {news.media_type === "video" && videoThumb ? (
                          <>
                            <img
                              src={videoThumb}
                              alt={news.title}
                              className="news-detail-side-thumb"
                            />
                            <span className="news-detail-side-video-badge">
                              Video
                            </span>
                          </>
                        ) : image ? (
                          <img
                            src={`http://localhost:5000/uploads/${image}`}
                            alt={news.title}
                            className="news-detail-side-thumb"
                          />
                        ) : (
                          <div className="news-detail-side-thumb news-detail-side-thumb-fallback">
                            ABA TOUR
                          </div>
                        )}
                      </div>
                      <div className="news-detail-side-copy">
                        <strong>{news.title}</strong>
                        <span>
                          {formatDate(news.published_at || news.created_at)}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            <Link to="/news" className="news-detail-side-btn">
              Lihat Semua News
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default NewsDetailPage;
