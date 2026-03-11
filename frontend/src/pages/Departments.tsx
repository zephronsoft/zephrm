import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Building2, Users, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

const DEPT_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fb923c)',
  'linear-gradient(135deg,#ef4444,#f87171)',
];

export const Departments: React.FC = () => {
  const { user } = useAuth();
  const canEdit = user ? ADMIN_ROLES.includes(user.role) : false;
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [bulkForms, setBulkForms] = useState([{ name: '', description: '' }]);
  const [saving, setSaving] = useState(false);

  const fetchDepts = async () => {
    const { data } = await api.get('/departments');
    setDepartments(data);
    setLoading(false);
  };
  useEffect(() => { fetchDepts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await api.put(`/departments/${editing.id}`, form); toast.success('Department updated'); }
      else {
        const prepared = bulkForms.map((item) => ({
          name: item.name.trim(),
          description: item.description.trim(),
        }));
        const withContent = prepared.filter((item) => item.name || item.description);

        if (!withContent.length) {
          toast.error('Please add at least one department');
          return;
        }

        const missingName = withContent.some((item) => !item.name);
        if (missingName) {
          toast.error('Department name is required for each row');
          return;
        }

        const payload = withContent.map((item) => ({
          name: item.name,
          description: item.description || null,
        }));

        await api.post('/departments', payload.length === 1 ? payload[0] : payload);
        toast.success(payload.length === 1 ? 'Department created' : `${payload.length} departments created`);
      }
      setShowModal(false); setEditing(null); setForm({ name: '', description: '' }); setBulkForms([{ name: '', description: '' }]);
      fetchDepts();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    await api.delete(`/departments/${id}`);
    toast.success('Deleted');
    fetchDepts();
  };

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '' }); setBulkForms([{ name: '', description: '' }]); setShowModal(true); };
  const openEdit = (d: any) => { setEditing(d); setForm({ name: d.name, description: d.description || '' }); setShowModal(true); };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Departments</h1>
          <p className="text-slate-500 text-sm mt-0.5">{departments.length} departments</p>
        </div>
        {canEdit && (
          <button onClick={openAdd}
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <Plus size={16} /> Add Department
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, i) => (
            <div key={dept.id}
              className="bg-white rounded-2xl p-5 group transition-all duration-200"
              style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }}>
                  <Building2 size={20} className="text-white" />
                </div>
                {canEdit && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(dept)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(dept.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-[15px]">{dept.name}</h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{dept.description || 'No description'}</p>
              <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #f8fafc' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <Users size={12} style={{ color: '#6366f1' }} />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {dept._count?.employees ?? 0} employees
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl modal-in">
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="font-bold text-slate-800">{editing ? 'Edit Department' : 'New Department'}</h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name *</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all"
                      style={{ border: '1.5px solid #e2e8f0' }}
                      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all resize-none"
                      style={{ border: '1.5px solid #e2e8f0' }}
                      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
                    {bulkForms.map((item, index) => (
                      <div key={index} className="rounded-xl p-3" style={{ border: '1px solid #f1f5f9' }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Department {index + 1}</p>
                          {bulkForms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setBulkForms(prev => prev.filter((_, i) => i !== index))}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name *</label>
                          <input
                            value={item.name}
                            onChange={e => setBulkForms(prev => prev.map((row, i) => i === index ? { ...row, name: e.target.value } : row))}
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all"
                            style={{ border: '1.5px solid #e2e8f0' }}
                            onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
                          <textarea
                            value={item.description}
                            onChange={e => setBulkForms(prev => prev.map((row, i) => i === index ? { ...row, description: e.target.value } : row))}
                            rows={2}
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all resize-none"
                            style={{ border: '1.5px solid #e2e8f0' }}
                            onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setBulkForms(prev => [...prev, { name: '', description: '' }])}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                    style={{ border: '1.5px dashed #c7d2fe' }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus size={15} /> Add Another Department
                    </span>
                  </button>
                </>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  style={{ border: '1.5px solid #e2e8f0' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {saving ? 'Saving…' : editing ? 'Update' : bulkForms.length > 1 ? 'Create Departments' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
