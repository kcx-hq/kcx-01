import React, { useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => params.get("token"), [params]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!token) {
      setMsg("Reset token missing. Please use the email link again.");
      return;
    }
    if (password !== confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });
      setMsg(res.data.message);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0c]">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#121218]/70 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Reset Password</h1>
            <p className="text-sm text-gray-400 mt-1">
              Enter a new password for your account.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                New Password
              </label>
              <input
                type="password"
                className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-2.5 px-3 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                Confirm Password
              </label>
              <input
                type="password"
                className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-2.5 px-3 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            {msg && (
              <div
                className={`text-sm rounded-xl px-3 py-2 border ${
                  msg.toLowerCase().includes("success") ||
                  msg.toLowerCase().includes("successful")
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border-red-500/20 text-red-300"
                }`}
              >
                {msg}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#8B2FC9] hover:bg-[#7a25b3] text-white font-bold rounded-xl py-3 shadow-[0_4px_14px_0_rgba(139,47,201,0.39)] w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

            {/* Back to login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-[#8B2FC9] hover:text-white transition-colors font-medium"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-600 mt-4">
          Link expired? Request a new reset link from{" "}
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-[#8B2FC9] hover:text-white transition-colors font-medium"
          >
            Forgot Password
          </button>
        </p>
      </div>
    </div>
  );
}
