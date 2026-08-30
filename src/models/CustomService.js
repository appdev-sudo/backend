const mongoose = require('mongoose');

const customServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomService', customServiceSchema);
