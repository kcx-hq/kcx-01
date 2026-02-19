import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/Authstore"; 
import { toast } from "react-hot-toast";

import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import VerifyForm from "./VerifyForm";

const AuthModal = ({ isOpen, onClose, initialView = "login" }) => {
  const navigate = useNavigate();
  const { isSigningIn, signIn, isSigningUp, signUp, isVerifying, verifyEmail } = useAuthStore();

  // --- VIEW STATE ---
  const [view, setView] = useState(initialView);
  const [emailForVerify, setEmailForVerify] = useState("");

  // --- FORM DATA ---
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "",
    companyName: "",
    companyEmail: ""
  });
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setLoginData({ email: "", password: "" });
      setOtp("");
      setShowPassword(false);
    }
  }, [isOpen, initialView]);

  // --- HANDLERS (Unchanged) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await signIn(loginData);
    if (response.success) {
      onClose();
      navigate("/upload");
    } else {
      if (response.status === 403) {
        setEmailForVerify(loginData.email);
        setView("verify");
      } else {
        toast.error(response.message || "Sign in failed");
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const payload = {
      full_name: signupData.fullName,
      email: signupData.email,
      password: signupData.password,
      role: signupData.role,
      client_name: signupData.companyName,
      client_email: signupData.companyEmail,
    };

    const response = await signUp(payload);
    console.log(response);

    if (response.success) {
      setEmailForVerify(signupData.email);
      setView("verify");
    } else {
      toast.error(response.message);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const response = await verifyEmail({ email: emailForVerify, otp });
    if (response.success) {
      toast.success("Email verified! Please sign in.");
      setView("login");
    } else {
      toast.error(response.message || "Verification failed");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* === BACKDROP with Grid Effect === */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#F7F8F7]/90 backdrop-blur-sm"
        >
          {/* Subtle Grid in Backdrop */}
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
        </motion.div>

        {/* === MODAL CARD === */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          // ✅ FIX: Added 'overflow-hidden' to clip the corners of the green bar
          className="relative w-full max-w-lg bg-white border border-slate-200/60 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* ✅ FIX: Top Brand Stripe - Now a normal block element, not absolute */}
          <div className="w-full h-1.5 bg-[var(--brand-primary)] flex-shrink-0" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-[var(--brand-primary)] hover:bg-slate-50 p-2 rounded-full z-30 transition-all duration-200"
          >
            <X size={20} />
          </button>

          {/* Scrollable Content Area */}
          <div className="overflow-y-auto custom-scrollbar p-8 sm:p-10">
            
            {/* Header Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#192630] mb-3 tracking-tight">
                {view === "login" && "Welcome Back"}
                {view === "signup" && "Create Account"}
                {view === "verify" && "Verify OTP"}
              </h2>
              <p className="text-slate-500 text-sm">
                {view === "login" && "Sign in to your FinOps dashboard"}
                {view === "signup" && "Start saving on cloud costs today"}
                {view === "verify" && (
                  <span>
                    Enter the code sent to <span className="font-semibold text-[var(--brand-primary)]">{emailForVerify}</span>
                  </span>
                )}
              </p>
            </div>

            {/* Form Rendering */}
            <div className="relative z-10">
              {view === "login" && (
                <LoginForm
                  loginData={loginData}
                  setLoginData={setLoginData}
                  handleLogin={handleLogin}
                  isSigningIn={isSigningIn}
                  onSwitchToSignup={() => setView("signup")}
                />
              )}

              {view === "signup" && (
                <SignupForm
                  signupData={signupData}
                  setSignupData={setSignupData}
                  handleSignup={handleSignup}
                  isSigningUp={isSigningUp}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  onSwitchToLogin={() => setView("login")}
                />
              )}

              {view === "verify" && (
                <VerifyForm
                  otp={otp}
                  setOtp={setOtp}
                  handleVerify={handleVerify}
                  isVerifying={isVerifying}
                  emailForVerify={emailForVerify}
                  onBackToLogin={() => setView("login")}
                />
              )}
            </div>

            {/* Footer / Trust Badge */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <ShieldCheck size={14} className="text-[var(--brand-primary)]" /> 
                Secured by KCX
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;