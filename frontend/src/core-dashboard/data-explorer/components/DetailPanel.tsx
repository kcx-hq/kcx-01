import React from "react";
import { X, Copy, Info, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DetailPanelProps, ExplorerCell } from "../types";

const BRAND_EMERALD = "#007758";

const DetailPanel = ({ selectedRow, setSelectedRow, allColumns }: DetailPanelProps) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopy = (key: string, value: ExplorerCell | unknown) => {
    navigator.clipboard.writeText(String(value));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <AnimatePresence>
      {selectedRow && (
        <>
          {/* Frosted Glass Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRow(null)}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-md z-40"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white border-l border-slate-200 shadow-[-20px_0_50px_rgba(0,0,0,0.05)] z-50 flex flex-col overflow-hidden"
          >
            {/* Header Area */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center relative overflow-hidden">
              {/* Subtle Decorative Background Element */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-60" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                        <Info size={18} className="text-[#007758]" />
                    </div>
                    <h3 className="text-slate-900 font-black text-xl tracking-tight leading-none">
                        Inspect Record
                    </h3>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] ml-11">
                  Full Attribute Distribution
                </p>
              </div>

              <button
                onClick={() => setSelectedRow(null)}
                className="p-2.5 bg-white hover:bg-red-50 border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Data Attributes List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 bg-white">
              {allColumns.map((col: string) => {
                const value = selectedRow?.[col];
                const isNull = value === null || value === undefined || value === "";

                return (
                  <motion.div 
                    key={col} 
                    className="group relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                        {col.replace(/_/g, " ")}
                      </label>
                      
                      <button
                        onClick={() => !isNull && handleCopy(col, value)}
                        disabled={isNull}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                          copiedKey === col 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                            : "bg-slate-50 border-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600"
                        }`}
                      >
                        {copiedKey === col ? (
                          <> <CheckCircle2 size={10} /> Copied! </>
                        ) : (
                          <> <Copy size={10} /> Copy </>
                        )}
                      </button>
                    </div>

                    <div className={`text-xs font-bold p-4 rounded-2xl border transition-all duration-300 ${
                        isNull 
                        ? "bg-slate-50 border-dashed border-slate-200 text-slate-300 italic" 
                        : "bg-white border-slate-200 text-slate-800 shadow-sm group-hover:border-emerald-200 group-hover:shadow-emerald-100/20"
                    }`}>
                      <div className="font-mono break-all leading-relaxed tracking-tight">
                        {isNull ? "Empty Value" : String(value)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex gap-3">
                 <button 
                    onClick={() => setSelectedRow(null)}
                    className="flex-1 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    Dismiss Analysis
                 </button>
                 <button 
                    onClick={() => handleCopy("all", JSON.stringify(selectedRow, null, 2))}
                    className="flex-1 py-3 bg-[#007758] text-white rounded-2xl text-xs font-black hover:opacity-90 transition-all shadow-lg shadow-emerald-200/50 active:scale-95 flex items-center justify-center gap-2"
                >
                    <Copy size={14} /> Copy Object
                 </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetailPanel;


