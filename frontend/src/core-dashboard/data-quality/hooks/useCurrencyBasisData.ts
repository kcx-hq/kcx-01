import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { CurrencyBasisPayload } from "../types";
import { useGovernanceRequest } from "./useGovernanceRequest";

interface Params {
  api: ApiClient | null;
  caps: Capabilities | null;
  params: Record<string, string>;
}

export function useCurrencyBasisData({ api, caps, params }: Params) {
  return useGovernanceRequest<CurrencyBasisPayload>({
    api,
    caps,
    endpoint: "currencyBasis",
    params,
  });
}

export default useCurrencyBasisData;
