import Database, { Database as DB } from "better-sqlite3";
import { dirname, join } from "path";
import { mkdirsSync } from "fs-extra";
import { CellSignature } from "./utils";

type DBOakfile = {
  hash: string;
  mtime: number;
};

export function getAndMaybeIntializeOakDB(oakfilePath: string) {
  const oakMetedataDir = join(dirname(oakfilePath), ".oak");
  mkdirsSync(oakMetedataDir);
  const dbPath = join(oakMetedataDir, "oak.db");
  const db = new Database(dbPath);
  db.exec(migrations);
  process.on("exit", () => db.close());
  return new OakDB(db);
}

export class OakDB {
  db: DB;

  constructor(db: DB) {
    this.db = db;
  }

  async addEvents(
    runHash: string,
    events: {
      type: string;
      ancestorHash: string;
      name: string;
      time: number;
      meta: string;
    }[]
  ) {
    const q = `INSERT INTO Events (
       run,
       ancestorHash,
       type,
       name,
       time,
       meta
     ) VALUES (
       @run,
       @ancestorHash,
       @type,
       @name,
       @time,
       @meta
    )`;
    const insert = this.db.prepare(q);
    const insertMany = this.db.transaction(events => {
      for (const event of events) insert.run(event);
    });
    insertMany(events.map(event => Object.assign(event, { run: runHash })));
  }

  async getLog(cellName: string) {
    const q = `SELECT *
    FROM Logs
    WHERE Logs.cellName = ?
    ORDER BY Logs.time DESC
    LIMIT 1`;
    const result = this.db.prepare(q).get(cellName);
    return result;
  }

  async getLogById(rowid: number) {
    const q = `SELECT path
    FROM Logs
    WHERE Logs.rowid = ?`;
    const result = this.db.prepare(q).get(rowid);
    return result;
  }

  async getRunById(hash: string) {
    const q = `SELECT 
    hash
  FROM Runs
  WHERE Runs.hash = ?`;
    const result = this.db.prepare(q).get(hash);
    return result;
  }

  async getLogs() {
    const q = `SELECT 
    rowid,
    oakfile,
    run,
    cellName,
    cellAncestorHash,
    path,
    time
  FROM Logs
  ORDER BY Logs.time DESC`;
    const result = this.db.prepare(q).all();

    return result;
  }

  async getRuns() {
    const q = `SELECT
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
    Runs.time DESC`;
    const result = this.db.prepare(q).all();
    return result;
  }

  async findMostRecentCellHash(
    ancestorHash: string
  ): Promise<{ mtime: number }> {
    const q = `SELECT Cells.hash, Oakfiles.mtime
    FROM Cells
    INNER JOIN Oakfiles ON Cells.oakfile = Oakfiles.hash
    WHERE Cells.ancestorHash = ?
    ORDER BY Oakfiles.mtime ASC
    LIMIT 1`;
    const result = this.db.prepare(q).get(ancestorHash);
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
    const q = `INSERT INTO Logs (
      oakfile,
      run,
      cellName,
      cellAncestorHash,
      path,
      time
    ) VALUES (?, ?, ?, ?, ?, ?)`;
    const result = this.db
      .prepare(q)
      .run(oakfileHash, runHash, cellName, ancestorHash, logPath, time);
    return result;
  }

