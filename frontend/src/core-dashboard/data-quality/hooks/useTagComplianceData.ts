import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { TagCompliancePayload } from "../types";
import { useGovernanceRequest } from "./useGovernanceRequest";

interface Params {
  api: ApiClient | null;
  caps: Capabilities | null;
  params: Record<string, string>;
}

export function useTagComplianceData({ api, caps, params }: Params) {
  return useGovernanceRequest<TagCompliancePayload>({
    api,
    caps,
    endpoint: "tagCompliance",
    params,
  });
}

export default useTagComplianceData;
