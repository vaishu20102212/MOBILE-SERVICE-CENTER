import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Wrench,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { useAuth, DEFAULT_USERS } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function LoginPage() {
  const { login, loginAsUser, isAuthenticated, role } = useAuth();
  const { notifySuccess, notifyError } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@fixmaster.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || (role === 'customer' ? '/portal' : '/');
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, role, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password, rememberMe);
      if (res.success) {
        notifySuccess(`Welcome back, ${res.user.name}!`);
        const destination = location.state?.from?.pathname || (res.user.role === 'customer' ? '/portal' : '/');
        navigate(destination, { replace: true });
      } else {
        setErrorMsg(res.message || 'Invalid email or password');
        notifyError(res.message || 'Login failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user) => {
    setEmail(user.email);
    setPassword('password123');
    setErrorMsg('');
    const res = loginAsUser(user, rememberMe);
    if (res.success) {
      notifySuccess(`Signed in as ${user.name} (${user.role.toUpperCase()})`);
      const destination = location.state?.from?.pathname || (user.role === 'customer' ? '/portal' : '/');
      navigate(destination, { replace: true });
    }
  };

  const roleStyles = {
    admin: {
      border: 'hover:border-purple-500 hover:ring-2 hover:ring-purple-500/20',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    },
    receptionist: {
      border: 'hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    technician: {
      border: 'hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    customer: {
      border: 'hover:border-amber-500 hover:ring-2 hover:ring-amber-500/20',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient decorative shapes */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Brand Logo & Title */}
        <div className="inline-flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <Wrench className="w-6 h-6 transform -rotate-45" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              Fix<span className="text-blue-400">Master</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                PRO v2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Service Center Management Suite</p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-white mt-2">Sign in to your account</h2>
        <p className="text-xs text-slate-400 mt-1">
          Access job cards, diagnosis, spare parts inventory, and billing
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 space-y-6">
        {/* Main Login Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fixmaster.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Default: <code className="text-blue-400">password123</code>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me on this browser</span>
              </label>

              <span className="text-xs text-blue-400 hover:underline cursor-pointer">
                Evaluation Mode
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo 1-Click Persona Logins */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>1-Click Demo Login Personas</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Click any persona:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEFAULT_USERS.map((user) => {
                const s = roleStyles[user.role] || roleStyles.admin;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickLogin(user)}
                    className={`flex items-start gap-3 p-3 rounded-2xl bg-slate-900/50 border border-slate-700/80 text-left transition ${s.border}`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">{user.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${s.badge}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.title}</p>
                      <p className="text-[9px] text-slate-400 mt-1 leading-snug line-clamp-1">{user.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Public Live Tracking Portal Guest Access */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-center flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <p className="text-xs font-bold text-slate-300">Are you a customer tracking your phone?</p>
            <p className="text-[11px] text-slate-400">Look up live repair status using Job Card # or IMEI without logging in.</p>
          </div>
          <Link
            to="/portal"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-xs font-semibold text-blue-300 transition shrink-0"
          >
            <span>Open Public Tracker</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
