import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getVisitors, markExit } from '../../api/visitorApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { UserCheck, LogOut, RefreshCw, Filter } from 'lucide-react';

const statusOpts = ['', 'pending', 'approved', 'denied', 'entered', 'exited'];

const AdminVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await getVisitors({ ...params, limit: 50 });
      setVisitors(res.data.data);
    } catch { toast.error('Failed to load visitors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVisitors(); }, [statusFilter]);

  const handleMarkExit = async (id) => {
    try {
      await markExit(id);
      toast.success('Exit logged');
      fetchVisitors();
    } catch { toast.error('Failed'); }
  };

  return (
    <Layout title="Visitor Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="section-title">Visitor Log</h1>
            <p className="section-subtitle">Complete visitor history for the society</p>
          </div>
          <button onClick={fetchVisitors} className="btn-secondary flex items-center gap-2 text-sm py-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>

        {/* Filter */}
        <div className="glass-card p-4 flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-44 py-2">
            {statusOpts.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Visitor</th><th>Flat</th><th>Purpose</th><th>Status</th><th>Entry</th><th>Exit</th><th>Guard</th><th>Action</th></tr></thead>
                <tbody>
                  {visitors.map((v) => (
                    <tr key={v._id}>
                      <td><p className="font-medium text-white">{v.name}</p><p className="text-xs text-slate-500">{v.phone}</p></td>
                      <td>{v.resident?.wing ? `${v.resident.wing}-${v.flatNumber}` : v.flatNumber}</td>
                      <td><span className="badge badge-blue capitalize">{v.purpose}</span></td>
                      <td><span className={`badge status-${v.status}`}>{v.status}</span></td>
                      <td className="text-xs">{v.entryTime ? new Date(v.entryTime).toLocaleTimeString() : '—'}</td>
                      <td className="text-xs">{v.exitTime ? new Date(v.exitTime).toLocaleTimeString() : '—'}</td>
                      <td className="text-xs">{v.guard?.name}</td>
                      <td>
                        {v.status === 'entered' && (
                          <button onClick={() => handleMarkExit(v._id)} className="flex items-center gap-1 text-xs btn-secondary py-1 px-3">
                            <LogOut className="w-3 h-3" /> Exit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {visitors.length === 0 && <tr><td colSpan="8" className="text-center py-12 text-slate-500">No visitors found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminVisitors;
