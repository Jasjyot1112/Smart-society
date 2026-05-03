import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../api/authApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Building2, Eye, EyeOff, LogIn, Lock, Mail, Shield, Home, User } from 'lucide-react';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      const { token, refreshToken, data } = res.data;
      loginUser(data, token, refreshToken);
      toast.success(`${t('auth.welcomeBack')}, ${data.name}! 🎉`);
      const redirectMap = {
        admin: '/admin/dashboard',
        resident: '/resident/dashboard',
        security: '/security/dashboard',
      };
      navigate(redirectMap[data.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Admin', email: 'admin@smartsociety.com', password: 'Admin@123', icon: Shield, color: 'text-purple-400' },
    { role: 'Resident', email: 'raj@example.com', password: 'Test@123', icon: Home, color: 'text-blue-400' },
    { role: 'Security', email: 'guard@smartsociety.com', password: 'Guard@123', icon: User, color: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-purple-700 rounded-3xl shadow-2xl shadow-primary-900/50 mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Smart Society ERP</h1>
          <p className="text-slate-400 mt-2">{t('auth.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-white mb-6">{t('auth.signIn')}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">{t('auth.password')}</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-10 pr-10"
                  placeholder={t('auth.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={form.rememberMe}
                onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                className="w-4 h-4 rounded border-dark-600 bg-dark-900 text-primary-600 cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-sm text-slate-400 cursor-pointer select-none">
                {t('auth.rememberMe')}
              </label>
            </div>

            <button id="login-btn" type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
              ) : (
                <><LogIn className="w-4 h-4" /> {t('auth.signInBtn')}</>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-dark-700/50">
            <p className="text-xs text-slate-500 text-center mb-3">Quick Demo Access</p>
            <div className="space-y-2">
              {demoCredentials.map(({ role, email, password, icon: Icon, color }) => (
                <button
                  key={role}
                  id={`demo-${role.toLowerCase()}`}
                  onClick={() => setForm({ email, password, rememberMe: false })}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-900/60 hover:bg-dark-700/60 border border-dark-700/50 hover:border-primary-600/30 transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{role}</p>
                    <p className="text-xs text-slate-500">{email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} Smart Society ERP. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
