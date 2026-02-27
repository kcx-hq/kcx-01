import { Tag } from "lucide-react";
import type { DataQualityComplianceItem, StatsProps } from "../types";

const ComplianceMatrix = ({ stats }: StatsProps) => {
  const compliance = Array.isArray(stats?.compliance) ? stats.compliance : [];

  return (
    <div className="flex-[2] rounded-2xl border border-[var(--border-light)] bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
        <Tag size={14} className="text-[var(--brand-primary)]" /> Tag Compliance Breakdown
      </h3>

      <div className="space-y-3">
        {compliance.length > 0 ? (
          compliance.map((item: DataQualityComplianceItem) => (
            <div key={item.key} className="flex items-center gap-3 text-xs">
              <span className="w-24 truncate text-right font-mono text-[var(--text-muted)]">
                {item.key}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                <div
                  className={`h-full rounded-full ${
                    item.pct > 80 ? "bg-emerald-500" : item.pct > 50 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
              <span className="w-10 text-right font-bold text-[var(--text-primary)]">
                {Number(item.pct).toFixed(0)}%
              </span>
            </div>
          ))
        ) : (
          <div className="py-4 text-center italic text-[var(--text-muted)]">
            No tags found in dataset.
          </div>
        )}
      </div>
    </div>
  );
};

export { ComplianceMatrix };
export default ComplianceMatrix;




