import { oak_run } from "./run";
import React, { Component, useState, useEffect, useRef } from "react";
import { render, Box, Color, Text } from "ink";
import Spinner from "ink-spinner";
import { EventEmitter } from "events";
import { OrderedMap } from "immutable";
import cronstrue from "cronstrue";
import scheduleLib from "node-schedule";
import { durationFuture } from "../utils";
import express from "express";
import { Server } from "http";
import socketio from "socket.io";
import { join } from "path";

type AppCell = {
  status: "p" | "f" | "r" | "o";
  task?: boolean;
  fresh?: boolean;
  executing?: boolean;
  target?: string;
};
type AppScheduler = {
  job: scheduleLib.Job;
  schedule: string;
  name: string;
};
class App extends Component {
  props: { runEvents: EventEmitter };
  state: {
    cells: OrderedMap<string, AppCell>;
    schedulers: OrderedMap<string, AppScheduler>;
  };
  constructor(props) {
    super(props);
    this.state = {
      cells: OrderedMap(),
      schedulers: OrderedMap(),
    };
  }
  componentDidMount() {
    this.props.runEvents.on("s", scheduler => {
      const { schedulers } = this.state;
      const s = schedulers.get(scheduler.id);
      this.setState({
        schedulers: schedulers.set(scheduler.id, {
          job: scheduler.job,
          schedule: scheduler.schedule,
          name: scheduler.cellName,
        }),
      });
    });
    /*this.props.runEvents.on("st", (tick, scheduler) => {
      const { schedulers } = this.state;
      const s = schedulers.get(scheduler.id);
      this.setState({ schedulers: schedulers.set(scheduler.id, scheduler) });
    });//*/
    this.props.runEvents.on("co", cellName => {
      const { cells } = this.state;
      const cell = cells.get(cellName);
      const newCell: AppCell = cell
        ? Object.assign(cell, { status: "o" })
        : { status: "o" };
      this.setState({ cells: cells.set(cellName, newCell) });
    });
    this.props.runEvents.on("cp", cellName => {
      const { cells } = this.state;
      const cell = cells.get(cellName);
      const newCell: AppCell = cell
        ? Object.assign(cell, { status: "p" })
        : { status: "p" };
      this.setState({ cells: cells.set(cellName, newCell) });
    });
    this.props.runEvents.on("cf", cellName => {
      const { cells } = this.state;
      const cell = cells.get(cellName);
      const newCell: AppCell = cell
        ? Object.assign(cell, { status: "f" })
        : { status: "f" };
      this.setState({ cells: cells.set(cellName, newCell) });
    });
    this.props.runEvents.on("cr", cellName => {
      const { cells } = this.state;
      const cell = cells.get(cellName);
      const newCell: AppCell = cell
        ? Object.assign(cell, { status: "r" })
        : { status: "r" };
      this.setState({ cells: cells.set(cellName, newCell) });
    });
    this.props.runEvents.on("te-start", (cellName, cellTarget) => {
      const { cells } = this.state;
      const newCell: AppCell = Object.assign(cells.get(cellName), {
        task: true,
        executing: true,
        target: cellTarget,
      });
      this.setState({ cells: cells.set(cellName, newCell) });
    });
    this.props.runEvents.on("te-end", cellName => {
      const { cells } = this.state;
      const newCell: AppCell = Object.assign(cells.get(cellName), {
        task: true,
        executing: false,
      });
      this.setState({ cells: cells.set(cellName, newCell) });
    });
    this.props.runEvents.on("t-f", (cellName, cellTarget) => {
      const { cells } = this.state;
      const newCell: AppCell = Object.assign(cells.get(cellName), {
        task: true,
        fresh: true,
        target: cellTarget,
      });
      this.setState({ cells: cells.set(cellName, newCell) });
    });
  }
  render() {
    return (
      <Box flexDirection="column">
        <Box>
          <Text>Schedulers</Text>
        </Box>
        {Array.from(this.state.schedulers).map(([id, scheduler]) => (
          <AppSchedulerLine key={id} scheduler={scheduler} />
        ))}
        {Array.from(this.state.cells).map(([name, cell]) => (
          <AppCellLine name={name} cell={cell} key={name} />
        ))}
      </Box>
    );
  }
}

function AppSchedulerLine(props) {
  const { scheduler } = props;
  return (
    <Box>
      <Text>
        <Color cyanBright bold>
          {scheduler.name}
        </Color>
        {` - `}
        {`"${cronstrue.toString(scheduler.schedule)}"`}
        {` - `}
        <AppSchedulerNextTick scheduler={scheduler} />
        {` - `}
        {scheduler.job.nextInvocation().toString()}
      </Text>
    </Box>
  );
}
function AppSchedulerNextTick(props) {
  const { scheduler } = props;
  let [label, setLabel] = useState(
    durationFuture(scheduler.job.nextInvocation())
  );
  useInterval(() => {
    let nextTick = scheduler.job.nextInvocation();
    if (nextTick) setLabel(durationFuture(nextTick));
  }, 1000);
  return <Text>Next tick {label}</Text>;
}

