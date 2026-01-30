import React, { useState } from 'react';
import { Target, Zap, Users, ArrowRight, TrendingUp, ShieldCheck, BarChart3, Earth, X, Code2, DollarSign, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const About = () => {
  
  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section className="py-24 bg-[#0f0f11] relative overflow-hidden" id="about">
      
      {/* --- DYNAMIC BACKGROUNDS --- */}
      <motion.div 
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1], x: [-20, 20, -20] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#8B2FC9]/10 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div 
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1.2, 1, 1.2], x: [20, -20, 20] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"
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
          <motion.span variants={fadeInUp} className="text-[#8B2FC9] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
            WHO WE ARE
          </motion.span>
          
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
            FinOps Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B2FC9] to-purple-400">Engineering-Led Teams</span>
          </motion.h2>
          
          <motion.p variants={fadeInUp} className="text-gray-400 text-lg leading-relaxed mb-6">
            K&Co is a Cloud FinOps platform that helps engineering-led companies understand, control, and optimize their cloud spend — without slowing down development.
          </motion.p>

          <motion.p variants={fadeInUp} className="text-gray-400 text-lg leading-relaxed mb-6">
            We turn complex AWS and GCP billing data into clear, actionable insights by combining a practical FinOps platform with hands-on expertise. Our focus is simple: help teams make better cloud cost decisions, faster.
          </motion.p>

          <motion.p variants={fadeInUp} className="text-gray-500 text-base font-light max-w-2xl mx-auto">
            We work with startups and digital businesses where engineering, finance, and product teams need a shared view of cloud costs, unit economics, and efficiency.
          </motion.p>
        </motion.div>

        {/* --- PART 2: KPI CARDS --- */}
        <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-white/5 py-12 mb-24"
        >
            <StatItem icon={TrendingUp} value="10-30%" label="Avg. Cost Reduction" color="text-white" iconColor="text-[#8B2FC9]" delay={0} />
            <StatItem icon={Earth} value="50+" label="Enterprise Clients" color="text-white" iconColor="text-[#8B2FC9]" delay={0.1} />
            <StatItem icon={BarChart3} value="$500M+" label="Spend Analyzed" color="text-white" iconColor="text-[#8B2FC9]" delay={0.2} />
            <StatItem icon={ShieldCheck} value="98%" label="Client Retention" color="text-white" iconColor="text-[#8B2FC9]" delay={0.3} />
        </motion.div>

        {/* --- PART 3: THE K&Co. DIFFERENCE --- */}
        <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
        >
            <h3 className="text-3xl font-bold text-white mb-4">Why Partner With Us?</h3>
            <p className="text-gray-400">Click "See Our Approach" below to explore how we drive results.</p>
        </motion.div>

        <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
            {/* CARD 1: FINANCIAL */}
            <ValueCard 
                icon={DollarSign}
                title="ROI-Obsessed"
                desc="We look beyond simple savings. We optimize your unit economics to ensure every cloud dollar spent drives actual revenue."
                color="bg-[#8B2FC9]"
                iconColor="text-white"
                details={[
                    "Unit Cost Analysis (Cost per Transaction)",
                    "Strategic RIs & Savings Plans",
                    "Budget Forecasting vs. Actuals"
                ]}
            />

            {/* CARD 2: TECHNICAL */}
            <ValueCard 
                icon={Code2}
                title="Engineering DNA"
                desc="We speak your team's language. Our recommendations are technical, practical, and ready to deploy—no 'fluff' reports."
                color="bg-blue-600"
                iconColor="text-white"
                details={[
                    "Infrastructure-as-Code Audits",
                    "Non-Disruptive Architecture Tuning",
                    "Identifying Zombie Assets & Waste"
                ]}
            />

            {/* CARD 3: SAFETY */}
            <ValueCard 
                icon={Lock}
                title="Risk-Free Execution"
                desc="We prioritize uptime above all else. Our 'Safe-Saving' protocols ensure cost cuts never compromise reliability."
                color="bg-[#8B2FC9]"
                iconColor="text-white"
                details={[
                    "Stability-First Audits",
                    "Pre-Deployment Validation",
                    "Zero-Downtime Implementation Plans"
                ]}
            />
        </motion.div>

      </div>
    </section>
  );
};

