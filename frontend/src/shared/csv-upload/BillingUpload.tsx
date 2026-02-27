import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Filter,
} from "lucide-react";
import { useDashboardStore } from "../../store/Dashboard.store";
import { uploadGridStyle, uploadTheme } from "./theme";
import { apiGet } from "../../services/http";
import { getApiErrorMessageWithRequestId } from "../../services/apiError";
import type {
  BillingUploadRecord,
  DashboardUploadMeta,
} from "./types";

type LoadStatus = "loading" | "success" | "error";
type PrimitiveDateInput = string | number | Date | null | undefined;
type SizeInput = number | string | null | undefined;

const isBillingUploadRecord = (value: unknown): value is BillingUploadRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate["uploadid"] === "string";
};

const getErrorMessage = (error: unknown): string => {
  return getApiErrorMessageWithRequestId(error, "Failed to load uploads.");
};

const BillingUploads = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState<LoadStatus>("loading");
  const [uploads, setUploads] = useState<BillingUploadRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");

  const uploadIds = useDashboardStore((s) => s.uploadIds);
  const toggleUploadId = useDashboardStore((s) => s.toggleUploadId);
  const clearUploadIds = useDashboardStore((s) => s.clearUploadIds);
  const setUploadIds = useDashboardStore((s) => s.setUploadIds);
  const setSelectedUploads = useDashboardStore((s) => s.setSelectedUploads);
  const dashboardPath = useDashboardStore((s) => s.dashboardPath);

  const formatBytes = (bytes: SizeInput) => {
    if (bytes == null) return "--";
    const sizes = ["B", "KB", "MB", "GB"];
    let v = Number(bytes);
    let i = 0;
    while (v >= 1024 && i < sizes.length - 1) {
      v = v / 1024;
      i += 1;
    }
    return `${v.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
  };

  const formatDate = (isoOrDate: PrimitiveDateInput) => {
    if (!isoOrDate) return "--";
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

  const formatDay = (yyyyMmDd: string | null | undefined) => {
    if (!yyyyMmDd) return "--";
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
      const response = await apiGet<unknown>("/api/etl/get-billing-uploads");
      const data = Array.isArray(response) ? response.filter(isBillingUploadRecord) : [];
      data.sort((a, b) => new Date(b.uploadedat ?? "").getTime() - new Date(a.uploadedat ?? "").getTime());
      setUploads(data);
      setStatus("success");
    } catch (err: unknown) {
      console.error("Failed to fetch uploads:", err);
      setErrorMessage(getErrorMessage(err));
      setStatus("error");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUploads();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!uploadIds.length) {
      setSelectedUploads([]);
      return;
    }

    if (!uploads.length) return;

    const uploadsById = new Map(uploads.map((u) => [u.uploadid, u]));
    const selectedMeta = uploadIds
      .map((id) => {
        const row = uploadsById.get(id);
        if (!row) return null;
        return {
          uploadId: id,
          filename: row.filename || "",
        };
      })
      .filter((item): item is DashboardUploadMeta => item !== null);

    setSelectedUploads(selectedMeta);
  }, [uploadIds, uploads, setSelectedUploads]);

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
        u.uploadedat,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [uploads, query]);

  const toggleRow = (id: string) => toggleUploadId(id);

  const isAllSelected =
    filteredUploads.length > 0 && filteredUploads.every((u) => uploadIds.includes(u.uploadid));

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
    <div className={uploadTheme.pageShell}>
      <div className={uploadTheme.pageGrid} style={uploadGridStyle} />

      <div className={uploadTheme.pageContainer}>
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className={`${uploadTheme.badge} mb-3`}>
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand-primary)]" />
              Data Sources
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
              Billing Uploads
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)] md:text-base">
              Select uploads to analyze in your dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/upload-csv-file-input")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${uploadTheme.secondaryButton}`}
            >
              Upload More or Connect Cloud
            </button>
            <button
              onClick={fetchUploads}
              className={`rounded-xl p-2.5 transition ${uploadTheme.secondaryButton}`}
              title="Refresh"
            >
              <RefreshCcw size={18} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="group relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-primary)]" />
            <input
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Search files, dates, or IDs..."
              className="w-full rounded-xl border border-[var(--border-light)] bg-white py-3 pl-10 pr-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary-soft)] shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {uploadIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-white px-4 py-2 shadow-sm"
              >
                <span className="text-sm font-semibold text-[var(--text-secondary)]">
                  {uploadIds.length} selected
                </span>
                <div className="mx-1 h-4 w-px bg-[var(--border-light)]" />
                <button
                  onClick={clearUploadIds}
                  className="rounded px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  Clear
                </button>
              </motion.div>
            )}

            <button
              onClick={() => navigate(dashboardPath)}
              disabled={uploadIds.length === 0}
              className={`group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all shadow-md ${
                uploadIds.length === 0
                  ? "cursor-not-allowed bg-[var(--bg-surface)] text-[var(--text-muted)] shadow-none border border-[var(--border-light)]"
                  : `${uploadTheme.primaryButton} active:translate-y-0 hover:-translate-y-0.5 hover:shadow-lg`
              }`}
            >
              Visualize Data{" "}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div className={`${uploadTheme.card} overflow-hidden`}>
          <AnimatePresence mode="wait">
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24"
              >
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-[var(--brand-primary)]" />
                <p className="font-medium text-[var(--text-secondary)]">Loading uploads...</p>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center px-4 py-20 text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <AlertCircle size={32} />
                </div>
                <h2 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
                  Failed to load uploads
                </h2>
                <p className="mb-6 max-w-sm text-[var(--text-secondary)]">{errorMessage}</p>
                <button
                  onClick={fetchUploads}
                  className={`rounded-lg px-5 py-2.5 font-medium transition-colors ${uploadTheme.secondaryButton}`}
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filteredUploads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--bg-surface)]">
                      <Filter className="h-8 w-8 text-[var(--text-muted)]" />
                    </div>
                    <h3 className="mb-1 text-lg font-bold text-[var(--text-primary)]">
                      {uploads.length === 0 ? "No uploads yet" : "No matching results"}
                    </h3>
                    <p className="max-w-xs text-sm text-[var(--text-secondary)]">
                      {uploads.length === 0
                        ? "Upload your first billing CSV to get started."
                        : "Try adjusting your search query."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-light)] bg-[var(--bg-surface)] text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          <th className="w-[60px] px-6 py-4 text-center">
                            <button
                              onClick={toggleSelectAll}
                              className="transition-colors hover:text-[var(--brand-primary)]"
                            >
                              {isAllSelected ? (
                                <CheckSquare size={18} className="text-[var(--brand-primary)]" />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-4">File Name</th>
                          <th className="px-6 py-4">Size</th>
                          <th className="whitespace-nowrap px-6 py-4">Billing Period</th>
                          <th className="whitespace-nowrap px-6 py-4">Uploaded</th>
                          <th className="px-6 py-4">ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-muted)]">
                        {filteredUploads.map((u) => {
                          const selected = uploadIds.includes(u.uploadid);
                          return (
                            <tr
                              key={u.uploadid}
                              onClick={() => toggleRow(u.uploadid)}
                              className={`group cursor-pointer text-sm transition-all ${
                                selected
                                  ? "bg-[var(--brand-primary-soft)]/60"
                                  : "hover:bg-[var(--bg-surface)]"
                              }`}
                            >
                              <td className="px-6 py-4 text-center">
                                <button className="text-[var(--text-muted)] transition-colors group-hover:text-[var(--brand-primary)]">
                                  {selected ? (
                                    <CheckSquare size={18} className="text-[var(--brand-primary)]" />
                                  ) : (
                                    <Square size={18} />
                                  )}
                                </button>
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                      selected
                                        ? "bg-white text-[var(--brand-primary)] shadow-sm"
                                        : "bg-[var(--bg-surface)] text-[var(--text-muted)]"
                                    }`}
                                  >
                                    <FileText size={20} />
                                  </div>
                                  <div className="min-w-[180px]">
                                    <div
                                      className={`font-semibold ${
                                        selected
                                          ? "text-[var(--brand-primary)]"
                                          : "text-[var(--text-primary)]"
                                      }`}
                                    >
                                      {u.filename || "Untitled.csv"}
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                      <Database size={12} />
                                      <span className="max-w-[140px] truncate">
                                        {u.clientid || "No Client"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 font-mono text-xs text-[var(--text-secondary)]">
                                {formatBytes(u.filesize)}
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex w-fit items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[var(--text-secondary)]">
                                  <Calendar size={14} className="text-[var(--text-muted)]" />
                                  <span className="text-xs font-medium">
                                    {formatDay(u.billingperiodstart)}{" "}
                                    <span className="mx-1 text-[var(--text-muted)]">-&gt;</span>{" "}
                                    {formatDay(u.billingperiodend)}
                                  </span>
                                </div>
                              </td>

                              <td className="px-6 py-4 text-[var(--text-secondary)]">
                                {formatDate(u.uploadedat)}
                              </td>

                              <td className="px-6 py-4">
                                <span className="select-all rounded border border-[var(--border-light)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-[10px] text-[var(--text-muted)]">
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
