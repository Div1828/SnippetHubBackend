
const express = require("express");
const router = express.Router();
const User = require("../models/User");


router.get("/exists", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ message: "username required" });

  try {
    const user = await User.findOne({ username });
    res.json({ exists: !!user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
