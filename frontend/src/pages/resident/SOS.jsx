import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import { AlertTriangle, Activity, ShieldAlert, Flame, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SOS() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [message, setMessage] = useState('');
  
  // Custom Hook or API call could go here, for simplicity we do it inline
  const fetchActiveAlert = async () => {
    try {
      const res = await axiosInstance.get('/sos/active');
      const alerts = res.data.data;
      const myAlert = alerts.find(a => a.resident._id === user._id && a.status !== 'resolved');
      setActiveAlert(myAlert || null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveAlert();
    const interval = setInterval(fetchActiveAlert, 10000); // Poll every 10s just in case
    return () => clearInterval(interval);
  }, []);

  const triggerSOS = async (type) => {
    if (!window.confirm(`Are you sure you want to trigger a ${type.toUpperCase()} emergency alert?`)) return;
    
    setLoading(true);
    try {
      const res = await axiosInstance.post('/sos', { type, message });
      toast.success('SOS Alert Sent!');
      setActiveAlert(res.data.data);
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger SOS');
    } finally {
      setLoading(false);
    }
  };

  const emergencyTypes = [
    { id: 'medical', label: 'Medical Emergency', icon: <Activity className="w-12 h-12 mb-2" />, color: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/50' },
    { id: 'fire', label: 'Fire Emergency', icon: <Flame className="w-12 h-12 mb-2" />, color: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/50' },
    { id: 'security', label: 'Security Threat', icon: <ShieldAlert className="w-12 h-12 mb-2" />, color: 'bg-red-600 hover:bg-red-700 shadow-red-600/50' },
  ];

  return (
    <Layout title="Emergency SOS">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        
        {activeAlert ? (
          <div className={`p-8 rounded-2xl text-center shadow-2xl transition-all duration-500 ${activeAlert.status === 'acknowledged' ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-red-500/20 border border-red-500 animate-pulse'}`}>
            {activeAlert.status === 'acknowledged' ? (
              <CheckCircle className="w-24 h-24 mx-auto text-emerald-500 mb-4" />
            ) : (
              <AlertTriangle className="w-24 h-24 mx-auto text-red-500 mb-4 animate-bounce" />
            )}
            
            <h2 className="text-3xl font-bold text-white mb-2">
              {activeAlert.status === 'acknowledged' ? 'Help is on the way!' : 'SOS Alert Active!'}
            </h2>
            <p className="text-slate-300 text-lg mb-6">
              {activeAlert.status === 'acknowledged' 
                ? `Security has acknowledged your alert and is responding.` 
                : `Your alert has been sent to the security team. Please stay safe.`}
            </p>

            <div className="bg-dark-800 p-4 rounded-xl flex items-center justify-center gap-2 max-w-md mx-auto">
              <Clock className="text-slate-400" />
              <span className="text-slate-300 font-medium">Triggered at {new Date(activeAlert.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8 mt-4">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Emergency SOS</h1>
              <p className="text-slate-400">Tap a button below to immediately alert the security team. Do not use for non-emergencies.</p>
            </div>

            <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Optional details (Flat number is sent automatically)</label>
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="E.g., Heart attack, need ambulance..." 
                className="input-field w-full"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {emergencyTypes.map(type => (
                <button
                  key={type.id}
                  disabled={loading}
                  onClick={() => triggerSOS(type.id)}
                  className={`flex flex-col items-center justify-center p-8 rounded-2xl text-white font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl ${type.color} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </>
        )}

      </div>
    </Layout>
  );
}
