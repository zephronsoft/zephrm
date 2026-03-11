import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, Clock, DollarSign, TrendingUp,
  Briefcase, Bell, LogOut, Menu, Building2, ChevronRight,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/departments', label: 'Departments', icon: Building2 },
  { path: '/attendance', label: 'Attendance', icon: Clock },
  { path: '/leaves', label: 'Leave', icon: Calendar },
  { path: '/payroll', label: 'Payroll', icon: DollarSign },
  { path: '/performance', label: 'Performance', icon: TrendingUp },
  { path: '/recruitment', label: 'Recruitment', icon: Briefcase },
  { path: '/announcements', label: 'Announcements', icon: Bell },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (user?.email?.slice(0, 2) ?? 'HR').toUpperCase();
  const role = user?.role?.replace(/_/g, ' ') ?? '';
  const currentPage = navItems.find(n =>
    n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)
  )?.label ?? 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* ── Sidebar ── */}
      <aside
        className={`${collapsed ? 'w-[68px]' : 'w-58'} flex flex-col flex-shrink-0 transition-[width] duration-300 ease-in-out relative z-20`}
        style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%)' }}
      >
        {/* Brand */}
        <div
          className={`h-16 flex items-center border-b flex-shrink-0 ${collapsed ? 'justify-center' : 'px-5 gap-3'}`}
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <span className="text-white font-bold text-sm">H</span>
          </div>
          {!collapsed && (
            <p className="font-extrabold text-base tracking-tight select-none">
              <span className="text-white">HRM</span>
              <span style={{ color: '#a5b4fc' }}> Pro</span>
            </p>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-0.5">
          {!collapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] px-5 pt-1 pb-2"
              style={{ color: 'rgba(255,255,255,0.22)' }}>
              Menu
            </p>
          )}
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);
            return (
              <Link
                key={path} to={path}
                title={collapsed ? label : undefined}
                className={`group relative flex items-center ${collapsed ? 'justify-center mx-2 px-0 w-10 h-10' : 'mx-2 px-3 gap-3'} py-2.5 rounded-xl transition-all duration-150`}
                style={active ? {
                  background: 'linear-gradient(135deg,rgba(99,102,241,.3),rgba(139,92,246,.2))',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
                } : {}}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400" />
                )}
                <Icon
                  size={17}
                  className={`flex-shrink-0 transition-colors ${active ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'}`}
                />
                {!collapsed && (
                  <span className={`text-[13px] font-medium truncate ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`}>
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-2.5 border-t flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {collapsed ? (
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors mx-auto"
            >
              <LogOut size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white truncate leading-tight">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-500 truncate capitalize">{role.toLowerCase()}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header
          className="h-16 flex items-center justify-between px-6 flex-shrink-0 bg-white"
          style={{ borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(c => !c)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Menu size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <span className="text-slate-400 font-medium">HRM</span>
              <ChevronRight size={13} className="text-slate-300" />
              <span className="font-semibold text-slate-700">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white" />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white ml-1 cursor-default"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};
