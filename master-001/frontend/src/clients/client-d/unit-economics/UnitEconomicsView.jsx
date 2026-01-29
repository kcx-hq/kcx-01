import React, { useMemo } from "react";
import { Crown, AlertTriangle, TrendingUp, Layers, Search } from "lucide-react";
import PremiumGate from "../../../core-dashboard/common/PremiumGate.jsx";

import { fmtCurrency, fmtNumber, fmtPct, fmtDateShort, driftTone } from "./utils/format.js";

/**
 * Client-D layout:
 * - Hero: KPI tiles + Drift badge
 * - Trend strip: compact mini list (date / unit price / qty / cost)
 * - SKU efficiency: searchable table-like list
 *
 * Premium masking:
 * - Non premium can see totals, but drift details + sku breakdown is gated.
 */
const Tile = ({ label, value, sub }) => (
  <div className="rounded-2xl border border-white/10 bg-[#121319] p-4 shadow-2xl">
    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</div>
    <div className="text-xl font-extrabold text-white mt-1">{value}</div>
    {sub ? <div className="text-xs text-gray-500 mt-1">{sub}</div> : null}
  </div>
);

const Row = ({ left, right }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
    <div className="text-xs text-gray-400">{left}</div>
    <div className="text-xs text-white font-semibold">{right}</div>
  </div>
);

