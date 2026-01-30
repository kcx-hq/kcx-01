/**
 * Governance Policies
 * Compliance and policy checking rules
 */

import { costsService } from '../analytics/cost-analysis/cost-analysis.service.js';
import { BillingUsageFact, CloudAccount } from '../../../models/index.js';
import { Op } from 'sequelize';
import { getDateRange } from '../../../common/utils/date.helpers.js';
import { formatCurrency } from '../../../common/utils/cost.helpers.js';
import { FINOPS_CONSTANTS } from '../../../common/constants/finops.constants.js';

/**
 * Helpers
 */

const emptyOwnership = () => ({
  ownedCount: 0,
  unownedCount: 0,

  ownedCostValue: 0,
  unownedCostValue: 0,
  ownershipPercentValue: 0,

  ownedCost: formatCurrency(0),
  unownedCost: formatCurrency(0),
  ownershipPercent: formatCurrency(0, 2),

  unownedResources: []
});


const normalizeTagsLower = (tags) => {
  if (!tags || typeof tags !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(tags)) out[String(k).toLowerCase()] = v;
  return out;
};

const getOwnerFromTags = (tags = {}) => {
  const t = normalizeTagsLower(tags);
  return (
    t.owner ||
    t.team ||
    t['owneremail'] ||
    t['owner_email'] ||
    t['productowner'] ||
    null
  );
};

/**
 * Check tag compliance
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Tag compliance metrics
 */


// ---------- helpers ----------


const formatPercent = (val, digits = 2) =>
  `${Number(val || 0).toFixed(digits)}%`;



const isPresent = (v) => {
  if (v === null || v === undefined) return false;
  const s = String(v).trim();
  return s.length > 0 && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined';
};

const emptyTagCompliance = () => ({
  // numeric (what your UI table likely wants)
  taggedCost: 0,
  untaggedCost: 0,
  taggedPercent: 0,
  untaggedPercent: 0,

  // extra useful fields
  taggedCount: 0,
  untaggedCount: 0,
  countCompliancePercent: 0,        // % of resources fully tagged
  costCompliancePercent: 0,         // % of spend tagged

  // formatted strings (optional for UI)
  taggedCostFormatted: formatCurrency(0),
  untaggedCostFormatted: formatCurrency(0),
  taggedPercentFormatted: formatPercent(0),
  untaggedPercentFormatted: formatPercent(0),
  countCompliancePercentFormatted: formatPercent(0),
  costCompliancePercentFormatted: formatPercent(0),

  isCompliant: true,
  missingTags: []
});

