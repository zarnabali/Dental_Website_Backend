const mongoose = require('mongoose');

const paraSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const pointParaSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true
  },
  sentences: [{
    type: String,
    required: true,
    trim: true
  }]
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  cardInfo: {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
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
    }
  },
  serviceBlog: {
    heroImage: {
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
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    paras: [paraSchema],
    pointParas: [pointParaSchema],
    youtubeLinks: [{
      type: String,
      validate: {
        validator: function(v) {
          return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(v);
        },
        message: 'Must be a valid YouTube URL'
      }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);