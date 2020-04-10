import readPackageJson from "read-package-json";
import { join } from "path";

const pkgPath = join(__dirname, "..", "..", "package.json");

export function versionCommand() {
  readPackageJson(pkgPath, (err: any, data: any) => {
    if (err) throw Error(`Could not read package.json at ${pkgPath}`);
    console.log(data.version);
  });
}
