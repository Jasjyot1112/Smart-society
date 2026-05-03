import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { createVisitorRequest } from '../../api/visitorApi';
import toast from 'react-hot-toast';
import { UserPlus, Shield, CheckCircle2 } from 'lucide-react';

const purposes = ['guest', 'delivery', 'service', 'cab', 'maintenance', 'other'];

const SecurityDashboard = () => {
  const [form, setForm] = useState({ name: '', phone: '', flatNumber: '', wing: '', purpose: 'guest', vehicleNumber: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [lastRequest, setLastRequest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    let timer;
    if (lastRequest && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [lastRequest, timeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.flatNumber) return toast.error('Name and flat number are required');
    setSubmitting(true);
    try {
      const res = await createVisitorRequest(form);
      toast.success('✅ Visitor request sent to resident!');
      setLastRequest({
        ...form,
        residentName: res.data.data.residentName,
        otpDeliveryMethod: res.data.data.otpDeliveryMethod,
        sentAt: new Date(),
      });
      setTimeLeft(300); // Reset timer
      setForm({ name: '', phone: '', flatNumber: '', wing: '', purpose: 'guest', vehicleNumber: '', notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Gate Entry">
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="section-title">Visitor Entry</h1>
          <p className="section-subtitle">Register a visitor and notify the resident</p>
        </div>

        {/* Last Request Success */}
        {lastRequest && (
          <div className="glass-card p-5 border border-emerald-600/40 bg-emerald-900/10">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-emerald-400">Request Sent Successfully!</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 mb-3">
              <div><span className="text-slate-500">Visitor:</span> {lastRequest.name}</div>
              <div><span className="text-slate-500">Flat:</span> {lastRequest.wing ? `${lastRequest.wing}-${lastRequest.flatNumber}` : lastRequest.flatNumber}</div>
              <div><span className="text-slate-500">Resident:</span> {lastRequest.residentName}</div>
              <div><span className="text-slate-500">Sent Via:</span> <span className="uppercase text-primary-400 font-medium">{lastRequest.otpDeliveryMethod || 'APP'}</span></div>
            </div>

            <div className="mt-3 p-4 rounded-xl bg-amber-900/10 border border-amber-600/40 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 bg-amber-500/50 transition-all duration-1000 linear" style={{ width: `${(timeLeft / 300) * 100}%` }} />
              <p className="text-sm text-amber-400 font-medium flex items-center justify-center gap-2">
                ⏳ Waiting for Resident Approval
                {timeLeft > 0 ? (
                  <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded-md font-mono">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                ) : (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md">Expired</span>
                )}
              </p>
              <p className="text-xs text-slate-400 mt-1">Please ask the visitor to wait until the resident provides the 6-digit OTP code.</p>
            </div>
          </div>
        )}

        {/* Entry Form */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center"><Shield className="w-5 h-5" /></div>
            <h2 className="font-semibold text-white">Visitor Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-slate-400 mb-1 block">Visitor Name *</label>
                <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field" placeholder="Full name" />
              </div>
              <div><label className="text-xs text-slate-400 mb-1 block">Phone Number</label>
                <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="input-field" placeholder="10-digit number" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-slate-400 mb-1 block">Wing</label>
                <input value={form.wing} onChange={e=>setForm({...form,wing:e.target.value})} className="input-field" placeholder="A, B, C..." />
              </div>
              <div><label className="text-xs text-slate-400 mb-1 block">Flat Number *</label>
                <input required value={form.flatNumber} onChange={e=>setForm({...form,flatNumber:e.target.value})} className="input-field" placeholder="101, 202..." />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-slate-400 mb-1 block">Purpose</label>
                <select value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} className="input-field capitalize">
                  {purposes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-slate-400 mb-1 block">Vehicle Number</label>
                <input value={form.vehicleNumber} onChange={e=>setForm({...form,vehicleNumber:e.target.value})} className="input-field" placeholder="MH01AB1234" />
              </div>
            </div>

            <div><label className="text-xs text-slate-400 mb-1 block">Notes</label>
              <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="input-field" placeholder="Any additional notes" />
            </div>

            <button type="submit" disabled={submitting} id="send-visitor-request-btn" className="btn-primary w-full flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              {submitting ? 'Sending...' : 'Send Entry Request to Resident'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default SecurityDashboard;
