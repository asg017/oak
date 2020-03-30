import express from "express";
import { createReadStream } from "fs";
import { dirname, join } from "path";
import { getPulse } from "../../commands/pulse";
import { fileArgument } from "../../cli-utils";
import cors from "cors";
import { networkInterfaces } from "os";
import { getStat } from "../../utils";
import { Server } from "http";
import socketio from "socket.io";
import chokidar from "chokidar";
import { OakDB } from "../../db";

type OakfileEvent = "oakfile" | "target";

// Watch for all changes that could happen to the Oakfile, or the
// targets that the Oakfile cares about.
async function watchOakfileEvents(
  oakfilePath: string,
  callback: (type: string) => void
): Promise<() => Promise<void>> {
  let targets = [];
  const oakdatadir = join(dirname(oakfilePath), "oak_data");
  const watcher = chokidar
    .watch("file or dir")
    .on("all", async (eventName, path, stats) => {
      if (path.includes(oakdatadir) && eventName === "add") {
        callback("target");
      }
      if (path === oakfilePath) {
        watcher.unwatch(targets);
        const pulse = await getPulse(oakfilePath);
        targets = pulse.tasks.map(task => task.target);
        watcher.add(targets);
        callback("oakfile");
        return;
      }
      callback("target");
    });
  watcher.add(oakfilePath);
  watcher.add(oakdatadir);
  return function cleanUpWatcher() {
    return watcher.close();
  };
}

export default function oak_dash(args: { filename: string; port: string }) {
  const oakfilePath = fileArgument(args.filename);
  const oakDB = new OakDB(oakfilePath);

  const app = express();
  const server = new Server(app);
  const io = socketio(server);

  app.get("/api/oakfile", (req, res) => {
    createReadStream(oakfilePath).pipe(res);
  });
  app.get("/api/pulse", express.json(), cors(), async (req, res) => {
    const pulseResult = await getPulse(oakfilePath);
    res.json({ ACK: true, pulseResult });
  });
  app.get("/api/meta", express.json(), cors(), async (req, res) => {
    const stat = await getStat(oakfilePath);
    res.json({ ACK: true, oakfilePath, stat });
  });
  app.get("/api/logs", express.json(), cors(), async (req, res) => {
    const logs = await oakDB.getLogs();
    res.json({ logs });
  });
  app.get("/api/log", express.json(), cors(), async (req, res) => {
    const log = await oakDB.getLogById(req.query.rowid);
    createReadStream(log.path).pipe(res);
  });
  app.get("/api/runs", express.json(), cors(), async (req, res) => {
    const runs = await oakDB.getRuns();
    res.json({ runs });
  });

  app.use(express.static(join(__dirname, "dash-frontend", "dist")));
  app.use("/", (req, res) => {
    res
      .status(200)
      .sendFile(join(__dirname, "dash-frontend", "dist", "index.html"));
  });
  io.on("connection", async socket => {
    const cleanUpWatcher = await watchOakfileEvents(
      oakfilePath,
      async (changeType: OakfileEvent) => {
        const pulse = await getPulse(oakfilePath);
        socket.emit("oakfile", { changeType, pulse });
      }
    );
    socket.on("disconnect", () => {
      cleanUpWatcher();
    });
  });

  server.listen(args.port);

  const ifaces = networkInterfaces();

  console.log(`Listening on:`);

  // TODO
  // 1) specify protocol
  // 2) specifiy address
  // 3) portfinder? nah
  const protocol = "http://";

  Object.keys(ifaces).forEach(function(dev) {
    ifaces[dev].forEach(function(details) {
      if (details.family === "IPv4") {
        console.info("  " + protocol + details.address + ":" + args.port);
      }
    });
  });
}
