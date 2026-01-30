import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const SignupForm = ({ signupData, setSignupData, handleSignup, isSigningUp, showPassword, setShowPassword, onSwitchToLogin }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleTermsClick = (e) => {
    e.preventDefault();
    setAcceptedTerms(false);
    window.open("/terms-of-service", "_blank", "noopener,noreferrer");
  };

  const handlePrivacyClick = (e) => {
    e.preventDefault();
    setAcceptedTerms(false);
    window.open("/privacy-policy", "_blank", "noopener,noreferrer");
  };

  return (
    <form onSubmit={handleSignup} className="space-y-5">
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/10 pb-2">Personal Information</h3>

        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={signupData.fullName}
            onChange={(e) => setSignupData({...signupData, [e.target.name]: e.target.value})}
            required
            className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-2.5 px-3 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Email Address</label>
          <input
            type="email"
            name="email"
            value={signupData.email}
            onChange={(e) => setSignupData({...signupData, [e.target.name]: e.target.value})}
            required
            className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-2.5 px-3 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full"
            placeholder="you@example.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={signupData.password}
                onChange={(e) => setSignupData({...signupData, [e.target.name]: e.target.value})}
                required
                minLength={8}
                className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-2.5 px-3 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full pr-8"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Role</label>
            <select
              name="role"
              value={signupData.role}
              onChange={(e) => setSignupData({...signupData, [e.target.name]: e.target.value})}
              required
              className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-2.5 px-3 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full"
            >
              <option value="" disabled>Select</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/10 pb-2">Company Information</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={signupData.companyName}
              onChange={(e) => setSignupData({...signupData, [e.target.name]: e.target.value})}
              className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-2.5 px-3 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full"
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Company Email</label>
            <input
              type="email"
              name="companyEmail"
              value={signupData.companyEmail}
              onChange={(e) => setSignupData({...signupData, [e.target.name]: e.target.value})}
              className="bg-[#0a0a0c] border border-white/10 text-white rounded-xl py-2.5 px-3 focus:border-[#8B2FC9] focus:ring-[#8B2FC9]/20 outline-none w-full"
              placeholder="contact@acme.com"
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <label className="flex items-start">
          <input 
            type="checkbox" 
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            required 
            className="mt-1 rounded border-white/10 bg-[#0a0a0c] text-[#8B2FC9] focus:ring-[#8B2FC9]/20" 
          />
          <span className="ml-2 text-xs text-gray-400">
            I agree to the{" "}
            <a 
              href="/terms-of-service" 
              onClick={handleTermsClick}
              className="text-[#8B2FC9] cursor-pointer hover:text-white underline"
            >
              Terms
            </a>
            {" "}and{" "}
            <a 
              href="/privacy-policy" 
              onClick={handlePrivacyClick}
              className="text-[#8B2FC9] cursor-pointer hover:text-white underline"
            >
              Privacy Policy
            </a>
          </span>
        </label>
        <label className="flex items-start mt-2">
          <input type="checkbox" className="mt-1 rounded border-white/10 bg-[#0a0a0c] text-[#8B2FC9] focus:ring-[#8B2FC9]/20" />
          <span className="ml-2 text-xs text-gray-400">Subscribe to newsletter</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSigningUp}
        className="bg-[#8B2FC9] hover:bg-[#7a25b3] text-white font-bold rounded-xl py-3 shadow-[0_4px_14px_0_rgba(139,47,201,0.39)] w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-4"
      >
        {isSigningUp ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating Account...
          </span>
        ) : (
          "Create Account"
        )}
      </button>

      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-white/10"></div>
        <span className="px-4 text-sm text-gray-500">OR</span>
        <div className="flex-1 border-t border-white/10"></div>
      </div>

      <div className="text-center mt-4">
        <p className="text-gray-400 text-sm">
          Already have an account?{" "}
          <button type="button" onClick={onSwitchToLogin} className="text-[#8B2FC9] hover:text-white font-bold transition-colors ml-1">
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
};

export default SignupForm;
