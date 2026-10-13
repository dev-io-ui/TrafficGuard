// import { useState } from 'react';
// import { Link } from 'react-router-dom';
// import api, { errMsg } from '../../api/axios';
// import { useToast } from '../../context/ToastContext';
// import PayModal from '../../components/PayModal';
// import { Badge, Gallery, dt, money } from './ui';

// export default function FineCard({ fine, role, onChange }) {
//   const toast = useToast();
//   const [paying, setPaying] = useState(false);
//   const [form, setForm] = useState(null); // 'dispute' | 'decide' | 'refund'
//   const [f, setF] = useState({ reason: '', action: 'uphold', note: '', newAmount: '' });
//   const [busy, setBusy] = useState(false);

//   const submit = async (e) => {
//     e.preventDefault(); setBusy(true);
//     try {
//       if (form === 'dispute') await api.put(`/fines/${fine._id}/dispute`, { reason: f.reason });
//       if (form === 'decide') await api.put(`/fines/${fine._id}/decision`, { action: f.action, note: f.note, newAmount: f.newAmount });
//       if (form === 'refund') await api.put(`/fines/${fine._id}/refund`, { reason: f.reason });
//       toast('Done'); setForm(null); onChange();
//     } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
//   };

//   return (
//     <article className="vcard col">
//       <div className="between">
//         <h4>{fine.violationType} <Badge s={fine.status} /></h4>
//         <b className="amber">{money(fine.status === 'Unpaid' ? fine.totalDue : fine.amount)}</b>
//       </div>
//       <p className="muted small"><span className="mono">{fine.fineNumber}</span> · <span className="mono">{fine.vehicleNumber}</span> · {fine.district}, {fine.state} {fine.pincode}</p>
//       <p className="small">Issued by {fine.officer?.name}{fine.officer?.badgeNumber ? ` (#${fine.officer.badgeNumber})` : ''} on {dt(fine.createdAt)}
//         {fine.status === 'Unpaid' && <> · due <b>{dt(fine.dueDate)}</b>{fine.lateFee > 0 && <span className="error"> · late fee {money(fine.lateFee)}</span>}</>}</p>
//       {!fine.owner && <p className="small muted">Unclaimed — vehicle owner not registered yet.</p>}
//       {role !== 'citizen' && fine.owner && <p className="small">Owner: {fine.owner.name} ({fine.owner.email})</p>}
//       <Gallery media={fine.report?.media} />
//       {fine.dispute?.reason && <p className="small">Appeal: “{fine.dispute.reason}”{fine.dispute.decision && <> — <b>{fine.dispute.decision}</b>: {fine.dispute.note}</>}</p>}
//       {fine.refund?.reason && <p className="small">Refunded: {fine.refund.reason}</p>}
//       {fine.receiptNumber && <p className="small mono">{fine.receiptNumber}</p>}

//       <div className="row wrap">
//         {role === 'citizen' && fine.status === 'Unpaid' && (<><button className="btn" onClick={() => setPaying(true)}>Pay fine</button><button className="btn ghost" onClick={() => setForm('dispute')}>Dispute</button></>)}
//         {(fine.status === 'Paid' || fine.status === 'Refunded') && fine.receiptNumber && role === 'citizen' && <Link className="btn ghost" to={`/receipt/${fine._id}`}>Receipt</Link>}
//         {role === 'supervisor' && fine.status === 'Disputed' && <button className="btn" onClick={() => setForm('decide')}>Decide appeal</button>}
//         {(role === 'finance' || role === 'admin') && fine.status === 'Paid' && <button className="btn ghost" onClick={() => setForm('refund')}>Refund</button>}
//       </div>

//       {form && (
//         <form className="inline-form" onSubmit={submit}>
//           {form === 'decide' ? (
//             <>
//               <select value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })}><option value="uphold">Uphold fine</option><option value="reduce">Reduce fine</option><option value="waive">Waive fine</option></select>
//               {f.action === 'reduce' && <input type="number" required min="1" max={fine.amount - 1} placeholder="New amount" value={f.newAmount} onChange={(e) => setF({ ...f, newAmount: e.target.value })} />}
//               <textarea required rows="2" placeholder="Written reason" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
//             </>
//           ) : <textarea required rows="2" placeholder={form === 'dispute' ? 'Why do you dispute this fine?' : 'Reason for refund'} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />}
//           <div className="row"><button className="btn" disabled={busy}>Submit</button><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button></div>
//         </form>
//       )}
//       {paying && <PayModal fine={fine} onClose={() => { setPaying(false); onChange(); }} />}
//     </article>
//   );
// }


