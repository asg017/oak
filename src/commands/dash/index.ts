import express from "express";
import { createReadStream } from "fs";
import { join } from "path";
import { oak_pulse } from "../../commands/pulse";
import { fileArgument } from "../../cli-utils";
import cors from "cors";
import { networkInterfaces } from "os";
import { getStat } from "../../utils";

export default function oak_dash(args: { filename: string; port: string }) {
  const oakfilePath = fileArgument(args.filename);
  const app = express();
  app.get("/api/oakfile", (req, res) => {
    createReadStream(oakfilePath).pipe(res);
  });
  app.get("/api/pulse", express.json(), cors(), async (req, res) => {
    const pulseResult = await oak_pulse({ filename: oakfilePath });
    res.json({ ACK: true, pulseResult });
  });
  app.get("/api/meta", express.json(), cors(), async (req, res) => {
    const stat = await getStat(oakfilePath);
    res.json({ ACK: true, oakfilePath, stat });
  });

  app.listen(args.port);

  app.use(express.static(join(__dirname, "dash-frontend", "dist")));
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
