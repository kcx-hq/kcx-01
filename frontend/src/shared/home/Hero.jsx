// src/components/Hero.jsx
import React, { useState, useEffect, useRef } from "react";
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
  ArrowUpRight
} from "lucide-react";
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useSpring, 
  useTransform 
} from "framer-motion";
import { AuthModal } from "../auth";

// Add CSS for grid animation
const gridPulseStyle = `
  @keyframes gridPulse {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.4; }
  }
`;

const Hero = ({ onOpenAuth, isCTAActivated = false, showAttentionGrabber = false, deactivateCTA = () => {}, showJourney = () => {} }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showOnboardingHint, setShowOnboardingHint] = useState(false);

  // --- Physics-based Mouse Tracking ---
  const cardRef = useRef(null);
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

  const handleMouseMove = (e) => {
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
      if (window.scrollY > 200) {
        setShowOnboardingHint(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCTAClick = () => {
    setShowOnboardingHint(false);
    deactivateCTA();
    setIsAuthOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <>
    <style>{gridPulseStyle}</style>
    <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialView="signup" />
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center bg-[#0f0f11] overflow-hidden pt-24 pb-12"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#7e32ec]/20 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#a02ff1]/10 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* LEFT COLUMN (Text & CTA) */}
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="text-left relative"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-[#2a2a30]/50 border border-white/10 rounded-full px-3 py-1 mb-6 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#a02ff1]" />
            <span className="text-[11px] font-bold tracking-widest text-[#d4a6f9] uppercase">
              Instant Cloud FinOps
            </span>
          </motion.div>

          <div className="mb-6">
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1] mb-2">
              TURN BILLING <br /> DATA
            </motion.h1>
            <motion.div variants={itemVariants} className="relative inline-block">
              <span className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#a02ff1] via-[#c06eff] to-white animate-gradient bg-300%">
                INTO PURE SAVING
              </span>
            </motion.div>
          </div>

          <motion.p variants={itemVariants} className="text-lg text-gray-400 max-w-lg leading-relaxed font-light mb-8">
            Stop guessing where your budget goes. <strong>Upload your billing file</strong> to instantly visualize waste, spot anomalies, and find savings—securely and for free.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-10">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1b26] border border-blue-500/30 text-blue-200 text-sm font-medium">
              <Clock size={16} className="text-blue-400" /> <span>Instant Audit</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1b26] border border-[#a02ff1]/30 text-purple-200 text-sm font-medium">
              <FileSpreadsheet size={16} className="text-[#a02ff1]" /> <span>CSV Upload</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1b26] border border-green-500/30 text-green-200 text-sm font-medium">
              <Lock size={16} className="text-green-400" /> <span>Secure & Private</span>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div variants={itemVariants} className="flex flex-col w-full">
            <div className="flex justify-start w-full relative">
              <AnimatePresence>
                {showAttentionGrabber && (
                  <>
                    {[0, 1, 2].map((cycle) => (
                      <motion.div
                        key={cycle}
                        className="absolute -inset-4 rounded-3xl border-2 border-[#a02ff1] pointer-events-none"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: [0, 0.8, 0], scale: [0.9, 1.1, 1.3] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, delay: cycle * 1.5, ease: "easeOut" }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>
              <div className="inline-block" onClick={handleCTAClick}>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(160, 47, 241, 0.6)", y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  animate={isCTAActivated ? {
                    boxShadow: [
                      "0 0 20px rgba(160, 47, 241, 0.4), inset 0 0 20px rgba(160, 47, 241, 0.1)",
                      "0 0 50px rgba(160, 47, 241, 0.8), inset 0 0 40px rgba(160, 47, 241, 0.3)",
                      "0 0 20px rgba(160, 47, 241, 0.4), inset 0 0 20px rgba(160, 47, 241, 0.1)"
                    ]
                  } : {}}
                  transition={isCTAActivated ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                  className="relative px-10 py-5 text-xl rounded-2xl font-bold text-white overflow-hidden bg-gradient-to-r from-[#a02ff1] via-[#8a25d4] to-[#a02ff1] transition-all shadow-lg tracking-tight"
                  style={{ backgroundSize: isCTAActivated ? '200% 100%' : '100% 100%', backgroundPosition: isCTAActivated ? '0% 50%' : '50% 50%' }}
                >
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
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
                  <p className="text-sm text-gray-400 flex items-center gap-2 group">
                    <span className="relative">New here?<span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#a02ff1] group-hover:w-full transition-all duration-300"></span></span>
                    <span className="text-[#a02ff1] font-medium flex items-center gap-1.5">See how K&Co works</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN - IMPROVED 3D Card */}
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
            className="relative w-[520px] h-[600px] bg-[#0f0f11] border border-white/10 rounded-[24px] shadow-2xl flex flex-col overflow-hidden"
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
              boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)"
            }}
          >
            {/* Dynamic Spotlight */}
            <motion.div 
              className="absolute inset-0 pointer-events-none opacity-40 z-0"
              style={{ background: useTransform([spotX, spotY], ([sx, sy]) => `radial-gradient(600px circle at ${sx} ${sy}, rgba(160, 47, 241, 0.15), transparent 40%)`) }}
            />

            {/* Card Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02] rounded-t-[24px] relative z-20">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">K&Co FinOps Platform</div>
            </div>

            {/* Main Card Content */}
            <div className="flex-1 relative overflow-hidden z-10">
              {/* Futuristic Background */}
              <motion.div 
                animate={{ background: ['linear-gradient(135deg, rgba(160,47,241,0.08) 0%, rgba(147,51,234,0.08) 100%)', 'linear-gradient(135deg, rgba(147,51,234,0.12) 0%, rgba(160,47,241,0.12) 100%)', 'linear-gradient(135deg, rgba(160,47,241,0.08) 0%, rgba(147,51,234,0.08) 100%)'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0"
              />
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(rgba(160,47,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(160,47,241,0.3) 1px, transparent 1px)`, backgroundSize: '30px 30px', animation: 'gridPulse 4s ease-in-out infinite' }} />

              {/* Data Visuals & REALISM LAYERS */}
              <div className="absolute inset-0">
                 {/* Horizontal lines */}
                 {[...Array(5)].map((_, i) => (
                  <motion.div key={`cost-${i}`} className="absolute h-px bg-gradient-to-r from-transparent via-[#10b981] to-transparent opacity-30" style={{ top: `${25 + i * 15}%`, left: '10%', right: '10%' }} animate={{ scaleX: [0, 1, 0], opacity: [0, 0.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }} />
                ))}
                {/* Vertical lines */}
                {[...Array(4)].map((_, i) => (
                  <motion.div key={`analytics-${i}`} className="absolute w-px bg-gradient-to-b from-transparent via-[#3b82f6] to-transparent opacity-25" style={{ left: `${20 + i * 20}%`, top: '15%', bottom: '15%' }} animate={{ scaleY: [0, 1, 0], opacity: [0, 0.4, 0] }} transition={{ duration: 4.5, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }} />
                ))}
                {/* Line graph */}
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300">
                  <motion.path d="M50,200 Q100,180 150,160 T250,120 T350,80" stroke="#10b981" strokeWidth="2" fill="none" strokeDasharray="5,5" animate={{ pathLength: [0, 1], opacity: [0, 0.4, 0.1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
                </svg>
                {/* Data points */}
                {[...Array(6)].map((_, i) => (
                  <motion.div key={`point-${i}`} className="absolute w-1 h-1 bg-[#10b981] rounded-full opacity-15" style={{ left: `${20 + i * 12}%`, top: `${40 + Math.sin(i) * 20}%` }} animate={{ scale: [0.5, 1.5, 0.5], opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }} />
                ))}
                
                {/* FLOATING DATA LABELS */}
                <FloatingDataLabel top="22%" left="12%" value="+24.5% Savings" color="#10b981" delay={0} />
                <FloatingDataLabel top="38%" right="18%" value="$1.2M Processed" color="#a02ff1" delay={1.5} icon={DollarSign} />
                <FloatingDataLabel bottom="28%" left="25%" value="99.9% Uptime" color="#3b82f6" delay={3} />
              </div>

              {/* CLOUD PROVIDER ICONS - OPTIMIZED FOR VISIBILITY */}
              <ProviderIcon top="4%" left="4%" icon="/aws.svg" color="#ff9900" delay={0} />
              <ProviderIcon top="4%" right="4%" icon="/azure.svg" color="#0078d4" delay={0.5} />
              <ProviderIcon bottom="4%" left="4%" icon="/gcp.svg" color="#4285f4" delay={1} />
              <ProviderIcon bottom="4%" right="4%" icon="/oracle.svg" color="#f80000" delay={1.5} />

              {/* MAIN CENTRAL LOGO - FIXED CIRCULAR IMAGE */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="relative"
                >
                  {/* Outer rings */}
                  <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2], rotate: [0, 360] }} transition={{ scale: { duration: 3, repeat: Infinity }, opacity: { duration: 3, repeat: Infinity }, rotate: { duration: 20, repeat: Infinity, ease: "linear" }}} className="absolute inset-0 rounded-full border-2 border-dashed border-[#a02ff1] opacity-30" style={{ width: '200px', height: '200px', left: '-84px', top: '-84px' }} />
                  <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4], rotate: [360, 0] }} transition={{ scale: { duration: 2.5, repeat: Infinity }, opacity: { duration: 2.5, repeat: Infinity }, rotate: { duration: 15, repeat: Infinity, ease: "linear" }}} className="absolute inset-0 rounded-full border border-[#9333EA] opacity-40" style={{ width: '150px', height: '150px', left: '-59px', top: '-59px' }} />

                  {/* LOGO CONTAINER */}
                  <motion.div
                    animate={{ rotateY: [0, 5, 0, -5, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-32 h-32 flex items-center justify-center rounded-full bg-[#1a1b20] border border-[#a02ff1]/40 overflow-hidden shadow-[0_0_30px_rgba(160,47,241,0.3)]"
                  >
                    {/* Scanning line effect */}
                    <motion.div animate={{ top: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }} className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-[#a02ff1]/30 to-transparent pointer-events-none z-0" />

                    {/* THE ACTUAL LOGO IMAGE */}
                    <motion.img
                      src="/k&coicon.svg"
                      alt="K&Co Logo"
                      className="w-16 h-16 object-contain relative z-20"
                      animate={{ filter: ['drop-shadow(0 0 15px rgba(160,47,241,0.5)) brightness(1.1)', 'drop-shadow(0 0 25px rgba(160,47,241,0.8)) brightness(1.2)', 'drop-shadow(0 0 15px rgba(160,47,241,0.5)) brightness(1.1)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    
                    {/* Glass shine effect */}
                    <motion.div className="absolute inset-0 pointer-events-none z-30" style={{ background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)', backgroundSize: '200% 200%' }} animate={{ backgroundPosition: ['-100% -100%', '200% 200%'] }} transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }} />
                  </motion.div>

                  {/* Orbiting nodes */}
                  {[0, 1, 2, 3].map((index) => (
                    <motion.div key={index} animate={{ rotate: 360 }} transition={{ duration: 12 + index * 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 pointer-events-none" style={{ width: '220px', height: '220px', left: '-66px', top: '-66px' }}>
                      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }} className="absolute w-2 h-2 bg-[#a02ff1] rounded-full" style={{ top: `${10 + index * 20}px`, left: '50%', transform: 'translateX(-50%)', boxShadow: '0 0 15px rgba(160, 47, 241, 0.8)' }} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Bottom Branding & Pillars */}
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <motion.div className="text-2xl font-bold text-white mb-4 font-mono tracking-wider" animate={{ opacity: [0.7, 1, 0.7], textShadow: ['0 0 10px rgba(160,47,241,0.4)', '0 0 20px rgba(160,47,241,0.8)', '0 0 10px rgba(160,47,241,0.4)'] }} transition={{ duration: 3, repeat: Infinity }}>K&Co.</motion.div>
                <div className="flex items-center justify-center gap-6 mb-3">
                  <PillarIcon icon={Cloud} color="#10b981" delay={0} />
                  <PillarIcon icon={DollarSign} color="#f59e0b" delay={0.8} />
                  <PillarIcon icon={BarChart3} color="#a02ff1" delay={1.6} />
                </div>
                <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs text-gray-500 font-mono flex items-center justify-center gap-2"><Activity size={10} className="text-[#a02ff1] animate-pulse" />SYSTEM.ACTIVE<Activity size={10} className="text-[#a02ff1] animate-pulse" /></motion.div>
              </div>

              {/* Corner Accents */}
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"><div className="w-full h-full bg-gradient-to-bl from-[#a02ff1]/20 to-transparent rounded-bl-full border-l border-b border-[#a02ff1]/30" /></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 pointer-events-none"><div className="w-full h-full bg-gradient-to-tr from-[#9333EA]/20 to-transparent rounded-tr-full border-r border-t border-[#9333EA]/30" /></div>

            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
    </>
  );
};

// --- HELPER COMPONENTS ---

// UPDATED: Provider Icon - Optimized for Visual Perfection
const ProviderIcon = ({ top, bottom, left, right, icon, color, delay }) => {
  // Check if this is the AWS icon (or others requiring specific handling)
  const isAws = icon.includes('aws');
  const isAzure = icon.includes('azure'); // 1. Add this check

  // 2. Update this logic:
  // - AWS gets p-3 (contained)
  // - Azure gets p-1 (very small padding = HUGE logo/text)
  // - Others get p-2 (standard)
  let paddingClass = 'p-2'; 
  if (isAws) paddingClass = 'p-3';
  if (isAzure) paddingClass = 'p-1';

  return (
    <div className="absolute z-30" style={{ top, bottom, left, right }}>
      <div className="relative">
        {/* 1. Orbiting Circle Animation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-2 border border-dashed rounded-full pointer-events-none"
          style={{ borderColor: `${color}60` }}
        />
        
        {/* 2. Main Icon Container - Glassy White BG for cleaner look */}
        <motion.div
          animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: delay, ease: "easeInOut" }}
          className={`w-16 h-16 ${paddingClass} rounded-full border backdrop-blur-md flex items-center justify-center shadow-lg`}
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.05)', // Subtle white tint for glass effect
            borderColor: `${color}60`,
            boxShadow: `0 0 20px -5px ${color}40` 
          }}
        >
          <img 
            src={icon} 
            alt="Cloud Provider" 
            className="w-full h-full object-contain" 
            style={{ 
              // AWS: Silver/White filter (premium look on dark)
              // Others: Brightness boost to pop
              filter: isAws 
                ? 'brightness(0) invert(0.9) opacity(0.95)' 
                : 'brightness(1.15) contrast(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.3))' 
            }} 
          />
        </motion.div>
      </div>
    </div>
  );
};

// Floating data labels
const FloatingDataLabel = ({ top, left, right, bottom, value, color, delay, icon: Icon }) => (
  <motion.div
    className="absolute px-2.5 py-1.5 rounded-md bg-[#0f0f11]/80 border flex items-center gap-1.5 text-[10px] font-mono font-bold backdrop-blur-md z-20"
    style={{ top, left, right, bottom, borderColor: `${color}40`, color: color, boxShadow: `0 4px 15px -5px ${color}30` }}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.9], y: [5, 0, 0, -5] }}
    transition={{ duration: 5, repeat: Infinity, delay: delay, times: [0, 0.1, 0.8, 1] }}
  >
    {Icon && <Icon size={10} />}
    {value}
    <ArrowUpRight size={10} className="opacity-50" />
  </motion.div>
);

const PillarIcon = ({ icon: Icon, color, delay }) => (
  <motion.div 
    animate={{ y: [0, -5, 0], opacity: [0.6, 1, 0.6] }}
    transition={{ duration: 3, repeat: Infinity, delay: delay, ease: "easeInOut" }}
    className="flex flex-col items-center gap-1"
  >
    <div className="p-3 rounded-lg border backdrop-blur-sm" style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
      <Icon size={18} style={{ color: color }} />
    </div>
    <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
  </motion.div>
);

export default Hero;