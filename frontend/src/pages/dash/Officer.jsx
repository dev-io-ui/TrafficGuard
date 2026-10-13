import { useState } from 'react';
import FineCard from './FineCard';
import ReportCard from './ReportCard';
import { Pager, Stats, Tabs, useList, useStats } from './ui';

export default function Officer() {
  const [tab, setTab] = useState('queue');
  const [status, setStatus] = useState('open');
  const [q, setQ] = useState('');
  const [stats, reloadStats] = useStats();
  const reports = useList('/reports', { status, q });
  const fines = useList('/fines');
  const refresh = () => { reports.reload(); fines.reload(); reloadStats(); };
  return (
    <>
      <Stats items={[['Reports in district', stats?.reports.total], ['Awaiting review', stats?.reports.byStatus.Submitted], ['Under review', stats?.reports.byStatus['Under Review']], ['Fines issued', stats?.fines.total], ['Validation rate %', stats?.reports.validationRate]]} />
      <Tabs value={tab} onChange={setTab} tabs={[['queue', 'Review queue'], ['fines', 'Fines issued']]} />
      {tab === 'queue' && (
        <>
          <div className="row wrap filters">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {[['open', 'Pending review'], ['Needs More Info', 'Needs more info'], ['Validated', 'Validated'], ['Rejected', 'Rejected'], ['', 'All statuses']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input placeholder="Search vehicle no." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="list">{reports.items.map((r) => <ReportCard key={r._id} r={r} role="officer" onChange={refresh} />)}</div>
          {!reports.items.length && !reports.loading && <p className="muted empty">Nothing in this queue.</p>}
          <Pager page={reports.page} pages={reports.pages} onPage={reports.setPage} />
        </>
      )}
      {tab === 'fines' && (<><div className="list">{fines.items.map((f) => <FineCard key={f._id} fine={f} role="officer" onChange={refresh} />)}</div><Pager page={fines.page} pages={fines.pages} onPage={fines.setPage} /></>)}
    </>
  );
}
