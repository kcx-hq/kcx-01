import React, { useState, useEffect } from "react";
import {
  UserPlus,
  UploadCloud,
  LayoutDashboard,
  ArrowRight,
  Zap,
  FileSpreadsheet,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const HowItWorks = ({ activateCTA = () => {} }) => {
  const [activeTab, setActiveTab] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev === 3 ? 1 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTryItForFree = (e) => {
    e.preventDefault();
    if (activateCTA) activateCTA();
    const heroSection = document.getElementById("hero");
    if (heroSection)
      heroSection.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <section
      id="how-it-works"
      className="py-16 bg-[var(--bg-main)] relative overflow-hidden flex items-center justify-center min-h-[90vh]"
    >
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.10, 0.20, 0.10] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ backgroundColor: "var(--bg-emerald-soft)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.10, 0.20, 0.10] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ backgroundColor: "var(--bg-soft-2)" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        {/* --- HEADER --- */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-12"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-light)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider mb-4 shadow-[var(--shadow-sm)]"
          >
            <Zap size={14} className="text-[var(--brand-primary)]" />
            Simple Workflow
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 tracking-tight"
          >
            From Data to Dashboard in{" "}
            <span className="text-[var(--brand-primary)]">Minutes</span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-[var(--text-secondary)] text-base max-w-xl mx-auto leading-relaxed"
          >
            No complex setup. No sales calls. Just a simple, secure process.
          </motion.p>
        </motion.div>

        {/* --- GRID (Centered & Compact) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-center">
          {/* LEFT: Navigation */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="lg:col-span-5 flex flex-col gap-3"
          >
            <StepButton
              step={1}
              title="Create Account"
              desc="Sign up to access your personal workspace."
              icon={UserPlus}
              isActive={activeTab === 1}
              onClick={() => setActiveTab(1)}
            />
            <StepButton
              step={2}
              title="Upload CSV File"
              desc="Export billing data and drop it here."
              icon={UploadCloud}
              isActive={activeTab === 2}
              onClick={() => setActiveTab(2)}
            />
            <StepButton
              step={3}
              title="Get Insights"
              desc="See your costs visualized instantly."
              icon={LayoutDashboard}
              isActive={activeTab === 3}
              onClick={() => setActiveTab(3)}
            />
          </motion.div>

          {/* RIGHT: Visual Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-7 perspective-1000"
          >
            <div className="h-[420px] bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-[var(--radius-lg)] p-6 relative overflow-hidden backdrop-blur-md shadow-[var(--shadow-md)] group flex flex-col justify-center">
              {/* ✅ Card Background Grid */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(28,35,33,0.03) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(28,35,33,0.03) 1px, transparent 1px)
                  `,
                  backgroundSize: "32px 32px",
                  opacity: 0.16,
                }}
              />

              {/* Internal Glow (NO gradient) */}
              <div
                className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity duration-1000"
                style={{ backgroundColor: "rgba(0,198,147,0.08)" }}
              />

              <AnimatePresence mode="wait">
                {/* STEP 1 */}
                {activeTab === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center w-full relative z-10"
                  >
                    <div className="relative mb-6 animate-float">
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_28px_rgba(0,198,147,0.18)] border border-[var(--border-light)]"
                        style={{
                          backgroundColor: "var(--bg-emerald-soft)",
                          color: "var(--bg-dark)",
                        }}
                      >
                        <UserPlus size={40} />
                      </div>
                      <div className="absolute -top-1 -right-1 bg-[var(--brand-primary)] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-[var(--shadow-sm)]">
                        SECURE
                      </div>
                    </div>

                    <div className="w-full max-w-xs space-y-3">
                      <div className="h-10 bg-[var(--bg-main)] border border-[var(--border-light)] rounded-[var(--radius-md)] w-full flex items-center px-4 text-xs text-[var(--text-disabled)]">
                        name@company.com
                      </div>
                      <div className="h-10 bg-[var(--bg-main)] border border-[var(--border-light)] rounded-[var(--radius-md)] w-full flex items-center px-4 text-xs text-[var(--text-disabled)]">
                        ••••••••••••
                      </div>
                      <div className="h-10 rounded-[var(--radius-md)] w-full flex items-center justify-center text-xs font-bold text-white shadow-[var(--shadow-sm)] animate-pulse bg-[var(--brand-primary)]">
                        Create Free Account
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 */}
                {activeTab === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center w-full relative z-10"
                  >
                    <div className="w-full h-56 bg-[var(--bg-main)] border-2 border-dashed border-[var(--border-muted)] rounded-xl flex flex-col items-center justify-center relative overflow-hidden group-hover:border-[var(--brand-primary)] transition-colors">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="mb-3"
                      >
                        <FileSpreadsheet
                          size={48}
                          className="text-[var(--text-disabled)] group-hover:text-[var(--bg-dark)] transition-colors"
                        />
                      </motion.div>
                      <div className="text-[var(--text-primary)] font-bold text-sm">
                        Drop Billing CSV
                      </div>
                      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--brand-primary)] shadow-[0_0_18px_rgba(0,198,147,0.35)] animate-scan" />
                    </div>

                    <div className="mt-5 flex gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="px-3 py-1 rounded-full bg-[var(--bg-emerald-soft)] text-[var(--bg-dark)] text-[10px] font-mono flex items-center gap-2 border border-[var(--border-light)]"
                      >
                        <CheckCircle2 size={10} /> AWS Detected
                      </motion.div>

                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="px-3 py-1 rounded-full bg-[var(--bg-soft-2)] text-[var(--bg-dark)] text-[10px] font-mono flex items-center gap-2 border border-[var(--border-light)]"
                      >
                        <CheckCircle2 size={10} /> Format Valid
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-3"
                    >
                      <div className="px-3 py-1 rounded-full bg-[var(--bg-soft)] border border-[var(--border-light)] text-[var(--bg-dark)] text-[9px] font-bold font-mono tracking-widest uppercase shadow-[var(--shadow-sm)]">
                        Focus Framework 1.0
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* STEP 3 */}
                {activeTab === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col justify-center w-full relative z-10"
                  >
                    <div className="relative space-y-3">
                      <div className="flex justify-between items-end px-1">
                        <div>
                          <div className="text-[var(--text-disabled)] text-[9px] uppercase font-bold tracking-wider mb-0.5">
                            Total Month Spend
                          </div>
                          <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                            $12,450
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-emerald-soft)] border border-[var(--border-light)] text-[var(--bg-dark)] text-[9px] font-bold mb-0.5">
                            <Zap size={8} fill="currentColor" /> Potential Savings
                          </div>
                          <div className="text-lg font-bold text-[var(--bg-dark)]">
                            $3,200
                          </div>
                        </div>
                      </div>

                      <div className="bg-[var(--bg-main)] border border-[var(--border-light)] rounded-xl p-3 relative shadow-[inset_0_0_0_1px_rgba(15,23,42,0.03)]">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex gap-2 items-center">
                            <BarChart3
                              size={12}
                              className="text-[var(--bg-dark)]"
                            />
                            <span className="text-[10px] text-[var(--text-disabled)] font-bold">
                              Daily Cost Trend
                            </span>
                          </div>
                          <div className="text-[9px] text-[var(--text-disabled)]">
                            Last 7 Days
                          </div>
                        </div>

                        <div className="relative h-12 w-full flex items-end justify-between gap-1.5">
                          {[35, 60, 45, 80, 55, 90, 40].map((h, i) => (
                            <motion.div
                              key={i}
                              className="w-full bg-[var(--bg-surface)] rounded-t-sm relative h-full group border border-[var(--border-light)]"
                              initial={{ height: 0 }}
                              animate={{ height: "100%" }}
                            >
                              <motion.div
                                className="absolute bottom-0 w-full rounded-t-sm"
                                style={{ backgroundColor: "var(--brand-primary)" }}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                              />
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--bg-main)] text-[var(--text-primary)] text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-[var(--border-light)] shadow-[var(--shadow-sm)]">
                                ${h * 15}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[var(--bg-main)] border border-[var(--border-light)] p-2.5 rounded-xl flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full relative flex items-center justify-center"
                            style={{
                              background: `conic-gradient(var(--bg-dark) 55%, rgba(25,38,48,0.10) 0)`,
                            }}
                          >
                            <div className="absolute w-5 h-5 bg-[var(--bg-main)] rounded-full" />
                          </div>
                          <div>
                            <div className="text-[9px] text-[var(--text-disabled)] font-bold">
                              Compute
                            </div>
                            <div className="text-xs font-bold text-[var(--text-primary)]">
                              55%
                            </div>
                          </div>
                        </div>

                        <div className="bg-[var(--bg-main)] border border-[var(--border-light)] p-2.5 rounded-xl flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full relative flex items-center justify-center"
                            style={{
                              background: `conic-gradient(var(--brand-primary) 30%, rgba(25,38,48,0.10) 0)`,
                            }}
                          >
                            <div className="absolute w-5 h-5 bg-[var(--bg-main)] rounded-full" />
                          </div>
                          <div>
                            <div className="text-[9px] text-[var(--text-disabled)] font-bold">
                              Database
                            </div>
                            <div className="text-xs font-bold text-[var(--text-primary)]">
                              30%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* --- BOTTOM CTA --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.button
            onClick={handleTryItForFree}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 26px rgba(0,198,147,0.35)",
            }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 text-white font-bold rounded-[var(--radius-md)] transition-all shadow-[var(--shadow-md)] flex items-center gap-2 mx-auto bg-[var(--brand-primary)]"
          >
            <span>Try it for free</span>
            <ArrowRight size={20} />
          </motion.button>

          <p className="text-[var(--text-disabled)] text-sm mt-4">
            No credit card required. Start analyzing in 2 minutes.
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes shimmer {
          100% { left: 100%; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-scan { animation: scan 2s linear infinite; }
        .animate-shimmer { animation: shimmer 1.5s infinite; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </section>
  );
};

// --- HELPER COMPONENT ---

const StepButton = ({ step, title, desc, icon: Icon, isActive, onClick }) => (
  <motion.button
    variants={{
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
    }}
    onClick={onClick}
    className={`
      w-full text-left p-5 rounded-2xl border transition-all duration-300 group relative overflow-hidden
      ${
        isActive
          ? "bg-[var(--bg-surface)] border-[var(--brand-primary)] shadow-[0_0_22px_rgba(0,198,147,0.18)] scale-105 z-10"
          : "bg-transparent border-[var(--border-light)] hover:bg-[var(--bg-soft)] hover:border-[var(--border-muted)]"
      }
    `}
  >
    {/* ✅ Background grid inside each StepButton card */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(28,35,33,0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(28,35,33,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "28px 28px",
        opacity: isActive ? 0.18 : 0.12,
      }}
    />

    <div
      className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
        isActive ? "h-full" : "h-0"
      }`}
      style={{ backgroundColor: "var(--brand-primary)" }}
    />

    <div className="flex items-center gap-4 relative z-10">
      <div
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0
          ${
            isActive
              ? "text-white rotate-3"
              : "bg-[var(--bg-surface)] border border-[var(--border-light)] text-[var(--text-disabled)] group-hover:text-[var(--text-primary)]"
          }
        `}
        style={isActive ? { backgroundColor: "var(--brand-primary)" } : undefined}
      >
        <Icon size={20} />
      </div>

      <div>
        <h3
          className={`text-base font-bold mb-0.5 transition-colors ${
            isActive
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
          }`}
        >
          {step}. {title}
        </h3>
        <p className="text-xs text-[var(--text-disabled)] leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  </motion.button>
);

export default HowItWorks;
