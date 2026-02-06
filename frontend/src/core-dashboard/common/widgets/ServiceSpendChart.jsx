import React from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PieChart, Settings2 } from "lucide-react";

// ✅ theme only (mint/green brand palette)
const COLORS = [
  "#00c592", // brand-primary
  "#007758", // brand-secondary
  "#c8e635", // accent-lime
  "#ffd24d", // accent-yellow
  "#1cc8ee", // accent-cyan
];

const BRAND = "#00c592";

const ServiceSpendChart = ({
  data,
  title,
  limit = 8,
  onLimitChange,
  totalSpend = 0,
}) => {
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const validData = Array.isArray(data)
    ? data.filter((item) => item && item.name && typeof item.value === "number")
    : [];

  const chartHeight = Math.max(400, validData.length * 35 + 100);

  const truncateName = (name, maxLength = 22) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + "...";
  };

  return (
    <div
      className="bg-[var(--bg-surface)] border border-gray-200 rounded-2xl p-5 flex flex-col shadow-sm"
      style={{ minHeight: `${chartHeight}px` }}
    >
      {/* Header */}
      <div className="mb-4 flex justify-between items-center gap-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <PieChart size={16} style={{ color: BRAND }} />
          {title || "Spend by Service"}
        </h3>

        {onLimitChange && (
          <div className="flex items-center gap-2">
            <Settings2 size={12} className="text-gray-500" />
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="text-[10px] bg-white border border-gray-300 hover:border-[rgba(0,197,146,0.55)] rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[rgba(0,197,146,0.18)] cursor-pointer"
            >
              <option value={5}>Top 5</option>
              <option value={8}>Top 8</option>
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
            </select>
          </div>
        )}
      </div>

      <div
        className="flex-1 w-full min-h-0"
        style={{ height: `${chartHeight - 80}px` }}
      >
        {validData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={validData}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                horizontal={false}
              />

              <XAxis
                type="number"
                stroke="#6b7280"
                fontSize={11}
                tickFormatter={(val) => {
                  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
                  return `$${val}`;
                }}
                axisLine={false}
                tickLine={false}
                domain={[0, "dataMax"]}
              />

              <YAxis
                dataKey="name"
                type="category"
                width={150}
                stroke="#6b7280"
                fontSize={10}
                tick={{ fill: "#374151" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => truncateName(value, 22)}
              />

              <Tooltip
                cursor={{ fill: "rgba(17,24,39,0.04)", radius: 4 }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "#111827",
                  padding: "10px 12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                }}
                itemStyle={{ color: "#111827" }}
                formatter={(value, name, props) => {
                  const percentage =
                    totalSpend > 0 ? ((value / totalSpend) * 100).toFixed(1) : 0;

                  return [
                    <div key="tooltip">
                      <div style={{ color: "#111827" }}>
                        Cost: {formatCurrency(value)}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 11, color: "#6b7280" }}>
                        Share of total: {percentage}%
                      </div>
                    </div>,
                    props.payload.name,
                  ];
                }}
                labelFormatter={(label) => label}
              />

              <Bar
                dataKey="value"
                radius={[0, 6, 6, 0]}
                barSize={30}
                style={{ filter: "drop-shadow(0 0 10px rgba(0,197,146,0.12))" }}
              >
                {validData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ServiceSpendChart;
