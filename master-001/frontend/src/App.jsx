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



// ✅ Import your chatbot widget component (adjust path)
import Chatbot from "./shared/chatbot/Chatbot.jsx"; 
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
          {showJourneySection && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <HowItWorks activateCTA={activateCTA} />
            </motion.div>
          )}
        </AnimatePresence>

        <InquirySection />
      </main>

      <Footer />

      {/* ✅ Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 shadow-lg transition"
        aria-label="Open chatbot"
      >
        Chat with us
      </button>

      {/* ✅ Chatbot Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsChatOpen(false)} // close when clicking backdrop
          >
            <motion.div
              className="w-full max-w-lg bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()} // prevent close when clicking inside modal
            >
              {/* Header */}
             
              {/* Body */}
              <div className="h-[72vh] sm:h-[520px]">
                <Chatbot />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
      </Routes>
    </Router>
  );
}

export default App;