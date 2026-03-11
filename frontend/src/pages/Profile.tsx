import React, { useEffect, useState } from 'react';
import { Mail, Phone, Building2, Briefcase, Calendar, MapPin, DollarSign, IdCard, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    api.get('/employees/me')
      .then((r) => { setProfile(r.data); setProfileError(false); })
      .catch(() => { setProfile(null); setProfileError(true); })
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChanging(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      toast.success('Password updated successfully');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center h-48">
      <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="space-y-5 fade-in max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Profile</h1>
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {user && (
          <div className="flex items-center gap-4 p-4 rounded-2xl mb-6"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {(user.email?.[0] ?? 'U').toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">{user.email}</h2>
              <p className="text-sm text-slate-500 capitalize">{user.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}
        <p className="text-slate-500 font-semibold">{profileError ? 'No employee profile linked to your account' : 'Loading…'}</p>
        <p className="text-slate-400 text-sm mt-1">Contact HR to set up your employee profile. You can still change your password below.</p>
      </div>
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Lock size={18} style={{ color: '#6366f1' }} /> Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
            <div className="relative">
              <input type={showPass.current ? 'text' : 'password'} value={passForm.currentPassword} onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="Enter current password" required className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500 pr-10" />
              <button type="button" onClick={() => setShowPass(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
            <div className="relative">
              <input type={showPass.new ? 'text' : 'password'} value={passForm.newPassword} onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Enter new password" required minLength={6} className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500 pr-10" />
              <button type="button" onClick={() => setShowPass(s => ({ ...s, new: !s.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
            <div className="relative">
              <input type={showPass.confirm ? 'text' : 'password'} value={passForm.confirmPassword} onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Confirm new password" required minLength={6} className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500 pr-10" />
              <button type="button" onClick={() => setShowPass(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <button type="submit" disabled={changing} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{changing ? 'Updating…' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );

  const fields = [
    { icon: IdCard, label: 'Employee ID', value: profile.employeeId || '—' },
    { icon: Mail, label: 'Email / Username', value: profile.user?.email || profile.email || '—' },
    { icon: Phone, label: 'Phone', value: profile.phone || '—' },
    { icon: Building2, label: 'Department', value: profile.department?.name || '—' },
    { icon: Briefcase, label: 'Position', value: profile.position?.title || '—' },
    { icon: Briefcase, label: 'Employment Type', value: profile.employmentType || '—' },
    { icon: Calendar, label: 'Joining Date', value: profile.joiningDate ? format(new Date(profile.joiningDate), 'MMM dd, yyyy') : '—' },
    { icon: DollarSign, label: 'Salary', value: profile.salary != null ? `$${Number(profile.salary).toLocaleString()}` : '—' },
    { icon: MapPin, label: 'Address', value: [profile.address, profile.city, profile.country].filter(Boolean).join(', ') || '—' },
    { icon: IdCard, label: 'Gender', value: profile.gender || '—' },
    { icon: IdCard, label: 'Status', value: profile.status || '—' },
  ];

  return (
    <div className="space-y-5 fade-in max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Profile</h1>
      <p className="text-slate-500 text-sm">Your personal and employment details</p>
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-4 p-4 rounded-2xl mb-6"
          style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {profile.firstName?.[0]}{profile.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">{profile.firstName} {profile.lastName}</h2>
            <p className="text-sm font-medium text-indigo-600">{profile.position?.title || 'No Position'}</p>
            <p className="text-xs text-slate-500 mt-0.5">{profile.employeeId} · {profile.department?.name || 'No Dept'}</p>
          </div>
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Profile Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Icon size={16} style={{ color: '#6366f1' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-[13px] font-semibold text-slate-700 mt-0.5 break-words">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Lock size={18} style={{ color: '#6366f1' }} /> Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
            <div className="relative">
              <input type={showPass.current ? 'text' : 'password'} value={passForm.currentPassword}
                onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="Enter current password" required
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500 pr-10" />
              <button type="button" onClick={() => setShowPass(s => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
            <div className="relative">
              <input type={showPass.new ? 'text' : 'password'} value={passForm.newPassword}
                onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Enter new password" required minLength={6}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500 pr-10" />
              <button type="button" onClick={() => setShowPass(s => ({ ...s, new: !s.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
            <div className="relative">
              <input type={showPass.confirm ? 'text' : 'password'} value={passForm.confirmPassword}
                onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Confirm new password" required minLength={6}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500 pr-10" />
              <button type="button" onClick={() => setShowPass(s => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={changing}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {changing ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
