const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 1 && v <= 5;
      },
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxLength: 1000
  },
  status: {
    type: String,
    enum: ['enable', 'disable'],
    default: 'enable'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
