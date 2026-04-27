import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { getMarketplaceItems, createMarketplaceItem, deleteMarketplaceItem, updateMarketplaceItem } from '../../api/communityApi';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Plus, Phone, Mail, Image as ImageIcon, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const categories = ['All', 'Furniture', 'Electronics', 'Appliances', 'Vehicles', 'Other'];

export default function Marketplace() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', category: 'Furniture', contactPhone: '', contactEmail: '', showContact: true
  });
  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => {
    fetchItems();
  }, [activeCategory, searchQuery]);

  const fetchItems = async () => {
    try {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;
      
      const res = await getMarketplaceItems(params);
      setItems(res.data.data);
    } catch {
      toast.error('Failed to load marketplace items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    imageFiles.forEach(file => data.append('images', file));

    try {
      await createMarketplaceItem(data);
      toast.success('Item listed successfully!');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', price: '', category: 'Furniture', contactPhone: '', contactEmail: '', showContact: true });
      setImageFiles([]);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to list item');
    }
  };

  const handleMarkSold = async (id) => {
    try {
      await updateMarketplaceItem(id, { status: 'sold' });
      toast.success('Marked as sold!');
      fetchItems();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteMarketplaceItem(id);
      toast.success('Item deleted');
      fetchItems();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  return (
    <Layout title="Marketplace">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="section-title">Community Marketplace</h1>
          <p className="section-subtitle">Buy and sell items within the society</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> List Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <div className="flex bg-dark-800 p-1 rounded-xl overflow-x-auto hide-scrollbar">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === c ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-80 bg-dark-800 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <ShoppingBag className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white">No items found</h3>
          <p className="text-slate-400">Be the first to list something in this category!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item._id} className="glass-card overflow-hidden flex flex-col relative group">
              {item.status === 'sold' && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-lg">
                  SOLD
                </div>
              )}
              
              <div className="h-48 bg-dark-900 relative">
                {item.images?.length > 0 ? (
                  <img src={item.images[0].url} alt={item.title} className={`w-full h-full object-cover ${item.status === 'sold' ? 'grayscale opacity-70' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon className="w-12 h-12" /></div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <span className="badge badge-primary">{item.category}</span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-lg font-bold ${item.status === 'sold' ? 'text-slate-400 line-through' : 'text-white'}`}>{item.title}</h3>
                  <span className="text-xl font-bold text-emerald-400">₹{item.price?.toLocaleString()}</span>
                </div>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                
                <div className="mt-auto space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-300 bg-dark-800 p-2 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-xs uppercase">
                      {item.sellerId.name?.charAt(0)}
                    </div>
                    <span>{item.sellerId.name}</span>
                    <span className="text-slate-500 text-xs ml-auto">Wing {item.sellerId.wing}-{item.sellerId.flatNumber}</span>
                  </div>
                  
                  {item.status === 'available' && item.contactInfo?.showContact && (
                    <div className="flex gap-2">
                      {item.contactInfo.phone && <a href={`tel:${item.contactInfo.phone}`} className="flex-1 btn-secondary py-2 text-xs flex justify-center items-center gap-1"><Phone className="w-3 h-3"/> Call</a>}
                      {item.contactInfo.email && <a href={`mailto:${item.contactInfo.email}`} className="flex-1 btn-secondary py-2 text-xs flex justify-center items-center gap-1"><Mail className="w-3 h-3"/> Email</a>}
                    </div>
                  )}

                  {(user._id === item.sellerId._id || user.role === 'admin') && (
                    <div className="flex gap-2 pt-2 border-t border-dark-700">
                      {item.status === 'available' && <button onClick={() => handleMarkSold(item._id)} className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 py-2 rounded-lg text-xs font-semibold transition-colors">Mark as Sold</button>}
                      <button onClick={() => handleDelete(item._id)} className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 py-2 rounded-lg text-xs font-semibold transition-colors">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-800 rounded-2xl w-full max-w-lg overflow-hidden border border-dark-700 shadow-2xl">
            <div className="p-6 border-b border-dark-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white text-gradient">List New Item</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh] space-y-4 sidebar-scroll">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Title</label>
                <input required type="text" className="input-field w-full" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Price (₹)</label>
                  <input required type="number" min="0" className="input-field w-full" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Category</label>
                  <select className="input-field w-full" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea required className="input-field w-full h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Images</label>
                <input type="file" multiple accept="image/*" onChange={e => setImageFiles(Array.from(e.target.files))} className="input-field w-full text-slate-400" />
              </div>
              <div className="bg-dark-900 border border-dark-700 p-4 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-white">Contact Info</p>
                <input type="text" placeholder="Phone Number (Optional)" className="input-field w-full text-sm py-2" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={formData.showContact} onChange={e => setFormData({...formData, showContact: e.target.checked})} className="rounded bg-dark-700 border-dark-600 text-primary-600" />
                  Show contact details publicly
                </label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Post Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
}
