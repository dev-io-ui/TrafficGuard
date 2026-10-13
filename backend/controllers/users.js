const User = require('../models/User');
const audit = require('../utils/audit');
const { paging } = require('../utils/constants');

exports.create = async (req, res, next) => {
  try {
    const { name, email, password, role, state, district, badgeNumber, station, phone } = req.body;
    const me = req.user;
    const allowed = me.role === 'admin' ? ['officer', 'supervisor', 'finance', 'regional_admin', 'admin'] : ['officer', 'supervisor', 'finance'];
    if (!allowed.includes(role)) return res.status(403).json({ message: `You cannot create '${role}' accounts` });
    const st = me.role === 'regional_admin' ? me.state : state;
    if (['officer', 'supervisor', 'regional_admin'].includes(role) && !st) return res.status(400).json({ message: 'State is required for this role' });
    if (['officer', 'supervisor'].includes(role) && !district) return res.status(400).json({ message: 'District is required for this role' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email is already registered' });
    const user = await User.create({ name, email, password, role, state: st, district, badgeNumber, station, phone, mustChangePassword: true });
    audit(req, 'user.create', user.email, { role });
    res.status(201).json({ user: user.toPublic() });
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = paging(req);
    const f = { role: { $ne: 'citizen' } };
    if (req.query.role) f.role = req.query.role;
    if (req.user.role === 'regional_admin') f.state = req.user.state;
    else if (req.query.state) f.state = req.query.state;
    const [items, total] = await Promise.all([User.find(f).sort('-createdAt').skip(skip).limit(limit), User.countDocuments(f)]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u || u.role === 'citizen' && req.user.role !== 'admin') return res.status(404).json({ message: 'User not found' });
    if (String(u._id) === String(req.user._id)) return res.status(400).json({ message: 'You cannot deactivate your own account' });
    if (req.user.role === 'regional_admin' && (u.state !== req.user.state || ['admin', 'regional_admin'].includes(u.role)))
      return res.status(403).json({ message: 'Outside your authority' });
    u.isActive = !u.isActive; await u.save();
    audit(req, u.isActive ? 'user.activate' : 'user.deactivate', u.email);
    res.json({ user: u.toPublic() });
  } catch (e) { next(e); }
};
