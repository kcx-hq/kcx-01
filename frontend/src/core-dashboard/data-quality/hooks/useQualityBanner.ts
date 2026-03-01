import { useCallback } from "react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { QualityImpactBannerPayload } from "../types";
import { useGovernanceRequest } from "./useGovernanceRequest";

interface Params {
  api: ApiClient | null;
  caps: Capabilities | null;
  params: Record<string, string>;
}

export function useQualityBanner({ api, caps, params }: Params) {
  const fallback = useCallback((analysis: unknown): QualityImpactBannerPayload | null => {
    const governance = (analysis as { governance?: { generatedAt?: string } })?.governance;
    if (!governance) return null;

    return {
      last_checked_ts: governance.generatedAt || new Date().toISOString(),
      severity: "critical",
      confidence_level: "low",
      recommended_owner: "FinOps",
      overall_status: "fail",
      message: "Fallback banner: detailed governance endpoints not enabled.",
      active_gate_ids: ["freshness", "coverage", "denominator_quality", "cost_basis"],
      impact_scope_chips: ["Spend KPIs", "Allocation", "Unit Econ", "Forecast"],
      gate_summaries: [],
    };
  }, []);

  return useGovernanceRequest<QualityImpactBannerPayload>({
    api,
    caps,
    endpoint: "banner",
    params,
    fallback,
  });
}

export default useQualityBanner;
