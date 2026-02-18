import React from "react";
import { X, Info, Sparkles, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const InfoModal = ({ isOpen, onClose, title, message, date, highlight, icon: CustomIcon }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop with smooth blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 overflow-hidden z-10"
          >
            {/* --- HEADER --- */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                   {CustomIcon || <Info size={18} className="text-[#007758]" />}
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.15em]">
                  {title}
                </h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-400 transition-all active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            {/* --- BODY --- */}
            <div className="p-8 flex flex-col items-center text-center">
              <div className="mb-6 relative">
                 {/* Decorative background glow */}
                 <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full" />
                 
                 {highlight && (
                   <div className="relative z-10">
                     <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">
                       {highlight}
                     </p>
                     <div className="flex items-center justify-center gap-1.5">
                        <Sparkles size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Statistical Insight</span>
                     </div>
                   </div>
                 )}
              </div>

              <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[240px]">
                {message}
              </p>

              {date && (
                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">
                    {date}
                  </span>
                </div>
              )}
            </div>

            {/* --- FOOTER --- */}
            <div className="p-6 pt-0">
              <button 
                onClick={onClose} 
                className="w-full py-4 bg-[#007758] text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200/50 hover:opacity-95 active:scale-[0.98] transition-all"
              >
                Dismiss Analysis
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InfoModal;