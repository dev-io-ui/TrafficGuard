const AuditLog = require('../models/AuditLog');
module.exports = (req, action, target, meta) =>
  AuditLog.create({ actor: req.user?._id, actorRole: req.user?.role, action, target, meta, ip: req.ip }).catch(() => {});
