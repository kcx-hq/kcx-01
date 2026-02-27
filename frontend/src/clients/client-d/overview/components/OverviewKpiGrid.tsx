import React from "react";
import { DollarSign, Layers, TrendingUp } from "lucide-react";
import KpiGrid from "../../../../core-dashboard/common/widgets/KpiGrid";
import type { OverviewKpiGridProps } from "../types";

const OverviewKpiGrid = ({ extractedData, locked = false }: OverviewKpiGridProps) => {
  const { totalSpend, avgDailySpend, billingPeriod, topService } = extractedData || {};

  const money = (n: number | string | null | undefined) => {
    const num = Number(n ?? 0);
    if (Number.isNaN(num)) return "$0.00";
    return `$${num.toFixed(2)}`;
  };

  const start = billingPeriod?.start ? new Date(billingPeriod.start) : null;
  const end = billingPeriod?.end ? new Date(billingPeriod.end) : null;
  const billingLabel =
    !start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
      ? "Billing: N/A"
      : `Billing: ${start.toLocaleDateString("en-US", { day: "numeric", month: "short" })} â†’ ${end.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`;

  const cards = [
    {
      id: "totalSpend",
      title: "Total Spend",
      value: money(totalSpend),
      icon: DollarSign,
      color: "text-[#007758]",
      contextLabel: billingLabel,
    },
    {
      id: "avgDailySpend",
      title: "Avg Daily Spend",
      value: money(avgDailySpend),
      icon: TrendingUp,
      color: "text-emerald-400",
      contextLabel: billingLabel,
    },
    {
      id: "topService",
      title: "Top Service",
      value: topService?.name ?? "N/A",
      icon: Layers,
      color: "text-emerald-300",
      contextLabel: topService?.value != null ? `Spend: ${money(topService.value)}` : undefined,
    },
  ];

  const getInsights = (id: string | number, ctx: unknown) => {
    const overviewCtx = (ctx ?? {}) as OverviewKpiGridProps["extractedData"];

    if (id === "totalSpend") {
      return {
        title: "Total Spend",
        description: "Total cost for the selected billing period and applied filters.",
        metrics: [
          { label: "Total", value: money(overviewCtx.totalSpend) },
          { label: "Avg/Day", value: money(overviewCtx.avgDailySpend) },
        ],
        recommendation: "Use Provider/Service/Region filters to isolate what is driving spend.",
      };
    }

    if (id === "avgDailySpend") {
      return {
        title: "Average Daily Spend",
        description: "Average cost per day across the selected billing period and filters.",
        metrics: [
          { label: "Avg/Day", value: money(overviewCtx.avgDailySpend) },
          { label: "Total", value: money(overviewCtx.totalSpend) },
        ],
      };
    }

    if (id === "topService") {
      const top = overviewCtx?.topService;
      return {
        title: "Top Service",
        description: "Highest spending service in the current selection.",
        metrics: [
          { label: "Service", value: top?.name ?? "N/A" },
          { label: "Spend", value: money(top?.value ?? 0) },
        ],
        recommendation:
          "Consider rightsizing, scheduling, or commitments (Savings Plans/Reserved Instances) for this service.",
      };
    }

    return {
      title: "Details",
      description: "No additional insights available for this KPI.",
      metrics: [{ label: "Value", value: "â€”" }],
    };
  };

  return (
    <KpiGrid
      cards={cards}
      extraCards={[]}
      locked={locked}
      getInsights={getInsights}
      ctx={extractedData}
      columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    />
  );
};

export default OverviewKpiGrid;
