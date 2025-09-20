const mongoose = require('mongoose');

const teamPictureSchema = new mongoose.Schema({
  teamName: {
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
  picture: {
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

// Ensure only one team picture can exist
teamPictureSchema.index({}, { unique: true });

module.exports = mongoose.model('TeamPicture', teamPictureSchema);
