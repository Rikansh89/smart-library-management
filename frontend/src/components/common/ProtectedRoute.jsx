import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const dashboard = {
      student: '/student/dashboard',
      librarian: '/librarian/dashboard',
      admin: '/admin/dashboard'
    };
    return <Navigate to={dashboard[user.role] || '/'} replace />;
  }

  return children;
}
