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
import { Announcements } from './pages/Announcements';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isAdmin = (role?: string) => role ? ADMIN_ROLES.includes(role) : false;

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
  const { isAuthenticated } = useAuth();
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
