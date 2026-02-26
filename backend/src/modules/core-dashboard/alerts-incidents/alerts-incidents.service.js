import { roundTo } from "../../../common/utils/cost.calculations.js";
import { dashboardService } from "../overviews/overview.service.js";
import { generateCostAnalysis } from "../analytics/cost-analysis/cost-analysis.service.js";
import { dataQualityService } from "../analytics/data-quality/data-quality.service.js";
import { forecastingBudgetsService } from "../forecasting-budgets/forecasting-budgets.service.js";
import { optimizationService } from "../optimization/optimization.service.js";
import { unitEconomicsService } from "../unit-economics/unit-economics.service.js";

const n = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toSeverityRank = (severity) => {
  const map = { critical: 4, high: 3, medium: 2, low: 1 };
  return map[String(severity || "low").toLowerCase()] || 1;
};

const severityFromImpact = (impactAmount = 0, impactPct = 0) => {
  if (impactAmount >= 5000 || impactPct >= 25) return "critical";
  if (impactAmount >= 1500 || impactPct >= 10) return "high";
  if (impactAmount >= 500 || impactPct >= 3) return "medium";
  return "low";
};

const confidenceFromScore = (score = 0) => {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
};

const buildEscalationChain = (owner) => {
  const primary = String(owner || "governance-owner@kcx.example");
  const chain = [
    primary,
    "finops-lead@kcx.example",
    "finance-controller@kcx.example",
  ];
  return Array.from(new Set(chain));
};

const detectionNow = () => new Date().toISOString();

const slaHours = (severity) => {
  if (severity === "critical") return 4;
  if (severity === "high") return 12;
  if (severity === "medium") return 24;
  return 72;
};

const withSla = (detectedAt, severity) => {
  const hours = slaHours(severity);
  const base = new Date(detectedAt);
  return {
    hours,
    dueAt: new Date(base.getTime() + hours * 3600 * 1000).toISOString(),
  };
};

const alertTypeToDestination = {
  spend_anomaly: "/dashboard/cost-analysis",
  forecast_budget_risk: "/dashboard/forecasting-budgets",
  governance_control: "/dashboard/data-quality",
  optimization_workflow: "/dashboard/optimization",
  commitment_risk: "/dashboard/optimization",
};

const defaultNotificationPolicy = {
  realTimeSeverities: ["critical", "high"],
  digestSeverities: ["medium", "low"],
  channels: ["email", "in_app", "enterprise_incident_channel"],
};

const normalizeStatus = (value) => {
  const v = String(value || "new").toLowerCase();
  const allowed = ["new", "acknowledged", "in_progress", "mitigated", "resolved"];
  return allowed.includes(v) ? v : "new";
};

const normalizeSeverity = (value) => {
  const v = String(value || "").toLowerCase();
  const allowed = ["critical", "high", "medium", "low"];
  return allowed.includes(v) ? v : null;
};

const normalizeType = (value) => {
  const v = String(value || "").toLowerCase();
  const allowed = [
    "spend_anomaly",
    "forecast_budget_risk",
    "governance_control",
    "optimization_workflow",
    "commitment_risk",
  ];
  return allowed.includes(v) ? v : null;
};

const ownerRoutingContextFromUnit = (unitSummary) => {
  const allocationRows = Array.isArray(unitSummary?.allocation?.rows)
    ? unitSummary.allocation.rows
    : [];
  const sorted = [...allocationRows].sort((a, b) => n(b.totalCost) - n(a.totalCost));
  const top = sorted[0];
  const primaryOwner = String(top?.team || "governance-owner@kcx.example");
  return {
    primaryOwner,
    escalationChain: buildEscalationChain(primaryOwner),
    topTeams: sorted.slice(0, 5).map((row) => ({
      team: String(row.team || "Unassigned Team"),
      totalCost: roundTo(n(row.totalCost), 2),
      sharePct: roundTo(n(row.pctOfTotal), 2),
    })),
  };
};

