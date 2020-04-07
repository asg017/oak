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

export async function getAndMaybeIntializeOakDB(oakfilePath: string) {
  const oakMetedataDir = join(dirname(oakfilePath), ".oak");
  mkdirsSync(oakMetedataDir);
  const dbPath = join(oakMetedataDir, "oak.db");
  const dbExists = existsSync(dbPath);
  const db = await sqlite.open(dbPath, { promise: Promise });
  if (!dbExists) {
    await initDb(db);
  }
  await db.close();
  return new OakDB(oakfilePath);
}

export class OakDB {
  dbPath: string;

  constructor(oakfilePath: string) {
    this.dbPath = join(dirname(oakfilePath), ".oak", "oak.db");
  }

  async getDb(): Promise<Database> {
    const dbExists = existsSync(this.dbPath);
    const db = await sqlite.open(this.dbPath, { promise: Promise });
    if (!dbExists) {
      throw Error(
        `Oak Database at ${this.dbPath} does not exist. You probably have to use getAndMaybeIntializeOakDB.`
      );
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

  async registerScheduler(
    cellName: string,
    schedulerInstanceId: number
  ): Promise<void> {
    const db = await this.getDb();
    await db.run(SQL`INSERT INTO Schedulers (
      schedulerInstanceId,
      cellName
    )
    VALUES (
      ${schedulerInstanceId},
      ${cellName}
      
    )`);
    await db.close();
  }
  async addSchedulerTick(
    schedulerInstanceId: number,
    emitTime: number
  ): Promise<void> {
    const db = await this.getDb();
    await db.run(SQL`INSERT INTO ScheduleTicks (
      scheduler,
      emitTime
    )
    VALUES (
      ${schedulerInstanceId},
      ${emitTime}
    )`);
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

  async getLastRelatedTaskExection(ancestorHash: string) {
    const db = await this.getDb();
    const row = await db.get(SQL`SELECT *
    FROM TaskExecutions 
    WHERE TaskExecutions.cellAncestorHash = ${ancestorHash}
    ORDER BY TaskExecutions.timeStart DESC
    LIMIT 1`);
    await db.close();
    return row;
  }

  async updateTaskExection(
    rowid: number,
    targetSignature: string,
    runProcessStart: number,
    runProcessEnd: number,
    runProcessExitCode: number,
    runProcessPID: string
  ) {
    const db = await this.getDb();
    const { lastID } = await db.run(SQL`UPDATE TaskExecutions 
    SET 
      targetSignature = ${targetSignature},
      runProcessStart = ${runProcessStart},
      runProcessEnd = ${runProcessEnd},
      runProcessExitCode = ${runProcessExitCode},
      runProcessPID = ${runProcessPID}
    WHERE rowid=${rowid}`);
    await db.close();
    return lastID;
  }
  async addTaskExecution(
    runHash: string,
    scheduled: boolean,
    cellName: string,
    anecestorHash: string,
    dependenciesSignature: string,
    freshStatus: string,
    timeStart: number,
    runLog: string,
    target: string,
    schedulerInstanceId?: number
  ) {
    const db = await this.getDb();
    const { lastID } = await db.run(SQL`INSERT INTO TaskExecutions (
      run,
      target,
      scheduled,
      schedulerInstanceId,
      cellName,
      cellAncestorHash,
      dependenciesSignature,
      freshStatus,
      timeStart,
      runLog
    ) 
    VALUES (
      ${runHash},
      ${target},
      ${scheduled},
      ${schedulerInstanceId},
      ${cellName},
      ${anecestorHash},
      ${dependenciesSignature},
      ${freshStatus},
      ${timeStart},
      ${runLog}
    )`);
    await db.close();
    return lastID;
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
    scheduled: boolean,
    mtime: number,
    args: string
  ) {
    const db = await this.getDb();
    await db.run(
      SQL`INSERT INTO Runs 
      (
        hash,
        oakfile,
        scheduled,
        time, 
        arguments
      )
       VALUES (
        ${runHash}, 
        ${oakfileHash},
        ${scheduled}, 
        ${mtime}, 
        ${args}
      )`
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
  console.log("initting...");
  await db.run(
    `CREATE TABLE Oakfiles(
          hash TEXT PRIMARY KEY, 
          mtime INTEGER,
          UNIQUE(hash)
      ); `
  );
  await db.run(
    `CREATE TABLE Schedulers(
      schedulerInstanceId INTEGER PRIMARY KEY,
      cellName TEXT
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
            scheduled BOOLEAN,
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
      `CREATE TABLE TaskExecutions(
            run TEXT,
            target TEXT,
            scheduled BOOLEAN,
            schedulerInstanceId INTEGER,
            cellName TEXT,
            cellAncestorHash TEXT,
            dependenciesSignature TEXT,
            targetSignature TEXT,
            freshStatus TEXT,
            timeStart INTEGER,
            runLog TEXT,
            runProcessStart INTEGER,
            runProcessEnd INTEGER,
            runProcessExitCode INTEGER,
            runProcessPID TEXT,
            FOREIGN KEY (run) REFERENCES Runs(hash),
            FOREIGN KEY (schedulerInstanceId) REFERENCES Schedulers(schedulerInstanceId)
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
    db.run(
      `CREATE TABLE ScheduleTicks(
          scheduler INTEGER,
          emitTime INTEGER,  
          FOREIGN KEY (scheduler) REFERENCES Scheduler(rowid)
      ); `
    ),
  ]);
  return db;
}
