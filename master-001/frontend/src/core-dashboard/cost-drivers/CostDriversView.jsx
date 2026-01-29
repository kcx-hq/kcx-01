// apps/frontend/src/features/costDrivers/views/CostDriversView.jsx
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

/**
 * Pure View component:
 * - No data fetching
 * - No complex business logic
 * - Receives everything from Container via props
 */
export function CostDriversView({
  api,
  caps,
  filters,

  // access/premium
  isMasked,

  // query controls
  period,
  setPeriod,
  activeServiceFilter,
  setActiveServiceFilter,
  showTreeMap,
  setShowTreeMap,

  // selection
  selectedDriver,
  setSelectedDriver,
  onSelectDriver,
  onBack,

  // sorting
  sortListBy,
  setSortListBy,

  // data
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

  // details drawer hook result
  details, // { loading, stats }
}) {
  // Don't render if module not enabled or API not available
  if (!api || !caps || !caps.modules?.costDrivers?.enabled) return null;

  // Loading full page (initial)
  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#a02ff1]" size={32} />
          <span>Analyzing cost drivers...</span>
        </div>
      </div>
    );
  }

  const hasNoDrivers = !errorMessage && increases.length === 0 && decreases.length === 0;

  return (
    <div className="p-4 space-y-4 min-h-screen bg-[#0f0f11] text-white font-sans animate-in fade-in duration-500 relative">
      <AnimatePresence mode="wait">
        {!selectedDriver ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* 1) Header + Filters (STATIC) */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-[#a02ff1]" size={20} /> Cost Drivers
                </h1>

                {periods?.prev && periods?.current && (
                  <p className="text-gray-400 text-xs">
                    Comparing <strong>{formatDate(periods.prev)}</strong> to{' '}
                    <strong>{formatDate(periods.current)}</strong>
                  </p>
                )}
              </div>

              {/* Filter toolbar */}
              <div className="flex flex-wrap items-center gap-2 bg-[#1a1b20] p-1 rounded-xl border border-white/10">
                {/* Period toggle: 7 is premium (masked users cannot use it) */}
                <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5 gap-0.5">
                  {PERIOD_OPTIONS.map((d) => {
                    const isPremiumPeriod = isMasked && d === 7;
                    const isActive = period === d;

                    return (
                      <button
                        key={d}
                        onClick={() => !isPremiumPeriod && setPeriod(d)}
                        disabled={isPremiumPeriod}
                        className={[
                          'relative px-2.5 py-1 text-[10px] font-bold rounded-md transition-all',
                          isPremiumPeriod ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                          isActive
                            ? 'bg-[#a02ff1] text-white shadow-[0_0_10px_rgba(160,47,241,0.5)]'
                            : 'bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10 border border-transparent',
                        ].join(' ')}
                      >
                        {isPremiumPeriod && (
                          <span className="absolute -top-0.5 -right-0.5 z-10">
                            <Crown
                              size={10}
                              className="text-yellow-400 drop-shadow-[0_0_2px_rgba(250,204,21,0.8)]"
                            />
                          </span>
                        )}
                        {d} Days
                      </button>
                    );
                  })}
                </div>

                <div className="h-4 w-px bg-white/10" />

                {/* Service Filter (masked for non-premium) */}
                <div className="relative group">
                  {isMasked && (
                    <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-lg">
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
                      'appearance-none bg-[#0f0f11] border border-white/10 hover:border-[#a02ff1]/50 rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#a02ff1]/50 transition-all min-w-[120px] z-40 relative',
                      isMasked
                        ? 'cursor-not-allowed text-gray-300 opacity-50 pointer-events-none'
                        : 'cursor-pointer text-gray-300',
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-40"
                  />
                </div>
              </div>
            </div>

            {/* Error / Info message */}
            {errorMessage && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-yellow-400 font-medium text-sm">{errorMessage}</p>
                  {String(errorMessage).includes('No billing data') && (
                    <p className="text-yellow-300/70 text-xs mt-2">
                      Go to the Upload page to add your billing files.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 2) Content Area (refreshing overlay only) */}
            <div className="relative">
              {isRefreshing && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-[#a02ff1]/20 border border-[#a02ff1]/30 rounded-lg backdrop-blur-sm">
                  <Loader2 className="text-[#a02ff1] animate-spin" size={14} />
                  <span className="text-[#a02ff1] text-xs font-medium">Updating...</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Waterfall Bridge */}
                <div className="lg:col-span-2 bg-[#1a1b20] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-6 items-center shadow-lg">
                  <div className="flex-1 min-w-[180px]">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                      <Activity size={14} className="text-[#a02ff1]" /> Net Variance
                    </h3>

                    <div className="flex items-baseline gap-2">
                      <span
                        className={[
                          'text-3xl font-mono font-bold',
                          overallStats?.diff > 0 ? 'text-red-400' : 'text-green-400',
                        ].join(' ')}
                      >
                        {overallStats?.diff > 0 ? '+' : ''}
                        {formatCurrency(overallStats?.diff)}
                      </span>

                      <span
                        className={[
                          'text-xs font-bold px-1.5 py-0.5 rounded',
                          overallStats?.diff > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400',
                        ].join(' ')}
                      >
                        {overallStats?.pct ? `${overallStats.pct.toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  </div>

                  <div className="w-px h-24 bg-white/10 hidden sm:block" />

                  <div className="flex-[2] w-full">
                    <VarianceBridge overallStats={overallStats} />
                  </div>
                </div>

                {/* Dynamics / Tree Map */}
                <div className="bg-[#1a1b20] border border-white/10 rounded-xl p-4 relative shadow-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                      {showTreeMap ? <LayoutGrid size={12} /> : <BarChart2 size={12} />}
                      {showTreeMap ? 'Cost Map' : 'Dynamics'}
                    </h3>

                    <button
                      onClick={() => setShowTreeMap((p) => !p)}
                      className={[
                        'p-1.5 rounded-lg transition-all',
                        showTreeMap
                          ? 'bg-[#a02ff1] text-white border border-[#a02ff1] shadow-[0_0_8px_rgba(160,47,241,0.4)]'
                          : 'bg-black/40 hover:bg-black/60 text-gray-400 hover:text-gray-200 border border-white/10',
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
                            fill: item.diff > 0 ? '#ef4444' : '#10b981',
                          }))}
                          dataKey="value"
                          stroke="#1a1b20"
                          fill="#8884d8"
                          contentStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        />
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                          <PlusCircle size={10} />
                          <span className="text-[9px] font-bold uppercase">New</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-white">
                          {formatCurrency(dynamics?.newSpend)}
                        </span>
                      </div>

                      <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-1.5 text-red-400 mb-1">
                          <TrendingUp size={10} />
                          <span className="text-[9px] font-bold uppercase">Growth</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-white">
                          {formatCurrency(dynamics?.expansion)}
                        </span>
                      </div>

                      <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-1.5 text-green-400 mb-1">
                          <ArrowDownRight size={10} />
                          <span className="text-[9px] font-bold uppercase">Saved</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-white">
                          {formatCurrency(dynamics?.optimization)}
                        </span>
                      </div>

                      <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                          <Trash2 size={10} />
                          <span className="text-[9px] font-bold uppercase">Gone</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-white">
                          {formatCurrency(dynamics?.deleted)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3) Lists */}
            <div className="relative">
              {hasNoDrivers ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#1a1b20] border border-white/10 rounded-xl">
                  <TrendingUp className="text-gray-500 mb-4" size={48} />
                  <p className="text-gray-400 text-lg font-medium mb-2">No Cost Changes Detected</p>
                  <p className="text-gray-500 text-sm text-center max-w-md">
                    Try adjusting the time period, filters, or minimum change threshold to see cost drivers.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Sort controls (optional future UI)
                If you want UI buttons for sortBy, add them here and call setSortListBy('pct'|'diff')
            */}
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
