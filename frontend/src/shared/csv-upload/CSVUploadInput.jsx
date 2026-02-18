import React, { useEffect, useState } from "react";
import axios from "axios";
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
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import  { useDashboardStore } from "../../store/Dashboard.store"; 
const MAX_MB = 50;

const CsvUploadInput = ({
  uploadUrl,
  withCredentials = true,
}) => {
  const navigate = useNavigate();
  
  // Use VITE_API_URL if uploadUrl is not provided
  const finalUploadUrl = uploadUrl || `${import.meta.env.VITE_API_URL}/api/etl`;
  const cloudVerifyUrl = `${import.meta.env.VITE_API_URL}/api/cloud/aws/verify-connection`;

  const [mode, setMode] = useState("csv"); // csv | cloud
  const [csvStatus, setCsvStatus] = useState("idle"); // idle | uploading | error
  const [csvErrorMessage, setCsvErrorMessage] = useState("");
  const [fileDetails, setFileDetails] = useState(null);
  const [cloudForm, setCloudForm] = useState({
    accountId: "",
    roleName: "",
    bucketPrefix: "",
    region: "ap-south-1",
  });
  const [cloudStatus, setCloudStatus] = useState("idle"); // idle | testing | tested | connecting | connected | error
  const [cloudMessage, setCloudMessage] = useState("");
  const [cloudPreview, setCloudPreview] = useState(null);
  const [hasExistingUploads, setHasExistingUploads] = useState(false);
  const setUploadIds = useDashboardStore((s) => s.setUploadIds);
  const dashboardPath = useDashboardStore((s) => s.dashboardPath);

  const formatDateTime = (value) => {
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

  const validate = (file) => {
    if (!file) return "No file selected.";
    if (!file.name.toLowerCase().endsWith(".csv")) return "Only CSV files are allowed.";
    if (file.size > MAX_MB * 1024 * 1024) return `File exceeds ${MAX_MB}MB limit.`;
    return "";
  };

  useEffect(() => {
    const checkExistingUploads = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/etl/get-billing-uploads`,
          { withCredentials },
        );
        const uploads = Array.isArray(res.data) ? res.data : [];
        setHasExistingUploads(uploads.length > 0);
      } catch {
        setHasExistingUploads(false);
      }
    };

    checkExistingUploads();
  }, [withCredentials]);

  const uploadFile = async (file) => {
    const msg = validate(file);
    if (msg) {
      setCsvStatus("error");
      setCsvErrorMessage(msg);
      return;
    }

    setFileDetails({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
    });

    setCsvStatus("uploading");
    setCsvErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(finalUploadUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials,
      });

      const nextUploadIds = res?.data?.uploadId ? [res.data.uploadId] : [];
      setUploadIds(nextUploadIds);
      // ✅ success -> dashboard
      navigate(dashboardPath);
    } catch (err) {
      let msg2 = "Upload failed.";

      if (err?.response) {
        msg2 =
          err.response.data?.error ||
          err.response.data?.message ||
          err.response.data?.details ||
          `Server error (${err.response.status}).`;
      } else if (err?.request) {
        msg2 = "Cannot connect to backend server.";
      } else if (err?.message) {
        msg2 = err.message;
      }

      setCsvStatus("error");
      setCsvErrorMessage(msg2);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    uploadFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    uploadFile(file);
  };

  const updateCloudField = (field, value) => {
    setCloudForm((prev) => ({ ...prev, [field]: value }));
    setCloudPreview(null);
    if (cloudStatus === "error") {
      setCloudStatus("idle");
      setCloudMessage("");
    }
  };

  const validateCloud = () => {
    if (!cloudForm.accountId.trim()) return "Account ID is required.";
    if (!/^\d{12}$/.test(cloudForm.accountId.trim())) {
      return "Account ID must be a 12-digit number.";
    }
    if (!cloudForm.roleName.trim()) return "RoleName is required.";
    if (!cloudForm.bucketPrefix.trim()) return "Bucket (prefix) is required.";
    return "";
  };

  const handleCloudAction = async (action) => {
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
        const res = await axios.post(
          cloudVerifyUrl,
          {
            accountId: cloudForm.accountId.trim(),
            roleName: cloudForm.roleName.trim(),
            bucketPrefix: cloudForm.bucketPrefix.trim(),
            region: cloudForm.region.trim(),
          },
          { withCredentials },
        );

        const data = res?.data || {};
        const latestFileKey = data?.latestFile?.key || "";
        setCloudStatus("tested");
        setCloudMessage(
          latestFileKey
            ? `Assumption success. Latest file detected under "${data.bucket}".`
            : `Assumption success. Connected to "${data.bucket}", but no file found for this prefix.`,
        );
        setCloudPreview({
          assumedRoleArn: data.assumedRoleArn || "",
          bucket: data.bucket || "",
          prefix: data.prefix || "",
          latestFile: data.latestFile || null,
        });
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Connection verification failed.";
        setCloudStatus("error");
        setCloudMessage(msg);
        setCloudPreview(null);
      }
      return;
    }

    setCloudStatus("connected");
    setCloudMessage("Connection setup step is ready. Persistence will be added next.");
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center px-6 py-12 font-sans relative overflow-hidden">
      {/* background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#a02ff1]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="relative z-10 w-full max-w-3xl">
        {hasExistingUploads ? (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => navigate("/billing-uploads")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 hover:border-[#a02ff1]/35 transition"
            >
              <ArrowLeft className="w-4 h-4 text-[#a02ff1]" />
              <span className="text-sm font-semibold">Back to Billing Uploads</span>
            </button>
          </div>
        ) : null}

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#a02ff1] text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-[#a02ff1]"></span>
            Secure Ingestion
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Ingest Billing Data
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Choose how you want to ingest data for cost intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setMode("csv")}
            className={`group relative rounded-2xl border p-5 text-left transition-all ${
              mode === "csv"
                ? "border-[#a02ff1]/60 bg-[#a02ff1]/10 shadow-[0_0_20px_rgba(160,47,241,0.18)]"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-white/10 bg-[#0f0f11] flex items-center justify-center">
                <Upload className="w-5 h-5 text-[#a02ff1]" />
              </div>
              <div>
                <p className="text-white font-semibold">Upload CSV</p>
                <p className="text-xs text-gray-400">Drag, drop, and ingest now</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("cloud")}
            className={`group relative rounded-2xl border p-5 text-left transition-all ${
              mode === "cloud"
                ? "border-[#a02ff1]/60 bg-[#a02ff1]/10 shadow-[0_0_20px_rgba(160,47,241,0.18)]"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-white/10 bg-[#0f0f11] flex items-center justify-center">
                <Cloud className="w-5 h-5 text-[#a02ff1]" />
              </div>
              <div>
                <p className="text-white font-semibold">Connect Cloud (AWS)</p>
                <p className="text-xs text-gray-400">Assume role based connection</p>
              </div>
            </div>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b20]/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
        >
          <div className="p-10 min-h-[420px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {mode === "csv" && csvStatus === "uploading" ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center w-full"
                >
                  <div className="relative w-24 h-24 mb-8">
                    <svg className="animate-spin w-full h-full text-[#a02ff1]" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="text-white w-8 h-8" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2">Uploading & Processing</h2>
                  <p className="text-gray-400 mb-8 flex items-center gap-2">
                    {fileDetails?.name} <span className="w-1 h-1 rounded-full bg-gray-600"></span> {fileDetails?.size}
                  </p>
                  <div className="w-full max-w-sm bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2 }} className="h-full bg-[#a02ff1]" />
                  </div>
                  <p className="text-xs text-gray-500 mt-4 animate-pulse">Calculating unit costs and anomalies...</p>
                </motion.div>
              ) : mode === "csv" ? (
                <motion.div
                  key="csv-idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col items-center"
                >
                  <label
                    className="w-full flex-1 border-2 border-dashed border-[#a02ff1]/30 hover:border-[#a02ff1] hover:bg-[#a02ff1]/5 cursor-pointer rounded-2xl flex flex-col items-center justify-center transition-all group min-h-[300px]"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <input type="file" accept=".csv" onChange={handleChange} className="hidden" />
                    <div className="w-20 h-20 rounded-full bg-[#1a1b20] border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl">
                      <Upload className="text-[#a02ff1] w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-white">Click to upload or drag & drop</h3>
                    <p className="text-gray-500 text-sm mb-6">Max file size {MAX_MB}MB (CSV only)</p>

                    {csvStatus === "error" && (
                      <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{csvErrorMessage}</span>
                      </div>
                    )}
                  </label>
                </motion.div>
              ) : (
                <motion.div
                  key="cloud-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-xl"
                >
                  <div className="text-center mb-7">
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Cloud (AWS)</h2>
                    <p className="text-gray-400 text-sm">
                      Enter role access details to enable S3 billing ingestion.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                        Account ID (12 digits)
                      </label>
                      <input
                        type="text"
                        value={cloudForm.accountId}
                        onChange={(e) =>
                          updateCloudField(
                            "accountId",
                            e.target.value.replace(/\D/g, "").slice(0, 12),
                          )
                        }
                        placeholder="123456789012"
                        inputMode="numeric"
                        className="mt-2 w-full px-4 py-3 rounded-xl bg-[#0f0f11] border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a02ff1]/40 focus:border-[#a02ff1]/50"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                        Role Name
                      </label>
                      <input
                        type="text"
                        value={cloudForm.roleName}
                        onChange={(e) => updateCloudField("roleName", e.target.value)}
                        placeholder="role name e.g. MyBillingAccessRole"
                        className="mt-2 w-full px-4 py-3 rounded-xl bg-[#0f0f11] border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a02ff1]/40 focus:border-[#a02ff1]/50"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                        Bucket Prefix
                      </label>
                      <input
                        type="text"
                        value={cloudForm.bucketPrefix}
                        onChange={(e) => updateCloudField("bucketPrefix", e.target.value)}
                        placeholder="bucket_Name/demo/data/billing"
                        className="mt-2 w-full px-4 py-3 rounded-xl bg-[#0f0f11] border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a02ff1]/40 focus:border-[#a02ff1]/50"
                      />
                      <p className="mt-1 text-[11px] text-gray-500">
                        Format: bucket-name/folder/path/
                      </p>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                        AWS Billing Region
                      </label>
                      <input
                        type="text"
                        value={cloudForm.region}
                        onChange={(e) => updateCloudField("region", e.target.value)}
                        placeholder="ap-south-1"
                        className="mt-2 w-full px-4 py-3 rounded-xl bg-[#0f0f11] border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a02ff1]/40 focus:border-[#a02ff1]/50"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => handleCloudAction("test")}
                      disabled={cloudStatus === "testing" || cloudStatus === "connecting"}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition disabled:opacity-60"
                    >
                      {cloudStatus === "testing" ? "Testing..." : "Test Connection"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCloudAction("connect")}
                      disabled={cloudStatus === "testing" || cloudStatus === "connecting"}
                      className="flex-1 px-4 py-3 rounded-xl bg-[#a02ff1] hover:bg-[#8e25d9] text-white font-semibold transition disabled:opacity-60"
                    >
                      {cloudStatus === "connecting" ? "Connecting..." : "Connect Cloud"}
                    </button>
                  </div>

                  {cloudMessage ? (
                    <div className="mt-4 p-3 rounded-xl border border-white/10 bg-[#0f0f11]/70">
                      <div className="flex items-start gap-2 text-xs">
                        {cloudStatus === "tested" || cloudStatus === "connected" ? (
                          <ShieldCheck className="w-4 h-4 text-green-400 mt-0.5" />
                        ) : cloudStatus === "error" ? (
                          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                        ) : (
                          <Link2 className="w-4 h-4 text-[#a02ff1] mt-0.5" />
                        )}
                        <p className="text-gray-400">{cloudMessage}</p>
                      </div>
                    </div>
                  ) : null}

                  {cloudStatus === "tested" && cloudPreview ? (
                    <div className="mt-3 p-3 rounded-xl border border-[#a02ff1]/20 bg-[#a02ff1]/5">
                      <p className="text-[11px] font-semibold text-[#d7b0ff] mb-2">
                        Demo Preview: Latest file snapshot
                      </p>
                      <p className="text-[11px] text-gray-400 mb-2">
                        {cloudPreview.bucket}
                        {cloudPreview.prefix ? `/${cloudPreview.prefix}` : ""}
                      </p>
                      <div className="space-y-1">
                        {cloudPreview.latestFile?.key ? (
                          <>
                            <p
                              className="text-[11px] text-gray-200 truncate"
                              title={cloudPreview.latestFile.key}
                            >
                              File: {cloudPreview.latestFile.key}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              Last modified:{" "}
                              {formatDateTime(cloudPreview.latestFile.lastModified)}
                            </p>
                          </>
                        ) : (
                          <p className="text-[11px] text-gray-500">
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
