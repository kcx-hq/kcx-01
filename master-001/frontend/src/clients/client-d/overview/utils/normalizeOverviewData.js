export function normalizeOverviewData(overviewData) {
  if (!overviewData || typeof overviewData !== "object") {
    return {
      totalSpend: 0,
      trendPercentage: 0,
      avgDailySpend: 0,
      billingPeriod: null,
      dailyData: [],
      groupedData: [],     // used by ServiceSpendChart
      allRegionData: [],   // not available in Client-D
      topRegion: { name: "N/A", value: 0 },
      topService: { name: "N/A", value: 0 },
      topProvider: { name: "N/A", value: 0 },
      spendChangePercent: 0,
      untaggedCost: 0,
      missingMetadataCost: 0,
      topRegionPercent: 0,
      topServicePercent: 0,
    };
  }

  const totalSpend = Number(overviewData.totalSpend ?? 0);
  const dailyData = Array.isArray(overviewData.dailyData) ? overviewData.dailyData : [];

  // ✅ Client-D: serviceBreakdown -> groupedData
  const groupedData = Array.isArray(overviewData.serviceBreakdown)
    ? overviewData.serviceBreakdown.map((x) => ({
        name: x?.name ?? "Unknown",
        value: Number(x?.value ?? 0),
      }))
    : [];

  // ✅ compute topService from groupedData
  const topService = groupedData.length
    ? groupedData.reduce((a, b) => (b.value > a.value ? b : a))
    : { name: "N/A", value: 0 };

  return {
    totalSpend,
    dailyData,
    groupedData,
    allRegionData: [],

    // not provided by Client-D response
    topRegion: { name: "N/A", value: 0 },
    topProvider: { name: "N/A", value: 0 },
    spendChangePercent: Number(overviewData.trendPercentage ?? 0),

    avgDailySpend: Number(overviewData.avgDailySpend ?? 0),
    billingPeriod: overviewData.billingPeriod ?? null,

    // optional/if you later add them
    untaggedCost: Number(overviewData.untaggedCost ?? 0),
    missingMetadataCost: Number(overviewData.missingMetadataCost ?? 0),
    topRegionPercent: Number(overviewData.topRegionPercent ?? 0),
    topServicePercent: Number(overviewData.topServicePercent ?? 0),

    topService,
    trendPercentage: Number(overviewData.trendPercentage ?? 0),
  };
}
