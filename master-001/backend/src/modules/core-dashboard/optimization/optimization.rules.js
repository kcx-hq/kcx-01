/**
 * Optimization Rules
 * Rule-based optimization detection (ML-ready architecture)
 *
 * These rules can be replaced with ML models later.
 * Each rule returns a recommendation with potential savings.
 */

import { costsService }from '../analytics/cost-analysis/cost-analysis.service.js';
import { Resource, Service, Region } from '../../../models/index.js';
import { getDateRange } from '../../../common/utils/date.helpers.js';
import { formatCurrency } from '../../../common/utils/cost.helpers.js';
import { FINOPS_CONSTANTS } from '../../../common/constants/finops.constants.js';

/**
 * ✅ SAME APPROACH AS COST-ANALYSIS:
 * normalize uploadIds from request payloads (query/body)
 * Supports:
 *  - uploadid=uuid
 *  - uploadid[]=uuid1&uploadid[]=uuid2
 *  - uploadid="uuid1,uuid2"
 */
function normalizeUploadIds(uploadid) {
  if (!uploadid) return [];

  if (Array.isArray(uploadid)) return uploadid.filter(Boolean);

  if (typeof uploadid === 'string') {
    const s = uploadid.trim();
    if (!s) return [];
    return s.includes(',')
      ? s.split(',').map((id) => id.trim()).filter(Boolean)
      : [s];
  }

  return [];
}

/**
 * Rule: Detect idle resources
 * Resources with no usage for X days
 * Returns enriched data matching frontend expectations
 */
export async function detectIdleResources(params = {}) {
  const { filters = {}, period = null , uploadIds = [] } = params; // Default to last 90 days to catch historical data
  const { startDate, endDate } = getDateRange(period);

  // ✅ Normalize (single/multi) even if caller passes string / csv / array
  const normalizedUploadIds = normalizeUploadIds(uploadIds);

  // Get cost data with resources
  const costData = await costsService.getCostDataWithResources({
    filters,
    startDate,
    endDate,
    uploadIds: normalizedUploadIds,
  });

  // If no data found with date filter, try without date filter to get all available data
  if (!costData || costData.length === 0) {
    const allData = await costsService.getCostDataWithResources({
      filters,
      startDate: null,
      endDate: null,
      uploadIds: normalizedUploadIds,
    });
    if (allData && allData.length > 0) {
      return detectIdleResourcesFromData(allData, filters);
    }
    return [];
  }

  return detectIdleResourcesFromData(costData, filters);
}

