import type {
  AlertItem,
  BudgetItem,
  CostAlertsNormalizedData,
  DistributionItem,
} from "../types";

/**
 * Normalizes cost alerts data from backend to standardized format for UI components
 */
export const normalizeCostAlertsData = (rawData: Record<string, unknown> | null): CostAlertsNormalizedData => {
  if (!rawData) {
    return {
      alerts: [],
      budgetStatus: [],
      severityDistribution: [],
      statusDistribution: [],
      metadata: {
        isEmptyState: true
      }
    };
  }

  // Normalize alerts data
  const alertsSource = rawData["alerts"];
  const alerts = Array.isArray(alertsSource) 
    ? alertsSource.map((alert: AlertItem) => ({
        id: alert.id || Math.random().toString(36).substr(2, 9),
        title: alert.title || alert.name || 'Cost Alert',
        description: alert.description || alert.summary || '',
        severity: alert.severity || 'Medium',
        status: alert.status || 'Active',
        costImpact: Number(alert.costImpact) || Number(alert.impact) || 0,
        createdAt: alert.createdAt || alert.timestamp || new Date().toISOString(),
        resolvedAt: alert.resolvedAt || null,
        category: alert.category || 'general',
        provider: alert.provider || 'AWS',
        service: alert.service || 'EC2',
        region: alert.region || 'us-east-1'
      }))
    : [];

  // Normalize budget status data
  const budgetsSource = rawData["budgetStatus"];
  const budgetStatus = Array.isArray(budgetsSource) 
    ? budgetsSource.map((budget: BudgetItem) => ({
        id: budget.id || Math.random().toString(36).substr(2, 9),
        name: budget.name || budget.budgetName || 'Budget',
        status: budget.status || 'On Track',
        spent: Number(budget.spent) || Number(budget.currentSpend) || 0,
        budget: Number(budget.budget) || Number(budget.limit) || 0,
        percentage: Number(budget.percentage) || 
                   (Number(budget.spent) && Number(budget.budget) ? 
                    (Number(budget.spent) / Number(budget.budget)) * 100 : 0),
        remaining: Number(budget.remaining) || 
                  (Number(budget.budget) - Number(budget.spent)) || 0,
        threshold: Number(budget.threshold) || 0,
        lastUpdated: budget.lastUpdated || budget.updatedAt || new Date().toISOString()
      }))
    : [];

  // Calculate severity distribution
  const severityCounts = alerts.reduce<Record<string, number>>((acc, alert) => {
    const severity = alert.severity || 'Unknown';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  const severityDistribution = Object.entries(severityCounts).map(([name, count]): DistributionItem => ({
    name,
    count
  }));

  // Calculate status distribution
  const statusCounts = alerts.reduce<Record<string, number>>((acc, alert) => {
    const status = alert.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusDistribution = Object.entries(statusCounts).map(([name, count]): DistributionItem => ({
    name,
    count
  }));

  return {
    alerts,
    budgetStatus,
    severityDistribution,
    statusDistribution,
    metadata: {
      isEmptyState: alerts.length === 0 && budgetStatus.length === 0
    }
  };
};
