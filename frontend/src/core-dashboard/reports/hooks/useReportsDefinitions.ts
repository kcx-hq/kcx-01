import { useMemo } from "react";
import { FileText, Target, AlertTriangle, Shield } from "lucide-react";
import { formatPeriod } from "../utils/reportUtils";

export function useReportsDefinitions(reportData, isLocked) {
  return useMemo(() => {
    const period = reportData?.billingPeriod
      ? formatPeriod(reportData.billingPeriod)
      : "Current Period";

    return [
      {
        id: "executive-cost-summary",
        title: "Executive Cost Summary",
        icon: FileText,
        frequency: "Monthly / Quarterly",
        period,
        includes: [
          "Total cloud spend overview",
          "Top services by spend",
          "Top regions by spend",
          "Spend trend summary",
          "Budget health assessment",
          "Key takeaways",
        ],
        description: "Comprehensive overview of cloud spend for leadership decision-making",
        color: "blue",
        isLocked: false,
      },
      {
        id: "optimization-impact",
        title: "Optimization Impact Report",
        icon: Target,
        frequency: "Monthly",
        period,
        includes: [
          "Total potential savings analysis",
          "High-confidence recommendations",
          "Optimization opportunities under review",
          "Idle resources breakdown",
          "Right-sizing opportunities",
          "Commitment coverage analysis",
        ],
        description: "Shows identified optimization opportunities and their potential impact",
        color: "green",
        isLocked,
      },
      {
        id: "risk-predictability",
        title: "Risk and Predictability Brief",
        icon: AlertTriangle,
        frequency: "Monthly",
        period,
        includes: [
          "Cost concentration analysis",
          "Predictability and volatility analysis",
          "Dependency risk assessment",
          "Vendor concentration signals",
          "Strategic risk indicators",
        ],
        description: "Strategic insights on cost concentration and dependency risks",
        color: "amber",
        isLocked,
      },
      {
        id: "governance-accountability",
        title: "Governance and Accountability Snapshot",
        icon: Shield,
        frequency: "Quarterly",
        period,
        includes: [
          "Tag compliance metrics",
          "Production vs non-production breakdown",
          "Ownership gaps analysis",
          "Policy adherence notes",
          "Accountability mapping",
        ],
        description: "Governance metrics and accountability tracking for enterprise compliance",
        color: "teal",
        isLocked,
      },
    ];
  }, [reportData, isLocked]);
}
