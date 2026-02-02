import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2, FileText, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import  { useDashboardStore } from "../../store/Dashboard.store"; 
const MAX_MB = 50;

const CsvUploadInput = ({
  uploadUrl,
  withCredentials = true,
}) => {
  const navigate = useNavigate();
  
  // Use VITE_API_URL if uploadUrl is not provided
  const finalUploadUrl = uploadUrl || `${import.meta.env.VITE_API_URL || "https://master-01-backend.onrender.com"}/api/etl`;

  const [status, setStatus] = useState("idle"); // idle | uploading | error
  const [errorMessage, setErrorMessage] = useState("");
  const [fileDetails, setFileDetails] = useState(null);
const setUploadIds = useDashboardStore((s) => s.setUploadIds);
const dashboardPath = useDashboardStore((s) => s.dashboardPath);
  const validate = (file) => {
    if (!file) return "No file selected.";
    if (!file.name.toLowerCase().endsWith(".csv")) return "Only CSV files are allowed.";
    if (file.size > MAX_MB * 1024 * 1024) return `File exceeds ${MAX_MB}MB limit.`;
    return "";
  };

  const uploadFile = async (file) => {
    const msg = validate(file);
    if (msg) {
      setStatus("error");
      setErrorMessage(msg);
      return;
    }

    setFileDetails({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
    });

    setStatus("uploading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(finalUploadUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials,
      });

      setUploadIds([res.data.uploadId] || []);
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

      setStatus("error");
      setErrorMessage(msg2);
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

  return (
    <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center px-6 py-12 font-sans relative overflow-hidden">
      {/* background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#a02ff1]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="relative z-10 w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#a02ff1] text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-[#a02ff1]"></span>
            Secure Ingestion
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Upload Billing CSV
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Upload your billing export (CSV) to generate instant cost intelligence.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b20]/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
        >
          <div className="p-10 min-h-[420px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {status === "uploading" ? (
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
              ) : (
                <motion.div
                  key="idle"
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

                    {status === "error" && (
                      <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </label>
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
