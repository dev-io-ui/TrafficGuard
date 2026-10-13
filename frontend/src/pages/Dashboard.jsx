import { useAuth } from '../context/AuthContext';
import Citizen from './dash/Citizen';
import Officer from './dash/Officer';
import Supervisor from './dash/Supervisor';
import Finance from './dash/Finance';
import Admin from './dash/Admin';

const VIEWS = { citizen: Citizen, officer: Officer, supervisor: Supervisor, finance: Finance, regional_admin: Admin, admin: Admin };
const TITLES = { citizen: 'Citizen', officer: 'Officer', supervisor: 'Appeals Supervisor', finance: 'Finance', regional_admin: 'Regional Admin', admin: 'Super Admin' };

export default function Dashboard() {
  const { user } = useAuth();
  const View = VIEWS[user.role];
  return (
    <main className="dash">
      <h2>{TITLES[user.role]} dashboard</h2>
      <p className="muted small">Welcome, {user.name}{user.district ? ` · ${user.district}, ${user.state}` : user.state ? ` · ${user.state}` : ''}</p>
      <View />
    </main>
  );
}
