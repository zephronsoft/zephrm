import React, { useEffect, useState } from 'react';
import { Plus, Star, TrendingUp, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const inputCls = "w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all";
const inputStyle = { border: '1.5px solid #e2e8f0' };
const focusEvents = {
  onFocus: (e: any) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; },
  onBlur:  (e: any) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; },
};

export const Performance: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: '', period: '', rating: 5, goals: '', achievements: '', feedback: '', status: 'PENDING' });

  const fetchData = async () => {
    const [r, e] = await Promise.all([api.get('/performance'), api.get('/employees', { params: { limit: 100 } })]);
    setReviews(r.data); setEmployees(e.data.employees); setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/performance', { ...form, rating: Number(form.rating) });
      toast.success('Review created'); setShowModal(false); fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingGrad = (r: number) => {
    if (r >= 4) return 'linear-gradient(135deg,#10b981,#34d399)';
    if (r >= 3) return 'linear-gradient(135deg,#f59e0b,#fb923c)';
    return 'linear-gradient(135deg,#ef4444,#f87171)';
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Performance Reviews</h1>
          <p className="text-slate-500 text-sm mt-0.5">Avg rating: <span className="font-bold text-slate-700">{avgRating}</span> / 5</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus size={16} /> Add Review
        </button>
      </div>

      {/* Summary bar */}
      <div className="bg-white rounded-2xl p-5 flex items-center gap-6"
        style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#fb923c)' }}>
            <Star size={20} className="text-white fill-white" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-800">{avgRating}</p>
            <p className="text-xs text-slate-500">Average rating</p>
          </div>
        </div>
        <div className="h-10 w-px bg-slate-100" />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={18} className={parseFloat(avgRating) >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
          ))}
        </div>
        <div className="ml-auto text-sm text-slate-500">
          <span className="font-bold text-slate-700">{reviews.length}</span> total reviews
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl" style={{ border: '1px solid #f1f5f9' }}>
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={24} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-semibold">No reviews yet</p>
          <p className="text-slate-400 text-sm mt-1">Add the first performance review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map(rev => (
            <div key={rev.id} className="bg-white rounded-2xl p-5 transition-all duration-200"
              style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    {rev.employee?.firstName?.[0]}{rev.employee?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">{rev.employee?.firstName} {rev.employee?.lastName}</p>
                    <p className="text-[11px] text-slate-400">{rev.employee?.department?.name}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={rev.status === 'COMPLETED'
                    ? { background: 'rgba(16,185,129,0.1)', color: '#059669' }
                    : { background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
                  {rev.status}
                </span>
              </div>

              <p className="text-xs font-semibold text-indigo-600 mb-3 px-2 py-1 rounded-lg inline-block"
                style={{ background: 'rgba(99,102,241,0.08)' }}>
                {rev.period}
              </p>

              {rev.rating && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={13}
                        className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ background: ratingGrad(rev.rating) }}>
                    {rev.rating}/5
                  </span>
                </div>
              )}

              {rev.feedback && (
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{rev.feedback}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto modal-in">
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="font-bold text-slate-800">New Performance Review</h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Employee</label>
                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required
                  className={inputCls + ' bg-white appearance-none'} style={inputStyle} {...focusEvents}>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Period (e.g. Q1 2025)</label>
                <input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} required
                  placeholder="Q1 2025" className={inputCls} style={inputStyle} {...focusEvents} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Rating (1–5)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="5" step="1" value={form.rating}
                    onChange={e => setForm({ ...form, rating: Number(e.target.value) })}
                    className="flex-1 accent-indigo-500" />
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: ratingGrad(form.rating) }}>
                    {form.rating}
                  </span>
                </div>
              </div>
              {[['goals', 'Goals'], ['achievements', 'Achievements'], ['feedback', 'Feedback']].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
                  <textarea value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} rows={2}
                    className={inputCls + ' resize-none'} style={inputStyle} {...focusEvents} />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  style={{ border: '1.5px solid #e2e8f0' }}>Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Save Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
