import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    const redirectMap = { admin: '/admin/dashboard', resident: '/resident/dashboard', security: '/security/dashboard' };
    return <Navigate to={redirectMap[user?.role] || '/login'} replace />;
  }

  return children;
};

export default RoleRoute;
