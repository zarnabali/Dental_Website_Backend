const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  designation: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  speciality: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
