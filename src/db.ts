import sqlite, { Database } from "sqlite";
import { dirname, join } from "path";
import { mkdirsSync, existsSync } from "fs-extra";
import { ParseOakfileResults, hashString } from "./utils";
import SQL from "sql-template-strings";

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
  }

  async getDb(): Promise<Database> {
    const dbExists = existsSync(this.dbPath);
    const db = await sqlite.open(this.dbPath, { promise: Promise });
    if (!dbExists) {
      await initDb(db);
    }
    return db;
  }

  async addLog(
    runHash: string,
    cellName: string,
    logPath: string,
    time: number
  ) {
    const db = await this.getDb();
    await db.run(
      SQL`INSERT INTO Logs VALUES (${runHash}, ${cellName}, ${logPath}, ${time})`
    );
    await db.close();
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
    const db = await this.getDb();
    const row = await db.get(
      SQL`SELECT hash, mtime FROM Oakfiles WHERE hash = ${oakfileHash}`
    );
    await db.close();
    return row;
  }
  async addOakfile(oakfileHash: string, mtime: number) {
    const db = await this.getDb();
    await db.run(SQL`INSERT INTO Oakfiles VALUES (${oakfileHash}, ${mtime})`);
    await db.close();
  }
  async addRun(
    oakfileHash: string,
    runHash: string,
    mtime: number,
    args: string
  ) {
    const db = await this.getDb();
    await db.run(
      SQL`INSERT INTO Runs VALUES (${runHash}, ${oakfileHash}, ${mtime}, ${args})`
    );
    await db.close();
  }
  async addCells(oakfileHash: string, parseResults: ParseOakfileResults) {
    const db = await this.getDb();
    const cellsWithNames = parseResults.module.cells.filter(
      cell => cell?.id?.name
    );
    await Promise.all(
      cellsWithNames.map(cell => {
        const cellName = cell.id.name;
        const cellRefs = cell.references.map(ref => ref.name);
        const cellContents = cell.input.substring(cell.start, cell.end);
        const hashContents = `${cellName}${cellContents}`;
        const hash = hashString(hashContents);
        return db.run(
          SQL`INSERT INTO Cells VALUES (${oakfileHash}, ${hash}, ${cellName}, ${JSON.stringify(
            cellRefs
          )})`
        );
      })
    );
    db.close();
  }
}
async function initDb(db: Database) {
  console.log("initting");
  await db.run(
    `CREATE TABLE Oakfiles(
          hash TEXT PRIMARY KEY, 
          mtime INTEGER,
          UNIQUE(hash)
      ); `
  );
  console.log("initting 2");
  await Promise.all([
    db.run(
      `CREATE TABLE Cells(
            oakfile TEXT,
            hash TEXT,
            name TEXT,
            refs TEXT,
            FOREIGN KEY (oakfile) REFERENCES Oakfiles(hash)
        ); `
    ),
    db.run(
      `CREATE TABLE Runs(
            hash TEXT PRIMARY KEY,
            oakfile TEXT,
            time INTEGER,
            arguments TEXT,
            FOREIGN KEY (oakfile) REFERENCES Oakfiles(hash)        ); `
    ),
  ]);
  console.log("initting 3");
  await Promise.all([
    db.run(
      `CREATE TABLE Logs(
            run TEXT,
            cellName TEXT,
            path TEXT,
            time INTEGER,
            FOREIGN KEY (run) REFERENCES Runs(hash)
        ); `
    ),
    db.run(
      `CREATE TABLE Events(
            run INTEGER,
            type TEXT,
            time INTEGER,
            FOREIGN KEY (run) REFERENCES Runs(hash)
        ); `
    ),
  ]);
  return db;
}
