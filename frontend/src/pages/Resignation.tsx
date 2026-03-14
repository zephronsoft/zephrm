import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

type ResignationItem = {
  id: string;
  reason: string;
  noticePeriodDays: number;
  lastWorkingDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    manager?: { id: string; firstName: string; lastName: string; email: string } | null;
  };
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

const REVIEWER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER'];
const HR_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isReviewer = (role?: string) => !!role && REVIEWER_ROLES.includes(role);
const isHrAdmin = (role?: string) => !!role && HR_ADMIN_ROLES.includes(role);

const DEFAULT_NOTICE_DAYS = 60;
const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

export const Resignation: React.FC = () => {
  const { user } = useAuth();
  const canReview = isReviewer(user?.role);
  const canAdminUpdate = isHrAdmin(user?.role);

  const defaultLastWorkingDate = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + DEFAULT_NOTICE_DAYS);
    return toDateInputValue(next);
  }, []);

  const todayValue = useMemo(() => toDateInputValue(new Date()), []);

  const [items, setItems] = useState<ResignationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ reason: '', lastWorkingDate: defaultLastWorkingDate });
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [adminEdits, setAdminEdits] = useState<Record<string, { reason: string; noticePeriodDays: string; lastWorkingDate: string }>>({});

  const loadData = async () => {
    try {
      const { data } = await api.get('/resignations');
      setItems(data || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load resignations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const mapped = items.reduce((acc, item) => {
      acc[item.id] = {
        reason: item.reason || '',
        noticePeriodDays: String(item.noticePeriodDays ?? DEFAULT_NOTICE_DAYS),
        lastWorkingDate: item.lastWorkingDate ? toDateInputValue(new Date(item.lastWorkingDate)) : '',
      };
      return acc;
    }, {} as Record<string, { reason: string; noticePeriodDays: string; lastWorkingDate: string }>);
    setAdminEdits(mapped);
  }, [items]);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === 'PENDING').length,
    [items],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.reason.trim() || !form.lastWorkingDate) {
      toast.error('Reason and last working date are required');
      return;
    }

    if (form.lastWorkingDate < todayValue) {
      toast.error('Last working date cannot be before current date');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/resignations', {
        reason: form.reason.trim(),
        lastWorkingDate: form.lastWorkingDate,
      });
      toast.success('Resignation submitted successfully');
      setForm({ reason: '', lastWorkingDate: defaultLastWorkingDate });
      await loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to submit resignation');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewResignation = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/resignations/${id}/review`, {
        status,
        reviewNote: reviewNotes[id]?.trim() || undefined,
      });
      toast.success(`Resignation ${status.toLowerCase()}`);
      await loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to review resignation');
    }
  };

  const updateResignationByAdmin = async (id: string) => {
    const edit = adminEdits[id];
    if (!edit) return;

    if (!edit.reason.trim()) {
      toast.error('Reason cannot be empty');
      return;
    }

    const notice = Number(edit.noticePeriodDays);
    if (!Number.isFinite(notice) || notice < 1 || notice > 365) {
      toast.error('Notice period must be between 1 and 365 days');
      return;
    }

    if (!edit.lastWorkingDate) {
      toast.error('Last working date is required');
      return;
    }

    try {
      await api.patch(`/resignations/${id}/admin-update`, {
        reason: edit.reason,
        noticePeriodDays: notice,
        lastWorkingDate: edit.lastWorkingDate,
      });
      toast.success('Resignation details updated');
      await loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update resignation details');
    }
  };

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Resignation</h1>
        <p className="text-slate-500 text-sm mt-1">
          Employees can submit resignation requests. HR/Admin and assigned managers can review.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Submit Resignation</h2>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Working Date</label>
            <input
              type="date"
              value={form.lastWorkingDate}
              onChange={(event) => setForm((prev) => ({ ...prev, lastWorkingDate: event.target.value }))}
              min={todayValue}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 outline-none focus:border-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">Default notice period is 2 months (60 days). HR/Admin can update it later.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <textarea
              value={form.reason}
              onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
              className="w-full min-h-[110px] p-3 rounded-lg border border-slate-300 outline-none focus:border-blue-500 resize-y"
              placeholder="Enter resignation reason"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
            style={{ background: '#3568b9' }}
          >
            {submitting ? 'Submitting...' : 'Submit Resignation'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">Resignation Requests</h2>
          <span className="text-xs font-medium px-2.5 py-1 rounded" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            Pending: {pendingCount}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No resignation records found.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl p-4" style={{ border: '1px solid #e2e8f0' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'My Request'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Submitted {new Date(item.submittedAt).toLocaleString()} · Last day {new Date(item.lastWorkingDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={item.status === 'APPROVED'
                      ? { background: '#dcfce7', color: '#15803d' }
                      : item.status === 'REJECTED'
                        ? { background: '#fee2e2', color: '#b91c1c' }
                        : { background: '#fef9c3', color: '#a16207' }}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">{item.reason}</p>
                <p className="text-xs text-slate-600 mt-2">Notice period: {item.noticePeriodDays} day(s)</p>

                {item.reviewNote && (
                  <p className="text-xs text-slate-600 mt-2">
                    Review note: {item.reviewNote}
                  </p>
                )}

                {item.reviewedBy && (
                  <p className="text-xs text-slate-500 mt-1">
                    Reviewed by {item.reviewedBy.firstName} {item.reviewedBy.lastName}
                    {item.reviewedAt ? ` on ${new Date(item.reviewedAt).toLocaleString()}` : ''}
                  </p>
                )}

                {canReview && item.status === 'PENDING' && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      placeholder="Optional review note"
                      value={reviewNotes[item.id] || ''}
                      onChange={(event) => setReviewNotes((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      className="w-full min-h-[70px] p-2 rounded-lg border border-slate-300 outline-none focus:border-blue-500 resize-y text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => reviewResignation(item.id, 'APPROVED')}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-white"
                        style={{ background: '#16a34a' }}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewResignation(item.id, 'REJECTED')}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-white"
                        style={{ background: '#dc2626' }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {canAdminUpdate && (
                  <div className="mt-4 p-3 rounded-lg" style={{ border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <p className="text-sm font-semibold text-slate-700 mb-2">HR/Admin Update</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Notice Period (days)</label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={adminEdits[item.id]?.noticePeriodDays || ''}
                          onChange={(event) => setAdminEdits((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...(prev[item.id] || { reason: item.reason, noticePeriodDays: String(item.noticePeriodDays), lastWorkingDate: toDateInputValue(new Date(item.lastWorkingDate)) }),
                              noticePeriodDays: event.target.value,
                            },
                          }))}
                          className="w-full h-9 px-2 rounded border border-slate-300 outline-none focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Last Working Date</label>
                        <input
                          type="date"
                          value={adminEdits[item.id]?.lastWorkingDate || ''}
                          onChange={(event) => setAdminEdits((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...(prev[item.id] || { reason: item.reason, noticePeriodDays: String(item.noticePeriodDays), lastWorkingDate: toDateInputValue(new Date(item.lastWorkingDate)) }),
                              lastWorkingDate: event.target.value,
                            },
                          }))}
                          className="w-full h-9 px-2 rounded border border-slate-300 outline-none focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs text-slate-600 mb-1">Reason</label>
                      <textarea
                        value={adminEdits[item.id]?.reason || ''}
                        onChange={(event) => setAdminEdits((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...(prev[item.id] || { reason: item.reason, noticePeriodDays: String(item.noticePeriodDays), lastWorkingDate: toDateInputValue(new Date(item.lastWorkingDate)) }),
                            reason: event.target.value,
                          },
                        }))}
                        className="w-full min-h-[70px] p-2 rounded border border-slate-300 outline-none focus:border-blue-500 resize-y text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => updateResignationByAdmin(item.id)}
                      className="mt-2 px-3 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ background: '#3568b9' }}
                    >
                      Update Resignation
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
