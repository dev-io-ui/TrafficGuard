import { useState } from 'react';
import FineCard from './FineCard';
import { Pager, Stats, exportCsv, money, useList, useStats } from './ui';

export default function Finance() {
  const [status, setStatus] = useState('Paid');
  const [q, setQ] = useState('');
  const [stats, reloadStats] = useStats();
  const fines = useList('/fines', { status, q });
  const refresh = () => { fines.reload(); reloadStats(); };
  const csv = () => exportCsv('payments.csv', fines.items.map((f) => ({ fine: f.fineNumber, receipt: f.receiptNumber || '', vehicle: f.vehicleNumber, type: f.violationType, state: f.state, district: f.district,
    status: f.status, amount: f.amount, paid: f.payment?.amount || '', paidOn: f.payment?.date || '' })));
  return (
    <>
      <Stats items={[['Revenue', money(stats?.revenue)], ['Paid fines', stats?.fines.byStatus.Paid], ['Unpaid', stats?.fines.byStatus.Unpaid], ['Refunded', stats?.fines.byStatus.Refunded], ['Outstanding', money(stats?.fines.outstanding)]]} />
      <div className="row wrap filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>{['Paid', 'Unpaid', 'Disputed', 'Refunded', 'Waived', ''].map((s) => <option key={s} value={s}>{s || 'All'}</option>)}</select>
        <input placeholder="Fine no. or vehicle" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn ghost" onClick={csv}>Export this page (CSV)</button>
      </div>
      <div className="list">{fines.items.map((f) => <FineCard key={f._id} fine={f} role="finance" onChange={refresh} />)}</div>
      {!fines.items.length && !fines.loading && <p className="muted empty">No records.</p>}
      <Pager page={fines.page} pages={fines.pages} onPage={fines.setPage} />
    </>
  );
}
