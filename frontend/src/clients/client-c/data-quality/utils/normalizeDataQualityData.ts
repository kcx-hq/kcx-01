import type {
  DataQualityApiPayload,
  DataQualityEnvelope,
  DataQualityRawData,
  NormalizedDataQualityData,
  QualityDataPoint,
  QualityIssue,
  QualityMetrics,
  QualitySeverity,
  RawComplianceItem,
  RawDepartmentCompliance,
  RawTopOffender,
  RawTrendPoint,
} from "../types";

/**
 * Normalizes data quality data from backend to standardized format for UI components
 */
export const normalizeDataQualityData = (rawData: DataQualityApiPayload): NormalizedDataQualityData => {
  if (!rawData) {
    return {
      qualityData: [],
      qualityMetrics: {
        overallScore: 0,
        totalRows: 0,
        costAtRisk: 0,
        complianceRate: 0,
        untaggedCount: 0,
        anomaliesCount: 0,
        allCount: 0,
        departmentCompliance: 100,
        topOffendersCount: 0,
        highestOffenderCost: 0,
      },
      qualityIssues: [],
      metadata: {
        isEmptyState: true,
      },
    };
  }

  // Handle different possible data structures
  let dataToProcess: DataQualityRawData;
  const rawUnknown = rawData as unknown;
  if (typeof rawData === "object" && rawData !== null && "data" in rawData && rawData.data && typeof rawData.data === "object") {
    dataToProcess = (rawData as DataQualityEnvelope).data as DataQualityRawData;
  } else if (Array.isArray(rawUnknown)) {
    dataToProcess = { qualityData: rawUnknown };
  } else {
    dataToProcess = rawData as DataQualityRawData;
  }

  // Normalize quality metrics - map actual backend structure
  const qualityMetrics: QualityMetrics = {
    overallScore: dataToProcess.score || 0,
    totalRows: dataToProcess.totalRows || 0,
    costAtRisk: dataToProcess.costAtRisk || 0,
    // Calculate compliance rate from compliance array percentages
    complianceRate:
      dataToProcess.compliance && dataToProcess.compliance.length > 0
        ? Math.max(...dataToProcess.compliance.map((c: RawComplianceItem) => c.pct || 0))
        : 0,
    // Add bucket statistics
    untaggedCount: dataToProcess.buckets?.untagged?.length || 0,
    anomaliesCount: dataToProcess.buckets?.anomalies?.length || 0,
    allCount: dataToProcess.buckets?.all?.length || 0,
    // Add department compliance
    departmentCompliance: dataToProcess.departmentCompliance?.[0]?.score || 100,
    // Add top offenders summary
    topOffendersCount: dataToProcess.topOffenders?.length || 0,
    highestOffenderCost: dataToProcess.topOffenders?.[0]?.cost || 0,
  };

  // Create comprehensive quality data from actual backend structure
  const qualityData: QualityDataPoint[] = [];

  // 1. Overall Quality Metrics
  qualityData.push({
    id: "overall-score",
    metric: "Overall Quality Score",
    score: qualityMetrics.overallScore,
    description: `${qualityMetrics.overallScore}% data quality rating across all resources`,
    timestamp: new Date().toISOString(),
  });

  qualityData.push({
    id: "compliance-rate",
    metric: "Tag Compliance Rate",
    score: qualityMetrics.complianceRate,
    description: `Highest tag compliance: ${qualityMetrics.complianceRate.toFixed(1)}%`,
    timestamp: new Date().toISOString(),
  });

  qualityData.push({
    id: "department-compliance",
    metric: "Department Compliance",
    score: qualityMetrics.departmentCompliance,
    description: `${qualityMetrics.departmentCompliance}% compliance for Untagged department`,
    timestamp: new Date().toISOString(),
  });

  // 2. Data Quality Buckets Analysis
  if (dataToProcess.buckets) {
    const totalResources = qualityMetrics.allCount;
    const untaggedPercent = totalResources > 0 ? (qualityMetrics.untaggedCount / totalResources) * 100 : 0;
    const anomaliesPercent = totalResources > 0 ? (qualityMetrics.anomaliesCount / totalResources) * 100 : 0;

    qualityData.push({
      id: "untagged-resources",
      metric: "Untagged Resources",
      score: 100 - untaggedPercent,
      description: `${qualityMetrics.untaggedCount} untagged out of ${totalResources} total resources (${untaggedPercent.toFixed(1)}%)`,
      timestamp: new Date().toISOString(),
    });

    qualityData.push({
      id: "anomaly-detection",
      metric: "Anomaly Detection",
      score: 100 - anomaliesPercent,
      description: `${qualityMetrics.anomaliesCount} anomalies detected out of ${totalResources} resources (${anomaliesPercent.toFixed(1)}%)`,
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Trend Analysis
  if (dataToProcess.trendData && Array.isArray(dataToProcess.trendData)) {
    // Show recent trend (last 7 days average)
    const recentTrends = dataToProcess.trendData.slice(-7);
    const avgTrendScore =
      recentTrends.length > 0
        ? recentTrends.reduce((sum: number, point: RawTrendPoint) => sum + (point.score || 0), 0) / recentTrends.length
        : 0;

    qualityData.push({
      id: "recent-trend",
      metric: "7-Day Trend Average",
      score: Math.round(avgTrendScore),
      description: `Average quality score over last 7 days: ${Math.round(avgTrendScore)}%`,
      timestamp: new Date().toISOString(),
    });

    // Show latest trend point
    const latestPoint = dataToProcess.trendData[dataToProcess.trendData.length - 1];
    if (latestPoint) {
      qualityData.push({
        id: "latest-trend",
        metric: `Latest (${latestPoint.date})`,
        score: latestPoint.score || 0,
        description: `Most recent quality score: ${latestPoint.score || 0}%`,
        timestamp: latestPoint.date || new Date().toISOString(),
      });
    }
  }

  // 4. Cost Risk Analysis
  qualityData.push({
    id: "cost-risk",
    metric: "Cost at Risk",
    score: qualityMetrics.costAtRisk >= 0 ? 100 : Math.max(0, 100 + qualityMetrics.costAtRisk),
    description: `Potential cost impact: $${Math.abs(qualityMetrics.costAtRisk).toFixed(2)}`,
    timestamp: new Date().toISOString(),
  });

  // Create comprehensive quality issues from actual backend structure
  const qualityIssues: QualityIssue[] = [];

  // 1. Tag Compliance Issues
  if (dataToProcess.compliance && Array.isArray(dataToProcess.compliance)) {
    dataToProcess.compliance.forEach((item: RawComplianceItem, index: number) => {
      const complianceLevel = item.pct || 0;
      const missingCount = (dataToProcess.totalRows || 0) - (item.count || 0);

      qualityIssues.push({
        id: `tag-compliance-${index}`,
        type: `Missing ${item.key} Tag`,
        count: missingCount,
        severity: (complianceLevel < 50 ? "high" : complianceLevel < 80 ? "medium" : "low") as QualitySeverity,
        description: `${missingCount} resources missing ${item.key} tag (${complianceLevel.toFixed(1)}% compliance)`,
        category: "tag-compliance",
      });
    });
  }

  // 2. Untagged Resources Issue
  if (qualityMetrics.untaggedCount > 0) {
    qualityIssues.push({
      id: "untagged-issue",
      type: "Untagged Resources",
      count: qualityMetrics.untaggedCount,
      severity: (qualityMetrics.untaggedCount > 200 ? "high" : qualityMetrics.untaggedCount > 50 ? "medium" : "low") as QualitySeverity,
      description: `${qualityMetrics.untaggedCount} resources lack proper tagging for cost allocation`,
      category: "resource-management",
    });
  }

  // 3. Anomaly Detection Issues
  if (qualityMetrics.anomaliesCount > 0) {
    qualityIssues.push({
      id: "anomalies-issue",
      type: "Data Anomalies",
      count: qualityMetrics.anomaliesCount,
      severity: (qualityMetrics.anomaliesCount > 100 ? "high" : qualityMetrics.anomaliesCount > 25 ? "medium" : "low") as QualitySeverity,
      description: `${qualityMetrics.anomaliesCount} anomalous data points detected requiring review`,
      category: "data-quality",
    });
  }

  // 4. Top Resource Offenders
  if (dataToProcess.topOffenders && Array.isArray(dataToProcess.topOffenders)) {
    dataToProcess.topOffenders.forEach((offender: RawTopOffender, index: number) => {
      const offenderCost = offender.cost || 0;
      qualityIssues.push({
        id: `resource-offender-${index}`,
        type: offender.name || "Unknown",
        count: offender.count || 0,
        severity: (offenderCost > 0.3 ? "high" : offenderCost > 0.1 ? "medium" : "low") as QualitySeverity,
        description: `${offender.count || 0} resources with $${offenderCost.toFixed(2)} cost impact`,
        category: "cost-optimization",
      });
    });
  }

  // 5. Department Compliance Issues
  if (dataToProcess.departmentCompliance && Array.isArray(dataToProcess.departmentCompliance)) {
    dataToProcess.departmentCompliance.forEach((dept: RawDepartmentCompliance, index: number) => {
      const deptScore = dept.score || 0;
      if (deptScore < 100) {
        // Any department not at 100% compliance
        qualityIssues.push({
          id: `dept-compliance-${index}`,
          type: `${dept.name} Department`,
          count: dept.missingTags || 0,
          severity: (deptScore < 70 ? "high" : deptScore < 90 ? "medium" : "low") as QualitySeverity,
          description: `${dept.missingTags || 0} missing tags in ${dept.name} department (${deptScore}% compliance)`,
          category: "department-compliance",
        });
      }
    });
  }

  // 6. Cost at Risk Issue
  if (qualityMetrics.costAtRisk < 0) {
    qualityIssues.push({
      id: "cost-risk-issue",
      type: "Financial Risk",
      count: Math.abs(Math.round(qualityMetrics.costAtRisk * 100)),
      severity: "high",
      description: `Potential cost impact of $${Math.abs(qualityMetrics.costAtRisk).toFixed(2)} due to data quality issues`,
      category: "financial-risk",
    });
  }

  return {
    qualityData,
    qualityMetrics,
    qualityIssues,
    metadata: {
      isEmptyState: qualityData.length === 0 && qualityIssues.length === 0,
    },
  };
};
