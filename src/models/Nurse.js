const mongoose = require('mongoose');

// ── Sub-schemas ─────────────────────────────────────────────────────────────
const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['qualification_certificate', 'photo_id', 'aadhaar', 'profile_picture'],
    },
    url: { type: String, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String },
    landmark: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String },
    formattedAddress: { type: String },
  },
  { _id: false }
);

// ── Main Nurse Schema ───────────────────────────────────────────────────────
const nurseSchema = new mongoose.Schema(
  {
    // Unique nurse identifier (auto-generated on registration)
    nurseId: { type: String, unique: true, sparse: true },

    // Auth — linked to the same phone/OTP system as customers
    phone: { type: String, required: true, unique: true, trim: true },
    isPhoneVerified: { type: Boolean, default: false },

    // Personal
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    age: { type: Number },
    sex: { type: String, enum: ['Male', 'Female', 'Other'] },
    profilePicture: { type: String }, // URL to uploaded image

    // Professional
    qualifications: [{ type: String }],
    specializations: [{ type: String }],

    // Documents (uploaded during onboarding)
    documents: [documentSchema],

    // Location
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: addressSchema,
    },

    // Status flags
    isOnboarded: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },   // Admin must approve before nurse can take bookings
    isActive: { type: Boolean, default: true },       // Soft-disable
  },
  { timestamps: true }
);

// ── Indexes (phone and nurseId already indexed via unique: true) ────────────
nurseSchema.index({ isApproved: 1, isActive: 1 });

// ── Pre-save: auto-generate nurseId ─────────────────────────────────────────
nurseSchema.pre('save', async function (next) {
  if (!this.nurseId) {
    const count = await mongoose.model('Nurse').countDocuments();
    this.nurseId = `VY-NURSE-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// ── Helper to return a clean profile object ─────────────────────────────────
nurseSchema.methods.toProfile = function () {
  return {
    id: this._id,
    nurseId: this.nurseId,
    phone: this.phone,
    name: this.name,
    email: this.email,
    age: this.age,
    sex: this.sex,
    profilePicture: this.profilePicture,
    qualifications: this.qualifications,
    specializations: this.specializations,
    isPhoneVerified: this.isPhoneVerified,
    isOnboarded: this.isOnboarded,
    isApproved: this.isApproved,
    isActive: this.isActive,
    documents: this.documents,
    location: this.location,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Nurse', nurseSchema);
