import React from "react";
import { X, AlertCircle, BarChart3, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../utils/format";
import type { BreakdownModalProps, CostBreakdownItem } from "../types";

const BRAND_EMERALD = "#007758";

const BreakdownModal = ({ isOpen, onClose, data }: BreakdownModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop with nature-inspired blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden z-10"
          >
            {/* --- HEADER --- */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm text-[#007758]">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.15em] leading-none mb-1">
                    Resource Allocation
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Full Financial breakdown
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-400 transition-all active:scale-90 shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
              <div className="space-y-2.5">
                {(data || []).map((item: CostBreakdownItem, idx: number) => {
                  const isUnallocated =
                    !item.name ||
                    item.name === "null" ||
                    item.name === "Unallocated Resources";

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-900/5 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {isUnallocated ? (
                          <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
                            <AlertCircle size={14} />
                          </div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                        )}
                        <span
                          className={`text-xs font-black tracking-tight truncate max-w-[240px] ${
                            isUnallocated ? "text-slate-400 italic" : "text-slate-700"
                          }`}
                          title={item.name}
                        >
                          {item.name || "Unallocated Resources"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black font-mono text-[#007758] tracking-tighter">
                          {formatCurrency(item.value)}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Sparkles size={12} className="text-emerald-300" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {data?.length || 0} Dimensions Identified
                </p>
                <button
                    onClick={onClose}
                    className="bg-[#007758] hover:opacity-95 text-white px-8 py-3 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200/50 transition-all active:scale-95"
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

export default BreakdownModal;