const buildSpendAlerts = ({ anomalies = [], ownerContext, currency = "USD" }) => {
  return anomalies.map((item, index) => {
    const cost = n(item?.cost);
    const threshold = n(item?.threshold);
    const impactAmount = roundTo(Math.max(0, cost - threshold), 2);
    const impactPct = threshold > 0 ? roundTo((impactAmount / threshold) * 100, 2) : 0;
    const severity = severityFromImpact(impactAmount, impactPct);
    const confidenceScore = clamp(55 + impactPct * 1.2, 35, 95);
    const confidence = confidenceFromScore(confidenceScore);
    const detectedAt = item?.ChargePeriodStart
      ? new Date(item.ChargePeriodStart).toISOString()
      : detectionNow();
    const id = `alert-spend-${item?.id || index + 1}`;

    return {
      id,
      rootKey: `spend:${String(item?.ServiceName || "unknown").toLowerCase()}:${item?.ChargePeriodStart || "na"}`,
      status: "new",
      type: "spend_anomaly",
      subtype: "cost_spike",
      severity,
      confidence,
      confidenceScore: roundTo(confidenceScore, 2),
      detectedAt,
      scope: {
        provider: item?.ProviderName || "Unknown",
        service: item?.ServiceName || "Unknown Service",
        region: item?.RegionName || "Unknown",
        team: ownerContext.primaryOwner,
      },
      timeWindow: {
        start: item?.ChargePeriodStart || null,
        end: item?.ChargePeriodStart || null,
      },
      impact: {
        amount: impactAmount,
        pct: impactPct,
        currency,
        unitCostImpact: null,
      },
      probableRootCause: [
        `${item?.ServiceName || "Service"} exceeded anomaly threshold by ${impactAmount.toFixed(2)}`,
        "Baseline deviation against recent spend behavior",
      ],
      owner: {
        primary: ownerContext.primaryOwner,
        escalationChain: ownerContext.escalationChain,
        routingSource: "allocation_owner_mapping",
      },
      nextStep: "Open spend trend and compare with previous period, then create mitigation action if recurring.",
      deepLink: `${alertTypeToDestination.spend_anomaly}?service=${encodeURIComponent(item?.ServiceName || "All")}&region=${encodeURIComponent(item?.RegionName || "All")}`,
      ...withSla(detectedAt, severity),
    };
  });
};

const buildForecastAlerts = ({ forecastAlerts = [], ownerContext, currency = "USD" }) => {
  return forecastAlerts.map((item, index) => {
    const severity = normalizeSeverity(item?.severity) || "medium";
    const confidenceScore = severity === "critical" ? 88 : severity === "high" ? 82 : 72;
    const confidence = confidenceFromScore(confidenceScore);
    const detectedAt = detectionNow();
    const id = `alert-forecast-${item?.id || index + 1}`;

    return {
      id,
      rootKey: `forecast:${item?.type || "risk"}:${String(item?.scope || "global").toLowerCase()}`,
      status: normalizeStatus(item?.status || "new"),
      type: "forecast_budget_risk",
      subtype: item?.type || "budget_threshold",
      severity,
      confidence,
      confidenceScore,
      detectedAt,
      scope: {
        provider: "All",
        service: "All",
        region: "All",
        team: item?.owner || ownerContext.primaryOwner,
      },
      timeWindow: { start: null, end: null },
      impact: {
        amount: 0,
        pct: n(String(item?.current || "0").replace("%", "")),
        currency,
        unitCostImpact: null,
      },
      probableRootCause: [
        `Forecast control breach: ${item?.type || "budget risk"}`,
        `Current value ${item?.current || "n/a"} vs threshold ${item?.threshold || "n/a"}`,
      ],
      owner: {
        primary: item?.owner || ownerContext.primaryOwner,
        escalationChain: buildEscalationChain(item?.owner || ownerContext.primaryOwner),
        routingSource: "budget_owner_mapping",
      },
      nextStep: "Review Forecasting & Budgets control panel and mitigation ETA.",
      deepLink: alertTypeToDestination.forecast_budget_risk,
      ...withSla(detectedAt, severity),
    };
  });
};

