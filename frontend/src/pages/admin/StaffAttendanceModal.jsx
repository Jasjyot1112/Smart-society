import { useState, useEffect } from 'react';
import { X, Calendar, IndianRupee, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getStaffSalary } from '../../api/staffApi';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const StaffAttendanceModal = ({ staff, onClose }) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSalary = async () => {
    setLoading(true);
    try {
      const res = await getStaffSalary(staff._id, month, year);
      setData(res.data.data);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSalary(); }, [month, year]);

  const formatTime = (dt) => dt
    ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const formatHours = (h) => {
    if (typeof h === 'string' && isNaN(Number(h))) return h;
    const n = parseFloat(h);
    if (!n) return '—';
    const hrs = Math.floor(n);
    const mins = Math.round((n - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  // Build a full set of days in the month for the calendar
  const daysInMonth = new Date(year, month, 0).getDate();
  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    const record = data?.attendance?.find(a => {
      const ad = new Date(a.date);
      return ad.getDate() === i + 1 && ad.getMonth() === month - 1 && ad.getFullYear() === year;
    });
    return { day: i + 1, date: d, record };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f1117] border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-700 flex-shrink-0">
          <div>
            <h2 className="font-bold text-white text-lg">{staff.name} — Attendance</h2>
            <p className="text-slate-500 text-xs mt-0.5">{staff.staffId} · {staff.workArea}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-xl">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Month/Year Filter */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-dark-700 flex-shrink-0">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="bg-dark-800 text-white text-sm border border-dark-600 rounded-lg px-3 py-1.5"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="bg-dark-800 text-white text-sm border border-dark-600 rounded-lg px-3 py-1.5"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3,4].map(i => <div key={i} className="h-12 bg-dark-800 rounded-xl" />)}
            </div>
          ) : (
            <>
              {/* Salary Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{data?.workingDays ?? 0}</p>
                  <p className="text-xs text-slate-400 mt-1">Working Days</p>
                </div>
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary-400">₹{data?.dailySalary ?? 0}</p>
                  <p className="text-xs text-slate-400 mt-1">Per Day</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <IndianRupee className="w-5 h-5 text-amber-400" />
                    <p className="text-2xl font-bold text-amber-400">{data?.totalSalary ?? 0}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Total Salary</p>
                </div>
              </div>

              {/* Attendance Table */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Daily Attendance — {MONTHS[month - 1]} {year}
                </h3>
                <div className="rounded-xl border border-dark-700 overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-2 px-4 py-2.5 bg-dark-800 border-b border-dark-700 text-xs font-semibold text-slate-400 uppercase">
                    <span>Date</span>
                    <span>Day</span>
                    <span>Check In</span>
                    <span>Check Out</span>
                    <span>Hours</span>
                  </div>
                  {/* Rows */}
                  <div className="divide-y divide-dark-700/50 max-h-72 overflow-y-auto">
                    {allDays.map(({ day, date, record }) => {
                      const isSunday = date.getDay() === 0;
                      const isPresent = !!record?.checkIn;
                      const isFuture = date > new Date();
                      return (
                        <div
                          key={day}
                          className={`grid grid-cols-5 gap-2 px-4 py-2.5 items-center text-sm transition-colors
                            ${isSunday ? 'bg-slate-800/30 text-slate-500' : ''}
                            ${isPresent ? 'hover:bg-emerald-900/10' : 'hover:bg-dark-800/40'}
                          `}
                        >
                          <span className={`font-medium ${isPresent ? 'text-white' : isFuture ? 'text-slate-600' : isSunday ? 'text-slate-500' : 'text-red-400'}`}>
                            {String(day).padStart(2, '0')}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                            {isSunday && <span className="ml-1 text-slate-600">(Off)</span>}
                          </span>
                          <span className={`${isPresent ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {formatTime(record?.checkIn)}
                          </span>
                          <span className={`${record?.checkOut ? 'text-amber-400' : 'text-slate-600'}`}>
                            {formatTime(record?.checkOut)}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {record?.checkIn && record?.checkOut
                              ? formatHours(((new Date(record.checkOut) - new Date(record.checkIn)) / 3600000).toFixed(2))
                              : record?.checkIn ? <span className="text-emerald-500 text-xs">Inside</span>
                              : isFuture ? '' : isSunday ? '' : <XCircle className="w-4 h-4 text-red-500/40" />
                            }
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-amber-400" /> Salary Breakdown
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Daily Rate</span>
                    <span className="text-white font-medium">₹{data?.dailySalary ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Working Days in {MONTHS[month - 1]}</span>
                    <span className="text-emerald-400 font-medium">{data?.workingDays ?? 0} days</span>
                  </div>
                  <div className="border-t border-dark-600 pt-2 flex justify-between font-bold">
                    <span className="text-white">Total Salary</span>
                    <span className="text-amber-400 text-lg">₹{data?.totalSalary ?? 0}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffAttendanceModal;