// ---------- UPDATED FUNCTION ----------
export async function checkTagCompliance(params = {}) {
  const { filters = {}, period = null, uploadIds = [] } = params;
  const { startDate, endDate } = getDateRange(period);

  if (!Array.isArray(uploadIds) || uploadIds.length === 0) return emptyTagCompliance();

  const costData =
    (await costsService.getCostData({
      filters,
      startDate,
      endDate,
      uploadIds
    })) || [];

  if (!Array.isArray(costData) || costData.length === 0) return emptyTagCompliance();

  // ✅ Resource-level aggregation (avoid overcounting daily line items)
  const byResource = new Map();

  for (const fact of costData) {
    // IMPORTANT: don't skip missing resourceId, bucket them as 'Unknown'
    const resourceId = fact.resourceid || fact.ResourceId || 'Unknown';

    const cost = Number.parseFloat(
      fact.billedcost ?? fact.BilledCost ?? 0
    ) || 0;

    const entry =
      byResource.get(resourceId) || {
        resourceId,
        resourceName:
          fact.resource?.resourcename ||
          fact.ResourceName ||
          resourceId,
        totalCost: 0,
        tags: {}
      };

    entry.totalCost += cost;

    // tags might be object or stringified JSON depending on pipeline
    if (fact.tags && typeof fact.tags === 'object') {
      entry.tags = { ...entry.tags, ...fact.tags };
    } else if (fact.Tags && typeof fact.Tags === 'object') {
      entry.tags = { ...entry.tags, ...fact.Tags };
    } else if (typeof fact.tags === 'string' && fact.tags.trim()) {
      try {
        const parsed = JSON.parse(fact.tags);
        if (parsed && typeof parsed === 'object') entry.tags = { ...entry.tags, ...parsed };
      } catch (_) {}
    } else if (typeof fact.Tags === 'string' && fact.Tags.trim()) {
      try {
        const parsed = JSON.parse(fact.Tags);
        if (parsed && typeof parsed === 'object') entry.tags = { ...entry.tags, ...parsed };
      } catch (_) {}
    }

    byResource.set(resourceId, entry);
  }

  const required = Array.isArray(FINOPS_CONSTANTS?.REQUIRED_TAGS)
    ? FINOPS_CONSTANTS.REQUIRED_TAGS
    : [];

  let taggedCount = 0;
  let untaggedCount = 0;
  let taggedCostNum = 0;
  let untaggedCostNum = 0;

  const missingTags = [];

  for (const r of byResource.values()) {
    const tagMap = normalizeTagsLower(r.tags);

    // if no required tags configured, treat everything as tagged
    const missing = required.length
      ? required.filter((t) => {
          const key = String(t).toLowerCase();
          return !isPresent(tagMap[key]);
        })
      : [];

    const isTagged = missing.length === 0;

    if (isTagged) {
      taggedCount += 1;
      taggedCostNum += r.totalCost;
    } else {
      untaggedCount += 1;
      untaggedCostNum += r.totalCost;

      missingTags.push({
        resourceId: r.resourceId,
        resourceName: r.resourceName,
        missingTags: missing,
        cost: formatCurrency(r.totalCost),
        costValue: Number((r.totalCost || 0).toFixed(2))
      });
    }
  }

  const totalCount = taggedCount + untaggedCount;
  const totalCost = taggedCostNum + untaggedCostNum;

  // ✅ percent by COUNT (resource compliance)
  const countCompliancePercentNum = totalCount > 0 ? (taggedCount / totalCount) * 100 : 0;

  // ✅ percent by COST (spend compliance)
  const costCompliancePercentNum = totalCost > 0 ? (taggedCostNum / totalCost) * 100 : 0;

  // ✅ explicit tagged/untagged percents by COST (matches your API/UI)
  const taggedPercentNum = totalCost > 0 ? (taggedCostNum / totalCost) * 100 : 0;
  const untaggedPercentNum = totalCost > 0 ? (untaggedCostNum / totalCost) * 100 : 0;

  missingTags.sort((a, b) => (b.costValue || 0) - (a.costValue || 0));

  return {
    // ✅ what your simplified API expects
    taggedCost: Number(taggedCostNum.toFixed(2)),
    untaggedCost: Number(untaggedCostNum.toFixed(2)),
    taggedPercent: Number(taggedPercentNum.toFixed(2)),
    untaggedPercent: Number(untaggedPercentNum.toFixed(2)),

    // extra (optional)
    taggedCount,
    untaggedCount,
    countCompliancePercent: Number(countCompliancePercentNum.toFixed(2)),
    costCompliancePercent: Number(costCompliancePercentNum.toFixed(2)),

    // formatted (optional)
    taggedCostFormatted: formatCurrency(taggedCostNum),
    untaggedCostFormatted: formatCurrency(untaggedCostNum),
    taggedPercentFormatted: formatPercent(taggedPercentNum),
    untaggedPercentFormatted: formatPercent(untaggedPercentNum),
    countCompliancePercentFormatted: formatPercent(countCompliancePercentNum),
    costCompliancePercentFormatted: formatPercent(costCompliancePercentNum),

    isCompliant:
      Number(countCompliancePercentNum.toFixed(2)) >=
      Number(FINOPS_CONSTANTS?.MIN_TAG_COMPLIANCE_PERCENT || 0),

    missingTags: missingTags.slice(0, 100).map(({ costValue, ...rest }) => rest)
  };
}


