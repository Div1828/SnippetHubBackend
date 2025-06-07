const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Snippet = require("../models/Snippet");
const authMiddleware = require("../Middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user._id); 
    const snippets = await Snippet.find({
      $or: [
        { owner: ownerId },
        { isPublic: true }
      ]
    }).sort({ createdAt: -1 });
    res.json(snippets);
  } catch (err) {
    console.error("Failed to fetch snippets:", err);
    res.status(500).json({ message: "Failed to fetch snippets" });
  }
});



router.post("/", async (req, res) => {
  const { title, content, category, isPublic } = req.body;
  try {
    const newSnippet = new Snippet({
      title,
      content,
      category,
      isPublic: isPublic ?? false,
      owner: req.user._id,
    });
    await newSnippet.save();
    res.status(201).json(newSnippet);
  } catch (err) {
    res.status(400).json({ message: "Failed to create snippet" });
  }
});


router.put("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const snippet = await Snippet.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!snippet) return res.status(404).json({ message: "Not found or unauthorized" });
    res.json(snippet);
  } catch (err) {
    res.status(400).json({ message: "Update failed" });
  }
});


router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Snippet.findOneAndDelete({ _id: id, owner: req.user._id });
    if (!deleted) return res.status(404).json({ message: "Not found or unauthorized" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Delete failed" });
  }
});

module.exports = router;
