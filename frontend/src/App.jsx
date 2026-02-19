import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
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

  const navigate = useNavigate();
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#/")) {
      const path = hash.slice(1);
      navigate(path, { replace: true });
    }
  }, [navigate]);

  const showJourney = () => setShowJourneySection(true);

  const activateCTA = () => {
    setIsCTAActivated(true);
    setShowAttentionGrabber(true);
    setTimeout(() => setShowAttentionGrabber(false), 4500);
    // setIsChatOpen(true);
  };

  const deactivateCTA = () => {
    setIsCTAActivated(false);
    setShowAttentionGrabber(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] font-sans overflow-x-hidden">
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

        <HowItWorks activateCTA={activateCTA} />

        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              className="fixed bottom-6 right-6 z-[999]"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="relative w-[320px] sm:w-[360px] h-[480px] overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]">
                <Chatbot onClose={() => setIsChatOpen(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <InquirySection />
      </main>

      <Footer />

      {/* Floating Chat Button (no gradient, no glow) */}
      <button
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="
          fixed bottom-6 right-6 z-50 rounded-full
          px-5 py-3 font-semibold
          bg-[var(--brand-primary)] text-white
          border border-[var(--border-light)]
          hover:opacity-95
          transition-opacity
        "
        aria-label={isChatOpen ? "Close chat" : "Chat with us"}
      >
        {isChatOpen ? "Close chat" : "Chat with us"}
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
