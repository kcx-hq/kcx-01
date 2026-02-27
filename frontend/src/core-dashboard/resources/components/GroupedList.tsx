import React from "react";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "../utils/format";
import PremiumOverlay from "../components/PremiumOverlay";
import type { GroupedListProps, ResourceGroup, ResourceItem } from "../types";

const GroupedListView = ({ groupedData, isPremiumMasked, onRowClick }: GroupedListProps) => {
  return (
    <div className="relative flex min-h-full flex-col">
      {isPremiumMasked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-sm">
          <PremiumOverlay variant="full" />
        </div>
      )}

      {Object.entries(groupedData)
        .sort((a: [string, ResourceGroup], b: [string, ResourceGroup]) => (b[1].total || 0) - (a[1].total || 0))
        .map(([key, grp]: [string, ResourceGroup]) => (
          <div key={key} className="border-b border-[var(--border-muted)]">
            <div className="sticky top-0 z-10 flex cursor-pointer items-center justify-between bg-[var(--bg-surface)] px-4 py-3 md:px-6">
              <div className="flex items-center gap-3">
                <ChevronRight size={14} className="text-[var(--text-muted)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">{key}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                  {grp.items.length} items
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                {formatCurrency(grp.total)}
              </span>
            </div>

            <div className="divide-y divide-[var(--border-muted)] bg-white">
              {(isPremiumMasked ? grp.items.slice(0, 10) : grp.items).map((item: ResourceItem) => (
                <div
                  key={item.id}
                  onClick={() => onRowClick(item)}
                  className="flex cursor-pointer items-center justify-between px-6 py-2 text-xs transition-colors hover:bg-[var(--bg-surface)] md:px-10"
                >
                  <span
                    className="max-w-[55vw] truncate font-mono text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)] md:max-w-[420px]"
                    title={item.id}
                  >
                    {item.id}
                  </span>
                  <span className="w-20 shrink-0 text-right font-mono text-[var(--text-primary)]">
                    {formatCurrency(item.totalCost)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default GroupedListView;



