import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ICON = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  receipt: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 118 0v4',
  logout: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
};
export const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICON[name]} /></svg>
);
export const Brand = () => (
  <>
    <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
    <span>Traffic<b>Guard</b></span>
  </>
);

const ROLE = { citizen: 'Citizen', officer: 'Officer', supervisor: 'Appeals Supervisor', finance: 'Finance Officer', regional_admin: 'Regional Admin', admin: 'Administrator' };
const ITEMS = [['/', 'Home', 'home'], ['/dashboard', 'Dashboard', 'grid'], ['/search', 'Check & pay challan', 'search'], ['/receipts', 'Find receipt', 'receipt'], ['/change-password', 'Account & password', 'lock']];

export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const initials = user.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <aside className="sidebar">
      <Link to="/" className="brand side-brand" onClick={onNavigate}><Brand /></Link>
      <p className="side-label">{ROLE[user.role]} workspace</p>
      <nav className="side-nav">
        {ITEMS.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end onClick={onNavigate} className="side-link"><Icon name={icon} /><span>{label}</span></NavLink>
        ))}
      </nav>
      <div className="side-user">
        <span className="avatar">{initials}</span>
        <div className="grow"><b>{user.name}</b><small>{ROLE[user.role]}{user.district ? ` · ${user.district}` : ''}</small></div>
        <button className="side-logout" title="Log out" aria-label="Log out" onClick={() => { logout(); nav('/'); }}><Icon name="logout" /></button>
      </div>
    </aside>
  );
}