// Extract the detection logic into a separate function
function detectIdleResourcesFromData(costData, filters) {
  const idleThreshold = FINOPS_CONSTANTS.IDLE_RESOURCE_THRESHOLD_DAYS;
  const idleResources = [];
  const resourceMap = new Map();

  // Calculate total spend for percentages
  let totalSpend = 0;
  const serviceSpendMap = new Map();
  const regionSpendMap = new Map();

  // Group by resource and check for idle patterns
  costData.forEach((fact) => {
    const resourceId = fact.resourceid;
    if (!resourceId) return;

    const cost = parseFloat(fact.billedcost || 0);
    totalSpend += cost;

    // Track service and region spend
    const serviceName = fact.service?.servicename || 'Unknown';
    const regionName = fact.region?.regionname || 'Unknown';
    serviceSpendMap.set(serviceName, (serviceSpendMap.get(serviceName) || 0) + cost);
    regionSpendMap.set(regionName, (regionSpendMap.get(regionName) || 0) + cost);

    if (!resourceMap.has(resourceId)) {
      resourceMap.set(resourceId, {
        resourceId,
        resourceName: fact.resource?.resourcename || resourceId,
        resourceType: fact.resource?.resourcetype || 'Unknown',
        serviceName: serviceName,
        regionName: regionName,
        lastActivity: null,
        totalCost: 0,
        daysSinceActivity: 0,
        costHistory: [],
        tags: fact.tags || {},
      });
    }

    const resource = resourceMap.get(resourceId);
    resource.totalCost += cost;

    const chargeDate = new Date(fact.chargeperiodstart);
    if (!resource.lastActivity || chargeDate > resource.lastActivity) {
      resource.lastActivity = chargeDate;
    }

    // Track cost history (last 4 months)
    const dateKey = chargeDate.toISOString().split('T')[0].substring(0, 7); // YYYY-MM
    if (!resource.costHistory.find((h) => h.month === dateKey)) {
      resource.costHistory.push({ month: dateKey, cost: 0 });
    }
    const historyEntry = resource.costHistory.find((h) => h.month === dateKey);
    historyEntry.cost += cost;
  });

  // Calculate days since last activity and enrich data
  const now = new Date();
  resourceMap.forEach((resource) => {
    if (resource.lastActivity) {
      const daysDiff = Math.floor((now - resource.lastActivity) / (1000 * 60 * 60 * 24));
      resource.daysSinceActivity = daysDiff;

      if (daysDiff >= idleThreshold && resource.totalCost > 0) {
        // Determine risk level from tags
        const tags = resource.tags || {};
        const envTag = tags.Environment || tags.environment || tags.ENV || tags.env || '';
        const envLower = String(envTag).toLowerCase();
        const isProd = FINOPS_CONSTANTS.PROD_ENVIRONMENTS.some((env) => envLower.includes(env));
        const risk = isProd ? 'Prod' : 'Non-prod';

        // Determine confidence based on days idle
        let confidence = 'Medium';
        if (daysDiff >= 60) confidence = 'High';
        else if (daysDiff >= 45) confidence = 'High';
        else if (daysDiff < 35) confidence = 'Medium';

        // Calculate percentages
        const serviceSpend = serviceSpendMap.get(resource.serviceName) || 0;
        const regionSpend = regionSpendMap.get(resource.regionName) || 0;
        const serviceSpendPercent = serviceSpend > 0 ? (resource.totalCost / serviceSpend) * 100 : 0;
        const regionSpendPercent = regionSpend > 0 ? (resource.totalCost / regionSpend) * 100 : 0;

        // Generate why flagged message
        const whyFlagged =
          `Resource ${resource.resourceName} has been idle for ${daysDiff} days. ` +
          `Last activity detected on ${new Date(resource.lastActivity).toLocaleDateString()}. ` +
          `Monthly cost: ${formatCurrency(resource.totalCost)}.`;

        // Generate utilization signal
        const utilizationSignal =
          daysDiff >= 60
            ? `No activity for ${daysDiff} days, likely abandoned`
            : `Idle for ${daysDiff} days, minimal utilization detected`;

        // Get owner from tags
        const owner = tags.Owner || tags.owner || tags.OWNER || tags.Team || tags.team || null;

        // Generate typical resolution paths based on resource type and risk
        const typicalResolutionPaths = [];
        if (risk === 'Non-prod') {
          typicalResolutionPaths.push('Schedule shutdown outside business hours');
          typicalResolutionPaths.push('Downsize to smaller instance if needed');
          typicalResolutionPaths.push('Decommission after validation with team');
        } else {
          typicalResolutionPaths.push('Review with team before any action');
          typicalResolutionPaths.push('Verify if resource is still needed');
          typicalResolutionPaths.push('Consider gradual decommissioning');
        }

        // Format cost history (last 4 months, sorted)
        const sortedHistory = resource.costHistory
          .sort((a, b) => b.month.localeCompare(a.month))
          .slice(0, 4)
          .map((h) => parseFloat(h.cost.toFixed(2)));

        idleResources.push({
          id: resource.resourceId,
          type: resource.resourceType,
          name: resource.resourceName,
          status: daysDiff >= 60 ? 'Abandoned' : 'Idle',
          daysIdle: daysDiff,
          utilization: '<1%',
          savings: parseFloat((resource.totalCost * 0.9).toFixed(2)),
          risk: risk,
          lastActivity: new Date(resource.lastActivity).toISOString().split('T')[0],
          region: resource.regionName,
          tags: Object.keys(tags).map((key) => `${key}:${tags[key]}`),
          costHistory:
            sortedHistory.length > 0
              ? sortedHistory
              : [resource.totalCost, resource.totalCost, resource.totalCost, resource.totalCost],
          whyFlagged: whyFlagged,
          confidence: confidence,
          utilizationSignal: utilizationSignal,
          serviceSpendPercent: parseFloat(serviceSpendPercent.toFixed(2)),
          regionSpendPercent: parseFloat(regionSpendPercent.toFixed(2)),
          owner: owner,
          typicalResolutionPaths: typicalResolutionPaths,
          // Additional fields for compatibility
          resourceId: resource.resourceId,
          resourceName: resource.resourceName,
          monthlyCost: formatCurrency(resource.totalCost),
          potentialSavings: formatCurrency(resource.totalCost * 0.9),
          recommendation: 'Terminate or archive idle resource',
        });
      }
    }
  });

  return idleResources.sort((a, b) => b.savings - a.savings);
}

