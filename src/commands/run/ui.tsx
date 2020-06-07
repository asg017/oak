import React, { Component, useState, useEffect, useRef } from "react";
import { render, Box, Color, Static, Text } from "ink";
import Spinner from "ink-spinner";
import { EventEmitter } from "events";
import { OrderedMap } from "immutable";
import cronstrue from "cronstrue";
import scheduleLib from "node-schedule";
import { durationFuture } from "../../utils";

type AppCell = {
  status: "p" | "f" | "r" | "o";
  statusTime: Date;
  logLines: string[];
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
      return <Spinner type="dots" />;
    case "o":
      return <Text>{"\u{2022}"}</Text>;
    case "f":
      return <Text>{"✔️"}</Text>;
    case "r":
      return <Text>{"✖"}</Text>;
  }
}

function AppCellLineText(props: { cell: AppCell }) {
  const { cell } = props;
  let label;
  if (cell.task && cell.fresh) label = " - Task fresh, not ran.";
  else if (cell.task && cell.status === "f") label = " - Task complete!";
  else if (cell.task && cell.executing) label = " - Task running...";
  else if (cell.task && cell.status === "r") label = " - Task run unsuccessful";
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
  const color =
    cell.task && cell.fresh
      ? "yellowBright"
      : cell.task && cell.executing
      ? "magenta"
      : cell.status === "p"
      ? "blueBright"
      : cell.status === "f"
      ? "greenBright"
      : cell.status === "r"
      ? "redBright"
      : "grey";
  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        <Box textWrap="truncate">
          <Color {...{ [color]: true }}>
            <AppCellLineIcon cell={cell} />
            {` `}
            <Text bold underline>
              {name}
            </Text>
          </Color>
          <AppCellLineText cell={cell} />
        </Box>
      </Box>
      {cell.status === "p" && <Logs lines={cell.logLines.slice(-5)} />}
    </Box>
  );
}

function Logs({ lines }) {
  return (
    <Color gray>
      <Box flexDirection="column" paddingLeft={2}>
        {lines.map((line, i) => (
          <Box key={i}>{line}</Box>
        ))}
      </Box>
    </Color>
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
        ? Object.assign(cell, { status: "o", statusTime: new Date() })
        : { status: "o", statusTime: new Date(), logLines: [] };
      this.setState({ cells: cells.set(cellName, newCell) });
    });
    this.props.runEvents.on("cp", cellName => {
      const { cells } = this.state;
      const cell = cells.get(cellName);
      const newCell: AppCell = cell
        ? Object.assign(cell, { status: "p", statusTime: new Date() })
        : { status: "p", logLines: [], statusTime: new Date() };
      this.setState({ cells: cells.set(cellName, newCell) });
    });
    this.props.runEvents.on("cf", cellName => {
      const { cells } = this.state;
      const cell = cells.get(cellName);
      const newCell: AppCell = cell
        ? Object.assign(cell, { status: "f", statusTime: new Date() })
        : { status: "f", logLines: [], statusTime: new Date() };
      this.setState({ cells: cells.set(cellName, newCell) });
    });
    this.props.runEvents.on("cr", cellName => {
      const { cells } = this.state;
      const cell = cells.get(cellName);
      const newCell: AppCell = cell
        ? Object.assign(cell, {
            status: "r",
            executing: null,
            statusTime: new Date(),
          })
        : { status: "r", logLines: [], statusTime: new Date() };
      this.setState({ cells: cells.set(cellName, newCell) });
    });

    // "task execution start"
    this.props.runEvents.on("te-start", (cellName, cellTarget) => {
      const { cells } = this.state;
      const newCell: AppCell = Object.assign(cells.get(cellName), {
        task: true,
        executing: true,
        target: cellTarget,
      });
      this.setState({ cells: cells.set(cellName, newCell) });
    });
    // "task execution end"
    this.props.runEvents.on("te-end", cellName => {
      const { cells } = this.state;
      const newCell: AppCell = Object.assign(cells.get(cellName), {
        task: true,
        executing: false,
      });
      this.setState({ cells: cells.set(cellName, newCell) });
    });

    // "task execution log"
    this.props.runEvents.on("te-log", (cellName, logStream) => {
      const { cells } = this.state;

      logStream.on("data", line => {
        const prevLines = this.state.cells.get(cellName).logLines;
        const newLines = prevLines.concat([line]).slice(-100);
        const newCell: AppCell = Object.assign(cells.get(cellName), {
          logLines: newLines,
        });
        this.setState({ cells: cells.set(cellName, newCell) });
      });
    });

    // "task is fresh"
    this.props.runEvents.on("t-f", (cellName, cellTarget) => {
      const { cells } = this.state;
      const newCell: AppCell = Object.assign(cells.get(cellName), {
        task: true,
        executing: false,
        fresh: true,
        target: cellTarget,
      });
      this.setState({ cells: cells.set(cellName, newCell) });
    });
  }
  componentWillUnmount() {
    this.props.runEvents
      .removeAllListeners("s")
      .removeAllListeners("co")
      .removeAllListeners("cp")
      .removeAllListeners("cf")
      .removeAllListeners("cr")
      .removeAllListeners("te-start")
      .removeAllListeners("te-end")
      .removeAllListeners("t-f");
  }
  render() {
    // without the reverse, Static doesnt work correctly.
    // idk why.
    return (
      <Box flexDirection="column">
        {this.state.schedulers.size > 0 && (
          <Box>
            <Text>Schedulers</Text>
          </Box>
        )}
        {Array.from(this.state.schedulers).map(([id, scheduler]) => (
          <AppSchedulerLine key={id} scheduler={scheduler} />
        ))}
        {this.state.cells.size ? (
          <Box>
            <Text bold underline>
              Cells
            </Text>
          </Box>
        ) : null}
        {Array.from(this.state.cells).map(([name, cell]) => (
          <AppCellLine name={name} cell={cell} key={name} />
        ))}
      </Box>
    );
  }
}

export function runInkApp(runEvents: EventEmitter) {
  return render(<App runEvents={runEvents} />, {
    experimental: true,
  });
}
