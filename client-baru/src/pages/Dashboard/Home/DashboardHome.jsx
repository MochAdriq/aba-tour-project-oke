import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { notifyApiError } from "../../../utils/notify";

const DashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/dashboard/summary",
        getAuthConfig(),
      );
      setSummary(res.data);
    } catch (err) {
      console.error(err);
      await notifyApiError(err, "Gagal memuat dashboard.", "Gagal Memuat Data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const cards = useMemo(() => {
    const bookingStats = summary?.booking_stats || {};
    const paymentStats = summary?.payment_stats || {};
    const totals = summary?.totals || {};

    return [
      {
        label: "Booking Pending",
        value: bookingStats.pending?.booking_count || 0,
        sub: `${bookingStats.pending?.pax_count || 0} pax`,
      },
      {
        label: "Booking Confirmed",
        value: bookingStats.confirmed?.booking_count || 0,
        sub: `${bookingStats.confirmed?.pax_count || 0} pax`,
      },
      {
        label: "Booking Paid",
        value: bookingStats.paid?.booking_count || 0,
        sub: `${bookingStats.paid?.pax_count || 0} pax`,
      },
      {
        label: "Payment Unpaid",
        value: paymentStats.unpaid || 0,
        sub: "Menunggu pembayaran",
      },
      {
        label: "Payment Failed",
        value: paymentStats.failed || 0,
        sub: "Perlu tindak lanjut",
      },
      {
        label: "Total Revenue",
        value: `Rp ${Number(totals.total_revenue_paid_confirmed || 0).toLocaleString("id-ID")}`,
        sub: "Confirmed + Paid",
      },
      {
        label: "Total Booking",
        value: totals.total_bookings || 0,
        sub: `${totals.total_pax_all || 0} pax keseluruhan`,
      },
      {
        label: "Paket Kuota Menipis",
        value: totals.low_quota_products || 0,
        sub: "Kuota <= 10 pax",
      },
    ];
  }, [summary]);

  const categoryStats = summary?.product_category_stats || {};
  const quotaDetails = summary?.quota_details || [];

  return (
    <div>
      <div className="dash-header">
        <div className="dash-title">
          <h2>Dashboard Admin</h2>
          <p>Ringkasan data booking, kategori paket, dan kuota terbaru.</p>
        </div>
        <button className="btn-add" onClick={loadSummary}>
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="table-card" style={{ padding: "30px", textAlign: "center" }}>
          Memuat data dashboard...
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            {cards.map((card) => (
              <div
                key={card.label}
                className="table-card"
                style={{ padding: "16px 18px" }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    marginBottom: "8px",
                  }}
                >
                  {card.label}
                </div>
                <div style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a" }}>
                  {card.value}
                </div>
                <div style={{ marginTop: "4px", fontSize: "12px", color: "#475569" }}>
                  {card.sub}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <div className="table-card" style={{ padding: "16px 18px" }}>
              <h4 style={{ marginTop: 0, marginBottom: "12px", color: "#0f172a" }}>
                Paket per Kategori
              </h4>
              <div style={{ display: "grid", gap: "8px" }}>
                {Object.keys(categoryStats).length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: "13px" }}>
                    Data kategori belum tersedia.
                  </div>
                ) : (
                  Object.entries(categoryStats).map(([category, count]) => (
                    <div
                      key={category}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "10px 12px",
                      }}
                    >
                      <span style={{ textTransform: "capitalize" }}>{category}</span>
                      <strong>{count} Paket</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="table-card" style={{ padding: "16px 18px" }}>
              <h4 style={{ marginTop: 0, marginBottom: "12px", color: "#0f172a" }}>
                Status Booking
              </h4>
              <div style={{ display: "grid", gap: "8px" }}>
                {["pending", "confirmed", "paid", "cancelled"].map((status) => (
                  <div
                    key={status}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                    }}
                  >
                    <span style={{ textTransform: "capitalize" }}>{status}</span>
                    <strong>
                      {summary?.booking_stats?.[status]?.booking_count || 0} booking
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="table-card">
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #f1f5f9" }}>
              <h4 style={{ margin: 0, color: "#0f172a" }}>
                Detail Kuota Paket (Top 100)
              </h4>
            </div>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Paket</th>
                  <th>Kategori</th>
                  <th>Kuota Saat Ini</th>
                  <th>Status</th>
                  <th>Keberangkatan</th>
                  <th>Closing</th>
                </tr>
              </thead>
              <tbody>
                {quotaDetails.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "28px" }}>
                      Belum ada data paket.
                    </td>
                  </tr>
                ) : (
                  quotaDetails.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{item.title}</td>
                      <td style={{ textTransform: "capitalize" }}>{item.category}</td>
                      <td>
                        <strong
                          style={{
                            color: Number(item.quota) <= 10 ? "#b91c1c" : "#166534",
                          }}
                        >
                          {item.quota} pax
                        </strong>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>
                        {item.product_status || "open"}
                      </td>
                      <td>
                        {item.departure_date
                          ? new Date(item.departure_date).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                      <td>
                        {item.closing_date
                          ? new Date(item.closing_date).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome;
