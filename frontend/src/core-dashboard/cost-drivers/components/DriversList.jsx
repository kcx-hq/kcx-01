import React, { memo, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Crown, Filter } from 'lucide-react';
import { useAuthStore } from '../../../store/Authstore';
import { formatCurrency } from '../utils/format';

export const DriversList = memo(function DriversList({
  title,
  items,
  type,
  onSelect,
  sortBy,
}) {
  const { user } = useAuthStore();
  const isMasked = !user?.is_premium;

  const sortedItems = useMemo(() => {
    if (!items?.length) return [];
    return [...items].sort((a, b) => {
      if (sortBy === 'pct') return Math.abs(b.pct) - Math.abs(a.pct);
      return Math.abs(b.diff) - Math.abs(a.diff);
    });
  }, [items, sortBy]);

  const visibleItems = useMemo(() => (isMasked ? sortedItems.slice(0, 5) : sortedItems), [sortedItems, isMasked]);
  const hasMoreItems = isMasked && sortedItems.length > 10;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--text-secondary)]">
          <div className={`h-1.5 w-1.5 rounded-full ${type === 'inc' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          {title} <span className="text-[var(--text-muted)]">({items?.length || 0})</span>
        </h3>
      </div>

      <div className="relative flex h-[380px] flex-col overflow-hidden rounded-xl border border-[var(--border-light)] bg-white md:h-[540px] lg:h-[600px]">
        {visibleItems.length ? (
          <div className="relative h-full divide-y divide-[var(--border-muted)] overflow-y-auto">
            {visibleItems.map((item, index) => (
              <div
                key={`${type}-${item.name || item.id || index}-${index}`}
                onClick={() => onSelect(item, type)}
                className="group flex cursor-pointer items-center justify-between px-3 py-3 transition-colors hover:bg-[var(--bg-surface)]"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className={`rounded-md p-1.5 ${type === 'inc' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-[var(--brand-primary)]'}`}>
                    {type === 'inc' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="max-w-[38vw] truncate text-xs font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--brand-primary)] md:max-w-[180px]">
                        {item.name}
                      </h4>
                      {item.isNew && (
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-1 py-0.5 text-[8px] font-bold text-emerald-700">
                          NEW
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)]">
                        <span>{formatCurrency(item.prev)}</span>
                        <span>-&gt;</span>
                        <span className="text-[var(--text-secondary)]">{formatCurrency(item.curr)}</span>
                      </div>
                      {item.contribution && Math.abs(item.contribution) > 5 && (
                        <span className="rounded border border-[var(--border-light)] bg-[var(--bg-surface)] px-1 text-[8px] font-medium text-[var(--text-secondary)]">
                          Impact: {item.contribution}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="whitespace-nowrap pl-2 text-right">
                  <div className={`font-mono text-xs font-bold ${type === 'inc' ? 'text-amber-700' : 'text-[var(--brand-primary)]'}`}>
                    {type === 'inc' ? '+' : ''}
                    {formatCurrency(item.diff)}
                  </div>
                  <div className="mt-0.5 text-[9px] text-[var(--text-muted)]">
                    {!item.pct || item.pct === Infinity || item.pct > 999 ? '>999%' : `${Math.abs(item.pct).toFixed(1)}%`}
                  </div>
                </div>
              </div>
            ))}

            {hasMoreItems && (
              <div className="relative min-h-[280px]">
                <div className="absolute inset-0 z-50 flex pointer-events-auto items-center justify-center bg-white/80 backdrop-blur-sm">
                  <div className="p-6 text-center">
                    <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-100">
                      <Crown size={32} className="text-amber-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">Premium Feature</h3>
                    <p className="mb-4 max-w-xs text-sm text-[var(--text-muted)]">This feature is available in our paid version</p>
                    <button className="mx-auto flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-100 px-6 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200">
                      <Filter size={16} />
                      Upgrade to Access
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-1 flex-col items-center justify-center text-[var(--text-muted)]">
            <p className="text-xs">No drivers found.</p>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  );
});
