import { oak_studio } from "../../src";
import test from "tape";
import http from "http";

import { envFile } from "../utils";

const env = envFile(__dirname);

test("studio", async t => {
  const server = oak_studio({ filename: env("Oakfile"), port: "1997" });
  const apiOakfile = await new Promise((resolve, reject) =>
    http
      .get("http://localhost:1997/api/oakfile", resp => {
        let data = "";

        resp.on("data", chunk => {
          data += chunk;
        });

        resp.on("end", () => {
          resolve(data);
        });
      })
      .on("error", reject)
  );
  t.equals(
    apiOakfile,
    'a = task({\n  target: "a",\n  run: a => shell`echo -n "a" > ${a}`\n});\n'
  );
  server.close();
  t.end();
});
