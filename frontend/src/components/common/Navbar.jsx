import NotificationBell from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Wifi, WifiOff } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user } = useAuth();
  const { connected } = useSocket();

  return (
    <header className="h-16 bg-dark-800/90 backdrop-blur-sm border-b border-dark-700/50 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30">
      <div className="lg:block hidden">
        <h1 className="text-lg font-bold text-white">{title || 'Smart Society ERP'}</h1>
      </div>
      {/* Spacer on mobile (sidebar menu button takes left side) */}
      <div className="lg:hidden w-10" />

      <div className="flex items-center gap-3">
        {/* Socket connection indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          {connected ? (
            <><Wifi className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400 hidden sm:block">Live</span></>
          ) : (
            <><WifiOff className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-500 hidden sm:block">Offline</span></>
          )}
        </div>

        <NotificationBell />

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-3 border-l border-dark-700">
          <div className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-600/30 flex items-center justify-center text-primary-400 font-bold text-xs">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
