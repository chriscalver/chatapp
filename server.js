var port = process.env.PORT || 8080;

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
  var isIisNamedPipe = typeof process.env.PORT === "string" && process.env.PORT.indexOf("\\\\.\\pipe\\") === 0;
  var socketPath = process.env.SOCKET_IO_PATH || (isIisNamedPipe ? "/chat2026/socket.io" : "/socket.io");

  var allowedOrigins = [
    "https://www.chriscalver.com",
    "https://chriscalver.com",
    "http://www.chriscalver.com",
    "http://chriscalver.com",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081"
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

  function logCurrentUsers(contextLabel) {
    var names = users.map(function (user) {
      return user.name;
    });

    console.log("Current people in chat" + (contextLabel ? " (" + contextLabel + ")" : "") + ":", names.length ? names.join(", ") : "none");
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
      var requestedName = (typeof name === "string" ? name.trim() : "");
      var existingUser = findUserBySocketId(socket.id);

      if (!requestedName) {
        socket.emit("user:join:error", "Please enter a valid username.");
        return;
      }

      if (existingUser) {
        socket.emit("user:join:ok", existingUser.name);
        return;
      }

      if (isUserNameInUse(requestedName)) {
        socket.emit("user:join:error", "That username is already in use. Pick a different one.");
        return;
      }

      users.push({ name: requestedName, socketId: socket.id });
      socket.emit("user:join:ok", requestedName);

      io.emit("global:message", requestedName + " just joined");
      console.log("System Message: " + requestedName + " just joined");
      logCurrentUsers("after join");
    });

    socket.on("message:send", function (payload) {
      var user = findUserBySocketId(socket.id);
      var message = payload && typeof payload.message === "string" ? payload.message.trim() : "";
      var serverPayload;

      if (!user || !message) {
        return;
      }

      serverPayload = { name: user.name, message: message };

      socket.broadcast.emit("message:receive", serverPayload);
      console.log(serverPayload.name + " says: " + serverPayload.message);
      logCurrentUsers("during message");

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

    socket.on("disconnect", function (reason) {
      var user = findUserBySocketId(socket.id);

      if (!user) {
        console.log("Disconnect for unknown socket " + socket.id + " (reason: " + reason + ")");
        return;
      }

      io.emit("global:message", user.name + " just left");
      console.log("System Message: " + user.name + " just left");
      console.log("Disconnect reason for " + user.name + ": " + reason);

      users.splice(users.indexOf(user), 1);
      logCurrentUsers("after disconnect");
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
