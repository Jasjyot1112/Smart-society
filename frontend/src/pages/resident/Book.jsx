import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getFacilities, getCalendarData, createBooking, getSlotSuggestions } from '../../api/bookingApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { CalendarDays, ChevronLeft, ChevronRight, Lightbulb, CheckCircle2, Clock } from 'lucide-react';

const facilityIcons = { turf: '⚽', table_tennis: '🏓', lawn: '🌿', event_hall: '🎪', swimming_pool: '🏊', gym: '💪', other: '🏢' };

const ResidentBook = () => {
  const [step, setStep] = useState(1); // 1: select facility, 2: pick date+slot, 3: confirm
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [waitlistPrompt, setWaitlistPrompt] = useState(null);

  useEffect(() => {
    getFacilities().then(res => setFacilities(res.data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedFacility && selectedDate) {
      Promise.all([
        getCalendarData(selectedFacility._id, selectedDate),
        getSlotSuggestions(selectedFacility._id, selectedDate),
      ]).then(([calRes, sugRes]) => {
        setBookedSlots(calRes.data.data.map(b => ({ startTime: b.slot.startTime, status: b.status, waitlistCount: b.waitlistCount })));
        setSuggestions(sugRes.data.data || []);
        setSelectedSlots([]);
        setWaitlistPrompt(null);
      });
    }
  }, [selectedFacility, selectedDate]);

  const handleSlotToggle = (slot) => {
    setWaitlistPrompt(null);
    if (selectedSlots.some(s => s.startTime === slot.startTime)) {
      setSelectedSlots(selectedSlots.filter(s => s.startTime !== slot.startTime));
    } else {
      setSelectedSlots([...selectedSlots, slot].sort((a,b) => a.startTime.localeCompare(b.startTime)));
    }
  };

  const handleBook = async (joinWaitlist = false) => {
    if (selectedSlots.length === 0) return toast.error('Please select at least one slot');
    setBooking(true);
    setWaitlistPrompt(null);
    
    let successCount = 0;
    let waitlistCount = 0;
    let errors = [];

    for (const slot of selectedSlots) {
      try {
        const res = await createBooking({ facilityId: selectedFacility._id, date: selectedDate, slot, joinWaitlist });
        if (res.data.waitlisted) waitlistCount++;
        else successCount++;
      } catch (err) {
        if (err.response?.status === 409 && err.response?.data?.waitlistAvailable) {
          setWaitlistPrompt({
            message: err.response.data.message,
            length: err.response.data.currentWaitlistLength || 0,
          });
          errors.push(slot.label || slot.startTime);
        } else {
          errors.push(slot.label || slot.startTime);
        }
      }
    }

    setBooking(false);

    if (errors.length > 0) {
      if (waitlistPrompt) {
        toast.error(`Slot taken. You can join the waitlist for the remaining ${errors.length} slots.`, { icon: '⚠️' });
        setSelectedSlots(selectedSlots.filter(s => errors.includes(s.label || s.startTime))); // keep failed slots selected so they can waitlist them
        return; // Don't reset step
      } else {
        toast.error(`Failed to book ${errors.length} slots.`);
      }
    }

    if (successCount > 0) toast.success(`🎉 ${successCount} slots confirmed!`);
    if (waitlistCount > 0) toast.success(`📋 Joined waitlist for ${waitlistCount} slots!`);

    if (errors.length === 0) {
      setStep(1);
      setSelectedFacility(null);
      setSelectedSlots([]);
    }
  };

  const handleDateChange = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    const today = new Date(); today.setHours(0,0,0,0);
    if (d < today) return;
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  if (loading) return <Layout title="Book Facility"><LoadingSpinner /></Layout>;

  return (
    <Layout title="Book Facility">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="section-title">Book a Facility</h1>
          <p className="section-subtitle">Browse and reserve society facilities</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {['Select Facility', 'Choose Date & Slot', 'Confirm'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > i+1 ? 'bg-emerald-500 text-white' : step === i+1 ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-500'}`}>
                {step > i+1 ? '✓' : i+1}
              </div>
              <span className={`text-sm ${step === i+1 ? 'text-white font-medium' : 'text-slate-500'} hidden sm:block`}>{s}</span>
              {i < 2 && <div className={`h-px w-8 sm:w-16 ${step > i+1 ? 'bg-emerald-500' : 'bg-dark-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Facility Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.length === 0 ? (
              <div className="col-span-full text-center py-16 glass-card">
                <div className="text-5xl mb-4 opacity-50">🏟️</div>
                <h3 className="text-xl font-bold text-white mb-2">No Facilities Available</h3>
                <p className="text-slate-400">Your society hasn't added any bookable facilities yet.</p>
              </div>
            ) : (
              facilities.map((f) => (
                <button key={f._id} onClick={() => { setSelectedFacility(f); setStep(2); }}
                  className="glass-card p-6 text-left hover:border-primary-600/50 hover:scale-[1.02] transition-all duration-200 group">
                  <div className="text-4xl mb-3">{facilityIcons[f.type] || '🏢'}</div>
                  <h3 className="font-bold text-white group-hover:text-primary-300 transition-colors">{f.name}</h3>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">{f.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-primary-400 text-sm font-medium">
                      {f.pricePerSlot > 0 ? `₹${f.pricePerSlot}/slot` : 'Free'}
                    </span>
                    <span className="text-xs text-slate-500">Max {f.maxBookingsPerWeek}/week</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-500">
                      {f.availableToday !== undefined ? `${f.availableToday} slots available today` : `${f.slots?.length} slots per day`}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Date & Slot */}
        {step === 2 && selectedFacility && (
          <div className="space-y-6">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" /> Back to facilities
            </button>

            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">{facilityIcons[selectedFacility.type] || '🏢'}</div>
                <div>
                  <h3 className="font-bold text-white text-xl">{selectedFacility.name}</h3>
                  <p className="text-slate-400 text-sm">{selectedFacility.location}</p>
                </div>
              </div>

              {/* Date Picker */}
              <div className="mb-6">
                <label className="text-sm text-slate-400 mb-2 block">Select Date</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => handleDateChange(-1)} className="p-2 rounded-xl bg-dark-700 hover:bg-dark-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                  <div className="text-center flex-1">
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-field text-center" />
                  </div>
                  <button onClick={() => handleDateChange(1)} className="p-2 rounded-xl bg-dark-700 hover:bg-dark-600 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Smart Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-4 p-3 bg-primary-900/20 border border-primary-700/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-primary-400" />
                    <span className="text-sm text-primary-300 font-medium">Smart Suggestions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => {
                      const isSelected = selectedSlots.some(slot => slot.startTime === s.startTime);
                      return (
                        <button key={s.startTime} onClick={() => handleSlotToggle(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isSelected ? 'bg-primary-600 text-white' : 'bg-primary-800/30 text-primary-300 hover:bg-primary-700/40'}`}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Slots */}
              <div>
                <label className="text-sm text-slate-400 mb-3 block">Available Time Slots</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedFacility.slots?.map((s) => {
                    const bookedInfo = bookedSlots.find(b => b.startTime === s.startTime);
                    const isBooked = !!bookedInfo;
                    const isSelected = selectedSlots.some(slot => slot.startTime === s.startTime);
                    return (
                      <button key={s.startTime} onClick={() => handleSlotToggle(s)}
                        className={`p-3 rounded-xl text-sm font-medium transition-all relative ${isBooked ? (isSelected ? 'bg-amber-600 border border-amber-500 shadow-lg text-white' : 'bg-dark-900/40 text-slate-500 border border-dark-700/30 hover:border-amber-600/40') : isSelected ? 'bg-primary-600 text-white border border-primary-500 shadow-lg shadow-primary-900/30' : 'bg-dark-900/60 text-slate-300 border border-dark-700/50 hover:border-primary-600/40 hover:text-white'}`}>
                        {isBooked && <span className="text-[10px] block text-amber-500 mb-0.5 uppercase tracking-wide">Booked</span>}
                        {s.label || `${s.startTime}–${s.endTime}`}
                        {isBooked && bookedInfo.waitlistCount > 0 && (
                           <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{bookedInfo.waitlistCount} waiting</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-slate-400">
                  {selectedSlots.length} slot(s) selected
                </div>
                <button disabled={selectedSlots.length === 0} onClick={() => setStep(3)} className="btn-primary">
                  Continue to Confirm ({selectedSlots.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedFacility && selectedSlots.length > 0 && (
          <div className="space-y-4">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" /> Change slots
            </button>
            <div className="glass-card p-8 text-center max-w-md mx-auto">
              <div className="text-5xl mb-4">{facilityIcons[selectedFacility.type]}</div>
              <h3 className="text-2xl font-bold text-white mb-6">Confirm {selectedSlots.length > 1 ? 'Multiple Bookings' : 'Booking'}</h3>
              <div className="space-y-3 text-left mb-8">
                {[
                  ['Facility', selectedFacility.name],
                  ['Date', new Date(selectedDate).toDateString()],
                  ['Slots Selected', selectedSlots.length > 3 ? `${selectedSlots.length} slots` : selectedSlots.map(s => s.label || `${s.startTime}–${s.endTime}`).join(', ')],
                  ['Total Price', selectedFacility.pricePerSlot > 0 ? `₹${selectedFacility.pricePerSlot * selectedSlots.length}` : 'Free'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-2 border-b border-dark-700/50">
                    <span className="text-slate-400 text-sm">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {waitlistPrompt ? (
                  <button onClick={() => handleBook(true)} disabled={booking} className="btn-primary flex-1 flex items-center justify-center gap-2 bg-amber-600 border-amber-500 shadow-amber-900/30 hover:bg-amber-500">
                    {booking ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" /> : <Clock className="w-4 h-4" />}
                    {booking ? 'Joining...' : `Join Waitlist (${waitlistPrompt.length} waiting)`}
                  </button>
                ) : (
                  <button onClick={() => handleBook(false)} disabled={booking} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {booking ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" /> : <CheckCircle2 className="w-4 h-4" />}
                    {booking ? 'Booking...' : 'Confirm Booking'}
                  </button>
                )}
                <button onClick={() => setStep(1)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResidentBook;
