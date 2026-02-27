import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LoginData } from "../types";

interface LoginFormProps {
  loginData: LoginData;
  setLoginData: React.Dispatch<React.SetStateAction<LoginData>>;
  handleLogin: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  isSigningIn: boolean;
  onSwitchToSignup: () => void;
}

interface InputGroupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onFocus" | "onBlur" | "onChange"> {
  label: string;
  icon: LucideIcon;
  isFocused: boolean;
  onFocus: React.FocusEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

const LoginForm = ({
  loginData,
  setLoginData,
  handleLogin,
  isSigningIn,
  onSwitchToSignup,
}: LoginFormProps) => {
  const navigate = useNavigate();
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-5">
        {/* Email Field */}
        <InputGroup
          label="Email Address"
          type="email"
          placeholder="you@company.com"
          value={loginData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLoginData({ ...loginData, email: e.target.value })
          }
          icon={Mail}
          isFocused={focusedField === "email"}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField(null)}
        />

        {/* Password Field */}
        <InputGroup
          label="Password"
          type="password"
          placeholder="Enter password"
          value={loginData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLoginData({ ...loginData, password: e.target.value })
          }
          icon={Lock}
          isFocused={focusedField === "password"}
          onFocus={() => setFocusedField("password")}
          onBlur={() => setFocusedField(null)}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setRememberMe(e.target.checked)
            }
            className="w-4 h-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
          />
          <span className="text-sm text-gray-500 group-hover:text-gray-700">Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-sm font-semibold text-[var(--brand-primary)] hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isSigningIn}
        className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold rounded-xl py-3.5 text-sm shadow-lg shadow-[var(--brand-primary)]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
      >
        <div className="flex items-center justify-center gap-2">
          {isSigningIn ? "Signing In..." : <>Sign In <ArrowRight size={16} /></>}
        </div>
      </button>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-500">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-bold text-[#192630] hover:text-[var(--brand-primary)] ml-1"
          >
            Sign up
          </button>
        </p>
      </div>
    </form>
  );
};

const InputGroup = ({
  label,
  icon: Icon,
  isFocused,
  onFocus,
  onBlur,
  ...props
}: InputGroupProps) => (
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
          ${
            isFocused
              ? "bg-white border-[var(--brand-primary)] ring-4 ring-[var(--brand-primary-soft)] text-[#192630]"
              : "bg-gray-50 border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-100"
          }
        `}
      />
      <div
        className={`
          absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 transition-colors duration-200
          ${isFocused ? "text-[var(--brand-primary)]" : "text-gray-400"}
        `}
      >
        <Icon size={18} />
      </div>
    </div>
  </div>
);

export default LoginForm;
