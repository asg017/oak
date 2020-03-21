import sqlite3, { Database } from "sqlite3";
import { dirname, join } from "path";
import { mkdirsSync, existsSync } from "fs-extra";
import { ParseOakfileResults, hashString } from "./utils";

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
  dbPath: string;

  constructor(oakfilePath: string) {
    const oakMetedataDir = join(dirname(oakfilePath), ".oak");
    mkdirsSync(oakMetedataDir);

    this.dbPath = join(oakMetedataDir, "oak.db");

    const dbExists = existsSync(this.dbPath);
    if (!dbExists) {
      const db = this.getDb();
      initDb(db);
      db.close();
    }
  }

  getDb(): sqlite3.Database {
    return new (sqlite3.verbose().Database)(this.dbPath);
  }
  async registerOakfile(
    oakfileHash: string,
    mtime: number,
    parseResults: ParseOakfileResults
  ): Promise<void> {
    const oakRow = await this.getOakfile(oakfileHash);
    // this could be problematic. imagine addOakfile works, but addCells fails.
    // then addCells would never be retried since this if statement only checks for the oakfile.
    if (!oakRow) {
      await this.addOakfile(oakfileHash, mtime);
      await this.addCells(oakfileHash, parseResults);
    }
  }
  async getOakfile(oakfileHash: string): Promise<DBOakfile> {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT hash, mtime FROM Oakfiles WHERE hash=?`,
        [oakfileHash],
        (err, row) => {
          db.close();
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
  async addOakfile(oakfileHash: string, mtime: number) {
    const db = this.getDb();
    db.serialize(() => {
      db.run(
        `INSERT INTO Oakfiles VALUES (?, ?)`,
        [oakfileHash, mtime],
        (err, data) => {
          console.log("xxx", err, data);
          db.close();
        }
      );
    });
  }
  async addRun(oakfileHash: string, mtime: number, args: string) {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(
          `INSERT INTO Runs VALUES (?, ?, ?)`,
          [oakfileHash, mtime, args],
          (err, data) => {
            db.close();
            if (err) reject(err);
            resolve(data);
          }
        );
      });
    });
  }
  async addCells(oakfileHash: string, parseResults: ParseOakfileResults) {
    const db = this.getDb();
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        for (let cell of parseResults.module.cells) {
          if (cell?.id.name) {
            const cellName = cell.id.name;
            const cellRefs = cell.references.map(ref => ref.name);
            const cellContents = cell.input.substring(cell.start, cell.end);
            const hashContents = `${cellName}${cellContents}`;
            const hash = hashString(hashContents);
            db.run(
              `INSERT INTO Cells VALUES (?, ?, ?, ?)`,
              [oakfileHash, hash, cellName, JSON.stringify(cellRefs)],
              (err, data) => {
                if (err) reject(err);
                else resolve(data);
              }
            );
          }
        }
        db.close();
      });
    });
  }
}
const db = new OakDB(":memory:");
db.addOakfile("asdf", 23434);

function initDb(db: sqlite3.Database) {
  db.serialize(() => {
    db.run(
      `CREATE TABLE Oakfiles(
          hash TEXT, 
          mtime INTEGER,
          UNIQUE(hash)
      ); `
    );
    db.run(
      `CREATE TABLE Cells(
            oakfile TEXT,
            hash TEXT,
            name TEXT,
            refs TEXT,
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
