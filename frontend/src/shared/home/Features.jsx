import React, { useState } from 'react';
import { Clock, Activity, ArrowRight, Layers, CheckCircle2, X, FileText, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Features = () => {
  
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  // --- DETAILED CONTENT DATA ---
  const snapshotDetails = {
    process: ["Data Ingestion (Read-Only Access)", "7-Day Cost Analysis", "Architectural Review"],
    deliverables: ["Executive Summary PDF", "Itemized Savings Roadmap", "Immediate Action List"],
    idealFor: "Startups or Scale-ups needing a quick audit before a fundraise or budget cycle."
  };

  const continuousDetails = {
    process: ["Real-time Cloud Integration", "Automated Waste Detection", "Bi-Weekly FinOps Standups"],
    deliverables: ["Live Custom Dashboard", "Anomaly Alerting System", "Reserved Instance Management"],
    idealFor: "Enterprises with >$20k/mo spend looking to operationalize cost culture."
  };

  return (
    <section className="py-24 bg-[#0f0f11] relative overflow-hidden" id="services">
      
      {/* Background Decor */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#8B2FC9]/5 rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-6xl mx-auto px-6 relative z-10"
      >
        
        {/* --- HEADER --- */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B2FC9]/10 text-[#8B2FC9] text-xs font-bold uppercase mb-3 border border-[#8B2FC9]/20">
                <Layers size={14} /> Service Models
            </div>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Cloud FinOps <span className="text-[#8B2FC9]">Service Models</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-gray-400 text-base leading-relaxed">
            Choose the engagement model that fits your maturity level—from fast insights to continuous intelligence.
          </motion.p>
        </div>

        {/* --- SERVICE CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card 1: Snapshot */}
            <ServiceCard 
                icon={Clock} 
                title="FinOps Snapshot™" 
                desc="A fixed-duration engagement (3-4 weeks) to analyze a defined window of cloud data, surface cost drivers, and identify immediate quick wins."
                color="blue"
                tags={['Quick Start', 'Fixed Cost']}
                features={['Uses 30–90 days of billing data', 'Identifies idle resources', 'Delivers savings plan']}
                variants={itemVariants}
                details={snapshotDetails} // Pass details here
            />

            {/* Card 2: Continuous */}
            <ServiceCard 
                icon={Activity} 
                title="Continuous Integration™" 
                desc="An always-on FinOps operating model with real-time cloud data ingestion, continuous optimization, and a weekly savings cadence."
                color="purple"
                tags={['Ongoing', 'Monitoring']}
                features={['Real-time data ingestion', 'Continuous waste detection', 'Weekly executive insights']}
                variants={itemVariants}
                details={continuousDetails} // Pass details here
            />
        </div>

      </motion.div>
    </section>
  );
};

const ServiceCard = ({ icon: Icon, title, desc, color, tags, features, variants, details }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Dynamic Colors
    const isPurple = color === 'purple';
    const accentColor = isPurple ? 'text-[#8B2FC9]' : 'text-blue-400';
    const bgClass = isPurple ? 'bg-[#8B2FC9]/10' : 'bg-blue-500/10';
    const borderClass = isPurple ? 'border-[#8B2FC9]/20' : 'border-blue-500/20';
    const hoverBorder = isPurple ? 'group-hover:border-[#8B2FC9]/50' : 'group-hover:border-blue-500/50';
    const btnBg = isPurple ? 'hover:bg-[#8B2FC9]' : 'hover:bg-blue-500';

    return (
        <motion.div 
            variants={variants}
            // Only hover effect if not open
            whileHover={!isOpen ? { y: -8 } : {}}
            className={`
                bg-[#121214] border border-white/10 rounded-3xl p-8 
                ${hoverBorder} transition-all duration-300 flex flex-col h-[520px] group relative overflow-hidden shadow-lg hover:shadow-xl
            `}
        >
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {/* MAIN CARD CONTENT */}
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl ${bgClass} flex items-center justify-center border ${borderClass} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={accentColor} size={28} />
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                        {tags.map((tag, i) => (
                            <span key={i} className={`px-2 py-0.5 rounded-full ${bgClass} border ${borderClass} ${accentColor} text-[10px] font-bold uppercase`}>{tag}</span>
                        ))}
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-white transition-colors">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{desc}</p>
                
                <div className="w-full h-[1px] bg-white/5 mb-6 group-hover:bg-white/10 transition-colors"></div>

                <div className="space-y-3 mb-8 flex-1">
                    {features.map((f, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <CheckCircle2 size={16} className={accentColor} />
                            <span className="text-gray-300 text-sm">{f}</span>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => setIsOpen(true)}
                    className={`w-full py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 group/btn ${btnBg} hover:border-transparent transition-all`}
                >
                    Learn More <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* --- SLIDE UP DETAIL VIEW --- */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute inset-0 bg-[#1A1B1E] z-20 p-8 flex flex-col border-t-4"
                        style={{ borderColor: isPurple ? '#8B2FC9' : '#3B82F6' }}
                    >
                        {/* Detail Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-white font-bold text-lg flex items-center gap-2">
                                <FileText size={18} className={accentColor} /> Engagement Details
                            </h4>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Detail Content */}
                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            
                            {/* Process Section */}
                            <div>
                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Activity size={12} /> The Process
                                </h5>
                                <ul className="space-y-2">
                                    {details.process.map((step, i) => (
                                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${isPurple ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Deliverables Section */}
                            <div>
                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Zap size={12} /> Deliverables
                                </h5>
                                <ul className="space-y-2">
                                    {details.deliverables.map((item, i) => (
                                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${isPurple ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Ideal For Section */}
                            <div className={`p-4 rounded-xl border ${borderClass} ${bgClass}`}>
                                <h5 className={`text-xs font-bold ${accentColor} uppercase tracking-wider mb-1 flex items-center gap-2`}>
                                    <Target size={12} /> Ideal For
                                </h5>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {details.idealFor}
                                </p>
                            </div>
                        </div>

                        {/* Close Action */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                            className="mt-auto pt-4 w-full text-center text-xs text-gray-500 hover:text-white font-bold uppercase tracking-wider transition-colors border-t border-white/5"
                        >
                            Close View
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default Features;