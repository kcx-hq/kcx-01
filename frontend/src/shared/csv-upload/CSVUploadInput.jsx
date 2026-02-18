import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, AlertCircle, X, CheckCircle2, FileUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "../../store/Dashboard.store";

const MAX_MB = 50;

const CsvUploadInput = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const finalUploadUrl = `${import.meta.env.VITE_API_URL}/api/etl`;

  const [status, setStatus] = useState("idle"); // idle | uploading | error
  const [errorMessage, setErrorMessage] = useState("");
  const [fileDetails, setFileDetails] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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
        withCredentials: true,
      });

      setUploadIds([res.data.uploadId] || []);
      
      // Small delay to show 100% state
      setTimeout(() => {
         navigate(dashboardPath);
      }, 800);
      
    } catch (err) {
      console.error(err);
      let msg2 = "Upload failed.";
      if (err?.response?.data?.message) msg2 = err.response.data.message;
      else if (err?.message) msg2 = err.message;
      
      setStatus("error");
      setErrorMessage(msg2);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    uploadFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    uploadFile(file);
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] flex items-center justify-center px-4 py-12 font-sans relative overflow-hidden">
      
      {/* ================= BACKGROUND GRID ================= */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--brand-primary)] rounded-full blur-[120px] opacity-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#0C4A6E] rounded-full blur-[120px] opacity-5" />

      <div className="relative z-10 w-full max-w-2xl">
        
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
            Secure Ingestion
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-[#192630] mb-3 tracking-tight">
            Upload Billing CSV
          </h1>
          <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
            Drag and drop your billing export here to generate instant cost intelligence.
          </p>
        </div>

        {/* UPLOAD CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 relative"
        >
          <div className="p-8 md:p-12 min-h-[400px] flex flex-col items-center justify-center">
            
            <AnimatePresence mode="wait">
              {status === "uploading" ? (
                /* LOADING STATE */
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center w-full max-w-md text-center"
                >
                  <div className="relative w-24 h-24 mb-6">
                    {/* Ring Animation */}
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="text-[var(--brand-primary)] w-8 h-8" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-[#192630] mb-2">Processing File</h2>
                  <p className="text-slate-500 mb-8 flex items-center justify-center gap-2 text-sm bg-slate-50 py-1.5 px-4 rounded-full border border-slate-100">
                    <span className="font-medium text-[#192630]">{fileDetails?.name}</span> 
                    <span className="w-1 h-1 rounded-full bg-slate-300" /> 
                    <span>{fileDetails?.size}</span>
                  </p>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.5, ease: "easeInOut" }}
                      className="h-full bg-[var(--brand-primary)] rounded-full relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_1s_infinite]" />
                    </motion.div>
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-4 font-medium animate-pulse">
                    Parsing rows & calculating anomalies...
                  </p>
                </motion.div>
              ) : (
                /* IDLE / DRAG STATE */
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col items-center"
                >
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      w-full flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 min-h-[320px] cursor-pointer group relative
                      ${isDragging 
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/20 scale-[1.02]' 
                        : status === 'error' 
                          ? 'border-red-300 bg-red-50/50 hover:bg-red-50' 
                          : 'border-slate-200 bg-slate-50/50 hover:border-[var(--brand-primary)] hover:bg-white'
                      }
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleChange}
                      className="hidden"
                    />

                    {/* Icon Circle */}
                    <div className={`
                      w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors shadow-sm
                      ${isDragging 
                        ? 'bg-white text-[var(--brand-primary)]' 
                        : status === 'error' 
                          ? 'bg-red-100 text-red-500' 
                          : 'bg-white text-[var(--brand-primary)] border border-slate-100 group-hover:scale-110 duration-300'
                      }
                    `}>
                      {status === 'error' ? (
                        <AlertCircle className="w-8 h-8" />
                      ) : (
                        <FileUp className="w-8 h-8" />
                      )}
                    </div>

                    <h3 className="font-bold text-xl mb-2 text-[#192630]">
                      {isDragging ? "Drop file to upload" : "Click to upload or drag & drop"}
                    </h3>
                    
                    <p className="text-slate-500 text-sm mb-8">
                      Max file size {MAX_MB}MB (CSV only)
                    </p>

                    {status === "error" && (
                      <div className="absolute bottom-4 left-0 w-full px-4">
                        <div className="bg-red-100 text-red-600 text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 mx-auto max-w-sm border border-red-200">
                          <AlertCircle size={16} /> {errorMessage}
                        </div>
                      </div>
                    )}

                    <button className="px-6 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-semibold text-sm shadow-lg shadow-[var(--brand-primary)]/20 group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all duration-300">
                      Select CSV File
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* Helper Links */}
        {/* <div className="mt-8 flex justify-center gap-6 text-sm font-medium text-slate-500">
          <button className="hover:text-[var(--brand-primary)] transition-colors flex items-center gap-1.5">
            <FileText size={14} /> Download Sample CSV
          </button>
          <span className="text-slate-300">|</span>
          <button className="hover:text-[var(--brand-primary)] transition-colors">
            Help Center
          </button>
        </div> */}

      </div>
    </div>
  );
};

export default CsvUploadInput;