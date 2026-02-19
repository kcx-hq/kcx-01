import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ChevronRight,
  FileText,
  Folder,
  Loader2,
  X,
} from "lucide-react";
import { useDashboardStore } from "../../store/Dashboard.store";
import { uploadTheme } from "./theme";

function formatSize(bytes) {
  if (bytes == null) return "--";
  const sizes = ["B", "KB", "MB", "GB"];
  let value = Number(bytes);
  let index = 0;
  while (value >= 1024 && index < sizes.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 2)} ${sizes[index]}`;
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CloudFileManagerPanel = ({ cloudConfig }) => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFileMeta, setSelectedFileMeta] = useState({});
  const [actionMessage, setActionMessage] = useState("");
  const [ingestingPath, setIngestingPath] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [lastIngestedUploadIds, setLastIngestedUploadIds] = useState([]);

  const setUploadIds = useDashboardStore((s) => s.setUploadIds);
  const setSelectedUploads = useDashboardStore((s) => s.setSelectedUploads);
  const dashboardPath = useDashboardStore((s) => s.dashboardPath);

  const breadcrumbs = useMemo(() => {
    const clean = String(currentPath || "").replace(/\/$/, "");
    if (!clean) return [];
    return clean.split("/").filter(Boolean);
  }, [currentPath]);

  const loadPath = async (pathValue) => {
    setLoading(true);
    setError("");
    setActionMessage("");

    try {
      const res = await axios.post(
        `${API_URL}/api/cloud/aws/files`,
        {
          accountId: cloudConfig?.accountId,
          roleName: cloudConfig?.roleName,
          bucketPrefix: cloudConfig?.bucketPrefix,
          region: cloudConfig?.region,
          path: pathValue || "",
        },
        { withCredentials: true },
      );
      const data = res?.data || {};
      setFolders(Array.isArray(data.folders) ? data.folders : []);
      setFiles(Array.isArray(data.files) ? data.files : []);
      setCurrentPath(data.path || "");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to load files under /data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cloudConfig?.accountId || !cloudConfig?.roleName || !cloudConfig?.bucketPrefix) return;
    loadPath("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudConfig]);

  const handleOpenFolder = (path) => {
    loadPath(path);
  };

  const toggleFileSelection = (file) => {
    const filePath = file.path;
    if (!filePath) return;

    setSelectedFiles((prev) => {
      if (prev.includes(filePath)) {
        return prev.filter((item) => item !== filePath);
      }
      return [...prev, filePath];
    });

    setSelectedFileMeta((prev) => {
      if (prev[filePath]) {
        const next = { ...prev };
        delete next[filePath];
        return next;
      }
      return {
        ...prev,
        [filePath]: {
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          path: filePath,
        },
      };
    });
  };

  const selectedItems = useMemo(
    () =>
      selectedFiles.map((path) => ({
        path,
        ...(selectedFileMeta[path] || {
          name: path.split("/").pop(),
          size: null,
          lastModified: null,
        }),
      })),
    [selectedFiles, selectedFileMeta],
  );

  const handleStartIngestion = async () => {
    if (!selectedFiles.length) return;

    setIngestingPath("batch");
    setActionMessage("");
    setModalMessage("");

    const failed = [];
    const succeeded = [];

    for (const filePath of selectedFiles) {
      try {
        const res = await axios.post(
          `${API_URL}/api/cloud/aws/ingest`,
          {
            accountId: cloudConfig?.accountId,
            roleName: cloudConfig?.roleName,
            bucketPrefix: cloudConfig?.bucketPrefix,
            region: cloudConfig?.region,
            filePath,
          },
          { withCredentials: true },
        );
        succeeded.push({
          filePath,
          uploadId: res?.data?.uploadId || null,
        });
      } catch (err) {
        failed.push({
          filePath,
          message: err?.response?.data?.message || err?.message || "Failed to queue ingestion.",
        });
      }
    }

    if (failed.length) {
      setModalMessage(`Ingestion failed for ${failed.length} file(s). First error: ${failed[0].message}`);
      setSelectedFiles(failed.map((item) => item.filePath));
      setLastIngestedUploadIds(succeeded.map((item) => item.uploadId).filter(Boolean));
      setActionMessage("");
    } else {
      const uploadIds = succeeded.map((item) => item.uploadId).filter(Boolean);
      setLastIngestedUploadIds(uploadIds);
      if (uploadIds.length) {
        setUploadIds(uploadIds);
        const selectedByPath = new Map(selectedItems.map((item) => [item.path, item]));
        setSelectedUploads(
          succeeded
            .filter((item) => item.uploadId)
            .map((item) => ({
              uploadId: item.uploadId,
              filename: selectedByPath.get(item.filePath)?.name || item.filePath,
            })),
        );
      }

      setActionMessage(`Ingestion started for ${selectedFiles.length} file(s).`);
      setSelectedFiles([]);
      setSelectedFileMeta({});
      setShowConfirmModal(false);
    }

    setIngestingPath("");
  };

  const proceedDisabled = selectedFiles.length === 0 || loading || !!error;

  const closeModal = () => {
    setShowConfirmModal(false);
    setModalMessage("");
  };

  const handleModalToggle = (item) => {
    toggleFileSelection(item);
  };

  const isFileSelected = (path) => selectedFiles.includes(path);

  const handleOpenProceed = () => {
    if (proceedDisabled) return;
    setModalMessage("");
    setShowConfirmModal(true);
  };

  const handleOpenDashboard = () => {
    if (!lastIngestedUploadIds.length) return;
    navigate(dashboardPath);
  };

  const renderConfirmationModal = () => {
    if (!showConfirmModal) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
        <div className={`w-full max-w-3xl overflow-hidden ${uploadTheme.panel}`}>
          <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
            <div>
              <h4 className="text-lg font-semibold text-[var(--text-primary)]">
                Confirm Ingestion ({selectedItems.length} selected)
              </h4>
              <p className={`mt-1 text-xs ${uploadTheme.mutedText}`}>
                Review files before starting ingestion.
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[380px] overflow-auto">
            <table className="w-full text-left">
              <thead className="border-b border-[var(--border-light)] bg-[var(--bg-surface)]">
                <tr className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Last Modified</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3 text-right">Deselect</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => (
                  <tr key={item.path} className="border-b border-[var(--border-muted)]">
                    <td className="px-4 py-3 text-[var(--text-primary)]">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {formatDateTime(item.lastModified)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {formatSize(item.size)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleModalToggle(item)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${uploadTheme.secondaryButton}`}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {!selectedItems.length ? (
                  <tr>
                    <td colSpan={4} className={`px-4 py-8 text-center text-sm ${uploadTheme.mutedText}`}>
                      No files selected.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {modalMessage ? (
            <div className="border-t border-red-200 bg-red-50 px-5 py-3 text-xs text-red-600">
              {modalMessage}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-[var(--border-light)] px-5 py-4">
            <button
              type="button"
              onClick={closeModal}
              className={`rounded-lg px-4 py-2 text-sm ${uploadTheme.secondaryButton}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartIngestion}
              disabled={!selectedItems.length || ingestingPath === "batch"}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${uploadTheme.primaryButton} disabled:opacity-60`}
            >
              {ingestingPath === "batch" ? "Starting..." : "Start Ingestion"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderConfirmationModal()}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Cloud Files</h3>
          <p className={`text-sm ${uploadTheme.mutedText}`}>
            Read-only sandbox rooted at <span className="text-[var(--text-primary)]">/data</span>
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <button
            type="button"
            onClick={() => loadPath("")}
            className={`rounded-md px-2 py-1 transition ${uploadTheme.secondaryButton}`}
          >
            /data
          </button>
          {breadcrumbs.map((segment, idx) => {
            const nextPath = `${breadcrumbs.slice(0, idx + 1).join("/")}/`;
            return (
              <React.Fragment key={`${segment}-${idx}`}>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <button
                  type="button"
                  onClick={() => loadPath(nextPath)}
                  className={`rounded-md px-2 py-1 transition ${uploadTheme.secondaryButton}`}
                >
                  {segment}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleOpenProceed}
          disabled={proceedDisabled}
          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${uploadTheme.primaryButton} disabled:cursor-not-allowed disabled:border disabled:border-[var(--border-light)] disabled:bg-[var(--bg-surface)] disabled:text-[var(--text-muted)]`}
        >
          Proceed ({selectedFiles.length} selected)
        </button>
      </div>

      <div className={`overflow-hidden ${uploadTheme.card}`}>
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
          </div>
        ) : error ? (
          <div className="flex min-h-[180px] items-center justify-center px-6 text-center">
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-[var(--border-light)] bg-[var(--bg-surface)]">
                <tr className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Last Modified</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3 text-right">Select</th>
                </tr>
              </thead>
              <tbody>
                {folders.map((folder) => (
                  <tr
                    key={folder.path}
                    className="border-b border-[var(--border-muted)] transition hover:bg-[var(--bg-surface)]"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleOpenFolder(folder.path)}
                        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        <Folder className="h-4 w-4 text-[var(--brand-primary)]" />
                        <span className="font-medium">{folder.name}</span>
                      </button>
                    </td>
                    <td className={`px-4 py-3 ${uploadTheme.mutedText}`}>--</td>
                    <td className={`px-4 py-3 ${uploadTheme.mutedText}`}>--</td>
                    <td className={`px-4 py-3 text-right text-xs ${uploadTheme.mutedText}`}>Folder</td>
                  </tr>
                ))}

                {files.map((file) => {
                  const isSelected = isFileSelected(file.path);
                  return (
                    <tr
                      key={file.path}
                      className={`border-b border-[var(--border-muted)] transition ${
                        isSelected ? "bg-[var(--brand-primary-soft)]/50" : "hover:bg-[var(--bg-surface)]"
                      }`}
                    >
                      <td className="px-4 py-3 text-[var(--text-primary)]">
                        <div className="inline-flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[var(--brand-primary)]" />
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                        {formatDateTime(file.lastModified)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                        {formatSize(file.size)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFileSelection(file)}
                          className="h-4 w-4 cursor-pointer accent-[var(--brand-primary)]"
                        />
                      </td>
                    </tr>
                  );
                })}

                {!folders.length && !files.length ? (
                  <tr>
                    <td colSpan={4} className={`px-4 py-8 text-center text-sm ${uploadTheme.mutedText}`}>
                      No folders or files found in this directory.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {actionMessage ? (
        <div className={`mt-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${uploadTheme.subPanel}`}>
          <span className="text-[var(--text-secondary)]">{actionMessage}</span>
          {lastIngestedUploadIds.length ? (
            <button
              type="button"
              onClick={handleOpenDashboard}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${uploadTheme.primaryButton}`}
            >
              Open Dashboard
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default CloudFileManagerPanel;
