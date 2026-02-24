import React, { useState } from "react";
import { 
  Eye, EyeOff, User, Mail, Briefcase, Building2, Globe, Lock 
} from "lucide-react";
import { Link } from "react-router-dom";

const SignupForm = ({ 
  signupData, setSignupData, handleSignup, isSigningUp, 
  showPassword, setShowPassword, onSwitchToLogin 
}) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSignup} className="space-y-6">
      
      {/* PERSONAL INFO */}
      <div className="space-y-5">
        <InputGroup 
          label="Full Name"
          name="fullName"
          type="text"
          placeholder="Ex. Sarah Connor"
          value={signupData.fullName}
          onChange={handleChange}
          icon={User}
          isFocused={focusedField === 'fullName'}
          onFocus={() => setFocusedField('fullName')}
          onBlur={() => setFocusedField(null)}
        />

        <InputGroup 
          label="Work Email"
          name="email"
          type="email"
          placeholder="name@company.com"
          value={signupData.email}
          onChange={handleChange}
          icon={Mail}
          isFocused={focusedField === 'email'}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* PASSWORD FIELD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1 block">Password</label>
            <div className="relative group">
              {/* Input First */}
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={signupData.password}
                onChange={handleChange}
                required
                minLength={8}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className={`
                  w-full font-medium rounded-xl py-2.5 pl-10 pr-10 
                  border outline-none text-sm transition-all duration-200 placeholder:text-gray-400
                  ${focusedField === 'password' 
                    ? 'bg-white border-[var(--brand-primary)] ring-4 ring-[var(--brand-primary-soft)] text-[#192630]' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-100'}
                `}
                placeholder="••••••••"
              />
              
              {/* Left Icon (Lock) */}
              <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 transition-colors duration-200 ${focusedField === 'password' ? 'text-[var(--brand-primary)]' : 'text-gray-400'}`}>
                <Lock size={18} />
              </div>

              {/* Right Icon (Eye Toggle) */}
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--brand-primary)] transition-colors z-20"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          {/* ROLE SELECT */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1 block">Role</label>
            <div className="relative">
              <select
                name="role"
                value={signupData.role}
                onChange={handleChange}
                required
                onFocus={() => setFocusedField('role')}
                onBlur={() => setFocusedField(null)}
                className={`
                  w-full font-medium rounded-xl py-2.5 pl-10 pr-8 
                  border outline-none text-sm appearance-none cursor-pointer transition-all duration-200 
                  ${focusedField === 'role' 
                    ? 'bg-white border-[var(--brand-primary)] ring-4 ring-[var(--brand-primary-soft)] text-[#192630]' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-100'}
                `}
              >
                <option value="" disabled>Select Role</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
              
              {/* Icon */}
              <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 transition-colors duration-200 ${focusedField === 'role' ? 'text-[var(--brand-primary)]' : 'text-gray-400'}`}>
                <Briefcase size={18} />
              </div>
              
              {/* Chevron */}
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ORGANIZATION */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-200"></div></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organization</span></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputGroup 
          label="Company Name"
          name="companyName"
          type="text"
          placeholder="Acme Corp."
          value={signupData.companyName}
          onChange={handleChange}
          icon={Building2}
          isFocused={focusedField === 'companyName'}
          onFocus={() => setFocusedField('companyName')}
          onBlur={() => setFocusedField(null)}
        />
        <InputGroup 
          label="Company Email"
          name="companyEmail"
          type="email"
          placeholder="admin@acme.com"
          value={signupData.companyEmail}
          onChange={handleChange}
          icon={Globe}
          isFocused={focusedField === 'companyEmail'}
          onFocus={() => setFocusedField('companyEmail')}
          onBlur={() => setFocusedField(null)}
        />
      </div>

      {/* FOOTER */}
      <div className="space-y-4 pt-2">
        <label className="flex items-start gap-3 cursor-pointer group select-none">
          <input 
            type="checkbox" 
            checked={acceptedTerms} 
            onChange={(e) => setAcceptedTerms(e.target.checked)} 
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" 
          />
          <span className="text-xs text-gray-500">I agree to the <Link to="#" className="font-semibold text-gray-900 underline decoration-gray-300 hover:decoration-[var(--brand-primary)]">Terms</Link> and <Link to="#" className="font-semibold text-gray-900 underline decoration-gray-300 hover:decoration-[var(--brand-primary)]">Privacy Policy</Link>.</span>
        </label>

        <button
          type="submit"
          disabled={isSigningUp || !acceptedTerms}
          className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold rounded-xl py-3.5 text-sm shadow-lg shadow-[var(--brand-primary)]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
        >
          {isSigningUp ? "Creating Account..." : "Create Account"}
        </button>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-500">Already have an account? <button type="button" onClick={onSwitchToLogin} className="font-bold text-[#192630] hover:text-[var(--brand-primary)] ml-1">Sign in</button></p>
      </div>
    </form>
  );
};

// --- Paste the InputGroup component from Step 1 here ---
const InputGroup = ({ label, icon: Icon, isFocused, onFocus, onBlur, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1 block">
      {label}
    </label>
    <div className="relative group">
      <input
        {...props}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`
          w-full font-medium rounded-xl py-2.5 pl-10 pr-4 
          border outline-none text-sm transition-all duration-200 
          placeholder:text-gray-400
          ${isFocused 
            ? 'bg-white border-[var(--brand-primary)] ring-4 ring-[var(--brand-primary-soft)] text-[#192630]' 
            : 'bg-gray-50 border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-100'}
        `}
      />
      <div 
        className={`
          absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 transition-colors duration-200
          ${isFocused ? 'text-[var(--brand-primary)]' : 'text-gray-400'}
        `}
      >
        <Icon size={18} />
      </div>
    </div>
  </div>
);

export default SignupForm;