const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, sparse: true, unique: true },
    password: { type: String, minLength: 6, select: false },
    phone: { type: String, required: true, unique: true, trim: true },
    isPhoneVerified: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },
    // Profile fields
    age: { type: Number },
    sex: { type: String, enum: ['Male', 'Female', 'Other'] },
    weight: { type: Number }, // in kg
    height: { type: Number }, // in cm
    comorbidities: [{ type: String }],
    medications: [{ type: String }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
