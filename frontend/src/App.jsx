import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Shared Components
import {
  Navbar,
  Hero,
  About,
  FinOpsSection,
  Features,
  Pricing,
  InquirySection,
  Footer,
  HowItWorks,
  SlotBookingPage,
  TermsOfService,
  PrivacyPolicy,
} from "./shared/home";

// Dashboard Components
import Dashboard from "./core-dashboard/dashboard/DashboardPage";
import CSVUpload from "./shared/csv-upload/CSVUpload";

import "./index.css";
import BillingUploads from "./shared/csv-upload/BillingUpload";
import CsvUploadInput from "./shared/csv-upload/CSVUploadInput";
import ClientDDashboard from "./clients/client-d/dashboard/client-d.dashboard.page.jsx";

import { useCaps } from "./hooks/useCaps.js";
import { useDashboardStore } from "./store/Dashboard.store.jsx";

import ClientC from "./clients/client-c/client-c";

import Chatbot from "./shared/chatbot/Chatbot.jsx";
import ForgotPassword from "./shared/auth/components/ForgotPassword.jsx";
import ResetPassword from "./shared/auth/components/ResetPassword.jsx";
const Home = () => {
  const [showJourneySection, setShowJourneySection] = useState(false);
  const [isCTAActivated, setIsCTAActivated] = useState(false);
  const [showAttentionGrabber, setShowAttentionGrabber] = useState(false);

  // ✅ Chat widget state
  const [isChatOpen, setIsChatOpen] = useState(false);

  const showJourney = () => setShowJourneySection(true);

  const activateCTA = () => {
    setIsCTAActivated(true);
    setShowAttentionGrabber(true);
    setTimeout(() => setShowAttentionGrabber(false), 4500);

    // Optional: auto-open chat when CTA is activated
    // setIsChatOpen(true);
  };

  const deactivateCTA = () => {
    setIsCTAActivated(false);
    setShowAttentionGrabber(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] font-sans overflow-x-hidden">
      <Navbar showJourney={showJourney} />

      <main>
        <Hero
          isCTAActivated={isCTAActivated}
          deactivateCTA={deactivateCTA}
          showAttentionGrabber={showAttentionGrabber}
          showJourney={showJourney}
        />

        <About />
        <FinOpsSection />
        <Features />
        <Pricing />

        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              className="fixed bottom-6 right-6 z-[999]"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="relative w-[320px] sm:w-[360px] h-[480px] overflow-hidden rounded-2xl">
                <Chatbot onClose={() => setIsChatOpen(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <InquirySection />
      </main>

      <Footer />
      <button
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="
    fixed bottom-6 right-6 z-50 rounded-full
    px-5 py-3 text-white font-semibold
    bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700
    shadow-[0_10px_30px_rgba(168,85,247,0.45)]
    hover:shadow-[0_12px_40px_rgba(168,85,247,0.7)]
    transition-all duration-300
     overflow-hidden
  "
      >
        {/* glow pulse layer */}
        <span
          className="
      absolute inset-0 rounded-full
      bg-purple-500/30 blur-xl
      animate-pulse
      pointer-events-none
    "
        />
        {/* content */}
        <span className="relative z-10">
          {isChatOpen ? "Close chat" : "Chat with us"}
        </span>
      </button>
    </div>
  );
};

function App() {
  // ✅ Load capabilities once globally
  const { caps, loading } = useCaps();

  const setDashboardPath = useDashboardStore((s) => s.setDashboardPath);

  // ✅ Set dashboardPath only when caps is ready
  useEffect(() => {
    if (caps?.dashboard) {
      setDashboardPath(caps.dashboard);
    } else if (!loading) {
      // fallback default
      setDashboardPath("/dashboard");
    }
  }, [caps, loading, setDashboardPath]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />

        {/* Dashboard Route */}
        <Route path="/client-d/dashboard/*" element={<ClientDDashboard />} />
        <Route path="/dashboard/*" element={<Dashboard />} />

        <Route path="/book-slot" element={<SlotBookingPage />} />

        {/* Legal Pages */}
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        <Route path="/billing-uploads" element={<BillingUploads />} />
        <Route path="/upload" element={<CSVUpload />} />

        {/* Client C Dashboard Route - Use nested routing */}
        <Route path="/client-c/*" element={<ClientC />} />
        <Route path="/upload-csv-file-input" element={<CsvUploadInput />} />

        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
