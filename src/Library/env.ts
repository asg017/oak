export default function env(key: string) {
  if (typeof key !== "string") {
    throw Error(`env: Invalid argument supplied (must be a string) ${key}`);
  }
  return process.env[key];
}
