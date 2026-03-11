import React, { useEffect, useState } from 'react';
import { Plus, Briefcase, Users, X, MapPin, DollarSign } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isAdmin = (role?: string) => role ? ADMIN_ROLES.includes(role) : false;

const JOB_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fb923c)',
];

const appStatusStyle: Record<string, React.CSSProperties> = {
  APPLIED:   { backgroundColor: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  INTERVIEW: { backgroundColor: 'rgba(6,182,212,0.1)',   color: '#0891b2' },
  HIRED:     { backgroundColor: 'rgba(16,185,129,0.1)',  color: '#059669' },
  REJECTED:  { backgroundColor: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
};

export const Recruitment: React.FC = () => {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [tab, setTab] = useState<'jobs' | 'applications'>('jobs');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', description: '', requirements: '', type: 'FULL_TIME', location: '', salary: '', status: 'OPEN' });

  const fetchData = async () => {
    const [j, a] = await Promise.all([api.get('/recruitment/jobs'), api.get('/recruitment/applications')]);
    setJobs(j.data); setApplications(a.data); setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/recruitment/jobs', jobForm); toast.success('Job posted');
      setShowModal(false); fetchData();
    } catch { toast.error('Error posting job'); }
  };

  const openJobs = jobs.filter(j => j.status === 'OPEN').length;

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Recruitment</h1>
          <p className="text-slate-500 text-sm mt-0.5">{openJobs} open positions</p>
        </div>
        {tab === 'jobs' && admin && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <Plus size={16} /> Post Job
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9', width: 'fit-content' }}>
        {[['jobs', 'Job Postings'], ['applications', 'My Applications']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-all"
            style={tab === key
              ? { background: '#fff', color: '#6366f1', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { background: 'transparent', color: '#94a3b8' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : tab === 'jobs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-white rounded-2xl" style={{ border: '1px solid #f1f5f9' }}>
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Briefcase size={24} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-semibold">No job postings</p>
              <p className="text-slate-400 text-sm mt-1">Post your first job opening</p>
            </div>
          ) : jobs.map((job, i) => (
            <div key={job.id} className="bg-white rounded-2xl p-5 transition-all duration-200"
              style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: JOB_COLORS[i % JOB_COLORS.length] }}>
                  <Briefcase size={18} className="text-white" />
                </div>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
                  style={job.status === 'OPEN'
                    ? { background: 'rgba(16,185,129,0.1)', color: '#059669' }
                    : { background: 'rgba(100,116,139,0.1)', color: '#64748b' }}>
                  {job.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-[15px]">{job.title}</h3>
              <div className="flex flex-wrap gap-3 mt-2">
                {job.location && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={11} /> {job.location}
                  </span>
                )}
                {job.salary && (
                  <span className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                    <DollarSign size={11} /> {job.salary}
                  </span>
                )}
                <span className="text-xs font-medium px-2 py-0.5 rounded-lg"
                  style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                  {job.type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid #f8fafc' }}>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <Users size={11} style={{ color: '#6366f1' }} />
                  </div>
                  <span className="font-medium">{job._count?.applications ?? 0} applicants</span>
                </div>
                <span className="text-[11px] text-slate-400">{format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                {['Applicant', 'Position', 'Email', 'Applied', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">No applications yet</td></tr>
              ) : applications.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/60 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-800">{app.applicantName}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-600">{app.jobPosting?.title}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-600">{app.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-500">{format(new Date(app.createdAt), 'MMM dd, yyyy')}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={appStatusStyle[app.status] || { backgroundColor: '#f1f5f9', color: '#64748b' }}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Post Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto modal-in">
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="font-bold text-slate-800">Post New Job</h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[['title', 'Job Title *', 'text', true], ['location', 'Location', 'text', false], ['salary', 'Salary Range', 'text', false]].map(([key, label, type, req]) => (
                <div key={key as string}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label as string}</label>
                  <input type={type as string} value={(jobForm as any)[key as string]}
                    onChange={e => setJobForm({ ...jobForm, [key as string]: e.target.value })}
                    required={req as boolean}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all"
                    style={{ border: '1.5px solid #e2e8f0' }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Type</label>
                <select value={jobForm.type} onChange={e => setJobForm({ ...jobForm, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none bg-white transition-all appearance-none"
                  style={{ border: '1.5px solid #e2e8f0' }}>
                  {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all resize-none"
                  style={{ border: '1.5px solid #e2e8f0' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  style={{ border: '1.5px solid #e2e8f0' }}>Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
