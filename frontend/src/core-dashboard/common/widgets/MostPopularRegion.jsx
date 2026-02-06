import React, { useMemo } from "react";
import { Globe } from "lucide-react";

const BRAND = "#007758"; // brand-secondary
const HIGHLIGHT = "#e5f9f4";

const MostPopularRegion = ({ data, totalSpend = 0, billingPeriod = null }) => {
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const allRegions = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data
      .map(({ name, value }) => ({
        name,
        value,
        percentage: totalSpend > 0 ? (value / totalSpend) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, totalSpend]);

  const getFontSize = (percentage, maxPercentage) => {
    if (percentage === maxPercentage) return "clamp(2.5rem, 6vw, 4rem)";
    if (percentage > maxPercentage * 0.5) return "clamp(1.2rem, 3vw, 1.8rem)";
    if (percentage > maxPercentage * 0.2) return "clamp(0.9rem, 2vw, 1.2rem)";
    if (percentage > maxPercentage * 0.1) return "clamp(0.75rem, 1.5vw, 1rem)";
    return "clamp(0.65rem, 1.2vw, 0.85rem)";
  };

  const periodLabel =
    billingPeriod?.start && billingPeriod?.end
      ? `${new Date(billingPeriod.start).toLocaleDateString()} - ${new Date(
          billingPeriod.end
        ).toLocaleDateString()} • `
      : "Previous month • ";

  // ✅ LIGHT THEME WRAPPER CLASSES
  const wrapperCls =
    "bg-[var(--bg-surface,#ffffff)] border border-gray-200 rounded-2xl p-6 flex flex-col shadow-sm";

  if (allRegions.length === 0) {
    return (
      <div className={wrapperCls}>
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Globe size={16} style={{ color: BRAND }} />
            Most Popular Region by Effective Cost
          </h3>
          <div className="text-[10px] text-gray-500">
            {periodLabel}Use drill down → Provider
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm min-h-[300px]">
          No region data available
        </div>
      </div>
    );
  }

  const maxPercentage = allRegions[0]?.percentage || 0;

  return (
    <div className={wrapperCls}>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Globe size={16} style={{ color: BRAND }} />
          Most Popular Region by Effective Cost
        </h3>

        <div className="text-[10px] text-gray-500">
          {periodLabel}Use drill down → Provider
        </div>
      </div>

      <div className="flex-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 min-h-[300px] content-center p-4">
        {allRegions.map((region, index) => {
          const fontSize = getFontSize(region.percentage, maxPercentage);
          const isTopRegion = index === 0;

          const baseColor = isTopRegion ? "#0f172a" : "rgba(15,23,42,0.65)";

          return (
            <span
              key={index}
              className="transition-colors cursor-default inline-block"
              style={{
                fontSize,
                lineHeight: "1.2",
                fontWeight: isTopRegion ? 700 : 400,
                color: baseColor,
                textShadow: isTopRegion
                  ? "0 0 16px rgba(0,119,88,0.18)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = baseColor;
              }}
              title={`${region.name}: ${formatCurrency(region.value)} (${region.percentage.toFixed(
                1
              )}%)`}
            >
              {region.name}
              {isTopRegion && (
                <span
                  className="ml-2 align-middle text-[10px] font-bold px-2 py-0.5 rounded border"
                  style={{
                    background: HIGHLIGHT,
                    borderColor: BRAND,
                    color: BRAND,
                  }}
                >
                  TOP
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default MostPopularRegion;
