const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  logo: { type: String, required: true },
  website: { type: String, trim: true },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Brand', BrandSchema);