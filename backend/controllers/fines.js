// const Fine = require('../models/Fine');
// const FineSchedule = require('../models/FineSchedule');
// const Vehicle = require('../models/Vehicle');
// const audit = require('../utils/audit');
// const { TYPES, DEFAULT_FINES, DISPUTE_DAYS, regionScope, inScope, paging, genNo, normPlate } = require('../utils/constants');

// const view = (q) => q.populate('officer', 'name badgeNumber station').populate('owner', 'name email').populate('report', 'media occurredAt description area');
// const mineOrScope = (u) => (u.role === 'citizen' ? { owner: u._id } : regionScope(u));

// exports.list = async (req, res, next) => {
//   try {
//     const { page, limit, skip } = paging(req);
//     const f = mineOrScope(req.user);
//     if (req.query.status) f.status = req.query.status;
//     if (req.query.q) { const q = String(req.query.q).toUpperCase().replace(/[^A-Z0-9-]/g, ''); f.$or = [{ fineNumber: new RegExp(q) }, { vehicleNumber: new RegExp('^' + q.replace(/-/g, '')) }]; }
//     const [items, total] = await Promise.all([view(Fine.find(f).sort('-createdAt').skip(skip).limit(limit)), Fine.countDocuments(f)]);
//     res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
//   } catch (e) { next(e); }
// };

// async function load(req, res) {
//   const fine = await view(Fine.findById(req.params.id));
//   if (!fine) { res.status(404).json({ message: 'Fine not found' }); return null; }
//   const ok = req.user.role === 'citizen' ? fine.owner && String(fine.owner._id) === String(req.user._id) : inScope(req.user, fine);
//   if (!ok) { res.status(403).json({ message: 'You are not allowed to access this fine' }); return null; }
//   return fine;
// }

// exports.getOne = async (req, res, next) => { try { const f = await load(req, res); if (f) res.json({ fine: f }); } catch (e) { next(e); } };

// const payBlock = (f) => (f.status === 'Paid' ? 'This fine has already been paid' : f.status === 'Disputed' ? 'Payment is paused while an appeal is under review'
//   : f.status !== 'Unpaid' ? `This fine is ${f.status} and cannot be paid` : null);

// // Atomic: only one request can move a fine from Unpaid to Paid.
// async function settle(fine, payer, method) {
//   const late = fine.lateFee;
//   const payment = { reference: genNo('PAY'), method: method || 'Mock Gateway', amount: fine.amount + late, lateFee: late, date: new Date(), payerName: payer.name, payerPhone: payer.phone };
//   return Fine.findOneAndUpdate({ _id: fine._id, status: 'Unpaid' }, { $set: { payment, receiptNumber: genNo('RCPT'), status: 'Paid' } }, { new: true });
// }

// exports.pay = async (req, res, next) => {
//   try {
//     const fine = await Fine.findOne({ _id: req.params.id, owner: req.user._id });
//     if (!fine) return res.status(404).json({ message: 'Fine not found' });
//     const block = payBlock(fine);
//     if (block) return res.status(400).json({ message: block });
//     const done = await settle(fine, { name: req.user.name, phone: req.user.phone }, req.body.method);
//     if (!done) return res.status(400).json({ message: 'This fine has already been paid' });
//     res.json({ fine: await view(Fine.findById(done._id)) });
//   } catch (e) { next(e); }
// };

// exports.dispute = async (req, res, next) => {
//   try {
//     const fine = await Fine.findOne({ _id: req.params.id, owner: req.user._id });
//     if (!fine) return res.status(404).json({ message: 'Fine not found' });
//     if (fine.status !== 'Unpaid') return res.status(400).json({ message: 'Only unpaid fines can be disputed' });
//     if (Date.now() - fine.createdAt > DISPUTE_DAYS * 864e5) return res.status(400).json({ message: `The ${DISPUTE_DAYS}-day dispute window has closed` });
//     if (!req.body.reason?.trim()) return res.status(400).json({ message: 'Please give a reason' });
//     fine.status = 'Disputed'; fine.dispute = { reason: req.body.reason.trim(), at: new Date() };
//     await fine.save();
//     res.json({ fine });
//   } catch (e) { next(e); }
// };

