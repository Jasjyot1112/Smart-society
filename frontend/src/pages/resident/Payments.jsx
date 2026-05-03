import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getMyPayments, createOrder, verifyPayment, downloadInvoice } from '../../api/paymentApi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  CreditCard, CheckCircle2, Clock, AlertCircle, FileDown,
  WifiOff, AlertTriangle, Printer
} from 'lucide-react';

const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ── Skeleton Loader ─────────────────────────────────────────────────────────
const PaymentSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="glass-card p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-dark-700/60 skeleton" />
          <div className="space-y-2">
            <div className="h-5 w-36 rounded bg-dark-700/60 skeleton" />
            <div className="h-4 w-24 rounded bg-dark-700/60 skeleton" />
          </div>
        </div>
        <div className="space-y-2 text-right">
          <div className="h-8 w-24 rounded bg-dark-700/60 skeleton ml-auto" />
          <div className="h-9 w-28 rounded-xl bg-dark-700/60 skeleton" />
        </div>
      </div>
    </div>
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-dark-700/50">
        <div className="h-5 w-40 rounded bg-dark-700/60 skeleton" />
      </div>
      {[1,2,3,4].map(i => (
        <div key={i} className="flex items-center justify-between p-4 border-b border-dark-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dark-700/60 skeleton" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded bg-dark-700/60 skeleton" />
              <div className="h-3 w-36 rounded bg-dark-700/60 skeleton" />
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            <div className="h-4 w-20 rounded bg-dark-700/60 skeleton ml-auto" />
            <div className="h-5 w-14 rounded-full bg-dark-700/60 skeleton ml-auto" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Gateway Not Configured Banner ────────────────────────────────────────────
const GatewayNotConfigured = () => (
  <div className="glass-card p-6 border border-slate-600/30 bg-slate-900/20">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-slate-700/30 flex items-center justify-center flex-shrink-0">
        <WifiOff className="w-6 h-6 text-slate-400" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-200 mb-1">Online Payment Unavailable</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Online payments have not been configured for your society yet. Please contact your
          society admin or visit the society office to pay your maintenance.
        </p>
        <p className="text-slate-500 text-xs mt-3">
          Society admins: Add your Razorpay API keys to <code className="text-slate-400 bg-dark-800 px-1 py-0.5 rounded">backend/.env</code> to enable this feature.
        </p>
      </div>
    </div>
  </div>
);

const MAINTENANCE_AMOUNT = 2500;

const ResidentPayments = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [gatewayError, setGatewayError] = useState(false);

  // Client-side PDF receipt generator (no backend needed)
  const printReceipt = (p) => {
    const flat = user?.wing ? `${user.wing}-${user.flatNumber}` : user?.flatNumber;
    const monthName = months[(p.month || currentMonth) - 1];
    const year = p.year || currentYear;
    const amount = p.amount || MAINTENANCE_AMOUNT;
    const lateFee = p.lateFee || 0;
    const total = amount + lateFee;
    const receiptHtml = `
      <html><head><title>Receipt - ${monthName} ${year}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111; padding: 40px; max-width: 600px; margin: auto; }
        h1 { color: #6366f1; font-size: 22px; margin-bottom: 4px; }
        .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        td:first-child { color: #6b7280; }
        td:last-child { text-align: right; font-weight: 600; }
        .total td { font-size: 16px; font-weight: bold; border-top: 2px solid #6366f1; color: #111; }
        .footer { margin-top: 30px; font-size: 11px; color: #9ca3af; text-align: center; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <h1>🏢 Smart Society ERP</h1>
        <p style="color:#6b7280;font-size:13px">Official Maintenance Receipt</p>
        <hr style="border:1px solid #e5e7eb;margin:16px 0"/>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <p style="margin:0;font-size:15px"><b>Resident:</b> ${user?.name}</p>
            <p style="margin:4px 0;color:#6b7280">Flat: ${flat}</p>
          </div>
          <div style="text-align:right">
            <span class="badge">PAID</span>
            <p style="font-size:12px;color:#6b7280;margin-top:4px">${p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        <table>
          <tr><td>Maintenance Month</td><td>${monthName} ${year}</td></tr>
          <tr><td>Base Amount</td><td>₹${amount.toLocaleString('en-IN')}</td></tr>
          ${lateFee > 0 ? `<tr><td>Late Fee</td><td style="color:#ef4444">₹${lateFee.toLocaleString('en-IN')}</td></tr>` : ''}
          ${p.razorpayPaymentId ? `<tr><td>Transaction ID</td><td style="font-size:11px">${p.razorpayPaymentId}</td></tr>` : ''}
          <tr class="total"><td>Total Paid</td><td>₹${total.toLocaleString('en-IN')}</td></tr>
        </table>
        <p class="footer">This is a computer-generated receipt. No signature required. For queries, contact your society admin.</p>
      </body></html>
    `;
    const win = window.open('', '_blank', 'width=700,height=800');
    win.document.write(receiptHtml);
    win.document.close();
    win.print();
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await getMyPayments();
      setPayments(res.data.data);
    } catch {
      toast.error('Failed to load payment history. Please refresh.');
    } finally {
      setLoading(false);
    }
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
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    setGatewayError(false);
    try {
      const orderRes = await createOrder({
        month: currentMonth,
        year: currentYear,
        amount: MAINTENANCE_AMOUNT,
      });
      const { orderId, amount, currency, keyId, userInfo } = orderRes.data.data;

      // Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please check your internet connection.');
        setPaying(false);
        return;
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Smart Society ERP',
        description: `Maintenance — ${months[currentMonth - 1]} ${currentYear}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await verifyPayment({ ...response, month: currentMonth, year: currentYear });
            toast.success('🎉 Payment successful! Your receipt has been generated.');
            fetchPayments();
          } catch {
            toast.error('Payment verification failed. Please contact your society admin.');
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: userInfo.name,
          email: userInfo.email,
          contact: userInfo.phone || '',
        },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: () => setPaying(false),
          animation: true,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description || 'Please try again.'}`);
        setPaying(false);
      });
      rzp.open();

    } catch (err) {
      // 503 = gateway not configured
      if (err.response?.status === 503 || err.response?.data?.code === 'GATEWAY_NOT_CONFIGURED') {
        setGatewayError(true);
        toast.error('Online payment is not configured. Please contact your admin.');
      } else {
        const msg = err.response?.data?.message || 'Failed to initiate payment. Please try again.';
        toast.error(msg);
      }
      setPaying(false);
    }
  };

  if (loading) return <Layout title={t('nav.payments')}><PaymentSkeleton /></Layout>;

  return (
    <Layout title={t('nav.payments')}>
      <div className="space-y-6">
        <div>
          <h1 className="section-title">{t('payments.title')}</h1>
          <p className="section-subtitle">{t('payments.subtitle')}</p>
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
                <p className="text-slate-400">
                  {t('payments.flat')} {user?.wing ? `${user.wing}-${user.flatNumber}` : user?.flatNumber}
                </p>
                {isPaid && (
                  <p className="text-emerald-400 text-sm mt-1">
                    {t('payments.paidOn')} {new Date(currentPayment.paidAt).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">₹{MAINTENANCE_AMOUNT.toLocaleString('en-IN')}</p>
              {isPaid ? (
                <div className="flex flex-col items-end gap-2 mt-2">
                  <span className="badge badge-green text-sm">✓ {t('payments.paid')}</span>
                  <button
                    onClick={() => handleDownloadInvoice(currentPayment._id)}
                    disabled={downloadingId === currentPayment._id}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors bg-primary-500/10 hover:bg-primary-500/20 px-3 py-1.5 rounded-lg"
                  >
                    {downloadingId === currentPayment._id
                      ? <div className="w-3 h-3 spinner border-white/50 border-t-white rounded-full" />
                      : <FileDown className="w-3.5 h-3.5" />}
                    {t('payments.invoice')}
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
                  {paying ? t('payments.processing') : t('payments.payNow')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Gateway Not Configured — shown only when user tries to pay and 503 received */}
        {gatewayError && <GatewayNotConfigured />}

        {/* Payment History */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-dark-700/50">
            <h3 className="font-semibold text-white">{t('payments.history')}</h3>
          </div>
          <div className="divide-y divide-dark-700/50">
            {payments.map((p) => (
              <div key={p._id} className="flex items-center justify-between p-4 hover:bg-dark-700/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {p.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{months[p.month - 1]} {p.year}</p>
                    <p className="text-xs text-slate-500">
                      {p.razorpayPaymentId ? `ID: ${p.razorpayPaymentId}` : t('payments.pendingPayment')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">₹{((p.amount || 0) + (p.lateFee || 0)).toLocaleString('en-IN')}</p>
                  {p.lateFee > 0 && (
                    <p className="text-red-400 text-xs">+ ₹{p.lateFee} {t('payments.lateFee')}</p>
                  )}
                  {p.status === 'paid' ? (
                    <div className="flex flex-col items-end gap-1 mt-1">
                      <span className="badge badge-green text-xs">{t('payments.paid')}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadInvoice(p._id)}
                          disabled={downloadingId === p._id}
                          className="text-[10px] text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors bg-primary-500/10 px-2 py-1 rounded"
                        >
                          {downloadingId === p._id
                            ? <div className="w-3 h-3 spinner border-primary-400/50 border-t-primary-400 rounded-full" />
                            : <FileDown className="w-3 h-3" />}
                          {t('payments.invoice')}
                        </button>
                        <button
                          onClick={() => printReceipt(p)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors bg-emerald-500/10 px-2 py-1 rounded"
                        >
                          <Printer className="w-3 h-3" /> Receipt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className={`badge status-${p.status}`}>{p.status}</span>
                  )}
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="p-12 text-center text-slate-500">{t('payments.noHistory')}</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResidentPayments;