/**
 * Check ownership gaps (resource-level, avoids overcounting)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Ownership compliance metrics
 */
export async function checkOwnershipGaps(params = {}) {
  const { filters = {}, period = null , uploadIds = [] } = params;
  const { startDate, endDate } = getDateRange(period);

  if (!uploadIds || uploadIds.length === 0) return emptyOwnership();

  let costData = await costsService.getCostDataWithResources({
    filters,
    startDate,
    endDate,
    uploadIds
  });

  // If no data found, try without date filter
  if (!Array.isArray(costData) || costData.length === 0) {
    costData = await costsService.getCostDataWithResources({
      filters,
      startDate: null,
      endDate: null,
      uploadIds
    });
  }

  if (!Array.isArray(costData) || costData.length === 0) return emptyOwnership();

  // ✅ Resource-level aggregation
  const byResource = new Map();

  for (const fact of costData) {
    const resourceId = fact.resourceid;
    if (!resourceId) continue;

    const cost = Number.parseFloat(fact.billedcost || 0) || 0;

    const entry =
      byResource.get(resourceId) || {
        resourceId,
        resourceName: fact.resource?.resourcename || resourceId,
        serviceName: fact.service?.servicename || 'Unknown',
        totalCost: 0,
        tags: {}
      };

    entry.totalCost += cost;

    if (fact.tags && typeof fact.tags === 'object') {
      entry.tags = { ...entry.tags, ...fact.tags };
    }

    byResource.set(resourceId, entry);
  }

  let ownedCount = 0;
  let unownedCount = 0;
  let ownedCostNum = 0;
  let unownedCostNum = 0;

  const unownedResources = [];

  for (const r of byResource.values()) {
    const owner = getOwnerFromTags(r.tags);

    if (owner) {
      ownedCount += 1;
      ownedCostNum += r.totalCost;
    } else {
      unownedCount += 1;
      unownedCostNum += r.totalCost;

      unownedResources.push({
        resourceId: r.resourceId,
        resourceName: r.resourceName,
        serviceName: r.serviceName,
        cost: formatCurrency(r.totalCost),
        costValue: Number((r.totalCost || 0).toFixed(2))
      });
    }
  }

  const totalCount = ownedCount + unownedCount;
  const totalCost = ownedCostNum + unownedCostNum;
  const ownershipPercentNum = totalCount > 0 ? (ownedCount / totalCount) * 100 : 0;

  unownedResources.sort((a, b) => (b.costValue || 0) - (a.costValue || 0));

  return {
    ownedCount,
    unownedCount,

    ownedCostValue: Number(ownedCostNum.toFixed(2)),
    unownedCostValue: Number(unownedCostNum.toFixed(2)),
    ownershipPercentValue: Number(ownershipPercentNum.toFixed(2)),

    ownedCost: formatCurrency(ownedCostNum),
    unownedCost: formatCurrency(unownedCostNum),
    ownershipPercent: formatCurrency(ownershipPercentNum, 2),

    unownedResources: unownedResources
      .slice(0, 100)
      .map(({ costValue, ...rest }) => rest)
  };
}

/**
 * Generate governance summary
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Complete governance summary
 */
export async function generateGovernanceSummary(params = {}) {
  const [tagCompliance, ownershipGaps] = await Promise.all([
    checkTagCompliance(params),
    checkOwnershipGaps(params)
  ]);

  // ✅ Use numeric "Value" fields for calculations (never formatted strings)
  const tagScore = Number(tagCompliance.compliancePercentValue || 0);
  const ownershipScore = Number(ownershipGaps.ownershipPercentValue || 0);
  const overallScoreNum = (tagScore + ownershipScore) / 2;

  return {
    overallScoreValue: Number(overallScoreNum.toFixed(2)),
    overallScore: formatCurrency(overallScoreNum, 2),

    tagCompliance,
    ownershipGaps,

    isHealthy:
      overallScoreNum >= (FINOPS_CONSTANTS.MIN_TAG_COMPLIANCE_PERCENT || 0)
  };
}

