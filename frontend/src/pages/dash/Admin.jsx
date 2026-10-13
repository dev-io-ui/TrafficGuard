import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import GeoSelect from '../../components/GeoSelect';
import ReportCard from './ReportCard';
import { Badge, Pager, Stats, Tabs, dt, money, useList, useStats } from './ui';

const Breakdown = ({ title, data = {} }) => (
  <div className="card"><h4>{title}</h4>{Object.entries(data).sort((a, b) => b[1] - a[1]).map(([k, v]) => <div key={k} className="between small"><span>{k}</span><b>{v}</b></div>)}
    {!Object.keys(data).length && <p className="muted small">No data yet.</p>}</div>
);

function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const list = useList('/users');
  const roles = me.role === 'admin' ? ['officer', 'supervisor', 'finance', 'regional_admin', 'admin'] : ['officer', 'supervisor', 'finance'];
  const blank = { name: '', email: '', password: '', role: 'officer', badgeNumber: '', station: '', state: me.role === 'regional_admin' ? me.state : '', district: '' };
  const [f, setF] = useState(blank);
  const needsState = ['officer', 'supervisor', 'regional_admin'].includes(f.role), needsDistrict = ['officer', 'supervisor'].includes(f.role);
  const create = async (e) => {
    e.preventDefault();
    try { await api.post('/users', f); toast('Account created. The user must change the password at first login.'); setF(blank); list.reload(); }
    catch (err) { toast(errMsg(err), 'error'); }
  };
  const toggle = async (id) => { try { await api.put(`/users/${id}/toggle-active`); list.reload(); } catch (e) { toast(errMsg(e), 'error'); } };
  return (
    <>
      <form className="card grid" onSubmit={create}>
        <h3 className="span2">Create staff account</h3>
        <label>Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Temporary password<input type="text" minLength={6} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <label>Role<select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{roles.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}</select></label>
        {needsState && <GeoSelect value={f} onChange={(v) => setF({ ...f, ...v, ...(needsDistrict ? {} : { district: '' }) })} pincode={false} area={false} lockState={me.role === 'regional_admin'} required={false} />}
        <label>Badge number<input value={f.badgeNumber} onChange={(e) => setF({ ...f, badgeNumber: e.target.value })} /></label>
        <label>Station<input value={f.station} onChange={(e) => setF({ ...f, station: e.target.value })} /></label>
        <button className="btn span2">Create account</button>
      </form>
      <div className="list">{list.items.map((u) => (
        <article key={u._id} className="vcard"><div className="grow"><h4>{u.name} <span className="pill">{u.role.replace('_', ' ')}</span> {!u.isActive && <Badge s="Disputed" />}</h4>
          <p className="muted small">{u.email}{u.state ? ` · ${u.district ? u.district + ', ' : ''}${u.state}` : ''}</p></div>
          <button className="btn ghost" onClick={() => toggle(u._id)}>{u.isActive ? 'Deactivate' : 'Activate'}</button></article>
      ))}</div>
      <Pager page={list.page} pages={list.pages} onPage={list.setPage} />
    </>
  );
}

const VTYPES = ['Car', 'Two-wheeler', 'Auto', 'Truck', 'Bus', 'Other'];

function Vehicles() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const list = useList('/vehicles', { q });
  const blank = { regNo: '', chassisNo: '', type: 'Car', ownerName: '', ownerPhone: '', ownerEmail: '' };
  const [f, setF] = useState(blank);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const add = async (e) => {
    e.preventDefault();
    try { await api.post('/vehicles', f); toast('Vehicle added'); setF(blank); list.reload(); } catch (err) { toast(errMsg(err), 'error'); }
  };
  const del = async (v) => {
    if (!window.confirm(`Remove ${v.regNo} from the registry?`)) return;
    try { await api.delete(`/vehicles/${v._id}`); list.reload(); } catch (err) { toast(errMsg(err), 'error'); }
  };
  return (
    <>
      <form className="card grid" onSubmit={add}>
        <h3 className="span2">Add vehicle to registry</h3>
        <label>Vehicle number<input required placeholder="TS09AB1234" value={f.regNo} onChange={set('regNo')} /></label>
        <label>Chassis number<input placeholder="e.g. MA3EWB10SK0123456" value={f.chassisNo} onChange={set('chassisNo')} /></label>
        <label>Type<select value={f.type} onChange={set('type')}>{VTYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Owner name<input value={f.ownerName} onChange={set('ownerName')} /></label>
        <label>Owner mobile<input value={f.ownerPhone} onChange={set('ownerPhone')} /></label>
        <label>Owner account email (optional — links the vehicle to a citizen login)<input type="email" value={f.ownerEmail} onChange={set('ownerEmail')} /></label>
        <button className="btn span2">Add vehicle</button>
      </form>
      <div className="row filters"><input placeholder="Search vehicle no., chassis no. or owner" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="list">{list.items.map((v) => (
        <article key={v._id} className="vcard"><div className="grow"><h4 className="mono">{v.regNo}</h4>
          <p className="muted small">{v.type}{v.chassisNo ? ` · Chassis ${v.chassisNo}` : ''}{v.ownerName ? ` · ${v.ownerName}` : ''}{v.ownerPhone ? ` · ${v.ownerPhone}` : ''}</p>
          <p className="small">{v.owner ? `Linked account: ${v.owner.email}` : 'No linked citizen account'}</p></div>
          <button className="btn ghost" onClick={() => del(v)}>Remove</button></article>
      ))}</div>
      {!list.items.length && !list.loading && <p className="muted empty">No vehicles found.</p>}
      <Pager page={list.page} pages={list.pages} onPage={list.setPage} />
    </>
  );
}

