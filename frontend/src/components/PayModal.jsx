import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { money } from '../pages/dash/ui';

export default function PayModal({ fine, onClose }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const toast = useToast();
  const pay = async () => {
    setBusy(true);
    try { setDone((await api.put(`/fines/${fine._id}/pay`, { method: 'Mock Gateway' })).data.fine); toast('Payment successful'); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="success">
            <div className="tick">✓</div>
            <h3>Payment complete</h3>
            <p className="muted small">Receipt</p><p className="mono">{done.receiptNumber}</p>
            <div className="row center-row"><Link className="btn" to={`/receipt/${done._id}`}>View receipt</Link><button className="btn ghost" onClick={onClose}>Close</button></div>
          </div>
        ) : (
          <>
            <h3>Confirm payment</h3>
            <dl className="summary">
              <dt>Fine no.</dt><dd className="mono">{fine.fineNumber}</dd>
              <dt>Violation</dt><dd>{fine.violationType}</dd>
              <dt>Vehicle</dt><dd className="mono">{fine.vehicleNumber}</dd>
              <dt>Fine</dt><dd>{money(fine.amount)}</dd>
              {fine.lateFee > 0 && (<><dt>Late fee</dt><dd>{money(fine.lateFee)}</dd></>)}
              <dt>Total</dt><dd><b>{money(fine.totalDue)}</b></dd>
            </dl>
            <p className="muted small">Demo gateway — no real money is charged. Connect Razorpay/Stripe in production.</p>
            <div className="row"><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={busy} onClick={pay}>{busy ? 'Processing…' : `Pay ${money(fine.totalDue)}`}</button></div>
          </>
        )}
      </div>
    </div>
  );
}