/**
 * Get accounts with ownership data
 * Aggregates billing data by account and calculates ownership metrics
 * @param {Object} params - Query parameters { filters, period, uploadIds, search, sortBy, sortOrder }
 * @returns {Promise<Object>} Accounts data with ownership insights
 */
export async function getAccountsWithOwnership(params = {}) {
  try {
    const {
      filters = {},
      period =  null,
      uploadIds = [],
      search = '',
      sortBy = 'cost',
      sortOrder = 'desc'
    } = params;

    if (!uploadIds || uploadIds.length === 0) {
      return {
        accounts: [],
        insights: {
          totalAccounts: 0,
          accountsWithOwner: 0,
          accountsWithoutOwner: 0,
          spendWithOwner: 0,
          spendWithoutOwner: 0,
          spendUnattributedPercent: 0,
          totalSpend: 0
        },
        providers: []
      };
    }

    const { startDate, endDate } = getDateRange(period);

    let costData = await costsService.getCostData({
      filters,
      startDate,
      endDate,
      uploadIds
    });

    console.log(costData)

    if (!Array.isArray(costData) || costData.length === 0) {
      costData = await costsService.getCostDataWithResources({
        filters,
        startDate: null,
        endDate: null,
        uploadIds
      });
    }

    if (!Array.isArray(costData) || costData.length === 0) {
      return {
        accounts: [],
        insights: {
          totalAccounts: 0,
          accountsWithOwner: 0,
          accountsWithoutOwner: 0,
          spendWithOwner: 0,
          spendWithoutOwner: 0,
          spendUnattributedPercent: 0,
          totalSpend: 0
        },
        providers: []
      };
    }


    const accountMap = new Map();
    const accountServices = new Map();
    const accountOwnerCosts = new Map();
    const providerSet = new Set();
    let totalSpend = 0;

    costData.forEach((fact) => {
      const cloudAccount = fact.cloudAccount;
      const cost = parseFloat(fact.billedcost || 0);

      if (!cloudAccount || !cloudAccount.billingaccountid) return;
      if (cost <= 0 || Number.isNaN(cost)) return;

      totalSpend += cost;

      const accountId = cloudAccount.billingaccountid;
      const provider = cloudAccount.providername || 'Unknown';
      providerSet.add(provider);

      const accountKey = `${cloudAccount.id || ''}|${provider}|${accountId}`;
      const accountName = cloudAccount.billingaccountname || accountId;
      const serviceName = fact.service?.servicename || 'Unknown';

      if (!accountMap.has(accountKey)) {
        accountMap.set(accountKey, {
          accountKey,
          accountId,
          accountName,
          provider,
          cost: 0,
          owner: null
        });
        accountServices.set(accountKey, new Map());
        accountOwnerCosts.set(accountKey, new Map());
      }

      const account = accountMap.get(accountKey);
      account.cost += cost;

      const services = accountServices.get(accountKey);
      services.set(serviceName, (services.get(serviceName) || 0) + cost);

      const owner = getOwnerFromTags(fact.tags || {});
      if (owner) {
        const ownerCosts = accountOwnerCosts.get(accountKey);
        ownerCosts.set(owner, (ownerCosts.get(owner) || 0) + cost);
      }
    });

    // Infer top owner by max tagged spend
    accountMap.forEach((account, accountKey) => {
      const ownerCosts = accountOwnerCosts.get(accountKey);
      if (ownerCosts && ownerCosts.size > 0) {
        const topOwner = Array.from(ownerCosts.entries()).sort((a, b) => b[1] - a[1])[0];
        if (topOwner?.[0]) account.owner = topOwner[0];
      }
    });

    let accounts = Array.from(accountMap.values()).map((acc) => {
      const services = accountServices.get(acc.accountKey) || new Map();
      const topService = Array.from(services.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return {
        accountId: acc.accountId,
        accountName: acc.accountName,
        provider: acc.provider,
        cost: parseFloat((acc.cost || 0).toFixed(2)),
        topService,
        percentage: totalSpend > 0 ? parseFloat(((acc.cost / totalSpend) * 100).toFixed(2)) : 0,
        owner: acc.owner || null,
        ownershipStatus: acc.owner ? 'Assigned (inferred)' : 'No owner tag detected'
      };
    });

    // Search
    if (search && search.trim()) {
      const s = search.toLowerCase();
      accounts = accounts.filter((a) => {
        return (a.accountName || '').toLowerCase().includes(s) || (a.accountId || '').toLowerCase().includes(s);
      });
    }

    // Ownership status filter
    if (filters.ownershipStatus && filters.ownershipStatus !== 'All') {
      if (filters.ownershipStatus.toLowerCase().includes('assign')) {
        accounts = accounts.filter((a) => !!a.owner);
      } else {
        accounts = accounts.filter((a) => !a.owner);
      }
    }

    // Provider filter
    if (filters.provider && filters.provider !== 'All') {
      const p = filters.provider.toLowerCase();
      accounts = accounts.filter((a) => (a.provider || '').toLowerCase() === p);
    }

    // Sorting
    accounts.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'cost') cmp = (a.cost || 0) - (b.cost || 0);
      else if (sortBy === 'name') cmp = (a.accountName || '').localeCompare(b.accountName || '');
      else if (sortBy === 'owner') cmp = (a.owner || '').localeCompare(b.owner || '');
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    const accountsWithOwner = accounts.filter((a) => a.owner).length;
    const accountsWithoutOwner = accounts.length - accountsWithOwner;
    const spendWithOwner = accounts.filter((a) => a.owner).reduce((s, a) => s + (a.cost || 0), 0);
    const spendWithoutOwner = accounts.filter((a) => !a.owner).reduce((s, a) => s + (a.cost || 0), 0);
    const total = accounts.reduce((s, a) => s + (a.cost || 0), 0);
    const spendUnattributedPercent = total > 0 ? (spendWithoutOwner / total) * 100 : 0;

    return {
      accounts,
      insights: {
        totalAccounts: accounts.length,
        accountsWithOwner,
        accountsWithoutOwner,
        spendWithOwner: parseFloat(spendWithOwner.toFixed(2)),
        spendWithoutOwner: parseFloat(spendWithoutOwner.toFixed(2)),
        spendUnattributedPercent: parseFloat(spendUnattributedPercent.toFixed(1)),
        totalSpend: parseFloat(total.toFixed(2))
      },
      providers: Array.from(providerSet).sort()
    };
  } catch (error) {
    console.error('Error in getAccountsWithOwnership:', error);
    return {
      accounts: [],
      insights: {
        totalAccounts: 0,
        accountsWithOwner: 0,
        accountsWithoutOwner: 0,
        spendWithOwner: 0,
        spendWithoutOwner: 0,
        spendUnattributedPercent: 0,
        totalSpend: 0
      },
      providers: []
    };
  }
}

/**
 * Update account owner by storing in billing facts tags
 */
export async function updateAccountOwner(accountId, owner, uploadIds = []) {
  if (!uploadIds || uploadIds.length === 0) {
    throw new Error('uploadIds is required');
  }

  const cloudAccount = await CloudAccount.findOne({
    where: { billingaccountid: accountId }
  });

  if (!cloudAccount) throw new Error('Account not found');

  const billingFacts = await BillingUsageFact.findAll({
    where: {
      cloudaccountid: cloudAccount.id,
      uploadid: { [Op.in]: uploadIds }
    }
  });

  for (const fact of billingFacts) {
    const tags = (fact.tags && typeof fact.tags === 'object') ? { ...fact.tags } : {};
    tags.Owner = owner;
    tags.owner = owner;
    await fact.update({ tags });
  }

  return {
    accountId,
    accountName: cloudAccount.billingaccountname || accountId,
    owner,
    updated: true
  };
}
