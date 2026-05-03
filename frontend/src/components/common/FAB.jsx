import { useState } from 'react';
import { Plus, AlertTriangle, Calendar, MessageSquare, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function FAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role !== 'resident') return null;

  const actions = [
    { icon: <AlertTriangle size={20} />, label: 'SOS Alert', path: '/resident/sos', color: 'bg-red-500' },
    { icon: <CreditCard size={20} />, label: 'Pay Now', path: '/resident/payments', color: 'bg-emerald-500' },
    { icon: <Calendar size={20} />, label: 'Book Facility', path: '/resident/book', color: 'bg-primary-500' },
    { icon: <MessageSquare size={20} />, label: 'New Complaint', path: '/resident/complaints', color: 'bg-amber-500' },
  ];

  const handleActionClick = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 flex flex-col items-end">
      {/* Menu items */}
      <div 
        className={`flex flex-col gap-3 mb-4 transition-all duration-300 origin-bottom ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none'
        }`}
      >
        {actions.map((action, index) => (
          <div key={index} className="flex items-center gap-3 justify-end group cursor-pointer" onClick={() => handleActionClick(action.path)}>
            <span className="bg-dark-800 text-slate-200 text-sm py-1 px-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              {action.label}
            </span>
            <button className={`w-12 h-12 rounded-full text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 ${action.color}`}>
              {action.icon}
            </button>
          </div>
        ))}
      </div>

      {/* Main Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-500/30 flex items-center justify-center transition-transform hover:scale-105"
      >
        <Plus size={28} className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`} />
      </button>

      {/* Overlay to close when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[-1]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
