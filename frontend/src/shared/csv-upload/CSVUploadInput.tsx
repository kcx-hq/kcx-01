import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  AlertCircle,
  Cloud,
  ShieldCheck,
  Link2,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "../../store/Dashboard.store";
import CloudFileManagerPanel from "./CloudFileManagerPanel";
import { uploadGridStyle, uploadTheme } from "./theme";
import { apiGet, apiPost } from "../../services/http";
import { getApiErrorMessageWithRequestId } from "../../services/apiError";
import type {
  BillingUploadRecord,
  CloudConnection,
  CloudForm,
  CloudPreview,
} from "./types";

const MAX_MB = 50;

type InputMode = "csv" | "cloud";
type CsvStatus = "idle" | "uploading" | "error";
type CloudStatus = "idle" | "testing" | "tested" | "connecting" | "connected" | "error";
type CloudAction = "test" | "connect";

interface CsvUploadInputProps {
  uploadUrl?: string;
  withCredentials?: boolean;
}

interface FileDetails {
  name: string;
  size: string;
}

interface VerifyConnectionResponse {
  assumedRoleArn?: string;
  bucket?: string;
  prefix?: string;
  latestFile?: {
    key?: string;
    lastModified?: string;
  };
}

interface ConnectResponse {
  rootPrefix?: string;
  bucket?: string;
}

interface UploadResponse {
  uploadId?: string;
}

const isBillingUploadRecord = (value: unknown): value is BillingUploadRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }
  return typeof (value as Record<string, unknown>)["uploadid"] === "string";
};

const getAxiosMessage = (error: unknown, fallback: string): string => {
  const message = getApiErrorMessageWithRequestId(error, fallback);
  if (message) {
    return message;
  }
  return fallback;
};

