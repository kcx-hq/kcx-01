import React from "react";
import { TrendingUp, Filter, LayoutGrid, List, Crown } from "lucide-react";
import { PERIOD_OPTIONS } from "../../../../core-dashboard/cost-drivers/utils/constants";
import { formatDate } from "../../../../core-dashboard/cost-drivers/utils/format";

export function CostDriversHeader({
  isMasked,
  period,
  setPeriod,
  activeServiceFilter,
  setActiveServiceFilter,
  availableServices,
  showTreeMap,
  setShowTreeMap,
  periods,
}) {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="text-[#1EA88A]" size={20} /> Cost Drivers
        </h1>

        {periods?.prev && periods?.current && (
          <p className="text-gray-400 text-xs mt-1">
            Comparing <strong>{formatDate(periods.prev)}</strong> to{" "}
            <strong>{formatDate(periods.current)}</strong>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-[#ffffff] p-1 rounded-xl border border-slate-200">
        {/* Period toggle */}
        <div className="flex bg-white/95 rounded-lg p-0.5 border border-slate-200 gap-0.5">
          {PERIOD_OPTIONS.map((d) => {
            const isPremiumPeriod = isMasked && d === 7;
            const isActive = period === d;

            return (
              <button
                key={d}
                onClick={() => !isPremiumPeriod && setPeriod(d)}
                disabled={isPremiumPeriod}
                className={[
                  "relative px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                  isPremiumPeriod ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                  isActive
                    ? "bg-[#1EA88A] text-white shadow-[0_0_10px_rgba(30,168,138,0.5)]"
                    : "bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10 border border-transparent",
                ].join(" ")}
              >
                {isPremiumPeriod && (
                  <span className="absolute -top-0.5 -right-0.5 z-10">
                    <Crown size={10} className="text-yellow-400" />
                  </span>
                )}
                {d} Days
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Service filter */}
        <div className="relative group">
          {isMasked && (
            <div className="absolute inset-0 bg-[#f8faf9]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-lg">
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <Crown size={12} className="text-yellow-400" />
                <span className="text-yellow-400 font-bold text-[10px]">Premium</span>
              </div>
            </div>
          )}

          <select
            value={activeServiceFilter}
            onChange={(e) => !isMasked && setActiveServiceFilter(e.target.value)}
            disabled={isMasked}
            className={[
              "appearance-none bg-[#f8faf9] border border-slate-200 hover:border-[#1EA88A]/50 rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1EA88A]/50 transition-all min-w-[140px] relative",
              isMasked
                ? "cursor-not-allowed text-gray-300 opacity-50 pointer-events-none"
                : "cursor-pointer text-gray-300",
            ].join(" ")}
          >
            {(availableServices?.length ? availableServices : ["All"]).map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>

          <Filter
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Toggle */}
        <button
          onClick={() => setShowTreeMap((p) => !p)}
          className={[
            "p-2 rounded-lg transition-all border",
            showTreeMap
              ? "bg-[#1EA88A] text-white border-[#1EA88A]"
              : "bg-white/95 hover:bg-black/60 text-gray-400 hover:text-gray-200 border-slate-200",
          ].join(" ")}
          title="Toggle View"
        >
          {showTreeMap ? <List size={14} /> : <LayoutGrid size={14} />}
        </button>
      </div>
    </div>
  );
}
