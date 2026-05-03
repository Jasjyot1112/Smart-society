import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { getStaffList, addStaff, deactivateStaff } from '../../api/staffApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StaffQRModal from './StaffQRModal';
import StaffAttendanceModal from './StaffAttendanceModal';
import toast from 'react-hot-toast';
import {
  Plus, User, Phone, MapPin, IndianRupee, QrCode,
  Calendar, Trash2, CheckCircle2, XCircle, Users, X
} from 'lucide-react';

const ROLES = [
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'gardener', label: 'Gardener' },
  { value: 'sweeper', label: 'Sweeper' },
  { value: 'security_guard', label: 'Security Guard' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'lift_operator', label: 'Lift Operator' },
  { value: 'garbage_collector', label: 'Garbage Collector' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'other', label: 'Other' },
];

const ROLE_COLORS = {
  cleaner: 'bg-sky-500/10 text-sky-400',
  gardener: 'bg-emerald-500/10 text-emerald-400',
  sweeper: 'bg-amber-500/10 text-amber-400',
  security_guard: 'bg-red-500/10 text-red-400',
  maintenance: 'bg-orange-500/10 text-orange-400',
  lift_operator: 'bg-violet-500/10 text-violet-400',
  garbage_collector: 'bg-slate-500/10 text-slate-400',
  housekeeping: 'bg-pink-500/10 text-pink-400',
  plumber: 'bg-cyan-500/10 text-cyan-400',
  electrician: 'bg-yellow-500/10 text-yellow-400',
  other: 'bg-gray-500/10 text-gray-400',
};

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [qrStaff, setQrStaff] = useState(null);
  const [attendanceStaff, setAttendanceStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'inside'
  const [formData, setFormData] = useState({
    name: '', role: 'cleaner', phone: '',
    workArea: '', dailySalary: '', joiningDate: ''
  });

  const fetchStaff = async () => {
    try {
      const res = await getStaffList();
      setStaff(res.data.data);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addStaff({
        ...formData,
        dailySalary: Number(formData.dailySalary) || 0,
      });
      toast.success('Staff added! QR ID card generated ✅');
      setShowModal(false);
      setFormData({ name: '', role: 'cleaner', phone: '', workArea: '', dailySalary: '', joiningDate: '' });
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Remove ${name} from society staff?`)) return;
    try {
      await deactivateStaff(id);
      toast.success(`${name} removed`);
      fetchStaff();
    } catch {
      toast.error('Failed to remove staff');
    }
  };

  const displayStaff = activeTab === 'inside'
    ? staff.filter(s => s.status === 'inside')
    : staff;

  const insideCount = staff.filter(s => s.status === 'inside').length;

  return (
    <Layout title="Staff Management">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="section-title">Society Staff</h1>
            <p className="section-subtitle">Cleaners, gardeners & utility workers — QR attendance tracking</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Staff
          </button>
        </div>

        {/* Stats Row */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4 text-center">
              <p className="text-3xl font-bold text-white">{staff.length}</p>
              <p className="text-xs text-slate-400 mt-1">Total Staff</p>
            </div>
            <div className="glass-card p-4 text-center border-l-2 border-l-emerald-500">
              <p className="text-3xl font-bold text-emerald-400">{insideCount}</p>
              <p className="text-xs text-slate-400 mt-1">Currently Inside</p>
            </div>
            <div className="glass-card p-4 text-center border-l-2 border-l-slate-600">
              <p className="text-3xl font-bold text-slate-400">{staff.length - insideCount}</p>
              <p className="text-xs text-slate-400 mt-1">Outside</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-800 p-1 rounded-xl w-fit">
          {[['all', 'All Staff'], ['inside', `Currently Inside (${insideCount})`]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Staff Grid */}
        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayStaff.map(s => {
              const todayAttendance = s.attendance?.find(a => {
                const d = new Date(a.date);
                const today = new Date();
                return d.getDate() === today.getDate() &&
                  d.getMonth() === today.getMonth() &&
                  d.getFullYear() === today.getFullYear();
              });

              return (
                <div key={s._id} className="glass-card p-5 hover:border-primary-500/40 transition-all relative group">
                  {/* Status dot */}
                  <div className={`absolute top-4 right-4 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.status === 'inside' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'inside' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    {s.status === 'inside' ? 'Inside' : 'Outside'}
                  </div>

                  {/* Staff Info */}
                  <div className="flex items-start gap-3 mb-4 pr-16">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center text-lg font-bold flex-shrink-0">
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base truncate">{s.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[s.role] || 'bg-gray-500/10 text-gray-400'}`}>
                        {ROLES.find(r => r.value === s.role)?.label || s.role}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{s.phone}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{s.workArea || 'General'}</div>
                    <div className="flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5" />₹{s.dailySalary}/day</div>
                    <div className="flex items-center gap-2 font-mono text-xs text-primary-400">
                      <QrCode className="w-3.5 h-3.5" />{s.staffId}
                    </div>
                  </div>

                  {/* Today's attendance */}
                  {todayAttendance?.checkIn && (
                    <div className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In: {new Date(todayAttendance.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {todayAttendance?.checkOut && (
                        <span className="ml-auto text-amber-400">
                          Out: {new Date(todayAttendance.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setQrStaff(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-primary-600/15 hover:bg-primary-600/25 text-primary-400 rounded-lg transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" /> ID Card
                    </button>
                    <button
                      onClick={() => setAttendanceStaff(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Attendance
                    </button>
                    <button
                      onClick={() => handleDeactivate(s._id, s.name)}
                      className="py-2 px-2.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {displayStaff.length === 0 && (
              <div className="col-span-full text-center p-12 glass-card">
                <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">
                  {activeTab === 'inside' ? 'No staff currently inside the premises.' : 'No society staff registered yet.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Staff Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-dark-800 rounded-2xl w-full max-w-md p-6 border border-dark-600 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">Add Society Staff</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-dark-700 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 bg-primary-500/10 p-3 rounded-xl">
                A unique Staff ID and printable QR code will be auto-generated for this member.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field w-full" placeholder="e.g. Ramesh Kumar" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Role *</label>
                  <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="input-field w-full">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number *</label>
                  <input type="text" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input-field w-full" placeholder="e.g. 9876543210" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Work Area</label>
                  <input type="text" value={formData.workArea} onChange={e => setFormData({ ...formData, workArea: e.target.value })} className="input-field w-full" placeholder="e.g. Garden, Club House, Floors 1-5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Daily Salary (₹)</label>
                  <input type="number" min="0" value={formData.dailySalary} onChange={e => setFormData({ ...formData, dailySalary: e.target.value })} className="input-field w-full" placeholder="e.g. 500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Joining Date</label>
                  <input type="date" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} className="input-field w-full" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
                  <button type="submit" className="btn-primary">Add Staff & Generate QR</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modals */}
        {qrStaff && <StaffQRModal staff={qrStaff} onClose={() => setQrStaff(null)} />}
        {attendanceStaff && <StaffAttendanceModal staff={attendanceStaff} onClose={() => setAttendanceStaff(null)} />}
      </div>
    </Layout>
  );
};

export default AdminStaff;
