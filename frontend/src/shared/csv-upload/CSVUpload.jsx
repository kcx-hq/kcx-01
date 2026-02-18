import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, Lock, ArrowLeft, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/Authstore";
import CSVUploadInput from "./CSVUploadInput"; 

const CsvUploadGatePage = () => {
  const navigate = useNavigate();
  const { fetchUser } = useAuthStore();

  const [checking, setChecking] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const result = await fetchUser();
        const me = result?.user;

        if (me) {
          const premium = !!me.is_premium;
          const uploaded = !!me.hasUploaded;

          setIsPremium(premium);
          setHasUploaded(uploaded);

          if (premium || !uploaded) {
             // If premium OR hasn't uploaded yet, they are allowed to stay here (which renders CSVUploadInput)
             // If they HAVE uploaded and are NOT premium, they fall through to the lock screen
             setChecking(false);
             return;
          }
          
          setChecking(false);
          return;
        }

        // fallback for direct API check if store is empty
        const API_URL = import.meta.env.VITE_API_URL;
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true,
        });

        const premium2 = !!res.data?.isPremium || !!res.data?.is_premium;
        const uploaded2 = !!res.data?.hasUploaded;

        setIsPremium(premium2);
        setHasUploaded(uploaded2);

      } catch (e) {
        console.error("Gate check failed:", e);
      } finally {
        setChecking(false);
      }
    };

    run();
  }, [fetchUser, navigate]);

  // Logic: Locked if NOT premium AND HAS uploaded
  const freeLocked = !isPremium && hasUploaded;

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F7F8F7] flex flex-col items-center justify-center relative overflow-hidden">
         {/* Background Grid */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
            backgroundImage: `
                linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            }}
        />
        <Loader2 className="animate-spin text-[var(--brand-primary)] w-10 h-10 mb-4 relative z-10" />
        <p className="text-slate-500 font-medium relative z-10">Verifying access...</p>
      </div>
    );
  }

  if (freeLocked) {
    return (
      <div className="min-h-screen bg-[#F7F8F7] flex items-center justify-center px-4 relative overflow-hidden">
        
        {/* ================= BACKGROUND GRID ================= */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        
        {/* Ambient Glows */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[var(--brand-primary)] rounded-full blur-[140px] opacity-10" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#0C4A6E] rounded-full blur-[140px] opacity-5" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-lg relative z-10"
        >
          <div className="bg-white border border-slate-200/60 rounded-3xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] p-8 md:p-12 text-center overflow-hidden relative">
            
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--brand-primary)] to-[#0C4A6E]" />

            {/* Premium Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
                <Zap size={14} fill="currentColor" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Premium Feature
                </span>
              </div>
            </div>

            {/* Lock Icon */}
            <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-inner relative">
               <div className="absolute inset-0 rounded-full bg-slate-200/50 animate-pulse" />
               <Lock className="text-slate-400 w-8 h-8 relative z-10" />
            </div>

            <h2 className="text-3xl font-bold text-[#192630] mb-3 tracking-tight">
              Upload Limit Reached
            </h2>
            
            <p className="text-slate-500 mb-8 leading-relaxed">
              You've used your <span className="font-semibold text-[#192630]">1 free upload</span>. 
              To process more billing files and unlock advanced analytics, please upgrade to Premium.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/pricing")} // Assuming you have a pricing page, or billing
                className="w-full group relative overflow-hidden bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold rounded-xl py-4 shadow-lg shadow-[var(--brand-primary)]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                   Upgrade to Premium <Zap size={16} fill="currentColor" />
                </div>
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full py-3.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
            </div>

          </div>
          
          <p className="text-center text-xs text-slate-400 mt-6 font-medium">
            Enterprise need? <span className="text-[var(--brand-primary)] cursor-pointer hover:underline">Contact Sales</span>
          </p>
          
        </motion.div>
      </div>
    );
  }

  // ✅ Allowed -> Show Upload Component
  return <CSVUploadInput />;
};

export default CsvUploadGatePage;