const mongoose = require('mongoose');
const { TYPES } = require('../utils/constants');
const { ObjectId } = mongoose.Schema.Types;

const reportSchema = new mongoose.Schema({
  reporter: { type: ObjectId, ref: 'User', required: true, index: true },
  vehicleNumber: { type: String, required: true, uppercase: true, index: true },
  violationType: { type: String, enum: TYPES, required: true },
  description: { type: String, trim: true },
  country: { type: String, default: 'India' },
  state: { type: String, required: true }, district: { type: String, required: true },
  pincode: { type: String, required: true }, area: String,
  lat: Number, lng: Number,
  occurredAt: { type: Date, required: true },
  media: [{ url: String, kind: { type: String, enum: ['photo', 'video'] }, name: String }],
  status: { type: String, enum: ['Submitted', 'Under Review', 'Needs More Info', 'Validated', 'Rejected'], default: 'Submitted', index: true },
  reviewNote: String, reviewedBy: { type: ObjectId, ref: 'User' },
  assignedTo: { type: ObjectId, ref: 'User' },
  duplicateOf: { type: ObjectId, ref: 'Report' },
  fine: { type: ObjectId, ref: 'Fine' },
  comments: [{ text: String, at: { type: Date, default: Date.now } }],
  history: [{ status: String, by: { type: ObjectId, ref: 'User' }, note: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });
reportSchema.index({ state: 1, district: 1, status: 1, createdAt: -1 });
module.exports = mongoose.model('Report', reportSchema);
