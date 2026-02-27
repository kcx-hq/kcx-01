import React from "react";
import { ShieldCheck, ArrowLeft, Mail } from "lucide-react";

interface VerifyFormProps {
  otp: string;
  setOtp: React.Dispatch<React.SetStateAction<string>>;
  handleVerify: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  isVerifying: boolean;
  emailForVerify: string;
  onBackToLogin: () => void;
}

const VerifyForm = ({
  otp,
  setOtp,
  handleVerify,
  isVerifying,
  emailForVerify,
  onBackToLogin,
}: VerifyFormProps) => {
  
  // Helper to allow only numbers and max 6 chars
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-8">
      
      {/* ================= ICON HEADER ================= */}
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          {/* Glowing Ring Effect */}
          <div className="absolute inset-0 bg-[var(--brand-primary)] rounded-full opacity-20 blur-xl animate-pulse" />
          
          <div className="relative w-20 h-20 bg-[var(--brand-primary-soft)] rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
            <ShieldCheck size={40} className="text-[var(--brand-primary)]" strokeWidth={1.5} />
            
            {/* Small floating mail icon */}
            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-gray-100">
              <Mail size={14} className="text-[var(--brand-primary)]" />
            </div>
          </div>
        </div>

        {/* Email Context */}
        <div className="text-center space-y-1 mb-2">
          <p className="text-sm text-gray-500">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-bold text-[#192630] bg-gray-100 px-3 py-1 rounded-full inline-block border border-gray-200">
            {emailForVerify || "your email"}
          </p>
        </div>
      </div>

      {/* ================= INPUT SECTION ================= */}
      <div className="w-full">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 block text-center">
          Enter Verification Code
        </label>
        
        <div className="relative group">
          <input
            type="text"
            value={otp}
            onChange={handleInput}
            maxLength={6}
            autoFocus
            className={`
              w-full bg-gray-50 border border-gray-200 text-[#192630] rounded-2xl py-5 px-4
              focus:bg-white focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary-soft)]
              outline-none text-center text-4xl tracking-[0.5em] font-mono font-bold 
              transition-all duration-300 placeholder:text-gray-300 shadow-inner
              ${otp.length === 6 ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/10' : ''}
            `}
            placeholder="000000"
          />
          
          {/* Visual indicator for input length */}
          <div className="absolute -bottom-6 left-0 w-full flex justify-center gap-1">
             {[...Array(6)].map((_, i) => (
               <div 
                 key={i} 
                 className={`h-1 rounded-full transition-all duration-300 ${i < otp.length ? 'w-4 bg-[var(--brand-primary)]' : 'w-1.5 bg-gray-200'}`} 
               />
             ))}
          </div>
        </div>
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="pt-2 space-y-4">
        <button
          type="submit"
          disabled={isVerifying || otp.length < 6}
          className="w-full group relative overflow-hidden bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold rounded-xl py-3.5 text-sm shadow-lg shadow-[var(--brand-primary)]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
        >
          <div className="flex items-center justify-center gap-2 relative z-10">
            {isVerifying ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white/90" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Verifying...</span>
              </>
            ) : (
              "Verify Email"
            )}
          </div>
        </button>

        <div className="flex flex-col items-center gap-3">
           <button 
             type="button" 
             className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
           >
             Didn't receive code? Resend
           </button>
           
           <button 
             type="button" 
             onClick={onBackToLogin} 
             className="flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--brand-primary)] transition-colors group"
           >
             <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
             Back to Login
           </button>
        </div>
      </div>
    </form>
  );
};

export default VerifyForm;
