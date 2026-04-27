import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getAllPayments, getDefaulters, sendReminders } from '../../api/paymentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { CreditCard, AlertCircle, Send, RefreshCw } from 'lucide-react';

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('payments');
  const [sending, setSending] = useState(false);
  const [month] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        getAllPayments({ month, year, limit: 50 }),
        getDefaulters({ month, year }),
      ]);
      setPayments(pRes.data.data);
      setTotalCollected(pRes.data.totalCollected);
      setDefaulters(dRes.data.data);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSendReminders = async () => {
    setSending(true);
    try {
      const res = await sendReminders({ month, year, amount: 2500 });
      toast.success(res.data.message);
    } catch { toast.error('Failed to send reminders'); }
    finally { setSending(false); }
  };

  return (
    <Layout title="Payment Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="section-title">Payment Management</h1>
            <p className="section-subtitle">{months[month-1]} {year} — Maintenance Collection</p>
          </div>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm py-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="kpi-card">
            <div className="kpi-icon bg-emerald-500/20 text-emerald-400"><CreditCard className="w-6 h-6" /></div>
            <div><p className="text-2xl font-bold text-white">₹{totalCollected.toLocaleString()}</p><p className="text-slate-400 text-sm">Collected This Month</p></div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon bg-blue-500/20 text-blue-400"><CreditCard className="w-6 h-6" /></div>
            <div><p className="text-2xl font-bold text-white">{payments.filter(p=>p.status==='paid').length}</p><p className="text-slate-400 text-sm">Payments Received</p></div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon bg-red-500/20 text-red-400"><AlertCircle className="w-6 h-6" /></div>
            <div><p className="text-2xl font-bold text-white">{defaulters.length}</p><p className="text-slate-400 text-sm">Defaulters</p></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {['payments', 'defaulters'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 rounded-xl font-medium text-sm capitalize transition-all ${tab===t?'bg-primary-600 text-white':'bg-dark-700 text-slate-400 hover:text-white'}`}>{t}</button>
          ))}
        </div>

        {tab === 'payments' && (
          <div className="glass-card overflow-hidden">
            {loading ? <LoadingSpinner /> : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>Resident</th><th>Flat</th><th>Amount</th><th>Status</th><th>Paid At</th><th>Receipt</th></tr></thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td><p className="font-medium text-white">{p.user?.name}</p><p className="text-xs text-slate-500">{p.user?.email}</p></td>
                        <td>{p.user?.wing ? `${p.user.wing}-${p.user.flatNumber}` : p.user?.flatNumber}</td>
                        <td className="font-semibold text-white">₹{p.amount?.toLocaleString()}</td>
                        <td><span className={`badge status-${p.status}`}>{p.status}</span></td>
                        <td className="text-xs">{p.paidAt ? new Date(p.paidAt).toLocaleString() : '—'}</td>
                        <td className="text-xs font-mono text-slate-500">{p.razorpayPaymentId ? p.razorpayPaymentId.slice(-8) : '—'}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && <tr><td colSpan="6" className="text-center py-12 text-slate-500">No payments this month</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'defaulters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm">{defaulters.length} residents have not paid for {months[month-1]}</p>
              <button onClick={handleSendReminders} disabled={sending || defaulters.length === 0} className="btn-primary flex items-center gap-2 text-sm py-2">
                <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Reminders'}
              </button>
            </div>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>Resident</th><th>Flat</th><th>Phone</th><th>Email</th></tr></thead>
                  <tbody>
                    {defaulters.map((u) => (
                      <tr key={u._id}>
                        <td><p className="font-medium text-white">{u.name}</p></td>
                        <td>{u.wing ? `${u.wing}-${u.flatNumber}` : u.flatNumber}</td>
                        <td>{u.phone || '—'}</td>
                        <td className="text-xs">{u.email}</td>
                      </tr>
                    ))}
                    {defaulters.length === 0 && <tr><td colSpan="4" className="text-center py-12 text-slate-500">🎉 All residents have paid!</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminPayments;