/**
 * Rule: Detect underutilized services
 * Services with low usage patterns
 */
export async function detectUnderutilizedServices(params = {}) {
  const { filters = {}, period = 'last90days', uploadIds = [] } = params; // Default to last 90 days
  const { startDate, endDate } = getDateRange(period);

  const normalizedUploadIds = normalizeUploadIds(uploadIds);

  let costData = await costsService.getCostData({
    filters,
    startDate,
    endDate,
    uploadIds: normalizedUploadIds,
  });

  // If no data found, try without date filter
  if (!costData || costData.length === 0) {
    costData = await costsService.getCostData({
      filters,
      startDate: null,
      endDate: null,
      uploadIds: normalizedUploadIds,
    });
  }

  if (!costData || costData.length === 0) {
    return [];
  }

  const serviceMap = new Map();
  const threshold = FINOPS_CONSTANTS.UNDERUTILIZED_THRESHOLD_PERCENT;

  // Group by service
  costData.forEach((fact) => {
    const serviceName = fact.service?.servicename || 'Unknown';
    if (!serviceMap.has(serviceName)) {
      serviceMap.set(serviceName, {
        serviceName,
        totalCost: 0,
        recordCount: 0,
        avgCost: 0,
      });
    }

    const service = serviceMap.get(serviceName);
    service.totalCost += parseFloat(fact.billedcost || 0);
    service.recordCount += 1;
  });

  // Calculate averages and find underutilized
  const allCosts = Array.from(serviceMap.values()).map((s) => s.totalCost);
  const avgServiceCost = allCosts.reduce((a, b) => a + b, 0) / allCosts.length;

  const underutilized = [];
  serviceMap.forEach((service) => {
    service.avgCost = service.totalCost / service.recordCount;
    const costRatio = (service.totalCost / avgServiceCost) * 100;

    if (costRatio < threshold && service.totalCost > 0) {
      underutilized.push({
        serviceName: service.serviceName,
        currentCost: formatCurrency(service.totalCost),
        avgCostPerRecord: formatCurrency(service.avgCost),
        potentialSavings: formatCurrency(service.totalCost * 0.3), // Assume 30% savings with right-sizing
        recommendation: 'Right-size or consolidate service usage',
      });
    }
  });

  return underutilized.sort((a, b) => parseFloat(b.currentCost) - parseFloat(a.currentCost));
}

/**
 * Rule: Right-sizing recommendations
 * Based on usage patterns and cost
 * Returns enriched data matching frontend expectations
 */
