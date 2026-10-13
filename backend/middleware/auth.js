const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized, no token provided' });
    let decoded;
    try { decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET); }
    catch { return res.status(401).json({ message: 'Not authorized, token failed' }); }
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ message: 'Not authorized, account inactive or not found' });
    req.user = user;
    next();
  } catch (e) { next(e); }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: `Role '${req.user.role}' is not permitted to perform this action` });
  next();
};
