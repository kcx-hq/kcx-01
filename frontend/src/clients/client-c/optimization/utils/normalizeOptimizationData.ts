/**
 * Normalizes optimization data from backend to standardized format for UI components
 */
export const normalizeOptimizationData = (rawData) => {
  if (!rawData) {
    return {
      opportunities: [],
      idleResources: [],
      rightSizingRecs: [],
      totalPotentialSavings: 0,
      metadata: {
        isEmptyState: true
      }
    };
  }

  // Normalize opportunities
  const opportunities = Array.isArray(rawData.opportunities) 
    ? rawData.opportunities.map(opp => ({
        id: opp.id || Math.random().toString(36).substr(2, 9),
        title: opp.title || opp.name || 'Opportunity',
        description: opp.description || opp.summary || '',
        savings: parseFloat(opp.savings) || parseFloat(opp.monthlySavings) || 0,
        category: opp.category || opp.type || 'General',
        priority: opp.priority || 'medium',
        type: opp.type || 'optimization',
        status: opp.status || 'open'
      }))
    : [];

  // Normalize idle resources
  const idleResources = Array.isArray(rawData.idleResources) 
    ? rawData.idleResources.map(resource => ({
        id: resource.id || resource.resourceId || Math.random().toString(36).substr(2, 9),
        name: resource.name || resource.resourceName || 'Unnamed Resource',
        type: resource.type || resource.resourceType || 'Unknown',
        provider: resource.provider || 'AWS',
        region: resource.region || 'Global',
        savings: parseFloat(resource.savings) || parseFloat(resource.monthlySavings) || 0,
        daysIdle: parseInt(resource.daysIdle) || 0,
        risk: resource.environment || resource.risk || 'Prod',
        status: resource.status || 'active',
        tags: Array.isArray(resource.tags) ? resource.tags : [],
        description: resource.description || ''
      }))
    : [];

  // Normalize right-sizing recommendations
  const rightSizingRecs = Array.isArray(rawData.rightSizingRecs) 
    ? rawData.rightSizingRecs.map(rec => ({
        id: rec.id || Math.random().toString(36).substr(2, 9),
        resourceName: rec.resourceName || rec.name || 'Resource',
        currentSize: rec.currentSize || rec.currentInstanceType || 'Unknown',
        recommendedSize: rec.recommendedSize || rec.recommendedInstanceType || 'Unknown',
        potentialSavings: parseFloat(rec.potentialSavings) || parseFloat(rec.monthlySavings) || 0,
        cpuUtilization: parseFloat(rec.cpuUtilization) || parseFloat(rec.cpuAvg) || 0,
        memoryUtilization: parseFloat(rec.memoryUtilization) || parseFloat(rec.memoryAvg) || 0,
        resourceType: rec.resourceType || 'instance',
        recommendationType: rec.recommendationType || 'resize'
      }))
    : [];

  // Calculate total potential savings
  const totalPotentialSavings = opportunities.reduce((sum, opp) => sum + (opp.savings || 0), 0);

  return {
    opportunities,
    idleResources,
    rightSizingRecs,
    totalPotentialSavings,
    metadata: {
      isEmptyState: opportunities.length === 0 && 
                   idleResources.length === 0 && 
                   rightSizingRecs.length === 0
    }
  };
};