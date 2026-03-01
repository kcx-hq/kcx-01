import React from "react";
import { TopMoverDriver } from "../../types";
import { confidenceClass, formatUSD, toSafeNumber } from "./formatters";

interface TopMoversPreviewProps {
  movers: TopMoverDriver[];
  confidenceFallback: string;
}

const TopMoversPreview = ({ movers, confidenceFallback }: TopMoversPreviewProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Top Movers</h3>
      <p className="text-xs text-slate-500">Largest spend shifts this period (Top 5)</p>
    </div>
    <div className="space-y-2">
      {movers.length > 0 ? (
        (() => {
          const totalMovement = movers.reduce(
            (sum, item) => sum + Math.abs(toSafeNumber(item?.deltaValue)),
            0
          );
          return movers.map((driver: TopMoverDriver, idx: number) => {
            const isIncrease = driver?.direction === "increase";
            const reason =
              driver?.reasonLabel ||
              (isIncrease ? "Usage or price increase" : "Usage decline or optimization");
            const confidence = driver?.confidence || confidenceFallback;
            const deltaAbs = Math.abs(toSafeNumber(driver?.deltaValue));
            const movementShare = totalMovement > 0 ? (deltaAbs / totalMovement) * 100 : 0;
            return (
              <div key={`${driver?.name}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-700">
                      {driver?.name || "Unknown"}
                    </p>
                    <p className="mt-1 line-clamp-1 text-[11px] text-slate-600">{reason}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold ${isIncrease ? "text-rose-700" : "text-emerald-700"}`}
                    >
                      {isIncrease ? "+" : "-"}
                      {formatUSD(deltaAbs)}
                    </span>
                    <p className="text-[10px] text-slate-500">{isIncrease ? "Increase" : "Decrease"}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${confidenceClass(confidence)}`}
                  >
                    {confidence} confidence
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {movementShare.toFixed(1)}% of mover impact
                  </span>
                </div>
              </div>
            );
          });
        })()
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          No significant movers for the selected filters. Spend is relatively stable.
        </p>
      )}
    </div>
  </article>
);

export default TopMoversPreview;
