import { useCallback, useEffect, useState } from 'react';
import api, { errMsg, fileUrl } from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export const Badge = ({ s }) => <span className={`badge ${String(s).toLowerCase().replace(/\s+/g, '-')}`}>{s}</span>;
export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const dt = (d) => (d ? new Date(d).toLocaleString() : '—');

export function Pager({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="row pager">
      <button className="btn ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ Prev</button>
      <span className="muted small">Page {page} of {pages}</span>
      <button className="btn ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next ›</button>
    </div>
  );
}

export function Stats({ items }) {
  return <div className="stats strip">{items.map(([k, v]) => <div key={k}><b>{v ?? 0}</b><span>{k}</span></div>)}</div>;
}

export function Tabs({ tabs, value, onChange }) {
  return <div className="tabs wrap">{tabs.map(([k, label]) => <button key={k} className={value === k ? 'active' : ''} onClick={() => onChange(k)}>{label}</button>)}</div>;
}

export function Gallery({ media = [] }) {
  const [open, setOpen] = useState(null);
  return (
    <>
      <div className="thumbs">
        {media.map((m, i) => (
          <div key={i} className="thumb" onClick={() => setOpen(m)}>
            {m.kind === 'video' ? <video src={fileUrl(m.url)} preload="metadata" /> : <img src={fileUrl(m.url)} alt="" />}
            {m.kind === 'video' && <span className="tag">VIDEO</span>}
          </div>
        ))}
      </div>
      {open && (
        <div className="overlay" onClick={() => setOpen(null)}>
          {open.kind === 'video' ? <video src={fileUrl(open.url)} controls autoPlay className="lightbox" onClick={(e) => e.stopPropagation()} /> : <img src={fileUrl(open.url)} alt="" className="lightbox" />}
        </div>
      )}
    </>
  );
}

// Fetch a paginated list (reports / fines / users / audit) with filters.
export function useList(path, params = {}) {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const key = JSON.stringify(params);
  const load = useCallback(async () => {
    setLoading(true);
    try { setData((await api.get(path, { params: { ...JSON.parse(key), page } })).data); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setLoading(false); }
  }, [path, key, page, toast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [key]);
  return { ...data, page, setPage, reload: load, loading };
}

export function useStats() {
  const [s, setS] = useState(null);
  const reload = useCallback(() => api.get('/stats').then((r) => setS(r.data)).catch(() => {}), []);
  useEffect(() => { reload(); }, [reload]);
  return [s, reload];
}

export function exportCsv(name, rows) {
  if (!rows.length) return;
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [Object.keys(rows[0]).join(','), ...rows.map((r) => Object.values(r).map(esc).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; a.click();
}
