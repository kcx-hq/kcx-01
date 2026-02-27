import type { AccountsOwnershipQueryParams, BuildAccountsParamsInput } from "../types";

export const buildAccountsParams = ({
  debouncedFilters,
  uploadId,
}: BuildAccountsParamsInput): AccountsOwnershipQueryParams => {
  const params: AccountsOwnershipQueryParams = {};

  if (uploadId) params.uploadId = uploadId;
  if (debouncedFilters?.provider && debouncedFilters.provider !== "All") {
    params.provider = debouncedFilters.provider;
  }
  if (debouncedFilters?.service && debouncedFilters.service !== "All") {
    params.service = debouncedFilters.service;
  }
  if (debouncedFilters?.region && debouncedFilters.region !== "All") {
    params.region = debouncedFilters.region;
  }
  if (debouncedFilters?.requiredTags) {
    params.requiredTags = debouncedFilters.requiredTags;
  }

  return params;
};
