import React from "react";
import { FileText, Calendar, TrendingUp, Layers, MapPin } from "lucide-react";

import LoadingState from "../../../core-dashboard/reports/components/LoadingState";
import { formatCurrency } from "../../../core-dashboard/accounts-ownership/utils/format";
import Panel from "./components/Panel";
import MiniStat from "./components/MiniStat";
import BarRow from "./components/BarRow";
import SplitBar from "./components/SplitBar";
import type { ReportMetricItem, ReportsViewProps } from "./types";


const ReportsView = ({ fetchingData, isLocked, reportData }: ReportsViewProps) => {
  if (fetchingData) return <LoadingState />;

  const data = reportData || {};
  const daily = Array.isArray(data?.dailyData) ? data.dailyData : [];
  const topServices = Array.isArray(data?.topServices) ? data.topServices : [];
  const topRegions = Array.isArray(data?.topRegions) ? data.topRegions : [];

  let peak = null;
  if (daily.length) {
    peak = daily[0];
    for (const d of daily) {
      if ((d?.cost ?? 0) > (peak?.cost ?? 0)) peak = d;
    }
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#0f0f11] text-white font-sans animate-in fade-in duration-500">
      {/* HERO */}
      <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-[#171820] to-[#0f0f11] shadow-[0_0_80px_rgba(0,0,0,0.55)] overflow-hidden">
        <div className="p-6 md:p-7 border-b border-white/10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold flex items-center gap-2">
                <FileText className="text-[#007758]" size={22} />
                Reports Summary
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Client-D report board (no downloads)
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-xs text-gray-300 font-semibold">
                {data?.billingPeriod || "Current Period"}
              </span>
            </div>
          </div>

          {/* KPIs */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
            <MiniStat
              label="Total Spend"
              value={formatCurrency(data?.totalSpend || 0)}
              icon={TrendingUp}
            />
            <MiniStat
              label="Forecast"
              value={formatCurrency(data?.forecast || 0)}
              icon={Layers}
            />
            <MiniStat
              label="Avg / Day"
              value={formatCurrency(data?.avgDailySpend || 0)}
              icon={TrendingUp}
            />
            <MiniStat
              label="Top Region"
              value={data?.topRegion?.name || "—"}
              icon={MapPin}
            />
          </div>

          {/* SPLITS */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <SplitBar
              leftLabel={`Tagged (${formatCurrency(data?.taggedCost || 0)})`}
              leftPct={data?.taggedPercent}
              rightLabel={`Untagged (${formatCurrency(data?.untaggedCost || 0)})`}
              rightPct={data?.untaggedPercent}
            />
            <SplitBar
              leftLabel={`Prod (${formatCurrency(data?.prodCost || 0)})`}
              leftPct={data?.prodPercent}
              rightLabel={`Non-Prod (${formatCurrency(data?.nonProdCost || 0)})`}
              rightPct={data?.nonProdPercent}
            />
            <div className="rounded-2xl border border-white/10 bg-[#121319] p-4 shadow-2xl">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Peak Day
              </div>
              <div className="mt-2 text-sm text-gray-300">
                Date:{" "}
                <span className="text-white font-semibold">{peak?.date || "—"}</span>
              </div>
              <div className="mt-1 text-sm text-gray-300">
                Cost:{" "}
                <span className="text-white font-semibold">{formatCurrency(peak?.cost || 0)}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Derived from dailyData (highest cost day).
              </div>

              <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  Access
                </div>
                <div className="text-sm mt-1 font-semibold">
                  {isLocked ? (
                    <span className="text-yellow-300">Limited (Premium locked)</span>
                  ) : (
                    <span className="text-emerald-300">Full access</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TOP HIGHLIGHTS */}
        <div className="p-6 md:p-7 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Top Services">
            <div className="space-y-3">
              {topServices.slice(0, 8).map((s: ReportMetricItem) => (
                <BarRow key={s.name} name={s.name} value={s.value} percentage={s.percentage} />
              ))}
              {!topServices.length && (
                <div className="text-sm text-gray-500">No service data available.</div>
              )}
            </div>
          </Panel>

          <Panel title="Top Regions">
            <div className="space-y-3">
              {topRegions.slice(0, 8).map((r: ReportMetricItem) => (
                <BarRow key={r.name} name={r.name} value={r.value} percentage={r.percentage} />
              ))}
              {!topRegions.length && (
                <div className="text-sm text-gray-500">No region data available.</div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      
    </div>
  );
};

export default ReportsView;
