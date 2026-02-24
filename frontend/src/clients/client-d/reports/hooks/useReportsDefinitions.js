import { useMemo } from "react";
import { FileText, Target, AlertTriangle, Shield } from "lucide-react";
import { formatPeriod } from "../../../../core-dashboard/reports/utils/reportUtils";

export function useReportsDefinitions(reportData, isLocked) {
  return useMemo(() => {
    const period = reportData?.billingPeriod ? reportData.billingPeriod : "Current Period";

    return [
      {
        id: "executive-cost-summary",
        title: "Executive Cost Summary",
        icon: FileText,
        frequency: "Monthly",
        period: formatPeriod(period),
        includes: ["Total Spend", "Forecast", "Top Services", "Top Regions", "Daily Spend Trend"],
        description: "Leadership view: spend, trend, and concentration signals.",
        color: "blue",
        isLocked: false,
      },
      {
        id: "optimization-impact",
        title: "Optimization Impact",
        icon: Target,
        frequency: "Monthly",
        period: formatPeriod(period),
        includes: ["Spend Concentration", "Forecast drift", "Daily peaks overview"],
        description: "Where spend is concentrated and where forecast is going.",
        color: "green",
        isLocked,
      },
      {
        id: "risk-predictability",
        title: "Risk & Predictability",
        icon: AlertTriangle,
        frequency: "Monthly",
        period: formatPeriod(period),
        includes: ["Top region exposure", "Top service exposure", "Volatility notes"],
        description: "Risk from region/service dominance and day-to-day variation.",
        color: "yellow",
        isLocked,
      },
      {
        id: "governance-accountability",
        title: "Governance Snapshot",
        icon: Shield,
        frequency: "Monthly",
        period: formatPeriod(period),
        includes: ["Tagged vs Untagged", "Prod vs Non-Prod", "Unknown allocation"],
        description: "Tagging and environment allocation health.",
        color: "green",
        isLocked,
      },
    ];
  }, [reportData, isLocked]);
}
