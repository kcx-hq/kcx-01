import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await axios.post(`${API}/api/auth/forgot-password`, { email });
      setMsg(res.data.message);
    } catch {
      setMsg("Something went wrong.");
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
            <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
            <p className="text-sm text-gray-400 mt-1">
              Enter your email and we’ll send you a reset link.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-2.5 px-3 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            {msg && (
              <div className="text-sm rounded-xl px-3 py-2 bg-white/5 border border-white/10 text-gray-300">
                {msg}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#8B2FC9] hover:bg-[#7a25b3] text-white font-bold rounded-xl py-3 shadow-[0_4px_14px_0_rgba(139,47,201,0.39)] w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "Sending..." : "Send Reset Link"}
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
          Remembered your password?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-[#8B2FC9] hover:text-white transition-colors font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
