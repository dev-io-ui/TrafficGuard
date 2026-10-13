import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ChangePassword() {
  const { user, refresh } = useAuth();
  const nav = useNavigate(); const toast = useToast();
  const [f, setF] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setError('');
    try { await api.put('/auth/password', f); await refresh(); toast('Password updated'); nav('/dashboard'); } catch (err) { setError(errMsg(err)); }
  };
  return (
    <main className="auth"><form className="card" onSubmit={submit}>
      <h2>Change password</h2>
      {user?.mustChangePassword && <p className="muted small">Your account was created by an administrator. Please set a new password to continue.</p>}
      {error && <p className="error">{error}</p>}
      <label>Current password<input type="password" required value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /></label>
      <label>New password (min 6)<input type="password" minLength={6} required value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /></label>
      <button className="btn">Update password</button>
    </form></main>
  );
}
