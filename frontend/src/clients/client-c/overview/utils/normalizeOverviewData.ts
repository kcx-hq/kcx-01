export function normalizeOverviewData(overviewData) {
  if (!overviewData || typeof overviewData !== "object") {
    return {
      totalSpend: 0,
      trendPercentage: 0,
      avgDailySpend: 0,
      billingPeriod: null,
      dailyData: [],
      groupedData: [],
      allRegionData: [],
      topRegion: { name: "N/A", value: 0 },
      topService: { name: "N/A", value: 0 },
      topProvider: { name: "N/A", value: 0 },
      spendChangePercent: 0,
      untaggedCost: 0,
      missingMetadataCost: 0,
      topRegionPercent: 0,
      topServicePercent: 0,
      // Client-C specific
      departmentBreakdown: [],
      departmentTrends: [],
    };
  }

  const totalSpend = Number(overviewData.totalSpend ?? 0);
  const dailyData = Array.isArray(overviewData.dailyData) ? overviewData.dailyData : [];
  const groupedData = Array.isArray(overviewData.groupedData) ? overviewData.groupedData : [];
  const allRegionData = Array.isArray(overviewData.allRegionData)
    ? overviewData.allRegionData
    : [];
  const departmentBreakdown = Array.isArray(overviewData.departmentBreakdown)
    ? overviewData.departmentBreakdown
    : [];
  const departmentTrends = Array.isArray(overviewData.departmentTrends)
    ? overviewData.departmentTrends
    : [];

  const topService =
    overviewData.topService && typeof overviewData.topService === "object"
      ? { name: overviewData.topService.name ?? "N/A", value: Number(overviewData.topService.value ?? 0) }
      : { name: "N/A", value: 0 };

  const topRegion =
    overviewData.topRegion && typeof overviewData.topRegion === "object"
      ? { name: overviewData.topRegion.name ?? "N/A", value: Number(overviewData.topRegion.value ?? 0) }
      : { name: "N/A", value: 0 };

  const topProvider =
    overviewData.topProvider && typeof overviewData.topProvider === "object"
      ? { name: overviewData.topProvider.name ?? "N/A", value: Number(overviewData.topProvider.value ?? 0) }
      : { name: "N/A", value: 0 };

  return {
    totalSpend,
    dailyData,
    groupedData,
    allRegionData,
    topRegion,
    topService,
    topProvider,
    spendChangePercent: Number(overviewData.spendChangePercent ?? 0),
    avgDailySpend: Number(overviewData.avgDailySpend ?? 0),
    billingPeriod: overviewData.billingPeriod ?? null,
    untaggedCost: Number(overviewData.untaggedCost ?? 0),
    missingMetadataCost: Number(overviewData.missingMetadataCost ?? 0),
    topRegionPercent: Number(overviewData.topRegionPercent ?? 0),
    topServicePercent: Number(overviewData.topServicePercent ?? 0),
    // Client-C specific
    departmentBreakdown,
    departmentTrends,
  };
}