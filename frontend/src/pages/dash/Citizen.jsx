import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import GeoSelect from '../../components/GeoSelect';
import EvidenceCapture from '../../components/EvidenceCapture';
import FineCard from './FineCard';
import ReportCard from './ReportCard';
import { Pager, Stats, Tabs, useList, useStats } from './ui';

const TYPES = ['Speeding', 'Red Light Violation', 'No Helmet', 'No Seatbelt', 'Illegal Parking', 'Driving Without License', 'Drunk Driving', 'Mobile Phone Usage', 'Signal Jumping', 'Wrong Side Driving', 'Triple Riding', 'Other'];
const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const blank = () => ({ vehicleNumber: '', violationType: TYPES[0], occurredAt: nowLocal(), description: '', state: 'Telangana', district: '', pincode: '', area: '' });

function ReportForm({ onDone }) {
  const toast = useToast();
  const [f, setF] = useState(blank());
  const [ev, setEv] = useState({ photos: [], videos: [] });
  const [gps, setGps] = useState(null);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(0);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const locate = () => navigator.geolocation?.getCurrentPosition(
    (p) => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude }); toast('Location captured'); },
    () => toast('Could not get your location', 'error'));

  const submit = async (e) => {
    e.preventDefault();
    if (!ev.photos.length && !ev.videos.length) return toast('Attach at least one photo or video', 'error');
    setBusy(true);
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    if (gps) { fd.append('lat', gps.lat); fd.append('lng', gps.lng); }
    ev.photos.forEach((p) => fd.append('photos', p));
    ev.videos.forEach((v) => fd.append('videos', v));
    try {
      const res = await api.post('/reports', fd);
      toast(res.data.routing);
      setF(blank()); setEv({ photos: [], videos: [] }); setGps(null); setKey((k) => k + 1); onDone();
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };

  return (
    <form className="card grid" onSubmit={submit}>
      <h3 className="span2">Report a violation</h3>
      <label>Vehicle number<input required placeholder="TS09AB1234" value={f.vehicleNumber} onChange={set('vehicleNumber')} /></label>
      <label>Violation type<select value={f.violationType} onChange={set('violationType')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label>When did it happen?<input type="datetime-local" required max={nowLocal()} value={f.occurredAt} onChange={set('occurredAt')} /></label>
      <label>GPS location<button type="button" className="btn ghost" onClick={locate}>{gps ? `✓ ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Use my current location'}</button></label>
      <GeoSelect value={f} onChange={(v) => setF({ ...f, ...v })} />
      <label className="span2">Description<textarea rows="3" value={f.description} onChange={set('description')} /></label>
      <div className="span2"><p className="label">Evidence (photos and/or video)</p><EvidenceCapture key={key} onChange={setEv} /></div>
      <button className="btn span2" disabled={busy}>{busy ? 'Uploading…' : 'Submit report'}</button>
    </form>
  );
}

function Vehicles() {
  const toast = useToast();
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/vehicles').then((r) => setList(r.data.items)).catch((e) => toast(errMsg(e), 'error')); }, []); // eslint-disable-line
  return (
    <>
      <p className="muted small">Vehicles are registered by the traffic administration. If your vehicle is missing, ask an administrator to link it to your account email.</p>
      <div className="list">{(list || []).map((v) => (
        <article key={v._id} className="vcard"><div className="grow"><h4 className="mono">{v.regNo}</h4>
          <p className="muted small">{v.type}{v.chassisNo ? ` · Chassis ${v.chassisNo}` : ''}</p></div></article>
      ))}
        {list && !list.length && <p className="muted empty">No vehicles are linked to your account yet.</p>}</div>
    </>
  );
}

export default function Citizen() {
  const [tab, setTab] = useState('report');
  const [stats, reloadStats] = useStats();
  const reports = useList('/reports');
  const fines = useList('/fines');
  const refresh = () => { reports.reload(); fines.reload(); reloadStats(); };
  return (
    <>
      <Stats items={[['My reports', stats?.reports.total], ['Validated', stats?.reports.byStatus.Validated], ['Unpaid fines', stats?.fines.byStatus.Unpaid], ['Outstanding ₹', stats?.fines.outstanding]]} />
      <Tabs value={tab} onChange={setTab} tabs={[['report', 'Report violation'], ['reports', 'My reports'], ['fines', 'My fines'], ['vehicles', 'My vehicles']]} />
      {tab === 'report' && <ReportForm onDone={() => { refresh(); setTab('reports'); }} />}
      {tab === 'reports' && (<><div className="list">{reports.items.map((r) => <ReportCard key={r._id} r={r} role="citizen" onChange={refresh} />)}</div>
        {!reports.items.length && <p className="muted empty">You haven’t reported anything yet.</p>}<Pager page={reports.page} pages={reports.pages} onPage={reports.setPage} /></>)}
      {tab === 'fines' && (<><div className="list">{fines.items.map((f) => <FineCard key={f._id} fine={f} role="citizen" onChange={refresh} />)}</div>
        {!fines.items.length && <p className="muted empty">No fines on your vehicles. Register your vehicles to see them here.</p>}<Pager page={fines.page} pages={fines.pages} onPage={fines.setPage} /></>)}
      {tab === 'vehicles' && <Vehicles />}
    </>
  );
}
