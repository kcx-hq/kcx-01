import React, { useMemo } from "react";
import PremiumGate from "../../../core-dashboard/common/PremiumGate.jsx";

import DataQualityStates from "../../../core-dashboard/data-quality/components/DataQualityStates.jsx";
import ScoreCard from "../../../core-dashboard/data-quality/components/ScoreCard.jsx";
import ComplianceMatrix from "../../../core-dashboard/data-quality/components/ComplianceMatrix.jsx";
import ActionBar from "../../../core-dashboard/data-quality/components/ActionBar.jsx";
import Tabs from "../../../core-dashboard/data-quality/components/Tabs.jsx";
import IssuesTable from "../../../core-dashboard/data-quality/components/IssuesTable.jsx";
import PaginationBar from "../../../core-dashboard/data-quality/components/PaginationBar.jsx";
import IssueInspector from "../../../core-dashboard/data-quality/components/IssueInspector.jsx";

import { formatCurrency } from "./utils/formatCurrency.js";

const Panel = ({ title, children, right }) => (
  <div className="rounded-2xl border border-slate-200 bg-[#f3f7f5] shadow-2xl overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-200 bg-emerald-50 flex items-center justify-between">
      <div className="text-xs font-extrabold tracking-wide text-gray-200">{title}</div>
      {right}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const StatChip = ({ label, value, sub }) => (
  <div className="px-3 py-2 rounded-2xl bg-white/5 border border-slate-200">
    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</div>
    <div className="text-sm text-slate-800 font-semibold mt-0.5">{value}</div>
    {sub ? <div className="text-[11px] text-gray-500 mt-1">{sub}</div> : null}
  </div>
);

const DataQualityView = ({
  loading,
  error,
  stats,

  activeTab,
  currentPage,
  totalPages,
  actualTotalPages,
  accessiblePages,
  itemsPerPage,

  selectedIssue,
  setSelectedIssue,

  isLocked,
  isAccessingPremiumPage,
  currentListData,

  onTabChange,
  onRowClick,
  onPrev,
  onNext,
  maxAllowedPage,
}) => {
  if (loading) return <DataQualityStates type="loading" />;
  if (error && !stats) return <DataQualityStates type="empty" />;
  if (!stats) return <DataQualityStates type="empty" />;

  const isPremiumTab =
    activeTab === "untagged" || activeTab === "anomalies" || activeTab === "missingMeta";

  const shouldShowGate =
    isLocked && (isPremiumTab || (isAccessingPremiumPage && activeTab === "overview"));

  const costAtRisk = Number(stats?.costAtRisk ?? 0);

  const chips = useMemo(() => {
    return [
      {
        label: "Quality Score",
        value: `${Number(stats?.score ?? 0)}%`,
        sub: stats?.score === 100 ? "Perfect tagging signal" : "Room to improve",
      },
      { label: "Rows Scanned", value: String(stats?.totalRows ?? 0) },
      {
        label: "Cost At Risk",
        value: formatCurrency(costAtRisk),
        sub: costAtRisk < 0 ? "Credit / adjustment detected" : "Potential leakage",
      },
    ];
  }, [stats?.score, stats?.totalRows, costAtRisk]);

  // Top offenders (service-level)
  const offenders = useMemo(() => {
    const list = Array.isArray(stats?.topOffenders) ? stats.topOffenders : [];
    return list.slice(0, 5);
  }, [stats?.topOffenders]);

  // Tag dimensions: show the "worst" keys by pctPresent ascending
  const worstTagDims = useMemo(() => {
    const dims = stats?.tagDimensions || {};
    const rows = Object.entries(dims).map(([key, v]) => ({
      key,
      pctPresent: Number(v?.pctPresent ?? 0),
      missingCount: Number(v?.missingCount ?? 0),
      missingCost: Number(v?.missingCost ?? 0),
      presentCount: Number(v?.presentCount ?? 0),
    }));

    rows.sort((a, b) => a.pctPresent - b.pctPresent);
    return rows.slice(0, 8);
  }, [stats?.tagDimensions]);

  // Trend: show last datapoint (you only sent one in sample, still works)
  const trend = useMemo(() => {
    const arr = Array.isArray(stats?.trendData) ? stats.trendData : [];
    if (!arr.length) return null;
    const last = arr[arr.length - 1];
    return { date: last?.date, score: Number(last?.score ?? 0) };
  }, [stats?.trendData]);

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen bg-[#f8faf9] text-slate-800 font-sans animate-in fade-in duration-500">
      {/* HERO */}
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-[#eff6f3] to-[#f8faf9] shadow-[0_0_80px_rgba(0,0,0,0.55)] overflow-hidden">
        <div className="p-6 md:p-7 border-b border-slate-200">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
            <div>
              <div className="text-2xl font-extrabold tracking-tight">Data Quality</div>
              <div className="text-sm text-gray-400 mt-1">
                Tagging + metadata diagnostics (Client-D layout)
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {chips.map((c) => (
                  <StatChip key={c.label} label={c.label} value={c.value} sub={c.sub} />
                ))}
              </div>
            </div>

            <div className="w-full xl:max-w-[560px]">
              <Panel title="Quick Actions">
                <ActionBar stats={stats} />
              </Panel>
            </div>
          </div>
        </div>

        {/* SCORE + MATRIX */}
        <div className="p-6 md:p-7">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-1">
              <ScoreCard stats={stats} />
            </div>
            <div className="xl:col-span-2">
              <ComplianceMatrix stats={stats} />
            </div>
          </div>
        </div>
      </div>

      {/* DIAGNOSTICS ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          title="Worst Tag Dimensions"
          right={<span className="text-[11px] text-gray-500">Lowest coverage first</span>}
        >
          <div className="space-y-2">
            {worstTagDims.length === 0 ? (
              <div className="text-sm text-gray-500">No tag dimension stats found.</div>
            ) : (
              worstTagDims.map((t) => (
                <div
                  key={t.key}
                  className="rounded-xl bg-white/5 border border-slate-200 p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{t.key}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Missing: {t.missingCount} • Missing cost: {formatCurrency(t.missingCost)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-extrabold text-slate-800">{t.pctPresent.toFixed(2)}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                      present
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Top Offenders" right={trend ? <span className="text-[11px] text-gray-500">Latest score: {trend.score}%</span> : null}>
          <div className="space-y-2">
            {offenders.length === 0 ? (
              <div className="text-sm text-gray-500">No offenders detected.</div>
            ) : (
              offenders.map((o) => (
                <div
                  key={o.name}
                  className="rounded-xl bg-white/5 border border-slate-200 p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{o.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {o.count} rows • Cost: {formatCurrency(o.cost)}
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400">Service</div>
                </div>
              ))
            )}
          </div>

          {trend?.date ? (
            <div className="mt-4 rounded-xl bg-emerald-50 border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Trend Snapshot
              </div>
              <div className="text-sm text-slate-800 font-semibold mt-1">
                {trend.score}% on {trend.date}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Add more daily points from backend to show a real chart later.
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel title="What To Fix First">
          <div className="space-y-3 text-sm text-gray-300">
            <div className="rounded-xl bg-white/5 border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Priority
              </div>
              <div className="mt-1 font-semibold text-slate-800">
                Standardize tag keys (avoid duplicates like <span className="text-gray-200">org</span> vs{" "}
                <span className="text-gray-200"> org</span>)
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Your dimensions include variants with leading spaces / casing differences.
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Governance
              </div>
              <div className="mt-1 font-semibold text-slate-800">
                Enforce required tags: <span className="text-gray-200">Owner</span>,{" "}
                <span className="text-gray-200">Project</span>,{" "}
                <span className="text-gray-200">CostCenter</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Missing these usually blocks chargeback and accountability.
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* WORKBENCH (table) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 rounded-2xl border border-slate-200 bg-[#ffffff] shadow-2xl overflow-hidden flex flex-col min-h-[560px]">
          <div className="border-b border-slate-200 bg-emerald-50">
            <Tabs stats={stats} activeTab={activeTab} onTabChange={onTabChange} isLocked={isLocked} />
          </div>

          <div className="flex-1 overflow-auto relative">
            {shouldShowGate ? (
              <PremiumGate mode="wrap">
                <IssuesTable
                  rows={currentListData}
                  activeTab={activeTab}
                  isLocked={isLocked}
                  isAccessingPremiumPage={isAccessingPremiumPage}
                  onRowClick={onRowClick}
                />
                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  actualTotalPages={actualTotalPages}
                  accessiblePages={accessiblePages}
                  isLocked={isLocked}
                  maxAllowedPage={maxAllowedPage}
                  onPrev={onPrev}
                  onNext={onNext}
                />
              </PremiumGate>
            ) : (
              <>
                <IssuesTable
                  rows={currentListData}
                  activeTab={activeTab}
                  isLocked={isLocked}
                  isAccessingPremiumPage={isAccessingPremiumPage}
                  onRowClick={onRowClick}
                />
                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  actualTotalPages={actualTotalPages}
                  accessiblePages={accessiblePages}
                  isLocked={isLocked}
                  maxAllowedPage={maxAllowedPage}
                  onPrev={onPrev}
                  onNext={onNext}
                />
              </>
            )}
          </div>
        </div>

        <div className="xl:col-span-1">
          <Panel title="Session">
            <div className="space-y-3">
              <div className="rounded-xl bg-white/5 border border-slate-200 p-3">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  Current Tab
                </div>
                <div className="text-sm font-semibold mt-1 text-slate-800">{activeTab}</div>
                {isPremiumTab && (
                  <div className="text-xs text-gray-400 mt-2">Premium diagnostics tab.</div>
                )}
              </div>

              <div className="rounded-xl bg-white/5 border border-slate-200 p-3">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  Pagination
                </div>
                <div className="text-sm text-slate-800 font-semibold mt-1">
                  Page {currentPage} of {totalPages || 1}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {itemsPerPage} issues per page
                </div>
              </div>

              <div className="rounded-xl bg-white/5 border border-slate-200 p-3">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  Access
                </div>
                <div className="text-sm font-semibold mt-1">
                  {isLocked ? (
                    <span className="text-yellow-300">Limited</span>
                  ) : (
                    <span className="text-emerald-300">Full</span>
                  )}
                </div>
                {isLocked && (
                  <div className="text-xs text-gray-400 mt-2">
                    Upgrade to unlock premium tabs and full pages.
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <IssueInspector selectedIssue={selectedIssue} setSelectedIssue={setSelectedIssue} />
    </div>
  );
};

export default DataQualityView;
