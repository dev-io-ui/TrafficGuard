const mongoose = require('mongoose');
module.exports = mongoose.model('AuditLog', new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, actorRole: String, action: String, target: String, meta: Object, ip: String,
}, { timestamps: true }));
