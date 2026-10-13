import { useState } from 'react';
import FineCard from './FineCard';
import ReportCard from './ReportCard';
import { Pager, Stats, Tabs, useList, useStats } from './ui';

export default function Supervisor() {
  const [tab, setTab] = useState('appeals');
  const [stats, reloadStats] = useStats();
  const appeals = useList('/fines', { status: 'Disputed' });
  const fines = useList('/fines');
  const [rs, setRs] = useState('open');
  const reports = useList('/reports', { status: rs });
  const refresh = () => { appeals.reload(); fines.reload(); reports.reload(); reloadStats(); };
  const L = ({ d, render }) => (<><div className="list">{d.items.map(render)}</div>{!d.items.length && !d.loading && <p className="muted empty">Nothing to show.</p>}<Pager page={d.page} pages={d.pages} onPage={d.setPage} /></>);
  return (
    <>
      <Stats items={[['Open appeals', stats?.fines.byStatus.Disputed], ['Fines in district', stats?.fines.total], ['Reports', stats?.reports.total], ['Revenue ₹', stats?.revenue]]} />
      <Tabs value={tab} onChange={setTab} tabs={[['appeals', 'Appeals'], ['fines', 'All fines'], ['reports', 'Review reports']]} />
      {tab === 'appeals' && <L d={appeals} render={(f) => <FineCard key={f._id} fine={f} role="supervisor" onChange={refresh} />} />}
      {tab === 'fines' && <L d={fines} render={(f) => <FineCard key={f._id} fine={f} role="supervisor" onChange={refresh} />} />}
      {tab === 'reports' && <div className="row filters"><select value={rs} onChange={(e) => setRs(e.target.value)}><option value="open">Pending review</option><option value="">All</option></select></div>}
      {tab === 'reports' && <L d={reports} render={(r) => <ReportCard key={r._id} r={r} role="supervisor" onChange={refresh} />} />}
    </>
  );
}
