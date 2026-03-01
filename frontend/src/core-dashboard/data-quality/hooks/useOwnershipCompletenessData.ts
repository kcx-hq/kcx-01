import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { OwnershipCompletenessPayload } from "../types";
import { useGovernanceRequest } from "./useGovernanceRequest";

interface Params {
  api: ApiClient | null;
  caps: Capabilities | null;
  params: Record<string, string>;
}

export function useOwnershipCompletenessData({ api, caps, params }: Params) {
  return useGovernanceRequest<OwnershipCompletenessPayload>({
    api,
    caps,
    endpoint: "ownershipCompleteness",
    params,
  });
}

export default useOwnershipCompletenessData;
