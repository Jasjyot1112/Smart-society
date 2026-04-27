import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { getMyBookings } from '../../api/bookingApi';
import { getMyComplaints } from '../../api/complaintApi';
import { getMyPayments } from '../../api/paymentApi';
import { CalendarDays, FileText, CreditCard, UserCheck, Bell, TrendingUp, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ bookings: [], complaints: [], payments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyBookings({ limit: 3, status: 'confirmed' }),
      getMyComplaints({ limit: 3 }),
      getMyPayments(),
    ]).then(([bRes, cRes, pRes]) => {
      setData({ bookings: bRes.data.data, complaints: cRes.data.data, payments: pRes.data.data });
    }).finally(() => setLoading(false));
  }, []);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const paidThisMonth = data.payments.find(p => p.month === currentMonth && p.year === currentYear && p.status === 'paid');
  const pendingComplaints = data.complaints.filter(c => c.status === 'pending').length;

  const quickActions = [
    { label: 'Book Facility', icon: CalendarDays, color: 'from-purple-600 to-indigo-600', to: '/resident/book' },
    { label: 'Raise Complaint', icon: FileText, color: 'from-orange-600 to-red-600', to: '/resident/complaints' },
    { label: 'Pay Maintenance', icon: CreditCard, color: 'from-emerald-600 to-green-600', to: '/resident/payments' },
    { label: 'Visitor Requests', icon: UserCheck, color: 'from-cyan-600 to-blue-600', to: '/resident/visitors' },
  ];

  if (loading) return <Layout title="My Dashboard"><LoadingSpinner text="Loading..." /></Layout>;

  return (
    <Layout title="My Dashboard">
      <div className="space-y-8">
        {/* Welcome */}
        <div className="glass-card p-6 bg-gradient-to-r from-primary-900/40 to-purple-900/20 border-primary-700/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-slate-400 mt-1">Flat {user?.wing ? `${user.wing}-${user.flatNumber}` : user?.flatNumber} | Smart Society</p>
            </div>
            <div className="flex items-center gap-2 bg-dark-800/60 px-4 py-2 rounded-xl">
              {paidThisMonth ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-sm text-emerald-400">Maintenance Paid</span></>
              ) : (
                <><Bell className="w-4 h-4 text-amber-400" /><span className="text-sm text-amber-400">Payment Pending</span></>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map(({ label, icon: Icon, color, to }) => (
              <button key={label} onClick={() => navigate(to)}
                className={`glass-card p-6 flex flex-col items-center gap-3 hover:scale-[1.02] transition-all duration-200 group`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-300 text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="kpi-card">
            <div className="kpi-icon bg-purple-500/20 text-purple-400"><CalendarDays className="w-6 h-6" /></div>
            <div><p className="text-2xl font-bold text-white">{data.bookings.length}</p><p className="text-slate-400 text-sm">Active Bookings</p></div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon bg-orange-500/20 text-orange-400"><FileText className="w-6 h-6" /></div>
            <div><p className="text-2xl font-bold text-white">{pendingComplaints}</p><p className="text-slate-400 text-sm">Pending Complaints</p></div>
          </div>
          <div className="kpi-card">
            <div className={`kpi-icon ${paidThisMonth ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              <CreditCard className="w-6 h-6" />
            </div>
            <div><p className="text-2xl font-bold text-white">{paidThisMonth ? '✓' : '!'}</p><p className="text-slate-400 text-sm">This Month's Payment</p></div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Upcoming Bookings</h2>
            <button onClick={() => navigate('/resident/book')} className="text-primary-400 text-sm hover:text-primary-300">Book Facility →</button>
          </div>
          {data.bookings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No upcoming bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.bookings.map((b) => (
                <div key={b._id} className="flex items-center gap-4 p-3 bg-dark-900/40 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center text-primary-400"><CalendarDays className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{b.facility?.name}</p>
                    <p className="text-xs text-slate-400">{new Date(b.date).toDateString()} · {b.slot?.label}</p>
                  </div>
                  <span className={`badge status-${b.status}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResidentDashboard;