function useInterval(callback, delay) {
  const savedCallback = useRef(() => {});

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
function AppCellLineIcon(props) {
  const { cell } = props;
  if (cell.fresh) return <Text>{"\u{2192}"}</Text>;
  switch (cell.status) {
    case "p":
    case "o":
      return <Spinner type="dots" />;
    case "f":
      return <Text>{"✔️"}</Text>;
    case "r":
      return <Text>{"❌"}</Text>;
  }
}

function AppCellLineText(props) {
  const { cell } = props;
  let label;
  if (cell.task && cell.fresh) label = "Task fresh, not ran.";
  else if (cell.task && cell.status === "f") label = "Task complete!";
  else if (cell.task && cell.executing) label = "Task running...";
  else if (cell.task && !cell.executing) label = "Task run complete...";
  else label = "";
  return (
    <Text>
      <Color white>{label}</Color>
      {` `}
      <Color dim>{cell.task && cell.target && cell.target}</Color>
    </Text>
  );
}
function AppCellLine(props: { cell: AppCell; name: string }) {
  const { cell, name } = props;
  const color = {
    [cell.task && cell.fresh
      ? "yellowBright"
      : cell.task && cell.executing
      ? "magenta"
      : cell.status === "p" || cell.status === "o"
      ? "blueBright"
      : cell.status === "f"
      ? "greenBright"
      : "redBright"]: true,
  };

  return (
    <Box textWrap="truncate">
      <Color {...color}>
        <Text bold underline>
          {name}
        </Text>
        {` `}
        <AppCellLineIcon cell={cell} />
      </Color>
      {` `}
      <AppCellLineText cell={cell} />
    </Box>
  );
}

function runInkApp(runEvents: EventEmitter) {
  const { unmount } = render(<App runEvents={runEvents} />, {
    experimental: true,
  });
  process.on("SIGINT", () => {
    unmount();
  });
}

function runDashboard(runEvents: EventEmitter) {
  const app = express();
  const server = new Server(app);
  const io = socketio(server);
  app.use(express.static(join(__dirname, "schedule-frontend", "dist")));
  app.use("/", (req, res) => {
    res
      .status(200)
      .sendFile(join(__dirname, "schedule-frontend", "dist", "index.html"));
  });
  server.listen("8000");

  const status = {};
  const runEventsSocket = io.of("/runevents");
  runEventsSocket.on("connection", socket => {});

  const schedulePulseSocket = io.of("/schedulepulse");
  schedulePulseSocket.on("connection", socket => {});

  const pulse = {
    cells: new Map(),
    tasks: new Map(),
    schedules: new Map(),
  };

  runEvents.on("s", scheduler => runEventsSocket.emit("s", scheduler));
  runEvents.on("st", (tick, scheduler) =>
    runEventsSocket.emit("st", tick, scheduler)
  );
  runEvents.on("co", cellName => runEventsSocket.emit("co", cellName));
  runEvents.on("cp", cellName => runEventsSocket.emit("cp", cellName));
  runEvents.on("cf", cellName => runEventsSocket.emit("cf", cellName));
  runEvents.on("cr", cellName => runEventsSocket.emit("cr", cellName));
  runEvents.on("te-start", (cellName, cellTarget) =>
    runEventsSocket.emit(cellName, cellTarget)
  );
  runEvents.on("te-end", cellName => runEventsSocket.emit("te-end", cellName));
  runEvents.on("t-f", (cellName, cellTarget) =>
    runEventsSocket.emit("t-f", cellName, cellTarget)
  );
  process.on("SIGINT", () => {
    server.close();
    console.log("runx dash sigint");
    process.exit(0);
  });
}

export default async function oak_runx(args: {
  filename: string;
  targets: readonly string[];
  schedule: boolean;
  dash?: boolean;
}) {
  const runEvents = new EventEmitter();

  if (args.schedule && args.dash) {
    runDashboard(runEvents);
  } else {
    runInkApp(runEvents);
  }

  const hooks = {
    onTaskExectionStart: (cellName: string, cellTarget) =>
      runEvents.emit("te-start", cellName, cellTarget),
    onTaskExectionEnd: (cellName: string) => runEvents.emit("te-end", cellName),
    onTaskNotFresh: (cellName: string, reason: string) =>
      runEvents.emit("t-nf", cellName, reason),
    onTaskFresh: (cellName: string, cellTarget: string) =>
      runEvents.emit("t-f", cellName, cellTarget),
    onCellObserved: (cellName: string) => runEvents.emit("co", cellName),
    onCellPending: (cellName: string) => runEvents.emit("cp", cellName),
    onCellFulfilled: (cellName: string) => runEvents.emit("cf", cellName),
    onCellRejected: (cellName: string) => runEvents.emit("cr", cellName),
    onScheduleTick: (tick, scheduler) => runEvents.emit("st", tick, scheduler),
    onScheduler: scheduler => runEvents.emit("s", scheduler),
  };
  await oak_run({
    filename: args.filename,
    targets: args.targets,
    schedule: args.schedule,
    hooks,
  });
}