import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import PayModal from '../../components/PayModal';
import { Badge, Gallery, dt, money } from './ui';

export default function FineCard({ fine, role, onChange }) {
  const toast = useToast();
  const [paying, setPaying] = useState(false);
  const [form, setForm] = useState(null); // 'dispute' | 'decide' | 'refund'
  const [f, setF] = useState({ reason: '', action: 'uphold', note: '', newAmount: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (form === 'dispute') await api.put(`/fines/${fine._id}/dispute`, { reason: f.reason });
      if (form === 'decide') await api.put(`/fines/${fine._id}/decision`, { action: f.action, note: f.note, newAmount: f.newAmount });
      if (form === 'refund') await api.put(`/fines/${fine._id}/refund`, { reason: f.reason });
      toast('Done'); setForm(null); onChange();
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };

  return (
    <article className="vcard col">
      <div className="between">
        <h4>{fine.violationType} <Badge s={fine.status} /></h4>
        <b className="amber">{money(fine.status === 'Unpaid' ? fine.totalDue : fine.amount)}</b>
      </div>
      <p className="muted small"><span className="mono">{fine.fineNumber}</span> · <span className="mono">{fine.vehicleNumber}</span> · {fine.district}, {fine.state} {fine.pincode}</p>
      <p className="small">Issued by {fine.officer?.name}{fine.officer?.badgeNumber ? ` (#${fine.officer.badgeNumber})` : ''} on {dt(fine.createdAt)}
        {fine.status === 'Unpaid' && <> · due <b>{dt(fine.dueDate)}</b>{fine.lateFee > 0 && <span className="error"> · late fee {money(fine.lateFee)}</span>}</>}</p>
      {fine.report && (
        <p className="small">Incident: {dt(fine.report.occurredAt)}{fine.report.area ? ` · ${fine.report.area}` : ''}{fine.report.description ? ` — ${fine.report.description}` : ''}</p>
      )}
      {!fine.owner && <p className="small muted">Unclaimed — vehicle owner not registered yet.</p>}
      {role !== 'citizen' && fine.owner && <p className="small">Owner: {fine.owner.name} ({fine.owner.email})</p>}
      <Gallery media={fine.report?.media} />
      {fine.dispute?.reason && <p className="small">Appeal: “{fine.dispute.reason}”{fine.dispute.decision && <> — <b>{fine.dispute.decision}</b>: {fine.dispute.note}</>}</p>}
      {fine.refund?.reason && <p className="small">Refunded: {fine.refund.reason}</p>}
      {fine.receiptNumber && <p className="small mono">{fine.receiptNumber}</p>}

      <div className="row wrap">
        {role === 'citizen' && fine.status === 'Unpaid' && (<><button className="btn" onClick={() => setPaying(true)}>Pay fine</button><button className="btn ghost" onClick={() => setForm('dispute')}>Dispute</button></>)}
        {(fine.status === 'Paid' || fine.status === 'Refunded') && fine.receiptNumber && role === 'citizen' && <Link className="btn ghost" to={`/receipt/${fine._id}`}>Receipt</Link>}
        {role === 'supervisor' && fine.status === 'Disputed' && <button className="btn" onClick={() => setForm('decide')}>Decide appeal</button>}
        {(role === 'finance' || role === 'admin') && fine.status === 'Paid' && <button className="btn ghost" onClick={() => setForm('refund')}>Refund</button>}
      </div>

      {form && (
        <form className="inline-form" onSubmit={submit}>
          {form === 'decide' ? (
            <>
              <select value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })}><option value="uphold">Uphold fine</option><option value="reduce">Reduce fine</option><option value="waive">Waive fine</option></select>
              {f.action === 'reduce' && <input type="number" required min="1" max={fine.amount - 1} placeholder="New amount" value={f.newAmount} onChange={(e) => setF({ ...f, newAmount: e.target.value })} />}
              <textarea required rows="2" placeholder="Written reason" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            </>
          ) : <textarea required rows="2" placeholder={form === 'dispute' ? 'Why do you dispute this fine?' : 'Reason for refund'} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />}
          <div className="row"><button className="btn" disabled={busy}>Submit</button><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
      {paying && <PayModal fine={fine} onClose={() => { setPaying(false); onChange(); }} />}
    </article>
  );
}
