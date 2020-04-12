import express from "express";
import { createReadStream } from "fs";
import { dirname, join } from "path";
import { getPulse } from "../../core/pulse";
import { fileArgument } from "../../cli-utils";
import cors from "cors";
import { networkInterfaces } from "os";
import { getStat } from "../../utils";
import { Server } from "http";
import socketio from "socket.io";
import chokidar from "chokidar";
import { getAndMaybeIntializeOakDB } from "../../db";

type OakfileEvent = "oakfile" | "oakdb" | "target";

// Watch for all changes that could happen to the Oakfile, or the
// targets that the Oakfile cares about.
async function watchOakfileEvents(
  oakfilePath: string,
  callback: (type: OakfileEvent) => void
): Promise<() => Promise<void>> {
  const oakdbPath = join(dirname(oakfilePath), ".oak", "oak.db");
  const oakdatadir = join(dirname(oakfilePath), "oak_data");
  let unwatchDynamic;
  async function watchDynamic(watcher) {
    let targets: string[] = [];
    let taskWatches: string[] = [];

    const pulse = await getPulse(oakfilePath);
    targets = pulse.tasks.map(({ task }) => task.target).filter(s => s);
    taskWatches = pulse.tasks
      .map(({ task }) =>
        task.watch.map(w => join(dirname(task.pulse.oakfilePath), w))
      )
      .filter(w => w.length)
      .reduce((a, v) => {
        for (let w of v) a.push(w);
        return a;
      }, []);

    console.log(targets, taskWatches);
    watcher.add(targets);
    watcher.add(taskWatches);
    return function unwatchDynamic() {
      watcher.unwatch(targets);
      watcher.unwatch(taskWatches);
    };
  }
  const watcher = chokidar
    .watch("file or dir", { ignoreInitial: true })
    .on("all", async (eventName, path, stats) => {
      if (path.includes(oakdatadir)) {
        callback("target");
        return;
      }

      if (path === oakfilePath) {
        // since the oakfile changed, the targets may be different now.
        // so, unwatch the old targets, find the new ones, and watch them.
        unwatchDynamic && unwatchDynamic();
        unwatchDynamic = await watchDynamic(watcher);

        callback("oakfile");
      }
      callback("oakdb");
    });
  watcher.add(oakfilePath);
  watcher.add(oakdatadir);
  unwatchDynamic = await watchDynamic(watcher);

  //watcher.add(oakdbPath);
  return function cleanUpWatcher() {
    return watcher.close();
  };
}

function throttle(func, wait, options?) {
  var timeout, context, args, result;
  var previous = 0;
  if (!options) options = {};

  var later = function() {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };

  var throttled = function() {
    var _now = Date.now();
    if (!previous && options.leading === false) previous = _now;
    var remaining = wait - (_now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = _now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };

  /*throttled.cancel = function() {
    clearTimeout(timeout);
    previous = 0;
    timeout = context = args = null;
  };*/

  return throttled;
}

export function studioCommand(args: { filename: string; port: string }) {
  const oakfilePath = fileArgument(args.filename);
  const oakDB = getAndMaybeIntializeOakDB(oakfilePath);

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

  app.use(express.static(join(__dirname, "frontend", "dist")));
  app.use("/", (req, res) => {
    res.status(200).sendFile(join(__dirname, "frontend", "dist", "index.html"));
  });
  io.on("connection", async socket => {
    const onEvent = throttle(async (changeType: OakfileEvent) => {
      console.log("onEvent", changeType);
      const pulse = await getPulse(oakfilePath);
      socket.emit("oakfile", { changeType, pulse });
    }, 250);
    const cleanUpWatcher = await watchOakfileEvents(oakfilePath, onEvent);
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
