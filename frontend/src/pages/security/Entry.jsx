import Layout from '../../components/common/Layout';
import { Shield, KeySquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SecurityEntry = () => {
  const navigate = useNavigate();
  return (
    <Layout title="Gate Entry">
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="section-title">Gate Entry Options</h1>
          <p className="section-subtitle">Choose your entry verification method</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => navigate('/security/dashboard')} className="glass-card p-8 flex flex-col items-center gap-4 hover:border-primary-600/50 hover:scale-[1.02] transition-all">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center"><Shield className="w-8 h-8" /></div>
            <div className="text-center">
              <h3 className="font-bold text-white">New Visitor Entry</h3>
              <p className="text-slate-400 text-sm mt-1">Register visitor & notify resident</p>
            </div>
          </button>
          <button onClick={() => navigate('/security/visitors')} className="glass-card p-8 flex flex-col items-center gap-4 hover:border-primary-600/50 hover:scale-[1.02] transition-all">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/20 text-primary-400 flex items-center justify-center"><KeySquare className="w-8 h-8" /></div>
            <div className="text-center">
              <h3 className="font-bold text-white">Verify OTP / Exit</h3>
              <p className="text-slate-400 text-sm mt-1">Verify OTP or log visitor exit</p>
            </div>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default SecurityEntry;
