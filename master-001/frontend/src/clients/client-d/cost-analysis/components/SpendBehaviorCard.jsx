import React, { useCallback } from "react";
import { BarChart3, Activity, Crown } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { COLOR_PALETTE } from "../utils/constants.js";
import { formatCurrency, formatDate } from "../utils/format.js";

const SpendBehaviorCard = ({
  isLocked,
  chartType,
  setChartType,
  chartData,
  activeKeys,
  hiddenSeries,
}) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f0f11]/90 backdrop-blur-xl border border-white/10 p-3 rounded-lg shadow-2xl">
          <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
            {formatDate(label)}
          </p>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-300 font-medium">{entry.name}:</span>
              <span className="text-white font-mono font-bold ml-auto pl-4">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleChartType = useCallback(
    (t) => {
      const isPremiumChart = isLocked && (t === "bar" || t === "line");
      if (isPremiumChart) return;
      setChartType(t);
    },
    [isLocked, setChartType]
  );

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-sm text-gray-300">Spend Behavior</h2>

        <div className="flex gap-1 bg-[#0f0f11] p-1 rounded-lg border border-white/5">
          {["area", "bar", "line"].map((t) => {
            const isPremiumChart = isLocked && (t === "bar" || t === "line");
            return (
              <div key={t} className="relative">
                {isPremiumChart && (
                  <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-md">
                    <Crown size={10} className="text-yellow-400" />
                  </div>
                )}
                <button
                  onClick={() => handleChartType(t)}
                  disabled={isPremiumChart}
                  className={`p-1.5 rounded-md transition-all relative ${
                    isPremiumChart ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                  } ${chartType === t ? "bg-[#a02ff1] text-white shadow" : "text-gray-500 hover:text-white"}`}
                >
                  <BarChart3 size={14} className={t === "line" ? "rotate-90" : ""} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {chartData && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={chartData}>
              <defs>
                {activeKeys.map((k, i) => (
                  <linearGradient key={k} id={`color${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLOR_PALETTE[i % COLOR_PALETTE.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLOR_PALETTE[i % COLOR_PALETTE.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
              <XAxis
                dataKey="date"
                stroke="#555"
                tickFormatter={(str) => (str ? str.slice(5) : "")}
                fontSize={10}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke="#555"
                fontSize={10}
                tickFormatter={(val) => `$${val}`}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              {activeKeys.map(
                (k, i) =>
                  !hiddenSeries.has(k) && (
                    <Area
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stackId="1"
                      stroke={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                      fill={`url(#color${i})`}
                      strokeWidth={2}
                    />
                  )
              )}
            </AreaChart>
          ) : chartType === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
              <XAxis
                dataKey="date"
                stroke="#555"
                tickFormatter={(str) => (str ? str.slice(5) : "")}
                fontSize={10}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke="#555"
                fontSize={10}
                tickFormatter={(val) => `$${val}`}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              {activeKeys.map(
                (k, i) =>
                  !hiddenSeries.has(k) && (
                    <Bar
                      key={k}
                      dataKey={k}
                      stackId="a"
                      fill={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                      radius={[2, 2, 0, 0]}
                    />
                  )
              )}
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
              <XAxis
                dataKey="date"
                stroke="#555"
                tickFormatter={(str) => (str ? str.slice(5) : "")}
                fontSize={10}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke="#555"
                fontSize={10}
                tickFormatter={(val) => `$${val}`}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              {activeKeys.map(
                (k, i) =>
                  !hiddenSeries.has(k) && (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  )
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
          <Activity size={32} className="opacity-20" />
          <span className="text-xs uppercase tracking-widest">No Data Available</span>
        </div>
      )}
    </>
  );
};

export default SpendBehaviorCard;
