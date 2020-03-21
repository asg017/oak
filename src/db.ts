import sqlite3, { Database } from "sqlite3";
import { dirname, join } from "path";
import { mkdirsSync, existsSync } from "fs-extra";

type DBOakfile = {
  hash: string;
  mtime: number;
};
type DBCell = {
  OakfileId: string;
  hash: string;
  name: string;
  references: string;
};

export class OakDB {
  private db: Database;
  constructor(oakfilePath: string) {
    this.db = getDB(oakfilePath);
  }
  async registerOakfile(oakfileHash: string, mtime: number): Promise<void> {
    const oakRow = await this.getOakfile(oakfileHash);
    if (!oakRow) await this.addOakfile(oakfileHash, mtime);
  }
  async getOakfile(oakfileHash: string): Promise<DBOakfile> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `SELECT hash, mtime FROM Oakfiles WHERE hash=?`,
        [oakfileHash],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
  async addOakfile(oakfileHash: string, mtime: number) {
    this.db.serialize(() => {
      this.db.run(
        `INSERT INTO Oakfiles VALUES (?, ?)`,
        [oakfileHash, mtime],
        (err, data) => {
          console.log("xxx", err, data);
        }
      );
    });
  }
  async addRun(oakfileHash: string, mtime: number, args: string) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(
          `INSERT INTO Runs VALUES (?, ?)`,
          [oakfileHash, mtime, args],
          (err, data) => {
            if (err) reject(err);
            resolve(data);
          }
        );
      });
    });
  }
  async addCells(runId: string, mtime: number, args: string) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(
          `INSERT INTO Runs VALUES (?, ?)`,
          [runId, mtime, args],
          (err, data) => {
            if (err) reject(err);
            else resolve(data);
          }
        );
      });
    });
  }
}
const db = new OakDB(":memory:");
db.addOakfile("asdf", 23434);

export function getDB(oakfilePath: string): Database {
  const oakMetedataDir = join(dirname(oakfilePath), ".oak");
  mkdirsSync(oakMetedataDir);
  const dbPath = ":memory:"; //join(oakMetedataDir, "oak.db");
  const dbExists = false; //existsSync(dbPath);
  const db = new (sqlite3.verbose().Database)(dbPath);
  if (!dbExists) {
    db.serialize(() => {
      db.run(
        `CREATE TABLE Oakfiles(
            hash TEXT, 
            mtime INTEGER
        ); `
      );
      db.run(
        `CREATE TABLE Cells(
              CellId INTEGER PRIMARY KEY AUTOINCREMENT, 
              oakfile TEXT,
              hash TEXT,
              name TEXT,
              FOREIGN KEY (oakfile) REFERENCES Oakfiles(hash)
          ); `
      );
      db.run(
        `CREATE TABLE Runs(
              oakfile TEXT,
              time INTEGER,
              arguments TEXT,
              FOREIGN KEY (oakfile) REFERENCES Oakfiles(hash)
          ); `
      );
      db.run(
        `CREATE TABLE Logs(
            RunId INTEGER,
            cellName TEXT,
            path TEXT,
            hash TEXT,
            FOREIGN KEY (RunId) REFERENCES Runs(rowid)
        ); `
      );
      db.run(
        `CREATE TABLE Events(
            RunId INTEGER,
            type TEXT,
            time INTEGER,
            FOREIGN KEY (RunId) REFERENCES Runs(rowid)
        ); `
      );
    });
  }
  return db;
}
