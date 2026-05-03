import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './routes/PrivateRoute';
import RoleRoute from './routes/RoleRoute';
import './i18n'; // Initialize i18next

// Auth
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminAnalytics from './pages/admin/Analytics';
import AdminResidents from './pages/admin/Residents';
import AdminBookings from './pages/admin/Bookings';
import AdminComplaints from './pages/admin/Complaints';
import AdminPayments from './pages/admin/Payments';
import AdminExpenses from './pages/admin/Expenses';
import AdminVisitors from './pages/admin/Visitors';
import AdminStaff from './pages/admin/Staff';

// Resident
import ResidentDashboard from './pages/resident/Dashboard';
import ResidentBook from './pages/resident/Book';
import ResidentComplaints from './pages/resident/Complaints';
import ResidentPayments from './pages/resident/Payments';
import ResidentExpenses from './pages/resident/Expenses';
import ResidentVisitors from './pages/resident/Visitors';
import ResidentSOS from './pages/resident/SOS';
import ResidentVehicles from './pages/resident/Vehicles';
import ResidentDocuments from './pages/resident/Documents';

// Security
import SecurityDashboard from './pages/security/Dashboard';
import SecurityVisitors from './pages/security/Visitors';
import SecurityEntry from './pages/security/Entry';
import SecurityStaffEntry from './pages/security/StaffEntry';
import SecurityVehicles from './pages/security/Vehicles';

// Community Hub (Unified components for Resident & Admin)
import Marketplace from './pages/community/Marketplace';
import Announcements from './pages/community/Announcements';
import Events from './pages/community/Events';
import Services from './pages/community/Services';
import Polls from './pages/community/Polls';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<PrivateRoute><RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/analytics" element={<PrivateRoute><RoleRoute roles={['admin']}><AdminAnalytics /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/residents" element={<PrivateRoute><RoleRoute roles={['admin']}><AdminResidents /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/bookings" element={<PrivateRoute><RoleRoute roles={['admin']}><AdminBookings /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/complaints" element={<PrivateRoute><RoleRoute roles={['admin']}><AdminComplaints /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/payments" element={<PrivateRoute><RoleRoute roles={['admin']}><AdminPayments /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/expenses" element={<PrivateRoute><RoleRoute roles={['admin']}><AdminExpenses /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/visitors" element={<PrivateRoute><RoleRoute roles={['admin']}><AdminVisitors /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/staff" element={<PrivateRoute><RoleRoute roles={['admin']}><AdminStaff /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/documents" element={<PrivateRoute><RoleRoute roles={['admin']}><ResidentDocuments /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/marketplace" element={<PrivateRoute><RoleRoute roles={['admin']}><Marketplace /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/announcements" element={<PrivateRoute><RoleRoute roles={['admin']}><Announcements /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/polls" element={<PrivateRoute><RoleRoute roles={['admin']}><Polls /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/events" element={<PrivateRoute><RoleRoute roles={['admin']}><Events /></RoleRoute></PrivateRoute>} />
            <Route path="/admin/services" element={<PrivateRoute><RoleRoute roles={['admin']}><Services /></RoleRoute></PrivateRoute>} />

            {/* Resident Routes */}
            <Route path="/resident/dashboard" element={<PrivateRoute><RoleRoute roles={['resident']}><ResidentDashboard /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/book" element={<PrivateRoute><RoleRoute roles={['resident']}><ResidentBook /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/bookings" element={<PrivateRoute><RoleRoute roles={['resident']}><ResidentBook /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/complaints" element={<PrivateRoute><RoleRoute roles={['resident']}><ResidentComplaints /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/payments" element={<PrivateRoute><RoleRoute roles={['resident']}><ResidentPayments /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/expenses" element={<PrivateRoute><RoleRoute roles={['resident']}><ResidentExpenses /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/visitors" element={<PrivateRoute><RoleRoute roles={['resident']}><ResidentVisitors /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/vehicles" element={<PrivateRoute><RoleRoute roles={['resident']}><ResidentVehicles /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/documents" element={<PrivateRoute><RoleRoute roles={['resident', 'admin']}><ResidentDocuments /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/sos" element={<PrivateRoute><RoleRoute roles={['resident']}><ResidentSOS /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/marketplace" element={<PrivateRoute><RoleRoute roles={['resident']}><Marketplace /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/announcements" element={<PrivateRoute><RoleRoute roles={['resident']}><Announcements /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/polls" element={<PrivateRoute><RoleRoute roles={['resident']}><Polls /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/events" element={<PrivateRoute><RoleRoute roles={['resident']}><Events /></RoleRoute></PrivateRoute>} />
            <Route path="/resident/services" element={<PrivateRoute><RoleRoute roles={['resident']}><Services /></RoleRoute></PrivateRoute>} />

            {/* Security Routes */}
            <Route path="/security/dashboard" element={<PrivateRoute><RoleRoute roles={['security']}><SecurityDashboard /></RoleRoute></PrivateRoute>} />
            <Route path="/security/visitors" element={<PrivateRoute><RoleRoute roles={['security']}><SecurityVisitors /></RoleRoute></PrivateRoute>} />
            <Route path="/security/entry" element={<PrivateRoute><RoleRoute roles={['security']}><SecurityEntry /></RoleRoute></PrivateRoute>} />
            <Route path="/security/staff" element={<PrivateRoute><RoleRoute roles={['security']}><SecurityStaffEntry /></RoleRoute></PrivateRoute>} />
            <Route path="/security/vehicles" element={<PrivateRoute><RoleRoute roles={['security']}><SecurityVehicles /></RoleRoute></PrivateRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
