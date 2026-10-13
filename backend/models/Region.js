const mongoose = require('mongoose');
// One document per state / UT, with embedded districts and their pincodes.
module.exports = mongoose.model('Region', new mongoose.Schema({
  country: { type: String, default: 'India', index: true },
  state: { type: String, required: true },
  kind: { type: String, default: 'State' },
  districts: [{ name: String, pincodes: [{ code: String, area: String }] }],
}, { timestamps: true }));
