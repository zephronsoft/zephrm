import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, Clock, DollarSign, TrendingUp,
  Briefcase, Bell, LogOut, Menu, Building2, ChevronRight, User,
  UserPlus, UserCheck, FileText, ShieldCheck, ChevronUp, FolderOpen, Settings,
} from 'lucide-react';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isAdmin = (role?: string) => role ? ADMIN_ROLES.includes(role) : false;
const isRestrictedNewJoiner = (user?: any) =>
  user?.role === 'EMPLOYEE' && !!user?.employee && user?.employee?.status !== 'ACTIVE';

const allNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
  { path: '/employees', label: 'Employees', icon: Users, adminOnly: true },
  { path: '/profile', label: 'My Profile', icon: User, adminOnly: false },
  { path: '/departments', label: 'Departments', icon: Building2, adminOnly: true },
  { path: '/attendance', label: 'Attendance', icon: Clock, adminOnly: true },
  { path: '/leaves', label: 'Leave', icon: Calendar, adminOnly: false },
  { path: '/payroll', label: 'Payroll', icon: DollarSign, adminOnly: false },
  { path: '/performance', label: 'Performance', icon: TrendingUp, adminOnly: true },
  { path: '/recruitment', label: 'Jobs', icon: Briefcase, adminOnly: false },
  { path: '/announcements', label: 'Announcements', icon: Bell, adminOnly: false },
];

const extraNavItems = [
  { path: '/candidates', label: 'Candidates', icon: UserPlus, adminOnly: false },
  { path: '/onboarding', label: 'Onboarding', icon: UserCheck, adminOnly: false },
  { path: '/policy-generator', label: 'Policy Generator', icon: ShieldCheck, adminOnly: true },
  { path: '/policy-generator/saved', label: 'Saved Policies', icon: FolderOpen, adminOnly: false },
  { path: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

const documentNavItems = [
  { path: '/emp-documents/offer-letter', label: 'Offer Letter' },
  { path: '/emp-documents/probation-letter', label: 'Probation Letter' },
  { path: '/emp-documents/increment-letter', label: 'Increment Letter' },
  { path: '/emp-documents/exit-letter', label: 'Exit Letter' },
  { path: '/emp-documents/resignation', label: 'Resignation' },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [empDocsOpen, setEmpDocsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const admin = isAdmin(user?.role);
  const restrictedNewJoiner = isRestrictedNewJoiner(user);
  const navItems = restrictedNewJoiner
    ? []
    : allNavItems.filter((n) => !n.adminOnly || admin);
  const sectionItems = restrictedNewJoiner
    ? [{ path: '/onboarding', label: 'Onboarding', icon: UserCheck, adminOnly: false }]
    : extraNavItems.filter((n) => !n.adminOnly || admin);

  useEffect(() => {
    if (location.pathname.startsWith('/emp-documents')) {
      setEmpDocsOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (user?.email?.slice(0, 2) ?? 'HR').toUpperCase();
  const role = user?.role?.replace(/_/g, ' ') ?? '';
  const currentPage = [...navItems, ...sectionItems, ...(restrictedNewJoiner ? [] : documentNavItems)].find(n =>
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
          <img
            src="/logo/logo.png"
            alt="HRM Pro"
            className="w-8 h-8 rounded-xl object-contain flex-shrink-0"
          />
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

          {!collapsed && (
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.12em] px-5 pt-3 pb-2"
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >
              HR Tools
            </p>
          )}

          {sectionItems.slice(0, 2).map(({ path, label, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
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

          {!restrictedNewJoiner && (
          <div className="mx-2">
            <button
              onClick={() => !collapsed && setEmpDocsOpen((v) => !v)}
              title={collapsed ? 'Emp Documents' : undefined}
              className={`group relative w-full flex items-center ${collapsed ? 'justify-center px-0 h-10' : 'px-3 gap-3'} py-2.5 rounded-xl transition-all duration-150`}
              style={location.pathname.startsWith('/emp-documents') ? {
                background: 'linear-gradient(135deg,rgba(99,102,241,.3),rgba(139,92,246,.2))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
              } : {}}
            >
              {location.pathname.startsWith('/emp-documents') && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400" />
              )}
              <FileText
                size={17}
                className={`flex-shrink-0 transition-colors ${location.pathname.startsWith('/emp-documents') ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'}`}
              />
              {!collapsed && (
                <>
                  <span
                    className={`text-[13px] font-medium truncate ${location.pathname.startsWith('/emp-documents') ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`}
                  >
                    Emp Documents
                  </span>
                  <ChevronUp
                    size={14}
                    className={`ml-auto transition-transform ${empDocsOpen ? 'rotate-0' : 'rotate-180'} ${location.pathname.startsWith('/emp-documents') ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'}`}
                  />
                </>
              )}
            </button>

            {!collapsed && empDocsOpen && (
              <div className="ml-5 mt-1 mb-2 border-l" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                {documentNavItems.map((item) => {
                  const active = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-4 py-2 text-[13px] transition-colors ${active ? 'text-indigo-300' : 'text-slate-400 hover:text-white'}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {!restrictedNewJoiner && sectionItems.slice(2).map(({ path, label, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
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
      <div
        className="flex-1 flex flex-col overflow-hidden min-w-0"
        onMouseMove={(e) => setHeaderVisible(e.clientY < 80)}
      >
        {/* Topbar */}
        <header
          className={`sticky top-0 h-14 flex items-center justify-between px-6 bg-white transition-transform duration-300 ${
            headerVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
          style={{ borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', zIndex: 20 }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setCollapsed(c => !c)}
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Menu size={18} />
            </button>
            <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
              <span className="text-slate-400 font-medium truncate">HRM</span>
              <ChevronRight size={13} className="text-slate-300 flex-shrink-0" aria-hidden />
              <span className="font-semibold text-slate-700 truncate">{currentPage}</span>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
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
