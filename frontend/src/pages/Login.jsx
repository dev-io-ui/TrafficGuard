import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await login(f.email, f.password); nav('/dashboard'); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <main className="auth">
      <form className="card" onSubmit={submit}>
        <h2>Sign in</h2>
        {error && <p className="error">{error}</p>}
        <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
        <p className="muted small">New driver? <Link to="/register">Create an account</Link></p>
      </form>
    </main>
  );
}
