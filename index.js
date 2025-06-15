require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");


const redis = require("./redisClient"); 
const snippetRoutes = require("./routes/snippetRoutes");
const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: "https://snippet-hub-six.vercel.app",
  credentials: true,
}));
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
    origin: "https://snippet-hub-six.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const snippetPresence = {};

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("joinSnippet", (snippetId, userId) => {
    socket.join(snippetId);
    console.log(`🟢 User ${userId} joined snippet ${snippetId}`);

    if (!snippetPresence[snippetId]) snippetPresence[snippetId] = new Set();
    snippetPresence[snippetId].add(userId);

    io.to(snippetId).emit("presenceUpdate", Array.from(snippetPresence[snippetId]));
  });

  socket.on("editSnippet", ({ snippetId, content }) => {
    socket.to(snippetId).emit("snippetUpdated", content);
  });

  socket.on("leaveSnippet", (snippetId, userId) => {
    socket.leave(snippetId);
    console.log(`🔴 User ${userId} left snippet ${snippetId}`);

    if (snippetPresence[snippetId]) {
      snippetPresence[snippetId].delete(userId);
      if (snippetPresence[snippetId].size === 0) {
        delete snippetPresence[snippetId];
      } else {
        io.to(snippetId).emit("presenceUpdate", Array.from(snippetPresence[snippetId]));
      }
    }
  });

  socket.on("disconnecting", () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach((roomId) => {
      if (snippetPresence[roomId]) {
        for (const userId of snippetPresence[roomId]) {
          snippetPresence[roomId].delete(userId);
          io.to(roomId).emit("presenceUpdate", Array.from(snippetPresence[roomId]));
        }
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    server.listen(PORT, () =>
      console.log(`🚀 Server running at https://snippethubbackend.onrender.com`)
    );
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
