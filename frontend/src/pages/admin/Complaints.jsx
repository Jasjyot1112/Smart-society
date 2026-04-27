import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getAllComplaints, updateComplaintStatus, getComplaintStats } from '../../api/complaintApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { FileText, Filter, RefreshCw, AlertTriangle, Clock, CheckCircle2, Image, Mic } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const priorityColor = { urgent: 'badge-red', high: 'badge-yellow', normal: 'badge-blue', low: 'badge-gray' };
const statusOpts = ['', 'pending', 'in_progress', 'resolved', 'rejected', 'closed'];
const priorityOpts = ['', 'urgent', 'high', 'normal', 'low'];
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#6b7280'];

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', page: 1 });
  const [selected, setSelected] = useState(null);
  const [statusNote, setStatusNote] = useState({ status: '', note: '' });
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        getAllComplaints(filters),
        getComplaintStats(),
      ]);
      setComplaints(cRes.data.data);
      setStats(sRes.data.data);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const handleUpdate = async () => {
    if (!statusNote.status) return toast.error('Please select a status');
    setUpdating(true);
    try {
      await updateComplaintStatus(selected._id, statusNote);
      toast.success('Status updated!');
      setSelected(null);
      setStatusNote({ status: '', note: '' });
      fetchData();
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const pieData = stats?.byCategory?.map((c) => ({ name: c._id, value: c.count })) || [];

  return (
    <Layout title="Complaint Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">Complaint Management</h1>
            <p className="section-subtitle">Manage and resolve resident complaints</p>
          </div>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats + Chart */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass-card p-6 lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.byStatus?.map((s) => (
                <div key={s._id} className="text-center">
                  <p className="text-2xl font-bold text-white">{s.count}</p>
                  <p className="text-slate-400 text-xs capitalize mt-1">{s._id?.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
            <div className="glass-card p-4">
              <p className="text-sm font-semibold text-slate-300 mb-2">By Category</p>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={50} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} className="input-field w-40 py-2">
            {statusOpts.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })} className="input-field w-40 py-2">
            {priorityOpts.map((p) => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {loading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr>
                  <th>Complaint</th><th>Resident</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th><th>Action</th>
                </tr></thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="max-w-[180px]">
                            <p className="font-medium text-white truncate">{c.title}</p>
                            <div className="flex gap-1 mt-1">
                              {c.media?.some((m) => m.type === 'image') && <Image className="w-3 h-3 text-slate-500" />}
                              {c.media?.some((m) => m.type === 'audio') && <Mic className="w-3 h-3 text-slate-500" />}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-medium text-slate-200">{c.user?.name}</p>
                        <p className="text-xs text-slate-500">{c.user?.wing}-{c.user?.flatNumber}</p>
                      </td>
                      <td><span className="badge badge-purple capitalize">{c.category?.replace('_', ' ')}</span></td>
                      <td><span className={`badge ${priorityColor[c.priority]}`}>{c.priority}</span></td>
                      <td><span className={`badge status-${c.status}`}>{c.status?.replace('_', ' ')}</span></td>
                      <td className="text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => setSelected(c)} className="text-xs btn-secondary py-1 px-3">Manage</button>
                      </td>
                    </tr>
                  ))}
                  {complaints.length === 0 && (
                    <tr><td colSpan="7" className="text-center py-12 text-slate-500">No complaints found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status Update Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 w-full max-w-md animate-slide-up">
              <h3 className="font-bold text-white mb-1">{selected.title}</h3>
              <p className="text-slate-400 text-sm mb-4">{selected.description}</p>
              {selected.media?.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {selected.media.filter(m => m.type === 'image').map((m, i) => (
                    <img key={i} src={m.url} className="w-20 h-20 object-cover rounded-lg" alt="complaint" />
                  ))}
                </div>
              )}
              <div className="space-y-3">
                <select value={statusNote.status} onChange={(e) => setStatusNote({ ...statusNote, status: e.target.value })} className="input-field">
                  <option value="">Select new status</option>
                  {['pending','in_progress','resolved','rejected','closed'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
                <textarea rows="2" placeholder="Add a note (optional)" value={statusNote.note} onChange={(e) => setStatusNote({ ...statusNote, note: e.target.value })} className="input-field resize-none" />
                <div className="flex gap-3">
                  <button onClick={handleUpdate} disabled={updating} className="btn-primary flex-1 py-2 text-sm">
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                  <button onClick={() => setSelected(null)} className="btn-secondary py-2 text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminComplaints;
