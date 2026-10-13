// import { useEffect, useState } from 'react';
// import { Link, useSearchParams } from 'react-router-dom';
// import api, { errMsg } from '../api/axios';
// import { useToast } from '../context/ToastContext';
// import { Badge, dt, money } from './dash/ui';

// function PayDialog({ fine, onClose, onPaid }) {
//   const toast = useToast();
//   const [f, setF] = useState({ payerName: '', payerPhone: '' });
//   const [busy, setBusy] = useState(false);
//   const [done, setDone] = useState(null);
//   const pay = async (e) => {
//     e.preventDefault(); setBusy(true);
//     try { const r = await api.post(`/public/fines/${fine.id}/pay`, { ...f, method: 'Mock Gateway' }); setDone(r.data.receipt); toast('Payment successful'); onPaid(); }
//     catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
//   };
//   return (
//     <div className="overlay" onClick={onClose}>
//       <div className="modal" onClick={(e) => e.stopPropagation()}>
//         {done ? (
//           <div className="success">
//             <div className="tick">✓</div>
//             <h3>Payment complete</h3>
//             <dl className="summary">
//               <dt>Receipt no.</dt><dd className="mono">{done.receiptNumber}</dd>
//               <dt>Payment ID</dt><dd className="mono">{done.paymentId}</dd>
//               <dt>Amount paid</dt><dd><b>{money(done.totalPaid)}</b></dd>
//             </dl>
//             <p className="muted small">Save these numbers — you can search your receipt anytime with either one.</p>
//             <div className="row center-row"><Link className="btn" to={`/receipts?q=${done.receiptNumber}`}>View receipt</Link><button className="btn ghost" onClick={onClose}>Close</button></div>
//           </div>
//         ) : (
//           <form onSubmit={pay} className="stack">
//             <h3>Pay challan</h3>
//             <dl className="summary">
//               <dt>Challan</dt><dd className="mono">{fine.fineNumber}</dd>
//               <dt>Vehicle</dt><dd className="mono">{fine.vehicleNumber}</dd>
//               <dt>Violation</dt><dd>{fine.violationType}</dd>
//               <dt>Fine</dt><dd>{money(fine.amount)}</dd>
//               {fine.lateFee > 0 && (<><dt>Late fee</dt><dd>{money(fine.lateFee)}</dd></>)}
//               <dt>Total</dt><dd><b>{money(fine.totalDue)}</b></dd>
//             </dl>
//             <label>Your name<input required value={f.payerName} onChange={(e) => setF({ ...f, payerName: e.target.value })} /></label>
//             <label>Mobile (optional)<input inputMode="numeric" maxLength={10} pattern="\d{10}" value={f.payerPhone} onChange={(e) => setF({ ...f, payerPhone: e.target.value.replace(/\D/g, '') })} /></label>
//             <p className="muted small">Demo gateway — no real money is charged.</p>
//             <div className="row"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={busy}>{busy ? 'Processing…' : `Pay ${money(fine.totalDue)}`}</button></div>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }

// export default function Search() {
//   const [sp, setSp] = useSearchParams();
//   const term = sp.get('q') || '';
//   const [q, setQ] = useState(term);
//   const [res, setRes] = useState(null);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [paying, setPaying] = useState(null);

//   const run = async (t) => {
//     setLoading(true); setError('');
//     try { setRes((await api.get('/public/search', { params: { q: t } })).data); }
//     catch (e) { setRes(null); setError(errMsg(e)); } finally { setLoading(false); }
//   };
//   useEffect(() => { setQ(term); if (term) run(term); else setRes(null); }, [term]); // eslint-disable-line

