import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getExpenses, getExpenseSummary, addExpense, deleteExpense } from '../../api/expenseApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CATEGORY_LABELS = {
  watchman_salary: 'Watchman Salary', water_tanker: 'Water Tanker',
  cleaning_staff: 'Cleaning Staff', electricity: 'Electricity',
  lift_maintenance: 'Lift Maintenance', gardening: 'Gardening',
  security_system: 'Security System', repairs: 'Repairs', miscellaneous: 'Miscellaneous',
};
const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#f97316','#ec4899','#64748b'];
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AdminExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'watchman_salary', title: '', amount: '', description: '', vendor: '' });
  const [saving, setSaving] = useState(false);
  const [year] = useState(new Date().getFullYear());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eRes, sRes] = await Promise.all([getExpenses({ year, limit: 50 }), getExpenseSummary(year)]);
      setExpenses(eRes.data.data);
      setSummary(sRes.data.data);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await addExpense(fd);
      toast.success('Expense added!');
      setShowModal(false);
      setForm({ category: 'watchman_salary', title: '', amount: '', description: '', vendor: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add expense'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try { await deleteExpense(id); toast.success('Deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
  };

  const pieData = summary?.byCategory?.map((c) => ({ name: CATEGORY_LABELS[c._id] || c._id, value: c.total })) || [];
  const barData = summary?.byMonth?.map((m) => ({ name: months[m.month-1], amount: m.total })) || [];

  return (
    <Layout title="Expense Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">Expense Management</h1>
            <p className="section-subtitle">Track and manage society expenses for {year}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2.5">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        {/* Summary card */}
        <div className="kpi-card">
          <div className="kpi-icon bg-red-500/20 text-red-400"><TrendingDown className="w-6 h-6" /></div>
          <div>
            <p className="text-3xl font-bold text-white">₹{(summary?.grandTotal || 0).toLocaleString()}</p>
            <p className="text-slate-400 text-sm">Total Expenses {year}</p>
          </div>
        </div>

        {/* Charts */}
        {summary && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-6 lg:col-span-2">
              <h3 className="font-semibold text-white mb-4">Monthly Expenses (₹)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} formatter={(v) => [`₹${v.toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-semibold text-white mb-4">By Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: 11 }} formatter={(v) => [`₹${v.toLocaleString()}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Expense Table */}
        <div className="glass-card overflow-hidden">
          {loading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Vendor</th><th>Date</th><th>Added By</th><th>Action</th></tr></thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e._id}>
                      <td><p className="font-medium text-white">{e.title}</p><p className="text-xs text-slate-500">{e.description}</p></td>
                      <td><span className="badge badge-purple">{CATEGORY_LABELS[e.category] || e.category}</span></td>
                      <td className="font-semibold text-white">₹{e.amount.toLocaleString()}</td>
                      <td>{e.vendor || '—'}</td>
                      <td className="text-xs">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="text-xs">{e.addedBy?.name}</td>
                      <td>
                        <button onClick={() => handleDelete(e._id)} className="p-1.5 rounded-lg bg-dark-700 hover:bg-red-700/30 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && <tr><td colSpan="7" className="text-center py-12 text-slate-500">No expenses logged yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Expense Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 w-full max-w-md animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white">Add New Expense</h3>
                <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div><label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field">
                    {Object.entries(CATEGORY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-slate-400 mb-1 block">Title *</label><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="input-field" placeholder="Expense title" /></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Amount (₹) *</label><input type="number" required min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="input-field" placeholder="0" /></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Vendor</label><input value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})} className="input-field" placeholder="Vendor name" /></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Description</label><textarea rows="2" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="input-field resize-none" /></div>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm">{saving ? 'Adding...' : 'Add Expense'}</button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary py-2.5 text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminExpenses;
