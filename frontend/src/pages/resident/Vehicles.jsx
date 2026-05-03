import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { getMyVehicles, addVehicle, removeVehicle } from '../../api/vehicleApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Car, Plus, Trash2, ShieldCheck } from 'lucide-react';

const ResidentVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ licensePlate: '', type: '4-wheeler', makeModel: '', color: '' });

  const fetchVehicles = async () => {
    try {
      const res = await getMyVehicles();
      setVehicles(res.data.data);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addVehicle(formData);
      toast.success('Vehicle registered successfully');
      setShowModal(false);
      setFormData({ licensePlate: '', type: '4-wheeler', makeModel: '', color: '' });
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this vehicle?')) return;
    try {
      await removeVehicle(id);
      toast.success('Vehicle removed');
      fetchVehicles();
    } catch (err) {
      toast.error('Failed to remove vehicle');
    }
  };

  return (
    <Layout title="My Vehicles">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="section-title">My Vehicles</h1>
            <p className="section-subtitle">Manage your registered vehicles for gate security</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Vehicle
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(v => (
              <div key={v._id} className="glass-card p-6 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => handleDelete(v._id)} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Car className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl font-mono">{v.licensePlate}</h3>
                    <p className="text-sm text-indigo-400 capitalize font-medium">{v.type}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-slate-300 font-medium">{v.makeModel} {v.color ? `· ${v.color}` : ''}</p>
                  {v.parkingSpotNumber && <p className="text-sm text-emerald-400 font-semibold">Spot: {v.parkingSpotNumber}</p>}
                </div>
                
                <div className="mt-4 pt-4 border-t border-dark-700 flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Security approved for automatic entry
                </div>
              </div>
            ))}
            {vehicles.length === 0 && (
              <div className="col-span-full text-center p-12 glass-card border border-dashed border-dark-600">
                <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No vehicles registered.</p>
                <button onClick={() => setShowModal(true)} className="text-primary-400 hover:text-primary-300 font-medium mt-2">Add your first vehicle</button>
              </div>
            )}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-dark-800 rounded-2xl w-full max-w-md p-6 border border-dark-600 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Register New Vehicle</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">License Plate</label>
                  <input type="text" required value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})} placeholder="MH 01 AB 1234" className="input-field w-full font-mono uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Vehicle Type</label>
                  <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input-field w-full">
                    <option value="2-wheeler">2-Wheeler (Bike/Scooter)</option>
                    <option value="4-wheeler">4-Wheeler (Car)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Make & Model</label>
                    <input type="text" required value={formData.makeModel} onChange={e => setFormData({...formData, makeModel: e.target.value})} placeholder="e.g. Honda City" className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Color</label>
                    <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="e.g. Silver" className="input-field w-full" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
                  <button type="submit" className="btn-primary">Register</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResidentVehicles;
