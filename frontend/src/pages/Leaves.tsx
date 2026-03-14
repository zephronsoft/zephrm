import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Check, X, Calendar, RotateCcw } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isAdmin = (role?: string) => role ? ADMIN_ROLES.includes(role) : false;

const statusStyle: Record<string, React.CSSProperties> = {
  PENDING:  { backgroundColor: 'rgba(245,158,11,0.1)',  color: '#d97706' },
  APPROVED: { backgroundColor: 'rgba(16,185,129,0.1)',  color: '#059669' },
  REJECTED: { backgroundColor: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
};

const inputCls = "w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all";
const inputStyle = { border: '1.5px solid #e2e8f0' };
const focusStyle = { borderColor: '#6366f1', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' };

export const Leaves: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const admin = isAdmin(user?.role);
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [myEmployeeId, setMyEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [leaveTab, setLeaveTab] = useState<'basic' | 'details'>('basic');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [form, setForm] = useState({ employeeId: '', leaveTypeId: '', startDate: '', endDate: '', days: 1, reason: '' });

  const fetchData = async () => {
    const fetches: Promise<any>[] = [
      api.get('/leaves', { params: { status: statusFilter || undefined, limit: 50 } }),
      api.get('/leaves/types'),
    ];
    if (admin) fetches.push(api.get('/employees', { params: { limit: 100 } }));
    else fetches.push(api.get('/employees/me').catch(() => ({ data: null })));
    const results = await Promise.all(fetches);
    setRequests(results[0].data.requests);
    setLeaveTypes(results[1].data);
    if (admin) setEmployees(results[2].data?.employees || []);
    else setMyEmployeeId(results[2].data?.id || '');
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [statusFilter, admin]);

  const handleApprove = async (id: string) => {
    await api.put(`/leaves/${id}/approve`); toast.success('Approved'); fetchData();
  };
  const handleReject = async (id: string) => {
    await api.put(`/leaves/${id}/reject`); toast.success('Rejected'); fetchData();
  };
  const handleRevert = async (id: string) => {
    if (!confirm('Revert this leave request?')) return;
    await api.delete(`/leaves/${id}`); toast.success('Leave reverted'); fetchData();
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = admin ? form : { ...form, employeeId: myEmployeeId };
    if (!payload.employeeId) { toast.error('No employee profile linked'); return; }
    try {
      await api.post('/leaves', payload); toast.success('Leave request submitted');
      setShowModal(false); fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const tabs = [{ v: '', l: 'All' }, { v: 'PENDING', l: 'Pending' }, { v: 'APPROVED', l: 'Approved' }, { v: 'REJECTED', l: 'Rejected' }];

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Leave Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{admin ? `${pendingCount} pending approvals` : 'Your leave requests'}</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setLeaveTab('basic');
          }}
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5">
        {tabs.map(({ v, l }) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
            style={statusFilter === v
              ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }
              : { background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
              {['Employee', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', ''].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16">
                <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Calendar size={22} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-semibold">No leave requests</p>
              </td></tr>
            ) : requests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50/60 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-800">
                  {req.employee?.firstName} {req.employee?.lastName}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                    {req.leaveType?.name}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[13px] text-slate-600">{format(new Date(req.startDate), 'MMM dd')}</td>
                <td className="px-5 py-3.5 text-[13px] text-slate-600">{format(new Date(req.endDate), 'MMM dd, yyyy')}</td>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700">{req.days}d</td>
                <td className="px-5 py-3.5 text-[13px] text-slate-500 max-w-[140px] truncate">{req.reason || '—'}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={statusStyle[req.status] || { backgroundColor: '#f1f5f9', color: '#64748b' }}>
                    {req.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {req.status === 'PENDING' && (
                    <div className="flex gap-1">
                      {admin && (
                        <>
                          <button onClick={() => handleApprove(req.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                            <Check size={13} />
                          </button>
                          <button onClick={() => handleReject(req.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <X size={13} />
                          </button>
                        </>
                      )}
                      {!admin && (
                        <button onClick={() => handleRevert(req.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Revert">
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Request Modal - centered like Add Employee */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-12"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[calc(100vh-6rem)] flex flex-col modal-in"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 className="font-bold text-slate-800">New Leave Request</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details below</p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 gap-1" style={{ borderBottom: '1px solid #f1f5f9' }}>
              {[
                ['basic', 'Basic Info'],
                ['details', 'Dates & Reason'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLeaveTab(id as 'basic' | 'details')}
                  className={`px-4 py-3 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
                    leaveTab === id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Body + footer */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {leaveTab === 'basic' && (
                  <>
                    {admin && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Employee</label>
                        <select
                          value={form.employeeId}
                          onChange={e => setForm({ ...form, employeeId: e.target.value })}
                          required
                          className={inputCls + ' bg-white appearance-none'}
                          style={inputStyle}
                          onFocus={e => Object.assign(e.target.style, focusStyle)}
                          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                        >
                          <option value="">Select Employee</option>
                          {employees.map(e => (
                            <option key={e.id} value={e.id}>
                              {e.firstName} {e.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Leave Type</label>
                      <select
                        value={form.leaveTypeId}
                        onChange={e => setForm({ ...form, leaveTypeId: e.target.value })}
                        required
                        className={inputCls + ' bg-white appearance-none'}
                        style={inputStyle}
                        onFocus={e => Object.assign(e.target.style, focusStyle)}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      >
                        <option value="">Select Type</option>
                        {leaveTypes.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Days</label>
                      <input
                        type="number"
                        min="1"
                        value={form.days}
                        onChange={e => setForm({ ...form, days: Number(e.target.value) })}
                        className={inputCls}
                        style={inputStyle}
                        onFocus={e => Object.assign(e.target.style, focusStyle)}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </>
                )}

                {leaveTab === 'details' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        ['Start Date', 'startDate', 'date'],
                        ['End Date', 'endDate', 'date'],
                      ].map(([label, key, type]) => (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
                          <input
                            type={type}
                            value={(form as any)[key]}
                            onChange={e => setForm({ ...form, [key]: e.target.value })}
                            required
                            className={inputCls}
                            style={inputStyle}
                            onFocus={e => Object.assign(e.target.style, focusStyle)}
                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Reason</label>
                      <textarea
                        value={form.reason}
                        onChange={e => setForm({ ...form, reason: e.target.value })}
                        rows={3}
                        className={inputCls + ' resize-none'}
                        style={inputStyle}
                        onFocus={e => Object.assign(e.target.style, focusStyle)}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                <div className="flex gap-1.5">
                  {(['basic', 'details'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLeaveTab(t)}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: leaveTab === t ? 20 : 6, background: leaveTab === t ? '#6366f1' : '#e2e8f0' }}
                    />
                  ))}
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    style={{ border: '1.5px solid #e2e8f0' }}
                  >
                    Cancel
                  </button>
                  {leaveTab !== 'details' ? (
                    <button
                      type="button"
                      onClick={() => setLeaveTab('details')}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                      style={{ border: '1.5px solid rgba(99,102,241,0.3)' }}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', minWidth: 130 }}
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
