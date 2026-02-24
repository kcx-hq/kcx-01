import React, { lazy } from 'react';

export const Overview = lazy(() =>
  import('../overview/Overview').catch((err) => {
    console.error('Failed to load Overview:', err);
    throw err;
  })
);

export const DataExplorer = lazy(() => import('../data-explorer/DataExplorer'));
export const CostAnalysis = lazy(() => import('../cost-analysis/CostAnalysis'));
export const CostDrivers = lazy(() => import('../cost-drivers/CostDrivers'));
export const ResourceInventory = lazy(() => import('../resources/ResourceInventory'));
export const DataQuality = lazy(() => import('../data-quality/DataQuality'));
export const Optimization = lazy(() => import('../optimization/Optimization'));
export const Reports = lazy(() => import('../reports/Reports'));
export const AccountsOwnership = lazy(() => import('../accounts-ownership/AccountsOwnership'));
export const AllocationUnitEconomics = lazy(() => import('../allocation-unit-economics/AllocationUnitEconomics'));
