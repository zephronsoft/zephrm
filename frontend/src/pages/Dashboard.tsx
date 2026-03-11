import React, { useEffect, useState } from 'react';
import { Users, Building2, Clock, Calendar, DollarSign, Briefcase, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatCard } from '../components/StatCard';
import api from '../lib/api';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

const PageHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{title}</h1>
    <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [deptStats, setDeptStats] = useState<any[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/department-stats'),
      api.get('/dashboard/recent-employees'),
      api.get('/announcements'),
    ]).then(([s, d, e, a]) => {
      setStats(s.data);
      setDeptStats(d.data);
      setRecentEmployees(e.data);
      setAnnouncements(a.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={format(new Date(), 'EEEE, MMMM dd, yyyy')}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard title="Total Employees"    value={stats.totalEmployees ?? 0}      icon={Users}     color="indigo" trend={{ value: 12, label: 'vs last month' }} />
        <StatCard title="Departments"         value={stats.departments ?? 0}          icon={Building2} color="purple" />
        <StatCard title="Today's Attendance"  value={`${stats.attendanceRate ?? 0}%`} icon={Clock}     color="green"  subtitle={`${stats.todayAttendance ?? 0} checked in`} />
        <StatCard title="Pending Leaves"      value={stats.pendingLeaves ?? 0}        icon={Calendar}  color="orange" />
        <StatCard title="Active Employees"    value={stats.activeEmployees ?? 0}      icon={TrendingUp} color="blue" />
        <StatCard title="Open Positions"      value={stats.openJobs ?? 0}             icon={Briefcase} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6"
          style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <h3 className="font-bold text-slate-800 text-[15px]">Employees by Department</h3>
            <p className="text-xs text-slate-400 mt-0.5">Headcount per department</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptStats} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }}
                cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 6 }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}
                fill="url(#barGrad)" />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl p-6"
          style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="mb-5">
            <h3 className="font-bold text-slate-800 text-[15px]">Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Department split</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={deptStats} dataKey="count" nameKey="name" cx="50%" cy="50%"
                outerRadius={72} innerRadius={36} paddingAngle={2}>
                {deptStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-3 space-y-1.5">
            {deptStats.slice(0, 4).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-[11px] text-slate-500 truncate max-w-[90px]">{d.name}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-700">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent employees */}
        <div className="bg-white rounded-2xl p-6"
          style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-[15px]">Recent Employees</h3>
            <span className="text-xs font-medium text-indigo-600 px-2 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)' }}>
              {recentEmployees.length} latest
            </span>
          </div>
          <div className="space-y-1">
            {recentEmployees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 truncate">{emp.firstName} {emp.lastName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{emp.department?.name} · {emp.employeeId}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  emp.status === 'ACTIVE'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-500 bg-slate-100'
                }`}>
                  {emp.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl p-6"
          style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-[15px]">Announcements</h3>
            <span className="text-xs font-medium text-indigo-600 px-2 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)' }}>
              {announcements.length} total
            </span>
          </div>
          <div className="space-y-2">
            {announcements.slice(0, 4).map((ann) => (
              <div key={ann.id} className="p-3 rounded-xl hover:bg-slate-50 transition-colors"
                style={{ border: '1px solid #f1f5f9' }}>
                <div className="flex items-start gap-2.5">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${ann.priority === 'HIGH' ? 'bg-red-500' : 'bg-indigo-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{ann.title}</p>
                      {ann.priority === 'HIGH' && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md flex-shrink-0">HIGH</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ann.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{format(new Date(ann.createdAt), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
