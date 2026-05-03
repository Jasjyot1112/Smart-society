import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { getDocuments, uploadDocument, deleteDocument } from '../../api/documentApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { FolderOpen, Upload, Trash2, FileText, Image, File, Download, Plus } from 'lucide-react';

const fileIcon = (type) => {
  if (type === 'pdf') return <FileText className="w-8 h-8 text-red-400" />;
  if (type === 'image') return <Image className="w-8 h-8 text-blue-400" />;
  return <File className="w-8 h-8 text-slate-400" />;
};

const Documents = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('society'); // 'society' | 'personal'
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'society', isPublic: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchDocs = async () => {
    try {
      const res = await getDocuments();
      setDocs(res.data.data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Please select a file');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('category', formData.category);
      fd.append('isPublic', formData.isPublic);

      await uploadDocument(fd);
      toast.success('Document uploaded successfully!');
      setShowModal(false);
      setSelectedFile(null);
      setFormData({ title: '', description: '', category: 'society', isPublic: true });
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await deleteDocument(id);
      toast.success('Document deleted');
      fetchDocs();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const filtered = docs.filter(d => d.category === tab);

  return (
    <Layout title="Document Wallet">
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="section-title">Document Wallet</h1>
            <p className="section-subtitle">Society and personal documents in one place</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Upload Document
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {['society', 'personal'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm capitalize transition-all ${tab === t ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'}`}
            >
              {t === 'society' ? '🏢 Society Documents' : '🏠 Personal Documents'}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(doc => (
              <div key={doc._id} className="glass-card p-5 group hover:border-primary-500/40 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-dark-700 flex items-center justify-center flex-shrink-0">
                    {fileIcon(doc.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{doc.title}</h3>
                    {doc.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{doc.description}</p>}
                    <p className="text-xs text-slate-500 mt-2">By {doc.uploadedBy?.name} · {new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-700/50">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-600/20 hover:bg-primary-600/40 text-primary-400 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" /> View / Download
                  </a>
                  {(isAdmin || doc.uploadedBy?._id === user?._id) && (
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full text-center p-12 glass-card border border-dashed border-dark-600">
                <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No {tab} documents uploaded yet.</p>
                <button onClick={() => setShowModal(true)} className="text-primary-400 hover:text-primary-300 font-medium mt-2">
                  Upload the first one
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-dark-800 rounded-2xl w-full max-w-md p-6 border border-dark-600 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary-400" /> Upload Document
              </h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input-field w-full" placeholder="e.g. Society By-Laws 2024" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
                  <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field w-full" placeholder="Brief description" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input-field w-full">
                    <option value="society">Society Document</option>
                    <option value="personal">Personal / Flat Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">File</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-dark-500 rounded-xl cursor-pointer hover:border-primary-500 transition-colors bg-dark-900">
                    {selectedFile ? (
                      <div className="text-center">
                        <FileText className="w-8 h-8 text-primary-400 mx-auto mb-1" />
                        <p className="text-sm text-white font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-1" />
                        <p className="text-sm text-slate-400">Click to select PDF or image</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setSelectedFile(e.target.files[0])} />
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => { setShowModal(false); setSelectedFile(null); }} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
                  <button type="submit" disabled={uploading} className="btn-primary">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Documents;
