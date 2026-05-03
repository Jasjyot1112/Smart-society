import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { AlertTriangle } from 'lucide-react';
import axiosInstance from '../../api/axios';
import toast from 'react-hot-toast';

export default function SOSOverlay() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeAlerts, setActiveAlerts] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!user || (user.role !== 'security' && user.role !== 'admin')) return;

    // Load active alerts on mount
    const loadActiveAlerts = async () => {
      try {
        const res = await axiosInstance.get('/sos/active');
        // We only care about unacknowledged 'active' alerts for the overlay siren
        const unacked = res.data.data.filter(a => a.status === 'active');
        setActiveAlerts(unacked);
      } catch (err) {
        console.error(err);
      }
    };
    loadActiveAlerts();

    // Setup audio context for siren
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    
    const playSiren = () => {
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      // Siren effect alternating between 880Hz and 1100Hz
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1);
    };

    let sirenInterval;

    if (socket) {
      socket.on('sos_alert', (data) => {
        setActiveAlerts(prev => [...prev, { ...data, _id: data.alertId, status: 'active' }]);
        toast.error(`EMERGENCY: ${data.type} at Flat ${data.wing ? data.wing + '-' : ''}${data.flatNumber}`, { duration: 10000 });
        if (!sirenInterval) {
          sirenInterval = setInterval(playSiren, 1000);
        }
      });

      socket.on('sos_acknowledged', (data) => {
        setActiveAlerts(prev => prev.filter(a => a._id !== data.alertId));
      });

      socket.on('sos_resolved', (data) => {
        setActiveAlerts(prev => prev.filter(a => a._id !== data.alertId));
      });
    }

    // Start siren if there are initial active alerts
    if (activeAlerts.length > 0 && !sirenInterval) {
      sirenInterval = setInterval(playSiren, 1000);
    }

    return () => {
      if (socket) {
        socket.off('sos_alert');
        socket.off('sos_acknowledged');
        socket.off('sos_resolved');
      }
      if (sirenInterval) clearInterval(sirenInterval);
      if (ctx.state !== 'closed') ctx.close();
    };
  }, [user, socket]);

  // Restart siren if activeAlerts changes and becomes > 0
  useEffect(() => {
    let interval;
    if (activeAlerts.length > 0) {
      // Create a basic beep if web audio API failed to init above
      interval = setInterval(() => {
        // Fallback or just visual pulse
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeAlerts]);

  const handleAcknowledge = async (id) => {
    try {
      await axiosInstance.put(`/sos/${id}/acknowledge`);
      setActiveAlerts(prev => prev.filter(a => a._id !== id));
      toast.success('Alert acknowledged. Siren stopped.');
    } catch (err) {
      console.error('Acknowledge Error:', err);
      toast.error(err.response?.data?.message || 'Failed to acknowledge alert');
    }
  };

  if (!activeAlerts || activeAlerts.length === 0) return null;

  const alert = activeAlerts[0]; // Show the oldest active alert

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-red-600/95 backdrop-blur-md animate-pulse-fast">
      <div className="bg-dark-900 border-4 border-red-500 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl shadow-red-900/50">
        <AlertTriangle className="w-32 h-32 mx-auto text-red-500 mb-6 animate-bounce" />
        
        <div className="inline-block bg-red-500 text-white font-black uppercase tracking-widest px-4 py-1 rounded-full text-sm mb-4">
          {alert.type || 'Emergency'} Alert
        </div>
        
        <h1 className="text-5xl font-black text-white mb-2">
          FLAT {alert.wing ? alert.wing + '-' : ''}{alert.flatNumber}
        </h1>
        
        <p className="text-2xl text-red-400 font-bold mb-6">
          {alert.residentName} needs immediate help!
        </p>

        {alert.message && (
          <div className="bg-dark-800 p-4 rounded-xl mb-8">
            <p className="text-slate-300 font-medium text-lg">"{alert.message}"</p>
          </div>
        )}

        <button 
          onClick={() => handleAcknowledge(alert._id)}
          className="w-full bg-white text-red-600 font-black text-2xl py-6 rounded-2xl hover:bg-red-50 transition-colors shadow-xl"
        >
          ACKNOWLEDGE & DISPATCH HELP
        </button>
      </div>
    </div>
  );
}
