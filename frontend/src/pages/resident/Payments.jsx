import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getMyPayments, createOrder, verifyPayment, downloadInvoice } from '../../api/paymentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, CheckCircle2, Clock, AlertCircle, FileDown } from 'lucide-react';

const MAINTENANCE_AMOUNT = 2500;
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const ResidentPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await getMyPayments();
      setPayments(res.data.data);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const currentPayment = payments.find(p => p.month === currentMonth && p.year === currentYear);
  const isPaid = currentPayment?.status === 'paid';

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  const handleDownloadInvoice = async (paymentId) => {
    setDownloadingId(paymentId);
    try {
      const res = await downloadInvoice(paymentId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      // Create order (backend handles demo mode automatically)
      const orderRes = await createOrder({ month: currentMonth, year: currentYear, amount: MAINTENANCE_AMOUNT });
      const { orderId, amount, currency, keyId, demoMode, userInfo } = orderRes.data.data;

      // DEMO MODE — no real Razorpay keys configured
      if (demoMode) {
        toast.loading('Simulating payment (Demo Mode)...', { id: 'demo-pay' });
        await new Promise(r => setTimeout(r, 1500)); // simulate processing delay
        toast.dismiss('demo-pay');

        // Directly verify with demo payment ID
        await verifyPayment({
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_DEMO_${Date.now()}`,
          razorpay_signature: 'demo_sig',
          month: currentMonth,
          year: currentYear,
        });
        toast.success('🎉 Payment successful! (Demo Mode)');
        fetchPayments();
        setPaying(false);
        return;
      }

      // REAL RAZORPAY MODE
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet.');
        setPaying(false);
        return;
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Smart Society ERP',
        description: `Maintenance - ${months[currentMonth - 1]} ${currentYear}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await verifyPayment({ ...response, month: currentMonth, year: currentYear });
            toast.success('🎉 Payment successful!');
            fetchPayments();
          } catch {
            toast.error('Payment verification failed. Contact admin.');
          } finally {
            setPaying(false);
          }
        },
        prefill: { name: userInfo.name, email: userInfo.email, contact: userInfo.phone || '' },
        theme: { color: '#6366f1' },
        modal: { ondismiss: () => setPaying(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setPaying(false);
      });
      rzp.open();

    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to initiate payment. Please try again.';
      toast.error(msg);
      setPaying(false);
    }
  };

  return (
    <Layout title="My Payments">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Maintenance Payments</h1>
          <p className="section-subtitle">Pay and track your monthly maintenance</p>
        </div>

        {/* Current Month Payment Card */}
        <div className={`glass-card p-6 border-2 ${isPaid ? 'border-emerald-600/40' : 'border-amber-600/40'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {isPaid ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{months[currentMonth - 1]} {currentYear}</h3>
                <p className="text-slate-400">Flat {user?.wing ? `${user.wing}-${user.flatNumber}` : user?.flatNumber}</p>
                {isPaid && <p className="text-emerald-400 text-sm mt-1">Paid on {new Date(currentPayment.paidAt).toLocaleDateString()}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">₹{MAINTENANCE_AMOUNT.toLocaleString()}</p>
              {isPaid ? (
                <div className="flex flex-col items-end gap-2 mt-2">
                  <span className="badge badge-green text-sm">✓ Paid</span>
                  <button 
                    onClick={() => handleDownloadInvoice(currentPayment._id)}
                    disabled={downloadingId === currentPayment._id}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors bg-primary-500/10 hover:bg-primary-500/20 px-3 py-1.5 rounded-lg"
                  >
                    {downloadingId === currentPayment._id ? <div className="w-3 h-3 spinner border-white/50 border-t-white rounded-full"></div> : <FileDown className="w-3.5 h-3.5" />}
                    Invoice
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={paying}
                  id="pay-now-btn"
                  className="btn-primary mt-3 flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {paying ? 'Processing...' : 'Pay Now'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Demo Mode Banner */}
        <div className="glass-card p-4 border border-amber-600/30 bg-amber-900/10">
          <p className="text-amber-400 text-sm font-medium">⚠️ Demo Mode Active</p>
          <p className="text-slate-400 text-xs mt-1">
            No real Razorpay keys are configured. Payments will be simulated. Add your keys to <code className="text-primary-400">backend/.env</code> to enable real payments.
          </p>
        </div>

        {/* Payment History */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-dark-700/50">
            <h3 className="font-semibold text-white">Payment History</h3>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="divide-y divide-dark-700/50">
              {payments.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-4 hover:bg-dark-700/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {p.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{months[p.month - 1]} {p.year}</p>
                      <p className="text-xs text-slate-500">{p.razorpayPaymentId ? `ID: ${p.razorpayPaymentId}` : 'Pending payment'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">₹{((p.amount || 0) + (p.lateFee || 0)).toLocaleString()}</p>
                    {p.lateFee > 0 && <p className="text-[#ef4444] text-xs">+ ₹{p.lateFee} late fee</p>}
                    {p.status === 'paid' ? (
                      <div className="flex flex-col items-end gap-1 mt-1">
                        <span className="badge badge-green text-xs">Paid</span>
                        <button 
                          onClick={() => handleDownloadInvoice(p._id)}
                          disabled={downloadingId === p._id}
                          className="text-[10px] text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors bg-primary-500/10 px-2 py-1 rounded"
                        >
                           {downloadingId === p._id ? <div className="w-3 h-3 spinner border-primary-400/50 border-t-primary-400 rounded-full"></div> : <FileDown className="w-3 h-3" />}
                           Invoice
                        </button>
                      </div>
                    ) : (
                      <span className={`badge status-${p.status}`}>{p.status}</span>
                    )}
                  </div>
                </div>
              ))}
              {payments.length === 0 && <div className="p-12 text-center text-slate-500">No payment history</div>}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResidentPayments;
