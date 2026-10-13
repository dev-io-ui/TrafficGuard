import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { dt, money } from './dash/ui';

export default function Receipt() {
  const { id } = useParams();
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get(`/fines/${id}`).then((r) => setF(r.data.fine)).catch((e) => setErr(errMsg(e))); }, [id]);
  if (err) return <main><p className="error">{err}</p></main>;
  if (!f) return <div className="center muted">Loading…</div>;
  if (!f.receiptNumber) return <main><p>This fine has not been paid yet.</p><Link to="/dashboard">Back</Link></main>;
  const p = f.payment || {};
  return (
    <main className="auth wide">
      <div className="card receipt" id="receipt">
        <h2>RoadWatch — Payment Receipt</h2>
        <p className="mono">{f.receiptNumber}</p>
        <dl className="summary">
          <dt>Paid by</dt><dd>{p.payerName || f.owner?.name}</dd>
          <dt>Fine number</dt><dd className="mono">{f.fineNumber}</dd>
          <dt>Vehicle</dt><dd className="mono">{f.vehicleNumber}</dd>
          <dt>Violation</dt><dd>{f.violationType}</dd>
          <dt>Region</dt><dd>{f.district}, {f.state} {f.pincode}</dd>
          <dt>Fine amount</dt><dd>{money(f.amount)}</dd>
          <dt>Late fee</dt><dd>{money(p.lateFee)}</dd>
          <dt>Total paid</dt><dd><b>{money(p.amount)}</b></dd>
          <dt>Payment ID</dt><dd className="mono">{p.reference}</dd>
          <dt>Method</dt><dd>{p.method}</dd>
          <dt>Paid on</dt><dd>{dt(p.date)}</dd>
          <dt>Status</dt><dd>{f.status}</dd>
        </dl>
        <p className="muted small">Verify at {window.location.origin}/verify/{f.receiptNumber}</p>
      </div>
      <div className="row noprint"><button className="btn" onClick={() => window.print()}>Print / Save as PDF</button><Link className="btn ghost" to="/dashboard">Back</Link></div>
    </main>
  );
}
