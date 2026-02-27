import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, ArrowLeft, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/Authstore";
import CSVUploadInput from "./CSVUploadInput";
import { uploadGridStyle, uploadTheme } from "./theme";
import { apiGet } from "../../services/http";

interface UserResponseShape {
  isPremium?: boolean;
  is_premium?: boolean;
  hasUploaded?: boolean;
}

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
            // If premium OR hasn't uploaded yet, they can stay here and upload.
            // If they HAVE uploaded and are NOT premium, show the lock screen.
            setChecking(false);
            return;
          }

          setChecking(false);
          return;
        }

        // Fallback when auth store is empty.
        const response = await apiGet<UserResponseShape>("/api/auth/me");

        const premium2 = !!response?.isPremium || !!response?.is_premium;
        const uploaded2 = !!response?.hasUploaded;

        setIsPremium(premium2);
        setHasUploaded(uploaded2);
      } catch (e: unknown) {
        console.error("Gate check failed:", e);
      } finally {
        setChecking(false);
      }
    };

    run();
  }, [fetchUser, navigate]);

  // Locked if NOT premium AND HAS uploaded.
  const freeLocked = !isPremium && hasUploaded;

  if (checking) {
    return (
      <div className={`${uploadTheme.pageShell} flex flex-col items-center justify-center`}>
        <div className={uploadTheme.pageGrid} style={uploadGridStyle} />
        <Loader2 className="relative z-10 mb-4 h-10 w-10 animate-spin text-[var(--brand-primary)]" />
        <p className={`relative z-10 font-medium ${uploadTheme.mutedText}`}>Verifying access...</p>
      </div>
    );
  }

  if (freeLocked) {
    return (
      <div className={`${uploadTheme.pageShell} flex items-center justify-center px-4`}>
        <div className={uploadTheme.pageGrid} style={uploadGridStyle} />

        <div className="absolute right-[-10%] top-[-20%] h-[600px] w-[600px] rounded-full bg-[var(--brand-primary)] opacity-10 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[var(--bg-dark)] opacity-10 blur-[140px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg"
        >
          <div className={`${uploadTheme.panel} relative overflow-hidden p-8 text-center md:p-12`}>
            <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--bg-dark)]" />

            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 shadow-sm">
                <Zap size={14} fill="currentColor" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Premium Feature
                </span>
              </div>
            </div>

            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-inner">
              <div className="absolute inset-0 animate-pulse rounded-full bg-[var(--brand-primary-soft)]/70" />
              <Lock className="relative z-10 h-8 w-8 text-[var(--text-muted)]" />
            </div>

            <h2 className="mb-3 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Upload Limit Reached
            </h2>

            <p className="mb-8 leading-relaxed text-[var(--text-secondary)]">
              You've used your{" "}
              <span className="font-semibold text-[var(--text-primary)]">1 free upload</span>. To
              process more billing files and unlock advanced analytics, please upgrade to Premium.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/pricing")}
                className={`group relative w-full overflow-hidden rounded-xl py-4 font-bold shadow-lg shadow-[var(--brand-primary)]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${uploadTheme.primaryButton}`}
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  Upgrade to Premium <Zap size={16} fill="currentColor" />
                </div>
              </button>

              <button
                onClick={() => navigate("/")}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold transition-colors ${uploadTheme.secondaryButton}`}
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
            </div>
          </div>

          <p className={`mt-6 text-center text-xs font-medium ${uploadTheme.mutedText}`}>
            Enterprise need?{" "}
            <span className="cursor-pointer text-[var(--brand-primary)] hover:underline">
              Contact Sales
            </span>
          </p>
        </motion.div>
      </div>
    );
  }

  // Allowed -> show upload component.
  return <CSVUploadInput />;
};

export default CsvUploadGatePage;
