import DashboardLayout from './layout/DashboardLayout';
import DashboardRouter from './routing/dashboardRouter';
import SkeletonLoader from './layout/SkeletonLoader';
import { useCaps } from '../../../hooks/useCaps';
import useDashboardInit from './hooks/useDashboardInits';
import { useDashboardRoutes } from './routing/useDashboardRoutings';
import { Navigate, useLocation } from 'react-router-dom';

const ClientCDashboardPage = () => {
  const loading = useDashboardInit();
  const routes = useDashboardRoutes();
  const { caps, api } = useCaps();
  const location = useLocation();


  if (loading) return <SkeletonLoader />;

  // Check if any route is active, otherwise default to overview
  const hasActiveRoute = Object.values(routes).some(value => value);

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