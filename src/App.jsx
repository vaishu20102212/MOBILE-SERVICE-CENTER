import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import JobCardsPage from './pages/JobCardsPage';
import JobCardDetailPage from './pages/JobCardDetailPage';
import ServiceRequestsPage from './pages/ServiceRequestsPage';
import CustomersPage from './pages/CustomersPage';
import DevicesPage from './pages/DevicesPage';
import TechniciansPage from './pages/TechniciansPage';
import InventoryPage from './pages/InventoryPage';
import BillingPage from './pages/BillingPage';
import ReportsPage from './pages/ReportsPage';
import CustomerPortalPage from './pages/CustomerPortalPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Front Public Login Page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Public Customer Live Device Tracking Portal */}
            <Route element={<AppLayout />}>
              <Route path="/portal" element={<CustomerPortalPage />} />
            </Route>

            {/* Protected Core Management Suite - Requires Login First */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/job-cards" element={<JobCardsPage />} />
                <Route path="/job-cards/:id" element={<JobCardDetailPage />} />
                <Route path="/service-requests" element={<ServiceRequestsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/devices" element={<DevicesPage />} />
                <Route path="/technicians" element={<TechniciansPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
            </Route>

            {/* Default Catch-all: Directs unauthenticated users to /login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
