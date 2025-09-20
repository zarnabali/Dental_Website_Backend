const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    maxLength: 2000
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FAQ', faqSchema);
