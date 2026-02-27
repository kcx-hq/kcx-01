/**
 * Normalizes optimization data from backend to standardized format for UI components
 */
import type {
  ClientCNormalizedOptimizationData,
  ClientCOpportunity,
  ClientCOptimizationPayload,
  ClientCOptimizationRawItem,
  ClientCRightSizingRecommendation,
  ClientCIdleResource,
} from "../types";

export const normalizeOptimizationData = (
  rawData: ClientCOptimizationPayload | null | undefined,
): ClientCNormalizedOptimizationData => {
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
    ? rawData.opportunities.map((opp: ClientCOptimizationRawItem): ClientCOpportunity => ({
        id: opp.id || Math.random().toString(36).substr(2, 9),
        title: opp.title || opp.name || 'Opportunity',
        description: opp.description || opp.summary || '',
        savings: Number(opp.savings) || Number(opp.monthlySavings) || 0,
        category: opp.category || opp.type || 'General',
        priority: opp.priority || 'medium',
        type: opp.type || 'optimization',
        status: opp.status || 'open'
      }))
    : [];

  // Normalize idle resources
  const idleResources = Array.isArray(rawData.idleResources) 
    ? rawData.idleResources.map((resource: ClientCOptimizationRawItem): ClientCIdleResource => ({
        id: resource.id || resource.resourceId || Math.random().toString(36).substr(2, 9),
        name: resource.name || resource.resourceName || 'Unnamed Resource',
        type: resource.type || resource.resourceType || 'Unknown',
        provider: resource.provider || 'AWS',
        region: resource.region || 'Global',
        savings: Number(resource.savings) || Number(resource.monthlySavings) || 0,
        daysIdle: Number(resource.daysIdle) || 0,
        risk: resource.environment || resource.risk || 'Prod',
        status: resource.status || 'active',
        tags: Array.isArray(resource.tags) ? resource.tags : [],
        description: resource.description || ''
      }))
    : [];

  // Normalize right-sizing recommendations
  const rightSizingRecs = Array.isArray(rawData.rightSizingRecs) 
    ? rawData.rightSizingRecs.map((rec: ClientCOptimizationRawItem): ClientCRightSizingRecommendation => ({
        id: rec.id || Math.random().toString(36).substr(2, 9),
        resourceName: rec.resourceName || rec.name || 'Resource',
        currentSize: rec.currentSize || rec.currentInstanceType || 'Unknown',
        recommendedSize: rec.recommendedSize || rec.recommendedInstanceType || 'Unknown',
        potentialSavings: Number(rec.potentialSavings) || Number(rec.monthlySavings) || 0,
        cpuUtilization: Number(rec.cpuUtilization) || Number(rec.cpuAvg) || 0,
        memoryUtilization: Number(rec.memoryUtilization) || Number(rec.memoryAvg) || 0,
        resourceType: rec.resourceType || 'instance',
        recommendationType: rec.recommendationType || 'resize'
      }))
    : [];

  // Calculate total potential savings
  const totalPotentialSavings = opportunities.reduce((sum: number, opp: ClientCOpportunity) => sum + (opp.savings || 0), 0);

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
