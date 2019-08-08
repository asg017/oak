import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as randomatic from "randomatic";
import * as socketioJwt from "socketio-jwt";
import * as jwt from "jsonwebtoken";

const SECRET = randomatic("Aa0", 24);

export default function oak_dash(args: { filename: string; port: string }) {
  const app = express();
  const server = new http.Server(app);
  const io = socketio(server);
  server.listen(args.port);

  const token = jwt.sign(
    {
      data: "url"
    },
    SECRET,
    { expiresIn: "10hr" }
  );
  console.log(`Listening at http://localhost:${args.port}?token=${token}`);
  app.get("/", function(req, res) {
    res.sendFile(__dirname + "/static/index.html");
  });

  io.on("connection", function(socket) {
    socket.emit("news", { hello: "world" });
    socket.on("my other event", function(data) {
      console.log(data);
    });
  });
}
