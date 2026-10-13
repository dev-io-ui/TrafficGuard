const fs = require('fs');
const Report = require('../models/Report');
const Fine = require('../models/Fine');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const audit = require('../utils/audit');
const { normPlate, PLATE_RE, DUE_DAYS, genNo, regionScope, inScope, paging } = require('../utils/constants');

const view = (q) => q.populate('reporter', 'name').populate('reviewedBy', 'name badgeNumber').populate('assignedTo', 'name badgeNumber').populate('fine', 'fineNumber amount status');

exports.create = async (req, res, next) => {
  const files = [...(req.files?.photos || []), ...(req.files?.videos || [])];
  const fail = (code, message) => { files.forEach((f) => fs.unlink(f.path, () => {})); return res.status(code).json({ message }); };
  try {
    const b = req.body, plate = normPlate(b.vehicleNumber);
    if (!PLATE_RE.test(plate)) return fail(400, 'Enter a valid vehicle number, e.g. TS09AB1234');
    if (!files.length) return fail(400, 'Attach at least one photo or video as evidence');
    if (await Vehicle.findOne({ regNo: plate, owner: req.user._id })) return fail(400, 'You cannot report your own vehicle. Report other drivers\' vehicles only.');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (await Report.countDocuments({ reporter: req.user._id, createdAt: { $gte: today } }) >= 10) return fail(429, 'Daily report limit (10) reached');
    const at = b.occurredAt ? new Date(b.occurredAt) : new Date();
    if (isNaN(at) || at > new Date(Date.now() + 60000)) return fail(400, 'Invalid incident date/time');
    const dup = await Report.findOne({ vehicleNumber: plate, violationType: b.violationType, status: { $ne: 'Rejected' },
      occurredAt: { $gte: new Date(+at - 1800000), $lte: new Date(+at + 1800000) } });
    // Route to an officer posted in the same state + district (least busy first)
    const officers = await User.find({ role: 'officer', isActive: true, state: b.state, district: b.district }).select('_id name');
    let assigned = null;
    if (officers.length) {
      const load = await Promise.all(officers.map(async (o) => [o, await Report.countDocuments({ assignedTo: o._id, status: { $in: ['Submitted', 'Under Review'] } })]));
      assigned = load.sort((x, y) => x[1] - y[1])[0][0];
    }
    const r = await Report.create({
      assignedTo: assigned?._id,
      reporter: req.user._id, vehicleNumber: plate, violationType: b.violationType, description: b.description,
      state: b.state, district: b.district, pincode: b.pincode, area: b.area,
      lat: b.lat ? Number(b.lat) : undefined, lng: b.lng ? Number(b.lng) : undefined, occurredAt: at,
      media: files.map((f) => ({ url: `/uploads/reports/${f.filename}`, kind: f.fieldname === 'videos' ? 'video' : 'photo', name: f.originalname })),
      duplicateOf: dup?._id, history: [{ status: 'Submitted', by: req.user._id }],
    });
    const routing = assigned ? `Sent to Officer ${assigned.name} (${b.district}) for review.`
      : `No officer is posted in ${b.district} yet. Your report is in the review queue of the ${b.state} supervisors and administrators.`;
    res.status(201).json({ report: r, routing });
  } catch (e) { files.forEach((f) => fs.unlink(f.path, () => {})); next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = paging(req);
    const f = req.user.role === 'citizen' ? { reporter: req.user._id } : regionScope(req.user);
    if (req.query.status === 'open') f.status = { $in: ['Submitted', 'Under Review'] };
    else if (req.query.status) f.status = req.query.status;
    if (req.query.type) f.violationType = req.query.type;
    if (req.query.district && !f.district) f.district = req.query.district;
    if (req.query.pincode) f.pincode = req.query.pincode;
    if (req.query.q) f.vehicleNumber = new RegExp('^' + normPlate(req.query.q));
    const [items, total] = await Promise.all([view(Report.find(f).sort('-createdAt').skip(skip).limit(limit)), Report.countDocuments(f)]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const r = await view(Report.findById(req.params.id));
    if (!r) return res.status(404).json({ message: 'Report not found' });
    const mine = req.user.role === 'citizen' && String(r.reporter._id) === String(req.user._id);
    if (!mine && (req.user.role === 'citizen' || !inScope(req.user, r))) return res.status(403).json({ message: 'You are not allowed to view this report' });
    res.json({ report: r });
  } catch (e) { next(e); }
};

exports.comment = async (req, res, next) => {
  try {
    const r = await Report.findOne({ _id: req.params.id, reporter: req.user._id });
    if (!r) return res.status(404).json({ message: 'Report not found' });
    if (r.status !== 'Needs More Info') return res.status(400).json({ message: 'No additional information was requested' });
    if (!req.body.text?.trim()) return res.status(400).json({ message: 'Comment is required' });
    r.comments.push({ text: req.body.text.trim() });
    r.status = 'Under Review'; r.history.push({ status: 'Under Review', by: req.user._id, note: 'Reporter replied' });
    await r.save();
    res.json({ report: r });
  } catch (e) { next(e); }
};

// Officer action: start | info | reject | validate
exports.review = async (req, res, next) => {
  try {
    const r = await Report.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Report not found' });
    if (!inScope(req.user, r)) return res.status(403).json({ message: 'This report is outside your jurisdiction' });
    if (!['Submitted', 'Under Review'].includes(r.status)) return res.status(400).json({ message: `Report is already ${r.status}` });
    const { action, note, amount, section } = req.body;
    if (!r.assignedTo) r.assignedTo = req.user._id;
    const set = (status) => { r.status = status; r.reviewedBy = req.user._id; r.reviewNote = note; r.history.push({ status, by: req.user._id, note }); };
    if (action === 'start') set('Under Review');
    else if (action === 'info' || action === 'reject') {
      if (!note?.trim()) return res.status(400).json({ message: 'A note/reason is required' });
      set(action === 'info' ? 'Needs More Info' : 'Rejected');
    } else if (action === 'validate') {
      const amt = Number(amount);
      if (!(amt > 0)) return res.status(400).json({ message: 'Enter a valid fine amount' });
      const veh = await Vehicle.findOne({ regNo: r.vehicleNumber });
      const fine = await Fine.create({
        fineNumber: genNo('RWF'), report: r._id, vehicleNumber: r.vehicleNumber, owner: veh ? veh.owner : null, officer: req.user._id,
        violationType: r.violationType, section, amount: amt, dueDate: new Date(Date.now() + DUE_DAYS * 864e5),
        state: r.state, district: r.district, pincode: r.pincode,
      });
      r.fine = fine._id; set('Validated');
      audit(req, 'fine.issue', fine.fineNumber, { amount: amt, report: String(r._id) });
    } else return res.status(400).json({ message: 'Invalid action' });
    await r.save();
    res.json({ report: await view(Report.findById(r._id)) });
  } catch (e) { next(e); }
};