// // Supervisor: uphold | reduce | waive
// exports.decide = async (req, res, next) => {
//   try {
//     const fine = await Fine.findById(req.params.id);
//     if (!fine) return res.status(404).json({ message: 'Fine not found' });
//     if (!inScope(req.user, fine)) return res.status(403).json({ message: 'Outside your jurisdiction' });
//     if (fine.status !== 'Disputed') return res.status(400).json({ message: 'This fine has no open appeal' });
//     const { action, note, newAmount } = req.body;
//     if (!note?.trim()) return res.status(400).json({ message: 'A written reason is required' });
//     if (action === 'uphold') { fine.status = 'Unpaid'; fine.dueDate = new Date(Date.now() + 7 * 864e5); }
//     else if (action === 'reduce') {
//       if (!(Number(newAmount) > 0 && Number(newAmount) < fine.amount)) return res.status(400).json({ message: 'New amount must be lower than the current fine' });
//       fine.amount = Number(newAmount); fine.status = 'Unpaid'; fine.dueDate = new Date(Date.now() + 7 * 864e5);
//     } else if (action === 'waive') fine.status = 'Waived';
//     else return res.status(400).json({ message: 'Invalid action' });
//     fine.dispute.decision = action; fine.dispute.note = note; fine.dispute.decidedBy = req.user._id; fine.dispute.decidedAt = new Date();
//     await fine.save();
//     audit(req, `appeal.${action}`, fine.fineNumber, { note, newAmount });
//     res.json({ fine });
//   } catch (e) { next(e); }
// };

// exports.refund = async (req, res, next) => {
//   try {
//     const fine = await Fine.findById(req.params.id);
//     if (!fine || fine.status !== 'Paid') return res.status(400).json({ message: 'Only paid fines can be refunded' });
//     if (!req.body.reason?.trim()) return res.status(400).json({ message: 'A reason is required' });
//     fine.status = 'Refunded'; fine.refund = { reason: req.body.reason.trim(), at: new Date(), by: req.user._id };
//     await fine.save();
//     audit(req, 'fine.refund', fine.fineNumber, { reason: req.body.reason });
//     res.json({ fine });
//   } catch (e) { next(e); }
// };

// // ---------- Public (no login) ----------
// const mask = (n) => (n ? n.split(/\s+/).map((w) => w[0] + '*'.repeat(Math.max(w.length - 1, 2))).join(' ') : null);
// const pubFine = (f) => ({
//   id: f._id, fineNumber: f.fineNumber, vehicleNumber: f.vehicleNumber, violationType: f.violationType, section: f.section,
//   amount: f.amount, lateFee: f.lateFee, totalDue: f.totalDue, status: f.status, dueDate: f.dueDate, issuedOn: f.createdAt,
//   state: f.state, district: f.district, pincode: f.pincode,
//   receiptNumber: ['Paid', 'Refunded'].includes(f.status) ? f.receiptNumber : undefined,
// });
// const receiptView = (f) => ({
//   id: f._id, receiptNumber: f.receiptNumber, paymentId: f.payment?.reference, fineNumber: f.fineNumber, vehicleNumber: f.vehicleNumber,
//   violationType: f.violationType, section: f.section, state: f.state, district: f.district, pincode: f.pincode,
//   fineAmount: f.amount, lateFee: f.payment?.lateFee || 0, totalPaid: f.payment?.amount, payerName: f.payment?.payerName, method: f.payment?.method,
//   paidOn: f.payment?.date, status: f.status,
// });

