const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Snippet = require("../models/Snippet");
const User = require("../models/User");
const redis = require("../redisClient"); 

const router = express.Router();

async function getUserFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing token");

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new Error("User not found");
  return user;
}


router.get("/", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    const username = user.username;
    const redisKey = `snippets:${username}`;

    const cached = await redis.get(redisKey);
    if (cached) {
      console.log("🧠 Redis cache hit");
      return res.json(JSON.parse(cached));
    }

    console.log("💾 Redis cache miss. Fetching MongoDB...");
    const query = {
      $or: [
        { owner: user._id },
        { isPublic: true },
        { collaborators: username },
      ],
    };

    const snippets = await Snippet.find(query).populate("owner", "username");
    await redis.set(redisKey, JSON.stringify(snippets), "EX", 3600);

    res.json(snippets);
  } catch (err) {
    console.error("❌ Error fetching snippets:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.post("/", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    const { title, content, category, isPublic, collaborators } = req.body;

    const newSnippet = new Snippet({
      title,
      content,
      category,
      isPublic: !!isPublic,
      collaborators: collaborators || [],
      owner: user._id,
      ownerUsername: user.username,
    });

    const saved = await newSnippet.save();
    await redis.del(`snippets:${user.username}`);

    const populated = await Snippet.findById(saved._id).populate("owner", "username");
    res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Error creating snippet:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    const snippetId = req.params.id;

    const snippet = await Snippet.findById(snippetId);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    const isOwner = snippet.owner.toString() === user._id.toString();
    const isCollaborator = snippet.collaborators.includes(user.username);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Not authorized to edit" });
    }

    const fieldsToUpdate = ["title", "content", "category", "isPublic", "collaborators"];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) snippet[field] = req.body[field];
    });

    await snippet.save();

    const affectedUsers = [snippet.ownerUsername, ...(snippet.collaborators || [])];
    const uniqueKeys = new Set(affectedUsers.map(u => `snippets:${u}`));
    for (const key of uniqueKeys) {
      await redis.del(key);
    }

    const updated = await Snippet.findById(snippet._id).populate("owner", "username");
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating snippet:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    const isOwner = snippet.owner.toString() === user._id.toString();
    if (!isOwner) return res.status(403).json({ message: "Only owner can delete" });

    await snippet.deleteOne();

    const affectedUsers = [snippet.ownerUsername, ...(snippet.collaborators || [])];
    const uniqueKeys = new Set(affectedUsers.map(u => `snippets:${u}`));
    for (const key of uniqueKeys) {
      await redis.del(key);
    }

    res.json({ message: "Snippet deleted" });
  } catch (err) {
    console.error("❌ Error deleting snippet:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
