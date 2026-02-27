import { formatCurrency } from "../utils/format";
import type { StatsProps } from "../types";

const ActionBar = ({ stats }: StatsProps) => {
  const missingMetaCount = stats?.buckets?.missingMeta?.length || 0;

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-[var(--border-light)] bg-white p-3 md:flex-row md:items-center">
      <div className="flex flex-wrap items-center gap-4 px-1 md:px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Cost at Risk</span>
          <span className="text-lg font-bold text-amber-700">
            {formatCurrency(stats?.costAtRisk || 0)}
          </span>
        </div>

        <div className="h-8 w-px bg-[var(--border-light)]" />

        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Untagged Rows</span>
          <span className="text-lg font-bold text-[var(--text-primary)]">
            {(stats?.buckets?.untagged?.length || 0).toLocaleString()}
          </span>
        </div>

        <div className="h-8 w-px bg-[var(--border-light)]" />

        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Broken Metadata</span>
          <span className="text-lg font-bold text-rose-700">
            {missingMetaCount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;




