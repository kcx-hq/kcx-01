import React from 'react';
import {
  TrendingUp,
  Filter,
  Activity,
  AlertTriangle,
  BarChart2,
  LayoutGrid,
  List,
  PlusCircle,
  ArrowDownRight,
  Trash2,
  Loader2,
  Crown,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ResponsiveContainer, Treemap } from 'recharts';

import { formatCurrency, formatDate } from './utils/format';
import { PERIOD_OPTIONS } from './utils/constants';
import { DriversList } from './components/DriversList';
import { VarianceBridge } from './components/VarianceBridge';
import { DriverDetailsDrawer } from './components/DriverDetailsDrawer';
import { SectionLoading } from '../common/SectionStates.jsx';

export function CostDriversView({
  api,
  caps,
  isMasked,
  period,
  setPeriod,
  activeServiceFilter,
  setActiveServiceFilter,
  showTreeMap,
  setShowTreeMap,
  selectedDriver,
  setSelectedDriver,
  onSelectDriver,
  onBack,
  sortListBy,
  loading,
  isRefreshing,
  errorMessage,
  increases,
  decreases,
  filteredIncreases,
  filteredDecreases,
  overallStats,
  dynamics,
  periods,
  availableServices,
  details,
}) {
  if (!api || !caps || !caps.modules?.costDrivers?.enabled) return null;

  if (loading) {
    return <SectionLoading label="Analyzing Cost Drivers..." />;
  }

  const hasNoDrivers = !errorMessage && increases.length === 0 && decreases.length === 0;

  return (
    <div className="core-shell">
      <AnimatePresence mode="wait">
        {!selectedDriver ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <h1 className="flex items-center gap-2 text-xl font-bold">
                  <TrendingUp className="text-[var(--brand-primary)]" size={20} /> Cost Drivers
                </h1>
                {periods?.prev && periods?.current && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Comparing <strong>{formatDate(periods.prev)}</strong> to <strong>{formatDate(periods.current)}</strong>
                  </p>
                )}
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-[var(--border-light)] bg-white p-2 md:w-auto">
                <div className="flex gap-0.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-soft)] p-0.5">
                  {PERIOD_OPTIONS.map((d) => {
                    const isPremiumPeriod = isMasked && d === 7;
                    const isActive = period === d;

                    return (
                      <button
                        key={d}
                        onClick={() => !isPremiumPeriod && setPeriod(d)}
                        disabled={isPremiumPeriod}
                        className={[
                          'relative rounded-md px-2.5 py-1 text-[10px] font-bold transition-all',
                          isPremiumPeriod ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                          isActive
                            ? 'bg-[var(--brand-primary)] text-white shadow-[0_8px_20px_rgba(0,119,88,0.28)]'
                            : 'border border-transparent bg-white text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]',
                        ].join(' ')}
                      >
                        {isPremiumPeriod && (
                          <span className="absolute -right-0.5 -top-0.5 z-10">
                            <Crown size={10} className="text-amber-500" />
                          </span>
                        )}
                        {d} Days
                      </button>
                    );
                  })}
                </div>

                <div className="h-4 w-px bg-[var(--border-light)]" />

                <div className="relative group">
                  {isMasked && (
                    <div className="absolute inset-0 z-50 flex pointer-events-auto items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
                      <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-100 px-2 py-1">
                        <Crown size={12} className="text-amber-600" />
                        <span className="text-[10px] font-bold text-amber-700">Premium</span>
                      </div>
                    </div>
                  )}

                  <select
                    value={activeServiceFilter}
                    onChange={(e) => !isMasked && setActiveServiceFilter(e.target.value)}
                    disabled={isMasked}
                    className={[
                      'relative z-40 min-w-[120px] appearance-none rounded-lg border border-[var(--border-light)] bg-white py-2 pl-3 pr-8 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40 hover:border-emerald-200',
                      isMasked
                        ? 'pointer-events-none cursor-not-allowed text-[var(--text-muted)] opacity-50'
                        : 'cursor-pointer text-[var(--text-secondary)]',
                    ].join(' ')}
                  >
                    {(availableServices?.length ? availableServices : ['All']).map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>

                  <Filter
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 z-40 -translate-y-1/2 text-[var(--text-muted)]"
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              {isRefreshing && (
                <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-white/55 backdrop-blur-[1px]">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 shadow-sm">
                    <Loader2 className="animate-spin text-[var(--brand-primary)]" size={14} />
                    <span className="text-xs font-semibold text-[var(--brand-primary)]">Updating...</span>
                  </div>
                </div>
              )}

              <div className={isRefreshing ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'}>
                {errorMessage && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-700">{errorMessage}</p>
                      {String(errorMessage).includes('No billing data') && (
                        <p className="mt-2 text-xs text-amber-700/80">
                          Go to the Upload page to add your billing files.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="flex flex-col items-center gap-6 rounded-xl border border-[var(--border-light)] bg-white p-4 shadow-sm sm:flex-row lg:col-span-2">
                    <div className="min-w-[180px] flex-1">
                      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-[var(--text-muted)]">
                        <Activity size={14} className="text-[var(--brand-primary)]" /> Net Variance
                      </h3>

                      <div className="flex items-baseline gap-2">
                        <span
                          className={[
                            'font-mono text-3xl font-bold',
                            overallStats?.diff > 0 ? 'text-amber-700' : 'text-[var(--brand-primary)]',
                          ].join(' ')}
                        >
                          {overallStats?.diff > 0 ? '+' : ''}
                          {formatCurrency(overallStats?.diff)}
                        </span>

                        <span
                          className={[
                            'rounded px-1.5 py-0.5 text-xs font-bold',
                            overallStats?.diff > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-[var(--brand-primary)]',
                          ].join(' ')}
                        >
                          {overallStats?.pct ? `${overallStats.pct.toFixed(1)}%` : '0%'}
                        </span>
                      </div>
                    </div>

                    <div className="hidden h-24 w-px bg-[var(--border-light)] sm:block" />

                    <div className="w-full flex-[2]">
                      <VarianceBridge overallStats={overallStats} />
                    </div>
                  </div>

                  <div className="relative rounded-xl border border-[var(--border-light)] bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--text-muted)]">
                        {showTreeMap ? <LayoutGrid size={12} /> : <BarChart2 size={12} />}
                        {showTreeMap ? 'Cost Map' : 'Dynamics'}
                      </h3>

                      <button
                        onClick={() => setShowTreeMap((p) => !p)}
                        className={[
                          'rounded-lg p-1.5 transition-all',
                          showTreeMap
                            ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-[0_8px_20px_rgba(0,119,88,0.28)]'
                            : 'border border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-emerald-50 hover:text-[var(--brand-primary)]',
                        ].join(' ')}
                        title="Toggle View"
                      >
                        {showTreeMap ? <List size={14} /> : <LayoutGrid size={14} />}
                      </button>
                    </div>

                    {showTreeMap ? (
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <Treemap
                            data={[...increases.slice(0, 10), ...decreases.slice(0, 10)].map((item) => ({
                              name: item.name,
                              value: Math.abs(item.diff),
                              fill: item.diff > 0 ? '#f59e0b' : '#007758',
                            }))}
                            dataKey="value"
                            stroke="#eef1ef"
                            fill="#007758"
                            contentStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                          />
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-2">
                          <div className="mb-1 flex items-center gap-1.5 text-sky-700">
                            <PlusCircle size={10} />
                            <span className="text-[9px] font-bold uppercase">New</span>
                          </div>
                          <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
                            {formatCurrency(dynamics?.newSpend)}
                          </span>
                        </div>

                        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-2">
                          <div className="mb-1 flex items-center gap-1.5 text-amber-700">
                            <TrendingUp size={10} />
                            <span className="text-[9px] font-bold uppercase">Growth</span>
                          </div>
                          <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
                            {formatCurrency(dynamics?.expansion)}
                          </span>
                        </div>

                        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-2">
                          <div className="mb-1 flex items-center gap-1.5 text-[var(--brand-primary)]">
                            <ArrowDownRight size={10} />
                            <span className="text-[9px] font-bold uppercase">Saved</span>
                          </div>
                          <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
                            {formatCurrency(dynamics?.optimization)}
                          </span>
                        </div>

                        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-2">
                          <div className="mb-1 flex items-center gap-1.5 text-[var(--text-muted)]">
                            <Trash2 size={10} />
                            <span className="text-[9px] font-bold uppercase">Gone</span>
                          </div>
                          <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
                            {formatCurrency(dynamics?.deleted)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative mt-4">
                  {hasNoDrivers ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-light)] bg-white py-20">
                      <TrendingUp className="mb-4 text-[var(--text-muted)]" size={48} />
                      <p className="mb-2 text-lg font-medium text-[var(--text-secondary)]">No Cost Changes Detected</p>
                      <p className="max-w-md text-center text-sm text-[var(--text-muted)]">
                        Try adjusting the time period, filters, or minimum change threshold to see cost drivers.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <DriversList
                        title="Top Increases"
                        items={filteredIncreases}
                        type="inc"
                        onSelect={onSelectDriver}
                        sortBy={sortListBy}
                      />
                      <DriversList
                        title="Top Savings"
                        items={filteredDecreases}
                        type="dec"
                        onSelect={onSelectDriver}
                        sortBy={sortListBy}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <DriverDetailsDrawer
            key="details"
            driver={selectedDriver}
            period={period}
            onBack={onBack || (() => setSelectedDriver(null))}
            isMasked={isMasked}
            isSavingsDriver={selectedDriver?._driverType === 'dec'}
            loadingDetails={details?.loading}
            stats={details?.stats}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