const buildGovernanceAlerts = ({ topRisks = [], ownerContext, currency = "USD" }) => {
  const riskSeverity = (level) => {
    const l = String(level || "").toLowerCase();
    if (l === "red") return "high";
    if (l === "amber") return "medium";
    return "low";
  };

  return topRisks.map((risk, index) => {
    const severity = riskSeverity(risk.level);
    const confidenceScore = severity === "high" ? 86 : 74;
    const confidence = confidenceFromScore(confidenceScore);
    const detectedAt = detectionNow();

    return {
      id: `alert-governance-${risk.id || index + 1}`,
      rootKey: `governance:${risk.id || "risk"}:${String(risk.title || "").toLowerCase()}`,
      status: "new",
      type: "governance_control",
      subtype: risk.id || "governance_risk",
      severity,
      confidence,
      confidenceScore,
      detectedAt,
      scope: {
        provider: "All",
        service: "All",
        region: "All",
        team: risk.owner || ownerContext.primaryOwner,
      },
      timeWindow: { start: null, end: null },
      impact: {
        amount: roundTo(n(risk.impactedSpend), 2),
        pct: roundTo(n(risk.impactPct), 2),
        currency,
        unitCostImpact: null,
      },
      probableRootCause: [risk.title || "Governance control degradation"],
      owner: {
        primary: risk.owner || "governance-owner@kcx.example",
        escalationChain: buildEscalationChain(risk.owner || "governance-owner@kcx.example"),
        routingSource: "governance_owner",
      },
      nextStep: "Open Governance & Data Quality and execute top remediation steps.",
      deepLink: alertTypeToDestination.governance_control,
      ...withSla(detectedAt, severity),
    };
  });
};

const buildOptimizationAlerts = ({ actionCenter, ownerContext, currency = "USD" }) => {
  const model = actionCenter?.model || {};
  const executive = model?.executive || {};
  const alerts = [];

  if (n(executive?.overdueActions) > 0) {
    const detectedAt = detectionNow();
    const severity = n(executive.overdueActions) >= 5 ? "high" : "medium";
    alerts.push({
      id: "alert-optimization-overdue",
      rootKey: "optimization:overdue_actions",
      status: "new",
      type: "optimization_workflow",
      subtype: "overdue_actions",
      severity,
      confidence: "high",
      confidenceScore: 85,
      detectedAt,
      scope: { provider: "All", service: "All", region: "All", team: ownerContext.primaryOwner },
      timeWindow: { start: null, end: null },
      impact: {
        amount: roundTo(n(executive?.confidenceWeightedSavings), 2),
        pct: roundTo(n(executive?.optimizationOffsetPct), 2),
        currency,
        unitCostImpact: null,
      },
      probableRootCause: [`${executive.overdueActions} optimization actions overdue`],
      owner: {
        primary: ownerContext.primaryOwner,
        escalationChain: ownerContext.escalationChain,
        routingSource: "optimization_owner_board",
      },
      nextStep: "Open Optimization Action Center and clear overdue actions.",
      deepLink: alertTypeToDestination.optimization_workflow,
      ...withSla(detectedAt, severity),
    });
  }

  if (n(actionCenter?.commitmentGap?.onDemandPercentage) > 70) {
    const detectedAt = detectionNow();
    const severity = n(actionCenter.commitmentGap.onDemandPercentage) > 80 ? "high" : "medium";
    alerts.push({
      id: "alert-commitment-gap",
      rootKey: "commitment:coverage_gap",
      status: "new",
      type: "commitment_risk",
      subtype: "coverage_drop",
      severity,
      confidence: "medium",
      confidenceScore: 72,
      detectedAt,
      scope: { provider: "All", service: "All", region: "All", team: "finops-commitments@kcx.example" },
      timeWindow: { start: null, end: null },
      impact: {
        amount: roundTo(n(actionCenter?.commitmentGap?.potentialSavings), 2),
        pct: roundTo(n(actionCenter?.commitmentGap?.onDemandPercentage), 2),
        currency,
        unitCostImpact: null,
      },
      probableRootCause: ["Commitment coverage/utilization is below expected threshold"],
      owner: {
        primary: "finops-commitments@kcx.example",
        escalationChain: buildEscalationChain("finops-commitments@kcx.example"),
        routingSource: "commitment_owner",
      },
      nextStep: "Review commitments recommendations and purchase/reshape plan.",
      deepLink: alertTypeToDestination.commitment_risk,
      ...withSla(detectedAt, severity),
    });
  }

  return alerts;
};

