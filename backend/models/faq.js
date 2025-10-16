const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    default: 'General'
  },
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('FAQ', faqSchema);