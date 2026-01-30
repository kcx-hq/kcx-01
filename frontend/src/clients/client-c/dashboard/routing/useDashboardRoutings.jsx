import { useLocation } from 'react-router-dom';

export const useDashboardRoutes = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Extract the path after /client-c/ to get the actual route
  const actualPath = pathname.replace(/^\/client-c/, '') || '/';

  // Exact path matching for each route - these are relative paths within the client-c route
  const isOverview = actualPath === '/overview' || actualPath === '/overview/' || actualPath === '/';
  const isDataExplorer = actualPath.startsWith('/data-explorer');
  const isCostAnalysis = actualPath.startsWith('/cost-analysis');
  const isCostDrivers = actualPath.startsWith('/cost-drivers');
  const isResources = actualPath.startsWith('/resources');
  const isDataQuality = actualPath.startsWith('/data-quality');
  const isOptimization = actualPath.startsWith('/optimization');
  const isReports = actualPath.startsWith('/reports');
  const isAccounts = actualPath.startsWith('/accounts');
  const isDepartmentCost = actualPath.startsWith('/department-cost');

  const isProjectTracking = actualPath.startsWith('/project-tracking');

  // Default to overview if no specific route matches
  const hasSpecificRoute = isDataExplorer || isCostAnalysis || isCostDrivers || 
                           isResources || isDataQuality || isOptimization || 
                           isReports || isAccounts || isDepartmentCost || 
                           isProjectTracking;

  return {
    isOverview: !hasSpecificRoute, // Overview is active when no other specific route is active
    isDataExplorer,
    isCostAnalysis,
    isCostDrivers,
    isResources,
    isDataQuality,
    isOptimization,
    isReports,
    isAccounts,
    isDepartmentCost,
    isCostAlerts,
    isProjectTracking,
  };
};