const mongoose = require("mongoose");

const snippetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: String,
    pinned: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerUsername: { type: String, required: true },
    collaborators: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Snippet", snippetSchema);
