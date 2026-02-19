// frontend/clients/client-d/dashboards/overview/components/OverviewKpiGrid.jsx
import React, { useMemo } from "react";
import KpiGrid from "../../../../core-dashboard/common/widgets/KpiGrid"; // ✅ your common KpiGrid
import {
  DollarSign,
  TrendingUp,
  CalendarDays,
  Layers,
  Building2,
  MapPin,
} from "lucide-react";

/**
 * Client-D Overview KPI Grid
 * Uses your common KpiGrid (cards + optional extraCards)
 *
 * Expected props:
 * - extractedData: normalized overview data (from normalizeOverviewData)
 * - locked: boolean (premium lock)
 */
const OverviewKpiGrid = ({ extractedData, locked = false }) => {
  const {
    totalSpend,
    avgDailySpend,
    spendChangePercent,
    billingPeriod,
    topService,
    topProvider,
    topRegion,
  } = extractedData || {};

  const billingLabel = useMemo(() => {
    const start = billingPeriod?.start ? new Date(billingPeriod.start) : null;
    const end = billingPeriod?.end ? new Date(billingPeriod.end) : null;

    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "Billing: N/A";
    }

    // short label: Aug 31 → Sep 30
    const fmt = (d) =>
      d.toLocaleDateString("en-US", { day: "numeric", month: "short" });

    return `Billing: ${fmt(start)} → ${fmt(end)}`;
  }, [billingPeriod]);

  const money = (n) => {
    const num = Number(n ?? 0);
    if (Number.isNaN(num)) return "$0.00";
    return `$${num.toFixed(2)}`;
  };

  const percent = (n) => {
    const num = Number(n ?? 0);
    if (Number.isNaN(num)) return "0%";
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}%`;
  };

  // ✅ base cards always visible
  const cards = useMemo(
    () => [
      {
        id: "totalSpend",
        title: "Total Spend",
        value: money(totalSpend),
        icon: DollarSign,
        color: "text-[#a02ff1]",
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
        color: "text-indigo-300",
        contextLabel: topService?.value != null ? `Spend: ${money(topService.value)}` : undefined,
      },
    ],
    [totalSpend, avgDailySpend, topService]
  );
   
  // ✅ extra cards (expandable) — lockable via locked prop
  // NOTE: Client-D doesn’t always provide topRegion/topProvider.
  // If N/A, we still show as N/A (or you can conditionally hide).

  // Optional: insights dialog (click KPI -> modal)
  const getInsights = (id, ctx) => {
    const total = Number(ctx?.totalSpend ?? 0) || 0;

    if (id === "totalSpend") {
      return {
        title: "Total Spend",
        description:
          "Total cost for the selected billing period and applied filters.",
        metrics: [
          { label: "Total", value: money(ctx.totalSpend) },
          { label: "Avg/Day", value: money(ctx.avgDailySpend) },
        ],
        recommendation:
          "Use Provider/Service/Region filters to isolate what is driving spend.",
      };
    }

    if (id === "avgDailySpend") {
      return {
        title: "Average Daily Spend",
        description:
          "Average cost per day across the selected billing period and filters.",
        metrics: [
          { label: "Avg/Day", value: money(ctx.avgDailySpend) },
          { label: "Total", value: money(ctx.totalSpend) },
        ],
      };
    }

    

    if (id === "topService") {
      const top = ctx?.topService;
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

    // default
    return {
      title: "Details",
      description: "No additional insights available for this KPI.",
      metrics: [{ label: "Value", value: "—" }],
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
