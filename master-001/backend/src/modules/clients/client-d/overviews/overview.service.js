import { dashboardService } from '../../../core-dashboard/overviews/overview.service.js';

/**
 * Client-D Overview Service
 * Uses core dashboardService.getOverviewMetrics(), then shapes the response for Client-D.
 */


export async function getOverview(filters, uploadIds) {
    // Get core overview response (the big object you pasted)
    const core = await dashboardService.getOverviewMetrics(filters, uploadIds);

    // Build Client-D response (ONLY enabled features)
    return {
      totalSpend: Number(core?.totalSpend || 0),

      // Average Daily Spend (enabled)
      avgDailySpend: Number(core?.avgDailySpend || 0),

      // Trend Percentage (enabled) — in your output it's spendChangePercent
      trendPercentage: Number(core?.spendChangePercent || 0),

      // Cost Trends (daily)
      dailyData: Array.isArray(core?.dailyData) ? core.dailyData : [],

      // Service Breakdown (enabled) — in your output it's groupedData
      serviceBreakdown: Array.isArray(core?.groupedData)
        ? core.groupedData.map((s) => ({
            name: s.name,
            value: Number(s.value || 0)
          }))
        : [],

      // Optional: billing period is often useful for the UI header
      billingPeriod: core?.billingPeriod || null
    };
  }






/**
 * Client-D Data Explorer Service
 * - Uses core data explorer output
 * - Ensures grouping is disabled (already forced in controller)
 * - Extends rows with:
 *   ✅ pricing columns
 *   ✅ quantity & unit columns
 *   ✅ commitment metadata
 *
 * Note: Where these values come from depends on your dataset.
 * This service is written to:
 * - pass through existing fields if present
 * - try to derive from tags if not present
 * - otherwise return null for those fields
 */

function pickTag(tags, keys = []) {
  if (!tags || typeof tags !== 'object') return null;
  for (const k of keys) {
    if (tags[k] != null && String(tags[k]).trim() !== '') return tags[k];
  }
  return null;
}

function toNumberOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}



const CLIENT_D_EXTRA_COLUMNS = [
  // Pricing columns
  'unitPrice',
  'listPrice',
  'effectivePrice',

  // Quantity & Unit columns
  'quantity',
  'unit',

  // Commitment metadata
  'commitmentType',
  'commitmentTerm',
  'commitmentId'
];



function extendRowForClientD(row) {
  const tags = row?.tags || row?.Tags || null;

  const unitPrice =
    toNumberOrNull(row.unitPrice) ??
    toNumberOrNull(row.UnitPrice) ??
    toNumberOrNull(pickTag(tags, ['unitPrice', 'UnitPrice', 'unit_price']));

  const listPrice =
    toNumberOrNull(row.listPrice) ??
    toNumberOrNull(row.ListPrice) ??
    toNumberOrNull(pickTag(tags, ['listPrice', 'ListPrice', 'list_price']));

  const effectivePrice =
    toNumberOrNull(row.effectivePrice) ??
    toNumberOrNull(row.EffectivePrice) ??
    toNumberOrNull(pickTag(tags, ['effectivePrice', 'EffectivePrice', 'effective_price']));

  const quantity =
    toNumberOrNull(row.usageQuantity) ??
    toNumberOrNull(row.UsageQuantity) ??
    toNumberOrNull(row.quantity) ??
    toNumberOrNull(row.Quantity);

  const unit =
    row.usageUnit ??
    row.UsageUnit ??
    row.unit ??
    row.Unit ??
    pickTag(tags, ['usageUnit', 'UsageUnit', 'unit', 'Unit']);

  const commitmentType =
    row.commitmentType ??
    row.CommitmentType ??
    pickTag(tags, ['commitmentType', 'CommitmentType', 'ri', 'RI', 'savingsPlan', 'SavingsPlan']);

  const commitmentTerm =
    row.commitmentTerm ??
    row.CommitmentTerm ??
    pickTag(tags, ['commitmentTerm', 'CommitmentTerm', 'term', 'Term']);

  const commitmentId =
    row.commitmentId ??
    row.CommitmentId ??
    pickTag(tags, ['commitmentId', 'CommitmentId', 'riId', 'RIId', 'spId', 'SPId']);

  return {
    ...row,
    unitPrice,
    listPrice,
    effectivePrice,
    quantity,
    unit,
    commitmentType,
    commitmentTerm,
    commitmentId
  };
}

function mergeColumns(allColumns) {
  const base = Array.isArray(allColumns) ? allColumns : [];
  const set = new Set(base);
  for (const c of CLIENT_D_EXTRA_COLUMNS) set.add(c);
  return Array.from(set);
}

export const clientDDataExplorerService = {
  async getDataExplorer(filters, pagination, uploadIds) {
    const core = await dashboardService.getDataExplorerData(filters, pagination, uploadIds);

    const data = Array.isArray(core?.data)
      ? core.data.map(extendRowForClientD)
      : [];

    const allColumns = mergeColumns(core?.allColumns);

    return {
      data,
      allColumns,
      quickStats: core?.quickStats ?? {},
      summaryData: core?.summaryData ?? {},
      columnMaxValues: core?.columnMaxValues ?? {},
      pagination: core?.pagination ?? {
        page: pagination.page,
        limit: pagination.limit,
        total: data.length,
        totalPages: Math.ceil(data.length / pagination.limit)
      }
      // groupedData intentionally omitted
    };
  },

  /**
   * Client-D CSV Export
   */
  async exportCSV(filters, pagination, uploadIds, selectedIndices, visibleColumns) {
    // Fetch full dataset (large limit handled by controller)
    const core = await dashboardService.getDataExplorerData(filters, pagination, uploadIds);

    const extendedRows = Array.isArray(core?.data)
      ? core.data.map(extendRowForClientD)
      : [];

    // Handle row selection
    const rows =
      Array.isArray(selectedIndices) && selectedIndices.length > 0
        ? selectedIndices
            .map((i) => extendedRows[i])
            .filter(Boolean)
        : extendedRows;

    // Decide columns
    const columns =
      Array.isArray(visibleColumns) && visibleColumns.length > 0
        ? visibleColumns
        : mergeColumns(core?.allColumns);

    // CSV helpers
    const escape = (value) => {
      if (value === null || value === undefined) return '';
      const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = columns.join(',');
    const lines = rows.map((row) =>
      columns.map((col) => escape(row?.[col])).join(',')
    );

    return [header, ...lines].join('\n');
  }
};
