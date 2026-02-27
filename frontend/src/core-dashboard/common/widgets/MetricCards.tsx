import React from "react";
import { DollarSign, Zap, TrendingDown } from "lucide-react";

const BRAND = "#007758";
const BRAND_SOFT = "#00c592";
const HIGHLIGHT = "#e5f9f4";

interface MetricCardsProps {
  totalSpend: number;
  leakageCost: number;
  efficiency: number;
}

const MetricCards = ({ totalSpend, leakageCost, efficiency }: MetricCardsProps) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. Total Spend */}
      <div className="glass-card relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <DollarSign size={80} />
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${HIGHLIGHT}` }}
          >
            <DollarSign size={16} style={{ color: BRAND }} />
          </div>
          <span className="text-gray-400 text-sm font-medium">
            Total Billed Cost
          </span>
        </div>

        <div className="text-3xl font-bold text-white mt-1">
          {formatCurrency(totalSpend)}
        </div>

        <div className="text-xs mt-2 flex items-center gap-1 text-gray-500">
          <span
            className="px-1.5 py-0.5 rounded border"
            style={{
              background: `${HIGHLIGHT}`,
              borderColor: BRAND,
              color: BRAND,
            }}
          >
            LIVE
          </span>
          Data ingested successfully
        </div>
      </div>

      {/* 2. Potential Savings (Primary Focus) */}
      <div
        className="glass-card relative overflow-hidden border"
        style={{
          borderColor: BRAND,
          boxShadow: "0 0 24px rgba(0,119,88,0.15)",
        }}
      >
        <div
          className="absolute -right-4 -top-4 w-32 h-32 rounded-full blur-2xl"
          style={{ background: "rgba(0,119,88,0.25)" }}
        />

        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,119,88,0.15)", color: BRAND }}
          >
            <Zap size={16} />
          </div>
          <span className="text-gray-400 text-sm font-medium">
            Potential Savings
          </span>
        </div>

        <div className="text-3xl font-bold text-white mt-1">
          {formatCurrency(leakageCost)}
        </div>

        <div className="text-xs mt-2 font-medium" style={{ color: BRAND }}>
          Found in unoptimized resources
        </div>
      </div>

      {/* 3. Efficiency */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,197,146,0.2)", color: BRAND_SOFT }}
          >
            <TrendingDown size={16} />
          </div>
          <span className="text-gray-400 text-sm font-medium">
            Efficiency Score
          </span>
        </div>

        <div className="flex items-end justify-between mt-1">
          <div className="text-3xl font-bold text-white">{efficiency}%</div>
          <div className="text-xs font-bold mb-1" style={{ color: BRAND_SOFT }}>
            GOOD
          </div>
        </div>

        <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            style={{
              width: `${efficiency}%`,
              background: BRAND_SOFT,
              boxShadow: "0 0 10px rgba(0,197,146,0.4)",
            }}
            className="h-full rounded-full"
          />
        </div>
      </div>

    </div>
  );
};

export default MetricCards;
