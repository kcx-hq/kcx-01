import { lazy } from 'react';

export const Overview = lazy(() => import('../../overview/Overview'));
export const DataExplorer = lazy(() => import('../../data-explorer/ClientCDataExplorer'));
export const CostAnalysis = lazy(() => import('../../cost-analysis/ClientCCostAnalysis'));
export const CostDrivers = lazy(() => import('../../cost-drivers/ClientCCostDrivers'));
export const ResourceInventory = lazy(() => import('../../resources/ResourceInventory'));
export const DataQuality = lazy(() => import('../../data-quality/ClientCDataQuality'));
export const Optimization = lazy(() => import('../../optimization/ClientCOptimization'));
export const Reports = lazy(() => import('../../reports/ClientCReports'));
export const AccountsOwnership = lazy(() => import('../../accounts-ownership/AccountsOwnership'));
export const DepartmentCost = lazy(() => import('../../department-cost/ClientCDepartmentCost'));

export const ProjectTracking = lazy(() => import('../../project-tracking/ClientCProjectTracking'));