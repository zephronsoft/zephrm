import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

type EmployeeRole = 'EMPLOYEE' | 'HR_MANAGER' | 'ADMIN';

type EmployeeItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  user?: {
    id: string;
    role: EmployeeRole;
    email: string;
  };
  department?: { id: string; name: string } | null;
};

const ROLE_OPTIONS: EmployeeRole[] = ['EMPLOYEE', 'HR_MANAGER', 'ADMIN'];

export const SettingsPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [smtpStatus, setSmtpStatus] = useState<{ enabled: boolean; host: string; port: number; secure: boolean; from: string } | null>(null);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [sendingMail, setSendingMail] = useState(false);
  const [mailForm, setMailForm] = useState({
    to: '',
    subject: '',
    message: '',
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/employees?limit=200&page=1');
      setEmployees(data?.employees || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadSmtpStatus();
  }, []);

  const loadSmtpStatus = async () => {
    try {
      setSmtpLoading(true);
      const { data } = await api.get('/mailer/status');
      setSmtpStatus(data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load SMTP status');
    } finally {
      setSmtpLoading(false);
    }
  };

  const updateRole = async (employeeId: string, role: EmployeeRole) => {
    try {
      setSavingRoleId(employeeId);
      await api.patch(`/employees/${employeeId}/role`, { role });
      setEmployees((prev) => prev.map((employee) => (
        employee.id === employeeId && employee.user
          ? { ...employee, user: { ...employee.user, role } }
          : employee
      )));
      toast.success('Role updated successfully');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update role');
      await loadEmployees();
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleSendMail = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!mailForm.to.trim() || !mailForm.subject.trim() || !mailForm.message.trim()) {
      toast.error('Recipient, subject, and message are required');
      return;
    }

    try {
      setSendingMail(true);
      await api.post('/mailer/send', {
        to: mailForm.to,
        subject: mailForm.subject,
        message: mailForm.message,
      });
      toast.success('Email sent successfully');
      setMailForm({ to: '', subject: '', message: '' });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingMail(false);
    }
  };

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Role Management: Admin and HR have full feature access. Employees keep limited access.
        </p>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h2 className="text-base font-semibold text-slate-800">Employee Roles</h2>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-slate-500">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">No employees found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td className="px-5 py-3 text-sm font-medium text-slate-800">
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{employee.email}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{employee.department?.name || '-'}</td>
                    <td className="px-5 py-3">
                      {employee.user ? (
                        <select
                          value={employee.user.role}
                          disabled={savingRoleId === employee.id}
                          onChange={(event) => updateRole(employee.id, event.target.value as EmployeeRole)}
                          className="h-9 px-3 rounded-lg border border-slate-300 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:opacity-60"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400">No linked user</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h2 className="text-base font-semibold text-slate-800">SMTP Mail Sender</h2>
          <button
            type="button"
            onClick={loadSmtpStatus}
            disabled={smtpLoading}
            className="h-8 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 disabled:opacity-60"
          >
            {smtpLoading ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        <div className="p-5 space-y-4">
          {smtpStatus ? (
            <div className="rounded-xl p-3" style={{ border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p className="text-slate-700"><span className="font-semibold">Enabled:</span> {smtpStatus.enabled ? 'Yes' : 'No'}</p>
                <p className="text-slate-700"><span className="font-semibold">Host:</span> {smtpStatus.host}</p>
                <p className="text-slate-700"><span className="font-semibold">Port:</span> {smtpStatus.port}</p>
                <p className="text-slate-700"><span className="font-semibold">Secure:</span> {smtpStatus.secure ? 'Yes' : 'No'}</p>
                <p className="text-slate-700 md:col-span-2"><span className="font-semibold">From:</span> {smtpStatus.from}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">SMTP status not loaded yet.</div>
          )}

          <form onSubmit={handleSendMail} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">To</label>
              <input
                type="text"
                value={mailForm.to}
                onChange={(event) => setMailForm((prev) => ({ ...prev, to: event.target.value }))}
                placeholder="recipient@example.com or comma-separated list"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Subject</label>
              <input
                type="text"
                value={mailForm.subject}
                onChange={(event) => setMailForm((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Email subject"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Message</label>
              <textarea
                value={mailForm.message}
                onChange={(event) => setMailForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Write your message"
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-blue-500 resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={sendingMail}
              className="h-10 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              {sendingMail ? 'Sending...' : 'Send Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
