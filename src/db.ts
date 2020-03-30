import sqlite, { Database } from "sqlite";
import { dirname, join } from "path";
import { mkdirsSync, existsSync } from "fs-extra";
import { ParseOakfileResults, hashString, CellSignature } from "./utils";
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
  async addEvents(
    runHash: string,
    events: {
      type: string;
      ancestorHash: string;
      name: string;
      time: number;
      meta?: string;
    }[]
  ) {
    const db = await this.getDb();

    await Promise.all(
      events.map(event => {
        const { type, ancestorHash, name, time, meta } = event;
        db.run(
          SQL`INSERT INTO Events VALUES (
            ${runHash}, 
            ${ancestorHash}, 
            ${type}, 
            ${name}, 
            ${time}, 
            ${meta}
          )`
        );
      })
    );

    await db.close();
  }

  async getLog(cellName: string) {
    const db = await this.getDb();
    const result = await db.get(SQL`SELECT *
    FROM Logs
    WHERE Logs.cellName = ${cellName}
    ORDER BY Logs.time DESC
    LIMIT 1`);
    await db.close();
    return result;
  }

  async getLogById(rowid: number) {
    const db = await this.getDb();
    const result = await db.get(SQL`SELECT 
      path
    FROM Logs
    WHERE Logs.rowid = ${rowid}`);
    await db.close();
    return result;
  }

  async getRunById(hash: string) {
    const db = await this.getDb();
    const result = await db.get(SQL`SELECT 
      hash
    FROM Runs
    WHERE Runs.hash = ${hash}`);
    await db.close();
    return result;
  }

  async getLogs() {
    const db = await this.getDb();
    const result = await db.all(SQL`SELECT 
      rowid,
      oakfile,
      run,
      cellName,
      cellAncestorHash,
      path,
      time
    FROM Logs
    ORDER BY Logs.time DESC`);
    await db.close();
    return result;
  }

  async getRuns() {
    const db = await this.getDb();
    const result = await db.all(SQL`SELECT
    Runs.hash,
    Runs.oakfile,
    Runs.time,
    Runs.arguments,
    COUNT(*) as logCount
  FROM
    Runs
    INNER JOIN Logs ON Runs.hash = Logs.run
  GROUP BY
    Logs.run
  ORDER BY
    Runs.time DESC`);
    await db.close();
    return result;
  }

  async findMostRecentCellHash(
    ancestorHash: string
  ): Promise<{ mtime: number }> {
    const db = await this.getDb();
    const result = await db.get(SQL`SELECT Cells.hash, Oakfiles.mtime
    FROM Cells
    INNER JOIN Oakfiles ON Cells.oakfile = Oakfiles.hash
    WHERE Cells.ancestorHash = ${ancestorHash}
    ORDER BY Oakfiles.mtime ASC
    LIMIT 1`);
    await db.close();
    return result;
  }

  async addLog(
    oakfileHash: string,
    runHash: string,
    cellName: string,
    ancestorHash: string,
    logPath: string,
    time: number
  ) {
    const db = await this.getDb();
    await db.run(
      SQL`INSERT INTO Logs VALUES (
        ${oakfileHash}, 
        ${runHash}, 
        ${cellName}, 
        ${ancestorHash}, 
        ${logPath}, 
        ${time}
      )`
    );
    await db.close();
  }

  async registerOakfile(
    oakfileHash: string,
    mtime: number,
    cellHashMap: Map<string, CellSignature>
  ): Promise<void> {
    const oakRow = await this.getOakfile(oakfileHash);
    // this could be problematic. imagine addOakfile works, but addCells fails.
    // then addCells would never be retried since this if statement only checks for the oakfile.
    if (!oakRow) {
      await this.addOakfile(oakfileHash, mtime);
      await this.addCells(oakfileHash, cellHashMap);
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

  async addCells(oakfileHash: string, cellHashMap: Map<string, CellSignature>) {
    const db = await this.getDb();
    Promise.all(
      Array.from(cellHashMap).map(
        ([cellName, { cellHash, ancestorHash, cellRefs }]) => {
          return db.run(
            SQL`INSERT INTO Cells VALUES (
              ${oakfileHash}, 
              ${cellHash}, 
              ${ancestorHash}, 
              ${cellName}, 
              ${JSON.stringify(cellRefs)}
            )`
          );
        }
      )
    );

    db.close();
  }
}

async function initDb(db: Database) {
  await db.run(
    `CREATE TABLE Oakfiles(
          hash TEXT PRIMARY KEY, 
          mtime INTEGER,
          UNIQUE(hash)
      ); `
  );
  await Promise.all([
    db.run(
      `CREATE TABLE Cells(
            oakfile TEXT,
            hash TEXT,
            ancestorHash TEXT,
            name TEXT,
            refs TEXT,
            FOREIGN KEY (oakfile) REFERENCES Oakfiles(hash),
            UNIQUE (oakfile, ancestorHash)
        ); `
    ),
    db.run(
      `CREATE TABLE Runs(
            hash TEXT PRIMARY KEY,
            oakfile TEXT,
            time INTEGER,
            arguments TEXT,
            FOREIGN KEY (oakfile) REFERENCES Oakfiles(hash)
        ); `
    ),
  ]);
  await Promise.all([
    db.run(
      `CREATE TABLE Logs(
            oakfile TEXT,
            run TEXT,
            cellName TEXT,
            cellAncestorHash TEXT,
            path TEXT,
            time INTEGER,
            FOREIGN KEY (oakfile) REFERENCES Oakfiles(hash),
            FOREIGN KEY (run) REFERENCES Runs(hash)
        ); `
    ),
    db.run(
      `CREATE TABLE Events(
            run TEXT,
            ancestorHash TEXT,
            type TEXT,
            name TEXT,
            time INTEGER,
            meta TEXT,
            FOREIGN KEY (run) REFERENCES Runs(hash)
        ); `
    ),
  ]);
  return db;
}
