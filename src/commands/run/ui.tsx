import React, { Component, useState, useEffect, useRef } from "react";
import { render, Box, Color, Text } from "ink";
import Spinner from "ink-spinner";
import { EventEmitter } from "events";
import { OrderedMap } from "immutable";
import cronstrue from "cronstrue";
import scheduleLib from "node-schedule";
import { durationFuture } from "../../utils";

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
      return <Text>{"✖"}</Text>;
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

export function runInkApp(runEvents: EventEmitter) {
  const { unmount } = render(<App runEvents={runEvents} />, {
    experimental: true,
  });
  process.on("SIGINT", () => {
    unmount();
  });
}
