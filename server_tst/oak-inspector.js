class OakInspector {
  constructor(socket) {
    this.socket = socket;
    console.log(`CustomInspector constructor called`);
  }

  pending() {
    console.log(`CustomInspector pending called`);
  }

  fulfilled(value, name) {
    console.log(`CustomInspector fulfilled called, ${value}|${name}`);
  }

  rejected(error, name) {
    console.error(`CustomInspector rejected called, ${error}|${name}`);
  }
}

module.exports = { OakInspector };
