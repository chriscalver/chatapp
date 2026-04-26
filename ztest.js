var http = require("http");

http.createServer(function (req, res) {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Node test OK\nNode: " + process.version + "\nPORT: " + process.env.PORT);
}).listen(process.env.PORT);
