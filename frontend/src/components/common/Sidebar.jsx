import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, CalendarDays, FileText, CreditCard,
  PieChart, UserCheck, LogOut, Building2, Shield, Home, X, Menu,
  ShoppingBag, Megaphone, Calendar, Wrench, Package
} from 'lucide-react';
import { useState } from 'react';

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/analytics', label: 'Analytics', icon: PieChart },
  { to: '/admin/residents', label: 'Residents', icon: Users },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/admin/complaints', label: 'Complaints', icon: FileText },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/expenses', label: 'Expenses', icon: PieChart, group: 'Operations' },
  { to: '/admin/visitors', label: 'Visitors', icon: UserCheck, group: 'Operations' },
  // Community Hub
  { to: '/admin/marketplace', label: 'Marketplace', icon: ShoppingBag, group: 'Community' },
  { to: '/admin/events', label: 'Events', icon: Calendar, group: 'Community' },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone, group: 'Community' },
  { to: '/admin/services', label: 'Services', icon: Wrench, group: 'Community' },
];

const residentNav = [
  { to: '/resident/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resident/book', label: 'Book Facility', icon: CalendarDays },
  { to: '/resident/complaints', label: 'Complaints', icon: FileText },
  { to: '/resident/payments', label: 'Payments', icon: CreditCard },
  { to: '/resident/expenses', label: 'Expenses', icon: PieChart },
  { to: '/resident/visitors', label: 'Visitor Requests', icon: UserCheck },
  // Community Hub
  { to: '/resident/marketplace', label: 'Marketplace', icon: ShoppingBag, group: 'Community' },
  { to: '/resident/events', label: 'Events', icon: Calendar, group: 'Community' },
  { to: '/resident/announcements', label: 'Announcements', icon: Megaphone, group: 'Community' },
  { to: '/resident/services', label: 'Services', icon: Wrench, group: 'Community' },
];

const securityNav = [
  { to: '/security/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/security/visitors', label: 'Visitors', icon: UserCheck },
  { to: '/security/entry', label: 'Gate Entry', icon: Shield },
];

const navMap = { admin: adminNav, resident: residentNav, security: securityNav };
const roleColors = { admin: 'from-violet-600 to-purple-700', resident: 'from-blue-600 to-cyan-600', security: 'from-amber-500 to-orange-600' };
const roleLabels = { admin: 'Admin Panel', resident: 'Resident Portal', security: 'Security Desk' };

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = navMap[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
            <p className="text-white/70 text-xs">{roleLabels[user?.role]}</p>
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
            <p className="text-slate-400 text-xs truncate">{user?.wing ? `${user?.wing}-${user?.flatNumber}` : user?.email}</p>
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
                <span className="text-sm font-medium">{item.label}</span>
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
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-card"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-dark-800 border-r border-dark-700 z-50 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-dark-800 border-r border-dark-700 flex-shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
