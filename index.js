const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http"); 
const { Server } = require("socket.io"); 

const snippetRoutes = require("./routes/snippetRoutes");
const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");



dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


app.use("/api/snippets", snippetRoutes);
app.use("/api/auth", authRoutes);
app.use("/users", usersRoutes);

app.get("/", (req, res) => {
  res.send("SnippetHub backend is live");
});


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});


io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("joinSnippet", (snippetId, userId) => {
    socket.join(snippetId);
    console.log(`🟢 User ${userId} joined snippet ${snippetId}`);
    socket.to(snippetId).emit("userJoined", userId);
  });

  socket.on("editSnippet", ({ snippetId, content }) => {
    socket.to(snippetId).emit("snippetUpdated", content);
  });

  socket.on("leaveSnippet", (snippetId, userId) => {
    socket.leave(snippetId);
    console.log(`🔴 User ${userId} left snippet ${snippetId}`);
    socket.to(snippetId).emit("userLeft", userId);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    server.listen(PORT, () => 
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
