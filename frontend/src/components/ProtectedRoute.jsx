import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="center muted">Loading…</div>;
  if (user?.mustChangePassword && loc.pathname !== '/change-password') return <Navigate to="/change-password" replace />;
  return user ? children : <Navigate to="/login" replace />;
}
