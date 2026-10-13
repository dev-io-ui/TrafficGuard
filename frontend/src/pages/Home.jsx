import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function CountUp({ to, suffix = '' }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf; const t0 = performance.now();
    const tick = (t) => { const p = Math.min((t - t0) / 1500, 1); setN(Math.round(to * p)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n.toLocaleString()}{suffix}</>;
}

function Ticket() {
  const [flip, setFlip] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef();
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -14, y: ((e.clientX - r.left) / r.width - 0.5) * 14 });
  };
  return (
    <div className="ticket-wrap" ref={ref} onMouseMove={move} onMouseLeave={() => setTilt({ x: 0, y: 0 })} onClick={() => setFlip(!flip)}>
      <div className="ticket" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (flip ? 180 : 0)}deg)` }}>
        <div className="face front">
          <small>TRAFFIC CITATION</small>
          <h3 className="mono">RW-2026-00417</h3>
          <p>Speeding · MH 12 AB 3456</p>
          <p className="amber big">₹1,000</p>
          <small>Click to flip</small>
        </div>
        <div className="face back">
          <small>STATUS</small>
          <h3>PENDING</h3>
          <p>Pay online in seconds from your driver dashboard.</p>
          <small>Click to flip back</small>
        </div>
      </div>
    </div>
  );
}

function SearchBox() {
  const nav = useNavigate();
  const [mode, setMode] = useState('challan');
  const [q, setQ] = useState('');
  const go = (e) => { e.preventDefault(); if (q.trim()) nav(`${mode === 'challan' ? '/search' : '/receipts'}?q=${encodeURIComponent(q.trim())}`); };
  return (
    <form className="searchcard" onSubmit={go}>
      <div className="tabs">
        <button type="button" className={mode === 'challan' ? 'active' : ''} onClick={() => setMode('challan')}>Check / pay challan</button>
        <button type="button" className={mode === 'receipt' ? 'active' : ''} onClick={() => setMode('receipt')}>Find receipt</button>
      </div>
      <div className="searchrow">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={mode === 'challan' ? 'Vehicle number or chassis number' : 'Receipt no., payment ID or challan no.'} />
        <button className="btn">Search</button>
      </div>
      <p className="muted small">{mode === 'challan' ? 'No login needed — check pending challans and pay online.' : 'Search after payment using your receipt number or payment ID.'}</p>
    </form>
  );
}

const ROLES = {
  Citizen: ['Report violations with photo and video evidence', 'Track your report from review to decision', 'See fines on your vehicles, pay online, download receipts, file appeals'],
  Officer: ['Review reports from your district with an evidence viewer', 'Validate, reject or request more information', 'Issue fines from the state fine schedule'],
  Staff: ['Supervisors decide appeals; finance handles payments and refunds', 'Regional admins manage officers and the fine schedule for their state', 'Super admins oversee everything with a full audit log'],
};

export default function Home() {
  const [tab, setTab] = useState('Citizen');
  return (
    <main>
      <section className="hero">
        <div>
          <h1>See it. Report it.<br /><span className="amber">On the record.</span></h1>
          <p className="lead">Citizens report violations with photo and video evidence, officers validate them region by region, and owners pay fines online with instant receipts.</p>
          <SearchBox />
          <div className="row"><Link className="btn" to="/register">Report a violation</Link><Link className="btn ghost" to="/login">Login</Link></div>
        </div>
        <Ticket />
        <div className="road" aria-hidden="true" />
      </section>
      <section className="stats">
        <div><b><CountUp to={10} /></b><span>Violation types</span></div>
        <div><b><CountUp to={3} /></b><span>User roles</span></div>
        <div><b><CountUp to={24} suffix="/7" /></b><span>Online access</span></div>
        <div><b><CountUp to={100} suffix="%" /></b><span>Evidence-backed</span></div>
      </section>
      <section className="roles">
        <div className="tabs">{Object.keys(ROLES).map((r) => <button key={r} className={tab === r ? 'active' : ''} onClick={() => setTab(r)}>{r}</button>)}</div>
        <ul key={tab}>{ROLES[tab].map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
      <section className="steps">
        {[['1', 'Report', 'Snap photos or record video and pin the exact region.'], ['2', 'Verify', 'A district officer reviews the evidence.'], ['3', 'Fine', 'Verified reports become a fine on the vehicle owner.'], ['4', 'Pay', 'Pay online and download your receipt.']].map(([n, t, d]) => (
          <div key={n} className="step"><span>{n}</span><h4>{t}</h4><p>{d}</p></div>
        ))}
      </section>
    </main>
  );
}