//   return (
//     <main className="narrow">
//       <h2>Check &amp; pay challan</h2>
//       <p className="muted">No login needed. Search by vehicle number, chassis number or challan number.</p>
//       <form className="searchrow big-search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) setSp({ q: q.trim() }); }}>
//         <input autoFocus placeholder="e.g. TS09AB1234 or chassis no." value={q} onChange={(e) => setQ(e.target.value)} />
//         <button className="btn" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
//       </form>
//       {error && <p className="error">{error}</p>}
//       {res && !res.found && <p className="muted empty">No challans found for “{term}”. Please check the number and try again.</p>}
//       {res?.found && (
//         <>
//           <div className="card vehicle-head">
//             <div><p className="muted small">Vehicle</p><h3 className="mono">{res.vehicle.regNo}</h3>
//               <p className="small muted">{res.vehicle.type || 'Vehicle'}{res.vehicle.ownerName ? ` · Owner ${res.vehicle.ownerName}` : ''}{!res.vehicle.registered && ' · not in registry'}</p></div>
//             <div className="right"><p className="muted small">Total unpaid</p><b className="amber big">{money(res.totalUnpaid)}</b></div>
//           </div>
//           {!res.fines.length && <p className="muted empty">No challans on this vehicle. 🎉</p>}
//           <div className="list">
//             {res.fines.map((f) => (
//               <article key={f.id} className="vcard col">
//                 <div className="between"><h4>{f.violationType} <Badge s={f.status} /></h4><b className="amber">{money(f.status === 'Unpaid' ? f.totalDue : f.amount)}</b></div>
//                 <p className="muted small"><span className="mono">{f.fineNumber}</span> · {f.district}, {f.state} {f.pincode} · issued {dt(f.issuedOn)}</p>
//                 {f.status === 'Unpaid' && <p className="small">Due {dt(f.dueDate)}{f.lateFee > 0 && <span className="error"> · late fee {money(f.lateFee)}</span>}</p>}
//                 {f.section && <p className="small muted">{f.section}</p>}
//                 <div className="row wrap">
//                   {f.status === 'Unpaid' && <button className="btn" onClick={() => setPaying(f)}>Pay now</button>}
//                   {f.receiptNumber && <Link className="btn ghost" to={`/receipts?q=${f.receiptNumber}`}>View receipt</Link>}
//                   {f.status === 'Disputed' && <span className="muted small">Under appeal — payment paused</span>}
//                 </div>
//               </article>
//             ))}
//           </div>
//         </>
//       )}
//       {paying && <PayDialog fine={paying} onClose={() => setPaying(null)} onPaid={() => run(term)} />}
//     </main>
//   );
// }


import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Badge, Gallery, dt, money } from './dash/ui';

function PayDialog({ fine, onClose, onPaid }) {
  const toast = useToast();
  const [f, setF] = useState({ payerName: '', payerPhone: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const pay = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await api.post(`/public/fines/${fine.id}/pay`, { ...f, method: 'Mock Gateway' }); setDone(r.data.receipt); toast('Payment successful'); onPaid(); }
    catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="success">
            <div className="tick">✓</div>
            <h3>Payment complete</h3>
            <dl className="summary">
              <dt>Receipt no.</dt><dd className="mono">{done.receiptNumber}</dd>
              <dt>Payment ID</dt><dd className="mono">{done.paymentId}</dd>
              <dt>Amount paid</dt><dd><b>{money(done.totalPaid)}</b></dd>
            </dl>
            <p className="muted small">Save these numbers — you can search your receipt anytime with either one.</p>
            <div className="row center-row"><Link className="btn" to={`/receipts?q=${done.receiptNumber}`}>View receipt</Link><button className="btn ghost" onClick={onClose}>Close</button></div>
          </div>
        ) : (
          <form onSubmit={pay} className="stack">
            <h3>Pay challan</h3>
            <dl className="summary">
              <dt>Challan</dt><dd className="mono">{fine.fineNumber}</dd>
              <dt>Vehicle</dt><dd className="mono">{fine.vehicleNumber}</dd>
              <dt>Violation</dt><dd>{fine.violationType}</dd>
              {fine.officer && (<><dt>Issued by</dt><dd>{fine.officer.name}</dd></>)}
              <dt>Location</dt><dd>{[fine.incident?.area, fine.district, fine.state].filter(Boolean).join(', ')}</dd>
              <dt>Fine</dt><dd>{money(fine.amount)}</dd>
              {fine.lateFee > 0 && (<><dt>Late fee</dt><dd>{money(fine.lateFee)}</dd></>)}
              <dt>Total</dt><dd><b>{money(fine.totalDue)}</b></dd>
            </dl>
            <label>Your name<input required value={f.payerName} onChange={(e) => setF({ ...f, payerName: e.target.value })} /></label>
            <label>Mobile (optional)<input inputMode="numeric" maxLength={10} pattern="\d{10}" value={f.payerPhone} onChange={(e) => setF({ ...f, payerPhone: e.target.value.replace(/\D/g, '') })} /></label>
            <p className="muted small">Demo gateway — no real money is charged.</p>
            <div className="row"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={busy}>{busy ? 'Processing…' : `Pay ${money(fine.totalDue)}`}</button></div>
          </form>
        )}
      </div>
    </div>
  );
}

