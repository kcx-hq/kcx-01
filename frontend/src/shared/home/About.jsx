import React, { useState } from "react";
import {
  Zap,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Earth,
  X,
  Code2,
  DollarSign,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const About = () => {
  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section
      className="py-24 bg-[var(--bg-main)] text-[var(--text-primary)] relative overflow-hidden"
      id="about"
    >
      {/* --- DYNAMIC BACKGROUNDS --- */}
      <motion.div
        animate={{
          opacity: [0.18, 0.32, 0.18],
          scale: [1, 1.2, 1],
          x: [-20, 20, -20],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: "var(--bg-emerald-soft)" }}
      />
      <motion.div
        animate={{
          opacity: [0.2, 0.35, 0.2],
          scale: [1.2, 1, 1.2],
          x: [20, -20, 20],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[var(--highlight-green)] rounded-full blur-[100px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* --- PART 1: WHO WE ARE --- */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <motion.span
            variants={fadeInUp}
            className="text-[var(--brand-primary)] text-xs font-bold uppercase tracking-[0.2em] mb-4 block"
          >
            WHO WE ARE
          </motion.span>

          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold mb-8 tracking-tight"
          >
            FinOps Built for{" "}
            <span className="text-[var(--brand-primary)]">
              Engineering-Led Teams
            </span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6"
          >
            KCX. is a Cloud FinOps platform that helps engineering-led
            companies understand, control, and optimize their cloud spend —
            without slowing down development.
          </motion.p>

          <motion.p
            variants={fadeInUp}
            className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6"
          >
            We turn complex AWS and GCP billing data into clear, actionable
            insights by combining a practical FinOps platform with hands-on
            expertise. Our focus is simple: help teams make better cloud cost
            decisions, faster.
          </motion.p>

          <motion.p
            variants={fadeInUp}
            className="text-[var(--text-disabled)] text-base font-light max-w-2xl mx-auto"
          >
            We work with startups and digital businesses where engineering,
            finance, and product teams need a shared view of cloud costs, unit
            economics, and efficiency.
          </motion.p>
        </motion.div>

        {/* --- PART 2: KPI CARDS --- */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-[var(--border-light)] py-12 mb-24"
        >
          <StatItem
            icon={TrendingUp}
            value="10-30%"
            label="Avg. Cost Reduction"
            iconColor="text-[var(--brand-primary)]"
            delay={0}
          />
          <StatItem
            icon={Earth}
            value="50+"
            label="Enterprise Clients"
            iconColor="text-[var(--brand-primary)]"
            delay={0.1}
          />
          <StatItem
            icon={BarChart3}
            value="$500M+"
            label="Spend Analyzed"
            iconColor="text-[var(--brand-primary)]"
            delay={0.2}
          />
          <StatItem
            icon={ShieldCheck}
            value="98%"
            label="Client Retention"
            iconColor="text-[var(--brand-primary)]"
            delay={0.3}
          />
        </motion.div>

        {/* --- PART 3: THE KCX. DIFFERENCE --- */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <h3 className="text-3xl font-bold mb-4">Why Partner With Us?</h3>
          <p className="text-[var(--text-secondary)]">
            Click &quot;See Our Approach&quot; below to explore how we drive
            results.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <ValueCard
            icon={DollarSign}
            title="ROI-Obsessed"
            desc="We look beyond simple savings. We optimize your unit economics to ensure every cloud dollar spent drives actual revenue."
            badgeBg="bg-[var(--highlight-yellow)]"
            iconColor="text-[var(--bg-dark)]"
            details={[
              "Unit Cost Analysis (Cost per Transaction)",
              "Strategic RIs & Savings Plans",
              "Budget Forecasting vs. Actuals",
            ]}
          />

          <ValueCard
            icon={Code2}
            title="Engineering DNA"
            desc="We speak your team's language. Our recommendations are technical, practical, and ready to deploy—no 'fluff' reports."
            badgeBg="bg-[var(--highlight-green)]"
            iconColor="text-[var(--bg-dark)]"
            details={[
              "Infrastructure-as-Code Audits",
              "Non-Disruptive Architecture Tuning",
              "Identifying Zombie Assets & Waste",
            ]}
          />

          <ValueCard
            icon={Lock}
            title="Risk-Free Execution"
            desc="We prioritize uptime above all else. Our 'Safe-Saving' protocols ensure cost cuts never compromise reliability."
            badgeBg="bg-[var(--bg-emerald-soft)]"
            iconColor="text-[var(--bg-dark)]"
            details={[
              "Stability-First Audits",
              "Pre-Deployment Validation",
              "Zero-Downtime Implementation Plans",
            ]}
          />
        </motion.div>
      </div>
    </section>
  );
};

// --- SUB-COMPONENTS ---

const StatItem = ({ icon: Icon, value, label, iconColor, delay }) => (
  <motion.div
    variants={{
      hidden: { scale: 0.8, opacity: 0 },
      visible: { scale: 1, opacity: 1, transition: { duration: 0.6, delay } },
    }}
    whileHover={{ scale: 1.05, y: -5 }}
    className="flex flex-col items-center justify-center text-center p-4 rounded-xl hover:bg-[var(--bg-soft)] transition-colors duration-300 relative overflow-hidden"
  >
    {/* ✅ GRID FIX: stronger + visible */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(28,35,33,0.085) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(28,35,33,0.085) 1px, transparent 1px)
        `,
        backgroundSize: "28px 28px",
        opacity: 0.32,
      }}
    />

    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={24} className={iconColor} />
        <span className="text-3xl md:text-4xl font-bold">{value}</span>
      </div>
      <span className="text-sm text-[var(--text-disabled)] uppercase tracking-wide font-medium">
        {label}
      </span>
    </div>
  </motion.div>
);

// --- INTERACTIVE VALUE CARD ---
const ValueCard = ({ icon: Icon, title, desc, badgeBg, iconColor, details }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      variants={{
        hidden: { y: 50, opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 50 },
        },
      }}
      whileHover={!isOpen ? { y: -10 } : {}}
      className={`
        relative h-[380px] flex flex-col p-8 rounded-[var(--radius-lg)]
        border transition-all duration-500 overflow-hidden
        shadow-[var(--shadow-md)] backdrop-blur-md group
        ${
          isOpen
            ? "border-[var(--bg-dark)] bg-[var(--bg-surface)]"
            : "border-[var(--border-light)] bg-[var(--bg-surface)] hover:bg-[var(--bg-soft)] hover:border-[var(--brand-primary)]"
        }
      `}
    >
      {/* Background soft overlay (kept) */}
      {!isOpen && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none transition-opacity duration-500 group-hover:opacity-0" />
      )}

      {/* ✅ GRID FIX: stronger + visible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(28,35,33,0.095) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(28,35,33,0.095) 1px, transparent 1px)
          `,
          backgroundSize: "34px 34px",
          opacity: isOpen ? 0.26 : 0.34,
        }}
      />

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col">
        <motion.div
          layout
          className={`w-14 h-14 rounded-[var(--radius-lg)] ${badgeBg} flex items-center justify-center mb-6 shadow-[var(--shadow-sm)] group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon size={28} className={iconColor} />
        </motion.div>

        <motion.h4
          layout
          className="text-2xl font-bold mb-4 group-hover:text-[var(--bg-dark)] transition-colors"
        >
          {title}
        </motion.h4>

        <motion.p
          layout
          className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6"
        >
          {desc}
        </motion.p>
      </div>

      {/* OUR APPROACH BUTTON */}
      <motion.button
        layout
        onClick={() => setIsOpen(true)}
        className="relative z-20 flex items-center gap-3 text-[var(--brand-primary)] text-sm font-bold cursor-pointer group/btn mt-auto w-fit px-4 py-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-emerald-soft)] transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] group-hover/btn:scale-125 transition-transform"></span>
        See Our Approach
        <ArrowRight
          size={16}
          className="group-hover/btn:translate-x-1 transition-transform"
        />
      </motion.button>

      {/* --- SLIDE UP DETAILS OVERLAY --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-[var(--bg-surface)] z-30 p-8 flex flex-col border-t-4 border-[var(--brand-primary)]"
          >
            {/* ✅ GRID FIX: stronger + visible in overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(28,35,33,0.09) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(28,35,33,0.09) 1px, transparent 1px)
                `,
                backgroundSize: "28px 28px",
                opacity: 0.28,
              }}
            />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <h5 className="text-[var(--text-primary)] font-bold text-lg flex items-center gap-2">
                  <Zap size={18} className="text-[var(--brand-primary)]" /> How We
                  Do It
                </h5>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-black/5 hover:bg-black/10 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <ul className="space-y-4 mb-auto">
                {details.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                  >
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] flex-shrink-0 shadow-[0_0_8px_rgba(0,198,147,0.35)]" />
                    {item}
                  </motion.li>
                ))}
              </ul>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="mt-auto text-xs text-[var(--text-disabled)] hover:text-[var(--text-primary)] text-center w-full pt-4 border-t border-[var(--border-light)] uppercase tracking-wider font-bold transition-colors"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default About;
