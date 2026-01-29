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
        const res = await axios.get(`${API_URL}/auth/me`, {
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
          <Loader2 className="animate-spin text-[#a02ff1] w-12 h-12 mb-4" />
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
          className="w-full max-w-2xl bg-[#1a1b20]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center"
        >
          {/* Premium badge with golden crown */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <span className="text-yellow-400 text-sm">👑</span>
              <span className="text-yellow-300 text-xs font-bold uppercase tracking-wider">
                Premium
              </span>
            </div>
          </div>

          {/* Free limit reached */}
          <div className="w-20 h-20 rounded-full bg-[#1a1b20] border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Lock className="text-gray-300 w-8 h-8" />
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
              className="px-6 py-3 rounded-xl bg-[#a02ff1] hover:bg-[#8e25d9] text-white font-semibold transition-colors"
            >
              Upgrade to Premium
            </button>

            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
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
