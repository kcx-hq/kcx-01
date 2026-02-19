export const buildAccountsParams = ({ debouncedFilters, uploadId }) => {
  return {
    // Optional upload isolation if you use it
    uploadId: uploadId || undefined,

    provider:
      debouncedFilters?.provider && debouncedFilters.provider !== "All"
        ? debouncedFilters.provider
        : undefined,

    service:
      debouncedFilters?.service && debouncedFilters.service !== "All"
        ? debouncedFilters.service
        : undefined,

    region:
      debouncedFilters?.region && debouncedFilters.region !== "All"
        ? debouncedFilters.region
        : undefined,

    // Optional: if you later support required tags
    requiredTags: debouncedFilters?.requiredTags || undefined,
  };
};
