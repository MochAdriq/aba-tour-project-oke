import React from "react";
import { useNavigate } from "react-router-dom";
import "./SearchBar.css";

const SearchBar = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = React.useState({
    program: "umroh",
    month: new Date().toISOString().slice(0, 7),
    pax: 2,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("program", filters.program);
    if (filters.month) params.set("month", filters.month);
    params.set("pax", String(filters.pax || 1));
    navigate(`/umroh?${params.toString()}`);
  };

  return (
    <form
      className="searchBar"
      role="search"
      aria-label="Pencarian paket"
      onSubmit={handleSubmit}
    >
      <div className="field">
        <div className="fieldIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
          </svg>
        </div>
        <div className="fieldContent">
          <label>Program</label>
          <select name="program" value={filters.program} onChange={handleChange}>
            <option value="umroh">Umroh</option>
            <option value="haji">Haji Khusus</option>
            <option value="tour">Wisata Halal</option>
            <option value="all">Semua Program</option>
          </select>
        </div>
      </div>

      <div className="field">
        <div className="fieldIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2Zm15 8H2v10h20V10Z" />
          </svg>
        </div>
        <div className="fieldContent">
          <label>Waktu Keberangkatan</label>
          <input
            type="month"
            name="month"
            value={filters.month}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="field">
        <div className="fieldIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14Z" />
          </svg>
        </div>
        <div className="fieldContent">
          <label>Jumlah Jamaah</label>
          <input
            type="number"
            min="1"
            name="pax"
            value={filters.pax}
            onChange={handleChange}
          />
        </div>
      </div>

      <button className="searchBtn" aria-label="Cari" type="submit">
        <svg viewBox="0 0 24 24">
          <path d="M10 2a8 8 0 1 0 5.3 14l4.7 4.7 1.4-1.4-4.7-4.7A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" />
        </svg>
      </button>
    </form>
  );
};

export default SearchBar;
