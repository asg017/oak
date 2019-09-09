import * as readPackageJson from "read-package-json";

export default (): void => {
  readPackageJson("./package.json", (err: any, data: any) => {
    if (err) throw Error("Could not read package.json");
    console.log(data.version);
  });
};