// exports.publicSearch = async (req, res, next) => {
//   try {
//     const raw = String(req.query.q || '').trim().toUpperCase().replace(/\s+/g, '');
//     if (raw.length < 4) return res.status(400).json({ message: 'Enter a vehicle number, chassis number or challan number' });
//     const key = normPlate(raw);
//     let vehicle = await Vehicle.findOne({ $or: [{ regNo: key }, { chassisNo: key }] });
//     let regNo = vehicle?.regNo;
//     if (!regNo) { // maybe a challan number
//       const byNo = await Fine.findOne({ fineNumber: raw });
//       regNo = byNo?.vehicleNumber || key;
//       if (byNo) vehicle = await Vehicle.findOne({ regNo });
//     }
//     const fines = await Fine.find({ vehicleNumber: regNo }).sort('-createdAt').limit(100);
//     if (!vehicle && !fines.length) return res.json({ found: false, fines: [] });
//     res.json({
//       found: true,
//       vehicle: { regNo, type: vehicle?.type, registered: !!vehicle, ownerName: mask(vehicle?.ownerName) },
//       fines: fines.map(pubFine),
//       totalUnpaid: fines.filter((f) => f.status === 'Unpaid').reduce((t, f) => t + f.totalDue, 0),
//     });
//   } catch (e) { next(e); }
// };

// exports.publicPay = async (req, res, next) => {
//   try {
//     const { payerName, payerPhone, method } = req.body;
//     if (!payerName?.trim()) return res.status(400).json({ message: 'Payer name is required' });
//     if (payerPhone && !/^\d{10}$/.test(payerPhone)) return res.status(400).json({ message: 'Enter a 10-digit mobile number' });
//     const fine = await Fine.findById(req.params.id);
//     if (!fine) return res.status(404).json({ message: 'Challan not found' });
//     const block = payBlock(fine);
//     if (block) return res.status(400).json({ message: block });
//     const done = await settle(fine, { name: payerName.trim(), phone: payerPhone }, method);
//     if (!done) return res.status(400).json({ message: 'This fine has already been paid' });
//     res.json({ receipt: receiptView(done) });
//   } catch (e) { next(e); }
// };

// // Search a receipt by receipt number, payment ID or challan number.
// exports.publicReceipt = async (req, res, next) => {
//   try {
//     const key = String(req.params.key || '').trim().toUpperCase().replace(/\s+/g, '');
//     if (key.length < 4) return res.status(400).json({ valid: false, message: 'Enter a receipt number, payment ID or challan number' });
//     const f = await Fine.findOne({ status: { $in: ['Paid', 'Refunded'] }, $or: [{ receiptNumber: key }, { 'payment.reference': key }, { fineNumber: key }] });
//     if (!f) return res.status(404).json({ valid: false, message: 'No receipt found' });
//     res.json({ valid: true, receipt: receiptView(f) });
//   } catch (e) { next(e); }
// };

// exports.schedule = async (req, res, next) => {
//   try {
//     const state = req.query.state;
//     const rows = await FineSchedule.find({ state: { $in: ['*', state] } });
//     const out = {};
//     TYPES.forEach((t) => { out[t] = DEFAULT_FINES[t]; });
//     rows.filter((r) => r.state === '*').forEach((r) => { out[r.violationType] = r.amount; });
//     rows.filter((r) => r.state === state).forEach((r) => { out[r.violationType] = r.amount; });
//     res.json({ schedule: out });
//   } catch (e) { next(e); }
// };
// exports.setSchedule = async (req, res, next) => {
//   try {
//     const { state, violationType, amount } = req.body;
//     const st = req.user.role === 'regional_admin' ? req.user.state : state || '*';
//     if (!TYPES.includes(violationType) || !(Number(amount) >= 0)) return res.status(400).json({ message: 'Invalid violation type or amount' });
//     await FineSchedule.findOneAndUpdate({ state: st, violationType }, { amount: Number(amount) }, { upsert: true });
//     audit(req, 'schedule.set', `${st}/${violationType}`, { amount });
//     res.json({ ok: true });
//   } catch (e) { next(e); }
// };
const Fine = require('../models/Fine');
const FineSchedule = require('../models/FineSchedule');
const Vehicle = require('../models/Vehicle');
const audit = require('../utils/audit');
const { TYPES, DEFAULT_FINES, DISPUTE_DAYS, regionScope, inScope, paging, genNo, normPlate } = require('../utils/constants');

