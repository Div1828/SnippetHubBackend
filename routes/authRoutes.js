const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../Middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);


router.get("/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
