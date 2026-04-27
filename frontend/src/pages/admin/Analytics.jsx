import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getRevenueTrend, getFacilityStats, getComplaintStats, getVisitorStats } from '../../api/analyticsApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const AdminAnalytics = () => {
  const [revenue, setRevenue] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getRevenueTrend(),
      getFacilityStats(),
      getComplaintStats(),
      getVisitorStats(),
    ])
      .then(([revRes, facRes, compRes, visRes]) => {
        setRevenue(revRes.data.data.map(d => ({ month: `${d._id.month}/${d._id.year}`, revenue: d.totalRevenue })));
        setFacilities(facRes.data.data);
        setComplaints(compRes.data.data);
        setVisitors(visRes.data.data.map(d => ({ date: d._id, count: d.count })));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Analytics"><LoadingSpinner text="Crunching numbers..." /></Layout>;

  return (
    <Layout title="Advanced Analytics">
      <div className="space-y-8">
        <div>
          <h1 className="section-title">Society Analytics</h1>
          <p className="section-subtitle">Deep dive into revenue, facilities, and society metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Line Chart */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Revenue Trend (6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Facility Usage Bar Chart */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Facility Usage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={facilities} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis dataKey="facilityName" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="totalBookings" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Complaints Pie Chart */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={complaints} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count" nameKey="_id">
                  {complaints.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Visitors Activity Line Chart */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Visitor Activity (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={visitors}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default AdminAnalytics;
