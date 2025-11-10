const mongoose = require('mongoose');

const resultsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50 // Short title, 4-5 words max
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100 // Short description, 7 words max
  },
  beforeImage: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  afterImage: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Results', resultsSchema);