const dedupeAlerts = (alerts = []) => {
  const byKey = new Map();
  alerts.forEach((alert) => {
    const existing = byKey.get(alert.rootKey);
    if (!existing) {
      byKey.set(alert.rootKey, alert);
      return;
    }
    const incomingRank = toSeverityRank(alert.severity);
    const currentRank = toSeverityRank(existing.severity);
    if (incomingRank > currentRank) {
      byKey.set(alert.rootKey, alert);
      return;
    }
    if (incomingRank === currentRank && n(alert.impact?.amount) > n(existing.impact?.amount)) {
      byKey.set(alert.rootKey, alert);
    }
  });
  return Array.from(byKey.values());
};

const applyFilters = (alerts, { severity, type, status }) => {
  const sev = normalizeSeverity(severity);
  const typ = normalizeType(type);
  const sts = status ? normalizeStatus(status) : null;
  return alerts.filter((alert) => {
    if (sev && alert.severity !== sev) return false;
    if (typ && alert.type !== typ) return false;
    if (sts && alert.status !== sts) return false;
    return true;
  });
};

const toNotificationPlan = (alert) => {
  const channels =
    defaultNotificationPolicy.realTimeSeverities.includes(alert.severity)
      ? ["email", "in_app", "enterprise_incident_channel"]
      : ["email", "in_app_digest"];
  return {
    mode: defaultNotificationPolicy.realTimeSeverities.includes(alert.severity)
      ? "realtime"
      : "digest",
    channels,
    recipients: alert.owner.escalationChain,
  };
};

const buildEmbeddedViews = (alerts = []) => {
  const pick = (predicate) => alerts.filter(predicate).slice(0, 3);
  return {
    spendAnalytics: {
      count: alerts.filter((a) => a.type === "spend_anomaly").length,
      top: pick((a) => a.type === "spend_anomaly"),
      deepLink: "/dashboard/cost-analysis",
    },
    costDrivers: {
      count: alerts.filter((a) => a.type === "spend_anomaly" || a.type === "forecast_budget_risk").length,
      top: pick((a) => a.type === "spend_anomaly" || a.type === "forecast_budget_risk"),
      deepLink: "/dashboard/cost-drivers",
    },
    allocationUnitEconomics: {
      count: alerts.filter((a) => a.type === "governance_control").length,
      top: pick((a) => a.type === "governance_control"),
      deepLink: "/dashboard/allocation-unit-economics",
    },
    optimization: {
      count: alerts.filter((a) => a.type === "optimization_workflow").length,
      top: pick((a) => a.type === "optimization_workflow"),
      deepLink: "/dashboard/optimization",
    },
    commitments: {
      count: alerts.filter((a) => a.type === "commitment_risk").length,
      top: pick((a) => a.type === "commitment_risk"),
      deepLink: "/dashboard/optimization",
    },
    governanceDataHealth: {
      count: alerts.filter((a) => a.type === "governance_control").length,
      top: pick((a) => a.type === "governance_control"),
      deepLink: "/dashboard/data-quality",
    },
    forecastingBudgets: {
      count: alerts.filter((a) => a.type === "forecast_budget_risk").length,
      top: pick((a) => a.type === "forecast_budget_risk"),
      deepLink: "/dashboard/forecasting-budgets",
    },
  };
};

