import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, CalendarDays, FileText, CreditCard,
  PieChart, UserCheck, LogOut, Building2, Shield, Home, X, Menu,
  ShoppingBag, Megaphone, Calendar, Wrench, MoreHorizontal, Car, BarChart3, FolderOpen
} from 'lucide-react';
import { useState } from 'react';

// ── Navigation Definitions ───────────────────────────────────────────────────

const adminNav = [
  { to: '/admin/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/admin/analytics', labelKey: 'nav.analytics', icon: PieChart },
  { to: '/admin/residents', labelKey: 'nav.residents', icon: Users },
  { to: '/admin/bookings', labelKey: 'nav.bookings', icon: CalendarDays },
  { to: '/admin/complaints', labelKey: 'nav.complaints', icon: FileText },
  { to: '/admin/payments', labelKey: 'nav.payments', icon: CreditCard },
  { to: '/admin/expenses', labelKey: 'nav.expenses', icon: PieChart, group: 'Operations' },
  { to: '/admin/visitors', labelKey: 'nav.visitors', icon: UserCheck, group: 'Operations' },
  { to: '/admin/staff', labelKey: 'nav.staff', icon: Users, group: 'Operations' },
  { to: '/admin/documents', labelKey: 'nav.documents', icon: FolderOpen, group: 'Operations' },
  { to: '/admin/marketplace', labelKey: 'nav.marketplace', icon: ShoppingBag, group: 'Community' },
  { to: '/admin/events', labelKey: 'nav.events', icon: Calendar, group: 'Community' },
  { to: '/admin/announcements', labelKey: 'nav.announcements', icon: Megaphone, group: 'Community' },
  { to: '/admin/polls', labelKey: 'nav.polls', icon: BarChart3, group: 'Community' },
  { to: '/admin/services', labelKey: 'nav.services', icon: Wrench, group: 'Community' },
];

const residentNav = [
  { to: '/resident/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/resident/book', labelKey: 'nav.bookFacility', icon: CalendarDays },
  { to: '/resident/complaints', labelKey: 'nav.complaints', icon: FileText },
  { to: '/resident/payments', labelKey: 'nav.payments', icon: CreditCard },
  { to: '/resident/expenses', labelKey: 'nav.expenses', icon: PieChart },
  { to: '/resident/visitors', labelKey: 'nav.visitors', icon: UserCheck },
  { to: '/resident/vehicles', labelKey: 'nav.myVehicles', icon: Car },
  { to: '/resident/documents', labelKey: 'nav.documents', icon: FolderOpen },
  { to: '/resident/marketplace', labelKey: 'nav.marketplace', icon: ShoppingBag, group: 'Community' },
  { to: '/resident/events', labelKey: 'nav.events', icon: Calendar, group: 'Community' },
  { to: '/resident/announcements', labelKey: 'nav.announcements', icon: Megaphone, group: 'Community' },
  { to: '/resident/polls', labelKey: 'nav.polls', icon: BarChart3, group: 'Community' },
  { to: '/resident/services', labelKey: 'nav.services', icon: Wrench, group: 'Community' },
];

const securityNav = [
  { to: '/security/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/security/visitors', labelKey: 'nav.visitors', icon: UserCheck },
  { to: '/security/entry', labelKey: 'nav.gateEntry', icon: Shield },
  { to: '/security/staff', labelKey: 'nav.staffEntry', icon: Users },
  { to: '/security/vehicles', labelKey: 'nav.vehicleSearch', icon: Car },
];

// Bottom nav: max 4 primary items + "More"
const adminBottomNav = [
  { to: '/admin/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/admin/residents', labelKey: 'nav.residents', icon: Users },
  { to: '/admin/payments', labelKey: 'nav.payments', icon: CreditCard },
];

const residentBottomNav = [
  { to: '/resident/dashboard', labelKey: 'nav.home', icon: Home },
  { to: '/resident/book', labelKey: 'nav.book', icon: CalendarDays },
  { to: '/resident/complaints', labelKey: 'nav.complaints', icon: FileText },
  { to: '/resident/payments', labelKey: 'nav.payments', icon: CreditCard },
];

const securityBottomNav = [
  { to: '/security/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/security/visitors', labelKey: 'nav.visitors', icon: UserCheck },
  { to: '/security/entry', labelKey: 'nav.gateEntry', icon: Shield },
];

const navMap = { admin: adminNav, resident: residentNav, security: securityNav };
const bottomNavMap = { admin: adminBottomNav, resident: residentBottomNav, security: securityBottomNav };
const roleColors = { admin: 'from-violet-600 to-purple-700', resident: 'from-blue-600 to-cyan-600', security: 'from-amber-500 to-orange-600' };
const roleLabels = { admin: 'nav.adminPanel', resident: 'nav.residentPortal', security: 'nav.securityDesk' };

// ── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const navItems = navMap[user?.role] || [];
  const bottomNavItems = bottomNavMap[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Desktop Sidebar Content ──
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`p-6 bg-gradient-to-br ${roleColors[user?.role] || 'from-primary-600 to-primary-700'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Smart Society</p>
            <p className="text-white/70 text-xs">{t(roleLabels[user?.role] || 'nav.adminPanel')}</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">
              {user?.wing ? `${user.wing}-${user.flatNumber}` : user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto sidebar-scroll">
        {navItems.map((item, i) => {
          const showGroupHeader = item.group && (i === 0 || navItems[i - 1].group !== item.group);
          return (
            <div key={item.to}>
              {showGroupHeader && (
                <div className="px-3 mt-4 mb-2 text-xs flex items-center gap-2 text-slate-500 font-semibold uppercase tracking-wider">
                  {item.group}
                </div>
              )}
              <NavLink
                to={item.to}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{t(item.labelKey)}</span>
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-dark-700/50">
        <button
          onClick={handleLogout}
          id="logout-btn"
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">{t('auth.logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile: Hamburger (top-left, shown when off-canvas is used for "More") ── */}
      {/* We only use this for the off-canvas "More" drawer */}

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-dark-800 border-r border-dark-700 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile: off-canvas "More" drawer ── */}
      {moreOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-[60]"
            onClick={() => setMoreOpen(false)}
          />
          <div className="lg:hidden bottom-sheet" style={{ zIndex: 70 }}>
            <div className="bottom-sheet-handle" />
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-white">{t('nav.more')}</p>
              <button onClick={() => setMoreOpen(false)} className="p-1 rounded-lg hover:bg-dark-700/50">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/40 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{user?.name}</p>
                <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
              </div>
            </div>

            {/* All nav items not in bottom nav */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMoreOpen(false)}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{t(item.labelKey)}</span>
                </NavLink>
              ))}
            </nav>

            {/* Logout */}
            <div className="mt-4 pt-4 border-t border-dark-700/50">
              <button
                onClick={() => { setMoreOpen(false); handleLogout(); }}
                className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">{t('auth.logout')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Mobile: Bottom Navigation Bar ── */}
      <nav className="bottom-nav lg:hidden">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}

        {/* More button */}
        <button
          className="bottom-nav-item"
          onClick={() => setMoreOpen(true)}
          aria-label="More options"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>{t('nav.more')}</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
