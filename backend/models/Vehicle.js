const mongoose = require('mongoose');
module.exports = mongoose.model('Vehicle', new mongoose.Schema({
  regNo: { type: String, required: true, unique: true, uppercase: true },
  chassisNo: { type: String, uppercase: true, unique: true, sparse: true },
  type: { type: String, default: 'Car' },
  ownerName: { type: String, trim: true },
  ownerPhone: { type: String, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true }, // optional linked citizen account
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }));
