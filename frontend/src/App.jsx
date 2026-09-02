import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CurrencyProvider } from './contexts/CurrencyContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import CloudAccountsPage from './pages/CloudAccountsPage';
import CostDataPage from './pages/CostDataPage';
import CostAnalysisPage from './pages/CostAnalysisPage';
import AnomalyDetectionPage from './pages/AnomalyDetectionPage';
import CostForecastingPage from './pages/CostForecastingPage';
import SavingsEstimationPage from './pages/SavingsEstimationPage';
import AIOptimizationPage from './pages/AIOptimizationPage';
import AICopilotPage from './pages/AICopilotPage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SecurityManagementPage from './pages/SecurityManagementPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AdminPanelPage from './pages/AdminPanelPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Initializing Workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (user.role !== 'Admin' && !user.is_superuser)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CurrencyProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Authentication Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Onboarding */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />

              {/* Main SaaS Protected App */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/cloud/accounts" element={<CloudAccountsPage />} />
                <Route path="/cloud/data" element={<CostDataPage />} />
                <Route path="/analysis" element={<CostAnalysisPage />} />
                <Route path="/anomalies" element={<AnomalyDetectionPage />} />
                <Route path="/forecast" element={<CostForecastingPage />} />
                <Route path="/savings" element={<SavingsEstimationPage />} />
                <Route path="/ai/optimization" element={<AIOptimizationPage />} />
                <Route path="/ai/copilot" element={<AICopilotPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/security" element={<SecurityManagementPage />} />
                <Route path="/audit" element={<AuditLogsPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Admin-only route */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminPanelPage />
                    </AdminRoute>
                  }
                />
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </CurrencyProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
