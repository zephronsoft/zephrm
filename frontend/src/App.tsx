import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Profile } from './pages/Profile';
import { Departments } from './pages/Departments';
import { Attendance } from './pages/Attendance';
import { Leaves } from './pages/Leaves';
import { Payroll } from './pages/Payroll';
import { Performance } from './pages/Performance';
import { Recruitment } from './pages/Recruitment';
import { JobDetail } from './pages/JobDetail';
import { Announcements } from './pages/Announcements';
import { Candidates } from './pages/Candidates';
import { Onboarding } from './pages/Onboarding';
import { OfferLetter } from './pages/OfferLetter';
import { ProbationLetter } from './pages/ProbationLetter';
import { IncrementLetter } from './pages/IncrementLetter';
import { ExitLetter } from './pages/ExitLetter';
import { Resignation } from './pages/Resignation';
import { PolicyGenerator } from './pages/PolicyGenerator';
import { PolicySavedDetail } from './pages/PolicySavedDetail';
import { PolicySavedList } from './pages/PolicySavedList';
import { SettingsPage } from './pages/SettingsPage';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isAdmin = (role?: string) => role ? ADMIN_ROLES.includes(role) : false;
const isRestrictedNewJoiner = (user?: any) =>
  user?.role === 'EMPLOYEE' && !!user?.employee && user?.employee?.status !== 'ACTIVE';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin(user?.role)) return <Navigate to="/profile" replace />;
  return <Layout>{children}</Layout>;
};

const DashboardOrRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!isAdmin(user?.role)) return <Navigate to="/announcements" replace />;
  return <Dashboard />;
};

const FallbackRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin(user?.role) ? '/' : '/announcements'} replace />;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  const restrictedNewJoiner = isRestrictedNewJoiner(user);

  if (restrictedNewJoiner) {
    return (
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/onboarding" /> : <Login />} />
        <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><DashboardOrRedirect /></PrivateRoute>} />
      <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/departments" element={<AdminRoute><Departments /></AdminRoute>} />
      <Route path="/attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
      <Route path="/leaves" element={<PrivateRoute><Leaves /></PrivateRoute>} />
      <Route path="/payroll" element={<PrivateRoute><Payroll /></PrivateRoute>} />
      <Route path="/performance" element={<AdminRoute><Performance /></AdminRoute>} />
      <Route path="/recruitment" element={<PrivateRoute><Recruitment /></PrivateRoute>} />
      <Route path="/recruitment/:id" element={<PrivateRoute><JobDetail /></PrivateRoute>} />
      <Route path="/candidates" element={<PrivateRoute><Candidates /></PrivateRoute>} />
      <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
      <Route path="/emp-documents/offer-letter" element={<PrivateRoute><OfferLetter /></PrivateRoute>} />
      <Route path="/emp-documents/probation-letter" element={<PrivateRoute><ProbationLetter /></PrivateRoute>} />
      <Route path="/emp-documents/increment-letter" element={<PrivateRoute><IncrementLetter /></PrivateRoute>} />
      <Route path="/emp-documents/exit-letter" element={<PrivateRoute><ExitLetter /></PrivateRoute>} />
      <Route path="/emp-documents/resignation" element={<PrivateRoute><Resignation /></PrivateRoute>} />
      <Route path="/policy-generator" element={<AdminRoute><PolicyGenerator /></AdminRoute>} />
      <Route path="/policy-generator/saved" element={<PrivateRoute><PolicySavedList /></PrivateRoute>} />
      <Route path="/policy-generator/saved/:id" element={<PrivateRoute><PolicySavedDetail /></PrivateRoute>} />
      <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
      <Route path="/announcements" element={<PrivateRoute><Announcements /></PrivateRoute>} />
      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ className: 'text-sm' }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
