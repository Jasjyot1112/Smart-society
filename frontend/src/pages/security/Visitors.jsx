import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getVisitors, markExit } from '../../api/visitorApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { RefreshCw, KeySquare, LogOut, Clock, CheckCircle2, XCircle } from 'lucide-react';

const SecurityVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await getVisitors({ limit: 50 });
      setVisitors(res.data.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVisitors(); }, []);


  const handleMarkExit = async (id) => {
    try {
      await markExit(id);
      toast.success('Exit logged');
      fetchVisitors();
    } catch { toast.error('Failed'); }
  };

  const statusIcon = { pending: <Clock className="w-4 h-4 text-amber-400" />, entered: <CheckCircle2 className="w-4 h-4 text-blue-400" />, denied: <XCircle className="w-4 h-4 text-red-400" />, exited: <CheckCircle2 className="w-4 h-4 text-slate-400" /> };

  const filteredVisitors = visitors.filter(v => 
    v.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Visitor Log">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">Today's Visitors</h1>
            <p className="section-subtitle">Manage gate entries and monitor exits</p>
          </div>
          <button onClick={fetchVisitors} className="btn-secondary flex items-center gap-2 text-sm py-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>

        <div className="mb-4">
          <input 
            type="text" 
            placeholder="Search by Flat Number or Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field max-w-md w-full"
          />
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? <LoadingSpinner /> : (
            <div className="divide-y divide-dark-700/50">
              {filteredVisitors.map((v) => (
                <div key={v._id} className="flex items-center gap-4 p-4 flex-wrap hover:bg-dark-700/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-lg flex-shrink-0">👤</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {statusIcon[v.status]}
                      <p className="font-medium text-white">{v.name}</p>
                    </div>
                    <p className="text-xs text-slate-400">{v.phone} | Flat: {v.resident?.wing ? `${v.resident.wing}-${v.flatNumber}` : v.flatNumber} | {v.purpose}</p>
                    <p className="text-xs text-slate-500">{new Date(v.createdAt).toLocaleTimeString()}{v.entryTime ? ` → In: ${new Date(v.entryTime).toLocaleTimeString()}` : ''}{v.exitTime ? ` → Out: ${new Date(v.exitTime).toLocaleTimeString()}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge status-${v.status}`}>{v.status}</span>
                    {v.status === 'entered' && (
                      <button onClick={() => handleMarkExit(v._id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-700/30 text-red-300 rounded-lg text-xs hover:bg-red-700/50 transition-colors">
                        <LogOut className="w-3 h-3" /> Mark Exit
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {visitors.length === 0 && !loading && <div className="p-12 text-center text-slate-500">No visitor records today</div>}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default SecurityVisitors;
