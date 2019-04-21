class OakInspector {
  constructor(socket, initialName) {
    this.socket = socket;
    this.initialName = initialName;
    console.log(`CustomInspector constructor called`);
  }

  pending() {
    console.log(`CustomInspector pending called`);
    if (this.socket)
      this.socket.emit("pending", { initialName: this.initialName });
  }

  fulfilled(value, name) {
    console.log(`CustomInspector fulfilled called, ${value}|${name}`);
    if (this.socket) this.socket.emit("fulfilled", { value, name });
  }

  rejected(error, name) {
    console.error(`CustomInspector rejected called, ${error}|${name}`);
    if (this.socket) this.socket.emit("rejected", { error, name });
  }
}

module.exports = { OakInspector };
