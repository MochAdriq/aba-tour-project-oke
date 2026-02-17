import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { notifyApiError, notifySuccess } from "../../../utils/notify";

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled", "paid"];
const PAYMENT_STATUS_OPTIONS = ["all", "unpaid", "paid", "failed", "refunded"];

const statusLabel = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  paid: "Paid",
};

const paymentStatusLabel = {
  unpaid: "Unpaid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

const proofStatusLabel = {
  pending: "Menunggu Verifikasi",
  verified: "Terverifikasi",
  rejected: "Ditolak",
};

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingLogs, setBookingLogs] = useState([]);
  const [paymentProofs, setPaymentProofs] = useState([]);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === "all"
          ? "http://localhost:5000/api/bookings"
          : `http://localhost:5000/api/bookings?status=${statusFilter}`;
      const paymentQuery =
        paymentStatusFilter === "all"
          ? ""
          : `${url.includes("?") ? "&" : "?"}payment_status=${paymentStatusFilter}`;
      const urlWithFilters = `${url}${paymentQuery}`;
      const queryPrefix = urlWithFilters.includes("?") ? "&" : "?";
      const pagingQuery = `${queryPrefix}page=${page}&limit=${limit}`;
      const withPaging = `${urlWithFilters}${pagingQuery}`;
      const queryPrefix2 = withPaging.includes("?") ? "&" : "?";
      const fullUrl = searchKeyword.trim()
        ? `${withPaging}${queryPrefix2}q=${encodeURIComponent(searchKeyword.trim())}`
        : withPaging;

      const res = await axios.get(fullUrl, getAuthConfig());
      const data = res.data;
      setBookings(data.items || []);
      setTotalItems(Number(data.pagination?.total || 0));
      setTotalPages(Number(data.pagination?.total_pages || 1));
    } catch (err) {
      console.error(err);
      await notifyApiError(err, "Gagal memuat data booking.", "Gagal Memuat Data");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentStatusFilter, searchKeyword, page, limit]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const updateStatus = async (bookingId, nextStatus) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/bookings/${bookingId}/status`,
        { status: nextStatus },
        getAuthConfig(),
      );
      loadBookings();
      await notifySuccess("Berhasil", "Status booking berhasil diperbarui.");
    } catch (err) {
      console.error(err);
      await notifyApiError(
        err,
        "Gagal update status booking.",
        "Update Status Gagal",
      );
    }
  };

  const openDetail = async (bookingId) => {
    try {
      setShowDetail(true);
      setDetailLoading(true);
      setPaymentProofs([]);
      const [detailRes, logRes, proofsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/bookings/${bookingId}`, getAuthConfig()),
        axios.get(
          `http://localhost:5000/api/bookings/${bookingId}/logs`,
          getAuthConfig(),
        ),
        axios.get(
          `http://localhost:5000/api/bookings/${bookingId}/payment-proofs`,
          getAuthConfig(),
        ),
      ]);
      setSelectedBooking(detailRes.data);
      setBookingLogs(logRes.data || []);
      setPaymentProofs(proofsRes.data?.items || []);
    } catch (err) {
      console.error(err);
      await notifyApiError(
        err,
        "Gagal memuat detail booking.",
        "Gagal Memuat Detail",
      );
      setShowDetail(false);
      setPaymentProofs([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const resetPage = () => setPage(1);
  const closeDetail = () => {
    setShowDetail(false);
    setSelectedBooking(null);
    setBookingLogs([]);
    setPaymentProofs([]);
  };

  return (
    <div>
      <div className="dash-header">
        <div className="dash-title">
          <h2>Kelola Booking</h2>
          <p>Monitoring, pencarian, payment status, dan kontrol booking.</p>
        </div>
        <div>
          <input
            type="text"
            placeholder="Cari kode/nama/WA/paket..."
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              resetPage();
            }}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              marginRight: "8px",
              minWidth: "260px",
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetPage();
            }}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              marginRight: "8px",
            }}
          >
            <option value="all">Semua Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {statusLabel[status]}
              </option>
            ))}
          </select>
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              resetPage();
            }}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              marginRight: "8px",
            }}
          >
            {PAYMENT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "Semua Payment" : paymentStatusLabel[status]}
              </option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              resetPage();
            }}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
            }}
          >
            <option value={10}>10 / halaman</option>
            <option value={20}>20 / halaman</option>
            <option value={50}>50 / halaman</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Paket</th>
              <th>Pemesan</th>
              <th>Komposisi</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "30px" }}>
                  Memuat booking...
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "30px" }}>
                  Belum ada booking.
                </td>
              </tr>
            ) : (
              bookings.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.booking_code}</strong>
                  </td>
                  <td>{item.product_title}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.customer_name}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {item.customer_phone}
                    </div>
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    Quad: {item.qty_quad} | Triple: {item.qty_triple} | Double:{" "}
                    {item.qty_double}
                    <div style={{ marginTop: "4px", color: "#475569" }}>
                      Total Pax: {item.total_pax}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: "#059669" }}>
                    Rp {Number(item.total_price || 0).toLocaleString("id-ID")}
                  </td>
                  <td>
                    <span className={`badge booking-${item.status}`}>
                      {statusLabel[item.status] || item.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge booking-${item.payment_status || "pending"}`}>
                      {paymentStatusLabel[item.payment_status] || item.payment_status || "-"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => openDetail(item.id)}
                      style={{
                        padding: "6px 8px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        marginRight: "8px",
                        cursor: "pointer",
                        background: "#fff",
                      }}
                    >
                      Detail
                    </button>
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      style={{
                        padding: "6px 8px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "12px",
                      }}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ color: "#475569", fontSize: "13px" }}>
          Total Data: <strong>{totalItems}</strong>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            style={{
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: page <= 1 ? "#f8fafc" : "#fff",
              cursor: page <= 1 ? "not-allowed" : "pointer",
            }}
          >
            Prev
          </button>
          <span style={{ fontSize: "13px", color: "#334155" }}>
            Halaman {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            style={{
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: page >= totalPages ? "#f8fafc" : "#fff",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>

      {showDetail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={closeDetail}
        >
          <aside
            style={{
              width: "420px",
              maxWidth: "92vw",
              height: "100%",
              background: "#fff",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
              padding: "20px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0, color: "#0f172a" }}>Detail Booking</h3>
              <button
                onClick={closeDetail}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "22px",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                x
              </button>
            </div>

            {detailLoading ? (
              <p>Memuat detail booking...</p>
            ) : !selectedBooking ? (
              <p>Data booking tidak tersedia.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px", fontSize: "14px" }}>
                <DetailRow label="Kode" value={selectedBooking.booking_code} />
                <DetailRow label="Paket" value={selectedBooking.product_title} />
                <DetailRow label="Pemesan" value={selectedBooking.customer_name} />
                <DetailRow label="WhatsApp" value={selectedBooking.customer_phone} />
                <DetailRow label="Email" value={selectedBooking.customer_email || "-"} />
                <DetailRow
                  label="Komposisi"
                  value={`Quad ${selectedBooking.qty_quad}, Triple ${selectedBooking.qty_triple}, Double ${selectedBooking.qty_double}`}
                />
                <DetailRow label="Total Pax" value={`${selectedBooking.total_pax} Orang`} />
                <DetailRow
                  label="Total Harga"
                  value={`Rp ${Number(selectedBooking.total_price || 0).toLocaleString("id-ID")}`}
                />
                <DetailRow
                  label="Status"
                  value={statusLabel[selectedBooking.status] || selectedBooking.status}
                />
                <DetailRow
                  label="Payment Status"
                  value={
                    paymentStatusLabel[selectedBooking.payment_status] ||
                    selectedBooking.payment_status ||
                    "-"
                  }
                />
                <DetailRow
                  label="Payment Method"
                  value={selectedBooking.payment_method || "-"}
                />
                <DetailRow
                  label="External Txn"
                  value={selectedBooking.external_txn_id || "-"}
                />
                <DetailRow label="Catatan Admin" value={selectedBooking.admin_note || "-"} />
                <DetailRow
                  label="Dibuat"
                  value={new Date(selectedBooking.created_at).toLocaleString("id-ID")}
                />

                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "#64748b",
                      marginBottom: "6px",
                      fontWeight: 700,
                    }}
                  >
                    Bukti Pembayaran
                  </div>

                  {paymentProofs.length === 0 ? (
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        background: "#fff",
                        fontSize: "13px",
                        color: "#64748b",
                      }}
                    >
                      User belum mengirimkan bukti pembayaran.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "10px" }}>
                      <div
                        style={{
                          border: "1px solid #bbf7d0",
                          borderRadius: "10px",
                          padding: "10px 12px",
                          background: "#f0fdf4",
                          fontSize: "13px",
                          color: "#166534",
                          fontWeight: 700,
                        }}
                      >
                        User sudah mengirimkan bukti pembayaran.
                      </div>

                      {paymentProofs.map((proof) => (
                        <div
                          key={proof.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "10px 12px",
                            background: "#fff",
                            display: "grid",
                            gap: "8px",
                          }}
                        >
                          <DetailRow
                            label="Status Verifikasi"
                            value={
                              proofStatusLabel[proof.verification_status] ||
                              proof.verification_status ||
                              "-"
                            }
                          />
                          <DetailRow
                            label="Bank Tujuan"
                            value={
                              proof.destination_bank_name
                                ? `${proof.destination_bank_name} - ${proof.destination_account_number} a.n. ${proof.destination_account_holder}`
                                : "-"
                            }
                          />
                          <DetailRow label="Pengirim" value={proof.sender_name || "-"} />
                          <DetailRow label="Bank Pengirim" value={proof.sender_bank || "-"} />
                          <DetailRow
                            label="Nominal Transfer"
                            value={`Rp ${Number(proof.amount || 0).toLocaleString("id-ID")}`}
                          />
                          <DetailRow
                            label="Tanggal Transfer"
                            value={
                              proof.transfer_date
                                ? new Date(proof.transfer_date).toLocaleDateString("id-ID")
                                : "-"
                            }
                          />
                          <DetailRow label="Catatan" value={proof.note || "-"} />

                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                textTransform: "uppercase",
                                color: "#64748b",
                                marginBottom: "6px",
                              }}
                            >
                              Dokumen Bukti
                            </div>
                            <a
                              href={`http://localhost:5000/uploads/payment-proofs/${proof.proof_image_url}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                marginBottom: "8px",
                                fontSize: "12px",
                                color: "#0369a1",
                                fontWeight: 700,
                                textDecoration: "underline",
                              }}
                            >
                              Lihat file asli
                            </a>
                            <img
                              src={`http://localhost:5000/uploads/payment-proofs/${proof.proof_image_url}`}
                              alt={`Bukti bayar ${proof.id}`}
                              style={{
                                width: "100%",
                                borderRadius: "10px",
                                border: "1px solid #e2e8f0",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "#64748b",
                      marginBottom: "6px",
                      fontWeight: 700,
                    }}
                  >
                    Log Status
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {bookingLogs.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Belum ada log status.
                      </div>
                    ) : (
                      bookingLogs.map((log) => (
                        <div
                          key={log.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            background: "#fff",
                            fontSize: "12px",
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {log.from_status || "-"} {" -> "} {log.to_status}
                          </div>
                          <div style={{ color: "#475569" }}>
                            Sumber: {log.source}
                            {log.changed_by_role ? ` (${log.changed_by_role})` : ""}
                          </div>
                          {log.note ? <div style={{ color: "#334155" }}>{log.note}</div> : null}
                          <div style={{ color: "#64748b" }}>
                            {new Date(log.created_at).toLocaleString("id-ID")}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div
    style={{
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "10px 12px",
      background: "#f8fafc",
    }}
  >
    <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b" }}>
      {label}
    </div>
    <div style={{ color: "#0f172a", fontWeight: 600, marginTop: "4px" }}>{value}</div>
  </div>
);

export default BookingList;
