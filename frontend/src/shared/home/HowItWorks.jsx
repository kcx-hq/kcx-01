import React, { useState, useEffect } from 'react';
import { 
  UserPlus, UploadCloud, LayoutDashboard, 
  ArrowRight, Zap, FileSpreadsheet, CheckCircle2,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const HowItWorks = ({ activateCTA = () => {} }) => {
  const [activeTab, setActiveTab] = useState(1);
  const navigate = useNavigate();

  // --- AUTOMATIC ROTATION (4s) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev === 3 ? 1 : prev + 1));
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

  const handleTryItForFree = (e) => {
    e.preventDefault();
    if (activateCTA) {
      activateCTA();
    }
    const heroSection = document.getElementById('hero');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { duration: 0.5 } 
    }
  };

  return (
    <section id="how-it-works" className="py-16 bg-[#0f0f11] relative overflow-hidden flex items-center justify-center min-h-[90vh]">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <motion.div 
           animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
           transition={{ duration: 8, repeat: Infinity }}
           className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#a02ff1]/10 rounded-full blur-[100px]" 
         />
         <motion.div 
           animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
           transition={{ duration: 10, repeat: Infinity, delay: 1 }}
           className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" 
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
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(160,47,241,0.3)]">
            <Zap size={14} className="text-[#a02ff1] fill-current" />
            Simple Workflow
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            From Data to Dashboard in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a02ff1] to-blue-500">Minutes</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
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

          {/* RIGHT: Visual Preview (Reduced Height for 1-screen fit) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-7 perspective-1000"
          >
            <div className="h-[420px] bg-[#1a1b20]/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md shadow-2xl group flex flex-col justify-center">
              
              {/* Internal Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#a02ff1]/5 to-blue-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

              <AnimatePresence mode="wait">
                
                {/* VISUAL: STEP 1 (SIGN UP) */}
                {activeTab === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center w-full"
                  >
                     <div className="relative mb-6 animate-float">
                        <div className="w-20 h-20 bg-[#a02ff1]/20 rounded-full flex items-center justify-center text-[#a02ff1] shadow-[0_0_40px_rgba(160,47,241,0.4)]">
                           <UserPlus size={40} />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                          SECURE
                        </div>
                     </div>
                     
                     <div className="w-full max-w-xs space-y-3">
                        <div className="h-10 bg-[#0f0f11] border border-white/10 rounded-lg w-full flex items-center px-4 text-xs text-gray-500">
                          name@company.com
                        </div>
                        <div className="h-10 bg-[#0f0f11] border border-white/10 rounded-lg w-full flex items-center px-4 text-xs text-gray-500">
                          ••••••••••••
                        </div>
                        <div className="h-10 bg-gradient-to-r from-[#a02ff1] to-blue-600 rounded-lg w-full flex items-center justify-center text-xs font-bold text-white shadow-lg animate-pulse">
                          Create Free Account
                        </div>
                     </div>
                  </motion.div>
                )}

                {/* VISUAL: STEP 2 (UPLOAD) */}
                {activeTab === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center w-full"
                  >
                    <div className="w-full h-56 bg-[#0f0f11] border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group-hover:border-[#a02ff1]/50 transition-colors">
                       <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="mb-3">
                          <FileSpreadsheet size={48} className="text-gray-500 group-hover:text-[#a02ff1] transition-colors" />
                       </motion.div>
                       <div className="text-gray-300 font-bold text-sm">Drop Billing CSV</div>
                       <div className="absolute top-0 left-0 w-full h-1 bg-[#a02ff1] shadow-[0_0_20px_#a02ff1] animate-scan" />
                    </div>
                    
                    {/* Status Badges */}
                    <div className="mt-5 flex gap-3">
                       <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-mono flex items-center gap-2 border border-green-500/20">
                          <CheckCircle2 size={10} /> AWS Detected
                       </motion.div>
                       <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-mono flex items-center gap-2 border border-blue-500/20">
                          <CheckCircle2 size={10} /> Format Valid
                       </motion.div>
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.6 }}
                      className="mt-3"
                    >
                      <div className="px-3 py-1 rounded-full bg-[#a02ff1]/10 border border-[#a02ff1]/30 text-[#a02ff1] text-[9px] font-bold font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(160,47,241,0.2)]">
                        Focus Framework 1.0
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* VISUAL: STEP 3 (DASHBOARD) */}
                {activeTab === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col justify-center w-full"
                  >
                    <div className="relative space-y-3">
                      
                      {/* Top Stats */}
                      <div className="flex justify-between items-end px-1">
                          <div>
                              <div className="text-gray-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Total Month Spend</div>
                              <div className="text-2xl font-bold text-white tracking-tight">$12,450</div>
                          </div>
                          <div className="text-right">
                               <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-bold mb-0.5">
                                  <Zap size={8} fill="currentColor" /> Potential Savings
                               </div>
                               <div className="text-lg font-bold text-green-400">$3,200</div>
                          </div>
                      </div>

                      {/* MAIN GRAPH CARD */}
                      <div className="bg-[#0f0f11] border border-white/10 rounded-xl p-3 relative shadow-inner">
                          <div className="flex justify-between items-center mb-2">
                              <div className="flex gap-2 items-center">
                                  <BarChart3 size={12} className="text-[#a02ff1]" />
                                  <span className="text-[10px] text-gray-400 font-bold">Daily Cost Trend</span>
                              </div>
                              <div className="text-[9px] text-gray-500">Last 7 Days</div>
                          </div>

                          {/* COMPACT GRAPH */}
                          <div className="relative h-12 w-full flex items-end justify-between gap-1.5">
                               {[35, 60, 45, 80, 55, 90, 40].map((h, i) => (
                                   <motion.div 
                                      key={i} 
                                      className="w-full bg-[#1a1b20] rounded-t-sm relative h-full group"
                                      initial={{ height: 0 }}
                                      animate={{ height: "100%" }}
                                   >
                                       <motion.div 
                                          className="absolute bottom-0 w-full bg-gradient-to-t from-[#a02ff1] to-blue-500 rounded-t-sm"
                                          initial={{ height: 0 }}
                                          animate={{ height: `${h}%` }}
                                          transition={{ duration: 1, delay: i * 0.1 }}
                                       />
                                       <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                         ${h * 15}
                                       </div>
                                   </motion.div>
                               ))}
                          </div>
                      </div>

                      {/* DONUT CHARTS */}
                       <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#0f0f11] border border-white/10 p-2.5 rounded-xl flex items-center gap-2">
                               <div className="w-8 h-8 rounded-full relative flex items-center justify-center" style={{ background: 'conic-gradient(#3b82f6 55%, rgba(255,255,255,0.1) 0)' }}>
                                  <div className="absolute w-5 h-5 bg-[#0f0f11] rounded-full" />
                               </div>
                               <div>
                                   <div className="text-[9px] text-gray-400 font-bold">Compute</div>
                                   <div className="text-xs font-bold text-white">55%</div>
                               </div>
                          </div>
                          
                          <div className="bg-[#0f0f11] border border-white/10 p-2.5 rounded-xl flex items-center gap-2">
                               <div className="w-8 h-8 rounded-full relative flex items-center justify-center" style={{ background: 'conic-gradient(#22c55e 30%, rgba(255,255,255,0.1) 0)' }}>
                                  <div className="absolute w-5 h-5 bg-[#0f0f11] rounded-full" />
                               </div>
                               <div>
                                   <div className="text-[9px] text-gray-400 font-bold">Database</div>
                                   <div className="text-xs font-bold text-white">30%</div>
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

        {/* --- BOTTOM CTA (Refined) --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.button 
            onClick={handleTryItForFree}
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(160, 47, 241, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-[#a02ff1] hover:bg-[#8a25d4] text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/30 flex items-center gap-2 mx-auto"
          >
            <span>Try it for free</span>
            <ArrowRight size={20} />
          </motion.button>
          
          <p className="text-gray-500 text-sm mt-4">
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
      visible: { opacity: 1, x: 0 }
    }}
    onClick={onClick}
    className={`
      w-full text-left p-5 rounded-2xl border transition-all duration-300 group relative overflow-hidden
      ${isActive 
        ? 'bg-[#1a1b20] border-[#a02ff1] shadow-[0_0_20px_rgba(160,47,241,0.2)] scale-105 z-10' 
        : 'bg-transparent border-white/5 hover:bg-white/5 hover:border-white/10'
      }
    `}
  >
    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-[#a02ff1] transition-all duration-300 ${isActive ? 'h-full' : 'h-0'}`} />
    
    <div className="flex items-center gap-4 relative z-10">
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0
        ${isActive ? 'bg-[#a02ff1] text-white rotate-3' : 'bg-white/5 text-gray-500 group-hover:text-gray-300'}
      `}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className={`text-base font-bold mb-0.5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
          {step}. {title}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  </motion.button>
);

export default HowItWorks;