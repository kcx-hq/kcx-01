import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Settings2 } from "lucide-react";

const BRAND = "var(--brand-secondary, #007758)";

const CostTrendChart = ({
  data,
  limit = 30,
  onLimitChange,
  billingPeriod = null,
  avgDailySpend = 0,
}) => {
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const getBillingPeriodDays = () => {
    if (!billingPeriod?.start || !billingPeriod?.end) return null;
    const start = new Date(billingPeriod.start);
    const end = new Date(billingPeriod.end);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const billingPeriodDays = getBillingPeriodDays();
  const allDataLength = data?.length || 0;
  const effectiveLimit = Math.min(limit, allDataLength);
  const displayData = data?.slice(-effectiveLimit) || [];

  return (
    <div className="bg-[var(--bg-surface)] border border-gray-200 rounded-2xl p-5 flex flex-col shadow-sm min-h-[300px]">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center h-8">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp size={16} style={{ color: BRAND }} />
          Daily Cost Trend
        </h3>

        {onLimitChange && (
          <div className="flex items-center gap-2">
            <Settings2 size={12} className="text-gray-500" />
            <select
              value={effectiveLimit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="text-[10px] bg-white border border-gray-300 hover:border-[var(--brand-secondary)] rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-secondary)]/20 cursor-pointer"
            >
              {allDataLength >= 7 && <option value={7}>Last 7 days</option>}
              {allDataLength >= 15 && <option value={15}>Last 15 days</option>}
              {allDataLength >= 30 && <option value={30}>Last 30 days</option>}

              {billingPeriodDays &&
                allDataLength >= billingPeriodDays &&
                ![7, 15, 30].includes(billingPeriodDays) && (
                  <option value={billingPeriodDays}>
                    Full Billing Period ({billingPeriodDays} days)
                  </option>
                )}

              {allDataLength > 30 && (
                <option value={allDataLength}>
                  All Data ({allDataLength} days)
                </option>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BRAND} stopOpacity={0.25} />
                <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={10}
              tickFormatter={(str) => str.slice(5)}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              stroke="#6b7280"
              fontSize={10}
              tickFormatter={(val) => `$${val}`}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#111827",
              }}
              itemStyle={{ color: "#111827" }}
              formatter={(value) => [formatCurrency(value), "Cost"]}
              labelFormatter={(label) => `Date: ${label}`}
            />

            <ReferenceLine
              y={avgDailySpend}
              stroke="#9ca3af"
              strokeDasharray="3 3"
              label={{
                value: `Avg daily spend: ${formatCurrency(avgDailySpend)}`,
                position: "right",
                fill: "#6b7280",
                fontSize: 9,
              }}
            />

            <Area
              type="monotone"
              dataKey="cost"
              stroke={BRAND}
              strokeWidth={2}
              fill="url(#colorCost)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CostTrendChart;
