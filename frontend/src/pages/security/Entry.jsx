import { useState } from 'react';
import Layout from '../../components/common/Layout';
import { Shield, KeySquare, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fastTrackEntry } from '../../api/visitorApi';
import toast from 'react-hot-toast';

const SecurityEntry = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFastTrack = async (e) => {
    e.preventDefault();
    if (pin.length !== 6) return toast.error('PIN must be 6 digits');
    setLoading(true);
    try {
      const res = await fastTrackEntry({ pin });
      toast.success(res.data.message || 'Fast-Track Entry Successful!');
      setPin('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={t('nav.gateEntry')}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="section-title">{t('security.gateEntry')}</h1>
          <p className="section-subtitle">{t('security.chooseMethod')}</p>
        </div>

        {/* Fast Track PIN Input */}
        <div className="glass-card p-6 border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-3 mb-4 text-emerald-400">
            <Zap className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">Fast-Track Entry</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Enter the 6-digit PIN provided by the visitor for pre-approved instant entry.</p>
          <form onSubmit={handleFastTrack} className="flex gap-4">
            <input 
              type="text" 
              value={pin} 
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="input-field flex-1 text-2xl tracking-[0.5em] text-center font-mono"
            />
            <button type="submit" disabled={loading || pin.length !== 6} className="btn-primary whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 border-none">
              {loading ? 'Verifying...' : 'Allow Entry'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => navigate('/security/dashboard')} className="glass-card p-8 flex flex-col items-center gap-4 hover:border-primary-600/50 hover:scale-[1.02] transition-all">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center"><Shield className="w-8 h-8" /></div>
            <div className="text-center">
              <h3 className="font-bold text-white">{t('security.newVisitor')}</h3>
              <p className="text-slate-400 text-sm mt-1">{t('security.registerVisitor')}</p>
            </div>
          </button>
          <button onClick={() => navigate('/security/visitors')} className="glass-card p-8 flex flex-col items-center gap-4 hover:border-primary-600/50 hover:scale-[1.02] transition-all">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/20 text-primary-400 flex items-center justify-center"><KeySquare className="w-8 h-8" /></div>
            <div className="text-center">
              <h3 className="font-bold text-white">Visitor Logs & Exits</h3>
              <p className="text-slate-400 text-sm mt-1">Verify existing visitors</p>
            </div>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default SecurityEntry;