const CsvUploadInput = ({ uploadUrl, withCredentials = true }: CsvUploadInputProps) => {
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  const finalUploadUrl = uploadUrl || "/api/etl";
  const cloudVerifyUrl = "/api/cloud/aws/verify-connection";
  const cloudConnectUrl = "/api/cloud/aws/connect";

  const [mode, setMode] = useState<InputMode>("csv"); // csv | cloud
  const [csvStatus, setCsvStatus] = useState<CsvStatus>("idle"); // idle | uploading | error
  const [csvProcessingMessage, setCsvProcessingMessage] = useState("Uploading file...");
  const [csvErrorMessage, setCsvErrorMessage] = useState("");
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [cloudForm, setCloudForm] = useState<CloudForm>({
    accountId: "",
    roleName: "",
    bucketPrefix: "",
    region: "ap-south-1",
  });
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("idle"); // idle | testing | tested | connecting | connected | error
  const [cloudMessage, setCloudMessage] = useState("");
  const [cloudPreview, setCloudPreview] = useState<CloudPreview | null>(null);
  const [cloudConnection, setCloudConnection] = useState<CloudConnection | null>(null);
  const [hasExistingUploads, setHasExistingUploads] = useState(false);
  const setUploadIds = useDashboardStore((s) => s.setUploadIds);
  const dashboardPath = useDashboardStore((s) => s.dashboardPath);

  const setCsvProcessingMessageSafe = (message: string) => {
    if (!isMountedRef.current) {
      return;
    }
    setCsvProcessingMessage(message);
  };

  const redirectToDashboard = () => {
    const targetPath = dashboardPath || "/dashboard";
    window.location.assign(targetPath);
  };

  const formatDateTime = (value: string | number | Date | null | undefined) => {
    if (!value) return "--";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const validate = (file: File | null | undefined) => {
    if (!file) return "No file selected.";
    if (!file.name.toLowerCase().endsWith(".csv")) return "Only CSV files are allowed.";
    if (file.size > MAX_MB * 1024 * 1024) return `File exceeds ${MAX_MB}MB limit.`;
    return "";
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkExistingUploads = async () => {
      try {
        const response = await apiGet<unknown>("/api/etl/get-billing-uploads", { withCredentials });
        const uploads = Array.isArray(response) ? response.filter(isBillingUploadRecord) : [];
        setHasExistingUploads(uploads.length > 0);
      } catch {
        setHasExistingUploads(false);
      }
    };

    checkExistingUploads();
  }, [withCredentials]);

  const uploadFile = async (file: File | null | undefined) => {
    const msg = validate(file);
    if (msg) {
      setCsvStatus("error");
      setCsvErrorMessage(msg);
      return;
    }
    if (!file) {
      return;
    }

    setFileDetails({
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    });

    setCsvStatus("uploading");
    setCsvProcessingMessageSafe("Uploading file...");
    setCsvErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiPost<UploadResponse>(finalUploadUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials,
      });

      const uploadId = response?.uploadId;
      if (!uploadId) {
        throw new Error("Upload accepted but upload ID is missing.");
      }

      setUploadIds([uploadId]);
      setCsvProcessingMessageSafe("ETL completed. Redirecting to dashboard...");
      redirectToDashboard();
      return;
    } catch (err: unknown) {
      if (!isMountedRef.current) {
        return;
      }
      setCsvStatus("error");
      if (err instanceof Error && err.message) {
        setCsvErrorMessage(err.message);
      } else {
        setCsvErrorMessage(getAxiosMessage(err, "Upload failed."));
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    uploadFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    uploadFile(file);
  };

  const updateCloudField = <K extends keyof CloudForm>(field: K, value: CloudForm[K]) => {
    setCloudForm((prev) => ({ ...prev, [field]: value }));
    setCloudPreview(null);
    setCloudConnection(null);
    if (cloudStatus === "error" || cloudStatus === "tested" || cloudStatus === "connected") {
      setCloudStatus("idle");
      setCloudMessage("");
    }
  };

  const validateCloud = () => {
    if (!cloudForm.accountId.trim()) return "Account ID is required.";
    if (!/^\d{12}$/.test(cloudForm.accountId.trim())) return "Account ID must be a 12-digit number.";
    if (!cloudForm.roleName.trim()) return "RoleName is required.";
    if (!cloudForm.bucketPrefix.trim()) return "Bucket (prefix) is required.";
    return "";
  };

  const handleCloudAction = async (action: CloudAction) => {
    const validationMessage = validateCloud();
    if (validationMessage) {
      setCloudStatus("error");
      setCloudMessage(validationMessage);
      setCloudPreview(null);
      return;
    }

    if (action === "test") {
      setCloudStatus("testing");
      setCloudMessage("");
      try {
        const data = await apiPost<VerifyConnectionResponse>(
          cloudVerifyUrl,
          {
            accountId: cloudForm.accountId.trim(),
            roleName: cloudForm.roleName.trim(),
            bucketPrefix: cloudForm.bucketPrefix.trim(),
            region: cloudForm.region.trim(),
          },
          { withCredentials },
        );
        const latestFileKey = data?.latestFile?.key || "";
        setCloudStatus("tested");
        setCloudMessage(
          latestFileKey
            ? `Connection verified. Latest file detected under "${data.bucket}".`
            : `Connection verified. Connected to "${data.bucket}", but no file found for this prefix.`,
        );
        setCloudPreview({
          assumedRoleArn: data.assumedRoleArn || "",
          bucket: data.bucket || "",
          prefix: data.prefix || "",
          latestFile: data.latestFile || null,
        });
      } catch (err: unknown) {
        const msg = getAxiosMessage(err, "Connection verification failed.");
        setCloudStatus("error");
        setCloudMessage(msg);
        setCloudPreview(null);
      }
      return;
    }

    setCloudStatus("connecting");
    setCloudMessage("");
    setCloudPreview(null);
    setCloudConnection(null);

    try {
      const data = await apiPost<ConnectResponse>(
        cloudConnectUrl,
        {
          accountId: cloudForm.accountId.trim(),
          roleName: cloudForm.roleName.trim(),
          bucketPrefix: cloudForm.bucketPrefix.trim(),
            region: cloudForm.region.trim(),
          },
          { withCredentials },
      );
      setCloudStatus("connected");
      setCloudMessage("Cloud connection successful. Opening file manager.");
      setCloudConnection({
        accountId: cloudForm.accountId.trim(),
        roleName: cloudForm.roleName.trim(),
        bucketPrefix: cloudForm.bucketPrefix.trim(),
        region: cloudForm.region.trim(),
        rootPrefix: data.rootPrefix || "",
        bucket: data.bucket || "",
      });
    } catch (err: unknown) {
      const msg = getAxiosMessage(err, "Cloud connection failed.");
      setCloudStatus("error");
      setCloudMessage(msg);
      setCloudConnection(null);
    }
  };

  const csvModeClass =
    mode === "csv"
      ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/50 shadow-[0_0_0_3px_rgba(0,119,88,0.08)]"
      : "border-[var(--border-light)] bg-white hover:bg-[var(--bg-surface)]";
  const cloudModeClass =
    mode === "cloud"
      ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/50 shadow-[0_0_0_3px_rgba(0,119,88,0.08)]"
      : "border-[var(--border-light)] bg-white hover:bg-[var(--bg-surface)]";

  return (
    <div className={`${uploadTheme.pageShell} flex items-center justify-center px-6 py-12`}>
      <div className={uploadTheme.pageGrid} style={uploadGridStyle} />
      <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-[var(--brand-primary)]/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-[var(--bg-dark)]/10 blur-[120px]" />

      <div className={`relative z-10 w-full ${cloudConnection ? "max-w-6xl" : "max-w-3xl"}`}>
        {hasExistingUploads ? (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/billing-uploads")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${uploadTheme.secondaryButton}`}
            >
              <ArrowLeft className="h-4 w-4 text-[var(--brand-primary)]" />
              <span>Back to Billing Uploads</span>
            </button>
          </div>
        ) : null}

        <div className="mb-10 text-center">
          <div className={`${uploadTheme.badge} mb-4 text-[var(--brand-primary)]`}>
            <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
            Secure Ingestion
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">
            Ingest Billing Data
          </h1>
          <p className={`mx-auto max-w-xl text-lg leading-relaxed ${uploadTheme.mutedText}`}>
            Choose how you want to ingest data for cost intelligence.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("csv")}
            className={`group relative rounded-2xl border p-5 text-left transition-all ${csvModeClass}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-light)] bg-white">
                <Upload className="h-5 w-5 text-[var(--brand-primary)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Upload CSV</p>
                <p className="text-xs text-[var(--text-muted)]">Drag, drop, and ingest now</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("cloud")}
            className={`group relative rounded-2xl border p-5 text-left transition-all ${cloudModeClass}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-light)] bg-white">
                <Cloud className="h-5 w-5 text-[var(--brand-primary)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Connect Cloud (AWS)</p>
                <p className="text-xs text-[var(--text-muted)]">Assume-role based connection</p>
              </div>
            </div>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${uploadTheme.panel} relative overflow-hidden`}
        >
          <div className="flex min-h-[420px] flex-col items-center justify-center p-10">
            <AnimatePresence mode="wait">
              {mode === "csv" && csvStatus === "uploading" ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex w-full flex-col items-center justify-center"
                >
                  <div className="relative mb-8 h-24 w-24">
                    <svg className="h-full w-full animate-spin text-[var(--brand-primary)]" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-[var(--text-primary)]" />
                    </div>
                  </div>

                  <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
                    Processing Your Data
                  </h2>
                  <p className={`mb-8 flex items-center gap-2 ${uploadTheme.mutedText}`}>
                    {fileDetails?.name}{" "}
                    <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" /> {fileDetails?.size}
                  </p>
                  <div className="relative h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-[var(--border-light)]">
                    <motion.div
                      className="absolute inset-y-0 left-0 w-1/3 bg-[var(--brand-primary)]"
                      animate={{ x: ["-130%", "320%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <p className={`mt-4 animate-pulse text-xs ${uploadTheme.mutedText}`}>
                    {csvProcessingMessage}
                  </p>
                </motion.div>
              ) : mode === "csv" ? (
                <motion.div
                  key="csv-idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full w-full flex-col items-center"
                >
                  <label
                    className="group flex min-h-[300px] w-full flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--brand-primary)]/35 bg-[var(--brand-primary-soft)]/10 transition-all hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]/40"
                    onDrop={handleDrop}
                    onDragOver={(e: React.DragEvent<HTMLLabelElement>) => e.preventDefault()}
                  >
                    <input type="file" accept=".csv" onChange={handleChange} className="hidden" />
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border-light)] bg-white shadow-xl transition-transform group-hover:scale-110">
                      <Upload className="h-8 w-8 text-[var(--brand-primary)]" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
                      Click to upload or drag and drop
                    </h3>
                    <p className={`mb-6 text-sm ${uploadTheme.mutedText}`}>Max file size {MAX_MB}MB (CSV only)</p>

                    {csvStatus === "error" && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <span>{csvErrorMessage}</span>
                      </div>
                    )}
                  </label>
                </motion.div>
              ) : cloudConnection ? (
                <motion.div
                  key="cloud-file-manager"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-5xl"
                >
                  <CloudFileManagerPanel cloudConfig={cloudConnection} />
                </motion.div>
              ) : (
                <motion.div
                  key="cloud-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-xl"
                >
                  <div className="mb-7 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
                      Connect Cloud (AWS)
                    </h2>
                    <p className={`text-sm ${uploadTheme.mutedText}`}>
                      Enter role access details to enable S3 billing ingestion.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={`text-xs font-semibold uppercase tracking-wider ${uploadTheme.mutedText}`}>
                        Account ID (12 digits)
                      </label>
                      <input
                        type="text"
                        value={cloudForm.accountId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateCloudField("accountId", e.target.value.replace(/\D/g, "").slice(0, 12))
                        }
                        placeholder="123456789012"
                        inputMode="numeric"
                        className={uploadTheme.input}
                      />
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase tracking-wider ${uploadTheme.mutedText}`}>
                        Role Name
                      </label>
                      <input
                        type="text"
                        value={cloudForm.roleName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCloudField("roleName", e.target.value)}
                        placeholder="role name e.g. MyBillingAccessRole"
                        className={uploadTheme.input}
                      />
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase tracking-wider ${uploadTheme.mutedText}`}>
                        Bucket Prefix
                      </label>
                      <input
                        type="text"
                        value={cloudForm.bucketPrefix}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCloudField("bucketPrefix", e.target.value)}
                        placeholder="bucket_Name/demo/data/billing"
                        className={uploadTheme.input}
                      />
                      <p className={`mt-1 text-[11px] ${uploadTheme.mutedText}`}>Format: bucket-name/folder/path/</p>
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase tracking-wider ${uploadTheme.mutedText}`}>
                        AWS Billing Region
                      </label>
                      <input
                        type="text"
                        value={cloudForm.region}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCloudField("region", e.target.value)}
                        placeholder="ap-south-1"
                        className={uploadTheme.input}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleCloudAction("test")}
                      disabled={
                        cloudStatus === "testing" ||
                        cloudStatus === "connecting" ||
                        cloudStatus === "tested" ||
                        cloudStatus === "connected"
                      }
                      className={`flex-1 rounded-xl px-4 py-3 font-semibold transition ${
                        cloudStatus === "tested" || cloudStatus === "connected"
                          ? "cursor-not-allowed border border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
                          : uploadTheme.primaryButton
                      }`}
                    >
                      {cloudStatus === "testing" ? "Testing..." : "Test Connection"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCloudAction("connect")}
                      disabled={cloudStatus !== "tested"}
                      className={`flex-1 rounded-xl px-4 py-3 font-semibold transition ${
                        cloudStatus === "tested"
                          ? uploadTheme.primaryButton
                          : "cursor-not-allowed border border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
                      }`}
                    >
                      {cloudStatus === "connecting" ? "Connecting..." : "Connect Cloud"}
                    </button>
                  </div>

                  {cloudMessage ? (
                    <div className={`mt-4 rounded-xl border px-3 py-3 ${uploadTheme.subPanel}`}>
                      <div className="flex items-start gap-2 text-xs">
                        {cloudStatus === "tested" || cloudStatus === "connected" ? (
                          <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-500" />
                        ) : cloudStatus === "error" ? (
                          <AlertCircle className="mt-0.5 h-4 w-4 text-red-500" />
                        ) : (
                          <Link2 className="mt-0.5 h-4 w-4 text-[var(--brand-primary)]" />
                        )}
                        <p className="text-[var(--text-secondary)]">{cloudMessage}</p>
                      </div>
                    </div>
                  ) : null}

                  {cloudStatus === "tested" && cloudPreview ? (
                    <div className="mt-3 rounded-xl border border-[var(--brand-primary)]/25 bg-[var(--brand-primary-soft)]/40 p-3">
                      <p className="mb-2 text-[11px] font-semibold text-[var(--brand-primary)]">
                        Demo Preview: Latest file snapshot
                      </p>
                      <p className="mb-2 text-[11px] text-[var(--text-secondary)]">
                        {cloudPreview.bucket}
                        {cloudPreview.prefix ? `/${cloudPreview.prefix}` : ""}
                      </p>
                      <div className="space-y-1">
                        {cloudPreview.latestFile?.key ? (
                          <>
                            <p
                              className="truncate text-[11px] text-[var(--text-primary)]"
                              title={cloudPreview.latestFile.key}
                            >
                              File: {cloudPreview.latestFile.key}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              Last modified: {formatDateTime(cloudPreview.latestFile.lastModified)}
                            </p>
                          </>
                        ) : (
                          <p className="text-[11px] text-[var(--text-muted)]">
                            No file object found for this prefix.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CsvUploadInput;
