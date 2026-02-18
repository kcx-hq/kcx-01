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
  CheckSquare,
  Square,
  UploadCloud,
  Filter,
  Trash2
} from "lucide-react";
import { useDashboardStore } from "../../store/Dashboard.store.jsx";

const BillingUploads = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [uploads, setUploads] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  // Global State
  const uploadIds = useDashboardStore((s) => s.uploadIds);
  const toggleUploadId = useDashboardStore((s) => s.toggleUploadId);
  const clearUploadIds = useDashboardStore((s) => s.clearUploadIds);
  const setUploadIds = useDashboardStore((s) => s.setUploadIds);
  const dashboardPath = useDashboardStore((s) => s.dashboardPath);

  // --- HELPERS ---
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
      const res = await axios.get(`${API_URL}/api/etl/get-billing-uploads`, { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : [];
      data.sort((a, b) => new Date(b.uploadedat) - new Date(a.uploadedat));
      setUploads(data);
      setStatus("success");
    } catch (err) {
      console.error("Failed to fetch uploads:", err);
      setErrorMessage(err?.response?.data?.message || "Failed to load uploads.");
      setStatus("error");
    }
  };

  useEffect(() => { fetchUploads(); }, []);

  const filteredUploads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return uploads;
    return uploads.filter((u) => {
      const haystack = [u.uploadid, u.filename, u.clientid, u.uploadedby, u.billingperiodstart, u.uploadedat]
        .filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [uploads, query]);

  const toggleRow = (id) => toggleUploadId(id);
  
  const isAllSelected = filteredUploads.length > 0 && filteredUploads.every((u) => uploadIds.includes(u.uploadid));

  const toggleSelectAll = () => {
    const idsOnScreen = filteredUploads.map((u) => u.uploadid);
    const prevSet = new Set(uploadIds);
    const allOnScreenSelected = idsOnScreen.every((id) => prevSet.has(id));

    if (allOnScreenSelected) {
      setUploadIds(uploadIds.filter((id) => !idsOnScreen.includes(id)));
    } else {
      setUploadIds(Array.from(new Set([...uploadIds, ...idsOnScreen])));
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] font-sans relative">
      
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-60"
        style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
              Data Sources
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#192630] tracking-tight">Billing Uploads</h1>
            <p className="text-slate-500 mt-2 max-w-2xl text-sm md:text-base">
              Select uploads to analyze in your dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/upload-csv-file-input")}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-all border border-slate-200 shadow-sm flex items-center gap-2 text-sm"
            >
              <UploadCloud size={16} /> Upload New
            </button>
            <button
              onClick={fetchUploads}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-[var(--brand-primary)] transition-all border border-slate-200 shadow-sm"
              title="Refresh"
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search */}
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--brand-primary)] transition-colors w-4 h-4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files, dates, or IDs..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary-soft)] transition-all shadow-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {uploadIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
              >
                <span className="text-sm font-semibold text-slate-600">
                  {uploadIds.length} selected
                </span>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <button
                  onClick={clearUploadIds}
                  className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  Clear
                </button>
              </motion.div>
            )}

            <button
              onClick={() => navigate(dashboardPath)}
              disabled={uploadIds.length === 0}
              className={`
                group px-5 py-3 rounded-xl font-bold text-sm transition-all inline-flex items-center gap-2 shadow-md
                ${uploadIds.length === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                }
              `}
            >
              Visualize Data <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* LOADING STATE */}
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24"
              >
                <Loader2 className="animate-spin text-[var(--brand-primary)] w-10 h-10 mb-4" />
                <p className="text-slate-500 font-medium">Loading uploads...</p>
              </motion.div>
            )}

            {/* ERROR STATE */}
            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center px-4"
              >
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
                  <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to load uploads</h2>
                <p className="text-slate-500 mb-6 max-w-sm">{errorMessage}</p>
                <button
                  onClick={fetchUploads}
                  className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {/* SUCCESS STATE */}
            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                {filteredUploads.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                      <Filter className="text-slate-400 w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      {uploads.length === 0 ? "No uploads yet" : "No matching results"}
                    </h3>
                    <p className="text-slate-500 max-w-xs text-sm">
                      {uploads.length === 0 ? "Upload your first billing CSV to get started." : "Try adjusting your search query."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="px-6 py-4 w-[60px] text-center">
                            <button onClick={toggleSelectAll} className="hover:text-[var(--brand-primary)] transition-colors">
                              {isAllSelected ? <CheckSquare size={18} className="text-[var(--brand-primary)]" /> : <Square size={18} />}
                            </button>
                          </th>
                          <th className="px-6 py-4">File Name</th>
                          <th className="px-6 py-4">Size</th>
                          <th className="px-6 py-4 whitespace-nowrap">Billing Period</th>
                          <th className="px-6 py-4 whitespace-nowrap">Uploaded</th>
                          <th className="px-6 py-4">ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUploads.map((u) => {
                          const selected = uploadIds.includes(u.uploadid);
                          return (
                            <tr
                              key={u.uploadid}
                              onClick={() => toggleRow(u.uploadid)}
                              className={`
                                group transition-all cursor-pointer text-sm
                                ${selected ? "bg-[var(--brand-primary-soft)]/30" : "hover:bg-slate-50"}
                              `}
                            >
                              <td className="px-6 py-4 text-center">
                                <button className="text-slate-400 group-hover:text-[var(--brand-primary)] transition-colors">
                                  {selected ? <CheckSquare size={18} className="text-[var(--brand-primary)]" /> : <Square size={18} />}
                                </button>
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                                    ${selected ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'bg-slate-100 text-slate-500'}
                                  `}>
                                    <FileText size={20} />
                                  </div>
                                  <div className="min-w-[180px]">
                                    <div className={`font-semibold ${selected ? 'text-[var(--brand-primary)]' : 'text-slate-700'}`}>
                                      {u.filename || "Untitled.csv"}
                                    </div>
                                    <div className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                                      <Database size={12} />
                                      <span className="truncate max-w-[140px]">{u.clientid || "No Client"}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                                {formatBytes(u.filesize)}
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 w-fit">
                                  <Calendar size={14} className="text-slate-400" />
                                  <span className="font-medium text-xs">
                                    {formatDay(u.billingperiodstart)} <span className="text-slate-300 mx-1">→</span> {formatDay(u.billingperiodend)}
                                  </span>
                                </div>
                              </td>

                              <td className="px-6 py-4 text-slate-500">
                                {formatDate(u.uploadedat)}
                              </td>

                              <td className="px-6 py-4">
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 select-all">
                                  {u.uploadid.substring(0, 8)}...
                                </span>
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
      </div>
    </div>
  );
};

export default BillingUploads;