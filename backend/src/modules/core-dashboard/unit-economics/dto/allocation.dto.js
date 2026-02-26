export const toAllocationDto = ({
  overview = {},
  coverage = {},
  sharedPool = {},
  transparency = {},
  unallocatedInsight = {},
  validation = {},
}) => ({
  overview,
  coverage,
  sharedPool,
  transparency,
  unallocatedInsight,
  validation,
});

