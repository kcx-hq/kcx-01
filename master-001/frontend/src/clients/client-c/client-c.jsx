import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ClientCDashboardPage from './dashboard/ClientCDashboardPage';

const ClientC = () => {
  return (
    <Routes>
      {/* Handle root path and redirect to overview */}
      <Route path="/" element={<Navigate to="/client-c/overview" replace />} />
      {/* Handle all dashboard paths with wildcards so they all render the same dashboard page */}
      <Route path="/*" element={<ClientCDashboardPage />} />
    </Routes>
  );
};

export default ClientC;