const buildIncidentBundles = (alerts = []) => {
  const grouped = new Map();
  alerts.forEach((alert) => {
    const key = `${alert.type}:${alert.scope.team || "global"}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(alert);
  });
  return Array.from(grouped.entries()).map(([key, items], idx) => {
    const maxSeverity = [...items].sort((a, b) => toSeverityRank(b.severity) - toSeverityRank(a.severity))[0]?.severity || "low";
    return {
      id: `inc-${idx + 1}`,
      bundleKey: key,
      severity: maxSeverity,
      count: items.length,
      impactAmount: roundTo(items.reduce((sum, item) => sum + n(item.impact?.amount), 0), 2),
      owner: items[0]?.owner?.primary || "unassigned",
      status: items.some((item) => item.status !== "resolved") ? "open" : "resolved",
      alerts: items.map((item) => item.id),
    };
  });
};

export const alertsIncidentsService = {
  async getSummary({
    filters = {},
    uploadIds = [],
    period = "mtd",
    costBasis = "actual",
    severity = null,
    type = null,
    status = null,
    view = "full",
  } = {}) {
    if (!Array.isArray(uploadIds) || uploadIds.length === 0) {
      return {
        controls: { period: "mtd", costBasis: "actual", currency: "USD" },
        kpis: {
          totalOpenAlerts: 0,
          criticalAlerts: 0,
          highAlerts: 0,
          unresolvedSlaBreaches: 0,
          totalImpact: 0,
        },
        alerts: [],
        incidentBundles: [],
        embeddedViews: {},
        notificationCenter: {
          policy: defaultNotificationPolicy,
          queue: [],
          totalQueued: 0,
        },
        headerAnomalies: { count: 0, list: [] },
        message: "No scoped uploads selected.",
      };
    }

    const effectiveFilters = {
      provider: filters.provider || "All",
      service: filters.service || "All",
      region: filters.region || "All",
    };

    if (String(view).toLowerCase() === "header") {
      const overviewAnomalies = await dashboardService.getAnomalies(effectiveFilters, uploadIds);
      const list = Array.isArray(overviewAnomalies?.list) ? overviewAnomalies.list : [];
      return {
        controls: { period, costBasis, currency: "USD" },
        kpis: {
          totalOpenAlerts: 0,
          criticalAlerts: 0,
          highAlerts: 0,
          unresolvedSlaBreaches: 0,
          totalImpact: 0,
        },
        alerts: [],
        incidentBundles: [],
        embeddedViews: {},
        notificationCenter: { policy: defaultNotificationPolicy, queue: [], totalQueued: 0 },
        ownershipRouting: {
          source: "allocation_driven",
          primaryOwner: "governance-owner@kcx.example",
          escalationChain: [],
          topTeams: [],
        },
        headerAnomalies: {
          count: list.length,
          list: list.slice(0, 10),
        },
        message: "Header anomaly snapshot",
        generatedAt: detectionNow(),
      };
    }

    const [
      overviewAnomalies,
      spendAnalysis,
      governanceQuality,
      forecastSummary,
      actionCenter,
      unitSummary,
    ] = await Promise.all([
      dashboardService.getAnomalies(effectiveFilters, uploadIds),
      generateCostAnalysis({
        ...effectiveFilters,
        uploadIds,
        timeRange: period === "qtd" ? "90d" : period === "30d" || period === "90d" ? period : "30d",
        costBasis,
      }, "ServiceName").catch(() => null),
      dataQualityService.analyzeDataQuality({ filters: effectiveFilters, uploadIds }).catch(() => null),
      forecastingBudgetsService.getSummary({
        filters: effectiveFilters,
        uploadIds,
        period,
        compareTo: "previous_period",
        costBasis,
      }).catch(() => null),
      optimizationService.getActionCenter({
        filters: effectiveFilters,
        period: "last30days",
        uploadIds,
      }).catch(() => null),
      unitEconomicsService.getSummary({
        filters: effectiveFilters,
        period: period === "qtd" ? "90d" : period === "30d" || period === "90d" ? period : "month",
        compareTo: "previous_period",
        costBasis,
        uploadIds,
      }).catch(() => null),
    ]);

    const currency =
      forecastSummary?.controls?.currency ||
      governanceQuality?.governance?.currency ||
      "USD";

    const ownerContext = ownerRoutingContextFromUnit(unitSummary);

    const spendAnomalyList = Array.isArray(overviewAnomalies?.list)
      ? overviewAnomalies.list
      : [];
    const forecastAlertList = Array.isArray(forecastSummary?.submodules?.alertsEscalation?.alerts)
      ? forecastSummary.submodules.alertsEscalation.alerts
      : [];
    const governanceRiskList = Array.isArray(governanceQuality?.governance?.overview?.topRisks)
      ? governanceQuality.governance.overview.topRisks
      : [];

    const rawAlerts = [
      ...buildSpendAlerts({ anomalies: spendAnomalyList, ownerContext, currency }),
      ...buildForecastAlerts({ forecastAlerts: forecastAlertList, ownerContext, currency }),
      ...buildGovernanceAlerts({ topRisks: governanceRiskList, ownerContext, currency }),
      ...buildOptimizationAlerts({ actionCenter, ownerContext, currency }),
    ];

    let alerts = dedupeAlerts(rawAlerts).map((alert) => ({
      ...alert,
      notificationPlan: toNotificationPlan(alert),
    }));

    alerts = applyFilters(alerts, { severity, type, status }).sort((a, b) => {
      const s = toSeverityRank(b.severity) - toSeverityRank(a.severity);
      if (s !== 0) return s;
      return n(b.impact?.amount) - n(a.impact?.amount);
    });

    const now = Date.now();
    const unresolved = alerts.filter((alert) => alert.status !== "resolved");
    const unresolvedSlaBreaches = unresolved.filter(
      (alert) => new Date(alert.dueAt).getTime() < now,
    ).length;

    const kpis = {
      totalOpenAlerts: unresolved.length,
      criticalAlerts: unresolved.filter((alert) => alert.severity === "critical").length,
      highAlerts: unresolved.filter((alert) => alert.severity === "high").length,
      unresolvedSlaBreaches,
      totalImpact: roundTo(unresolved.reduce((sum, alert) => sum + n(alert.impact?.amount), 0), 2),
      confidenceLowCount: unresolved.filter((alert) => alert.confidence === "low").length,
      advisoryOnlyCount: unresolved.filter((alert) => alert.confidence === "low").length,
    };

    const queue = unresolved.map((alert) => ({
      alertId: alert.id,
      mode: alert.notificationPlan.mode,
      channels: alert.notificationPlan.channels,
      recipients: alert.notificationPlan.recipients,
      status: "queued",
      queuedAt: detectionNow(),
    }));

    const headerAnomalies = {
      count: alerts.filter((alert) => alert.type === "spend_anomaly").length,
      list: alerts
        .filter((alert) => alert.type === "spend_anomaly")
        .slice(0, 10)
        .map((alert) => ({
          id: alert.id,
          ServiceName: alert.scope.service,
          ProviderName: alert.scope.provider,
          RegionName: alert.scope.region,
          cost: roundTo(n(alert.impact.amount) + n(alert.impact.amount * 0.3), 2),
          ChargePeriodStart: alert.timeWindow.start || alert.detectedAt,
          threshold: roundTo(n(alert.impact.amount * 0.3), 2),
          severity: alert.severity,
        })),
    };

    return {
      controls: { period, costBasis, currency },
      kpis,
      alerts,
      incidentBundles: buildIncidentBundles(alerts),
      embeddedViews: buildEmbeddedViews(alerts),
      notificationCenter: {
        policy: defaultNotificationPolicy,
        queue,
        totalQueued: queue.length,
        routedOwners: Array.from(new Set(queue.flatMap((item) => item.recipients))).length,
      },
      ownershipRouting: {
        source: "allocation_driven",
        primaryOwner: ownerContext.primaryOwner,
        escalationChain: ownerContext.escalationChain,
        topTeams: ownerContext.topTeams,
      },
      anomalySignals: {
        spend: spendAnomalyList.length,
        forecast: forecastAlertList.length,
        governance: governanceRiskList.length,
        costAnalysisAnomalyHighlights:
          spendAnalysis?.spendAnalytics?.anomalyDetection?.highlights?.length || 0,
      },
      headerAnomalies,
      message: "Alerts generated from anomaly and control signals.",
      generatedAt: detectionNow(),
      formulaVersion: "alerts_incidents_v1",
    };
  },
};
