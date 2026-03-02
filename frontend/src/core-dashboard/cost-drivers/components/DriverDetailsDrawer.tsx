import React from "react";
import type { MouseEvent } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Globe,
  LayoutGrid,
  Loader2,
  Server,
  Tag,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { formatCurrency } from "../utils/format";
import PremiumGate from "../../common/PremiumGate";
import type { DriverDetailsDrawerProps, DriverDetailRow } from "../types";

export function DriverDetailsDrawer({
  driver,
  onBack,
  isMasked,
  isSavingsDriver,
  loadingDetails,
  stats,
}: DriverDetailsDrawerProps) {
  if (!driver) return null;

  const content = (
    <>
      {loadingDetails && (
        <div className="absolute right-3 top-3 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-white/95 px-3 py-1.5 backdrop-blur-sm">
          <Loader2 className="animate-spin text-[var(--brand-primary)]" size={14} />
          <span className="text-xs font-medium text-[var(--brand-primary)]">
            Loading details...
          </span>
        </div>
      )}

      <div className="flex items-start justify-between border-b border-[var(--border-light)] bg-[var(--bg-surface)] p-4 md:p-5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 truncate text-lg font-bold text-[var(--text-primary)] md:text-xl">
            <Server size={20} className="text-[var(--brand-primary)]" />
            {driver.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                driver.diff > 0
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-[var(--brand-primary)]"
              }`}
            >
              {driver.diff > 0 ? "Cost Increased" : "Cost Savings"}
            </span>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              ID: {driver.id}
            </span>
          </div>
        </div>

        <button
          onClick={onBack}
          className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-white hover:text-[var(--text-primary)]"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-3">
            <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
              Total Cost
            </span>
            <div className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)]">
              {formatCurrency(driver.curr)}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-3">
            <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
              Net Change
            </span>
            <div
              className={`mt-1 font-mono text-2xl font-bold ${
                driver.diff > 0 ? "text-amber-700" : "text-[var(--brand-primary)]"
              }`}
            >
              {driver.diff > 0 ? "+" : ""}
              {formatCurrency(driver.diff)}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-light)] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--text-secondary)]">
              <Activity size={14} className="text-[var(--brand-primary)]" /> Daily Trend
            </h3>
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
              <span className="text-[9px] text-[var(--text-muted)]">Last 30 Days</span>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.trendData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e8e5" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#8a9a94"
                  fontSize={10}
                  tickFormatter={(str: string) => str?.slice?.(5) ?? str}
                  minTickGap={30}
                />
                <YAxis stroke="#8a9a94" fontSize={10} tickFormatter={(val: number) => `$${val}`} width={40} />
                <RechartsTooltip
                  cursor={{ fill: "rgba(35,162,130,0.08)" }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderColor: "#dde3e0",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#1c2321",
                  }}
                />
                <Bar dataKey="val" fill="#23a282" radius={[4, 4, 0, 0]} name="Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--text-secondary)]">
            <LayoutGrid size={14} className="text-[var(--brand-primary)]" /> Breakdown
            Analysis
          </h3>

          <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[420px] w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface)] text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-2 font-medium">Operation / Resource</th>
                    <th className="px-4 py-2 text-right font-medium">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-muted)]">
                  {stats?.subDrivers?.length ? (
                    stats.subDrivers.map((sub: DriverDetailRow, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{sub.name}</td>
                        <td className="px-4 py-3 text-right font-mono text-[var(--text-primary)]">
                          {formatCurrency(sub.value)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-center text-xs text-[var(--text-muted)]"
                      >
                        No breakdown data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--border-muted)] bg-amber-50 px-4 py-2 text-center text-[10px] text-amber-700/80">
              * Detailed operation split requires deeper API analysis.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[var(--text-muted)]">
              <Globe size={12} /> Region
            </div>
            <div className="text-sm text-[var(--text-primary)]">Global / us-east-1</div>
          </div>
          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[var(--text-muted)]">
              <Tag size={12} /> Tagging
            </div>
            <div className="text-sm text-[var(--text-primary)]">Partially Tagged</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onBack}
        className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-2 md:p-4"
      >
        <div
          className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-light)] bg-white shadow-2xl"
          onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          {isMasked && isSavingsDriver ? (
            <PremiumGate variant="full" minHeight="100%">
              {content}
            </PremiumGate>
          ) : (
            content
          )}
        </div>
      </motion.div>
    </>
  );
}



