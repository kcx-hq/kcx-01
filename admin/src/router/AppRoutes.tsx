import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Overview from "../modules/overview/OverviewPage";
import Login from "../modules/auth/LoginPage";
import Users from "../modules/users/UsersPage";
import Inquiries from "../modules/inquiries/InquiriesPage";
import ActivityLogs from "../modules/activity-log/ActivityLogsPage";
import Operations from "../modules/operations/OperationsPage";
import { checkAdminHealth } from "../modules/auth/auth.api";

const ProtectedShell = () => {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    checkAdminHealth()
      .then(() => {
        if (active) setAllowed(true);
      })
      .catch(() => {
        if (active) setAllowed(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return <div className="panel">Checking admin access.</div>;
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="overview" element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="operations" element={<Operations />} />
          <Route path="activity" element={<ActivityLogs />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedShell />} />
    </Routes>
  );
};

export default AppRoutes;
