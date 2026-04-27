import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { getEvents, createEvent, rsvpEvent, deleteEvent } from '../../api/communityApi';
import { useAuth } from '../../context/AuthContext';
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, Check, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState('upcoming');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', time: '', location: '' });

  useEffect(() => {
    fetchEvents();
  }, [timeline]);

  const fetchEvents = async () => {
    try {
      const res = await getEvents({ timeline });
      setEvents(res.data.data);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createEvent(formData);
      toast.success('Event planned successfully!');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', date: '', time: '', location: '' });
      fetchEvents();
    } catch {
      toast.error('Failed to create event');
    }
  };

  const handleRSVP = async (eventId, isGoing) => {
    try {
      await rsvpEvent(eventId, isGoing);
      toast.success(isGoing ? 'RSVP Confirmed!' : 'RSVP Cancelled');
      fetchEvents();
    } catch {
      toast.error('Failed to update RSVP');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteEvent(id);
      toast.success('Event deleted');
      fetchEvents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <Layout title="Events">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="section-title">Community Events</h1>
          <p className="section-subtitle">Connect with your neighbours</p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Plan Event
          </button>
        )}
      </div>

      <div className="flex bg-dark-800 p-1 w-fit rounded-xl mb-6">
        <button onClick={() => setTimeline('upcoming')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${timeline === 'upcoming' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}>Upcoming</button>
        <button onClick={() => setTimeline('past')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${timeline === 'past' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}>Past Events</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-dark-800 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <CalendarIcon className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white">No {timeline} events</h3>
          <p className="text-slate-400">Check back later for community updates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map(event => {
            const isGoing = event.attendees.includes(user._id);
            const eventDate = new Date(event.date);
            const isPast = eventDate < new Date().setHours(0,0,0,0);

            return (
              <div key={event._id} className="glass-card flex flex-col sm:flex-row overflow-hidden relative">
                {/* Date Badge */}
                <div className="bg-primary-600 p-4 sm:w-28 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-white">{eventDate.getDate()}</span>
                  <span className="text-sm font-semibold text-primary-200 uppercase">{eventDate.toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-xs text-primary-300">{eventDate.getFullYear()}</span>
                </div>
                
                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white">{event.title}</h3>
                    {user.role === 'admin' && (
                      <button onClick={() => handleDelete(event._id)} className="text-slate-500 hover:text-red-400 ml-2">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Clock className="w-4 h-4 text-primary-400" /> {event.time}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin className="w-4 h-4 text-primary-400" /> {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Users className="w-4 h-4 text-primary-400" /> {event.attendees.length} attending
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-dark-700 flex items-center justify-between">
                    <span className="text-sm text-slate-500">{isPast ? 'Event has ended' : 'Are you going?'}</span>
                    {!isPast && (
                      <div className="flex gap-2">
                        {isGoing ? (
                          <button onClick={() => handleRSVP(event._id, false)} className="btn-secondary py-1.5 px-4 text-sm flex items-center gap-1 border-primary-500/50 text-white bg-primary-600/20">
                            <Check className="w-4 h-4 text-primary-500" /> Going
                          </button>
                        ) : (
                          <button onClick={() => handleRSVP(event._id, true)} className="btn-primary py-1.5 px-4 text-sm">
                            Join Event
                          </button>
                        )}
                      </div>
                    )}
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
            <div className="p-6 border-b border-dark-700"><h2 className="text-xl font-bold text-white">Plan Event</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Event Title</label>
                <input required type="text" className="input-field w-full" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Date</label>
                  <input required type="date" min={new Date().toISOString().split('T')[0]} className="input-field w-full" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Time</label>
                  <input required type="time" className="input-field w-full" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Location / Venue</label>
                <input required type="text" className="input-field w-full" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea required className="input-field w-full h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
