import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { getStaffList, markAttendance, getStaffByQRId } from '../../api/staffApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { User, LogIn, LogOut, Search, QrCode, Clock, MapPin } from 'lucide-react';

const ROLE_LABELS = {
  cleaner: 'Cleaner', gardener: 'Gardener', sweeper: 'Sweeper',
  security_guard: 'Security Guard', maintenance: 'Maintenance',
  lift_operator: 'Lift Operator', garbage_collector: 'Garbage Collector',
  housekeeping: 'Housekeeping', plumber: 'Plumber', electrician: 'Electrician', other: 'Other'
};

const SecurityStaffEntry = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [qrInput, setQrInput] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await getStaffList();
      setStaff(res.data.data);
    } catch {
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleAttendance = async (id, currentStatus, name) => {
    setProcessingId(id);
    try {
      const res = await markAttendance(id);
      const action = res.data.action;
      if (action === 'check_in') {
        toast.success(`✅ ${name} — Checked IN`);
      } else {
        toast.success(`🚪 ${name} — Checked OUT`);
      }
      fetchStaff();
    } catch {
      toast.error('Failed to update attendance');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle QR / Staff ID lookup
  const handleQRScan = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setQrLoading(true);
    try {
      const res = await getStaffByQRId(qrInput.trim());
      const s = res.data.data;
      // Auto mark attendance
      await handleAttendance(s._id, s.status, s.name);
      setQrInput('');
      toast.success(`QR scanned: ${s.name} (${s.staffId})`);
    } catch {
      toast.error('Staff ID not found. Check the QR code.');
    } finally {
      setQrLoading(false);
    }
  };

  const filteredStaff = staff.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ROLE_LABELS[s.role] || s.role)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm) ||
    s.staffId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTodayAttendance = (s) => {
    return s.attendance?.find(a => {
      const d = new Date(a.date);
      const today = new Date();
      return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    });
  };

  return (
    <Layout title="Staff Entry">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="section-title">Staff Attendance</h1>
          <p className="section-subtitle">Scan QR or search to mark daily check-in & check-out</p>
        </div>

        {/* QR / Staff ID Quick Entry */}
        <div className="glass-card p-5 border-l-4 border-l-primary-500">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="w-5 h-5 text-primary-400" />
            <h3 className="font-semibold text-white">Quick Entry via QR / Staff ID</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Scan the staff member's QR card with a barcode scanner — it will auto-fill below. Or type the Staff ID manually (e.g. <code className="text-primary-400">SS-2026-001</code>).
          </p>
          <form onSubmit={handleQRScan} className="flex gap-3">
            <input
              type="text"
              value={qrInput}
              onChange={e => setQrInput(e.target.value)}
              className="input-field flex-1 font-mono"
              placeholder="Scan QR or type SS-2026-001..."
              autoFocus
            />
            <button
              type="submit"
              disabled={qrLoading || !qrInput.trim()}
              className="btn-primary px-5 disabled:opacity-50"
            >
              {qrLoading ? '...' : 'Mark'}
            </button>
          </form>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, role, phone, or staff ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field w-full pl-12 py-3 bg-dark-800"
          />
        </div>

        {/* Staff List */}
        {loading ? <LoadingSpinner /> : (
          <div className="grid gap-3">
            {filteredStaff.map(s => {
              const todayRecord = getTodayAttendance(s);
              const isInside = s.status === 'inside';
              const checkInTime = todayRecord?.checkIn
                ? new Date(todayRecord.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : null;
              const checkOutTime = todayRecord?.checkOut
                ? new Date(todayRecord.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : null;

              return (
                <div key={s._id} className="glass-card p-4 flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar + status ring */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 border-2 transition-all ${isInside ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-600 bg-dark-700 text-slate-400'}`}>
                    {s.name?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                      <h3 className="font-bold text-white text-base">{s.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isInside ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {isInside ? '● INSIDE' : '○ OUTSIDE'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 capitalize mt-0.5">
                      {ROLE_LABELS[s.role] || s.role}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 justify-center sm:justify-start flex-wrap">
                      <span className="text-xs text-primary-400 font-mono bg-primary-500/10 px-2 py-0.5 rounded-md">
                        {s.staffId}
                      </span>
                      {s.workArea && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {s.workArea}
                        </span>
                      )}
                    </div>
                    {/* Today's times */}
                    {(checkInTime || checkOutTime) && (
                      <div className="flex items-center gap-3 mt-1.5 text-xs justify-center sm:justify-start">
                        {checkInTime && (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> In: {checkInTime}
                          </span>
                        )}
                        {checkOutTime && (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Out: {checkOutTime}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => handleAttendance(s._id, s.status, s.name)}
                      disabled={processingId === s._id}
                      className={`w-full sm:w-36 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                        isInside
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {processingId === s._id
                        ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        : isInside
                          ? <><LogOut className="w-4 h-4" /> Check Out</>
                          : <><LogIn className="w-4 h-4" /> Check In</>
                      }
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredStaff.length === 0 && (
              <div className="text-center p-10 text-slate-500 glass-card">
                {searchTerm ? 'No staff found matching your search.' : 'No society staff registered yet.'}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SecurityStaffEntry;
