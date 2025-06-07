const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Snippet = require("../models/Snippet");
const authMiddleware = require("../Middleware/authMiddleware");


router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  let userId = null;
  let username = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;

      
      const User = require("../models/User");
      const user = await User.findById(userId).select("username");
      if (user) username = user.username;
    } catch (err) {
      
    }
  }

  try {
    const query = username
      ? {
          $or: [
            { owner: userId },
            { isPublic: true },
            { collaborators: username },
          ],
        }
      : { isPublic: true };

    const snippets = await Snippet.find(query).populate("owner", "username");
    res.json(snippets);
  } catch (err) {
    console.error("Failed to fetch snippets:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/", authMiddleware, async (req, res) => {
  const { title, content, category, isPublic, collaborators = [] } = req.body;

  try {
    const newSnippet = new Snippet({
      title,
      content,
      category,
      isPublic: isPublic ?? false,
      owner: req.user._id,
      ownerUsername: req.user.username,
      collaborators,
    });

    await newSnippet.save();
    res.status(201).json(newSnippet);
  } catch (err) {
    console.error("Failed to create snippet:", err);
    res.status(400).json({ message: "Failed to create snippet" });
  }
});


router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const snippet = await Snippet.findById(id);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    const isOwner = snippet.owner.toString() === req.user._id.toString();
    const isCollaborator = snippet.collaborators.includes(req.user.username);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Not authorized to edit" });
    }

    if (isOwner) {
      
      Object.assign(snippet, req.body);
    } else {
    
      if (req.body.title !== undefined) snippet.title = req.body.title;
      if (req.body.content !== undefined) snippet.content = req.body.content;
    }

    await snippet.save();
    res.json(snippet);
  } catch (err) {
    console.error("Edit failed:", err);
    res.status(400).json({ message: "Update failed" });
  }
});


router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Snippet.findOneAndDelete({ _id: id, owner: req.user._id });
    if (!deleted) return res.status(404).json({ message: "Not found or unauthorized" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Delete failed" });
  }
});


router.patch("/:id/toggle-public", authMiddleware, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    const userId = req.user._id.toString();
    const username = req.user.username;
    const isOwner = snippet.owner.toString() === userId;
    const isCollaborator = snippet.collaborators.includes(username);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Access denied" });
    }

    snippet.isPublic = !snippet.isPublic;
    await snippet.save();

    res.json({ success: true, isPublic: snippet.isPublic });
  } catch (err) {
    console.error("Toggle public error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
