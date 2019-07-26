import { createLogger } from "./logging";

const logger = createLogger({ label: "OakInspector" });
export class OakInspector {
  socket: any;
  initialName: string;
  constructor(socket, initialName) {
    this.socket = socket;
    this.initialName = initialName;
    logger.debug(`CustomInspector constructor called`);
  }

  pending() {
    logger.debug(`${this.initialName} pending called`);
    if (this.socket)
      this.socket.emit("pending", { initialName: this.initialName });
  }

  fulfilled(value:any, name:string) {
    logger.debug(`fulfilled called, ${value}|${name}`);
    if (this.socket) this.socket.emit("fulfilled", { value, name });
  }

  rejected(error:any, name:string) {
    logger.error(`rejected called, ${error}|${name}`);
    if (this.socket) this.socket.emit("rejected", { error, name });
  }
}
