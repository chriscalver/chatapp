
const users = [];

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

// export default onSocket;
