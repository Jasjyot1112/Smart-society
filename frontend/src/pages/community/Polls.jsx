import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { getPolls, createPoll, voteOnPoll, closePoll } from '../../api/pollApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import VotersModal from './VotersModal';
import toast from 'react-hot-toast';
import { BarChart3, Plus, X, CheckCircle2, Clock, Lock, Users } from 'lucide-react';

const Polls = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [votersPoll, setVotersPoll] = useState(null); // poll object for voters modal
  const [formData, setFormData] = useState({
    question: '', options: ['', ''], daysActive: 7, isAnonymous: false
  });
  const [totalResidents, setTotalResidents] = useState(0);

  const fetchPolls = async () => {
    try {
      const res = await getPolls();
      setPolls(res.data.data);
      // Derive total resident count from voter data across all polls (approximate)
    } catch {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolls(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const validOptions = formData.options.filter(o => o.trim() !== '');
    if (validOptions.length < 2) return toast.error('Provide at least 2 options');
    try {
      await createPoll({ ...formData, options: validOptions });
      toast.success('Poll created');
      setShowModal(false);
      setFormData({ question: '', options: ['', ''], daysActive: 7, isAnonymous: false });
      fetchPolls();
    } catch {
      toast.error('Failed to create poll');
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    try {
      await voteOnPoll(pollId, optionIndex);
      toast.success('Vote recorded');
      fetchPolls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to vote');
    }
  };

  const handleClose = async (pollId) => {
    if (!window.confirm('Close this poll early?')) return;
    try {
      await closePoll(pollId);
      toast.success('Poll closed');
      fetchPolls();
    } catch {
      toast.error('Failed to close poll');
    }
  };

  return (
    <Layout title="Polls & Surveys">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="section-title">Community Polls</h1>
            <p className="section-subtitle">Have your say in society matters</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" /> New Poll
            </button>
          )}
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid gap-6">
            {polls.map(poll => {
              const hasVoted = poll.voters.includes(user?._id);
              const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
              const isClosed = !poll.isActive || new Date() > new Date(poll.expiresAt);

              return (
                <div key={poll._id} className="glass-card p-6 border-l-4 border-l-primary-500 relative">
                  {/* Admin Action Buttons */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      {/* View Voters Button */}
                      <button
                        onClick={() => setVotersPoll(poll)}
                        className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 rounded-lg border border-primary-500/20 transition-all"
                      >
                        <Users className="w-3.5 h-3.5" />
                        View Voters ({totalVotes})
                      </button>
                      {poll.isActive && !isClosed && (
                        <button
                          onClick={() => handleClose(poll._id)}
                          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg transition-all"
                        >
                          Close Early
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mb-4 pr-4" style={{ paddingRight: isAdmin ? '14rem' : '1rem' }}>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h2 className="text-xl font-bold text-white">{poll.question}</h2>
                      {poll.isAnonymous && (
                        <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Anonymous
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span>By {poll.creator?.name}</span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {totalVotes} Votes
                      </span>
                      {isClosed ? (
                        <span className="text-red-400 font-semibold">Closed</span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Clock className="w-3 h-3" /> Ends {new Date(poll.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {poll.options.map((opt, idx) => {
                      const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                      return (
                        <div key={idx} className="relative">
                          {hasVoted || isClosed || isAdmin ? (
                            <div className="relative h-12 bg-dark-800 rounded-xl overflow-hidden border border-dark-600 flex items-center px-4 justify-between z-10">
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-primary-600/30 transition-all duration-1000 z-0"
                                style={{ width: `${percentage}%` }}
                              />
                              <span className="relative z-10 text-sm font-medium text-white">{opt.text}</span>
                              <span className="relative z-10 text-sm font-bold text-primary-400">{percentage}% ({opt.votes})</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleVote(poll._id, idx)}
                              className="w-full text-left px-4 py-3 bg-dark-800 hover:bg-primary-900/30 border border-dark-600 hover:border-primary-500/50 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all flex justify-between group"
                            >
                              {opt.text}
                              <CheckCircle2 className="w-5 h-5 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {hasVoted && !isClosed && !isAdmin && (
                    <p className="mt-4 text-xs text-emerald-400 text-center font-medium">
                      ✅ You have already voted on this poll.
                    </p>
                  )}
                </div>
              );
            })}
            {polls.length === 0 && (
              <div className="text-center p-12 glass-card text-slate-500">
                No polls available at the moment.
              </div>
            )}
          </div>
        )}

        {/* Create Poll Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-dark-800 rounded-2xl w-full max-w-md p-6 border border-dark-600 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-4">Create New Poll</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Question</label>
                  <input
                    type="text" required
                    value={formData.question}
                    onChange={e => setFormData({ ...formData, question: e.target.value })}
                    className="input-field w-full"
                    placeholder="What should we name the new park?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Options</label>
                  {formData.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...formData.options];
                          newOpts[i] = e.target.value;
                          setFormData({ ...formData, options: newOpts });
                        }}
                        className="input-field flex-1"
                        placeholder={`Option ${i + 1}`}
                        required={i < 2}
                      />
                      {i >= 2 && (
                        <button type="button" onClick={() => {
                          const newOpts = formData.options.filter((_, idx) => idx !== i);
                          setFormData({ ...formData, options: newOpts });
                        }} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.options.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, options: [...formData.options, ''] })}
                      className="text-sm text-primary-400 mt-1 font-medium hover:text-primary-300"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Active Duration (Days)</label>
                  <input
                    type="number" min="1" max="30"
                    value={formData.daysActive}
                    onChange={e => setFormData({ ...formData, daysActive: parseInt(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>

                {/* Anonymous Toggle */}
                <label className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-xl cursor-pointer hover:bg-dark-700 transition-colors">
                  <div
                    onClick={() => setFormData({ ...formData, isAnonymous: !formData.isAnonymous })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${formData.isAnonymous ? 'bg-amber-500' : 'bg-dark-600'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isAnonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" /> Anonymous Poll
                    </p>
                    <p className="text-xs text-slate-500">Admin will only see vote counts, not who voted for what</p>
                  </div>
                </label>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
                  <button type="submit" className="btn-primary">Create Poll</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Voters Modal */}
        {votersPoll && (
          <VotersModal poll={votersPoll} onClose={() => setVotersPoll(null)} />
        )}
      </div>
    </Layout>
  );
};

export default Polls;
