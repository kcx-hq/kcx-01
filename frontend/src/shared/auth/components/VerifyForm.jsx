import React from "react";
import { CheckCircle2 } from "lucide-react";

const VerifyForm = ({ otp, setOtp, handleVerify, isVerifying, emailForVerify, onBackToLogin }) => {
  return (
    <form onSubmit={handleVerify} className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-[#a02ff1]/10 rounded-full flex items-center justify-center text-[#a02ff1] mb-6 border border-[#a02ff1]/20">
          <CheckCircle2 size={32} />
        </div>

        <div className="w-full">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block text-center">
            Verification Code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-4 px-4 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full text-center text-2xl tracking-[0.5em] font-mono"
            placeholder="••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isVerifying}
        className="bg-[#8B2FC9] hover:bg-[#7a25b3] text-white font-bold rounded-xl py-3 shadow-[0_4px_14px_0_rgba(139,47,201,0.39)] w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isVerifying ? "Verifying..." : "Verify Code"}
      </button>

      <div className="text-center">
        <button type="button" onClick={onBackToLogin} className="text-sm text-gray-500 hover:text-white transition-colors">
          Back to Login
        </button>
      </div>
    </form>
  );
};

export default VerifyForm;
