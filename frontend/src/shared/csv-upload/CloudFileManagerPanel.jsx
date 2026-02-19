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
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load files under /data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cloudConfig?.accountId || !cloudConfig?.roleName || !cloudConfig?.bucketPrefix)
      return;
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
          message:
            err?.response?.data?.message ||
            err?.message ||
            "Failed to queue ingestion.",
        });
      }
    }

    if (failed.length) {
      setModalMessage(
        `Ingestion failed for ${failed.length} file(s). First error: ${failed[0].message}`,
      );
      setSelectedFiles(failed.map((item) => item.filePath));
      setLastIngestedUploadIds(
        succeeded.map((item) => item.uploadId).filter(Boolean),
      );
      setActionMessage("");
    } else {
      const uploadIds = succeeded.map((item) => item.uploadId).filter(Boolean);
      setLastIngestedUploadIds(uploadIds);
      if (uploadIds.length) {
        setUploadIds(uploadIds);
        const selectedByPath = new Map(
          selectedItems.map((item) => [item.path, item]),
        );
        setSelectedUploads(
          succeeded
            .filter((item) => item.uploadId)
            .map((item) => ({
              uploadId: item.uploadId,
              filename:
                selectedByPath.get(item.filePath)?.name || item.filePath,
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
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-[#14161d] shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h4 className="text-white text-lg font-semibold">
                Confirm Ingestion ({selectedItems.length} selected)
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Review files before starting ingestion.
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[380px] overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Last Modified</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3 text-right">Deselect</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => (
                  <tr key={item.path} className="border-b border-white/5">
                    <td className="px-4 py-3 text-gray-200">{item.name}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {formatDateTime(item.lastModified)}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {formatSize(item.size)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleModalToggle(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {!selectedItems.length ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No files selected.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {modalMessage ? (
            <div className="px-5 py-3 border-t border-white/10 text-xs text-red-300 bg-red-500/10">
              {modalMessage}
            </div>
          ) : null}

          <div className="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartIngestion}
              disabled={!selectedItems.length || ingestingPath === "batch"}
              className="px-4 py-2 rounded-lg bg-[#a02ff1] hover:bg-[#8e25d9] text-white text-sm font-semibold disabled:opacity-60"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Cloud Files</h3>
          <p className="text-gray-400 text-sm">
            Read-only sandbox rooted at <span className="text-white">/data</span>
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
          <button
            type="button"
            onClick={() => loadPath("")}
            className="px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-white"
          >
            /data
          </button>
          {breadcrumbs.map((segment, idx) => {
            const nextPath = `${breadcrumbs.slice(0, idx + 1).join("/")}/`;
            return (
              <React.Fragment key={`${segment}-${idx}`}>
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                <button
                  type="button"
                  onClick={() => loadPath(nextPath)}
                  className="px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200"
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
          className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-[#a02ff1] hover:bg-[#8e25d9] text-white disabled:bg-white/5 disabled:border disabled:border-white/10 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          Proceed ({selectedFiles.length} selected)
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f11]/70 overflow-hidden">
        {loading ? (
          <div className="min-h-[280px] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#a02ff1] w-8 h-8" />
          </div>
        ) : error ? (
          <div className="min-h-[180px] flex items-center justify-center px-6 text-center">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-xs uppercase tracking-wider text-gray-400">
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
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleOpenFolder(folder.path)}
                        className="inline-flex items-center gap-2 text-gray-200 hover:text-white"
                      >
                        <Folder className="w-4 h-4 text-[#a02ff1]" />
                        <span className="font-medium">{folder.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">--</td>
                    <td className="px-4 py-3 text-gray-500">--</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      Folder
                    </td>
                  </tr>
                ))}

                {files.map((file) => {
                  const isSelected = isFileSelected(file.path);
                  return (
                    <tr
                      key={file.path}
                      className={`border-b border-white/5 transition ${
                        isSelected ? "bg-[#a02ff1]/10" : "hover:bg-white/5"
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-200">
                        <div className="inline-flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#7dd3fc]" />
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {formatDateTime(file.lastModified)}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {formatSize(file.size)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFileSelection(file)}
                          className="h-4 w-4 accent-[#a02ff1] cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}

                {!folders.length && !files.length ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
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
        <div className="mt-3 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-300 flex items-center justify-between gap-3">
          <span>{actionMessage}</span>
          {lastIngestedUploadIds.length ? (
            <button
              type="button"
              onClick={handleOpenDashboard}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#a02ff1] hover:bg-[#8e25d9] text-white"
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
