import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { dt, money } from './dash/ui';

export default function ReceiptSearch() {
  const { number } = useParams();            // supports /verify/:number links
  const [sp, setSp] = useSearchParams();
  const term = sp.get('q') || number || '';
  const [q, setQ] = useState(term);
  const [r, setR] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async (t) => {
    setLoading(true); setError(''); setR(null);
    try { setR((await api.get(`/public/receipt/${encodeURIComponent(t)}`)).data.receipt); }
    catch (e) { setError(e?.response?.status === 404 ? 'No receipt found. Check the receipt number, payment ID or challan number.' : errMsg(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { setQ(term); if (term) run(term); }, [term]); // eslint-disable-line

  return (
    <main className="narrow">
      <h2>Find your receipt</h2>
      <p className="muted">Search with your receipt number, payment ID or challan number. No login needed.</p>
      <form className="searchrow big-search noprint" onSubmit={(e) => { e.preventDefault(); if (q.trim()) setSp({ q: q.trim() }); }}>
        <input autoFocus placeholder="RCPT-…, PAY-… or RWF-…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      {r && (
        <>
          <div className="card receipt">
            <div className="between"><h2>RoadWatch — Payment Receipt</h2><span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span></div>
            <dl className="summary">
              <dt>Receipt no.</dt><dd className="mono">{r.receiptNumber}</dd>
              <dt>Payment ID</dt><dd className="mono">{r.paymentId}</dd>
              <dt>Challan no.</dt><dd className="mono">{r.fineNumber}</dd>
              <dt>Vehicle</dt><dd className="mono">{r.vehicleNumber}</dd>
              <dt>Violation</dt><dd>{r.violationType}</dd>
              <dt>Region</dt><dd>{r.district}, {r.state} {r.pincode}</dd>
              <dt>Paid by</dt><dd>{r.payerName || '—'}</dd>
              <dt>Fine amount</dt><dd>{money(r.fineAmount)}</dd>
              <dt>Late fee</dt><dd>{money(r.lateFee)}</dd>
              <dt>Total paid</dt><dd><b>{money(r.totalPaid)}</b></dd>
              <dt>Method</dt><dd>{r.method}</dd>
              <dt>Paid on</dt><dd>{dt(r.paidOn)}</dd>
            </dl>
          </div>
          <div className="row noprint"><button className="btn" onClick={() => window.print()}>Print / Save as PDF</button></div>
        </>
      )}
    </main>
  );
}
