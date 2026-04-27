import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { getServices, createService, deleteService } from '../../api/communityApi';
import { useAuth } from '../../context/AuthContext';
import { Wrench, Phone, Plus, Trash2, Shield, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const categories = ['All', 'Milk', 'Newspaper', 'Maid', 'Electrician', 'Plumber', 'Internet', 'Other'];

export default function Services() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', contact: '', category: 'Maid', description: '' });

  useEffect(() => {
    fetchServices();
  }, [activeCategory, search]);

  const fetchServices = async () => {
    try {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (search) params.search = search;
      
      const res = await getServices(params);
      setServices(res.data.data);
    } catch {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createService(formData);
      toast.success('Service added successfully');
      setIsModalOpen(false);
      setFormData({ name: '', contact: '', category: 'Maid', description: '' });
      fetchServices();
    } catch {
      toast.error('Failed to add service');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await deleteService(id);
      toast.success('Service deleted');
      fetchServices();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <Layout title="Services Directory">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="section-title">Verified Services</h1>
          <p className="section-subtitle">Directory of society-approved service providers</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search a service..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 w-full" />
        </div>
        <div className="flex bg-dark-800 p-1 rounded-xl overflow-x-auto hide-scrollbar">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === c ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-dark-800 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <Wrench className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white">No services found</h3>
          <p className="text-slate-400">There are no approved providers in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map(svc => (
            <div key={svc._id} className="glass-card p-6 flex flex-col relative group">
              {(user.role === 'admin' || svc.createdBy === user._id) && (
                <button onClick={() => handleDelete(svc._id)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4"/>
                </button>
              )}
              
              <div className="w-12 h-12 rounded-xl bg-primary-600/20 text-primary-500 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1">{svc.name}</h3>
              <p className="text-primary-400 text-sm font-semibold mb-3">{svc.category}</p>
              
              <p className="text-slate-400 text-sm mb-6 flex-1">{svc.description}</p>
              
              <a href={`tel:${svc.contact}`} className="btn-secondary w-full flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" /> {svc.contact}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-700 shadow-xl">
            <div className="p-6 border-b border-dark-700"><h2 className="text-xl font-bold text-white">Add Service Provider</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Provider Name</label>
                <input required type="text" className="input-field w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Phone/Contact</label>
                  <input required type="text" className="input-field w-full" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Category</label>
                  <select className="input-field w-full" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description (Optional)</label>
                <textarea className="input-field w-full h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Provider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
