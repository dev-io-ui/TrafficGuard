exports.TYPES = ['Speeding', 'Red Light Violation', 'No Helmet', 'No Seatbelt', 'Illegal Parking',
  'Driving Without License', 'Drunk Driving', 'Mobile Phone Usage', 'Signal Jumping', 'Wrong Side Driving', 'Triple Riding', 'Other'];
exports.ROLES = ['citizen', 'officer', 'supervisor', 'finance', 'regional_admin', 'admin'];
// Indicative defaults (Rs). Admins can override per state via the Fine Schedule.
exports.DEFAULT_FINES = { 'Speeding': 1000, 'Red Light Violation': 1000, 'No Helmet': 1000, 'No Seatbelt': 1000,
  'Illegal Parking': 500, 'Driving Without License': 5000, 'Drunk Driving': 10000, 'Mobile Phone Usage': 1000,
  'Signal Jumping': 1000, 'Wrong Side Driving': 1000, 'Triple Riding': 1000, 'Other': 500 };
exports.DUE_DAYS = 30;
exports.DISPUTE_DAYS = 15;
exports.LATE_FEE_PCT = 0.1;
exports.PLATE_RE = /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$/;
exports.normPlate = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
exports.genNo = (p) => `${p}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0')}`;
// Which documents (by state/district) a staff user may see.
exports.regionScope = (u) =>
  u.role === 'officer' || u.role === 'supervisor' ? { state: u.state, district: u.district }
    : u.role === 'regional_admin' ? { state: u.state } : {};
exports.inScope = (u, doc) => Object.entries(exports.regionScope(u)).every(([k, v]) => doc[k] === v);
exports.paging = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1), limit = Math.min(50, parseInt(req.query.limit) || 10);
  return { page, limit, skip: (page - 1) * limit };
};
