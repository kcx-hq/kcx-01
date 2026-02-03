import React, { useCallback } from "react";
import PremiumGate from "../../common/PremiumGate.jsx";
import { COLOR_PALETTE } from "../utils/constants.js";
import { formatCurrency } from "../utils/format.js";

const BreakdownSidebar = ({
  isLocked,
  breakdown,
  hiddenSeries,
  toggleSeries,
  totalSpend,
  onReset,
  activeKeys = [],
}) => {
  const getShare = useCallback(
    (val) => (totalSpend ? ((val / totalSpend) * 100).toFixed(1) : 0),
    [totalSpend]
  );

   const list = (
    <div className={`${isLocked ? 'max-h-[57vh]' : 'overflow-y-auto'} space-y-1 flex-1 pr-1 custom-scrollbar`}>
      {(breakdown || []).map((b, i) => {
        const name = b?.name ?? "";
        const isUnallocated =
          !name || name === "null" || name === "Unallocated Resources";

        return (
          <div
            key={name || i}
            onClick={() => toggleSeries(name)}
            className={`group flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${
              hiddenSeries.has(name) ? "opacity-30 grayscale" : "hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: COLOR_PALETTE[activeKeys.indexOf(name) >= 0 ? activeKeys.indexOf(name) % COLOR_PALETTE.length : i % COLOR_PALETTE.length],
                }}
              />
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-xs font-medium truncate transition-colors group-hover:text-white ${
                    isUnallocated ? "text-gray-500 italic" : "text-gray-300"
                  }`}
                  title={name}
                >
                  {name || "Unallocated Resources"}
                </span>
                <span className="text-[9px] text-gray-600 font-mono">
                  {getShare(b.value)}%
                </span>
              </div>
            </div>
          
            <span className="text-xs font-bold text-white font-mono">
              {formatCurrency(b.value)}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex-1 bg-[#1a1b20] border border-white/5 rounded-2xl p-4 overflow-hidden flex flex-col shadow-xl relative">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Breakdown
        </span>
        <button
          type="button"
          onClick={(e) => {
            e?.preventDefault?.();
            e?.stopPropagation?.();
            onReset?.();
          }}
          disabled={isLocked}
          className="text-[#a02ff1] text-[10px] font-bold hover:underline disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          RESET
        </button>
      </div>

      {/* If locked: wrap the list with PremiumGate. If not: render list normally. */}
      {isLocked ? (
        <PremiumGate variant="wrap">{list}</PremiumGate>
      ) : (
        list
      )}
    </div>
  );
};

export default BreakdownSidebar;
