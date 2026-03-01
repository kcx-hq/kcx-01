import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { CoverageGatesPayload } from "../types";
import { useGovernanceRequest } from "./useGovernanceRequest";

interface Params {
  api: ApiClient | null;
  caps: Capabilities | null;
  params: Record<string, string>;
}

export function useCoverageData({ api, caps, params }: Params) {
  return useGovernanceRequest<CoverageGatesPayload>({
    api,
    caps,
    endpoint: "coverage",
    params,
  });
}

export default useCoverageData;