export default function UnitEconomicsView({
  isLocked,
  kpis,
  drift,
  trend,
  skuEfficiency,
  skuSearch,
  setSkuSearch,
}) {
  const driftBadgeClass = useMemo(() => driftTone(drift?.status), [drift?.status]);

  const driftSummary = useMemo(() => {
    if (!drift) return null;
    return {
      baseline: drift?.baselineUnitPrice,
      current: drift?.currentUnitPrice,
      changePct: drift?.changePct,
      threshold: drift?.thresholdPct,
      status: drift?.status,
    };
  }, [drift]);

  const hasDrift = !!kpis?.driftDetected;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#0f0f11] text-white font-sans animate-in fade-in duration-500">
      {/* HERO */}
      <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-[#171820] to-[#0f0f11] shadow-[0_0_80px_rgba(0,0,0,0.55)] overflow-hidden">
        <div className="p-6 md:p-7 border-b border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                <Layers className="text-[#a02ff1]" size={22} />
                Unit Economics
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Track unit price drift and SKU efficiency (cost ÷ quantity).
              </div>

              <div className="mt-4 inline-flex items-center gap-2">
                {hasDrift ? (
                  <span className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold ${driftBadgeClass}`}>
                    <AlertTriangle size={14} className="inline-block mr-1" />
                    Drift: {String(drift?.status || "detected")}
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-extrabold">
                    No Drift Detected
                  </span>
                )}

                <span className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-gray-300">
                  Unit price change: <span className="text-white font-semibold">{fmtPct(kpis?.unitPriceChangePct || 0, 2)}</span>
                </span>
              </div>
            </div>

            {/* Drift details panel (premium) */}
            <div className="w-full lg:max-w-[440px]">
              {isLocked ? (
                <PremiumGate variant="card">
                  <div className="rounded-2xl border border-white/10 bg-[#121319] p-4">
                    <div className="text-xs font-extrabold">Drift Details</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Unlock baseline vs current unit price, thresholds, and actions.
                    </div>
                  </div>
                </PremiumGate>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#121319] p-4 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold">Drift Details</div>
                    <span className={`text-[10px] px-2 py-1 rounded-lg border ${driftBadgeClass}`}>
                      {String(driftSummary?.status || "—")}
                    </span>
                  </div>

                  {!driftSummary ? (
                    <div className="text-xs text-gray-500 mt-2">No drift data available.</div>
                  ) : (
                    <div className="mt-3">
                      <Row left="Baseline unit price" right={fmtNumber(driftSummary.baseline, 6)} />
                      <Row left="Current unit price" right={fmtNumber(driftSummary.current, 6)} />
                      <Row left="Change" right={fmtPct(driftSummary.changePct || 0, 2)} />
                      <Row left="Threshold" right={`${fmtNumber(driftSummary.threshold || 0, 0)}%`} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="p-6 md:p-7 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Tile label="Total Cost" value={fmtCurrency(kpis?.totalCost || 0)} sub="Effective cost" />
          <Tile label="Total Quantity" value={fmtNumber(kpis?.totalQuantity || 0, 2)} sub="Consumption" />
          <Tile label="Avg Unit Price" value={fmtNumber(kpis?.avgUnitPrice || 0, 6)} sub="Cost / quantity" />
          <Tile
            label="Drift Signal"
            value={hasDrift ? "Detected" : "Stable"}
            sub={hasDrift ? "Investigate SKUs below" : "No action needed"}
          />
        </div>
      </div>

      {/* TREND */}
      <div className="rounded-2xl border border-white/10 bg-[#121319] shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-black/20">
          <div className="text-xs font-extrabold tracking-wide text-gray-200 flex items-center gap-2">
            <TrendingUp size={14} className="text-[#a02ff1]" />
            Trend
            <span className="text-[10px] text-gray-500 font-bold">(date / unit price / qty / cost)</span>
          </div>
        </div>

        <div className="p-4 max-h-[260px] overflow-auto space-y-2">
          {trend?.length ? (
            trend.map((t, idx) => (
              <div
                key={`${t?.date || idx}`}
                className="flex items-center justify-between gap-4 px-3 py-2 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="text-xs text-white font-semibold">{fmtDateShort(t?.date)}</div>
                <div className="text-xs text-gray-300 font-mono">
                  unitPrice: <span className="text-white">{fmtNumber(t?.unitPrice || 0, 6)}</span>
                </div>
                <div className="text-xs text-gray-300 font-mono">
                  qty: <span className="text-white">{fmtNumber(t?.quantity || 0, 2)}</span>
                </div>
                <div className="text-xs text-gray-300 font-mono">
                  cost: <span className="text-white">{fmtCurrency(t?.cost || 0)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No trend data available.</div>
          )}
        </div>
      </div>

      {/* SKU EFFICIENCY */}
      <div className="rounded-2xl border border-white/10 bg-[#121319] shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-black/20 flex items-center justify-between gap-3">
          <div className="text-xs font-extrabold tracking-wide text-gray-200">SKU Efficiency</div>

          <div className="relative w-full max-w-[360px]">
            {isLocked ? (
              <PremiumGate variant="inlineBadge">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    value={skuSearch}
                    readOnly
                    placeholder="Search SKU (Premium)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1a1b20] border border-white/10 text-xs text-gray-300"
                  />
                </div>
              </PremiumGate>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  placeholder="Search SKU..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1a1b20] border border-white/10 focus:border-[#a02ff1]/60 outline-none text-xs text-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        {isLocked ? (
          <PremiumGate variant="wrap">
            <SkuTable skuEfficiency={skuEfficiency} />
          </PremiumGate>
        ) : (
          <SkuTable skuEfficiency={skuEfficiency} />
        )}
      </div>
    </div>
  );
}

function SkuTable({ skuEfficiency }) {
  return (
    <div className="p-4 overflow-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-white/10">
          <div className="col-span-4">SKU</div>
          <div className="col-span-2 text-right">Cost</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Effective Unit</div>
          <div className="col-span-1 text-center">Committed</div>
          <div className="col-span-1 text-right">Δ vs List</div>
        </div>

        <div className="space-y-2 mt-3">
          {skuEfficiency?.length ? (
            skuEfficiency.map((s, idx) => {
              const list = Number(s?.listUnitPrice || 0);
              const eff = Number(s?.effectiveUnitPrice || 0);
              const diffPct = list > 0 ? ((eff - list) / list) * 100 : 0;

              return (
                <div
                  key={`${s?.sku || idx}`}
                  className="grid grid-cols-12 gap-2 px-3 py-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="col-span-4 text-xs text-white font-semibold truncate">
                    {s?.sku || "—"}
                  </div>
                  <div className="col-span-2 text-right text-xs text-gray-200 font-mono">
                    {fmtCurrency(s?.cost || 0)}
                  </div>
                  <div className="col-span-2 text-right text-xs text-gray-200 font-mono">
                    {fmtNumber(s?.quantity || 0, 2)}
                  </div>
                  <div className="col-span-2 text-right text-xs text-gray-200 font-mono">
                    {fmtNumber(s?.effectiveUnitPrice || 0, 6)}
                  </div>
                  <div className="col-span-1 text-center">
                    {s?.committed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-gray-300">
                        No
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-right text-xs font-mono">
                    <span className={diffPct > 0 ? "text-red-300" : "text-emerald-300"}>
                      {Number.isFinite(diffPct) ? `${diffPct > 0 ? "+" : ""}${diffPct.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-500">No SKU efficiency data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
