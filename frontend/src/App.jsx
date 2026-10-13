import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Receipt from './pages/Receipt';
import Search from './pages/Search';
import ReceiptSearch from './pages/ReceiptSearch';
import ChangePassword from './pages/ChangePassword';

export default function App() {
  useEffect(() => {
    const move = (e) => { document.documentElement.style.setProperty('--mx', `${e.clientX}px`); document.documentElement.style.setProperty('--my', `${e.clientY}px`); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <>
      <div className="bg" aria-hidden="true"><i className="grid-bg" /><i className="orb o1" /><i className="orb o2" /><i className="orb o3" /></div>
      <div className="cursor-glow" aria-hidden="true" />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/receipt/:id" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/search" element={<Search />} />
        <Route path="/receipts" element={<ReceiptSearch />} />
        <Route path="/verify/:number" element={<ReceiptSearch />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
