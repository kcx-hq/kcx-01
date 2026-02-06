import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Calendar,
  Database,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useDashboardStore } from "../../store/Dashboard.store.jsx";

const BillingUploads = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [uploads, setUploads] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  // ✅ GLOBAL: selection from Zustand
  const uploadIds = useDashboardStore((s) => s.uploadIds);
  const toggleUploadId = useDashboardStore((s) => s.toggleUploadId);
  const clearUploadIds = useDashboardStore((s) => s.clearUploadIds);
  const setUploadIds = useDashboardStore((s) => s.setUploadIds);
  const dashboardPath = useDashboardStore((s) => s.dashboardPath);

  const formatBytes = (bytes) => {
    if (bytes == null) return "—";
    const sizes = ["B", "KB", "MB", "GB"];
    let v = Number(bytes);
    let i = 0;
    while (v >= 1024 && i < sizes.length - 1) {
      v = v / 1024;
      i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
  };

  const formatDate = (isoOrDate) => {
    if (!isoOrDate) return "—";
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDay = (yyyyMmDd) => {
    if (!yyyyMmDd) return "—";
    const d = new Date(`${yyyyMmDd}T00:00:00`);
    if (Number.isNaN(d.getTime())) return String(yyyyMmDd);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const fetchUploads = async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await axios.get(`${API_URL}/api/etl/get-billing-uploads`, {
        withCredentials: true,
      });

      const data = Array.isArray(res.data) ? res.data : [];
      data.sort((a, b) => new Date(b.uploadedat) - new Date(a.uploadedat));
      setUploads(data);
      setStatus("success");
    } catch (err) {
      console.error("Failed to fetch uploads:", err);

      if (err?.response?.data?.message) setErrorMessage(err.response.data.message);
      else if (err?.response?.data?.error) setErrorMessage(err.response.data.error);
      else if (err?.request) setErrorMessage("Cannot connect to backend server.");
      else setErrorMessage("Failed to load uploads.");

      setStatus("error");
    }
  };

  useEffect(() => {
    fetchUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUploads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return uploads;

    return uploads.filter((u) => {
      const haystack = [
        u.uploadid,
        u.filename,
        u.clientid,
        u.uploadedby,
        u.billingperiodstart,
        u.billingperiodend,
        u.uploadedat,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [uploads, query]);

  const toggleRow = (id) => toggleUploadId(id);

  const isAllSelected =
    filteredUploads.length > 0 &&
    filteredUploads.every((u) => uploadIds.includes(u.uploadid));

  const toggleSelectAll = () => {
    const idsOnScreen = filteredUploads.map((u) => u.uploadid);
    const prevSet = new Set(uploadIds);

    const allOnScreenSelected = idsOnScreen.every((id) => prevSet.has(id));

    if (allOnScreenSelected) {
      const next = uploadIds.filter((id) => !idsOnScreen.includes(id));
      setUploadIds(next);
    } else {
      const merged = new Set([...uploadIds, ...idsOnScreen]);
      setUploadIds(Array.from(merged));
    }
  };

  const clearSelection = () => clearUploadIds();

  return (
    <div className="min-h-screen bg-[#0f0f11] font-sans relative overflow-hidden">
      {/* Minimal background grid (no glow/pulse blobs) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/90 text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-[var(--brand-secondary)]" />
              Upload History
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Billing Uploads
            </h1>

            <p className="text-gray-400 text-lg mt-3 max-w-2xl leading-relaxed">
              Select one or more uploads to keep their IDs in{" "}
              <span className="text-gray-300 font-mono">uploadIds</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/upload-csv-file-input")}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors border border-white/10"
            >
              Upload another file
            </button>

            <button
              onClick={fetchUploads}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors inline-flex items-center gap-2 border border-white/10"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by filename, upload id, date..."
              className="
                w-full pl-10 pr-4 py-3 rounded-xl
                bg-white/5 border border-white/10
                text-white placeholder:text-gray-500
                outline-none
                focus:border-white/20
                transition
              "
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm">
              Selected:{" "}
              <span className="text-white font-semibold">{uploadIds.length}</span>
            </div>

            <button
              onClick={clearSelection}
              disabled={uploadIds.length === 0}
              className={`px-5 py-3 rounded-xl font-semibold transition-colors border ${
                uploadIds.length === 0
                  ? "bg-white/5 text-gray-600 border-white/10 cursor-not-allowed"
                  : "bg-white/10 hover:bg-white/15 text-white border-white/10"
              }`}
            >
              Clear
            </button>

            <button
              onClick={() => navigate(dashboardPath)}
              disabled={uploadIds.length === 0}
              className={`group px-6 py-3 rounded-xl font-bold transition-colors inline-flex items-center gap-2 border ${
                uploadIds.length === 0
                  ? "bg-white/5 text-gray-600 border-white/10 cursor-not-allowed"
                  : "bg-[var(--brand-secondary)] hover:opacity-90 text-white border-transparent"
              }`}
            >
              Open Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="rounded-2xl border border-white/10 bg-[#111113] overflow-hidden">
          <AnimatePresence mode="wait">
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[360px]"
              >
                <Loader2 className="animate-spin text-[var(--brand-secondary)] w-12 h-12 mb-4" />
                <p className="text-gray-400">Loading uploads...</p>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[360px] text-center p-10"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 text-red-400 border border-white/10">
                  <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Failed to load uploads
                </h2>
                <p className="text-gray-400 mb-8 max-w-md">{errorMessage}</p>
                <button
                  onClick={fetchUploads}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors border border-white/10"
                >
                  Retry
                </button>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredUploads.length === 0 ? (
                  <div className="min-h-[280px] flex flex-col items-center justify-center text-center p-10">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                      <FileText className="text-gray-400 w-9 h-9" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {uploads.length === 0 ? "No uploads yet" : "No results"}
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md">
                      {uploads.length === 0
                        ? "Upload a billing CSV to see it listed here."
                        : "Try a different search query."}
                    </p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 border-b border-white/10">
                        <tr className="text-gray-300 text-xs uppercase tracking-wider">
                          <th className="px-5 py-4 w-[56px]">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={toggleSelectAll}
                              className="h-4 w-4 accent-[var(--brand-secondary)] cursor-pointer"
                              title="Select all rows on screen"
                            />
                          </th>
                          <th className="px-5 py-4">File</th>
                          <th className="px-5 py-4">Size</th>
                          <th className="px-5 py-4">Billing Period</th>
                          <th className="px-5 py-4">Uploaded At</th>
                          <th className="px-5 py-4">Upload ID</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredUploads.map((u) => {
                          const selected = uploadIds.includes(u.uploadid);

                          return (
                            <tr
                              key={u.uploadid}
                              onClick={() => toggleRow(u.uploadid)}
                              className={`border-b border-white/10 cursor-pointer transition-colors ${
                                selected ? "bg-white/5" : "hover:bg-white/5"
                              }`}
                            >
                              <td className="px-5 py-4">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleRow(u.uploadid)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-4 w-4 accent-[var(--brand-secondary)] cursor-pointer"
                                />
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3 min-w-[220px]">
                                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <FileText className="text-white w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-white font-semibold truncate">
                                      {u.filename || "Untitled.csv"}
                                    </div>
                                    <div className="text-gray-500 text-xs flex items-center gap-2 mt-1">
                                      <Database className="w-3.5 h-3.5" />
                                      <span className="truncate">
                                        Client: {u.clientid || "—"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 text-gray-200 font-medium whitespace-nowrap">
                                {formatBytes(u.filesize)}
                              </td>

                              <td className="px-5 py-4">
                                <div className="inline-flex items-center gap-2 text-gray-200 font-medium whitespace-nowrap">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span>{formatDay(u.billingperiodstart)}</span>
                                  <span className="text-gray-600">→</span>
                                  <span>{formatDay(u.billingperiodend)}</span>
                                </div>
                              </td>

                              <td className="px-5 py-4 text-gray-200 font-medium whitespace-nowrap">
                                {formatDate(u.uploadedat)}
                              </td>

                              <td className="px-5 py-4">
                                <div className="font-mono text-xs text-gray-200 truncate max-w-[260px]">
                                  {u.uploadid}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Optional debug */}
        <div className="mt-4 text-xs text-gray-500">
          <span className="text-gray-400">uploadIds:</span>{" "}
          <span className="font-mono text-gray-300">
            {JSON.stringify(uploadIds)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BillingUploads;