const view = (q) => q.populate('officer', 'name badgeNumber station').populate('owner', 'name email').populate('report', 'media occurredAt description area');
const mineOrScope = (u) => (u.role === 'citizen' ? { owner: u._id } : regionScope(u));

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = paging(req);
    const f = mineOrScope(req.user);
    if (req.query.status) f.status = req.query.status;
    if (req.query.q) { const q = String(req.query.q).toUpperCase().replace(/[^A-Z0-9-]/g, ''); f.$or = [{ fineNumber: new RegExp(q) }, { vehicleNumber: new RegExp('^' + q.replace(/-/g, '')) }]; }
    const [items, total] = await Promise.all([view(Fine.find(f).sort('-createdAt').skip(skip).limit(limit)), Fine.countDocuments(f)]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
};

async function load(req, res) {
  const fine = await view(Fine.findById(req.params.id));
  if (!fine) { res.status(404).json({ message: 'Fine not found' }); return null; }
  const ok = req.user.role === 'citizen' ? fine.owner && String(fine.owner._id) === String(req.user._id) : inScope(req.user, fine);
  if (!ok) { res.status(403).json({ message: 'You are not allowed to access this fine' }); return null; }
  return fine;
}

exports.getOne = async (req, res, next) => { try { const f = await load(req, res); if (f) res.json({ fine: f }); } catch (e) { next(e); } };

const payBlock = (f) => (f.status === 'Paid' ? 'This fine has already been paid' : f.status === 'Disputed' ? 'Payment is paused while an appeal is under review'
  : f.status !== 'Unpaid' ? `This fine is ${f.status} and cannot be paid` : null);

// Atomic: only one request can move a fine from Unpaid to Paid.
async function settle(fine, payer, method) {
  const late = fine.lateFee;
  const payment = { reference: genNo('PAY'), method: method || 'Mock Gateway', amount: fine.amount + late, lateFee: late, date: new Date(), payerName: payer.name, payerPhone: payer.phone };
  return Fine.findOneAndUpdate({ _id: fine._id, status: 'Unpaid' }, { $set: { payment, receiptNumber: genNo('RCPT'), status: 'Paid' } }, { new: true });
}

exports.pay = async (req, res, next) => {
  try {
    const fine = await Fine.findOne({ _id: req.params.id, owner: req.user._id });
    if (!fine) return res.status(404).json({ message: 'Fine not found' });
    const block = payBlock(fine);
    if (block) return res.status(400).json({ message: block });
    const done = await settle(fine, { name: req.user.name, phone: req.user.phone }, req.body.method);
    if (!done) return res.status(400).json({ message: 'This fine has already been paid' });
    res.json({ fine: await view(Fine.findById(done._id)) });
  } catch (e) { next(e); }
};

exports.dispute = async (req, res, next) => {
  try {
    const fine = await Fine.findOne({ _id: req.params.id, owner: req.user._id });
    if (!fine) return res.status(404).json({ message: 'Fine not found' });
    if (fine.status !== 'Unpaid') return res.status(400).json({ message: 'Only unpaid fines can be disputed' });
    if (Date.now() - fine.createdAt > DISPUTE_DAYS * 864e5) return res.status(400).json({ message: `The ${DISPUTE_DAYS}-day dispute window has closed` });
    if (!req.body.reason?.trim()) return res.status(400).json({ message: 'Please give a reason' });
    fine.status = 'Disputed'; fine.dispute = { reason: req.body.reason.trim(), at: new Date() };
    await fine.save();
    res.json({ fine });
  } catch (e) { next(e); }
};

