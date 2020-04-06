import { EventEmitter } from "events";

import scheduleLib from "node-schedule";

type ScheduleParams = {
  schedule: string;
  filter?: () => boolean;
};
export class Scheduler {
  clock: EventEmitter;
  job: scheduleLib.Job;
  tickCount: number;
  lastTick: Date;

  constructor(args: ScheduleParams | string) {
    let params: ScheduleParams;
    if (typeof args === "string") params = { schedule: args };
    else params = args;

    this.tickCount = 0;
    this.clock = new EventEmitter();
    this.job = scheduleLib.scheduleJob(params.schedule, emitTime => {
      console.log("emitting ");
      this.clock.emit("tick", emitTime);
    });
  }

  async nextTick(): Promise<Date> {
    return new Promise((resolve, reject) => {
      // im sorry, i never fully understood this
      const clock = this.clock;
      function onTick(e) {
        clock.off("tick", onTick);
        resolve(e);
      }
      this.clock.on("tick", onTick);
    });
  }

  [Symbol.asyncIterator]() {
    return {
      next: async () => {
        const tick = await this.nextTick();
        this.lastTick = tick;
        this.tickCount++;
        return { done: false, value: this };
      },
    };
  }
}
