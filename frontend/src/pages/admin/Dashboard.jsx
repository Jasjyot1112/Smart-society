import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getOverview } from '../../api/analyticsApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Users, CreditCard, FileText, CalendarDays, UserCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverview()
      .then((res) => setStats(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><LoadingSpinner text="Loading dashboard..." /></Layout>;

  const kpiCards = [
    { label: 'Total Residents', value: stats?.totalResidents || 0, icon: Users, color: 'bg-blue-500/20 text-blue-400' },
    { label: 'Monthly Revenue', value: `₹${(stats?.monthRevenue || 0).toLocaleString()}`, icon: CreditCard, color: 'bg-emerald-500/20 text-emerald-400' },
    { label: 'Open Complaints', value: stats?.activeComplaints || 0, icon: AlertTriangle, color: 'bg-amber-500/20 text-amber-400' },
    { label: 'Active Bookings', value: stats?.totalBookings || 0, icon: CalendarDays, color: 'bg-purple-500/20 text-purple-400' },
    { label: "Today's Visitors", value: stats?.visitorsToday || 0, icon: UserCheck, color: 'bg-cyan-500/20 text-cyan-400' },
    { label: 'Pending Payments', value: stats?.pendingPayments || 0, icon: TrendingUp, color: 'bg-pink-500/20 text-pink-400' },
  ];

  const paymentData = [
    { name: 'Paid', value: Math.max(0, (stats?.totalResidents || 0) - (stats?.pendingPayments || 0)), color: '#10b981' },
    { name: 'Pending', value: stats?.pendingPayments || 0, color: '#ef4444' },
  ];

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="section-title">Society Overview</h1>
          <p className="section-subtitle">Real-time stats for your residential society</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards.map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="kpi-card">
              <div className={`kpi-icon ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-slate-400 text-sm mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Status Pie */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Payment Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {paymentData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Society Stats Bar */}
          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="font-semibold text-white mb-4">User Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Residents', count: stats?.totalResidents || 0 },
                { name: 'Visitors', count: stats?.visitorsToday || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
