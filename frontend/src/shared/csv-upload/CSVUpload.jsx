import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/Authstore";
import CSVUploadInput from "./CSVUploadInput"; // adjust path

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

          if (premium && uploaded) {
            navigate("/billing-uploads", { replace: true });
            return;
          }

          setChecking(false);
          return;
        }

        // fallback
        const API_URL = import.meta.env.VITE_API_URL;
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true,
        });

        const premium2 = !!res.data?.isPremium || !!res.data?.is_premium;
        const uploaded2 = !!res.data?.hasUploaded;

        setIsPremium(premium2);
        setHasUploaded(uploaded2);

        if (premium2 && uploaded2) {
          navigate("/billing-uploads", { replace: true });
          return;
        }
      } catch (e) {
        console.error("Gate check failed:", e);
      } finally {
        setChecking(false);
      }
    };

    run();
  }, [fetchUser, navigate]);

  // free user lock
  const freeLocked = !isPremium && hasUploaded;

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin text-[var(--brand-secondary)] w-12 h-12 mb-4" />
          <p className="text-gray-400">Checking upload status...</p>
        </div>
      </div>
    );
  }

  if (freeLocked) {
    return (
      <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-[#111113] border border-white/10 rounded-3xl p-10 text-center"
        >
          {/* Premium badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="text-sm">👑</span>
              <span className="text-gray-200 text-xs font-bold uppercase tracking-wider">
                Premium
              </span>
            </div>
          </div>

          {/* Lock icon */}
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="text-gray-200 w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Free limit reached
          </h2>
          <p className="text-gray-400 mb-8">
            Only <span className="text-white font-semibold">1 upload</span> is
            allowed in the free tier.
            <br />
            Upgrade to Premium to upload more files.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/billing-uploads")}
              className="px-6 py-3 rounded-xl bg-[var(--brand-secondary)] hover:opacity-90 text-white font-semibold transition"
            >
              Upgrade to Premium
            </button>

            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold transition"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ✅ allowed -> show upload-only page (no checks inside)
  return <CSVUploadInput />;
};

export default CsvUploadGatePage;
