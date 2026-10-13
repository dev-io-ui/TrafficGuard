import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await register(f); nav('/dashboard'); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <main className="auth">
      <form className="card" onSubmit={submit}>
        <h2>Create your account</h2>
        {error && <p className="error">{error}</p>}
        <label>Name<input required value={f.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
        <label>Password (min 6)<input type="password" required minLength={6} value={f.password} onChange={set('password')} /></label>
        <label>Phone (optional)<input value={f.phone} onChange={set('phone')} /></label>
        <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
        <p className="muted small">Register as a citizen to report violations and manage your fines. Already registered? <Link to="/login">Login</Link></p>
      </form>
    </main>
  );
}
