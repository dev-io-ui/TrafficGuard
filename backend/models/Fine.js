const mongoose = require('mongoose');
const { LATE_FEE_PCT } = require('../utils/constants');
const { ObjectId } = mongoose.Schema.Types;

const fineSchema = new mongoose.Schema({
  fineNumber: { type: String, unique: true, required: true },
  report: { type: ObjectId, ref: 'Report' },
  vehicleNumber: { type: String, uppercase: true, index: true },
  owner: { type: ObjectId, ref: 'User', default: null, index: true },   // null = unclaimed until the vehicle is registered
  officer: { type: ObjectId, ref: 'User' },
  violationType: String, section: String,
  amount: { type: Number, required: true, min: 0 },
  dueDate: Date,
  state: String, district: String, pincode: String,
  status: { type: String, enum: ['Unpaid', 'Paid', 'Disputed', 'Waived', 'Refunded'], default: 'Unpaid', index: true },
  payment: { reference: String, method: String, amount: Number, lateFee: Number, date: Date, payerName: String, payerPhone: String },
  receiptNumber: { type: String, index: true },
  dispute: { reason: String, at: Date, decision: String, note: String, decidedBy: { type: ObjectId, ref: 'User' }, decidedAt: Date },
  refund: { reason: String, at: Date, by: { type: ObjectId, ref: 'User' } },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

fineSchema.virtual('lateFee').get(function () {
  return this.status === 'Unpaid' && this.dueDate && this.dueDate < new Date() ? Math.round(this.amount * LATE_FEE_PCT) : 0;
});
fineSchema.virtual('totalDue').get(function () { return this.amount + this.lateFee; });
module.exports = mongoose.model('Fine', fineSchema);