function FineRow({ f, onPay }) {
  const [open, setOpen] = useState(f.status === 'Unpaid'); // pending challans show their proof up front
  const i = f.incident, o = f.officer;
  return (
    <article className="vcard col">
      <div className="between"><h4>{f.violationType} <Badge s={f.status} /></h4><b className="amber">{money(f.status === 'Unpaid' ? f.totalDue : f.amount)}</b></div>
      <p className="muted small"><span className="mono">{f.fineNumber}</span> · {f.district}, {f.state} {f.pincode} · issued {dt(f.issuedOn)}</p>
      {f.status === 'Unpaid' && <p className="small">Due {dt(f.dueDate)}{f.lateFee > 0 && <span className="error"> · late fee {money(f.lateFee)}</span>}</p>}
      <button type="button" className="btn ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setOpen(!open)}>{open ? 'Hide details' : 'View details & proof'}</button>
      {open && (
        <div className="inline-form">
          <dl className="summary left">
            <dt>Vehicle</dt><dd className="mono">{f.vehicleNumber}</dd>
            <dt>Violation</dt><dd>{f.violationType}{f.section ? ` · ${f.section}` : ''}</dd>
            <dt>Incident time</dt><dd>{dt(i?.occurredAt)}</dd>
            <dt>Location</dt><dd>{[i?.area, f.district, f.state].filter(Boolean).join(', ')} {f.pincode}
              {i?.lat != null && <> · <a href={`https://maps.google.com/?q=${i.lat},${i.lng}`} target="_blank" rel="noreferrer">view on map</a></>}</dd>
            <dt>Verified by</dt><dd>{o ? `${o.name}${o.badgeNumber ? ` (Badge ${o.badgeNumber})` : ''}${o.station ? ` · ${o.station}` : ''}` : '—'}</dd>
            <dt>Issued on</dt><dd>{dt(f.issuedOn)}</dd>
            {i?.description && (<><dt>Notes</dt><dd>{i.description}</dd></>)}
          </dl>
          <p className="label">Evidence</p>
          {f.evidence?.length ? <Gallery media={f.evidence} /> : <p className="muted small">No evidence files attached.</p>}
          <p className="muted small">Think this is a mistake? Log in with the owner account and use “Dispute” on the challan.</p>
        </div>
      )}
      <div className="row wrap">
        {f.status === 'Unpaid' && <button className="btn" onClick={() => onPay(f)}>Pay now</button>}
        {f.receiptNumber && <Link className="btn ghost" to={`/receipts?q=${f.receiptNumber}`}>View receipt</Link>}
        {f.status === 'Disputed' && <span className="muted small">Under appeal — payment paused</span>}
      </div>
    </article>
  );
}

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const term = sp.get('q') || '';
  const [q, setQ] = useState(term);
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(null);

  const run = async (t) => {
    setLoading(true); setError('');
    try { setRes((await api.get('/public/search', { params: { q: t } })).data); }
    catch (e) { setRes(null); setError(errMsg(e)); } finally { setLoading(false); }
  };
  useEffect(() => { setQ(term); if (term) run(term); else setRes(null); }, [term]); // eslint-disable-line

  return (
    <main className="narrow">
      <h2>Check &amp; pay challan</h2>
      <p className="muted">No login needed. Search by vehicle number, chassis number or challan number.</p>
      <form className="searchrow big-search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) setSp({ q: q.trim() }); }}>
        <input autoFocus placeholder="e.g. TS09AB1234 or chassis no." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      {res && !res.found && <p className="muted empty">No challans found for “{term}”. Please check the number and try again.</p>}
      {res?.found && (
        <>
          <div className="card vehicle-head">
            <div><p className="muted small">Vehicle</p><h3 className="mono">{res.vehicle.regNo}</h3>
              <p className="small muted">{res.vehicle.type || 'Vehicle'}{res.vehicle.ownerName ? ` · Owner ${res.vehicle.ownerName}` : ''}{!res.vehicle.registered && ' · not in registry'}</p></div>
            <div className="right"><p className="muted small">Total unpaid</p><b className="amber big">{money(res.totalUnpaid)}</b></div>
          </div>
          {!res.fines.length && <p className="muted empty">No challans on this vehicle. 🎉</p>}
          <div className="list">
            {res.fines.map((f) => <FineRow key={f.id} f={f} onPay={setPaying} />)}
          </div>
        </>
      )}
      {paying && <PayDialog fine={paying} onClose={() => setPaying(null)} onPaid={() => run(term)} />}
    </main>
  );
}
