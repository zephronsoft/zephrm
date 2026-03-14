import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Loader2, X, User, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { COUNTRIES } from '../lib/countries';

/* ── helpers ── */
const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  departmentId: '', positionId: '', salary: '', status: 'ACTIVE', employmentType: 'FULL_TIME',
  joiningDate: new Date().toISOString().split('T')[0],
  gender: '', address: '', city: '', country: '',
};

const statusStyle: Record<string, React.CSSProperties> = {
  ACTIVE:     { backgroundColor: 'rgba(16,185,129,0.1)',  color: '#059669' },
  INACTIVE:   { backgroundColor: 'rgba(100,116,139,0.1)', color: '#64748b' },
  ON_LEAVE:   { backgroundColor: 'rgba(245,158,11,0.1)',  color: '#d97706' },
  TERMINATED: { backgroundColor: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
};

const InputField: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
  min?: number; step?: string;
}> = ({ label, value, onChange, type = 'text', placeholder, disabled, min, step }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled} min={min} step={step}
      className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all disabled:opacity-50"
      style={{ border: '1.5px solid #e2e8f0', background: disabled ? '#f8fafc' : '#fff' }}
      onFocus={e => { if (!disabled) { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; } }}
      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

const SelectField: React.FC<{
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}> = ({ label, value, onChange, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all bg-white appearance-none"
      style={{ border: '1.5px solid #e2e8f0' }}
      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
    >
      {children}
    </select>
  </div>
);

/* ── Main component ── */
export const Employees: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE'); // default: hide onboarding joiners (INACTIVE)
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewEmployee, setViewEmployee] = useState<any>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employees', {
        params: {
          search: search || undefined,
          department: selectedDept || undefined,
          status: selectedStatus || undefined,
          page,
          limit: 10,
        },
      });
      setEmployees(data.employees);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  }, [search, selectedDept, selectedStatus, page]);

  useEffect(() => {
    // null means param not in URL → default to ACTIVE; empty string means explicit "All"
    const raw = searchParams.get('status');
    setSelectedStatus(raw !== null ? raw : 'ACTIVE');
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (selectedStatus) params.set('status', selectedStatus);
    else params.delete('status');
    setSearchParams(params, { replace: true });
  }, [selectedStatus, searchParams, setSearchParams]);

  const [positions, setPositions] = useState<any[]>([]);
  const fetchPositions = useCallback(() => {
    api.get('/positions').then(r => setPositions(r.data || [])).catch(() => setPositions([]));
  }, []);
  useEffect(() => { api.get('/departments').then(r => setDepartments(r.data)).catch(() => {}); }, []);
  useEffect(() => { fetchPositions(); }, [fetchPositions]);
  useEffect(() => {
    if (showModal) fetchPositions();
  }, [showModal, fetchPositions]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee deleted');
      setDeleteId(null);
      fetchEmployees();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to delete'); }
  };

  const openEdit = async (emp: any) => {
    try {
      const { data } = await api.get(`/employees/${emp.id}`);
      setEditingEmployee(data);
      setShowModal(true);
    } catch { toast.error('Failed to load employee'); }
  };

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Employees</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} total members</p>
        </div>
        <button
          onClick={() => { setEditingEmployee(null); setShowModal(true); }}
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 18px rgba(99,102,241,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)'; }}
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email or ID…"
            className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl outline-none transition-all bg-white text-slate-800"
            style={{ border: '1.5px solid #e2e8f0' }}
            onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm rounded-xl outline-none bg-white text-slate-700"
          style={{ border: '1.5px solid #e2e8f0', minWidth: 160 }}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select
          value={selectedStatus}
          onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm rounded-xl outline-none bg-white text-slate-700"
          style={{ border: '1.5px solid #e2e8f0', minWidth: 160 }}
        >
          <option value="">All (incl. Onboarding)</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="TERMINATED">Terminated</option>
          <option value="INACTIVE">Onboarding / Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                {['Employee', 'Department', 'Position', 'Joining Date', 'Type', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-20">
                  <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Loading…</p>
                </td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-20">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <User size={26} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-semibold">No employees found</p>
                  <p className="text-slate-400 text-sm mt-1">Adjust your search or filters</p>
                </td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="group transition-colors hover:bg-slate-50/60" style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setViewEmployee(emp)} className="flex items-center gap-3 text-left w-full">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400">{emp.employeeId} · {emp.email}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-600">{emp.department?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-600">{emp.position?.title || '—'}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-500 whitespace-nowrap">
                    {emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM dd, yyyy') : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                      {emp.employmentType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={statusStyle[emp.status] || { backgroundColor: '#f1f5f9', color: '#64748b' }}>
                      {emp.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(emp)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteId(emp.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{(page - 1) * 10 + 1}–{Math.min(page * 10, total)}</span> of <span className="font-semibold text-slate-700">{total}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30 text-slate-500 hover:bg-slate-200 transition-colors">
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-semibold text-slate-600 px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30 text-slate-500 hover:bg-slate-200 transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <EmployeeModal
          employee={editingEmployee} departments={departments} positions={positions}
          onClose={() => { setShowModal(false); setEditingEmployee(null); }}
          onSave={() => { setShowModal(false); setEditingEmployee(null); fetchEmployees(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full modal-in">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center">Delete Employee?</h3>
            <p className="text-sm text-slate-500 text-center mt-1.5">This action cannot be undone.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                style={{ border: '1.5px solid #e2e8f0' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Employee */}
      {viewEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setViewEmployee(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto modal-in">
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="font-bold text-slate-800">Employee Profile</h2>
              <button onClick={() => setViewEmployee(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              {/* Profile header */}
              <div className="flex items-center gap-4 p-4 rounded-2xl mb-5"
                style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {viewEmployee.firstName[0]}{viewEmployee.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">{viewEmployee.firstName} {viewEmployee.lastName}</h3>
                  <p className="text-sm font-medium text-indigo-600">{viewEmployee.position?.title || 'No Position'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{viewEmployee.employeeId} · {viewEmployee.department?.name || 'No Dept'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['Email', viewEmployee.email],
                  ['Phone', viewEmployee.phone || '—'],
                  ['Status', viewEmployee.status?.replace('_', ' ')],
                  ['Type', viewEmployee.employmentType?.replace('_', ' ')],
                  ['Joining Date', viewEmployee.joiningDate ? format(new Date(viewEmployee.joiningDate), 'MMM dd, yyyy') : '—'],
                  ['Salary', viewEmployee.salary ? `$${Number(viewEmployee.salary).toLocaleString()}` : '—'],
                  ['City', viewEmployee.city || '—'],
                  ['Country', viewEmployee.country || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{k}</p>
                    <p className="text-[13px] font-semibold text-slate-700 mt-0.5 truncate">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Employee Modal ── */
const EmployeeModal: React.FC<{
  employee: any; departments: any[]; positions: any[];
  onClose: () => void; onSave: () => void;
}> = ({ employee, departments, positions, onClose, onSave }) => {
  const isEdit = !!employee;
  const [form, setForm] = useState({ ...emptyForm, ...(employee ? {
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    email: employee.email || '',
    phone: employee.phone || '',
    departmentId: employee.department?.id || employee.departmentId || '',
    positionId: employee.position?.id || employee.positionId || '',
    salary: employee.salary != null ? String(employee.salary) : '',
    status: employee.status || 'ACTIVE',
    employmentType: employee.employmentType || 'FULL_TIME',
    joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    gender: employee.gender || '',
    address: employee.address || '',
    city: employee.city || '',
    country: employee.country || '',
  } : {}) });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'basic' | 'employment' | 'personal'>('basic');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error('First name, last name and email are required');
      setTab('basic');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error('Please enter a valid email address');
      setTab('basic');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        const payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || '',
          departmentId: form.departmentId || '',
          positionId: form.positionId || '',
          salary: form.salary.trim() || '',
          status: form.status,
          employmentType: form.employmentType,
          joiningDate: form.joiningDate,
          gender: form.gender.trim() || '',
          address: form.address.trim() || '',
          city: form.city.trim() || '',
          country: form.country.trim() || '',
        };
        await api.put(`/employees/${employee.id}`, payload);
        toast.success('Employee updated!');
      } else {
        const payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          departmentId: form.departmentId || undefined,
          positionId: form.positionId || undefined,
          salary: form.salary.trim() ? form.salary : undefined,
          status: form.status,
          employmentType: form.employmentType,
          joiningDate: form.joiningDate,
          gender: form.gender || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          country: form.country.trim() || undefined,
        };
        await api.post('/employees', payload);
        toast.success('Employee added! They can login with their email and password: Welcome@123', { duration: 6000 });
      }
      onSave();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to save employee';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const tabs = [['basic', 'Basic Info'], ['employment', 'Employment'], ['personal', 'Personal']] as const;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col modal-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 className="font-bold text-slate-800">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? `Editing ${employee.firstName} ${employee.lastName}` : 'Fill in the details below'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 gap-1" style={{ borderBottom: '1px solid #f1f5f9' }}>
          {tabs.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`px-4 py-3 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
                tab === id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {tab === 'basic' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="First Name *" value={form.firstName} onChange={v => set('firstName', v)} placeholder="John" />
                  <InputField label="Last Name *" value={form.lastName} onChange={v => set('lastName', v)} placeholder="Doe" />
                </div>
                <InputField label="Email Address *" value={form.email} onChange={v => set('email', v)} type="email" placeholder="john@company.com" disabled={isEdit} />
                <InputField label="Phone Number" value={form.phone} onChange={v => set('phone', v)} placeholder="+1 234 567 8900" type="tel" />
                <div className="grid grid-cols-2 gap-4">
                  <SelectField label="Department" value={form.departmentId} onChange={v => set('departmentId', v)}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </SelectField>
                  <SelectField label="Position" value={form.positionId} onChange={v => set('positionId', v)}>
                    <option value="">Select Position</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </SelectField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SelectField label="Status" value={form.status} onChange={v => set('status', v)}>
                    {['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'].map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </SelectField>
                </div>
              </>
            )}
            {tab === 'employment' && (
              <>
                <SelectField label="Employment Type" value={form.employmentType} onChange={v => set('employmentType', v)}>
                  {[['FULL_TIME', 'Full Time'], ['PART_TIME', 'Part Time'], ['CONTRACT', 'Contract'], ['INTERN', 'Intern']].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </SelectField>
                <InputField
                  label="Annual Salary ($)"
                  value={form.salary}
                  onChange={v => set('salary', v)}
                  type="number"
                  placeholder="50000"
                  min={0}
                  step="0.01"
                />
                <InputField label="Joining Date" value={form.joiningDate} onChange={v => set('joiningDate', v)} type="date" />
              </>
            )}
            {tab === 'personal' && (
              <>
                <SelectField label="Gender" value={form.gender} onChange={v => set('gender', v)}>
                  <option value="">Select Gender</option>
                  {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => <option key={g} value={g}>{g}</option>)}
                </SelectField>
                <InputField label="Address" value={form.address} onChange={v => set('address', v)} placeholder="123 Main St" />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="City" value={form.city} onChange={v => set('city', v)} placeholder="New York" />
                  <SelectField label="Country" value={form.country} onChange={v => set('country', v)}>
                    <option value="">Select Country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </SelectField>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #f1f5f9' }}>
            {/* Step dots */}
            <div className="flex gap-1.5">
              {(['basic', 'employment', 'personal'] as const).map(t => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: tab === t ? 20 : 6, background: tab === t ? '#6366f1' : '#e2e8f0' }} />
              ))}
            </div>
            <div className="flex gap-2.5">
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                style={{ border: '1.5px solid #e2e8f0' }}>
                Cancel
              </button>
              {tab !== 'personal' ? (
                <button type="button" onClick={() => setTab(tab === 'basic' ? 'employment' : 'personal')}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                  style={{ border: '1.5px solid rgba(99,102,241,0.3)' }}>
                  Next →
                </button>
              ) : (
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', minWidth: 130 }}>
                  {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : isEdit ? 'Save Changes' : 'Add Employee'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
