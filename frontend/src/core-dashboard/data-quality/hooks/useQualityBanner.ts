import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { QualityImpactBannerPayload } from "../types";
import { useGovernanceRequest } from "./useGovernanceRequest";

interface Params {
  api: ApiClient | null;
  caps: Capabilities | null;
  params: Record<string, string>;
}

export function useQualityBanner({ api, caps, params }: Params) {
  return useGovernanceRequest<QualityImpactBannerPayload>({
    api,
    caps,
    endpoint: "banner",
    params,
  });
}

export default useQualityBanner;
