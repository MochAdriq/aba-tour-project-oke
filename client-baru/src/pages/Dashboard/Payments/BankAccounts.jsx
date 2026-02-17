import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { notifyApiError, notifySuccess } from "../../../utils/notify";

const initialForm = {
  bank_name: "",
  account_number: "",
  account_holder: "",
  branch_info: "",
  is_active: 1,
};

const BankAccounts = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const loadChannels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/payments/channels/admin",
        getAuthConfig(),
      );
      setChannels(res.data.channels || []);
    } catch (error) {
      console.error(error);
      await notifyApiError(error, "Gagal memuat akun bank.", "Gagal Memuat Data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/payments/channels/admin/${editingId}`,
          { ...formData, is_active: Number(formData.is_active) },
          getAuthConfig(),
        );
      } else {
        await axios.post(
          "http://localhost:5000/api/payments/channels/admin",
          { ...formData, is_active: Number(formData.is_active) },
          getAuthConfig(),
        );
      }
      resetForm();
      loadChannels();
      await notifySuccess("Berhasil", "Akun bank berhasil disimpan.");
    } catch (error) {
      console.error(error);
      await notifyApiError(
        error,
        "Gagal menyimpan akun bank.",
        "Simpan Akun Bank Gagal",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (channel) => {
    setEditingId(channel.id);
    setFormData({
      bank_name: channel.bank_name || "",
      account_number: channel.account_number || "",
      account_holder: channel.account_holder || "",
      branch_info: channel.branch_info || "",
      is_active: Number(channel.is_active) ? 1 : 0,
    });
  };

  const handleToggle = async (id) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/payments/channels/admin/${id}/toggle-active`,
        {},
        getAuthConfig(),
      );
      loadChannels();
      await notifySuccess("Berhasil", "Status akun bank berhasil diperbarui.");
    } catch (error) {
      console.error(error);
      await notifyApiError(
        error,
        "Gagal mengubah status akun bank.",
        "Update Status Gagal",
      );
    }
  };

  return (
    <div>
      <div className="dash-header">
        <div className="dash-title">
          <h2>Manajemen Akun Bank</h2>
          <p>Kelola rekening yang ditampilkan ke user pada halaman pembayaran.</p>
        </div>
      </div>

      <div className="table-card" style={{ padding: "18px", marginBottom: "16px" }}>
        <h4 style={{ marginTop: 0 }}>{editingId ? "Edit Akun Bank" : "Tambah Akun Bank"}</h4>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          <input
            name="bank_name"
            value={formData.bank_name}
            onChange={handleChange}
            placeholder="Nama Bank"
            required
            style={inputStyle}
          />
          <input
            name="account_number"
            value={formData.account_number}
            onChange={handleChange}
            placeholder="Nomor Rekening"
            required
            style={inputStyle}
          />
          <input
            name="account_holder"
            value={formData.account_holder}
            onChange={handleChange}
            placeholder="Nama Pemilik Rekening"
            required
            style={inputStyle}
          />
          <input
            name="branch_info"
            value={formData.branch_info}
            onChange={handleChange}
            placeholder="Cabang (opsional)"
            style={inputStyle}
          />
          <select
            name="is_active"
            value={formData.is_active}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value={1}>Aktif</option>
            <option value={0}>Nonaktif</option>
          </select>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" className="btn-add" disabled={saving}>
              {saving ? "Menyimpan..." : editingId ? "Update" : "Tambah"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                  fontWeight: 700,
                  background: "#fff",
                }}
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Bank</th>
              <th>No. Rekening</th>
              <th>Nama Pemilik</th>
              <th>Cabang</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                  Memuat akun bank...
                </td>
              </tr>
            ) : channels.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                  Belum ada data akun bank.
                </td>
              </tr>
            ) : (
              channels.map((channel) => (
                <tr key={channel.id}>
                  <td>{channel.bank_name}</td>
                  <td>{channel.account_number}</td>
                  <td>{channel.account_holder}</td>
                  <td>{channel.branch_info || "-"}</td>
                  <td>
                    <span
                      className={`badge ${Number(channel.is_active) ? "booking-confirmed" : "booking-cancelled"}`}
                    >
                      {Number(channel.is_active) ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(channel)}
                        style={actionBtnStyle}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(channel.id)}
                        style={actionBtnStyle}
                      >
                        {Number(channel.is_active) ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "14px",
};

const actionBtnStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#fff",
  padding: "7px 10px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

export default BankAccounts;
