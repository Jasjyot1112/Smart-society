import { useEffect, useState } from 'react';
import { X, Users, UserX, Lock, MessageCircle, BarChart3, Loader2 } from 'lucide-react';
import { getPollVoters } from '../../api/pollApi';
import toast from 'react-hot-toast';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

const VotersModal = ({ poll, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPollVoters(poll._id);
        setData(res.data.data);
      } catch {
        toast.error('Failed to load voter details');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [poll._id]);

  const sendWhatsAppReminder = (resident) => {
    const endDate = new Date(poll.expiresAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const msg = encodeURIComponent(
      `Dear ${resident.name}, please vote on the poll "${data.pollTitle}" before ${endDate}. Login: ${FRONTEND_URL}`
    );
    const phone = resident.phone?.replace(/\D/g, '');
    if (!phone) return toast.error(`No phone number for ${resident.name}`);
    window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
  };

  const sendAllReminders = () => {
    if (!data?.notVoted?.length) return;
    const endDate = new Date(poll.expiresAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    data.notVoted.forEach((r, i) => {
      if (!r.phone) return;
      const msg = encodeURIComponent(
        `Dear ${r.name}, please vote on the poll "${data.pollTitle}" before ${endDate}. Login: ${FRONTEND_URL}`
      );
      const phone = r.phone.replace(/\D/g, '');
      setTimeout(() => window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank'), i * 300);
    });
  };

  // Flatten all voters across options for the "Who Voted For What" table
  const allVoterRows = data?.options?.flatMap(opt =>
    (opt.voters || []).map(v => ({ ...v, votedFor: opt.text }))
  ).sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt)) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f1117] border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-dark-700 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-white text-lg leading-tight truncate">{poll.question}</h2>
              {poll.isAnonymous && (
                <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
                  <Lock className="w-3 h-3" /> Anonymous
                </span>
              )}
            </div>
            {loading ? null : (
              <p className="text-slate-500 text-xs mt-1">{data?.totalVotes ?? 0} total votes</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-xl transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            // Skeleton
            <div className="p-6 space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-dark-800 rounded-xl" />
              ))}
              <div className="h-32 bg-dark-800 rounded-xl mt-6" />
            </div>
          ) : !data ? null : (
            <div className="p-5 space-y-6">

              {/* ── SECTION A: Results Summary ── */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Results Summary
                </h3>
                <div className="space-y-2">
                  {data.options.map((opt, i) => (
                    <div key={i} className="relative h-11 bg-dark-800 rounded-xl overflow-hidden border border-dark-700 flex items-center px-4 justify-between">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-primary-600/25 transition-all duration-700"
                        style={{ width: `${opt.percentage}%` }}
                      />
                      <span className="relative z-10 text-sm font-medium text-white">{opt.text}</span>
                      <span className="relative z-10 text-sm font-bold text-primary-400">
                        {opt.percentage}% ({opt.voteCount})
                      </span>
                    </div>
                  ))}
                  {data.totalVotes === 0 && (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      No votes yet. Send a reminder to residents.
                    </div>
                  )}
                </div>
              </div>

              {/* ── SECTION B: Who Voted For What ── */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Who Voted For What
                  {data.isAnonymous && (
                    <span className="ml-2 flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full normal-case tracking-normal font-normal">
                      <Lock className="w-3 h-3" /> Anonymous poll — voters are hidden from residents, but visible to you
                    </span>
                  )}
                </h3>
                {allVoterRows.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm bg-dark-800 rounded-xl">
                    No votes recorded yet. Send reminders to residents below.
                  </div>
                ) : (
                  <div className="rounded-xl border border-dark-700 overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-dark-800 border-b border-dark-700 text-xs font-semibold text-slate-400 uppercase">
                      <span>Resident</span>
                      <span>Flat</span>
                      <span>Voted For</span>
                      <span>Time</span>
                    </div>
                    {/* Table Rows */}
                    <div className="divide-y divide-dark-700/60">
                      {allVoterRows.map((row, i) => (
                        <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3 items-center hover:bg-dark-800/50 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-primary-600/20 flex items-center justify-center text-primary-400 text-xs font-bold flex-shrink-0">
                              {row.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-white font-medium truncate">{row.name}</span>
                          </div>
                          <span className="text-sm text-slate-400">{row.flatNumber}</span>
                          <span className="text-sm">
                            <span className="px-2 py-0.5 bg-primary-600/20 text-primary-300 rounded-md text-xs font-medium">
                              {row.votedFor}
                            </span>
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(row.votedAt).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── SECTION C: Haven't Voted Yet ── */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserX className="w-4 h-4" />
                  Haven't Voted Yet
                  <span className="ml-auto font-normal text-slate-500 normal-case tracking-normal">
                    {data.notVoted.length} resident{data.notVoted.length !== 1 ? 's' : ''}
                  </span>
                </h3>

                {data.notVoted.length === 0 ? (
                  <div className="text-center py-6 text-emerald-400 text-sm bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    🎉 All residents have voted!
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5 mb-4">
                      {data.notVoted.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-dark-800 rounded-xl border border-dark-700 hover:border-dark-600 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold flex-shrink-0">
                              {r.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{r.name}</p>
                              <p className="text-xs text-slate-500">{r.flatNumber}</p>
                            </div>
                          </div>
                          {r.phone && (
                            <button
                              onClick={() => sendWhatsAppReminder(r)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-medium transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Remind
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Bulk Reminder Button */}
                    <button
                      onClick={sendAllReminders}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-semibold rounded-xl transition-colors text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Send WhatsApp Reminder to All ({data.notVoted.length})
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotersModal;
