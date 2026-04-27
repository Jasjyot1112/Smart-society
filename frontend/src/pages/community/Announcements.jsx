import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../../api/communityApi';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, AlertTriangle, Info, Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'notice' });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await getAnnouncements();
      setAnnouncements(res.data.data);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (imageFile) data.append('image', imageFile);

    try {
      await createAnnouncement(data);
      toast.success('Announcement sent!');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', type: 'notice' });
      setImageFile(null);
      fetchAnnouncements();
    } catch {
      toast.error('Failed to post announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      toast.success('Deleted successfully');
      fetchAnnouncements();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const getTypeStyles = (type) => {
    switch(type) {
      case 'emergency': return { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', icon: <AlertTriangle className="w-6 h-6 text-red-500" /> };
      case 'event': return { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', icon: <CalendarIcon className="w-6 h-6 text-purple-500" /> };
      case 'notice': default: return { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', icon: <Info className="w-6 h-6 text-blue-500" /> };
    }
  };

  return (
    <Layout title="Announcements">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="section-title">Society Announcements</h1>
          <p className="section-subtitle">Important updates from the committee</p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-dark-800 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <Megaphone className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white">No Announcements</h3>
          <p className="text-slate-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => {
            const styles = getTypeStyles(ann.type);
            return (
              <div key={ann._id} className={`glass-card p-6 border ${styles.bg} relative overflow-hidden group`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-50" style={{ color: styles.text.replace('text-', '') }}></div>
                <div className="flex flex-col sm:flex-row gap-6">
                  {ann.image?.url && (
                    <div className="sm:w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-dark-900 border border-dark-700">
                      <img src={ann.image.url} alt={ann.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {styles.icon}
                      <h3 className="text-xl font-bold text-white">{ann.title}</h3>
                      <span className={`ml-auto text-xs font-semibold py-1 px-3 border rounded-full uppercase ${styles.text} ${styles.bg}`}>
                        {ann.type}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-4 whitespace-pre-wrap">{ann.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Posted {new Date(ann.createdAt).toLocaleDateString()} by Committee</span>
                      {user.role === 'admin' && (
                        <button onClick={() => handleDelete(ann._id)} className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Trash2 className="w-4 h-4"/> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-800 rounded-2xl w-full max-w-lg border border-dark-700 shadow-xl">
            <div className="p-6 border-b border-dark-700">
              <h2 className="text-xl font-bold text-white">Broadcast Announcement</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Title</label>
                  <input required type="text" className="input-field w-full" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Type</label>
                  <select className="input-field w-full" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="notice">Notice</option>
                    <option value="event">Event</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Message</label>
                <textarea required className="input-field w-full h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Cover Image (Optional)</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="input-field w-full" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
