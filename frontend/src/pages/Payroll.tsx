import React, { useEffect, useState } from 'react';
import { DollarSign, Zap, TrendingUp, CreditCard, Pencil, X, Check } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isAdmin = (role?: string) => role ? ADMIN_ROLES.includes(role) : false;

export const Payroll: React.FC = () => {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ basicSalary: 0, allowances: 0, deductions: 0, status: 'DRAFT' });

  const fetchPayroll = async () => {
    setLoading(true);
    const { data } = await api.get('/payroll', { params: { month, year, limit: 50 } });
    let list = data.payslips || [];
    if (!admin && user?.email) {
      list = list.filter((p: any) => p.employee?.email === user.email);
    }
    setPayslips(list);
    setTotal(admin ? (data.total || 0) : list.length);
    setLoading(false);
  };
  useEffect(() => { fetchPayroll(); }, [month, year, admin, user?.email]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/payroll/generate', { month, year });
      toast.success(data.message);
      fetchPayroll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error generating payroll'); }
    finally { setGenerating(false); }
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditForm({ basicSalary: p.basicSalary, allowances: p.allowances, deductions: p.deductions, status: p.status });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      const net = editForm.basicSalary + editForm.allowances - editForm.deductions;
      await api.put(`/payroll/${editingId}`, { ...editForm, netSalary: net, tax: editForm.deductions });
      toast.success('Payslip updated');
      setEditingId(null);
      fetchPayroll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to update'); }
  };

  const totalNet   = payslips.reduce((s, p) => s + p.netSalary, 0);
  const totalBasic = payslips.reduce((s, p) => s + p.basicSalary, 0);
  const paidCount  = payslips.filter(p => p.status === 'PAID').length;

  const selectCls = "px-3 py-2.5 text-sm rounded-xl outline-none bg-white text-slate-700";
  const selectStyle = { border: '1.5px solid #e2e8f0' };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{admin ? 'Payroll' : 'My Salary'}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{admin ? `${total} payslips` : 'Your salary details'}</p>
        </div>
        {admin && (
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Zap size={15} className={generating ? 'animate-pulse' : ''} />
          {generating ? 'Generating…' : 'Generate Payroll'}
        </button>
        )}
      </div>

      {/* Summary cards — admin only */}
      {admin && (
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Basic', value: `$${Math.round(totalBasic).toLocaleString()}`, icon: DollarSign, grad: 'linear-gradient(135deg,#6366f1,#818cf8)', soft: 'rgba(99,102,241,0.1)' },
          { label: 'Net Payable', value: `$${Math.round(totalNet).toLocaleString()}`,   icon: TrendingUp, grad: 'linear-gradient(135deg,#10b981,#34d399)', soft: 'rgba(16,185,129,0.1)' },
          { label: 'Paid',        value: `${paidCount} / ${total}`,                      icon: CreditCard, grad: 'linear-gradient(135deg,#f59e0b,#fb923c)', soft: 'rgba(245,158,11,0.1)' },
        ].map(({ label, value, icon: Icon, grad }) => (
          <div key={label} className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: grad }}>
                <Icon size={18} className="text-white" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className={selectCls} style={selectStyle}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className={selectCls} style={selectStyle}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
              {['Employee', 'Department', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status', ...(admin ? ['Actions'] : [])].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={admin ? 8 : 7} className="text-center py-16">
                <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : payslips.length === 0 ? (
              <tr><td colSpan={admin ? 8 : 7} className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <DollarSign size={22} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-semibold">{admin ? 'No payslips yet' : 'No payslip for this period'}</p>
                <p className="text-slate-400 text-sm mt-1">{admin ? 'Click "Generate Payroll" to create payslips' : 'Your payslip will appear here once processed'}</p>
              </td></tr>
            ) : payslips.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/60 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-800">
                  {p.employee?.firstName} {p.employee?.lastName}
                </td>
                <td className="px-5 py-3.5 text-[13px] text-slate-600">{p.employee?.department?.name || '—'}</td>
                <td className="px-5 py-3.5 text-[13px] text-slate-700 font-medium">${p.basicSalary.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: '#059669' }}>+${p.allowances.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: '#dc2626' }}>-${p.deductions.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-[13px] font-bold text-slate-800">${p.netSalary.toLocaleString()}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={p.status === 'PAID'
                      ? { background: 'rgba(16,185,129,0.1)', color: '#059669' }
                      : { background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
                    {p.status}
                  </span>
                </td>
                {admin && (
                <td className="px-5 py-3.5">
                  <button onClick={() => startEdit(p)} title="Edit"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <Pencil size={14} />
                  </button>
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editingId && admin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Update Payslip</h3>
              <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Basic Salary</label>
                <input type="number" value={editForm.basicSalary} onChange={e => setEditForm(f => ({ ...f, basicSalary: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500" min={0} step={100} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Allowances</label>
                <input type="number" value={editForm.allowances} onChange={e => setEditForm(f => ({ ...f, allowances: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500" min={0} step={100} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deductions</label>
                <input type="number" value={editForm.deductions} onChange={e => setEditForm(f => ({ ...f, deductions: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500" min={0} step={100} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500">
                  <option value="DRAFT">Draft</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
              <p className="text-sm text-slate-500">Net: ${(editForm.basicSalary + editForm.allowances - editForm.deductions).toLocaleString()}</p>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">
                Cancel
              </button>
              <button onClick={handleUpdate} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Check size={16} /> Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
