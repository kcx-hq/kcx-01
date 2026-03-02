import React from "react";
import { Loader2, Inbox, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { DataExplorerStatesProps } from "../types";

const DataExplorerStates = ({ type }: DataExplorerStatesProps) => {
  // Brand color constant
  const BRAND_EMERALD = "#23a282";

  if (type === "loading") {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-white relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/30 to-transparent pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="p-5 bg-emerald-50 rounded-full mb-4 shadow-sm border border-emerald-100/50">
            <Loader2 className="text-[#23a282] animate-spin" size={40} strokeWidth={1.5} />
          </div>
          <h3 className="text-slate-800 font-black text-lg tracking-tight mb-1">Retrieving Intelligence</h3>
          <p className="text-slate-400 text-sm font-medium">Syncing your cloud infrastructure data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center px-6"
      >
        <div className="p-6 bg-white rounded-[2rem] shadow-sm border border-slate-200 mb-6 relative">
          <Inbox className="text-slate-200" size={48} strokeWidth={1} />
          <div className="absolute -top-2 -right-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm text-[#23a282]">
            <Sparkles size={16} />
          </div>
        </div>
        
        <h3 className="text-slate-800 font-black text-xl tracking-tight mb-2">Zero Records Found</h3>
        <p className="text-slate-500 text-sm font-medium max-w-xs leading-relaxed">
          We couldn't find any data matching your current filters. Try adjusting your parameters to explore different dimensions.
        </p>
        
        <div className="mt-8 flex gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-100" />
        </div>
      </motion.div>
    </div>
  );
};

export default DataExplorerStates;


