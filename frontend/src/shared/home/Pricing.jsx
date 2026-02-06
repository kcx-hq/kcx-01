import React, { useState } from "react";
import {
  Check,
  X as XIcon,
  Gift,
  Activity,
  ArrowRight,
  Zap,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- ACTIONS ---
  const handleFreeSignup = () => {
    navigate("/sign-up");
    window.scrollTo(0, 0);
  };

  const handleScheduleDemo = () => {
    setIsModalOpen(true);
  };

  // --- ANIMATIONS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 50, duration: 0.8 },
    },
  };

  return (
    <section
      className="py-24 bg-[var(--bg-main)] relative overflow-hidden"
      id="pricing"
    >
      {/* Background Decor (keep layout, remove purple/gradients) */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.14, 0.22, 0.14] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: "var(--bg-emerald-soft)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.10, 0.18, 0.10] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: "var(--bg-soft-2)" }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* SECTION HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-soft)] text-[var(--bg-dark)] text-xs font-bold uppercase mb-4 border border-[var(--border-light)]">
            <Zap size={12} fill="currentColor" /> Start Risk-Free
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-6 tracking-tight">
            Start{" "}
            <span className="text-[var(--brand-primary)]">Free</span>, Scale
            Smart.
          </h2>

          <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
            Begin with a free audit. Upgrade to continuous optimization when
            ready.
          </p>
        </motion.div>

        {/* --- PRICING CARDS GRID --- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
        >
          {/* === CARD 1: Free Tier === */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -10 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-[var(--radius-lg)] p-8 transition-all duration-300 group flex flex-col h-full relative shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-emerald-soft)] flex items-center justify-center border border-[var(--border-light)] group-hover:scale-110 transition-transform">
                <Gift className="text-[var(--bg-dark)]" size={24} />
              </div>
              <div className="px-3 py-1 rounded-full bg-[var(--bg-emerald-soft)] text-[var(--bg-dark)] text-[10px] font-bold uppercase border border-[var(--border-light)]">
                Free Tier
              </div>
            </div>

            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              FinOps Snapshot™
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              One-time audit &amp; savings report.
            </p>

            {/* Price */}
            <div className="mb-8 p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-light)] group-hover:bg-[var(--bg-soft)] transition-colors">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  $0
                </span>
              </div>
              <p className="text-xs text-[var(--bg-dark)] mt-1 font-medium">
                No credit card required
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8 flex-1">
              <p className="text-xs font-bold text-[var(--bg-dark)] uppercase tracking-widest mb-2">
                What's Included
              </p>
              <ListItem text="30 days of cloud data analysis" theme="free" />
              <ListItem text="AWS, Azure or GCP billing review" theme="free" />
              <ListItem text="Idle resource identification" theme="free" />
              <ListItem text="Savings opportunity report" theme="free" />

              <div className="pt-4 border-t border-[var(--border-light)] space-y-4 opacity-60">
                <ListItem text="Real-time monitoring" theme="muted" />
                <ListItem text="Weekly optimization cadence" theme="muted" />
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleFreeSignup}
              className="w-full py-4 bg-[var(--bg-main)] hover:bg-[var(--bg-soft)] border border-[var(--border-light)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-sm font-bold transition-all flex items-center justify-center gap-2 group"
            >
              Get Free Snapshot
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </motion.div>

          {/* === CARD 2: Enterprise === */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -10 }}
            className="bg-[var(--bg-surface)] border-2 rounded-[var(--radius-lg)] p-8 relative flex flex-col h-full shadow-[0_0_40px_rgba(0,198,147,0.10)]"
            style={{ borderColor: "rgba(0,198,147,0.40)" }}
          >
            {/* Highlight Badge (NO gradient) */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-[var(--shadow-md)]"
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              Most Popular
            </motion.div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6 mt-2">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-soft-2)] flex items-center justify-center border border-[var(--border-light)] transition-transform">
                <Activity className="text-[var(--bg-dark)]" size={24} />
              </div>
              <div className="px-3 py-1 rounded-full bg-[var(--bg-soft-2)] text-[var(--bg-dark)] text-[10px] font-bold uppercase border border-[var(--border-light)]">
                Enterprise
              </div>
            </div>

            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              FinOps Continuous™
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Always-on optimization service.
            </p>

            {/* Price */}
            <div className="mb-8 p-4 bg-[var(--bg-soft)] rounded-xl border border-[var(--border-light)]">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  Custom
                </span>
                <span className="text-[var(--text-secondary)] text-sm">
                  / month
                </span>
              </div>
              <p className="text-xs text-[var(--bg-dark)] mt-1 font-medium">
                Pricing based on cloud spend
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8 flex-1">
              <p className="text-xs font-bold text-[var(--bg-dark)] uppercase tracking-widest mb-2">
                Everything in Free +
              </p>
              <ListItem text="Real-time billing data ingestion" theme="pro" />
              <ListItem text="Continuous waste detection" theme="pro" />
              <ListItem text="Weekly executive insights" theme="pro" />
              <ListItem text="Savings Plan/RI strategy" theme="pro" />
              <ListItem text="Anomaly detection & alerts" theme="pro" />
              <ListItem text="Engineer Slack alerts" theme="pro" />
            </div>

            {/* CTA Button (NO gradient) */}
            <button
              onClick={handleScheduleDemo}
              className="w-full py-4 rounded-[var(--radius-md)] text-white text-sm font-bold transition-all shadow-[var(--shadow-md)] flex items-center justify-center gap-2 group bg-[var(--brand-primary)]"
            >
              Schedule Demo
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* --- REQUEST DEMO MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-md)] overflow-hidden"
            >
              {/* Top Line (NO gradient) */}
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: "var(--brand-primary)" }}
              />

              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-[var(--bg-emerald-soft)] rounded-xl flex items-center justify-center mb-4 text-[var(--bg-dark)] border border-[var(--border-light)]">
                  <Activity size={24} />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Book a Demo
                </h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  Tell us about your infrastructure, and we&apos;ll show you how
                  we can optimize it.
                </p>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-disabled)] uppercase mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-light)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-disabled)] uppercase mb-1">
                    Monthly Cloud Spend (Est.)
                  </label>
                  <select className="w-full bg-[var(--bg-main)] border border-[var(--border-light)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40">
                    <option>Less than $10k/mo</option>
                    <option>$10k - $50k/mo</option>
                    <option>$50k - $200k/mo</option>
                    <option>$200k+/mo</option>
                  </select>
                </div>

                {/* Submit (NO gradient) */}
                <button className="w-full py-3 text-white font-bold rounded-[var(--radius-md)] transition-all shadow-[var(--shadow-md)] mt-2 hover:-translate-y-0.5 bg-[var(--brand-primary)]">
                  Submit Request
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

// --- HELPER COMPONENTS ---

const ListItem = ({ text, theme }) => {
  let Icon = XIcon;
  let iconColor = "text-[var(--text-disabled)]";
  let textColor = "text-[var(--text-disabled)]";

  if (theme === "free") {
    Icon = Check;
    iconColor = "text-[var(--bg-dark)]";
    textColor = "text-[var(--text-secondary)]";
  } else if (theme === "pro") {
    Icon = Check;
    iconColor = "text-[var(--brand-primary)]";
    textColor = "text-[var(--text-primary)] font-medium";
  }

  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 ${
          theme === "pro"
            ? "bg-[var(--bg-emerald-soft)] rounded-full p-[1px]"
            : ""
        }`}
      >
        <Icon size={16} className={iconColor} />
      </div>
      <p className={`text-sm leading-tight ${textColor}`}>{text}</p>
    </div>
  );
};

export default Pricing;
