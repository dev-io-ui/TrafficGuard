const Vehicle = require('../models/Vehicle');
const Fine = require('../models/Fine');
const User = require('../models/User');
const audit = require('../utils/audit');
const { PLATE_RE, normPlate, paging } = require('../utils/constants');

const CHASSIS_RE = /^[A-Z0-9]{6,20}$/;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = paging(req);
    const f = req.user.role === 'citizen' ? { owner: req.user._id } : {};
    if (req.query.q && req.user.role !== 'citizen') {
      const q = normPlate(req.query.q);
      f.$or = [{ regNo: new RegExp(esc(q)) }, { chassisNo: new RegExp(esc(q)) }, { ownerName: new RegExp(esc(req.query.q.trim()), 'i') }];
    }
    const [items, total] = await Promise.all([Vehicle.find(f).populate('owner', 'name email').sort('-createdAt').skip(skip).limit(limit), Vehicle.countDocuments(f)]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
};

async function resolveOwner(email) {
  if (!email?.trim()) return { owner: null };
  const u = await User.findOne({ email: email.trim().toLowerCase(), role: 'citizen' });
  return u ? { owner: u._id, user: u } : { error: `No citizen account found with email ${email}` };
}

exports.add = async (req, res, next) => {
  try {
    const regNo = normPlate(req.body.regNo), chassisNo = normPlate(req.body.chassisNo);
    if (!PLATE_RE.test(regNo)) return res.status(400).json({ message: 'Enter a valid vehicle number, e.g. TS09AB1234' });
    if (chassisNo && !CHASSIS_RE.test(chassisNo)) return res.status(400).json({ message: 'Chassis number must be 6-20 letters/digits' });
    if (await Vehicle.findOne({ regNo })) return res.status(409).json({ message: 'This vehicle number is already registered' });
    if (chassisNo && await Vehicle.findOne({ chassisNo })) return res.status(409).json({ message: 'This chassis number is already registered' });
    const o = await resolveOwner(req.body.ownerEmail);
    if (o.error) return res.status(400).json({ message: o.error });
    const vehicle = await Vehicle.create({ regNo, chassisNo: chassisNo || undefined, type: req.body.type || 'Car', ownerName: req.body.ownerName || o.user?.name,
      ownerPhone: req.body.ownerPhone, owner: o.owner, addedBy: req.user._id });
    if (o.owner) await Fine.updateMany({ vehicleNumber: regNo, owner: null }, { owner: o.owner }); // link earlier fines to the owner account
    audit(req, 'vehicle.add', regNo, { chassisNo });
    res.status(201).json({ vehicle });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const v = await Vehicle.findById(req.params.id);
    if (!v) return res.status(404).json({ message: 'Vehicle not found' });
    const b = req.body;
    if (b.chassisNo !== undefined) {
      const c = normPlate(b.chassisNo);
      if (c && !CHASSIS_RE.test(c)) return res.status(400).json({ message: 'Chassis number must be 6-20 letters/digits' });
      if (c && await Vehicle.findOne({ chassisNo: c, _id: { $ne: v._id } })) return res.status(409).json({ message: 'This chassis number is already registered' });
      v.chassisNo = c || undefined;
    }
    ['type', 'ownerName', 'ownerPhone'].forEach((k) => { if (b[k] !== undefined) v[k] = b[k]; });
    if (b.ownerEmail !== undefined) {
      const o = await resolveOwner(b.ownerEmail);
      if (o.error) return res.status(400).json({ message: o.error });
      v.owner = o.owner;
      if (o.owner) await Fine.updateMany({ vehicleNumber: v.regNo, owner: null }, { owner: o.owner });
    }
    await v.save();
    audit(req, 'vehicle.update', v.regNo);
    res.json({ vehicle: v });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const v = await Vehicle.findByIdAndDelete(req.params.id);
    if (v) audit(req, 'vehicle.remove', v.regNo);
    res.status(v ? 200 : 404).json({ message: v ? 'Removed' : 'Vehicle not found' });
  } catch (e) { next(e); }
};
