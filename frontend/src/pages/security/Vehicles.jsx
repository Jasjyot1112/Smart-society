import { useState } from 'react';
import Layout from '../../components/common/Layout';
import { searchVehicle } from '../../api/vehicleApi';
import toast from 'react-hot-toast';
import { Search, Car, User, MapPin } from 'lucide-react';

const SecurityVehicles = () => {
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!plate) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await searchVehicle(plate);
      setResult(res.data.data);
      toast.success('Vehicle found!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vehicle not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Vehicle Search">
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="section-title">Vehicle Lookup</h1>
          <p className="section-subtitle">Search license plates to find the owner's flat</p>
        </div>

        <div className="glass-card p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="MH 01 AB 1234"
                className="input-field w-full pl-12 py-4 text-xl tracking-widest uppercase font-mono bg-dark-900 border-primary-500/30"
              />
            </div>
            <button type="submit" disabled={loading || !plate} className="btn-primary px-8">
              {loading ? '...' : 'Search'}
            </button>
          </form>
        </div>

        {result && (
          <div className="glass-card p-8 border-t-4 border-t-emerald-500 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Car className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white font-mono tracking-wider">{result.licensePlate}</h2>
                <p className="text-emerald-400 font-semibold">{result.makeModel} · {result.color}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-dark-800 p-4 rounded-xl flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Owner Name</p>
                  <p className="font-bold text-white">{result.resident?.name}</p>
                  <p className="text-sm text-slate-300">{result.resident?.phone}</p>
                </div>
              </div>
              <div className="bg-dark-800 p-4 rounded-xl flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Flat Details</p>
                  <p className="font-bold text-white text-xl">Flat {result.wing ? result.wing + '-' : ''}{result.flatNumber}</p>
                  {result.parkingSpotNumber && <p className="text-sm text-emerald-400 mt-1">Spot: {result.parkingSpotNumber}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SecurityVehicles;
