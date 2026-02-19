/**
 * Normalizes cost alerts data from backend to standardized format for UI components
 */
export const normalizeCostAlertsData = (rawData) => {
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
  const alerts = Array.isArray(rawData.alerts) 
    ? rawData.alerts.map(alert => ({
        id: alert.id || Math.random().toString(36).substr(2, 9),
        title: alert.title || alert.name || 'Cost Alert',
        description: alert.description || alert.summary || '',
        severity: alert.severity || 'Medium',
        status: alert.status || 'Active',
        costImpact: parseFloat(alert.costImpact) || parseFloat(alert.impact) || 0,
        createdAt: alert.createdAt || alert.timestamp || new Date().toISOString(),
        resolvedAt: alert.resolvedAt || null,
        category: alert.category || 'general',
        provider: alert.provider || 'AWS',
        service: alert.service || 'EC2',
        region: alert.region || 'us-east-1'
      }))
    : [];

  // Normalize budget status data
  const budgetStatus = Array.isArray(rawData.budgetStatus) 
    ? rawData.budgetStatus.map(budget => ({
        id: budget.id || Math.random().toString(36).substr(2, 9),
        name: budget.name || budget.budgetName || 'Budget',
        status: budget.status || 'On Track',
        spent: parseFloat(budget.spent) || parseFloat(budget.currentSpend) || 0,
        budget: parseFloat(budget.budget) || parseFloat(budget.limit) || 0,
        percentage: parseFloat(budget.percentage) || 
                   (parseFloat(budget.spent) && parseFloat(budget.budget) ? 
                    (parseFloat(budget.spent) / parseFloat(budget.budget)) * 100 : 0),
        remaining: parseFloat(budget.remaining) || 
                  (parseFloat(budget.budget) - parseFloat(budget.spent)) || 0,
        threshold: parseFloat(budget.threshold) || 0,
        lastUpdated: budget.lastUpdated || budget.updatedAt || new Date().toISOString()
      }))
    : [];

  // Calculate severity distribution
  const severityCounts = alerts.reduce((acc, alert) => {
    const severity = alert.severity || 'Unknown';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  const severityDistribution = Object.entries(severityCounts).map(([name, count]) => ({
    name,
    count
  }));

  // Calculate status distribution
  const statusCounts = alerts.reduce((acc, alert) => {
    const status = alert.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusDistribution = Object.entries(statusCounts).map(([name, count]) => ({
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