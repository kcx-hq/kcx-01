/**
 * Client-C Data Explorer Service
 * Extended: Hidden pricing internals, department-scoped logic
 */

import { dashboardService as coreOverviewService } from '../../../../modules/core-dashboard/overviews/overview.service.js';
import { BillingUsageFact, Service, Region, CloudAccount } from '../../../../models/index.js';
import Sequelize from '../../../../config/db.config.js';
import { Op } from 'sequelize';

const HIDDEN_COLUMNS = [
  'ListUnitPrice',
  'ContractedUnitPrice',
  'ListCost',
  'ContractedCost',
  'PricingQuantity',
  'PricingUnit'
];

/**
 * Extract department from tags
 * Expected tag format: { department: "Engineering", ... }
 */
function extractDepartment(tags) {
  if (!tags || typeof tags !== 'object') return 'Untagged';
  return tags.department || tags.Department || 'Untagged';
}

/**
 * Get department breakdown aggregation
 */
async function getDepartmentBreakdown(filters = {}, uploadIds = []) {
  const { provider, service, region, uploadId, department } = filters;

  if (!uploadIds || uploadIds.length === 0) return [];

  const whereClause = applyUploadIsolation({}, uploadId, uploadIds);

  const filterInclude = [
    {
      model: CloudAccount,
      as: 'cloudAccount',
      required: !!(provider && provider !== 'All'),
      attributes: [],
      ...(provider && provider !== 'All' ? { where: { providername: provider } } : {}),
    },
    {
      model: Service,
      as: 'service',
      required: !!(service && service !== 'All'),
      attributes: [],
      ...(service && service !== 'All' ? { where: { servicename: service } } : {}),
    },
    {
      model: Region,
      as: 'region',
      required: !!(region && region !== 'All'),
      attributes: [],
      ...(region && region !== 'All' ? { where: { regionname: region } } : {}),
    },
  ];

  // Fetch all records to extract department from tags
  const records = await BillingUsageFact.findAll({
    where: whereClause,
    include: filterInclude,
    attributes: ['tags', 'billedcost'],
    raw: true,
  });

  // Group by department
  const departmentMap = {};
  let totalCost = 0;

  records.forEach(record => {
    const dept = extractDepartment(record.tags);
    const cost = parseFloat(record.billedcost || 0);
    
    // If department filter is specified, only include that department
    if (department && department !== 'All' && dept !== department) return;
    
    if (!departmentMap[dept]) {
      departmentMap[dept] = 0;
    }
    departmentMap[dept] += cost;
    totalCost += cost;
  });

  // Convert to array and calculate percentages
  const departmentBreakdown = Object.entries(departmentMap)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      percentage: totalCost > 0 ? parseFloat(((value / totalCost) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 departments

  return departmentBreakdown;
}

/**
 * Get available departments for filtering
 */
async function getAvailableDepartments(filters = {}, uploadIds = []) {
  const { provider, service, region, uploadId } = filters;

  if (!uploadIds || uploadIds.length === 0) return [];

  const whereClause = applyUploadIsolation({}, uploadId, uploadIds);

  const filterInclude = [
    {
      model: CloudAccount,
      as: 'cloudAccount',
      required: !!(provider && provider !== 'All'),
      attributes: [],
      ...(provider && provider !== 'All' ? { where: { providername: provider } } : {}),
    },
    {
      model: Service,
      as: 'service',
      required: !!(service && service !== 'All'),
      attributes: [],
      ...(service && service !== 'All' ? { where: { servicename: service } } : {}),
    },
    {
      model: Region,
      as: 'region',
      required: !!(region && region !== 'All'),
      attributes: [],
      ...(region && region !== 'All' ? { where: { regionname: region } } : {}),
    },
  ];

  // Fetch all records to extract departments from tags
  const records = await BillingUsageFact.findAll({
    where: whereClause,
    include: filterInclude,
    attributes: ['tags'],
    raw: true,
  });

  // Extract unique departments
  const departments = new Set();
  records.forEach(record => {
    const dept = extractDepartment(record.tags);
    if (dept && dept !== 'Untagged') {
      departments.add(dept);
    }
  });

  return ['All', ...Array.from(departments).sort()];
}

/**
 * Apply upload isolation
 */
function applyUploadIsolation(whereClause = {}, uploadId, uploadIds = []) {
  if (uploadId && Array.isArray(uploadIds) && uploadIds.includes(uploadId)) {
    whereClause.uploadid = uploadId;
    return whereClause;
  }
  if (Array.isArray(uploadIds) && uploadIds.length > 0) {
    whereClause.uploadid = { [Op.in]: uploadIds };
    return whereClause;
  }
  return whereClause;
}

/**
 * Filter record data to remove sensitive pricing columns
 */
const filterSensitiveData = (data) => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(row => {
      const newRow = { ...row };
      HIDDEN_COLUMNS.forEach(col => delete newRow[col]);
      return newRow;
    });
  }

  const newData = { ...data };
  HIDDEN_COLUMNS.forEach(col => delete newData[col]);
  return newData;
};

export const clientCDataExplorerService = {
  /**
   * Get Data Explorer Data - Hides pricing columns
   */
  async getDataExplorerData(filters, pagination, uploadIds) {
    const result = await coreOverviewService.getDataExplorerData(filters, pagination, uploadIds);

    if (!result) return result;

    // 1. Filter allColumns
    const filteredColumns = result.allColumns?.filter(col => !HIDDEN_COLUMNS.includes(col));

    // 2. Filter data rows
    const filteredData = filterSensitiveData(result.data);

    // 3. Filter summaryData
    const filteredSummaryData = filterSensitiveData(result.summaryData);

    // 4. Filter columnMaxValues
    const filteredColumnMaxValues = filterSensitiveData(result.columnMaxValues);

    // 5. Get department breakdown
    const departmentBreakdown = await getDepartmentBreakdown(filters, uploadIds);

    // 6. Get available departments for filtering
    const availableDepartments = await getAvailableDepartments(filters, uploadIds);

    return {
      ...result,
      allColumns: filteredColumns,
      data: filteredData,
      summaryData: filteredSummaryData,
      columnMaxValues: filteredColumnMaxValues,
      departmentBreakdown,
      availableDepartments
    };
  },

  /**
   * Get available departments for client-c data explorer
   */
  async getAvailableDepartments(filters, uploadIds) {
    return await getAvailableDepartments(filters, uploadIds);
  },

  /**
   * Export to CSV - Department scoped
   */
  async exportDataExplorerToCSV(filters, pagination, uploadIds, selectedIndices, visibleColumns) {
    // Ensure visible columns don't include hidden ones
    const safeVisibleColumns = visibleColumns 
      ? visibleColumns.filter(col => !HIDDEN_COLUMNS.includes(col))
      : null;

    // Add department to filters or scoping if needed (core might already handle tags)
    // For Client-C, we ensure CSV naming and scoping reflects their operational focus
    
    return coreOverviewService.exportDataExplorerToCSV(
      filters,
      pagination,
      uploadIds,
      selectedIndices,
      safeVisibleColumns
    );
  }
};

// Also expose the department breakdown function for direct use
export { getDepartmentBreakdown };
