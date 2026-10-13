const Report = require('../models/Report');
const Fine = require('../models/Fine');
const AuditLog = require('../models/AuditLog');
const { regionScope, paging } = require('../utils/constants');

exports.summary = async (req, res, next) => {
  try {
    const u = req.user, citizen = u.role === 'citizen';
    const rf = citizen ? { reporter: u._id } : regionScope(u), ff = citizen ? { owner: u._id } : regionScope(u);
    const [reports, fines] = await Promise.all([Report.find(rf).select('status violationType district createdAt'), Fine.find(ff).select('status amount payment district')]);
    const by = (arr, k) => arr.reduce((m, x) => { m[x[k]] = (m[x[k]] || 0) + 1; return m; }, {});
    const paid = fines.filter((f) => f.status === 'Paid');
    const validated = reports.filter((r) => r.status === 'Validated').length, closed = validated + reports.filter((r) => r.status === 'Rejected').length;
    res.json({
      reports: { total: reports.length, byStatus: by(reports, 'status'), byType: by(reports, 'violationType'), byDistrict: by(reports, 'district'), validationRate: closed ? Math.round((validated / closed) * 100) : 0 },
      fines: { total: fines.length, byStatus: by(fines, 'status'), outstanding: fines.filter((f) => f.status === 'Unpaid').reduce((s, f) => s + f.amount, 0) },
      revenue: paid.reduce((s, f) => s + (f.payment?.amount || 0), 0),
    });
  } catch (e) { next(e); }
};

exports.audit = async (req, res, next) => {
  try {
    const { page, limit, skip } = paging(req);
    const [items, total] = await Promise.all([AuditLog.find().sort('-createdAt').skip(skip).limit(limit).populate('actor', 'name email'), AuditLog.countDocuments()]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
};
