const mongoose = require('mongoose');

const heroVideoSchema = new mongoose.Schema({
  video: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500
  },
  textColor: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Text color must be a valid HEX color code'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HeroVideo', heroVideoSchema);
