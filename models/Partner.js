const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  image: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  partnerName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Partner', partnerSchema);