  async registerScheduler(
    cellName: string,
    schedulerInstanceId: number
  ): Promise<void> {
    const q = `INSERT INTO Schedulers (
      schedulerInstanceId,
      cellName
    )
    VALUES (?, ?)`;
    this.db.prepare(q).run(schedulerInstanceId, cellName);
  }
  async addSchedulerTick(
    schedulerInstanceId: number,
    tickId: number,
    emitTime: number
  ): Promise<void> {
    const q = `INSERT INTO ScheduleTicks (
      scheduler,
      tickId,
      emitTime
    )
    VALUES (?, ?, ?)`;
    this.db.prepare(q).run(schedulerInstanceId, tickId, emitTime);
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
    const q = `SELECT *
    FROM TaskExecutions 
    WHERE TaskExecutions.cellAncestorHash = ?
    ORDER BY TaskExecutions.timeStart DESC
    LIMIT 1`;
    const row = this.db.prepare(q).get(ancestorHash);

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
    const q = `UPDATE TaskExecutions 
    SET 
      targetSignature = ?,
      runProcessStart = ?,
      runProcessEnd = ?,
      runProcessExitCode = ?,
      runProcessPID = ?
    WHERE rowid=?`;
    const result = this.db
      .prepare(q)
      .run(
        targetSignature,
        runProcessStart,
        runProcessEnd,
        runProcessExitCode,
        runProcessPID,
        rowid
      );
    const lastID = result.lastInsertRowid;

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
    schedulerInstanceId?: number,
    tickId?: number,
    tickEmitTime?: number
  ) {
    const q = `INSERT INTO TaskExecutions (
      run,
      target,
      scheduled,
      schedulerInstanceId,
      tickId,
      tickTime,
      cellName,
      cellAncestorHash,
      dependenciesSignature,
      freshStatus,
      timeStart,
      runLog
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const result = this.db
      .prepare(q)
      .run(
        runHash,
        target,
        scheduled ? 1 : 0,
        schedulerInstanceId,
        tickId,
        tickEmitTime,
        cellName,
        anecestorHash,
        dependenciesSignature,
        freshStatus,
        timeStart,
        runLog
      );
    const lastID = result.lastInsertRowid;
    return lastID;
  }
  async getOakfile(oakfileHash: string): Promise<DBOakfile> {
    const q = `SELECT hash, mtime FROM Oakfiles WHERE hash = ?`;
    const row = this.db.prepare(q).get(oakfileHash);

    return row;
  }

  async addOakfile(oakfileHash: string, mtime: number) {
    const q = `INSERT INTO Oakfiles VALUES (?, ?)`;
    this.db.prepare(q).run(oakfileHash, mtime);
  }

  async addRun(
    oakfileHash: string,
    runHash: string,
    scheduled: boolean,
    mtime: number,
    args: string
  ) {
    const q = `INSERT INTO Runs 
    (
      hash,
      oakfile,
      scheduled,
      time, 
      arguments
    )
     VALUES (?, ?, ?, ?, ?)`;
    this.db
      .prepare(q)
      .run(runHash, oakfileHash, scheduled ? 1 : 0, mtime, args);
  }

  async addCells(oakfileHash: string, cellHashMap: Map<string, CellSignature>) {
    const q = `INSERT INTO Cells (
      oakfile,
      hash,
      ancestorHash,
      name,
      refs
    ) VALUES (
      @oakfileHash,
      @cellHash,
      @ancestorHash,
      @cellName,
      @cellRefs
    )`;
    const insert = this.db.prepare(q);
    const insertMany = this.db.transaction(cells => {
      for (const cell of cells) insert.run(cell);
    });
    const cells = Array.from(cellHashMap).map(
      ([cellName, { cellHash, ancestorHash, cellRefs }]) => ({
        oakfileHash,
        cellHash,
        ancestorHash,
        cellName,
        cellRefs: JSON.stringify(cellRefs),
      })
    );
    insertMany(cells);
  }
}

const migrations = `
CREATE TABLE IF NOT EXISTS Oakfiles(
  hash TEXT PRIMARY KEY, 
  mtime INTEGER,
  UNIQUE(hash)
);

CREATE TABLE IF NOT EXISTS Schedulers(
  schedulerInstanceId INTEGER PRIMARY KEY,
  cellName TEXT
); 
CREATE TABLE IF NOT EXISTS Cells(
  oakfile TEXT,
  hash TEXT,
  ancestorHash TEXT,
  name TEXT,
  refs TEXT,
  FOREIGN KEY (oakfile) REFERENCES Oakfiles(hash),
  UNIQUE (oakfile, ancestorHash)
); 
CREATE TABLE IF NOT EXISTS Runs(
  hash TEXT PRIMARY KEY,
  oakfile TEXT,
  scheduled BOOLEAN,
  time INTEGER,
  arguments TEXT,
  FOREIGN KEY (oakfile) REFERENCES Oakfiles(hash)
); 
CREATE TABLE IF NOT EXISTS Logs(
    oakfile TEXT,
    run TEXT,
    cellName TEXT,
    cellAncestorHash TEXT,
    path TEXT,
    time INTEGER,
    FOREIGN KEY (oakfile) REFERENCES Oakfiles(hash),
    FOREIGN KEY (run) REFERENCES Runs(hash)
);
CREATE TABLE IF NOT EXISTS TaskExecutions(
    run TEXT,
    target TEXT,
    scheduled BOOLEAN,
    schedulerInstanceId INTEGER,
    tickId INTEGER,
    tickTime INTEGER,
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
); 
CREATE TABLE IF NOT EXISTS Events(
    run TEXT,
    ancestorHash TEXT,
    type TEXT,
    name TEXT,
    time INTEGER,
    meta TEXT,
    FOREIGN KEY (run) REFERENCES Runs(hash)
); 
CREATE TABLE IF NOT EXISTS ScheduleTicks(
  scheduler INTEGER,
  tickId INTEGER,
  emitTime INTEGER,  
  FOREIGN KEY (scheduler) REFERENCES Scheduler(rowid)
); `;
