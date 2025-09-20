const mongoose = require('mongoose');

const clinicInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  noOfExperience: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 0;
      },
      message: 'Number of experience must be a non-negative integer'
    }
  },
  noOfPatients: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 0;
      },
      message: 'Number of patients must be a non-negative integer'
    }
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Phone number must be a valid international format'
    }
  },
  location1: {
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Location 1 URL must be a valid HTTP/HTTPS URL'
      }
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500
    }
  },
  location2: {
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Location 2 URL must be a valid HTTP/HTTPS URL'
      }
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500
    }
  },
  socialLinks: {
    facebook: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?facebook\.com\/.+/.test(v);
        },
        message: 'Facebook link must be a valid Facebook URL'
      }
    },
    instagram: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?instagram\.com\/.+/.test(v);
        },
        message: 'Instagram link must be a valid Instagram URL'
      }
    }
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Email must be a valid email address'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ClinicInfo', clinicInfoSchema);
