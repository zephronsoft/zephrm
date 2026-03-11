import React, { useEffect, useState } from 'react';
import { Plus, Bell, X, AlertTriangle, Info } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isAdmin = (role?: string) => role ? ADMIN_ROLES.includes(role) : false;

const priorityConfig: Record<string, { bg: string; border: string; icon: typeof Bell; iconColor: string; badge: string; badgeText: string }> = {
  NORMAL: { bg: '#f8fafc',              border: '#6366f1', icon: Info,         iconColor: '#6366f1', badge: 'rgba(99,102,241,0.1)',  badgeText: '#6366f1' },
  HIGH:   { bg: 'rgba(239,68,68,0.03)', border: '#ef4444', icon: Bell,         iconColor: '#ef4444', badge: 'rgba(239,68,68,0.1)',   badgeText: '#dc2626' },
  URGENT: { bg: 'rgba(245,158,11,0.03)',border: '#f59e0b', icon: AlertTriangle, iconColor: '#f59e0b', badge: 'rgba(245,158,11,0.1)', badgeText: '#d97706' },
};

export const Announcements: React.FC = () => {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'NORMAL' });

  const fetchAnnouncements = async () => {
    const { data } = await api.get('/announcements');
    setAnnouncements(data); setLoading(false);
  };
  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/announcements', form); toast.success('Announcement posted');
      setShowModal(false); setForm({ title: '', content: '', priority: 'NORMAL' });
      fetchAnnouncements();
    } catch { toast.error('Error posting announcement'); }
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Announcements</h1>
          <p className="text-slate-500 text-sm mt-0.5">{announcements.length} announcements</p>
        </div>
        {admin && (
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={16} /> New Announcement
        </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl" style={{ border: '1px solid #f1f5f9' }}>
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Bell size={24} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-semibold">No announcements</p>
          <p className="text-slate-400 text-sm mt-1">Post your first announcement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => {
            const cfg = priorityConfig[ann.priority] ?? priorityConfig.NORMAL;
            const Icon = cfg.icon;
            return (
              <div key={ann.id}
                className="bg-white rounded-2xl p-5 flex gap-4 transition-all duration-150"
                style={{
                  border: `1px solid #f1f5f9`,
                  borderLeft: `3px solid ${cfg.border}`,
                  background: cfg.bg,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.badge }}>
                  <Icon size={16} style={{ color: cfg.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-bold text-slate-800 text-[14px] truncate">{ann.title}</h3>
                      {ann.priority !== 'NORMAL' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                          style={{ background: cfg.badge, color: cfg.badgeText }}>
                          {ann.priority}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
                      {format(new Date(ann.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{ann.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl modal-in">
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="font-bold text-slate-800">New Announcement</h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                  placeholder="Announcement title"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all"
                  style={{ border: '1.5px solid #e2e8f0' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Content *</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} required
                  placeholder="Write your announcement here…"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all resize-none"
                  style={{ border: '1.5px solid #e2e8f0' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Priority</label>
                <div className="flex gap-2">
                  {['NORMAL', 'HIGH', 'URGENT'].map(p => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                      className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
                      style={form.priority === p
                        ? { background: priorityConfig[p]?.badge, color: priorityConfig[p]?.badgeText, border: `1.5px solid ${priorityConfig[p]?.border}` }
                        : { background: '#f8fafc', color: '#94a3b8', border: '1.5px solid #e2e8f0' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  style={{ border: '1.5px solid #e2e8f0' }}>Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
