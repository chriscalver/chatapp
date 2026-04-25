var port = parseInt(process.env.PORT, 10) || 8080;

function startDiagnosticServer(err) {
  var http = require("http");
  var details = (err && err.stack) ? err.stack : String(err);
  http.createServer(function (req, res) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Chat2026 startup error\n\n" + details);
  }).listen(port, function () {
    console.error("Startup failed. Diagnostic server listening on port " + port);
    console.error(details);
  });
}

try {
  var express = require("express");
  var createServer = require("http").createServer;
  var Server = require("socket.io").Server;
  var path = require("path");
  var cors = require("cors");

  var users = [];
  var publicDir = path.join(__dirname, "public");
  var app = express();
  var httpServer = createServer(app);
  var socketPath = process.env.SOCKET_IO_PATH || "/socket.io";

  var allowedOrigins = [
    "https://www.chriscalver.com",
    "https://chriscalver.com",
    "http://www.chriscalver.com",
    "http://chriscalver.com"
  ];

  function isUserNameInUse(name) {
    var i;
    for (i = 0; i < users.length; i += 1) {
      if (users[i].name === name) {
        return true;
      }
    }
    return false;
  }

  function findUserBySocketId(socketId) {
    var i;
    for (i = 0; i < users.length; i += 1) {
      if (users[i].socketId === socketId) {
        return users[i];
      }
    }
    return null;
  }

  var corsOptions = {
    origin: function (origin, callback) {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  };

  app.use(cors(corsOptions));
  app.use(express.static(publicDir));
  app.use("/chat2026", express.static(publicDir));

  app.get(["/", "/chat2026", "/chat2026/"], function (req, res) {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  var io = new Server(httpServer, {
    path: socketPath,
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", function (socket) {
    socket.on("user:join", function (name) {
      if (!isUserNameInUse(name)) {
        users.push({ name: name, socketId: socket.id });
      }

      io.emit("global:message", name + " just joined");
      console.log("System Message: " + name + " just joined");
      console.log(users);
    });

    socket.on("message:send", function (payload) {
      socket.broadcast.emit("message:receive", payload);
      console.log(payload.name + " says: " + payload.message);
      console.log(users);

      io.fetchSockets()
        .then(function (sockets) {
          sockets.forEach(function (connectedSocket) {
            console.log(connectedSocket.id);
          });
        })
        .catch(function (error) {
          console.log(error);
        });
    });

    socket.on("disconnect", function () {
      var user = findUserBySocketId(socket.id);

      if (!user) {
        return;
      }

      io.emit("global:message", user.name + " just left");
      console.log("System Message: " + user.name + " just left");

      users.splice(users.indexOf(user), 1);
      console.log(users);
      console.log(socket.id);

      io.fetchSockets()
        .then(function (sockets) {
          sockets.forEach(function (connectedSocket) {
            console.log(connectedSocket.id);
          });
        })
        .catch(function (error) {
          console.log(error);
        });
    });
  });

  httpServer.listen(port, function () {
    console.log("Listening on port " + port + "...");
  });
} catch (err) {
  startDiagnosticServer(err);
}
