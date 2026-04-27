import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { getAllBookings, cancelBooking } from '../../api/bookingApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { CalendarDays, XCircle, RefreshCw } from 'lucide-react';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getAllBookings({ limit: 50 });
      setBookings(res.data.data);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await cancelBooking(id, { reason: 'Cancelled by admin' });
      toast.success('Booking cancelled');
      fetchBookings();
    } catch { toast.error('Failed to cancel'); }
  };

  return (
    <Layout title="Booking Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">Facility Bookings</h1>
            <p className="section-subtitle">All facility booking records</p>
          </div>
          <button onClick={fetchBookings} className="btn-secondary flex items-center gap-2 text-sm py-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Facility</th><th>Resident</th><th>Date</th><th>Slot</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-primary-400" />
                          <span className="font-medium text-white">{b.facility?.name}</span>
                        </div>
                      </td>
                      <td><p className="font-medium">{b.user?.name}</p><p className="text-xs text-slate-500">{b.user?.wing}-{b.user?.flatNumber}</p></td>
                      <td className="text-sm">{new Date(b.date).toLocaleDateString()}</td>
                      <td className="text-sm">{b.slot?.label || `${b.slot?.startTime}–${b.slot?.endTime}`}</td>
                      <td><span className={`badge status-${b.status}`}>{b.status}</span></td>
                      <td>
                        {b.status === 'confirmed' && (
                          <button onClick={() => handleCancel(b._id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 py-1 px-3 rounded-lg bg-red-900/20 hover:bg-red-900/30 transition-colors">
                            <XCircle className="w-3 h-3" /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && <tr><td colSpan="6" className="text-center py-12 text-slate-500">No bookings found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminBookings;
