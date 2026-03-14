import React, { useEffect, useState, useRef } from 'react';
import { Plus, Briefcase, Users, X, MapPin, DollarSign, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const EMPTY_FORM = {
  title: '', location: '', type: 'FULL_TIME', experienceRequired: '',
  jobSummary: '', responsibilities: '', requiredSkills: '', preferredSkills: '',
  qualification: '', salary: '', salaryAndBenefits: '', aboutCompany: '',
  howToApply: '', hrEmail: '', status: 'OPEN',
};

export const Recruitment: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const admin = isAdmin(user?.role);
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [tab, setTab] = useState<'jobs' | 'applications'>('jobs');
  const [jobStatusFilter, setJobStatusFilter] = useState(searchParams.get('status') || '');
  const [loading, setLoading] = useState(true);

  // Post modal
  const [showModal, setShowModal] = useState(false);
  const [jobFormTab, setJobFormTab] = useState<'basic' | 'details' | 'more'>('basic');
  const [jobForm, setJobForm] = useState(EMPTY_FORM);

  const fetchData = async () => {
    const [j, a] = await Promise.all([api.get('/recruitment/jobs'), api.get('/recruitment/applications')]);
    setJobs(j.data); setApplications(a.data); setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const status = searchParams.get('status') || '';
    setJobStatusFilter(status);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (jobStatusFilter) params.set('status', jobStatusFilter);
    else params.delete('status');
    setSearchParams(params, { replace: true });
  }, [jobStatusFilter, searchParams, setSearchParams]);

  useEffect(() => {
    if (!showModal) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowModal(false); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [showModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title.trim()) {
      toast.error('Job title is required');
      setJobFormTab('basic');
      return;
    }
    try {
      await api.post('/recruitment/jobs', jobForm);
      toast.success('Job posted');
      setShowModal(false); setJobFormTab('basic'); setJobForm(EMPTY_FORM); fetchData();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Error posting job'); }
  };

  const toggleJobStatus = async (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      await api.put(`/recruitment/jobs/${job.id}`, { status: next });
      toast.success(`Job ${next === 'OPEN' ? 'reopened' : 'closed'}`);
      fetchData();
    } catch {
      toast.error('Failed to update job status');
    }
  };

  const deleteJob = async (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete job "${job.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/recruitment/jobs/${job.id}`);
      toast.success('Job deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete job');
    }
  };

  const bodyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!showModal || !bodyRef.current) return;
    bodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [jobFormTab, showModal]);

  const openJobs = jobs.filter(j => j.status === 'OPEN').length;
  const filteredJobs = jobs.filter((job) => !jobStatusFilter || job.status === jobStatusFilter);

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

      {tab === 'jobs' && (
        <div className="flex gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'OPEN', label: 'Open' },
            { value: 'CLOSED', label: 'Closed' },
          ].map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => setJobStatusFilter(option.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={jobStatusFilter === option.value
                ? { background: '#6366f1', color: '#fff' }
                : { background: '#fff', color: '#64748b', border: '1px solid #e2e8f0' }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : tab === 'jobs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-white rounded-2xl" style={{ border: '1px solid #f1f5f9' }}>
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Briefcase size={24} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-semibold">No job postings</p>
              <p className="text-slate-400 text-sm mt-1">Post your first job opening</p>
            </div>
          ) : filteredJobs.map((job, i) => (
            <div
              key={job.id}
              onClick={() => navigate(`/recruitment/${job.id}`)}
              className="bg-white rounded-2xl p-5 transition-all duration-200 cursor-pointer group"
              style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: JOB_COLORS[i % JOB_COLORS.length] }}>
                  <Briefcase size={18} className="text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
                    style={job.status === 'OPEN'
                      ? { background: 'rgba(16,185,129,0.1)', color: '#059669' }
                      : { background: 'rgba(100,116,139,0.1)', color: '#64748b' }}>
                    {job.status}
                  </span>
                  {admin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => toggleJobStatus(job, e)}
                        className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                      >
                        {job.status === 'OPEN' ? 'Close' : 'Reopen'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => deleteJob(job, e)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
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
                <span className="flex items-center gap-0.5 text-[11px] text-indigo-400 font-semibold group-hover:text-indigo-600 transition-colors">
                  View <ChevronRight size={12} />
                </span>
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
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-12"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          role="dialog" aria-modal="true" aria-labelledby="post-job-title"
        >
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[calc(100vh-6rem)] flex flex-col modal-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 id="post-job-title" className="font-bold text-slate-800">Post New Job</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details below</p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex px-6 gap-1" style={{ borderBottom: '1px solid #f1f5f9' }}>
              {[['basic', 'Basic Info'], ['details', 'Job Details'], ['more', 'More Info']].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setJobFormTab(id as 'basic' | 'details' | 'more')}
                  className={`px-4 py-3 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
                    jobFormTab === id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div ref={bodyRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {jobFormTab === 'basic' && (
                  <>
                    <Field label="Job Title *" value={jobForm.title} onChange={v => setJobForm({ ...jobForm, title: v })} required />
                    <Field label="Location" value={jobForm.location} onChange={v => setJobForm({ ...jobForm, location: v })} />
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Employment Type</label>
                      <select value={jobForm.type} onChange={e => setJobForm({ ...jobForm, type: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none bg-white" style={{ border: '1.5px solid #e2e8f0' }}>
                        {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <Field label="Experience Required" value={jobForm.experienceRequired} onChange={v => setJobForm({ ...jobForm, experienceRequired: v })} />
                    <Field label="Salary" value={jobForm.salary} onChange={v => setJobForm({ ...jobForm, salary: v })} />
                    <Field label="HR Email (for resume submission)" type="email" value={jobForm.hrEmail} onChange={v => setJobForm({ ...jobForm, hrEmail: v })} placeholder="hr@company.com" />
                  </>
                )}
                {jobFormTab === 'details' && (
                  <>
                    <TextArea label="Job Summary" value={jobForm.jobSummary} onChange={v => setJobForm({ ...jobForm, jobSummary: v })} rows={3} />
                    <TextArea label="Responsibilities" value={jobForm.responsibilities} onChange={v => setJobForm({ ...jobForm, responsibilities: v })} rows={3} />
                    <TextArea label="Required Skills" value={jobForm.requiredSkills} onChange={v => setJobForm({ ...jobForm, requiredSkills: v })} rows={2} />
                    <TextArea label="Preferred Skills" value={jobForm.preferredSkills} onChange={v => setJobForm({ ...jobForm, preferredSkills: v })} rows={2} />
                    <TextArea label="Qualification" value={jobForm.qualification} onChange={v => setJobForm({ ...jobForm, qualification: v })} rows={2} />
                    <TextArea label="Salary and Benefits" value={jobForm.salaryAndBenefits} onChange={v => setJobForm({ ...jobForm, salaryAndBenefits: v })} rows={2} />
                  </>
                )}
                {jobFormTab === 'more' && (
                  <>
                    <TextArea label="About the Company" value={jobForm.aboutCompany} onChange={v => setJobForm({ ...jobForm, aboutCompany: v })} rows={3} />
                    <TextArea label="How to Apply" value={jobForm.howToApply} onChange={v => setJobForm({ ...jobForm, howToApply: v })} rows={3} />
                  </>
                )}
              </div>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                <div className="flex gap-1.5">
                  {(['basic', 'details', 'more'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setJobFormTab(t)}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: jobFormTab === t ? 20 : 6, background: jobFormTab === t ? '#6366f1' : '#e2e8f0' }} />
                  ))}
                </div>
                <div className="flex gap-2.5">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    style={{ border: '1.5px solid #e2e8f0' }}>Cancel</button>
                  {jobFormTab !== 'more' ? (
                    <button type="button" onClick={() => setJobFormTab(jobFormTab === 'basic' ? 'details' : 'more')}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                      style={{ border: '1.5px solid rgba(99,102,241,0.3)' }}>Next →</button>
                  ) : (
                    <button type="submit"
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', minWidth: 130 }}>Post Job</button>
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

const Field = ({ label, value, onChange, type = 'text', required, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none" style={{ border: '1.5px solid #e2e8f0' }}
      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
  </div>
);

const TextArea = ({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none resize-none" style={{ border: '1.5px solid #e2e8f0' }}
      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
  </div>
);
