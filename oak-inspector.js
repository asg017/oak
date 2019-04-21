const { createLogger } = require("./logging.js");

const logger = createLogger({ label: "OakInspector" });
class OakInspector {
  constructor(socket, initialName) {
    this.socket = socket;
    this.initialName = initialName;
    logger.info(`CustomInspector constructor called`);
  }

  pending() {
    logger.info(`${this.initialName} pending called`);
    if (this.socket)
      this.socket.emit("pending", { initialName: this.initialName });
  }

  fulfilled(value, name) {
    logger.info(`fulfilled called, ${value}|${name}`);
    if (this.socket) this.socket.emit("fulfilled", { value, name });
  }

  rejected(error, name) {
    logger.error(`rejected called, ${error}|${name}`);
    if (this.socket) this.socket.emit("rejected", { error, name });
  }
}

module.exports = { OakInspector };
