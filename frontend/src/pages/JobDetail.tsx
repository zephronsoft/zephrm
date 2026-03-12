import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, DollarSign, Mail, Pencil, Trash2, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isAdmin = (role?: string) => role ? ADMIN_ROLES.includes(role) : false;

const EMPTY_FORM = {
  title: '', location: '', type: 'FULL_TIME', experienceRequired: '',
  jobSummary: '', responsibilities: '', requiredSkills: '', preferredSkills: '',
  qualification: '', salary: '', salaryAndBenefits: '', aboutCompany: '',
  howToApply: '', hrEmail: '', status: 'OPEN',
};

const APP_STATUS_STYLES: Record<string, React.CSSProperties> = {
  APPLIED:   { background: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  INTERVIEW: { background: 'rgba(6,182,212,0.1)',   color: '#0891b2' },
  HIRED:     { background: 'rgba(16,185,129,0.1)',  color: '#059669' },
  REJECTED:  { background: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
};

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const admin = isAdmin(user?.role);

  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editTab, setEditTab] = useState<'basic' | 'details' | 'more'>('basic');
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/recruitment/jobs/${id}`);
      setJob(res.data);
    } catch {
      toast.error('Job not found');
      navigate('/recruitment');
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get(`/recruitment/applications?jobId=${id}`);
      setApplications(res.data);
    } catch {
      setApplications([]);
    }
  };

  useEffect(() => {
    Promise.all([fetchJob(), fetchApplications()]).finally(() => setLoading(false));
  }, [id]);

  const startEdit = () => {
    setEditForm({
      title: job.title || '',
      location: job.location || '',
      type: job.type || 'FULL_TIME',
      experienceRequired: job.experienceRequired || '',
      jobSummary: job.jobSummary || '',
      responsibilities: job.responsibilities || '',
      requiredSkills: job.requiredSkills || '',
      preferredSkills: job.preferredSkills || '',
      qualification: job.qualification || '',
      salary: job.salary || '',
      salaryAndBenefits: job.salaryAndBenefits || '',
      aboutCompany: job.aboutCompany || '',
      howToApply: job.howToApply || '',
      hrEmail: job.hrEmail || '',
      status: job.status || 'OPEN',
    });
    setEditTab('basic');
    setEditMode(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error('Job title is required');
      setEditTab('basic');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/recruitment/jobs/${id}`, editForm);
      setJob(res.data);
      setEditMode(false);
      toast.success('Job updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    const next = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      const res = await api.put(`/recruitment/jobs/${id}`, { status: next });
      setJob(res.data);
      toast.success(`Job ${next === 'OPEN' ? 'reopened' : 'closed'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const deleteJob = async () => {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/recruitment/jobs/${id}`);
      toast.success('Job deleted');
      navigate('/recruitment');
    } catch {
      toast.error('Failed to delete job');
    }
  };

  const updateAppStatus = async (appId: string, status: string) => {
    try {
      await api.put(`/recruitment/applications/${appId}`, { status });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="space-y-6 fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/recruitment')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} /> Back to Jobs
        </button>
        {admin && !editMode && (
          <div className="flex items-center gap-2">
            <button onClick={startEdit}
              className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors"
              style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Pencil size={14} /> Edit Job
            </button>
            <button onClick={toggleStatus}
              className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              {job.status === 'OPEN' ? <XCircle size={14} /> : <CheckCircle size={14} />}
              {job.status === 'OPEN' ? 'Close Job' : 'Reopen Job'}
            </button>
            <button onClick={deleteJob}
              className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors"
              style={{ background: 'rgba(239,68,68,0.07)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
        {editMode && (
          <button onClick={() => setEditMode(false)}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel Edit
          </button>
        )}
      </div>

      {editMode ? (
        /* ── Edit Form ── */
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #f1f5f9' }}>
          <div className="px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <h2 className="font-bold text-slate-800 text-lg">Edit Job</h2>
            <p className="text-sm text-slate-400 mt-0.5">Update the details for "{job.title}"</p>
          </div>
          <div className="flex px-6 gap-1" style={{ borderBottom: '1px solid #f1f5f9' }}>
            {[['basic', 'Basic Info'], ['details', 'Job Details'], ['more', 'More Info']].map(([tab, label]) => (
              <button key={tab} type="button" onClick={() => setEditTab(tab as any)}
                className={`px-4 py-3 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
                  editTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}>
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSave}>
            <div className="p-6 space-y-4">
              {editTab === 'basic' && (
                <>
                  <Field label="Job Title *" value={editForm.title} onChange={v => setEditForm({ ...editForm, title: v })} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Location" value={editForm.location} onChange={v => setEditForm({ ...editForm, location: v })} />
                    <Field label="Experience Required" value={editForm.experienceRequired} onChange={v => setEditForm({ ...editForm, experienceRequired: v })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Employment Type</label>
                      <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none bg-white" style={{ border: '1.5px solid #e2e8f0' }}>
                        {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Status</label>
                      <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none bg-white" style={{ border: '1.5px solid #e2e8f0' }}>
                        <option value="OPEN">OPEN</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Salary" value={editForm.salary} onChange={v => setEditForm({ ...editForm, salary: v })} />
                    <Field label="HR Email" type="email" value={editForm.hrEmail} onChange={v => setEditForm({ ...editForm, hrEmail: v })} placeholder="hr@company.com" />
                  </div>
                </>
              )}
              {editTab === 'details' && (
                <>
                  <TextArea label="Job Summary" value={editForm.jobSummary} onChange={v => setEditForm({ ...editForm, jobSummary: v })} rows={3} />
                  <TextArea label="Responsibilities" value={editForm.responsibilities} onChange={v => setEditForm({ ...editForm, responsibilities: v })} rows={4} />
                  <div className="grid grid-cols-2 gap-4">
                    <TextArea label="Required Skills" value={editForm.requiredSkills} onChange={v => setEditForm({ ...editForm, requiredSkills: v })} rows={3} />
                    <TextArea label="Preferred Skills" value={editForm.preferredSkills} onChange={v => setEditForm({ ...editForm, preferredSkills: v })} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <TextArea label="Qualification" value={editForm.qualification} onChange={v => setEditForm({ ...editForm, qualification: v })} rows={3} />
                    <TextArea label="Salary & Benefits" value={editForm.salaryAndBenefits} onChange={v => setEditForm({ ...editForm, salaryAndBenefits: v })} rows={3} />
                  </div>
                </>
              )}
              {editTab === 'more' && (
                <>
                  <TextArea label="About the Company" value={editForm.aboutCompany} onChange={v => setEditForm({ ...editForm, aboutCompany: v })} rows={4} />
                  <TextArea label="How to Apply" value={editForm.howToApply} onChange={v => setEditForm({ ...editForm, howToApply: v })} rows={4} />
                </>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #f1f5f9' }}>
              <div className="flex gap-1.5">
                {(['basic', 'details', 'more'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setEditTab(t)}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: editTab === t ? 20 : 6, background: editTab === t ? '#6366f1' : '#e2e8f0' }} />
                ))}
              </div>
              <div className="flex gap-2.5">
                <button type="button" onClick={() => setEditMode(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  style={{ border: '1.5px solid #e2e8f0' }}>Cancel</button>
                {editTab !== 'more' ? (
                  <button type="button" onClick={() => setEditTab(editTab === 'basic' ? 'details' : 'more')}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                    style={{ border: '1.5px solid rgba(99,102,241,0.3)' }}>Next →</button>
                ) : (
                  <button type="submit" disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* ── Detail View ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{job.title}</h1>
                  <p className="text-slate-400 text-sm mt-1">Posted {format(new Date(job.createdAt), 'MMM dd, yyyy')}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
                  style={job.status === 'OPEN'
                    ? { background: 'rgba(16,185,129,0.1)', color: '#059669' }
                    : { background: 'rgba(100,116,139,0.1)', color: '#64748b' }}>
                  {job.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                  {job.type.replace('_', ' ')}
                </span>
                {job.location && <span className="flex items-center gap-1 text-xs text-slate-500 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100"><MapPin size={11} /> {job.location}</span>}
                {job.experienceRequired && <span className="text-xs text-slate-500 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">{job.experienceRequired} exp.</span>}
                {job.salary && <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.06)' }}><DollarSign size={11} /> {job.salary}</span>}
              </div>
            </div>

            {(job.jobSummary || job.responsibilities || job.requiredSkills || job.preferredSkills || job.qualification || job.salaryAndBenefits) && (
              <div className="bg-white rounded-2xl p-6 space-y-5" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {job.jobSummary && <Section title="Job Summary" content={job.jobSummary} />}
                {job.responsibilities && <Section title="Responsibilities" content={job.responsibilities} />}
                {job.requiredSkills && <Section title="Required Skills" content={job.requiredSkills} />}
                {job.preferredSkills && <Section title="Preferred Skills" content={job.preferredSkills} />}
                {job.qualification && <Section title="Qualification" content={job.qualification} />}
                {job.salaryAndBenefits && <Section title="Salary & Benefits" content={job.salaryAndBenefits} />}
              </div>
            )}

            {(job.aboutCompany || job.howToApply) && (
              <div className="bg-white rounded-2xl p-6 space-y-5" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {job.aboutCompany && <Section title="About the Company" content={job.aboutCompany} />}
                {job.howToApply && <Section title="How to Apply" content={job.howToApply} />}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick info */}
            <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Job Info</h3>
              <InfoRow label="Status" value={
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={job.status === 'OPEN' ? { background: 'rgba(16,185,129,0.1)', color: '#059669' } : { background: 'rgba(100,116,139,0.1)', color: '#64748b' }}>
                  {job.status}
                </span>
              } />
              <InfoRow label="Type" value={job.type.replace('_', ' ')} />
              {job.location && <InfoRow label="Location" value={job.location} />}
              {job.experienceRequired && <InfoRow label="Experience" value={job.experienceRequired} />}
              {job.salary && <InfoRow label="Salary" value={job.salary} />}
              <InfoRow label="Applicants" value={
                <span className="flex items-center gap-1 font-semibold text-indigo-600">
                  <Users size={13} /> {job._count?.applications ?? 0}
                </span>
              } />
              <InfoRow label="Posted" value={format(new Date(job.createdAt), 'MMM dd, yyyy')} />
            </div>

            {/* HR contact */}
            {job.hrEmail && (
              <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.07),rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.15)' }}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Contact HR</p>
                <a href={`mailto:${job.hrEmail}`} className="flex items-center gap-2 text-indigo-600 font-semibold text-sm hover:text-indigo-700 break-all">
                  <Mail size={16} className="flex-shrink-0" /> {job.hrEmail}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Applicants section — admin only */}
      {admin && !editMode && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Users size={14} style={{ color: '#6366f1' }} />
              </div>
              <h2 className="font-bold text-slate-800 text-sm">Applicants</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                {applications.length}
              </span>
            </div>
          </div>
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Users size={20} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-semibold text-sm">No applicants yet</p>
              <p className="text-slate-400 text-xs mt-1">Applications will appear here</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                  {['Applicant', 'Email', 'Phone', 'Applied', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-800">{app.applicantName}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-600">{app.email}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">{app.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">{format(new Date(app.createdAt), 'MMM dd, yyyy')}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={APP_STATUS_STYLES[app.status] || { background: '#f1f5f9', color: '#64748b' }}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={app.status}
                        onChange={e => updateAppStatus(app.id, e.target.value)}
                        className="text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none bg-white cursor-pointer"
                        style={{ border: '1.5px solid #e2e8f0', color: '#475569' }}>
                        <option value="APPLIED">Applied</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="HIRED">Hired</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

const Section = ({ title, content }: { title: string; content: string }) => (
  <div>
    <h3 className="text-sm font-bold text-slate-700 mb-2">{title}</h3>
    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{content}</p>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-400 text-xs font-medium">{label}</span>
    <span className="text-slate-700 font-semibold text-xs">{value}</span>
  </div>
);

const Field = ({ label, value, onChange, type = 'text', required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string;
}) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none" style={{ border: '1.5px solid #e2e8f0' }}
      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
  </div>
);

const TextArea = ({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none resize-none" style={{ border: '1.5px solid #e2e8f0' }}
      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
  </div>
);
