import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { markAllRead, getNotifications } from '../../api/notificationApi';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const { notifications, setNotifications, clearAllNotifications } = useSocket();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [dbNotifs, setDbNotifs] = useState([]);
  const ref = useRef(null);
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.isRead).length + dbNotifs.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (user) {
      getNotifications({ limit: 15 }).then((res) => setDbNotifs(res.data.data || [])).catch(() => {});
    }
  }, [user, open]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setDbNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      clearAllNotifications();
    } catch {}
  };

  const handleNotifClick = (notif) => {
    if (notif.link) navigate(notif.link);
    setOpen(false);
  };

  const allNotifs = [...notifications, ...dbNotifs].slice(0, 20);

  const typeIcon = {
    visitor_request: '🚪',
    visitor_approved: '✅',
    visitor_denied: '❌',
    booking_confirmed: '📅',
    booking_cancelled: '🚫',
    complaint_update: '📋',
    payment_due: '💰',
    payment_success: '✅',
    general: '🔔',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        id="notification-bell"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-dark-700 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center notification-dot">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 glass-card shadow-2xl z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-dark-700 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {allNotifs.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              allNotifs.map((notif, i) => (
                <div
                  key={notif._id || i}
                  onClick={() => handleNotifClick(notif)}
                  className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-dark-700/40 transition-colors border-b border-dark-700/30 last:border-0 ${!notif.isRead ? 'bg-primary-900/10' : ''}`}
                >
                  <span className="text-lg flex-shrink-0">{typeIcon[notif.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
