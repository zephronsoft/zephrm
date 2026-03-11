import React, { useEffect, useState } from 'react';
import { Clock, UserCheck, UserX } from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';

const statusStyle: Record<string, React.CSSProperties> = {
  PRESENT: { backgroundColor: 'rgba(16,185,129,0.1)',  color: '#059669' },
  ABSENT:  { backgroundColor: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
  LATE:    { backgroundColor: 'rgba(245,158,11,0.1)',  color: '#d97706' },
  HALF_DAY:{ backgroundColor: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
};

export const Attendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/attendance', {
        params: { month, year, employeeId: selectedEmployee || undefined, limit: 50 },
      });
      setRecords(data.records);
      setTotal(data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { api.get('/employees', { params: { limit: 100 } }).then(r => setEmployees(r.data.employees)); }, []);
  useEffect(() => { fetchAttendance(); }, [month, year, selectedEmployee]);

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const absentCount  = records.filter(r => r.status === 'ABSENT').length;
  const lateCount    = records.filter(r => r.status === 'LATE').length;

  const selectCls = "px-3 py-2.5 text-sm rounded-xl outline-none bg-white text-slate-700 transition-all";
  const selectStyle = { border: '1.5px solid #e2e8f0' };

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Attendance</h1>
        <p className="text-slate-500 text-sm mt-0.5">{total} records this period</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Present', value: presentCount, icon: UserCheck, grad: 'linear-gradient(135deg,#10b981,#34d399)', soft: 'rgba(16,185,129,0.1)' },
          { label: 'Absent',  value: absentCount,  icon: UserX,   grad: 'linear-gradient(135deg,#ef4444,#f87171)', soft: 'rgba(239,68,68,0.1)' },
          { label: 'Late',    value: lateCount,    icon: Clock,   grad: 'linear-gradient(135deg,#f59e0b,#fb923c)', soft: 'rgba(245,158,11,0.1)' },
        ].map(({ label, value, icon: Icon, grad, soft }) => (
          <div key={label} className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: grad }}>
                <Icon size={18} className="text-white" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: soft, color: grad.includes('10b981') ? '#059669' : grad.includes('ef4444') ? '#dc2626' : '#d97706' }}>
                {total > 0 ? Math.round((value / total) * 100) : 0}%
              </span>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className={selectCls} style={selectStyle}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className={selectCls} style={selectStyle}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className={selectCls} style={{ ...selectStyle, minWidth: 180 }}>
          <option value="">All Employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
              {['Employee', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-16">
                <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-400">Loading…</p>
              </td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Clock size={22} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-semibold">No attendance records</p>
                <p className="text-slate-400 text-sm mt-1">Try a different month or filter</p>
              </td></tr>
            ) : records.map(rec => (
              <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                      {rec.employee?.firstName?.[0]}{rec.employee?.lastName?.[0]}
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700">
                      {rec.employee?.firstName} {rec.employee?.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[13px] text-slate-600">
                  {format(new Date(rec.date), 'MMM dd, yyyy')}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-medium text-slate-700">
                  {rec.clockIn ? format(new Date(rec.clockIn), 'HH:mm') : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-medium text-slate-700">
                  {rec.clockOut ? format(new Date(rec.clockOut), 'HH:mm') : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3.5 text-[13px] text-slate-600">
                  {rec.workHours ? (
                    <span className="font-semibold">{rec.workHours.toFixed(1)}<span className="font-normal text-slate-400">h</span></span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={statusStyle[rec.status] || { backgroundColor: '#f1f5f9', color: '#64748b' }}>
                    {rec.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
