import { EventEmitter } from "events";

import scheduleLib from "node-schedule";

type ScheduleParams = {
  schedule: string;
  filter?: () => boolean;
};

export class ScheduleTick {
  id: number;
  schedule: number;
  emitTime: Date;
  constructor(schedulerId: number, emitTime: Date) {
    this.id = Math.round(Math.random() * 10000000000);
    this.schedule = schedulerId;
    this.emitTime = emitTime;
  }
}

export class SchedulerMock {
  constructor() {
    console.warn(
      "WARNING: Scheduler does not schedule tasks in reguar oak runs. Use `oak run --schedule` to get desired effect."
    );
  }
  [Symbol.asyncIterator]() {
    return this;
  }
  async next() {
    return { done: true, value: this };
  }
}
export class Scheduler {
  clock: EventEmitter;
  job: scheduleLib.Job;
  tickCount: number;
  lastTick: ScheduleTick;
  id: number;
  cellName: string;
  init: boolean;
  schedule: string;
  done: EventEmitter;

  constructor(args: ScheduleParams | string, invalidation: Promise<void>) {
    let params: ScheduleParams;
    if (typeof args === "string") params = { schedule: args };
    else params = args;

    this.done = new EventEmitter();
    invalidation.then(() => {
      this.done.emit("done");
      this.job.cancel();
    });
    this.schedule = params.schedule;
    this.tickCount = 0;
    this.clock = new EventEmitter();
    this.job = scheduleLib.scheduleJob(params.schedule, emitTime => {
      this.clock.emit("tick", new ScheduleTick(this.id, emitTime), this);
    });
    this.id = Math.round(Math.random() * 10000000000);

    // this would be populated by the decorator, since
    // we don't have access until runtime
    this.cellName = null;
    this.init = false;
  }

  async nextTick(): Promise<ScheduleTick> {
    return new Promise((resolve, reject) => {
      const onTick = (tick: ScheduleTick) => {
        this.clock.off("tick", onTick);
        resolve(tick);
      };
      this.clock.on("tick", onTick);

      // if the iterator is stopped prematurely,
      // then cancel the next tick.
      const onDone = () => {
        this.clock.off("tick", onTick);
        resolve(null);
        this.done.off("done", onDone);
      };
      this.done.on("done", onDone);
    });
  }

  [Symbol.asyncIterator]() {
    return this;
  }
  async next() {
    if (!this.init) {
      this.init = true;
      return { done: false, value: this };
    }
    const tick = await this.nextTick();
    if (tick === null) return { done: true, value: this };
    this.lastTick = tick;
    this.tickCount++;
    return { done: false, value: this };
  }
  return() {
    return this;
  }
}