// Supervisor: uphold | reduce | waive
exports.decide = async (req, res, next) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ message: 'Fine not found' });
    if (!inScope(req.user, fine)) return res.status(403).json({ message: 'Outside your jurisdiction' });
    if (fine.status !== 'Disputed') return res.status(400).json({ message: 'This fine has no open appeal' });
    const { action, note, newAmount } = req.body;
    if (!note?.trim()) return res.status(400).json({ message: 'A written reason is required' });
    if (action === 'uphold') { fine.status = 'Unpaid'; fine.dueDate = new Date(Date.now() + 7 * 864e5); }
    else if (action === 'reduce') {
      if (!(Number(newAmount) > 0 && Number(newAmount) < fine.amount)) return res.status(400).json({ message: 'New amount must be lower than the current fine' });
      fine.amount = Number(newAmount); fine.status = 'Unpaid'; fine.dueDate = new Date(Date.now() + 7 * 864e5);
    } else if (action === 'waive') fine.status = 'Waived';
    else return res.status(400).json({ message: 'Invalid action' });
    fine.dispute.decision = action; fine.dispute.note = note; fine.dispute.decidedBy = req.user._id; fine.dispute.decidedAt = new Date();
    await fine.save();
    audit(req, `appeal.${action}`, fine.fineNumber, { note, newAmount });
    res.json({ fine });
  } catch (e) { next(e); }
};

exports.refund = async (req, res, next) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine || fine.status !== 'Paid') return res.status(400).json({ message: 'Only paid fines can be refunded' });
    if (!req.body.reason?.trim()) return res.status(400).json({ message: 'A reason is required' });
    fine.status = 'Refunded'; fine.refund = { reason: req.body.reason.trim(), at: new Date(), by: req.user._id };
    await fine.save();
    audit(req, 'fine.refund', fine.fineNumber, { reason: req.body.reason });
    res.json({ fine });
  } catch (e) { next(e); }
};

// ---------- Public (no login) ----------
const mask = (n) => (n ? n.split(/\s+/).map((w) => w[0] + '*'.repeat(Math.max(w.length - 1, 2))).join(' ') : null);
const pubFine = (f) => ({
  id: f._id, fineNumber: f.fineNumber, vehicleNumber: f.vehicleNumber, violationType: f.violationType, section: f.section,
  amount: f.amount, lateFee: f.lateFee, totalDue: f.totalDue, status: f.status, dueDate: f.dueDate, issuedOn: f.createdAt,
  state: f.state, district: f.district, pincode: f.pincode,
  receiptNumber: ['Paid', 'Refunded'].includes(f.status) ? f.receiptNumber : undefined,
  // details shown before paying (reporter identity is never included)
  officer: f.officer ? { name: f.officer.name, badgeNumber: f.officer.badgeNumber, station: f.officer.station } : null,
  incident: f.report ? { occurredAt: f.report.occurredAt, area: f.report.area, description: f.report.description, lat: f.report.lat, lng: f.report.lng } : null,
  evidence: (f.report?.media || []).map((m) => ({ url: m.url, kind: m.kind })),
});
const receiptView = (f) => ({
  id: f._id, receiptNumber: f.receiptNumber, paymentId: f.payment?.reference, fineNumber: f.fineNumber, vehicleNumber: f.vehicleNumber,
  violationType: f.violationType, section: f.section, state: f.state, district: f.district, pincode: f.pincode,
  fineAmount: f.amount, lateFee: f.payment?.lateFee || 0, totalPaid: f.payment?.amount, payerName: f.payment?.payerName, method: f.payment?.method,
  paidOn: f.payment?.date, status: f.status,
});

