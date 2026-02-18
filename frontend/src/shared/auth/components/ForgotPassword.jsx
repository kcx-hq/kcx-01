import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "react-hot-toast";

const API = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/auth/forgot-password`, { email });
      toast.success(res.data.message || "Reset link sent!");
      // Optional: navigate back after success or just show toast
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8F7] relative overflow-hidden">
      
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
      
      {/* Soft Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[var(--brand-primary)] rounded-full blur-[120px] opacity-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#0C4A6E] rounded-full blur-[120px] opacity-5" />

      {/* ================= MAIN CARD ================= */}
      <div className="w-full max-w-[440px] relative z-10">
        <div className="bg-white border border-slate-200/60 rounded-3xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] p-8 md:p-10">
          
          {/* Header Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-[var(--brand-primary-soft)] rounded-2xl flex items-center justify-center text-[var(--brand-primary)] shadow-sm">
              <KeyRound size={28} />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#192630] tracking-tight">Forgot Password?</h1>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1 block">
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={`
                    w-full font-medium rounded-xl py-3 pl-11 pr-4 
                    border outline-none text-sm transition-all duration-200 
                    placeholder:text-slate-400
                    ${focusedField === 'email' 
                      ? 'bg-white border-[var(--brand-primary)] ring-4 ring-[var(--brand-primary-soft)] text-[#192630]' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-100'}
                  `}
                  placeholder="Enter your email"
                />
                <div 
                  className={`
                    absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10 transition-colors duration-200
                    ${focusedField === 'email' ? 'text-[var(--brand-primary)]' : 'text-slate-400'}
                  `}
                >
                  <Mail size={18} />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold rounded-xl py-3.5 text-sm shadow-lg shadow-[var(--brand-primary)]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white/90" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-[var(--brand-primary)] transition-colors group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to log in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}