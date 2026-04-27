import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user || !token) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', user._id);
    });

    socket.on('disconnect', () => setConnected(false));

    // Listen for real-time notifications
    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // Visitor events
    socket.on('visitorRequest', (data) => {
      setNotifications((prev) => [{
        _id: Date.now(),
        title: '🚪 Visitor at Gate',
        message: `${data.visitorName} is at the gate`,
        type: 'visitor_request',
        isRead: false,
        createdAt: new Date(),
        extra: data,
      }, ...prev]);
    });

    socket.on('visitorApproved', (data) => {
      setNotifications((prev) => [{
        _id: Date.now(),
        title: '✅ Visitor Approved',
        message: `Entry approved for ${data.visitorName}`,
        type: 'visitor_approved',
        isRead: false,
        createdAt: new Date(),
      }, ...prev]);
    });

    socket.on('visitorDenied', (data) => {
      setNotifications((prev) => [{
        _id: Date.now(),
        title: '❌ Visitor Denied',
        message: `Entry denied for ${data.visitorName}`,
        type: 'visitor_denied',
        isRead: false,
        createdAt: new Date(),
      }, ...prev]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user, token]);

  const joinFacilityRoom = (facilityId) => {
    socketRef.current?.emit('joinFacility', facilityId);
  };

  const leaveFacilityRoom = (facilityId) => {
    socketRef.current?.emit('leaveFacility', facilityId);
  };

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const clearAllNotifications = () => setNotifications([]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      notifications,
      setNotifications,
      clearNotification,
      clearAllNotifications,
      joinFacilityRoom,
      leaveFacilityRoom,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};

export default SocketContext;
