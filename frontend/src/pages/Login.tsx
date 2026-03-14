import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Users, Shield, BarChart3 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('hr@zephrons.com');
  const [password, setPassword] = useState('CB230025@vb');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
  const isRestrictedNewJoiner = (user?: any) =>
    user?.role === 'EMPLOYEE' && !!user?.employee && user?.employee?.status !== 'ACTIVE';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Welcome back!');
      if (isRestrictedNewJoiner(user)) {
        navigate('/onboarding');
      } else {
        navigate(user?.role && ADMIN_ROLES.includes(user.role) ? '/' : '/announcements');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, text: 'Manage your entire workforce in one place' },
    { icon: BarChart3, text: 'Real-time analytics and reporting' },
    { icon: Shield, text: 'Role-based access control & security' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f9' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e1b4b 60%,#312e81 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#6366f1,transparent)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#8b5cf6,transparent)' }} />

        {/* Brand */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <span className="text-white font-black text-lg">H</span>
            </div>
            <p className="text-white font-extrabold text-xl tracking-tight">
              HRM<span style={{ color: '#a5b4fc' }}>Pro</span>
            </p>
          </div>
          <p className="text-slate-400 text-sm">Human Resource Management System</p>
        </div>

        {/* Headline */}
        <div className="relative space-y-6">
          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
            Streamline your<br />
            <span style={{ background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HR operations
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-xs">
            An all-in-one platform to manage employees, payroll, attendance, and performance.
          </p>
          <div className="space-y-3 pt-2">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <Icon size={14} style={{ color: '#a5b4fc' }} />
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-600">© 2026 HRM Pro · All rights reserved</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <span className="text-white font-black">H</span>
            </div>
            <span className="font-extrabold text-xl text-slate-800">HRM<span className="text-indigo-500">Pro</span></span>
          </div>

          <div className="bg-white rounded-2xl p-8"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" required
                  className="w-full px-4 py-3 rounded-xl text-sm text-slate-800 outline-none transition-all"
                  style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-slate-800 outline-none transition-all"
                    style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)'; }}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-5 p-3.5 rounded-xl" style={{ background: '#f8fafc', border: '1px dashed #e2e8f0' }}>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Demo credentials</p>
              <div className="flex gap-4 text-xs text-slate-600">
                <span><span className="font-semibold">Email:</span> hr@zephrons.com</span>
                <span><span className="font-semibold">Pass:</span> CB230025@vb</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
