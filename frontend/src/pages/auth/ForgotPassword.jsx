import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import API from '../../api/axios';
import { Building2, Mail, Lock, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

const STEPS = { EMAIL: 'email', OTP: 'otp', SUCCESS: 'success' };

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 1 — Request OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email address!');
      setStep(STEPS.OTP);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP + set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { email, otp: otp.trim(), newPassword });
      setStep(STEPS.SUCCESS);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP or expired. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-purple-700 rounded-3xl shadow-2xl shadow-primary-900/50 mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Smart Society ERP</h1>
          <p className="text-slate-400 mt-2">Password Recovery</p>
        </div>

        <div className="glass-card p-8">
          {/* ── Step 1: Enter Email ── */}
          {step === STEPS.EMAIL && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Forgot Password?</h2>
                  <p className="text-slate-400 text-sm">Enter your email to receive an OTP</p>
                </div>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
                    : 'Send OTP to Email'
                  }
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Enter OTP + New Password ── */}
          {step === STEPS.OTP && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Enter OTP</h2>
                  <p className="text-slate-400 text-sm">Check your email: <span className="text-primary-400">{email}</span></p>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">6-Digit OTP</label>
                  <input
                    id="forgot-otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="input-field text-center text-2xl font-mono tracking-[0.5em]"
                    placeholder="······"
                  />
                  <p className="text-slate-500 text-xs mt-1.5">OTP expires in 15 minutes</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="new-password"
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field pl-10"
                      placeholder="New password (min. 6 chars)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>

                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-400 text-sm">Passwords do not match</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(STEPS.EMAIL)}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
                      : 'Reset Password'
                    }
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="w-full text-xs text-primary-400 hover:text-primary-300 text-center transition-colors py-1"
                >
                  Didn't receive OTP? Resend
                </button>
              </form>
            </>
          )}

          {/* ── Step 3: Success ── */}
          {step === STEPS.SUCCESS && (
            <div className="text-center space-y-5 py-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500/15 mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
                <p className="text-slate-400 text-sm">
                  Your password has been successfully reset. All existing sessions have been logged out for security.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          )}

          {/* Back to Login link */}
          {step !== STEPS.SUCCESS && (
            <div className="mt-6 pt-5 border-t border-dark-700/50 text-center">
              <Link to="/login" className="text-sm text-slate-400 hover:text-slate-300 transition-colors flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
