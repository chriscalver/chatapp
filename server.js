const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const users = [];

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  "https://chriscalver.com:8080",
  "http://chriscalver.com",
  "http://laptop:8080",
  "http://laptop:5556",
  "http://localhost:8080",
  "http://localhost:5556",
  "http://StudioPC",
  "http://laptop",
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

io.on("connection", (socket) => {
  socket.on("user:join", (name) => {
    if (!users.some((user) => user.name === name)) {
      users.push({ name, socketId: socket.id });
    }
    io.emit("global:message", `${name} just joined`);
    console.log("System Message: " + name + " just joined");

    console.log(users);
  });

  socket.on("message:send", (payload) => {
    socket.broadcast.emit("message:receive", payload);
    console.log(`${payload.name} says: ${payload.message}`);
    console.log(users);
    io.fetchSockets()
        .then((sockets) => {
          sockets.forEach((socket) => {
            console.log(socket.id);
          });
        })
        .catch(console.log);
  });

  socket.on("disconnect", () => {
    const user = users.find((user) => user.socketId === socket.id);
    if (user) {
      io.emit("global:message", `${user.name} just left`);

      console.log(`System Message: ${user.name} just left`);

      socket.disconnect();

      users.splice(users.indexOf(user), 1);
      console.log(users);
      console.log(socket.id);

      io.fetchSockets()
        .then((sockets) => {
          sockets.forEach((socket) => {
            console.log(socket.id);
          });
        })
        .catch(console.log);
      // console.log(clients);
    }
  });
  // socket.on("disconnect", () => {
  //   const user = users.filter((user) => user.sockeId === socket.id);
  //   io.emit("global:message", `${user[0].name} just left`);
  //   console.log(`System Message: ${user[0].name} just left`);
  // });
});

const port = 8080;
httpServer.listen(port, () => console.log(`Listening on port ${port}...`));
