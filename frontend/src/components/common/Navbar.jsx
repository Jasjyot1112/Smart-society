import { useState, useRef, useEffect } from 'react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Wifi, WifiOff, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const languages = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'mr', label: 'मराठी', short: 'म' },
  { code: 'hi', label: 'हिंदी', short: 'हि' },
];

const Navbar = ({ title }) => {
  const { user, setUser } = useAuth();
  const { connected } = useSocket();
  const { i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = async (langCode) => {
    setLangOpen(false);
    i18n.changeLanguage(langCode);
    
    if (user) {
      try {
        await API.patch('/auth/language', { language: langCode });
        setUser({ ...user, preferredLanguage: langCode });
        // Update user in localStorage
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          localStorage.setItem('user', JSON.stringify({ ...storedUser, preferredLanguage: langCode }));
        }
      } catch (err) {
        toast.error('Failed to save language preference.');
      }
    }
  };

  return (
    <header className="h-16 bg-dark-800/90 backdrop-blur-sm border-b border-dark-700/50 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30">
      <div className="lg:block hidden">
        <h1 className="text-lg font-bold text-white">{title || 'Smart Society ERP'}</h1>
      </div>
      {/* Spacer on mobile (sidebar menu button takes left side) */}
      <div className="lg:hidden w-10" />

      <div className="flex items-center gap-3">
        {/* Socket connection indicator */}
        <div className="flex items-center gap-1.5 text-xs hidden sm:flex">
          {connected ? (
            <><Wifi className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Live</span></>
          ) : (
            <><WifiOff className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-500">Offline</span></>
          )}
        </div>

        {/* Language Selector */}
        <div className="relative" ref={langRef}>
          <button 
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-dark-700/50 transition-colors text-slate-300 hover:text-white"
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">{currentLang.short}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-dark-800 border border-dark-700/50 rounded-xl shadow-xl overflow-hidden py-1 z-50 animate-slide-up">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    i18n.language === lang.code 
                      ? 'bg-primary-600/20 text-primary-400 font-medium' 
                      : 'text-slate-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
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