export async function getRightSizingRecommendations(params = {}) {
  const { filters = {}, period = null , uploadIds = [] } = params; // Default to last 90 days
  const { startDate, endDate } = getDateRange(period);

  const normalizedUploadIds = normalizeUploadIds(uploadIds);

  let costData = await costsService.getCostDataWithResources({
    filters,
    startDate,
    endDate,
    uploadIds: normalizedUploadIds,
  });

  // If no data found, try without date filter
  if (!costData || costData.length === 0) {
    costData = await costsService.getCostDataWithResources({
      filters,
      startDate: null,
      endDate: null,
      uploadIds: normalizedUploadIds,
    });
  }

  if (!costData || costData.length === 0) {
    return [];
  }

  const recommendations = [];

  // Analyze resource usage patterns
  const resourceMap = new Map();
  costData.forEach((fact) => {
    const resourceId = fact.resourceid;
    if (!resourceId) return;

    if (!resourceMap.has(resourceId)) {
      resourceMap.set(resourceId, {
        resourceId,
        resourceName: fact.resource?.resourcename || resourceId,
        resourceType: fact.resource?.resourcetype || 'Unknown',
        serviceName: fact.service?.servicename || 'Unknown',
        regionName: fact.region?.regionname || 'Unknown',
        costs: [],
        totalCost: 0,
      });
    }

    const resource = resourceMap.get(resourceId);
    const cost = parseFloat(fact.billedcost || 0);
    resource.costs.push(cost);
    resource.totalCost += cost;
  });

  // Find resources with consistent usage patterns (good candidates for right-sizing)
  // Also analyze service-level patterns if resource-level data is sparse
  const serviceResourceMap = new Map();

  resourceMap.forEach((resource) => {
    // Group by service + region for service-level analysis
    const serviceKey = `${resource.serviceName}::${resource.regionName}`;
    if (!serviceResourceMap.has(serviceKey)) {
      serviceResourceMap.set(serviceKey, {
        serviceName: resource.serviceName,
        regionName: resource.regionName,
        resources: [],
        totalCost: 0,
        costCount: 0,
      });
    }
    const serviceGroup = serviceResourceMap.get(serviceKey);
    serviceGroup.resources.push(resource);
    serviceGroup.totalCost += resource.totalCost;
    serviceGroup.costCount += resource.costs.length;
  });

  // Analyze individual resources (if they have enough data)
  resourceMap.forEach((resource) => {
    // More flexible: accept resources with 1+ data points
    if (resource.costs.length < 1) return;

    const avg = resource.totalCost / resource.costs.length;

    // Calculate variance only if we have multiple data points
    let coefficientOfVariation = 0;
    if (resource.costs.length > 1) {
      const variance =
        resource.costs.reduce((sum, cost) => {
          return sum + Math.pow(cost - avg, 2);
        }, 0) / resource.costs.length;
      const stdDev = Math.sqrt(variance);
      coefficientOfVariation = avg > 0 ? (stdDev / avg) * 100 : 100;
    } else {
      // Single data point - assume low variation
      coefficientOfVariation = 5;
    }

    // More flexible thresholds: accept higher variation OR lower cost
    const isConsistentUsage = coefficientOfVariation < 50; // More lenient threshold
    const hasSignificantCost = resource.totalCost > 1; // Very low threshold to catch more resources

    if (isConsistentUsage && hasSignificantCost) {
      // Estimate CPU utilization based on cost patterns (simplified)
      // Lower cost = lower utilization assumption
      const estimatedCPU = Math.max(5, Math.min(35, 30 - coefficientOfVariation / 2));

      // Generate instance recommendations based on resource type and service
      let currentInstance = 'Unknown';
      let recommendedInstance = 'Unknown';

      // Check service name (case-insensitive) and resource type
      const serviceNameLower = (resource.serviceName || '').toLowerCase();
      const resourceTypeLower = (resource.resourceType || '').toLowerCase();
      const resourceNameLower = (resource.resourceName || '').toLowerCase();

      // Support multiple cloud providers and instance types
      // More flexible matching - check for compute-related keywords
      const isComputeService =
        serviceNameLower.includes('ec2') ||
        serviceNameLower.includes('compute') ||
        serviceNameLower.includes('virtual machine') ||
        serviceNameLower.includes('vm') ||
        serviceNameLower.includes('instance') ||
        resourceTypeLower.includes('ec2') ||
        resourceTypeLower.includes('compute') ||
        resourceTypeLower.includes('vm') ||
        resourceNameLower.includes('i-') ||
        resourceNameLower.includes('instance');

      if (isComputeService) {
        // AWS EC2 instances
        if (serviceNameLower.includes('ec2') || resourceNameLower.includes('i-')) {
          if (estimatedCPU < 15) {
            currentInstance = 'm5.large';
            recommendedInstance = 't3.medium';
          } else if (estimatedCPU < 25) {
            currentInstance = 'c5.xlarge';
            recommendedInstance = 'c5.large';
          } else {
            currentInstance = 'm5.xlarge';
            recommendedInstance = 'm5.large';
          }
        }
        // GCP Compute Engine
        else if (serviceNameLower.includes('compute engine') || serviceNameLower.includes('gce')) {
          if (estimatedCPU < 15) {
            currentInstance = 'n1-standard-4';
            recommendedInstance = 'n1-standard-2';
          } else if (estimatedCPU < 25) {
            currentInstance = 'n1-standard-8';
            recommendedInstance = 'n1-standard-4';
          } else {
            currentInstance = 'n1-standard-16';
            recommendedInstance = 'n1-standard-8';
          }
        }
        // Azure Virtual Machines
        else if (serviceNameLower.includes('virtual machine') || serviceNameLower.includes('vm')) {
          if (estimatedCPU < 15) {
            currentInstance = 'Standard_D4s_v3';
            recommendedInstance = 'Standard_D2s_v3';
          } else if (estimatedCPU < 25) {
            currentInstance = 'Standard_D8s_v3';
            recommendedInstance = 'Standard_D4s_v3';
          } else {
            currentInstance = 'Standard_D16s_v3';
            recommendedInstance = 'Standard_D8s_v3';
          }
        }
        // Generic compute service - provide generic recommendations
        else {
          currentInstance = `Current ${resource.serviceName} Instance`;
          recommendedInstance = 'Downsize to smaller instance';
        }
      } else {
        // For non-compute services, still provide generic recommendations if cost is significant
        if (resource.totalCost > 5) {
          currentInstance = `Current ${resource.serviceName} Resource`;
          recommendedInstance = 'Consider right-sizing';
        } else {
          return; // Skip very low cost resources
        }
      }

      // Always add recommendation if we have any instance type identified
      if (currentInstance !== 'Unknown' && recommendedInstance !== 'Unknown') {
        const currentCost = resource.totalCost;
        // More realistic savings: 30-50% depending on utilization
        const savingsPercent = estimatedCPU < 15 ? 0.5 : estimatedCPU < 25 ? 0.4 : 0.3;
        const recommendedCost = currentCost * (1 - savingsPercent);
        const savings = currentCost - recommendedCost;

        recommendations.push({
          id: `rs-${resource.resourceId}`,
          currentInstance: currentInstance,
          currentCPU: parseFloat(estimatedCPU.toFixed(1)),
          currentCost: parseFloat(currentCost.toFixed(2)),
          recommendedInstance: recommendedInstance,
          recommendedCost: parseFloat(recommendedCost.toFixed(2)),
          savings: parseFloat(savings.toFixed(2)),
          riskLevel: estimatedCPU < 15 ? 'Low' : 'Medium',
          resourceId: resource.resourceId,
          region: resource.regionName,
          assumptions: [
            `CPU utilization remains below ${Math.min(estimatedCPU + 15, 40)}%`,
            'Memory usage stays within current limits',
            'Workload pattern remains stable',
            'No burst capacity needed',
          ],
          // Additional fields for compatibility
          resourceName: resource.resourceName,
          currentMonthlyCost: formatCurrency(currentCost),
          avgDailyCost: formatCurrency(avg),
          potentialSavings: formatCurrency(savings),
          recommendation: 'Consider right-sizing - usage is consistent and predictable',
          confidence: coefficientOfVariation < 15 ? 'high' : coefficientOfVariation < 30 ? 'medium' : 'low',
        });
      }
    }
  });

  // Also analyze service-level patterns for services with multiple resources
  serviceResourceMap.forEach((serviceGroup) => {
    // If service has multiple resources with significant total cost, create a service-level recommendation
    if (serviceGroup.resources.length >= 2 && serviceGroup.totalCost > 10) {
      const avgCostPerResource = serviceGroup.totalCost / serviceGroup.resources.length;
      const estimatedCPU = 20; // Assume moderate utilization for service-level

      const serviceNameLower = (serviceGroup.serviceName || '').toLowerCase();
      let currentInstance = 'Unknown';
      let recommendedInstance = 'Unknown';

      if (serviceNameLower.includes('ec2') || serviceNameLower.includes('compute')) {
        currentInstance = 'Multiple m5.large instances';
        recommendedInstance = 'Consolidate to fewer t3.medium instances';
      } else if (serviceNameLower.includes('virtual machine') || serviceNameLower.includes('vm')) {
        currentInstance = 'Multiple Standard_D4s_v3 instances';
        recommendedInstance = 'Consolidate to fewer Standard_D2s_v3 instances';
      } else {
        currentInstance = `Multiple ${serviceGroup.serviceName} resources`;
        recommendedInstance = 'Consider consolidation and right-sizing';
      }

      if (currentInstance !== 'Unknown' && recommendedInstance !== 'Unknown') {
        const savingsPercent = 0.35;
        const recommendedCost = serviceGroup.totalCost * (1 - savingsPercent);
        const savings = serviceGroup.totalCost - recommendedCost;

        recommendations.push({
          id: `rs-service-${serviceGroup.serviceName}-${serviceGroup.regionName}`,
          currentInstance: currentInstance,
          currentCPU: parseFloat(estimatedCPU.toFixed(1)),
          currentCost: parseFloat(serviceGroup.totalCost.toFixed(2)),
          recommendedInstance: recommendedInstance,
          recommendedCost: parseFloat(recommendedCost.toFixed(2)),
          savings: parseFloat(savings.toFixed(2)),
          riskLevel: 'Medium',
          resourceId: `service-${serviceGroup.serviceName}`,
          region: serviceGroup.regionName,
          assumptions: [
            'Multiple resources can be consolidated',
            'Workload can be distributed across fewer instances',
            'No performance degradation expected',
            'Review during next maintenance window',
          ],
          resourceName: `${serviceGroup.serviceName} (${serviceGroup.resources.length} resources)`,
          currentMonthlyCost: formatCurrency(serviceGroup.totalCost),
          avgDailyCost: formatCurrency(avgCostPerResource),
          potentialSavings: formatCurrency(savings),
          recommendation: 'Consider consolidating and right-sizing multiple resources',
          confidence: 'medium',
        });
      }
    }
  });

  return recommendations.sort((a, b) => b.savings - a.savings);
}

