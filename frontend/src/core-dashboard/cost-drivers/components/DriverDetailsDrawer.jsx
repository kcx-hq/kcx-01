import React from "react";
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

export function DriverDetailsDrawer({
  driver,
  period,
  onBack,
  isMasked,
  isSavingsDriver,
  loadingDetails,
  stats,
}) {
  if (!driver) return null;

  const content = (
    <>
      {loadingDetails && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-[#a02ff1]/20 border border-[#a02ff1]/30 rounded-lg backdrop-blur-sm">
          <Loader2 className="text-[#a02ff1] animate-spin" size={14} />
          <span className="text-[#a02ff1] text-xs font-medium">
            Loading details...
          </span>
        </div>
      )}

      <div className="p-5 border-b border-white/10 flex justify-between items-start bg-[#1a1b20]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server size={20} className="text-[#a02ff1]" />
            {driver.name}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                driver.diff > 0
                  ? "bg-red-500/10 text-red-400"
                  : "bg-green-500/10 text-green-400"
              }`}
            >
              {driver.diff > 0 ? "Cost Increased" : "Cost Savings"}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              ID: {driver.id}
            </span>
          </div>
        </div>

        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-500 uppercase font-bold">
              Total Cost
            </span>
            <div className="text-2xl font-mono font-bold text-white mt-1">
              {formatCurrency(driver.curr)}
            </div>
          </div>
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-500 uppercase font-bold">
              Net Change
            </span>
            <div
              className={`text-2xl font-mono font-bold mt-1 ${
                driver.diff > 0 ? "text-red-400" : "text-green-400"
              }`}
            >
              {driver.diff > 0 ? "+" : ""}
              {formatCurrency(driver.diff)}
            </div>
          </div>
        </div>

        <div className="bg-[#1a1b20] border border-white/10 rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-300 uppercase flex items-center gap-2">
              <Activity size={14} className="text-cyan-400" /> Daily Trend
            </h3>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-[9px] text-gray-500">Last 30 Days</span>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.trendData || []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#333"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#555"
                  fontSize={10}
                  tickFormatter={(str) => str?.slice?.(5) ?? str}
                  minTickGap={30}
                />
                <YAxis
                  stroke="#555"
                  fontSize={10}
                  tickFormatter={(val) => `$${val}`}
                  width={40}
                />
                <RechartsTooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    backgroundColor: "#000",
                    borderColor: "#333",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="val" fill="#a02ff1" radius={[2, 2, 0, 0]} name="Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-300 uppercase flex items-center gap-2">
            <LayoutGrid size={14} className="text-orange-400" /> Breakdown
            Analysis
          </h3>

          <div className="bg-[#1a1b20] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#25262b] text-gray-400">
                <tr>
                  <th className="px-4 py-2 font-medium">
                    Operation / Resource
                  </th>
                  <th className="px-4 py-2 font-medium text-right">
                    Est. Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.subDrivers?.length ? (
                  stats.subDrivers.map((sub, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-gray-300">{sub.name}</td>
                      <td className="px-4 py-3 text-right font-mono text-white">
                        {formatCurrency(sub.value)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-center text-gray-500 text-xs"
                    >
                      No breakdown data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="px-4 py-2 bg-yellow-500/5 text-yellow-500/70 text-[10px] text-center border-t border-white/5">
              * Detailed operation split requires deeper API analysis.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Globe size={12} /> Region
            </div>
            <div className="text-sm text-white">Global / us-east-1</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Tag size={12} /> Tagging
            </div>
            <div className="text-sm text-white">Partially Tagged</div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-[#1a1b20] flex gap-3">
        <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors">
          View Resources
        </button>
        <button className="flex-1 py-2 bg-[#a02ff1] hover:bg-[#8b25d1] rounded-lg text-xs font-bold text-white transition-colors">
          Analyze Root Cause
        </button>
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#15161a] border-l border-white/10 shadow-2xl z-[70] flex flex-col relative"
      >
        {/* ✅ FULLY gate the drawer content */}
        {isMasked && isSavingsDriver ? (
          <PremiumGate variant="full" minHeight="100%">
            {content}
          </PremiumGate>
        ) : (
          content
        )}
      </motion.div>
    </>
  );
}
