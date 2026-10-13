const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email is already registered' });
    const user = await User.create({ name, email, password, phone, role: 'citizen' }); // always citizen
    res.status(201).json({ token: sign(user._id), user: user.toPublic() });
  } catch (e) { next(e); }
};
exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(req.body.password))) return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.isActive) return res.status(401).json({ message: 'Account is inactive. Contact an administrator.' });
    res.json({ token: sign(user._id), user: user.toPublic() });
  } catch (e) { next(e); }
};
exports.me = (req, res) => res.json({ user: req.user.toPublic() });
exports.changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(req.body.currentPassword))) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = req.body.newPassword; user.mustChangePassword = false;
    await user.save();
    res.json({ user: user.toPublic() });
  } catch (e) { next(e); }
};
