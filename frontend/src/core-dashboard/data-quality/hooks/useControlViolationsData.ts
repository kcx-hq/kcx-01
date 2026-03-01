import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { ControlViolationsPayload } from "../types";
import { useGovernanceRequest } from "./useGovernanceRequest";

interface Params {
  api: ApiClient | null;
  caps: Capabilities | null;
  params: Record<string, string>;
}

export function useControlViolationsData({ api, caps, params }: Params) {
  return useGovernanceRequest<ControlViolationsPayload>({
    api,
    caps,
    endpoint: "controlViolations",
    params,
  });
}

export default useControlViolationsData;
