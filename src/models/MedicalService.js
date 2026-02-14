const mongoose = require('mongoose');

const detailSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  items: [{ type: String }],
}, { _id: false });

const medicalServiceSchema = new mongoose.Schema(
  {
    serviceId: { type: String, required: true, unique: true },
    category: {
      type: String,
      required: true,
      enum: ['iv_drips', 'diagnostics', 'red_light', 'hyperbaric', 'longevity'],
    },
    title: { type: String, required: true },
    subtitle: { type: String },
    shortDescription: { type: String },
    fullDescription: { type: String },
    price: { type: String },
    sessionInfo: { type: String },
    tagline: { type: String },
    bullets: [{ type: String }],
    sections: [detailSectionSchema],
    imageUrl: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

medicalServiceSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model('MedicalService', medicalServiceSchema);
