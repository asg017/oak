import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as randomatic from "randomatic";
import * as socketioJwt from "socketio-jwt";
import * as jwt from "jsonwebtoken";
import { watch } from "fs";
import { parseOakfile, ParseOakfileResults } from "../utils";
import { join } from "path";
import { getDot } from "../oak-print";

const SECRET = randomatic("Aa0", 24);

type SocketOakfileType = {
  oakfile: ParseOakfileResults;
  dot: string;
};

const emitOakfile = (socket: any, socketOakfile: SocketOakfileType) => {
  socket.emit("Oakfile", socketOakfile);
};

const watchOakfile = async (socket: socketio.Socket, path: string) => {
  const initialOakfile = await parseOakfile(path);
  const dot = getDot(initialOakfile);
  emitOakfile(socket, { oakfile: initialOakfile, dot: dot.to_dot() });
  watch(path, async (event, filename) => {
    console.log(event);
    const oakfile = await parseOakfile(path);
    const dot = getDot(initialOakfile);
    emitOakfile(socket, { oakfile, dot: dot.to_dot() });
  });
};

export default function oak_dash(args: { filename: string; port: string }) {
  const app = express();
  const server = new http.Server(app);
  const io = socketio(server);
  server.listen(args.port);

  const token = jwt.sign(
    {
      data: "url",
    },
    SECRET,
    { expiresIn: "10hr" }
  );
  const encodedToken = new Buffer(token).toString("base64");
  console.log(
    `Listening at http://localhost:${args.port}?token=${encodedToken}`
  );
  app.use(express.static(join(__dirname, "dash-frontend", "dist")));

  io.on(
    "connection",
    socketioJwt.authorize({
      secret: SECRET,
      timeout: 2000,
    })
  ).on("authenticated", function(socket) {
    watchOakfile(socket, args.filename);
    console.log("authenticated");
    socket.emit("news", { hello: "world" });
    socket.on("my other event", function(data) {
      console.log(data);
    });
  });
}
