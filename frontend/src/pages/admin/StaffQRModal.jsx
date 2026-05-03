import { useRef } from 'react';
import { X, Printer, Building2 } from 'lucide-react';

const ROLE_LABELS = {
  cleaner: 'Cleaner', gardener: 'Gardener', sweeper: 'Sweeper',
  security_guard: 'Security Guard', maintenance: 'Maintenance',
  lift_operator: 'Lift Operator', garbage_collector: 'Garbage Collector',
  housekeeping: 'Housekeeping', plumber: 'Plumber', electrician: 'Electrician', other: 'Other'
};

const StaffQRModal = ({ staff, onClose }) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`
      <html>
        <head>
          <title>Staff ID Card — ${staff.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .card { width: 320px; border: 2px solid #6366f1; border-radius: 16px; overflow: hidden; }
            .card-header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; text-align: center; color: white; }
            .card-header h2 { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
            .card-header p { font-size: 11px; opacity: 0.8; margin-top: 4px; }
            .card-body { padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; background: #f9fafb; }
            .avatar { width: 64px; height: 64px; background: #e0e7ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; color: #6366f1; border: 3px solid #6366f1; }
            .name { font-size: 20px; font-weight: bold; color: #1f2937; }
            .role { font-size: 13px; color: #6366f1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .area { font-size: 12px; color: #6b7280; margin-top: 2px; }
            .qr-img { width: 160px; height: 160px; border: 4px solid #e5e7eb; border-radius: 12px; padding: 4px; background: white; }
            .staff-id { font-size: 14px; font-weight: bold; color: #374151; letter-spacing: 2px; font-family: monospace; background: #e0e7ff; padding: 6px 16px; border-radius: 20px; }
            .footer { text-align: center; padding: 12px; background: #6366f1; color: white; font-size: 11px; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const joining = staff.joiningDate
    ? new Date(staff.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-dark-800 rounded-2xl w-full max-w-sm border border-dark-600 shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="font-bold text-white">Staff ID Card</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" /> Print ID Card
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-dark-700 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Printable Card */}
        <div className="p-5">
          <div ref={printRef}>
            <div className="card" style={{ width: '100%', border: '2px solid #6366f1', borderRadius: '16px', overflow: 'hidden' }}>
              {/* Card Header */}
              <div className="card-header" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '16px', textAlign: 'center', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Building2 style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px' }}>SMART SOCIETY ERP</span>
                </div>
                <p style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>Society Staff Identity Card</p>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', background: '#f9fafb' }}>
                {/* Avatar */}
                <div style={{ width: '64px', height: '64px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 'bold', color: '#6366f1', border: '3px solid #6366f1' }}>
                  {staff.name?.charAt(0).toUpperCase()}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{staff.name}</div>
                  <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                    {ROLE_LABELS[staff.role] || staff.role}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    📍 {staff.workArea || 'General'}
                  </div>
                </div>

                {/* QR Code */}
                {staff.qrCode ? (
                  <img
                    src={staff.qrCode}
                    alt={`QR for ${staff.staffId}`}
                    style={{ width: '150px', height: '150px', border: '4px solid #e5e7eb', borderRadius: '12px', padding: '4px', background: 'white' }}
                  />
                ) : (
                  <div style={{ width: '150px', height: '150px', background: '#e5e7eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#6b7280' }}>
                    QR unavailable
                  </div>
                )}

                {/* Staff ID */}
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', letterSpacing: '2px', fontFamily: 'monospace', background: '#e0e7ff', padding: '6px 16px', borderRadius: '20px' }}>
                  {staff.staffId}
                </div>

                <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
                  📞 {staff.phone} &nbsp;|&nbsp; Joined: {joining}
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ textAlign: 'center', padding: '10px', background: '#6366f1', color: 'white', fontSize: '10px' }}>
                Scan QR at gate entry for attendance
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffQRModal;
