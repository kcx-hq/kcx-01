import React, { useCallback } from "react";
import { RotateCcw, BarChart4, Sparkles, Lock } from "lucide-react";
import { formatCurrency } from "../utils/format.js";

// --- SHARED PALETTE (Exact match to SpendBehaviorCard) ---
const COLOR_PALETTE = [
  "#007758", // 1. Emerald
  "#84cc16", // 2. Lime
  "#0ea5e9", // 3. Sky Blue
  "#8b5cf6", // 4. Violet
  "#14b8a6", // 5. Teal
  "#f59e0b", // 6. Amber
  "#6366f1", // 7. Indigo
  "#ec4899", // 8. Pink
  "#f43f5e", // 9. Rose
  "#64748b", // 10. Slate
];

const BreakdownSidebar = ({
  isLocked,
  breakdown = [],
  hiddenSeries,
  toggleSeries,
  totalSpend,
  onReset,
  activeKeys = [],
  brandColor = "#007758",
}) => {

  const getShare = useCallback(
    (val) => (totalSpend ? ((val / totalSpend) * 100).toFixed(1) : 0),
    [totalSpend]
  );

  return (
    <div className="flex flex-col h-full bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
            <BarChart4 size={18} style={{ color: brandColor }} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
              Intelligence
            </h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Service Breakdown
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => onReset?.()} 
          disabled={isLocked}
          className="p-2 hover:bg-slate-50 rounded-xl transition-colors group disabled:opacity-30 disabled:cursor-not-allowed"
          title="Reset Selection"
        >
          <RotateCcw size={14} className="text-slate-400 transition-colors group-hover:text-emerald-700" />
        </button>
      </div>

      {/* --- SCROLLABLE LIST --- */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto pr-2 custom-scrollbar">
            
            {/* LOCKED STATE OVERLAY */}
            {isLocked && (
               <div className="sticky top-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-white/80 backdrop-blur-sm h-full">
                  <div className="p-3 bg-slate-100 rounded-full mb-3">
                     <Lock size={20} className="text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Analysis Locked
                  </p>
                  <button
                    className="px-4 py-1.5 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-opacity hover:opacity-90"
                    style={{ backgroundColor: brandColor }}
                  >
                    Upgrade to View
                  </button>
               </div>
            )}

            <div className={`space-y-2 ${isLocked ? 'opacity-20 pointer-events-none' : ''}`}>
              {(breakdown || []).map((b, i) => {
                const name = b?.name ?? "";
                const isHidden = hiddenSeries.has(name);
                
                // --- ALIGNMENT FIX ---
                // Find this service's position in the graph's `activeKeys` list.
                // If found, use that index for color. If not found (fallback), use list index.
                const keyIndex = activeKeys.indexOf(name);
                const colorIndex = keyIndex >= 0 ? keyIndex : i;
                
                const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];

                return (
                  <div
                    key={name || i}
                    onClick={() => !isLocked && toggleSeries(name)}
                    className={`group flex justify-between items-center p-2.5 rounded-2xl cursor-pointer transition-all duration-300 border ${
                      isHidden 
                        ? "opacity-50 grayscale border-transparent bg-slate-50" 
                        : "bg-white border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md hover:-translate-x-1"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ring-2 ring-white" 
                        style={{ backgroundColor: isHidden ? "#94a3b8" : color }} 
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold tracking-tight truncate text-slate-700 group-hover:text-slate-900 transition-colors max-w-[110px]">
                          {name || "Unallocated"}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">
                          {getShare(b.value)}% Share
                        </span>
                      </div>
                    </div>
                    
                    <span className="text-[10px] font-black text-slate-900 font-mono">
                      {formatCurrency(b.value)}
                    </span>
                  </div>
                );
              })}
            </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2 shrink-0">
         <Sparkles size={12} className="text-emerald-500" />
         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
           Interactive Filtering
         </span>
      </div>
      
      {/* --- CUSTOM CSS FOR SCROLLBAR --- */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default BreakdownSidebar;
