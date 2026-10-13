const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phone: { type: String, trim: true },
  role: { type: String, enum: ROLES, default: 'citizen' },
  state: String, district: String,           // jurisdiction for officer/supervisor (district) and regional_admin (state)
  badgeNumber: { type: String, trim: true }, station: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.index({ role: 1, state: 1, district: 1 });
userSchema.pre('save', async function () { if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10); });
userSchema.methods.matchPassword = function (p) { return bcrypt.compare(p, this.password); };
userSchema.methods.toPublic = function () { const o = this.toObject(); delete o.password; delete o.__v; return o; };
module.exports = mongoose.model('User', userSchema);
