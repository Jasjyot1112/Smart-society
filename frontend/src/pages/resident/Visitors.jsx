import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getVisitors, respondToVisitor } from '../../api/visitorApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, RefreshCw, UserCheck, Clock } from 'lucide-react';

const ResidentVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await getVisitors({ limit: 30 });
      setVisitors(res.data.data);
    } catch { toast.error('Failed to load visitor requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVisitors(); }, []);

  const handleRespond = async (id, action, reason) => {
    setResponding(id + action);
    try {
      await respondToVisitor(id, { action, denialReason: reason });
      toast.success(action === 'approve' ? '✅ Visitor allowed entry!' : '❌ Visitor denied.');
      fetchVisitors();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setResponding(null); }
  };

  const pending = visitors.filter(v => v.status === 'pending');
  const history = visitors.filter(v => v.status !== 'pending');

  return (
    <Layout title="Visitor Requests">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">Visitor Requests</h1>
            <p className="section-subtitle">Approve or deny gate entry requests</p>
          </div>
          <button onClick={fetchVisitors} className="btn-secondary flex items-center gap-2 text-sm py-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>

        {/* Pending requests */}
        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Pending Requests ({pending.length})
            </h2>
            {pending.map((v) => (
              <div key={v._id} className="glass-card p-5 border border-amber-600/30">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">👤</div>
                    <div>
                      <h3 className="font-bold text-white">{v.name}</h3>
                      <p className="text-slate-400 text-sm">{v.phone} · <span className="capitalize">{v.purpose}</span></p>
                      <p className="text-xs text-slate-500 mt-1">Guard: {v.guard?.name} · {new Date(v.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(v._id, 'approve')}
                      disabled={responding === v._id + 'approve'}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {responding === v._id + 'approve' ? '...' : 'Allow'}
                    </button>
                    <button
                      onClick={() => handleRespond(v._id, 'deny', 'Not expected')}
                      disabled={responding === v._id + 'deny'}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      {responding === v._id + 'deny' ? '...' : 'Deny'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Visitor History</h2>
          {loading ? <LoadingSpinner /> : (
            <div className="glass-card overflow-hidden">
              <div className="divide-y divide-dark-700/50">
                {history.map((v) => (
                  <div key={v._id} className="flex items-center gap-4 p-4 hover:bg-dark-700/20">
                    <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-lg flex-shrink-0">👤</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{v.name}</p>
                      <p className="text-xs text-slate-500">{v.phone} · {v.purpose} · {new Date(v.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`badge status-${v.status}`}>{v.status}</span>
                      {v.entryTime && <p className="text-xs text-slate-500 mt-1">{new Date(v.entryTime).toLocaleTimeString()}</p>}
                    </div>
                  </div>
                ))}
                {history.length === 0 && !loading && (
                  <div className="p-12 text-center text-slate-500">No visitor history yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResidentVisitors;
