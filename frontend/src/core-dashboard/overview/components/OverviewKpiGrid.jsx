// src/components/dashboard/OverviewKpi.jsx
import React, { useMemo, useCallback } from "react";
import { useAuthStore } from "../../../store/Authstore";
import { DollarSign, MapPin, Server, TrendingUp, Cloud, Tag, FileX } from "lucide-react";
import KpiGrid from "../../common/widgets/KpiGrid";

const OverviewKpi = ({
  spend = 0,
  topRegion = { name: "N/A", value: 0 },
  topService = { name: "N/A", value: 0 },
  spendChangePercent = 0,
  topProvider = { name: "N/A", value: 0 },
  untaggedCost = 0,
  missingMetadataCost = 0,
  billingPeriod = null,
  topRegionPercent = 0,
  topServicePercent = 0,
}) => {
  const { user } = useAuthStore();

  // NOTE: locked should be true when user is NOT premium
  const locked = !user?.is_premium;

  const formatCurrency = useCallback(
    (val) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(Number(val || 0)),
    []
  );

  const formatPercent = useCallback((val) => {
    const n = Number(val || 0);
    const sign = n >= 0 ? "+" : "";
    return `${sign}${n.toFixed(1)}%`;
  }, []);

  // context passed into getInsights
  const ctx = useMemo(
    () => ({
      spend,
      topRegion,
      topService,
      spendChangePercent,
      topProvider,
      untaggedCost,
      missingMetadataCost,
      billingPeriod,
      topRegionPercent,
      topServicePercent,
      formatCurrency,
      formatPercent,
    }),
    [
      spend,
      topRegion,
      topService,
      spendChangePercent,
      topProvider,
      untaggedCost,
      missingMetadataCost,
      billingPeriod,
      topRegionPercent,
      topServicePercent,
      formatCurrency,
      formatPercent,
    ]
  );

  const cards = useMemo(
    () => [
      {
        id: "total-billed-cost",
        delay: 0,
        title: "Total Billed Cost",
        value: formatCurrency(spend),
        icon: DollarSign,
        color: "text-[#a02ff1]",
        subValue: Math.abs(spendChangePercent) > 0.1 ? formatPercent(spendChangePercent) : null,
        contextLabel: billingPeriod ? `Billing period: ${billingPeriod}` : null,
        showChangeTooltip: Math.abs(spendChangePercent) > 0.1,
      },
      {
        id: "top-cost-region",
        delay: 1,
        title: "Top Cost Region",
        value: topRegion?.name || "N/A",
        icon: MapPin,
        color: "text-blue-400",
        contextLabel: topRegionPercent > 0 ? `${Number(topRegionPercent).toFixed(0)}% of total spend` : null,
      },
      {
        id: "top-cost-service",
        delay: 2,
        title: "Top Cost Driver",
        value: topService?.name || "N/A",
        icon: Server,
        color: "text-emerald-400",
        contextLabel: topServicePercent > 0 ? `${Number(topServicePercent).toFixed(1)}% cost concentration` : null,
      },
    ],
    [
      spend,
      topRegion,
      topService,
      spendChangePercent,
      billingPeriod,
      topRegionPercent,
      topServicePercent,
      formatCurrency,
      formatPercent,
    ]
  );

  const extraCards = useMemo(() => {
    const safeSpend = Number(spend || 0);
    const untaggedPct = safeSpend > 0 ? (Number(untaggedCost || 0) / safeSpend) * 100 : 0;
    const missingPct = safeSpend > 0 ? (Number(missingMetadataCost || 0) / safeSpend) * 100 : 0;

    return [
      {
        id: "spend-change",
        delay: 3,
        title: "Spend Change (%)",
        value: formatPercent(spendChangePercent),
        icon: TrendingUp,
        color: Number(spendChangePercent) >= 0 ? "text-red-400" : "text-green-400",
        subValue: "vs prev period",
      },
      {
        id: "top-provider",
        delay: 4,
        title: "Top Cloud Provider",
        value: topProvider?.name || "N/A",
        icon: Cloud,
        color: "text-cyan-400",
        subValue: formatCurrency(topProvider?.value || 0),
      },
      {
        id: "untagged-cost",
        delay: 5,
        title: "Untagged Cost Impact",
        value: formatCurrency(untaggedCost),
        icon: Tag,
        color: "text-amber-400",
        subValue: safeSpend > 0 ? `${untaggedPct.toFixed(1)}% of total` : null,
      },
      {
        id: "missing-metadata",
        delay: 6,
        title: "Cost With Missing Metadata",
        value: formatCurrency(missingMetadataCost),
        icon: FileX,
        color: "text-orange-400",
        subValue: safeSpend > 0 ? `${missingPct.toFixed(1)}% of total` : null,
      },
    ];
  }, [spend, untaggedCost, missingMetadataCost, spendChangePercent, topProvider, formatCurrency, formatPercent]);

  const getInsights = useCallback(
    (cardId, ctx) => {
      const {
        spend,
        topRegion,
        topService,
        spendChangePercent,
        topProvider,
        untaggedCost,
        missingMetadataCost,
        billingPeriod,
        formatCurrency,
        formatPercent,
      } = ctx;

      const safeSpend = Number(spend || 0);
      const untaggedPercent = safeSpend > 0 ? ((Number(untaggedCost || 0) / safeSpend) * 100).toFixed(1) : "0.0";
      const missingMetadataPercent =
        safeSpend > 0 ? ((Number(missingMetadataCost || 0) / safeSpend) * 100).toFixed(1) : "0.0";

      const topRegionPercent =
        safeSpend > 0 ? ((Number(topRegion?.value || 0) / safeSpend) * 100).toFixed(1) : "0.0";
      const topServicePercent =
        safeSpend > 0 ? ((Number(topService?.value || 0) / safeSpend) * 100).toFixed(1) : "0.0";
      const topProviderPercent =
        safeSpend > 0 ? ((Number(topProvider?.value || 0) / safeSpend) * 100).toFixed(1) : "0.0";

      switch (cardId) {
        case "total-billed-cost":
          return {
            title: "Total Billed Cost Insights",
            description: "Your total cloud spend across all services and regions.",
            metrics: [
              { label: "Total Spend", value: formatCurrency(safeSpend) },
              { label: "Period Change", value: formatPercent(spendChangePercent) },
              { label: "Billing Period", value: billingPeriod || "N/A" },
            ],
            breakdown: [],
          };

        case "top-cost-region":
          return {
            title: "Top Cost Region Insights",
            description: `Regional distribution of your cloud costs. ${topRegion?.name || "N/A"} accounts for the highest spend.`,
            metrics: [
              { label: "Region Spend", value: formatCurrency(topRegion?.value || 0) },
              { label: "% of Total", value: `${topRegionPercent}%` },
              { label: "Region Name", value: topRegion?.name || "N/A" },
            ],
            breakdown: [],
          };

        case "top-cost-service":
          return {
            title: "Top Cost Driver (Service) Insights",
            description: `${topService?.name || "N/A"} is your primary cost driver. Understanding service-level spend helps optimize resource allocation.`,
            metrics: [
              { label: "Service Spend", value: formatCurrency(topService?.value || 0) },
              { label: "% of Total", value: `${topServicePercent}%` },
              { label: "Service Name", value: topService?.name || "N/A" },
            ],
            breakdown: [],
          };

        case "spend-change":
          return {
            title: "Spend Change (%) Insights",
            description: `Your spend has ${
              Number(spendChangePercent) >= 0 ? "increased" : "decreased"
            } by ${Math.abs(Number(spendChangePercent || 0)).toFixed(1)}% compared to the previous period.`,
            metrics: [
              { label: "Change Percentage", value: formatPercent(spendChangePercent) },
              { label: "Trend", value: Number(spendChangePercent) >= 0 ? "Increasing" : "Decreasing" },
              { label: "Status", value: Math.abs(Number(spendChangePercent || 0)) > 10 ? "⚠️ High Change" : "✓ Normal" },
            ],
            breakdown: [],
          };

        case "top-provider":
          return {
            title: "Top Cloud Provider Insights",
            description: `${topProvider?.name || "N/A"} is your primary cloud provider.`,
            metrics: [
              { label: "Provider Spend", value: formatCurrency(topProvider?.value || 0) },
              { label: "% of Total", value: `${topProviderPercent}%` },
              { label: "Provider Name", value: topProvider?.name || "N/A" },
            ],
            breakdown: [],
          };

        case "untagged-cost": {
          const impact = Number(untaggedCost || 0) > safeSpend * 0.1 ? "High" : "Low";
          return {
            title: "Untagged Cost Impact Insights",
            description: `Untagged costs represent ${untaggedPercent}% of your total spend. Untagged = unaccountable = unoptimizable.`,
            metrics: [
              { label: "Untagged Cost", value: formatCurrency(untaggedCost) },
              { label: "% of Total", value: `${untaggedPercent}%` },
              { label: "Impact", value: impact },
            ],
            breakdown: [],
            recommendation:
              Number(untaggedCost || 0) > safeSpend * 0.1
                ? "⚠️ High untagged cost detected. Consider implementing a tagging strategy."
                : "✓ Untagged costs are within acceptable range.",
          };
        }

        case "missing-metadata": {
          const impact = Number(missingMetadataCost || 0) > safeSpend * 0.05 ? "High" : "Low";
          return {
            title: "Cost With Missing Metadata Insights",
            description: `Costs with missing metadata represent ${missingMetadataPercent}% of your total spend.`,
            metrics: [
              { label: "Missing Metadata Cost", value: formatCurrency(missingMetadataCost) },
              { label: "% of Total", value: `${missingMetadataPercent}%` },
              { label: "Impact", value: impact },
            ],
            breakdown: [],
            recommendation:
              Number(missingMetadataCost || 0) > safeSpend * 0.05
                ? "⚠️ Significant metadata gaps detected. Improve data quality."
                : "✓ Metadata quality is good.",
          };
        }

        default:
          return null;
      }
    },
    []
  );

  return (
    <KpiGrid
      cards={cards}
      extraCards={extraCards}
      locked={locked}
      getInsights={getInsights}
      ctx={ctx}
      columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      onCardClick={(id) => {
        // optional: analytics / logging
        // console.log("KPI clicked:", id);
      }}
    />
  );
};

export default OverviewKpi;
