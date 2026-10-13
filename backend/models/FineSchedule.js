const mongoose = require('mongoose');
const s = new mongoose.Schema({ state: { type: String, default: '*' }, violationType: String, amount: { type: Number, min: 0 } });
s.index({ state: 1, violationType: 1 }, { unique: true });
module.exports = mongoose.model('FineSchedule', s);
