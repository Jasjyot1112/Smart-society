import { useEffect, useState, useRef } from 'react';
import Layout from '../../components/common/Layout';
import { createComplaint, getMyComplaints } from '../../api/complaintApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Plus, X, Mic, MicOff, Image as ImageIcon, Upload, Sparkles } from 'lucide-react';

const statusColors = { pending: 'status-pending', in_progress: 'status-in_progress', resolved: 'status-resolved', rejected: 'status-rejected', closed: 'status-pending' };

const ResidentComplaints = () => {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [files, setFiles] = useState([]);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await getMyComplaints({ limit: 20 });
      setComplaints(res.data.data);
    } catch { toast.error('Failed to load complaints'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setFiles(prev => [...prev, file]);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setRecording(true);
    } catch { toast.error('Microphone access denied'); }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  // Voice-to-Text (Web Speech API)
  const startVoiceToText = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return toast.error('Voice-to-text not supported in this browser');
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setForm(prev => ({ ...prev, description: prev.description + ' ' + transcript }));
      toast.success('Voice converted to text!');
    };
    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return toast.error('Title and description required');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      files.forEach(f => fd.append('media', f));
      await createComplaint(fd);
      toast.success('Complaint submitted! Auto-classified by AI 🤖');
      setShowForm(false);
      setForm({ title: '', description: '' });
      setFiles([]);
      fetchComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <Layout title={t('complaints.title')}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">{t('complaints.title')}</h1>
            <p className="section-subtitle">{t('complaints.subtitle')}</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm py-2.5">
            <Plus className="w-4 h-4" /> {t('complaints.newComplaint')}
          </button>
        </div>

        {/* Complaint Cards */}
        {loading ? <LoadingSpinner /> : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c._id} className="glass-card p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-white truncate">{c.title}</h3>
                    {c.isAutoClassified && <span className="badge badge-purple flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> AI</span>}
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                    <span className="badge badge-blue capitalize">{c.category?.replace('_', ' ')}</span>
                    <span className={`badge ${c.priority === 'urgent' ? 'badge-red' : c.priority === 'high' ? 'badge-yellow' : 'badge-gray'} capitalize`}>{c.priority}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`badge ${statusColors[c.status]}`}>{c.status?.replace('_', ' ')}</span>
                  {c.media?.length > 0 && <span className="text-xs text-slate-600">{c.media.length} attachment(s)</span>}
                </div>
              </div>
            ))}
            {complaints.length === 0 && (
              <div className="glass-card p-12 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-slate-400">{t('complaints.noComplaints')}</p>
              </div>
            )}
          </div>
        )}

        {/* New Complaint Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-white">{t('complaints.newComplaint')}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Sparkles className="w-3 h-3 text-purple-400" /> AI will auto-classify your complaint</p>
                </div>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="text-xs text-slate-400 mb-1 block">Title *</label><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="input-field" placeholder="Brief title of your complaint" /></div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">Description *</label>
                    <button type="button" onClick={startVoiceToText} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                      <Mic className="w-3 h-3" /> Voice-to-Text
                    </button>
                  </div>
                  <textarea required rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="input-field resize-none" placeholder="Describe your complaint in detail..." />
                </div>

                {/* Attachments */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Attachments (image or audio)</label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-slate-300 rounded-xl cursor-pointer text-sm transition-colors">
                      <ImageIcon className="w-4 h-4" /> Add Image
                      <input type="file" accept="image/*" multiple hidden onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                    </label>
                    <button type="button" onClick={recording ? stopRecording : startRecording}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${recording ? 'bg-red-600 text-white animate-pulse' : 'bg-dark-700 text-slate-300 hover:bg-dark-600'}`}>
                      {recording ? <><MicOff className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Record Audio</>}
                    </button>
                  </div>
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-1 px-2 py-1 bg-dark-700 rounded-lg text-xs text-slate-300">
                          <Upload className="w-3 h-3" /> {f.name.slice(0, 20)}
                          <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="ml-1 text-slate-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2.5 text-sm">
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-2.5 text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResidentComplaints;
