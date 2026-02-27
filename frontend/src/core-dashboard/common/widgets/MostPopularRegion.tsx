import React, { useMemo } from "react";
import { Globe, Map, Sparkles, MoveRight } from "lucide-react";

// KCX Primary Theme Emerald
const BRAND_EMERALD = "#007758";
const BRAND_SOFT = "rgba(0, 119, 88, 0.05)";

interface RegionDatum {
  name: string;
  value: number;
}

interface RegionWithPercentage extends RegionDatum {
  percentage: number;
}

interface BillingPeriod {
  start?: string | Date;
  end?: string | Date;
}

interface MostPopularRegionProps {
  data?: RegionDatum[];
  totalSpend?: number;
  billingPeriod?: BillingPeriod | null;
}

const MostPopularRegion = ({ data, totalSpend = 0, billingPeriod = null }: MostPopularRegionProps) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const allRegions = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data
      .map(({ name, value }: RegionDatum) => ({
        name,
        value,
        percentage: totalSpend > 0 ? (value / totalSpend) * 100 : 0,
      }))
      .sort((a: RegionWithPercentage, b: RegionWithPercentage) => b.value - a.value);
  }, [data, totalSpend]);

  const getTierStyles = (percentage: number, maxPercentage: number): React.CSSProperties => {
    if (percentage === maxPercentage) return { 
        fontSize: "clamp(2rem, 5vw, 3.5rem)", 
        fontWeight: 900, 
        color: "#1e293b",
        opacity: 1
    };
    if (percentage > maxPercentage * 0.5) return { 
        fontSize: "clamp(1.2rem, 3vw, 1.8rem)", 
        fontWeight: 700, 
        color: "#334155",
        opacity: 0.9
    };
    if (percentage > maxPercentage * 0.2) return { 
        fontSize: "clamp(1rem, 2vw, 1.2rem)", 
        fontWeight: 600, 
        color: "#475569",
        opacity: 0.8
    };
    return { 
        fontSize: "clamp(0.75rem, 1.5vw, 0.9rem)", 
        fontWeight: 500, 
        color: "#64748b",
        opacity: 0.6
    };
  };

  const periodLabel = billingPeriod?.start && billingPeriod?.end
    ? `${new Date(billingPeriod.start).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${new Date(billingPeriod.end).toLocaleDateString(undefined, {month:'short', day:'numeric'})}`
    : "Current Billing Cycle";

  const wrapperCls = "bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]";

  if (allRegions.length === 0) {
    return (
      <div className={wrapperCls}>
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-50 rounded-2xl text-[#007758] shadow-sm border border-emerald-100">
                <Globe size={22} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Geographic Cost Distribution</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <div className="p-4 bg-slate-50 rounded-full">
                <Map size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-medium text-sm">No regional spend data identified</p>
        </div>
      </div>
    );
  }

  const maxPercentage = allRegions[0]?.percentage || 0;

  return (
    <div className={wrapperCls}>
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-[#007758] shadow-sm border border-emerald-100">
            <Globe size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              Regional Cost Intensity
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#007758] bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100">
                <Sparkles size={10} /> Active Footprint
              </span>
              <p className="text-slate-400 text-[11px] font-medium truncate max-w-[200px]">
                {periodLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 hidden md:flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</span>
            <MoveRight size={12} className="text-slate-300" />
            <span className="text-[11px] font-bold text-slate-700">Provider Drill-down Available</span>
        </div>
      </div>

      {/* --- REGION CLOUD --- */}
      <div className="flex-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 min-h-[350px] content-center p-6 bg-slate-50/30 rounded-[2.5rem] border border-dashed border-slate-100">
        {allRegions.map((region: RegionWithPercentage, index: number) => {
          const tierStyles = getTierStyles(region.percentage, maxPercentage);
          const isTop = index === 0;

          return (
            <div
              key={index}
              className="relative group transition-all duration-300 transform hover:scale-110"
              title={`${region.name}: ${formatCurrency(region.value)} (${region.percentage.toFixed(1)}%)`}
            >
              <span
                className="cursor-default inline-block leading-tight tracking-tighter transition-all duration-300 hover:text-[#007758]"
                style={tierStyles}
              >
                {region.name}
              </span>
              
              {isTop && (
                <span className="absolute -top-4 -right-8 bg-[#007758] text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-lg shadow-emerald-200 uppercase tracking-widest animate-bounce">
                  Top Region
                </span>
              )}

              {/* Interaction Backdrop Glow */}
              <div className="absolute inset-0 bg-emerald-400/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </div>
          );
        })}
      </div>

      {/* --- FOOTER LEGEND --- */}
      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Primary Market</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Emerging Nodes</span>
            </div>
        </div>
        <div className="text-[11px] font-medium text-slate-400 italic">
            Visual size represents percentage of aggregate cost
        </div>
      </div>
    </div>
  );
};

export default MostPopularRegion;