exports.publicSearch = async (req, res, next) => {
  try {
    const raw = String(req.query.q || '').trim().toUpperCase().replace(/\s+/g, '');
    if (raw.length < 4) return res.status(400).json({ message: 'Enter a vehicle number, chassis number or challan number' });
    const key = normPlate(raw);
    let vehicle = await Vehicle.findOne({ $or: [{ regNo: key }, { chassisNo: key }] });
    let regNo = vehicle?.regNo;
    if (!regNo) { // maybe a challan number
      const byNo = await Fine.findOne({ fineNumber: raw });
      regNo = byNo?.vehicleNumber || key;
      if (byNo) vehicle = await Vehicle.findOne({ regNo });
    }
    const fines = await Fine.find({ vehicleNumber: regNo }).sort('-createdAt').limit(100)
      .populate('officer', 'name badgeNumber station').populate('report', 'media occurredAt area description lat lng');
    if (!vehicle && !fines.length) return res.json({ found: false, fines: [] });
    res.json({
      found: true,
      vehicle: { regNo, type: vehicle?.type, registered: !!vehicle, ownerName: mask(vehicle?.ownerName) },
      fines: fines.map(pubFine),
      totalUnpaid: fines.filter((f) => f.status === 'Unpaid').reduce((t, f) => t + f.totalDue, 0),
    });
  } catch (e) { next(e); }
};

exports.publicPay = async (req, res, next) => {
  try {
    const { payerName, payerPhone, method } = req.body;
    if (!payerName?.trim()) return res.status(400).json({ message: 'Payer name is required' });
    if (payerPhone && !/^\d{10}$/.test(payerPhone)) return res.status(400).json({ message: 'Enter a 10-digit mobile number' });
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ message: 'Challan not found' });
    const block = payBlock(fine);
    if (block) return res.status(400).json({ message: block });
    const done = await settle(fine, { name: payerName.trim(), phone: payerPhone }, method);
    if (!done) return res.status(400).json({ message: 'This fine has already been paid' });
    res.json({ receipt: receiptView(done) });
  } catch (e) { next(e); }
};

// Search a receipt by receipt number, payment ID or challan number.
exports.publicReceipt = async (req, res, next) => {
  try {
    const key = String(req.params.key || '').trim().toUpperCase().replace(/\s+/g, '');
    if (key.length < 4) return res.status(400).json({ valid: false, message: 'Enter a receipt number, payment ID or challan number' });
    const f = await Fine.findOne({ status: { $in: ['Paid', 'Refunded'] }, $or: [{ receiptNumber: key }, { 'payment.reference': key }, { fineNumber: key }] });
    if (!f) return res.status(404).json({ valid: false, message: 'No receipt found' });
    res.json({ valid: true, receipt: receiptView(f) });
  } catch (e) { next(e); }
};

exports.schedule = async (req, res, next) => {
  try {
    const state = req.query.state;
    const rows = await FineSchedule.find({ state: { $in: ['*', state] } });
    const out = {};
    TYPES.forEach((t) => { out[t] = DEFAULT_FINES[t]; });
    rows.filter((r) => r.state === '*').forEach((r) => { out[r.violationType] = r.amount; });
    rows.filter((r) => r.state === state).forEach((r) => { out[r.violationType] = r.amount; });
    res.json({ schedule: out });
  } catch (e) { next(e); }
};
exports.setSchedule = async (req, res, next) => {
  try {
    const { state, violationType, amount } = req.body;
    const st = req.user.role === 'regional_admin' ? req.user.state : state || '*';
    if (!TYPES.includes(violationType) || !(Number(amount) >= 0)) return res.status(400).json({ message: 'Invalid violation type or amount' });
    await FineSchedule.findOneAndUpdate({ state: st, violationType }, { amount: Number(amount) }, { upsert: true });
    audit(req, 'schedule.set', `${st}/${violationType}`, { amount });
    res.json({ ok: true });
  } catch (e) { next(e); }
};
