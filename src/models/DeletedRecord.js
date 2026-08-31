const mongoose = require('mongoose');

const deletedRecordSchema = new mongoose.Schema({
  originalCollection: { 
    type: String, 
    required: true,
    enum: ['Booking', 'Subscription', 'Nurse']
  },
  originalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  documentData: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  deletedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('DeletedRecord', deletedRecordSchema);
