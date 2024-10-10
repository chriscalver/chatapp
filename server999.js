const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
// const fs = require("fs");
const cors = require("cors");
const users = [];

const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
  "http://laptop:5556",
  "https://chriscalver.com:8080",
  "http://chriscalver.com",
  "http://laptop:8080",
  "http://laptop:5556",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const io = new Server(httpServer);

const onSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("user:join", (name) => {
      !users.some((user) => user.name === name) &&
        users.push({ name, sockeId: socket.id });
      io.emit("global:message", `${name} just joined`);
      console.log("System Message: " + name + " just joined");
    });

    socket.on("message:send", (payload) => {
      socket.broadcast.emit("message:receive", payload);
      console.log(`${payload.name} says: ${payload.message}`);
    });

    socket.on("disconnect", () => {
      const user = users.filter((user) => user.sockeId === socket.id);
      io.emit("global:message", `${user[0].name} just left`);
      console.log(`System Message: ${user[0].name} just left`);
    });
  });
};

onSocket(io);
// const port = process.env.PORT || 8080;
const port = 8080;

httpServer.listen(port, () => console.log(`Listening on port ${port}...`));
