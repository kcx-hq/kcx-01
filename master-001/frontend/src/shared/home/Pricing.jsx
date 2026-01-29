import React, { useState } from 'react';
import { Check, X as XIcon, Gift, Activity, ArrowRight, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false); // State for Modal

  // --- ACTIONS ---
  const handleFreeSignup = () => {
    // Navigate to Sign Up page to start the free process
    navigate('/sign-up');
    window.scrollTo(0, 0);
  };

  const handleScheduleDemo = () => {
    // Open the internal Modal
    setIsModalOpen(true);
  };

  // --- ANIMATIONS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 50, duration: 0.8 }
    }
  };

  return (
    <section className="py-24 bg-[#0f0f11] relative overflow-hidden" id="pricing">
      
      {/* Background Decor */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#a02ff1]/5 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* SECTION HEADER */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a02ff1]/10 text-[#a02ff1] text-xs font-bold uppercase mb-4 border border-[#a02ff1]/20">
              <Zap size={12} fill="currentColor" /> Start Risk-Free
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#a02ff1]">Free</span>, Scale Smart.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Begin with a free audit. Upgrade to continuous optimization when ready.
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
          
          {/* === CARD 1: Free Tier (Blue Theme) === */}
          <motion.div 
            variants={cardVariants}
            whileHover={{ y: -10 }}
            className="bg-[#121214] border border-white/10 rounded-3xl p-8 hover:border-blue-500/30 transition-all duration-300 group flex flex-col h-full relative"
          >
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <Gift className="text-blue-400" size={24} />
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase border border-blue-500/20">
                    Free Tier
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">FinOps Snapshot™</h3>
            <p className="text-gray-400 text-sm mb-6">One-time audit & savings report.</p>

            {/* Price */}
            <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/5 group-hover:bg-blue-500/5 transition-colors">
                <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white">$0</span>
                </div>
                <p className="text-xs text-blue-400 mt-1 font-medium">No credit card required</p>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8 flex-1">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">What's Included</p>
                <ListItem text="30 days of cloud data analysis" theme="blue" />
                <ListItem text="AWS, Azure or GCP billing review" theme="blue" />
                <ListItem text="Idle resource identification" theme="blue" />
                <ListItem text="Savings opportunity report" theme="blue" />
                <div className="pt-4 border-t border-white/5 space-y-4 opacity-50">
                    <ListItem text="Real-time monitoring" theme="gray" />
                    <ListItem text="Weekly optimization cadence" theme="gray" />
                </div>
            </div>

            {/* CTA Button */}
            <button 
                onClick={handleFreeSignup}
                className="w-full py-4 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2 group"
            >
                Get Free Snapshot
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* === CARD 2: Enterprise (Purple Theme) === */}
          <motion.div 
            variants={cardVariants}
            whileHover={{ y: -10 }}
            className="bg-[#121214] border-2 border-[#a02ff1]/60 rounded-3xl p-8 relative flex flex-col h-full shadow-[0_0_40px_rgba(160,47,241,0.1)]"
          >
            
            {/* Highlight Badge */}
            <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#a02ff1] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg"
            >
              Most Popular
            </motion.div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6 mt-2">
                <div className="w-12 h-12 rounded-xl bg-[#a02ff1]/20 flex items-center justify-center border border-[#a02ff1]/30 group-hover:scale-110 transition-transform">
                    <Activity className="text-[#a02ff1]" size={24} />
                </div>
                <div className="px-3 py-1 rounded-full bg-[#a02ff1]/10 text-[#a02ff1] text-[10px] font-bold uppercase border border-[#a02ff1]/20">
                    Enterprise
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">FinOps Continuous™</h3>
            <p className="text-gray-400 text-sm mb-6">Always-on optimization service.</p>

            {/* Price */}
            <div className="mb-8 p-4 bg-[#a02ff1]/10 rounded-xl border border-[#a02ff1]/20">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">Custom</span>
                    <span className="text-gray-400 text-sm">/ month</span>
                </div>
                <p className="text-xs text-[#a02ff1] mt-1 font-medium">Pricing based on cloud spend</p>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8 flex-1">
                <p className="text-xs font-bold text-[#a02ff1] uppercase tracking-widest mb-2">Everything in Free +</p>
                <ListItem text="Real-time billing data ingestion" theme="purple" />
                <ListItem text="Continuous waste detection" theme="purple" />
                <ListItem text="Weekly executive insights" theme="purple" />
                <ListItem text="Savings Plan/RI strategy" theme="purple" />
                <ListItem text="Anomaly detection & alerts" theme="purple" />
                <ListItem text="Engineer Slack alerts" theme="purple" />
            </div>

            {/* CTA Button (TRIGGER MODAL) */}
            <button 
                onClick={handleScheduleDemo}
                className="w-full py-4 bg-[#a02ff1] hover:bg-[#7e33e8] rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 group"
            >
                Schedule Demo
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#1a1b20] border border-[#a02ff1]/30 rounded-2xl p-8 shadow-2xl overflow-hidden"
            >
              {/* Purple Top Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#a02ff1]" />

              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-[#a02ff1]/10 rounded-xl flex items-center justify-center mb-4 text-[#a02ff1]">
                   <Activity size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Book a Demo</h3>
                <p className="text-gray-400 text-sm">Tell us about your infrastructure, and we'll show you how we can optimize it.</p>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Work Email</label>
                    <input type="email" placeholder="name@company.com" className="w-full bg-[#0f0f11] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#a02ff1] focus:outline-none transition-colors" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Cloud Spend (Est.)</label>
                    <select className="w-full bg-[#0f0f11] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#a02ff1] focus:outline-none transition-colors">
                       <option>Less than $10k/mo</option>
                       <option>$10k - $50k/mo</option>
                       <option>$50k - $200k/mo</option>
                       <option>$200k+/mo</option>
                    </select>
                 </div>
                 <button className="w-full py-3 bg-[#a02ff1] hover:bg-[#8e25d9] text-white font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(160,47,241,0.3)] mt-2 hover:-translate-y-1">
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
  let iconColor = 'text-gray-600';
  let Icon = XIcon;
  let textColor = 'text-gray-500';

  if (theme === 'blue') {
      iconColor = 'text-blue-400';
      Icon = Check;
      textColor = 'text-gray-300';
  } else if (theme === 'purple') {
      iconColor = 'text-[#a02ff1]';
      Icon = Check;
      textColor = 'text-white font-medium';
  }

  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 ${theme === 'purple' ? 'bg-[#a02ff1]/20 rounded-full p-[1px]' : ''}`}>
        <Icon size={16} className={iconColor} />
      </div>
      <p className={`text-sm leading-tight ${textColor}`}>
        {text}
      </p>
    </div>
  );
};

export default Pricing;