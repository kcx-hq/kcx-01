import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { DenominatorQualityPayload } from "../types";
import { useGovernanceRequest } from "./useGovernanceRequest";

interface Params {
  api: ApiClient | null;
  caps: Capabilities | null;
  params: Record<string, string>;
}

export function useDenominatorQualityData({ api, caps, params }: Params) {
  return useGovernanceRequest<DenominatorQualityPayload>({
    api,
    caps,
    endpoint: "denominatorQuality",
    params,
  });
}

export default useDenominatorQualityData;
