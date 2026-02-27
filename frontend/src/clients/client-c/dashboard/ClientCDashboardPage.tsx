import DashboardLayout from './layout/DashboardLayout';
import DashboardRouter from './routing/dashboardRouter';
import SkeletonLoader from './layout/SkeletonLoader';
import { useCaps } from '../../../hooks/useCaps';
import useDashboardInit from './hooks/useDashboardInits';
import { useDashboardRoutes } from './routing/useDashboardRoutings';
import { Navigate } from 'react-router-dom';
import type { ClientCDashboardRoutes } from './routing/useDashboardRoutings';

const ClientCDashboardPage = () => {
  const loading = useDashboardInit();
  const routes = useDashboardRoutes();
  const { caps, api } = useCaps();


  if (loading) return <SkeletonLoader />;

  // Check if any route is active, otherwise default to overview
  const hasActiveRoute = Object.values(routes as ClientCDashboardRoutes).some((value: boolean) => value);

  return (
    <DashboardLayout title="Client C Dashboard">
      {hasActiveRoute ? (
        <DashboardRouter routes={routes} api={api} caps={caps} />
      ) : (
        <Navigate to="/client-c/overview" replace />
      )}
    </DashboardLayout>
  );
};

export default ClientCDashboardPage;
