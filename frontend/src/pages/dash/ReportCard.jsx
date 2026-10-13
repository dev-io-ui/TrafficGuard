import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Badge, Gallery, dt } from './ui';

const HELP = {
  Submitted: (r) => r.assignedTo ? `Waiting for Officer ${r.assignedTo.name} to review your evidence.` : `Waiting for a ${r.state} supervisor/admin to review your evidence (no officer posted in ${r.district} yet).`,
  'Under Review': () => 'An officer is reviewing your evidence.',
  'Needs More Info': () => 'The officer needs more information from you.',
  Validated: () => 'The officer verified your report and issued a fine to the vehicle owner. Thank you!',
  Rejected: () => 'The officer could not verify this report.',
};

export default function ReportCard({ r, role, onChange }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [rv, setRv] = useState({ note: '', amount: '', section: '' });
  const [sched, setSched] = useState(null);
  const [busy, setBusy] = useState(false);
  const canReview = ['officer', 'supervisor', 'regional_admin', 'admin'].includes(role) && ['Submitted', 'Under Review'].includes(r.status);

  useEffect(() => {
    if (open && canReview && !sched) api.get('/fines/schedule', { params: { state: r.state } }).then((x) => { setSched(x.data.schedule); setRv((v) => ({ ...v, amount: x.data.schedule[r.violationType] || '' })); }).catch(() => {});
  }, [open]); // eslint-disable-line

  const act = async (action) => {
    setBusy(true);
    try { await api.put(`/reports/${r._id}/review`, { action, ...rv }); toast(action === 'validate' ? 'Fine issued' : 'Report updated'); onChange(); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };
  const reply = async () => {
    try { await api.post(`/reports/${r._id}/comment`, { text }); toast('Sent to the officer'); setText(''); onChange(); }
    catch (e) { toast(errMsg(e), 'error'); }
  };

  return (
    <article className="vcard col">
      <div className="between" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        <h4>{r.violationType} <Badge s={r.status} /> {r.duplicateOf && role !== 'citizen' && <span className="badge disputed">Possible duplicate</span>}</h4>
        <span className="mono">{r.vehicleNumber}</span>
      </div>
      <p className="muted small">{r.area ? `${r.area}, ` : ''}{r.district}, {r.state} {r.pincode} · {dt(r.occurredAt)}{role !== 'citizen' && r.reporter ? ` · reported by ${r.reporter.name}` : ''}</p>
      {role === 'citizen' && <p className="small"><b>{HELP[r.status]?.(r)}</b></p>}
      {role !== 'citizen' && r.assignedTo && <p className="small muted">Assigned to {r.assignedTo.name}</p>}
      {r.media?.length > 0 && <Gallery media={r.media} />}
      {r.status === 'Needs More Info' && role === 'citizen' && (
        <div className="inline-form"><p className="small error">Officer asks: {r.reviewNote}</p>
          <textarea rows="2" placeholder="Your reply" value={text} onChange={(e) => setText(e.target.value)} /><button className="btn" onClick={reply}>Send reply</button></div>
      )}
      {r.status === 'Rejected' && <p className="small error">Rejected: {r.reviewNote}</p>}
      {r.fine && <p className="small">Fine issued by officer: <span className="mono">{r.fine.fineNumber}</span> (₹{r.fine.amount})</p>}
      {open && (
        <>
          {r.description && <p className="small">{r.description}</p>}
          {r.lat && <p className="small muted">GPS: {r.lat.toFixed(5)}, {r.lng.toFixed(5)} · <a href={`https://maps.google.com/?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer">open map</a></p>}
          {r.comments?.map((c, i) => <p key={i} className="small">Reporter: {c.text}</p>)}
          <ul className="timeline">{r.history?.map((h, i) => <li key={i}><b>{h.status}</b> · {dt(h.at)}{h.note ? ` — ${h.note}` : ''}</li>)}</ul>
          {canReview && (
            <div className="inline-form">
              <div className="grid2">
                <label>Fine to issue (₹) — suggested from state schedule, you can change it<input type="number" min="1" value={rv.amount} onChange={(e) => setRv({ ...rv, amount: e.target.value })} /></label>
                <label>Section / Act reference<input placeholder="e.g. MV Act 183" value={rv.section} onChange={(e) => setRv({ ...rv, section: e.target.value })} /></label>
              </div>
              <textarea rows="2" placeholder="Note (required to reject or request info)" value={rv.note} onChange={(e) => setRv({ ...rv, note: e.target.value })} />
              <div className="row wrap">
                {r.status === 'Submitted' && <button className="btn ghost" disabled={busy} onClick={() => act('start')}>Start review</button>}
                <button className="btn" disabled={busy} onClick={() => { if (window.confirm(`Evidence verified? This will issue a fine of ₹${rv.amount} to vehicle ${r.vehicleNumber}.`)) act('validate'); }}>Verify evidence &amp; issue fine</button>
                <button className="btn ghost" disabled={busy} onClick={() => act('info')}>Request info</button>
                <button className="btn danger" disabled={busy} onClick={() => act('reject')}>Reject</button>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}
