import React, { lazy } from 'react';

export const Overview = lazy(() =>
  import('../overview/Overview').catch((err: unknown) => {
    console.error('Failed to load Overview:', err);
    throw err;
  })
);

export const DataExplorer = lazy(() => import('../data-explorer/DataExplorer'));
export const CostAnalysis = lazy(() => import('../cost-analysis/CostAnalysis'));
export const CostDrivers = lazy(() => import('../cost-drivers/CostDrivers'));
export const DataQuality = lazy(() => import('../data-quality/DataQuality'));
export const ForecastingBudgets = lazy(() => import('../forecasting-budgets/ForecastingBudgets'));
export const AlertsIncidents = lazy(() => import('../alerts-incidents/AlertsIncidents'));
export const Optimization = lazy(() => import('../optimization/Optimization'));
export const Reports = lazy(() => import('../reports/Reports'));
export const AllocationUnitEconomics = lazy(() => import('../allocation-unit-economics/AllocationUnitEconomics'));
