import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getExpenses, getExpenseSummary } from '../../api/expenseApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#f97316','#ec4899','#64748b'];
const CATEGORY_LABELS = {
  watchman_salary:'Watchman Salary',water_tanker:'Water Tanker',cleaning_staff:'Cleaning Staff',
  electricity:'Electricity',lift_maintenance:'Lift Maintenance',gardening:'Gardening',
  security_system:'Security System',repairs:'Repairs',miscellaneous:'Miscellaneous',
};
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ResidentExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    Promise.all([getExpenses({ year, limit: 30 }), getExpenseSummary(year)])
      .then(([eRes, sRes]) => { setExpenses(eRes.data.data); setSummary(sRes.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const pieData = summary?.byCategory?.map(c => ({ name: CATEGORY_LABELS[c._id] || c._id, value: c.total })) || [];
  const barData = summary?.byMonth?.map(m => ({ name: months[m.month-1], amount: m.total })) || [];

  return (
    <Layout title="Society Expenses">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Expense Transparency</h1>
          <p className="section-subtitle">Society spending breakdown for {year}</p>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-2xl">💰</div>
              <div>
                <p className="text-3xl font-bold text-white">₹{(summary?.grandTotal || 0).toLocaleString()}</p>
                <p className="text-slate-400 text-sm">Total Society Expenses in {year}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-semibold text-white mb-4">Monthly Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} formatter={v => [`₹${v.toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-semibold text-white mb-4">By Category</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                      {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: 11 }} formatter={v => [`₹${v.toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieData.slice(0, 4).map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }}></div>{d.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-dark-700/50"><h3 className="font-semibold text-white">Expense Records</h3></div>
              <div className="divide-y divide-dark-700/50">
                {expenses.map((e) => (
                  <div key={e._id} className="flex items-center justify-between p-4 hover:bg-dark-700/20">
                    <div>
                      <p className="font-medium text-white">{e.title}</p>
                      <p className="text-xs text-slate-500">{CATEGORY_LABELS[e.category]} · {new Date(e.date).toLocaleDateString()}</p>
                    </div>
                    <p className="font-bold text-white">₹{e.amount.toLocaleString()}</p>
                  </div>
                ))}
                {expenses.length === 0 && <div className="p-12 text-center text-slate-500">No expenses recorded yet</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ResidentExpenses;