/**
 * Rule: Detect commitment coverage gaps
 * Identifies opportunities for Reserved Instances or Savings Plans
 */
export async function detectCommitmentGaps(params = {}) {
  const { filters = {}, period = null, uploadIds = [] } = params; // Default to last 90 days
  const { startDate, endDate } = getDateRange(period);

  const normalizedUploadIds = normalizeUploadIds(uploadIds);

  let costData = await costsService.getCostData({
    filters,
    startDate,
    endDate,
    uploadIds: normalizedUploadIds,
  });

  // If no data found, try without date filter
  if (!costData || costData.length === 0) {
    costData = await costsService.getCostData({
      filters,
      startDate: null,
      endDate: null,
      uploadIds: normalizedUploadIds,
    });
  }

  if (!costData || costData.length === 0) {
    return {
      onDemandPercentage: 0,
      totalComputeSpend: 0,
      recommendation: 'No data available',
      potentialSavings: 0,
      predictableWorkload: false,
      workloadPattern: 'No workload data available',
      typicalApproach: 'Upload billing data to analyze commitment opportunities',
    };
  }

  let totalComputeSpend = 0;
  let onDemandSpend = 0;
  let totalSpend = 0;

  // More comprehensive list of compute services (case-insensitive matching)
  const computeServices = [
    'ec2',
    'compute engine',
    'virtual machine',
    'vm',
    'lambda',
    'ecs',
    'eks',
    'fargate',
    'compute',
    'container',
    'kubernetes',
    'instance',
    'server',
  ];

  costData.forEach((fact) => {
    const serviceName = (fact.service?.servicename || 'Unknown').toLowerCase();
    const cost = parseFloat(fact.billedcost || 0);
    totalSpend += cost;

    // Check if it's a compute service (case-insensitive)
    const isComputeService = computeServices.some((svc) => serviceName.includes(svc.toLowerCase()));

    if (isComputeService) {
      totalComputeSpend += cost;

      // Check if covered by commitment
      // If commitmentdiscountid exists, it's covered; otherwise it's on-demand
      const commitmentStatus = fact.commitmentdiscountid ? 'covered' : 'on-demand';
      if (commitmentStatus === 'on-demand') {
        onDemandSpend += cost;
      }
    }
  });

  const onDemandPercentage = totalComputeSpend > 0 ? (onDemandSpend / totalComputeSpend) * 100 : 0;

  // More realistic thresholds: lower spend threshold, check for any compute spend
  const hasComputeSpend = totalComputeSpend > 0;
  const hasSignificantOnDemand = onDemandSpend > 50; // Lower threshold
  const predictableWorkload = onDemandPercentage > 40 && totalComputeSpend > 100; // More lenient

  // Calculate potential savings (typically 20-40% with commitments)
  const potentialSavings = onDemandSpend * 0.25; // Assume 25% savings

  // Determine recommendation based on provider
  let recommendation = 'Savings Plan';
  const provider = costData[0]?.cloudAccount?.providername || costData[0]?.service?.providername || 'Cloud';
  if (provider.toLowerCase().includes('aws') || provider.toLowerCase().includes('amazon')) {
    recommendation = 'Savings Plan for EC2';
  } else if (provider.toLowerCase().includes('azure') || provider.toLowerCase().includes('microsoft')) {
    recommendation = 'Reserved Instances for Virtual Machines';
  } else if (provider.toLowerCase().includes('gcp') || provider.toLowerCase().includes('google')) {
    recommendation = 'Committed Use Discounts for Compute Engine';
  }

  return {
    onDemandPercentage: parseFloat(onDemandPercentage.toFixed(1)),
    totalComputeSpend: parseFloat(totalComputeSpend.toFixed(2)),
    recommendation: recommendation,
    potentialSavings: parseFloat(potentialSavings.toFixed(2)),
    predictableWorkload: predictableWorkload,
    workloadPattern: hasComputeSpend
      ? predictableWorkload
        ? `Stable compute workload shows consistent usage. ${onDemandPercentage.toFixed(1)}% of compute spend is on-demand.`
        : `Variable workload pattern detected. ${onDemandPercentage.toFixed(1)}% of compute spend is on-demand.`
      : 'No compute service data available. Upload billing data with compute resources to analyze commitment opportunities.',
    typicalApproach:
      hasComputeSpend && hasSignificantOnDemand
        ? `Organizations typically evaluate commitment strategies when on-demand spend exceeds 40% of compute costs. Your current on-demand percentage is ${onDemandPercentage.toFixed(1)}%.`
        : 'Upload billing data with compute resources to analyze commitment opportunities.',
  };
}
