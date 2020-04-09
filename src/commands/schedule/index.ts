import { oak_run, defaultHookEmitter } from "../../core/run";
import { EventEmitter } from "events";
import express from "express";
import { Server } from "http";
import socketio from "socket.io";
import { join } from "path";
import { runInkApp } from "../run/ui";

function runDashboard(port: string, runEvents: EventEmitter) {
  const app = express();
  const server = new Server(app);
  const io = socketio(server);
  app.use(express.static(join(__dirname, "dashboard", "dist")));
  app.use("/", (req, res) => {
    res
      .status(200)
      .sendFile(join(__dirname, "dashboard", "dist", "index.html"));
  });
  server.listen(port);

  const status = {};
  const runEventsSocket = io.of("/runevents");
  runEventsSocket.on("connection", socket => {});

  const schedulePulseSocket = io.of("/schedulepulse");
  schedulePulseSocket.on("connection", socket => {});

  const pulse = {
    cells: new Map(),
    tasks: new Map(),
    schedules: new Map(),
  };

  runEvents.on("s", scheduler => runEventsSocket.emit("s", scheduler));
  runEvents.on("st", (tick, scheduler) =>
    runEventsSocket.emit("st", tick, scheduler)
  );
  runEvents.on("co", cellName => runEventsSocket.emit("co", cellName));
  runEvents.on("cp", cellName => runEventsSocket.emit("cp", cellName));
  runEvents.on("cf", cellName => runEventsSocket.emit("cf", cellName));
  runEvents.on("cr", cellName => runEventsSocket.emit("cr", cellName));
  runEvents.on("te-start", (cellName, cellTarget) =>
    runEventsSocket.emit(cellName, cellTarget)
  );
  runEvents.on("te-end", cellName => runEventsSocket.emit("te-end", cellName));
  runEvents.on("t-f", (cellName, cellTarget) =>
    runEventsSocket.emit("t-f", cellName, cellTarget)
  );
  process.on("SIGINT", () => {
    server.close();
    process.exit(0);
  });
}

export default async function scheduleCommand(args: {
  filename: string;
  targets: readonly string[];
  dash: boolean;
  port: string;
}) {
  const runEvents = new EventEmitter();

  if (args.dash) {
    runDashboard(port, runEvents);
  } else {
    runInkApp(runEvents);
  }

  const hooks = defaultHookEmitter(runEvents);
  await oak_run({
    filename: args.filename,
    targets: args.targets,
    schedule: true,
    hooks,
  });
}
