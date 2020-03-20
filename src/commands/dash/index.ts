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

type OakfileEvent = "oakfile" | "target";

// Watch for all changes that could happen to the Oakfile, or the
// targets that the Oakfile cares about.
async function watchOakfileEvents(
  oakfilePath: string,
  callback: (type: string) => void
) {
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
  /*function watchOakfile(oakfilePath: string) {
    console.log("watchOakfile");
    const oakfileWatcher = watch(
      oakfilePath,
      { persistent: false },
      async (eventType, filename) => {
        const pulse = await getPulse(oakfilePath);
        targetWatchers(); // close the target watchers;

        targetWatchers = watchTargets(pulse.tasks.map(task => task.target));
        callback("oakfile");
      }
    );
    return () => {
      oakfileWatcher.close();
    };
  }
  function watchTargets(targets: string[]) {
    console.log("watchTarget");
    const taskWatchers = [];
    for (let target of targets) {
      const watcher = watch(target, { persistent: false }, async () => {
        callback("target");
      });
      taskWatchers.push(watcher);
    }
    return () => {
      taskWatchers.map(watcher => watcher.close());
    };
  }

  const pulseResult = await getPulse(oakfilePath);
  targetWatchers = watchTargets(pulseResult.tasks.map(task => task.target));
  const oakfileWatcher = watchOakfile(oakfilePath);

  return () => {
    oakfileWatcher(); // close oakfile watcher
    targetWatchers(); // close target watchers
  };*/
}

export default function oak_dash(args: { filename: string; port: string }) {
  const oakfilePath = fileArgument(args.filename);
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

  app.use(express.static(join(__dirname, "dash-frontend", "dist")));

  io.on("connection", socket => {
    console.log("io connection");
    watchOakfileEvents(oakfilePath, async (changeType: OakfileEvent) => {
      const pulse = await getPulse(oakfilePath);
      socket.emit("oakfile", { changeType, pulse });
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
