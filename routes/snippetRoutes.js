const express = require("express");
const Snippet = require("../models/Snippet");

const router = express.Router();


router.get("/", async (req, res) => {
  const snippets = await Snippet.find();
  res.json(snippets);
});



router.post("/", async (req, res) => {
  try {
    const snippet = new Snippet(req.body);
    const savedSnippet = await snippet.save();

    res.status(201).json(savedSnippet);
  } catch (error) {
    res.status(500).json({ message: "Failed to create snippet" });
  }
});



router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Snippet.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Snippet not found" });
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Error deleting snippet" });
  }
});



router.put("/:id", async (req, res) => {
  try {
    const updatedSnippet = await Snippet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedSnippet);
  } catch (err) {
    res.status(500).json({ error: "Error updating snippet" });
  }
});


module.exports = router;
