var debug = require("debug")("x-code:v1:socketRoutes"),
  SocketIO = rootRequire("support/socket.io"),
  UserController = require("../socketControllers/userSocketController.js");

var DecodeSocketRequestPolicy = require("../policies/decodeSocketRequest.js");

exports.init = function(app, apiBase) {
  console.log("apiBase", apiBase);
  //   apibase = /admin_v1
  // link = http://localhost:7025/admin_v1/gogoTaxi
  SocketIO.on("io", function(io) {
    // var nsp = io.of(apiBase + "/gogoTaxi");
    var nsp = io.of("http://localhost:6025/admin_v1/gogoTaxi/");
    nsp.on("connection", function(socket) {
      console.log("someone connected", socket);
      debug("client connection established :->", socket.id);
      // to decode request parameters
      socket.use(DecodeSocketRequestPolicy);

      socket.emit("connected", "You are connected.");

      // TEST
      socket.on("test", UserController.test.bind(null, socket, nsp));

      socket.on("connect", UserController.connect.bind(null, socket, nsp));

      //emit pong
      socket.emit("server-pong", {
        message: "pong"
      });
    });
  });
};
