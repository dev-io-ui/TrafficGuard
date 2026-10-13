import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="navbar">
      <Link to="/" className="brand">Traffic<span>Guard</span></Link>
      <nav>
        <Link to="/search">Pay challan</Link>
        <Link to="/receipts">Find receipt</Link>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/change-password" className="small">Password</Link>
            <span className="pill">{user.role.replace('_', ' ')}</span>
            <button className="btn ghost" onClick={() => { logout(); nav('/'); }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
