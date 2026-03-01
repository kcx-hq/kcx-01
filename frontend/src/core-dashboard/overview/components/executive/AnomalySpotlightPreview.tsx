import React from "react";
import { AlertTriangle } from "lucide-react";
import { OverviewAnomaly } from "../../types";
import {
  anomalySeverityClass,
  formatUSD,
  toAnomalySeverity,
  toSafeNumber,
} from "./formatters";

interface AnomalySpotlightPreviewProps {
  anomalies: OverviewAnomaly[];
}

const AnomalySpotlightPreview = ({ anomalies }: AnomalySpotlightPreviewProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-700">
        <AlertTriangle size={14} className="text-rose-600" />
        Anomaly Spotlight
      </h3>
      <p className="text-xs text-slate-500">Most impactful anomalies requiring attention (Top 3)</p>
    </div>

    <div className="space-y-2">
      {anomalies.length > 0 ? (
        (() => {
          const totalImpact = anomalies.reduce(
            (sum, item) =>
              sum + toSafeNumber(item?.impactToDate ?? item?.impactPerDay ?? item?.cost),
            0
          );
          return anomalies.map((anomaly: OverviewAnomaly, idx: number) => {
            const impactToDate = toSafeNumber(anomaly?.impactToDate ?? anomaly?.impactPerDay ?? anomaly?.cost);
            const severity = toAnomalySeverity(anomaly);
            const sourceLabel = [anomaly?.providerName, anomaly?.regionName].filter(Boolean).join(" | ");
            return (
              <div key={`${anomaly?.id}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-semibold text-slate-700">
                    {anomaly?.title || `${anomaly?.serviceName || "Service"} spend anomaly`}
                  </p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${anomalySeverityClass(
                      severity
                    )}`}
                  >
                    {severity}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-bold text-rose-700">
                    Impact: {formatUSD(impactToDate)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">
                    {totalImpact > 0 ? `${((impactToDate / totalImpact) * 100).toFixed(1)}% of anomaly impact` : "-"}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600">
                    {anomaly?.timeWindowLabel ||
                      (anomaly?.firstDetectedDate
                        ? `Since ${anomaly.firstDetectedDate}`
                        : "Current detection window")}
                  </span>
                </div>
                <p className="mt-2 line-clamp-1 text-xs text-slate-600">
                  <strong className="text-slate-700">Likely cause:</strong>{" "}
                  {anomaly?.suspectedCause || "Usage spike above expected baseline"}
                </p>
                <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
                  {anomaly?.serviceName || "Unknown Service"}
                  {sourceLabel ? ` | ${sourceLabel}` : ""}
                </p>
              </div>
            );
          });
        })()
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          No active anomalies for this filter set.
        </p>
      )}
    </div>
  </article>
);

export default AnomalySpotlightPreview;

