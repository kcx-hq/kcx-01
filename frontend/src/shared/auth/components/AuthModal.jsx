import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/Authstore.jsx"; // Updated path
import { toast } from "react-hot-toast";

import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import VerifyForm from "./VerifyForm";

const AuthModal = ({ isOpen, onClose, initialView = "login" }) => {
  const navigate = useNavigate();
  const { isSigningIn, signIn, isSigningUp, signUp, isVerifying, verifyEmail } = useAuthStore();

  // --- VIEW STATE (login | signup | verify) ---
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

  // --- HANDLERS ---

  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await signIn(loginData);
    if (response.success) {
      onClose();
      // Always redirect to upload page (it will handle disabled state if already uploaded)
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
    console.log(response)

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[#121214] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-[#a02ff1] to-blue-500 z-20" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-full z-20 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto custom-scrollbar p-6 sm:p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {view === "login" && "Welcome Back"}
                {view === "signup" && "Create Account"}
                {view === "verify" && "Verify OTP"}
              </h2>
              <p className="text-gray-400 text-sm">
                {view === "login" && "Sign in to your account to continue"}
                {view === "signup" && "Fill in your details to get started"}
                {view === "verify" && `Enter the code sent to ${emailForVerify}`}
              </p>
            </div>

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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
