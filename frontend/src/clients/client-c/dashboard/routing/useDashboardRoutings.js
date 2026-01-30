import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export const useDashboardRoutes = () => {
  const { pathname } = useLocation();

  return useMemo(() => ({
    isOverview: pathname === '/client-c' || pathname === '/client-c/overview',
    isOverviewPath: pathname.startsWith('/client-c') && (pathname === '/client-c' || pathname === '/client-c/overview'),
    isDataExplorer: pathname.includes('/data-explorer'),
    isCostAnalysis: pathname.includes('/cost-analysis'),
    isCostDrivers: pathname.includes('/cost-drivers'),
    isResources: pathname.includes('/resources'),
    isDataQuality: pathname.includes('/data-quality'),
    isOptimization: pathname.includes('/optimization'),
    isReports: pathname.includes('/reports'),
    isAccounts: pathname.includes('/accounts'),
    isDepartmentCost: pathname.includes('/department-cost'),

    isProjectTracking: pathname.includes('/project-tracking'),
  }), [pathname]);
};
