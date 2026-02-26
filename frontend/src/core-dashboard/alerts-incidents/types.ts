export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertConfidence = "high" | "medium" | "low";
export type AlertStatus = "new" | "acknowledged" | "in_progress" | "mitigated" | "resolved";
export type AlertType =
  | "spend_anomaly"
  | "forecast_budget_risk"
  | "governance_control"
  | "optimization_workflow"
  | "commitment_risk";

export interface AlertsIncidentsControls {
  period: "mtd" | "qtd" | "30d" | "90d";
  costBasis: "actual" | "amortized" | "net";
  severity: "" | AlertSeverity;
  type: "" | AlertType;
  status: "" | AlertStatus;
}

export interface AlertRow {
  id: string;
  type: AlertType;
  subtype: string;
  severity: AlertSeverity;
  confidence: AlertConfidence;
  status: AlertStatus;
  detectedAt: string;
  scope: {
    provider: string;
    service: string;
    region: string;
    team: string;
  };
  impact: {
    amount: number;
    pct: number;
    currency: string;
    unitCostImpact: number | null;
  };
  probableRootCause: string[];
  owner: {
    primary: string;
    escalationChain: string[];
    routingSource: string;
  };
  nextStep: string;
  deepLink: string;
  dueAt: string;
  hours: number;
}

export interface AlertsIncidentsPayload {
  controls: {
    period: string;
    costBasis: string;
    currency: string;
  };
  kpis: {
    totalOpenAlerts: number;
    criticalAlerts: number;
    highAlerts: number;
    unresolvedSlaBreaches: number;
    totalImpact: number;
    confidenceLowCount?: number;
    advisoryOnlyCount?: number;
  };
  alerts: AlertRow[];
  incidentBundles: Array<{
    id: string;
    severity: AlertSeverity;
    count: number;
    impactAmount: number;
    owner: string;
    status: string;
    alerts: string[];
  }>;
  embeddedViews: Record<
    string,
    {
      count: number;
      top: AlertRow[];
      deepLink: string;
    }
  >;
  notificationCenter: {
    policy: {
      realTimeSeverities: string[];
      digestSeverities: string[];
      channels: string[];
    };
    queue: Array<{
      alertId: string;
      mode: string;
      channels: string[];
      recipients: string[];
      status: string;
      queuedAt: string;
    }>;
    totalQueued: number;
    routedOwners?: number;
  };
  ownershipRouting: {
    source: string;
    primaryOwner: string;
    escalationChain: string[];
    topTeams: Array<{ team: string; totalCost: number; sharePct: number }>;
  };
  headerAnomalies: {
    count: number;
    list: Array<{
      id: string;
      ServiceName: string;
      ProviderName: string;
      RegionName: string;
      cost: number;
      ChargePeriodStart: string;
      threshold: number;
      severity: string;
    }>;
  };
}

