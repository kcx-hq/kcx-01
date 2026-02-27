// src/components/Hero.jsx
import React, { useState, useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Sparkles,
  Clock,
  FileSpreadsheet,
  Lock,
  Cloud,
  DollarSign,
  BarChart3,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { AuthModal } from "../auth";

interface HeroProps {
  isCTAActivated?: boolean;
  showAttentionGrabber?: boolean;
  deactivateCTA?: () => void;
}

interface ProviderIconProps {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  icon: string;
  color: string;
  delay: number;
}

interface FloatingDataLabelProps {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  value: string;
  colorVar?: string;
  delay: number;
  icon?: LucideIcon;
}

type PillarTone = "green" | "yellow" | "brand";

interface PillarIconProps {
  icon: LucideIcon;
  tone?: PillarTone;
  delay: number;
}

interface PillarToneStyle {
  bg: string;
  fg: string;
  border: string;
}

// Add CSS for grid animation
const gridPulseStyle = `
  @keyframes gridPulse {
    0%, 100% { opacity: 0.12; }
    50% { opacity: 0.22; }
  }
`;

const Hero = ({
  isCTAActivated = false,
  showAttentionGrabber = false,
  deactivateCTA = () => {},
}: HeroProps) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showOnboardingHint, setShowOnboardingHint] = useState(false);

  // --- Physics-based Mouse Tracking ---
  const cardRef = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for rotation
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  // Map mouse position to rotation degrees
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

  // Spotlight effect inside the card
  const spotX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const spotY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const width = rect.width;
      const height = rect.height;
      const mouseXVal = e.clientX - rect.left;
      const mouseYVal = e.clientY - rect.top;

      const xPct = mouseXVal / width - 0.5;
      const yPct = mouseYVal / height - 0.5;

      x.set(xPct);
      y.set(yPct);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // --- Timers & Handlers ---
  useEffect(() => {
    const hintTimer = setTimeout(() => {
      setShowOnboardingHint(true);
    }, 8000);
    return () => clearTimeout(hintTimer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) setShowOnboardingHint(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCTAClick = () => {
    setShowOnboardingHint(false);
    deactivateCTA();
    setIsAuthOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <>
      <style>{gridPulseStyle}</style>
      <AuthModal
        key={isAuthOpen ? "auth-open" : "auth-closed"}
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialView="signup"
      />

      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center bg-[var(--bg-main)] overflow-hidden pt-24 pb-12"
      >
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_55%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Soft blobs (emerald light theme) */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.22, 0.4, 0.22] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 left-0 w-[520px] h-[520px] rounded-full blur-[120px] pointer-events-none"
          style={{ backgroundColor: "var(--highlight-green)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.16, 0.32, 0.16] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 right-0 w-[620px] h-[620px] rounded-full blur-[120px] pointer-events-none"
          style={{ backgroundColor: "var(--bg-emerald-soft)" }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT COLUMN */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-left relative"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 bg-[var(--bg-surface)]/70 border border-[var(--border-light)] rounded-full px-3 py-1 mb-6 backdrop-blur-md shadow-[var(--shadow-sm)]"
            >
              {/* theme updated */}
              <Sparkles className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              <span className="text-[11px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                Instant Cloud FinOps
              </span>
            </motion.div>

            <div className="mb-6">
              <motion.h1
                variants={itemVariants}
                className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] tracking-tight leading-[1] mb-2"
              >
                TURN BILLING <br /> DATA
              </motion.h1>

              <motion.div variants={itemVariants} className="relative inline-block">
                {/* theme updated: brand-primary focused gradient */}
                <span
                  className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, var(--brand-primary), var(--brand-primary-hover), var(--text-primary))",
                  }}
                >
                  INTO PURE SAVING
                </span>
              </motion.div>
            </div>

            <motion.p
              variants={itemVariants}
              className="text-lg text-[var(--text-secondary)] max-w-lg leading-relaxed font-light mb-8"
            >
              Stop guessing where your budget goes.{" "}
              <strong className="text-[var(--text-primary)]">
                Upload your billing file
              </strong>{" "}
              to instantly visualize waste, spot anomalies, and find savings—securely
              and for free.
            </motion.p>

            {/* Mini badges */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-10">
              <div className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-light)] text-[var(--text-primary)] text-sm font-medium shadow-[var(--shadow-sm)]">
                {/* theme updated */}
                <Clock size={16} className="text-[var(--brand-primary)]" />
                <span>Instant Audit</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-soft)] border border-[var(--border-light)] text-[var(--text-primary)] text-sm font-medium shadow-[var(--shadow-sm)]">
                {/* theme updated */}
                <FileSpreadsheet size={16} className="text-[var(--brand-primary)]" />
                <span>CSV Upload</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--highlight-green)] border border-[var(--border-light)] text-[var(--text-primary)] text-sm font-medium shadow-[var(--shadow-sm)]">
                <Lock size={16} className="text-[var(--brand-primary)]" />
                <span>Secure &amp; Private</span>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={itemVariants} className="flex flex-col w-full">
              <div className="flex justify-start w-full relative">
                <AnimatePresence>
                  {showAttentionGrabber && (
                    <>
                      {[0, 1, 2].map((cycle) => (
                        <motion.div
                          key={cycle}
                          // theme updated (ring uses brand-primary)
                          className="absolute -inset-4 rounded-3xl border-2 border-[var(--brand-primary)] pointer-events-none"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{
                            opacity: [0, 0.6, 0],
                            scale: [0.9, 1.1, 1.3],
                          }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 1.5,
                            delay: cycle * 1.5,
                            ease: "easeOut",
                          }}
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>

                <div className="inline-block" onClick={handleCTAClick}>
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                      boxShadow: "0 0 40px rgba(0,198,147,0.35)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    animate={
                      isCTAActivated
                        ? {
                            boxShadow: [
                              "0 0 18px rgba(0,198,147,0.22), inset 0 0 18px rgba(0,198,147,0.10)",
                              "0 0 44px rgba(0,198,147,0.40), inset 0 0 34px rgba(0,198,147,0.16)",
                              "0 0 18px rgba(0,198,147,0.22), inset 0 0 18px rgba(0,198,147,0.10)",
                            ],
                          }
                        : {}
                    }
                    transition={
                      isCTAActivated
                        ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        : {}
                    }
                    className="relative px-10 py-5 text-xl rounded-2xl font-bold text-white overflow-hidden transition-all shadow-[var(--shadow-md)] tracking-tight"
                    // theme updated (button uses brand-primary + hover var)
                    style={{
                      backgroundColor: "var(--brand-primary)",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--brand-primary-hover)";
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--brand-primary)";
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      <span>Get Started</span>
                      <ArrowRight size={24} strokeWidth={2.5} />
                    </div>
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {showOnboardingHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mt-6 flex items-center justify-start"
                  >
                    <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2 group">
                      <span className="relative">
                        New here?
                        {/* theme updated */}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[var(--brand-primary)] group-hover:w-full transition-all duration-300" />
                      </span>
                      {/* theme updated */}
                      <span className="text-[var(--brand-primary)] font-medium flex items-center gap-1.5">
                        See how KCX. works
                      </span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN - 3D Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:flex justify-center perspective-1000 h-[700px] items-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              ref={cardRef}
              className="relative w-[520px] h-[600px] bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-[24px] flex flex-col overflow-hidden"
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                boxShadow:
                  "0 30px 60px -18px rgba(0,0,0,0.18), 0 0 0 1px rgba(15,23,42,0.04)",
              }}
            >
              {/* Dynamic Spotlight (theme updated: #00c693) */}
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-40 z-0"
                style={{
                  background: useTransform([spotX, spotY], ([sx, sy]: [string, string]) => {
                    return `radial-gradient(600px circle at ${sx} ${sy}, rgba(0,198,147,0.12), transparent 45%)`;
                  }),
                }}
              />

              {/* Card Header */}
              <div className="px-6 py-4 border-b border-[var(--border-light)] flex justify-between items-center bg-black/[0.02] rounded-t-[24px] relative z-20">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-black/10 border border-black/15"></div>
                  <div className="w-3 h-3 rounded-full bg-black/10 border border-black/15"></div>
                  <div className="w-3 h-3 rounded-full bg-black/10 border border-black/15"></div>
                </div>
                <div className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">
                  KCX<span className="text-[var(--brand-primary)]">.</span> FinOps Platform
                </div>
              </div>

              {/* Main Card Content */}
              <div className="flex-1 relative overflow-hidden z-10">
                {/* Futuristic Background (theme updated: brand-primary + bg-dark) */}
                <motion.div
                  animate={{
                    background: [
                      "linear-gradient(135deg, rgba(0,198,147,0.08) 0%, rgba(25,38,48,0.06) 100%)",
                      "linear-gradient(135deg, rgba(25,38,48,0.07) 0%, rgba(0,198,147,0.09) 100%)",
                      "linear-gradient(135deg, rgba(0,198,147,0.08) 0%, rgba(25,38,48,0.06) 100%)",
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0"
                />

                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(0,198,147,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(0,198,147,0.22) 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                    animation: "gridPulse 4s ease-in-out infinite",
                  }}
                />

                {/* Data Visuals */}
                <div className="absolute inset-0">
                  {/* Horizontal lines (savings) */}
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={`cost-${i}`}
                      className="absolute h-px bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent opacity-25"
                      style={{ top: `${25 + i * 15}%`, left: "10%", right: "10%" }}
                      animate={{ scaleX: [0, 1, 0], opacity: [0, 0.45, 0] }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeInOut",
                      }}
                    />
                  ))}

                  {/* Vertical lines (analytics) */}
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={`analytics-${i}`}
                      className="absolute w-px bg-gradient-to-b from-transparent via-[var(--bg-dark)] to-transparent opacity-20"
                      style={{
                        left: `${20 + i * 20}%`,
                        top: "15%",
                        bottom: "15%",
                      }}
                      animate={{ scaleY: [0, 1, 0], opacity: [0, 0.35, 0] }}
                      transition={{
                        duration: 4.5,
                        repeat: Infinity,
                        delay: i * 0.6,
                        ease: "easeInOut",
                      }}
                    />
                  ))}

                  {/* Line graph */}
                  <svg
                    className="absolute inset-0 w-full h-full opacity-10"
                    viewBox="0 0 400 300"
                  >
                    <motion.path
                      d="M50,200 Q100,180 150,160 T250,120 T350,80"
                      stroke="var(--brand-primary)"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="5,5"
                      animate={{ pathLength: [0, 1], opacity: [0, 0.45, 0.12] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </svg>

                  {/* Data points */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={`point-${i}`}
                      className="absolute w-1 h-1 bg-[var(--brand-primary)] rounded-full opacity-15"
                      style={{
                        left: `${20 + i * 12}%`,
                        top: `${40 + Math.sin(i) * 20}%`,
                      }}
                      animate={{ scale: [0.5, 1.5, 0.5], opacity: [0.08, 0.35, 0.08] }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeInOut",
                      }}
                    />
                  ))}

                  {/* Floating data labels */}
                  <FloatingDataLabel
                    top="22%"
                    left="12%"
                    value="+24.5% Savings"
                    colorVar="--brand-primary"
                    delay={0}
                  />
                  <FloatingDataLabel
                    top="38%"
                    right="18%"
                    value="$1.2M Processed"
                    // theme updated (use dark text color)
                    colorVar="--bg-dark"
                    delay={1.5}
                    icon={DollarSign}
                  />
                  <FloatingDataLabel
                    bottom="28%"
                    left="25%"
                    value="99.9% Uptime"
                    // theme updated (use dark text color)
                    colorVar="--bg-dark"
                    delay={3}
                  />
                </div>

                {/* CLOUD PROVIDER ICONS */}
                <ProviderIcon top="4%" left="4%" icon="/aws.svg" color="#ff9900" delay={0} />
                <ProviderIcon top="4%" right="4%" icon="/azure.svg" color="#0078d4" delay={0.5} />
                <ProviderIcon bottom="4%" left="4%" icon="/gcp.svg" color="#4285f4" delay={1} />
                <ProviderIcon bottom="4%" right="4%" icon="/oracle.svg" color="#f80000" delay={1.5} />

                {/* MAIN CENTRAL LOGO */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="relative"
                  >
                    {/* Outer rings (theme updated) */}
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.16, 0.32, 0.16], rotate: [0, 360] }}
                      transition={{
                        scale: { duration: 3, repeat: Infinity },
                        opacity: { duration: 3, repeat: Infinity },
                        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                      }}
                      className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--bg-dark)] opacity-30"
                      style={{ width: "200px", height: "200px", left: "-84px", top: "-84px" }}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25], rotate: [360, 0] }}
                      transition={{
                        scale: { duration: 2.5, repeat: Infinity },
                        opacity: { duration: 2.5, repeat: Infinity },
                        rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                      }}
                      className="absolute inset-0 rounded-full border border-[var(--brand-primary)] opacity-40"
                      style={{ width: "150px", height: "150px", left: "-59px", top: "-59px" }}
                    />

                    {/* LOGO CONTAINER */}
                    <motion.div
                      animate={{ rotateY: [0, 5, 0, -5, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      className="relative w-32 h-32 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--bg-dark)]/30 overflow-hidden"
                      style={{ boxShadow: "0 0 30px rgba(0,198,147,0.18)" }}
                    >
                      {/* Scanning line */}
                      <motion.div
                        animate={{ top: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                        className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-[var(--brand-primary)]/18 to-transparent pointer-events-none z-0"
                      />

                      <motion.img
                        src="/KCX.logo.svg"
                        alt="KCX. Logo"
                        className="w-16 h-16 object-contain relative z-20"
                        animate={{
                          filter: [
                            "drop-shadow(0 0 12px rgba(0,198,147,0.25)) brightness(1.05)",
                            "drop-shadow(0 0 18px rgba(0,198,147,0.40)) brightness(1.08)",
                            "drop-shadow(0 0 12px rgba(0,198,147,0.25)) brightness(1.05)",
                          ],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />

                      {/* Glass shine */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none z-30"
                        style={{
                          background:
                            "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                          backgroundSize: "200% 200%",
                        }}
                        animate={{ backgroundPosition: ["-100% -100%", "200% 200%"] }}
                        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
                      />
                    </motion.div>

                    {/* Orbiting nodes (theme updated) */}
                    {[0, 1, 2, 3].map((index) => (
                      <motion.div
                        key={index}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12 + index * 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 pointer-events-none"
                        style={{ width: "220px", height: "220px", left: "-66px", top: "-66px" }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                          className="absolute w-2 h-2 bg-[var(--bg-dark)] rounded-full"
                          style={{
                            top: `${10 + index * 20}px`,
                            left: "50%",
                            transform: "translateX(-50%)",
                            boxShadow: "0 0 14px rgba(25,38,48,0.35)",
                          }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Bottom branding */}
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <motion.div
                    className="text-2xl font-bold text-[var(--text-primary)] mb-4 font-mono tracking-wider"
                    animate={{
                      opacity: [0.75, 1, 0.75],
                      textShadow: [
                        "0 0 8px rgba(0,198,147,0.18)",
                        "0 0 16px rgba(0,198,147,0.28)",
                        "0 0 8px rgba(0,198,147,0.18)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    KCX<span className="text-[var(--brand-primary)]">.</span>
                  </motion.div>

                  <div className="flex items-center justify-center gap-6 mb-3">
                    <PillarIcon icon={Cloud} tone="green" delay={0} />
                    <PillarIcon icon={DollarSign} tone="yellow" delay={0.8} />
                    <PillarIcon icon={BarChart3} tone="brand" delay={1.6} />
                  </div>

                  <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs text-[var(--text-disabled)] font-mono flex items-center justify-center gap-2"
                  >
                    {/* theme updated */}
                    <Activity size={10} className="text-[var(--brand-primary)] animate-pulse" />
                    SYSTEM.ACTIVE
                    <Activity size={10} className="text-[var(--brand-primary)] animate-pulse" />
                  </motion.div>
                </div>

                {/* Corner accents (emerald light theme) */}
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                  <div className="w-full h-full bg-gradient-to-bl from-[var(--highlight-green)] to-transparent rounded-bl-full border-l border-b border-[var(--border-light)]" />
                </div>
                <div className="absolute bottom-0 left-0 w-12 h-12 pointer-events-none">
                  <div className="w-full h-full bg-gradient-to-tr from-[var(--bg-emerald-soft)] to-transparent rounded-tr-full border-r border-t border-[var(--border-light)]" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

// --- HELPER COMPONENTS ---

// Provider Icon (kept provider brand colors, but light-mode glass container)
const ProviderIcon = ({ top, bottom, left, right, icon, color, delay }: ProviderIconProps) => {
  const isAws = icon.includes("aws");
  const isAzure = icon.includes("azure");

  let paddingClass = "p-2";
  if (isAws) paddingClass = "p-3";
  if (isAzure) paddingClass = "p-1";

  return (
    <div className="absolute z-30" style={{ top, bottom, left, right }}>
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-2 border border-dashed rounded-full pointer-events-none"
          style={{ borderColor: `${color}50` }}
        />

        <motion.div
          animate={{ opacity: [0.85, 1, 0.85], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay, ease: "easeInOut" }}
          className={`w-16 h-16 ${paddingClass} rounded-full border backdrop-blur-md flex items-center justify-center`}
          style={{
            backgroundColor: "rgba(255,255,255,0.65)",
            borderColor: `${color}55`,
            boxShadow: `0 10px 22px -10px ${color}30`,
          }}
        >
          <img
            src={icon}
            alt="Cloud Provider"
            className="w-full h-full object-contain"
            style={{
              filter: isAws
                ? "brightness(0.1) opacity(0.95)"
                : "brightness(1.02) contrast(1.05) drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

// Floating data labels (uses theme vars)
const FloatingDataLabel = ({
  top,
  left,
  right,
  bottom,
  value,
  colorVar = "--brand-secondary",
  delay,
  icon: Icon,
}: FloatingDataLabelProps) => (
  <motion.div
    className="absolute px-2.5 py-1.5 rounded-md bg-[var(--bg-surface)]/85 border border-[var(--border-light)] flex items-center gap-1.5 text-[10px] font-mono font-bold backdrop-blur-md z-20"
    style={{
      top,
      left,
      right,
      bottom,
      color: `var(${colorVar})`,
      boxShadow: "0 8px 18px -10px rgba(0,0,0,0.18)",
    }}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{
      opacity: [0, 1, 1, 0],
      scale: [0.9, 1, 1, 0.9],
      y: [5, 0, 0, -5],
    }}
    transition={{ duration: 5, repeat: Infinity, delay, times: [0, 0.1, 0.8, 1] }}
  >
    {Icon && <Icon size={10} />}
    {value}
    <ArrowUpRight size={10} className="opacity-50" />
  </motion.div>
);

const PillarIcon = ({ icon: Icon, tone = "brand", delay }: PillarIconProps) => {
  const map: Record<PillarTone, PillarToneStyle> = {
    green: {
      bg: "var(--highlight-green)",
      fg: "var(--brand-primary)",
      border: "var(--border-light)",
    },
    yellow: {
      bg: "var(--highlight-yellow)",
      // theme updated
      fg: "var(--brand-primary)",
      border: "var(--border-light)",
    },
    brand: {
      bg: "var(--bg-soft)",
      // theme updated
      fg: "var(--brand-primary)",
      border: "var(--border-light)",
    },
  };

  const t = map[tone] || map.brand;

  return (
    <motion.div
      animate={{ y: [0, -5, 0], opacity: [0.65, 1, 0.65] }}
      transition={{ duration: 3, repeat: Infinity, delay, ease: "easeInOut" }}
      className="flex flex-col items-center gap-1"
    >
      <div
        className="p-3 rounded-[var(--radius-md)] border backdrop-blur-sm"
        style={{ backgroundColor: t.bg, borderColor: t.border }}
      >
        <Icon size={18} style={{ color: t.fg }} />
      </div>
      <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: t.fg }} />
    </motion.div>
  );
};

export default Hero;
