const mongoose = require("mongoose");

const snippetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String },
  pinned: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Snippet", snippetSchema);