function Schedule() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [state, setState] = useState(me.role === 'regional_admin' ? me.state : '*');
  const [states, setStates] = useState([]);
  const [sched, setSched] = useState({});
  useEffect(() => { api.get('/geo/states').then((r) => setStates(r.data.states)); }, []);
  useEffect(() => { api.get('/fines/schedule', { params: { state } }).then((r) => setSched(r.data.schedule)); }, [state]);
  const save = async (violationType) => {
    try { await api.put('/fines/schedule', { state, violationType, amount: sched[violationType] }); toast('Saved'); } catch (e) { toast(errMsg(e), 'error'); }
  };
  return (
    <>
      {me.role === 'admin' && <div className="row filters"><select value={state} onChange={(e) => setState(e.target.value)}><option value="*">Default (all states)</option>{states.map((s) => <option key={s}>{s}</option>)}</select></div>}
      <div className="list">{Object.entries(sched).map(([t, a]) => (
        <article key={t} className="vcard"><div className="grow"><h4>{t}</h4></div>
          <input type="number" min="0" value={a} onChange={(e) => setSched({ ...sched, [t]: e.target.value })} style={{ width: 120 }} />
          <button className="btn ghost" onClick={() => save(t)}>Save</button></article>
      ))}</div>
    </>
  );
}

function Reports() {
  const { user } = useAuth();
  const [status, setStatus] = useState('open');
  const list = useList('/reports', { status });
  return (
    <>
      <div className="row filters"><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="open">Pending review</option><option value="">All</option></select></div>
      <div className="list">{list.items.map((r) => <ReportCard key={r._id} r={r} role={user.role} onChange={list.reload} />)}</div>
      {!list.items.length && !list.loading && <p className="muted empty">Nothing to review.</p>}
      <Pager page={list.page} pages={list.pages} onPage={list.setPage} />
    </>
  );
}

function Audit() {
  const list = useList('/audit');
  return (
    <>
      <div className="list">{list.items.map((a) => <article key={a._id} className="vcard"><div className="grow"><h4 className="mono">{a.action}</h4>
        <p className="small">{a.target} · {a.actor?.name || '—'} ({a.actorRole}) · {dt(a.createdAt)}</p>{a.meta && <p className="muted small mono">{JSON.stringify(a.meta)}</p>}</div></article>)}</div>
      <Pager page={list.page} pages={list.pages} onPage={list.setPage} />
    </>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [s] = useStats();
  const tabs = [['overview', 'Overview'], ['reports', 'Review reports'], ['vehicles', 'Vehicles'], ['users', 'Staff'], ['schedule', 'Fine schedule'], ...(user.role === 'admin' ? [['audit', 'Audit log']] : [])];
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={tabs} />
      {tab === 'overview' && (
        <>
          <Stats items={[['Reports', s?.reports.total], ['Validation rate %', s?.reports.validationRate], ['Fines', s?.fines.total], ['Revenue', money(s?.revenue)], ['Outstanding', money(s?.fines.outstanding)]]} />
          <div className="grid2"><Breakdown title="Reports by status" data={s?.reports.byStatus} /><Breakdown title="Reports by type" data={s?.reports.byType} />
            <Breakdown title="Reports by district" data={s?.reports.byDistrict} /><Breakdown title="Fines by status" data={s?.fines.byStatus} /></div>
        </>
      )}
      {tab === 'reports' && <Reports />}
      {tab === 'vehicles' && <Vehicles />}
      {tab === 'users' && <Users />}
      {tab === 'schedule' && <Schedule />}
      {tab === 'audit' && <Audit />}
    </>
  );
}