// --- SUB-COMPONENTS ---

const StatItem = ({ icon: Icon, value, label, color, iconColor, delay }) => (
    <motion.div 
      variants={{
        hidden: { scale: 0.8, opacity: 0 },
        visible: { scale: 1, opacity: 1, transition: { duration: 0.6, delay: delay } }
      }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="flex flex-col items-center justify-center text-center p-4 rounded-xl hover:bg-white/5 transition-colors duration-300"
    >
        <div className="flex items-center gap-2 mb-2">
            <Icon size={24} className={iconColor} />
            <span className={`text-3xl md:text-4xl font-bold ${color}`}>{value}</span>
        </div>
        <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">{label}</span>
    </motion.div>
);

// --- INTERACTIVE VALUE CARD ---
const ValueCard = ({ icon: Icon, title, desc, color, iconColor, details }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div 
            variants={{
                hidden: { y: 50, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
            }}
            whileHover={!isOpen ? { y: -10 } : {}}
            className={`
                relative h-[380px] flex flex-col p-8 rounded-2xl border transition-all duration-500 overflow-hidden shadow-xl backdrop-blur-md group
                ${isOpen 
                    ? 'border-[#8B2FC9] bg-[#1a1b20]' 
                    : 'border-white/10 bg-[#1a1b20]/40 hover:bg-[#1a1b20]/60 hover:border-[#8B2FC9]/50 hover:shadow-[0_0_30px_rgba(139,47,201,0.2)]'
                }
            `}
        >
            {/* Background Gradient Effect */}
            {!isOpen && (
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#000000]/40 pointer-events-none transition-opacity duration-500 group-hover:opacity-0" />
            )}

            {/* MAIN CONTENT */}
            <div className="relative z-10 flex-1 flex flex-col">
                <motion.div 
                    layout
                    className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                    <Icon size={28} className={iconColor} />
                </motion.div>
                
                <motion.h4 layout className="text-2xl font-bold text-white mb-4 group-hover:text-[#a02ff1] transition-colors">{title}</motion.h4>
                <motion.p layout className="text-gray-400 text-sm leading-relaxed mb-6">
                    {desc}
                </motion.p>
            </div>

            {/* OUR APPROACH BUTTON */}
            <motion.button
                layout
                onClick={() => setIsOpen(true)}
                className="relative z-20 flex items-center gap-3 text-[#8B2FC9] text-sm font-bold cursor-pointer group/btn mt-auto w-fit px-4 py-2 rounded-lg hover:bg-[#8B2FC9]/10 transition-colors"
            >
                <span className="w-2 h-2 rounded-full bg-[#8B2FC9] group-hover/btn:scale-125 transition-transform"></span>
                See Our Approach 
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </motion.button>

            {/* --- SLIDE UP DETAILS OVERLAY --- */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute inset-0 bg-[#1A1B1E] z-30 p-8 flex flex-col border-t-4 border-[#8B2FC9]"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <h5 className="text-white font-bold text-lg flex items-center gap-2">
                                <Zap size={18} className="text-[#8B2FC9]" /> How We Do It
                            </h5>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
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
                                    className="flex items-start gap-3 text-sm text-gray-300"
                                >
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#8B2FC9] flex-shrink-0 shadow-[0_0_8px_#8B2FC9]" />
                                    {item}
                                </motion.li>
                            ))}
                        </ul>

                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                            className="mt-auto text-xs text-gray-500 hover:text-white text-center w-full pt-4 border-t border-white/5 uppercase tracking-wider font-bold transition-colors"
                        >
                            Close Details
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default About;