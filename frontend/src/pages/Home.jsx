import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TrafficScene from '../components/TrafficScene';

function CountUp({ to, suffix = '', visible = true }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;

    let raf = 0;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / 1400, 1);
      setN(Math.round(to * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, visible]);

  return <>{n.toLocaleString()}{suffix}</>;
}

function Ticket() {
  const [flip, setFlip] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef();

  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - r.top) / r.height - 0.5) * -14,
      y: ((e.clientX - r.left) / r.width - 0.5) * 14,
    });
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

  const go = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`${mode === 'challan' ? '/search' : '/receipts'}?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form className="searchcard" data-scroll-float="0.2" data-search-mode={mode} onSubmit={go}>
      <div className="tabs">
        <button type="button" aria-pressed={mode === 'challan'} className={mode === 'challan' ? 'active' : ''} onClick={() => setMode('challan')}>Check / pay challan</button>
        <button type="button" aria-pressed={mode === 'receipt'} className={mode === 'receipt' ? 'active' : ''} onClick={() => setMode('receipt')}>Find receipt</button>
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

const STATS = [
  { value: 10, suffix: '', label: 'Violation types' },
  { value: 3, suffix: '', label: 'User roles' },
  { value: 24, suffix: '/7', label: 'Online access' },
  { value: 100, suffix: '%', label: 'Evidence-backed' },
];

const WORKFLOW = [
  ['1', 'Report', 'Snap photos or record video and pin the exact region.'],
  ['2', 'Review', 'A district officer validates the evidence and vehicle details.'],
  ['3', 'Issue fine', 'Verified reports become a fine linked to the vehicle owner.'],
  ['4', 'Pay', 'Pay online and download your receipt instantly.'],
];

const FEATURES = [
  ['Instant reporting', 'Capture the violation with geo location, photos, and video in seconds.'],
  ['Officer validation', 'District teams review and validate claims before any fine is issued.'],
  ['Smart payment', 'Track multiple challans, pay instantly, and download proof of payment.'],
  ['Audit ready', 'Every report, review, and payment stays tied to a verifiable record.'],
];

function StatCard({ value, suffix, label, visible }) {
  return (
    <div className="stat-card">
      <strong className="micro-reveal"><CountUp to={value} suffix={suffix} visible={visible} /></strong>
      <span className="micro-reveal">{label}</span>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState('Citizen');
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const node = statsRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setStatsVisible(true);
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('.reveal'));
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('visible', entry.isIntersecting);
        });
      },
      { threshold: 0.01, rootMargin: '0px 0px -2% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll('.micro-reveal'));
    if (!items.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
    );

    items.forEach((item, index) => {
      item.style.setProperty('--reveal-index', Math.min(index % 8, 7));
      observer.observe(item);
    });
    return () => observer.disconnect();
  }, [tab]);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll('[data-scroll-float]'));
    if (!items.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const centered = progress - 0.5;
        const intensity = Number(item.dataset.scrollFloat) || 1;
        item.style.setProperty('--scroll-float-y', `${centered * -30 * intensity}px`);
        item.style.setProperty('--scroll-float-rotate', `${centered * 4 * intensity}deg`);
      });
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main className="premium-home-shell">
      <section className="premium-hero reveal">
        <div className="premium-copy">
          <div className="hero-kicker micro-reveal" data-scroll-float="0.25">
            <span className="hero-kicker-dot" />
            INTELLIGENT TRAFFIC MANAGEMENT
          </div>

          <h1 className="micro-reveal" data-scroll-float="0.3">
            See it. Report it.<br />
            <span className="hero-accent">On the record.</span>
          </h1>

          <p className="lead micro-reveal" data-scroll-float="0.22">
            Citizens report violations with photo and video evidence, officers validate them region by region, and owners pay fines online with instant receipts.
          </p>

          <SearchBox />

          <div className="row premium-actions micro-reveal" data-scroll-float="0.3">
            <Link className="btn" to="/register">Report a violation <span aria-hidden="true">↗</span></Link>
            <Link className="btn ghost" to="/login">Login</Link>
          </div>
        </div>

        <div className="premium-visual">
          <div className="particle-field" aria-hidden="true">
            {Array.from({ length: 22 }, (_, index) => (
              <i
                key={index}
                style={{
                  '--particle-index': index,
                  '--particle-left': `${(index * 37 + 9) % 100}%`,
                  '--particle-top': `${(index * 61 + 13) % 100}%`,
                  '--particle-size': `${3 + (index % 3)}px`,
                  '--particle-duration': `${5 + (index % 5) * 1.2}s`,
                  '--particle-delay': `${index * -0.42}s`,
                }}
              />
            ))}
          </div>
          <div className="floating-badge badge-top micro-reveal" data-scroll-float="0.55">
            <span className="badge-ray" />
            <div>
              <small>Violation reported</small>
              <strong>12 mins ago</strong>
            </div>
          </div>

          <div className="floating-badge badge-right micro-reveal" data-scroll-float="0.55">
            <span className="badge-ray success" />
            <div>
              <small>Officer verified</small>
              <strong>97% confidence</strong>
            </div>
          </div>

          <div className="floating-badge badge-payment micro-reveal" data-scroll-float="0.55">
            <span className="payment-check" aria-hidden="true">✓</span>
            <div>
              <small>Payment complete</small>
              <strong>Receipt ready</strong>
            </div>
          </div>

          <TrafficScene />
        </div>
      </section>

      <section className="stats-panel reveal" ref={statsRef}>
        {STATS.map((item) => (
          <div key={item.label} data-scroll-float>
            <div className="micro-reveal" data-scroll-float="0.25">
              <StatCard value={item.value} suffix={item.suffix} label={item.label} visible={statsVisible} />
            </div>
          </div>
        ))}
      </section>

      <section className="workflow-panel reveal">
        <div className="section-heading">
          <p className="micro-reveal" data-scroll-float="0.2">How it works</p>
          <h2 className="micro-reveal" data-scroll-float="0.3">From report to receipt in a single efficient flow.</h2>
        </div>

        <div className="workflow-grid">
          {WORKFLOW.map(([stepNo, title, detail]) => (
            <div key={stepNo} className="workflow-card micro-reveal" data-scroll-float="0.35">
              <div className="workflow-step micro-reveal">{stepNo}</div>
              <h3 className="micro-reveal">{title}</h3>
              <p className="micro-reveal">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="roles-panel reveal">
        <div className="section-heading narrow">
          <p className="micro-reveal" data-scroll-float="0.2">Built for every stakeholder</p>
          <h2 className="micro-reveal" data-scroll-float="0.3">One traffic system, three confident roles.</h2>
        </div>

        <div className="tabs role-tabs micro-reveal" data-scroll-float="0.2">
          {Object.keys(ROLES).map((role) => (
            <button key={role} type="button" className={`micro-reveal${tab === role ? ' active' : ''}`} onClick={() => setTab(role)}>
              {role}
            </button>
          ))}
        </div>

        <div className="role-panel micro-reveal" data-scroll-float="0.3">
          <div className="role-intro">
            <div className="role-badge micro-reveal">{tab}</div>
            <h3 className="micro-reveal">{tab === 'Citizen' ? 'Public visibility' : tab === 'Officer' ? 'District review' : 'Operational oversight'}</h3>
          </div>
          <ul>
            {ROLES[tab].map((item) => (
              <li key={item} className="micro-reveal">{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="feature-panel reveal">
        <div className="section-heading narrow">
          <p className="micro-reveal" data-scroll-float="0.2">Why TrafficGuard</p>
          <h2 className="micro-reveal" data-scroll-float="0.3">Civil, transparent, and built for real-world enforcement.</h2>
        </div>

        <div className="feature-grid">
          {FEATURES.map(([title, description]) => (
            <div key={title} className="feature-card micro-reveal" data-scroll-float="0.35">
              <span className="feature-icon micro-reveal" aria-hidden="true">✓</span>
              <h3 className="micro-reveal">{title}</h3>
              <p className="micro-reveal">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-panel reveal" data-scroll-float="0.25">
        <div className="cta-copy">
          <p className="micro-reveal">Ready to modernize enforcement?</p>
          <h2 className="micro-reveal" data-scroll-float="0.25">Bring transparent traffic compliance to every city road.</h2>
        </div>

        <div className="cta-actions micro-reveal" data-scroll-float="0.2">
          <Link className="btn" to="/register">Create account</Link>
          <Link className="btn ghost" to="/login">Sign in</Link>
        </div>
      </section>

      <footer className="site-footer reveal">
        <div className="footer-brand">
          <span className="brand-mark mini"><i /> <i /> <i /></span>
          <span className="micro-reveal">TrafficGuard</span>
        </div>
        <div className="footer-links micro-reveal">
          <Link to="/search">Pay challan</Link>
          <Link to="/receipts">Find receipt</Link>
          <Link to="/login">Login</Link>
        </div>
      </footer>
    </main>
  );
}
