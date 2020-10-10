import React, { Component } from "react";
import { render, Box, Static, Text } from "ink";
import Spinner from "ink-spinner";
import { EventEmitter } from "events";
import { OrderedMap, List } from "immutable";

type AppCell = {
  status: "p" | "f" | "r" | "o";
  logfile?: string;
  logLines: string[];
  task?: boolean;
  fresh?: boolean;
  executing?: boolean;
  target?: string;
  taskStatusWhy?: string;
  taskRunStatus?: string;
  taskRunExitcode?: string;
};

function AppCellLineIcon(props) {
  const { cell } = props;
  if (cell.fresh) return <Text>{"\u{2192}"}</Text>;
  switch (cell.status) {
    case "p":
      return (
        <Text>
          <Spinner type="dots" />
        </Text>
      );
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
  let label, dimLabel;
  if (cell.task && cell.fresh) label = " - Target fresh, skipped.";
  else if (cell.task && cell.status === "f") label = " - Task run complete!";
  else if (cell.task && cell.status === "r") label = " - Task run failed";
  else if (cell.task && cell.executing) label = " - Task running...";
  else label = "";

  if (cell.task && cell.taskRunExitcode)
    dimLabel = `Proccess failed with ${cell.taskRunExitcode} `;
  else if (cell.taskStatusWhy) dimLabel = `${cell.taskStatusWhy}`;

  return (
    <Text color="white">
      {label} {dimLabel ? <Text dimColor>{dimLabel}</Text> : null}
    </Text>
  );
}

function cellColor(cell: AppCell) {
  if (cell.task && cell.fresh) return "yellow";
  if (cell.task && cell.executing) return "magenta";
  if (cell.status === "p") return "blueBright";
  if (cell.status === "f") return "greenBright";
  if (cell.status === "r") return "red";
  return "grey";
}
function AppCellLine(props: { cell: AppCell; name: string }) {
  const { cell, name } = props;
  const color = cellColor(cell);
  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        <Box>
          <Text color={color} wrap="truncate">
            <AppCellLineIcon cell={cell} />
            {` `}
            <Text bold underline>
              {name}
            </Text>
          </Text>
          <AppCellLineText cell={cell} />
        </Box>
        {cell.target && !cell.fresh ? (
          <Box paddingLeft={4}>
            <Box flexDirection="column">
              {cell.target ? (
                <Text>
                  target: <Text dimColor>{cell.target}</Text>
                </Text>
              ) : null}
              {cell.logfile ? (
                <Text>
                  logs: <Text dimColor>{cell.logfile}</Text>
                </Text>
              ) : null}
            </Box>
          </Box>
        ) : null}
      </Box>
      {cell.status === "p" && <Logs lines={cell.logLines.slice(-5)} />}
    </Box>
  );
}

function Logs({ lines, borderColor = "" }) {
  if (lines.length === 0) return null;
  return (
    <Box
      borderStyle="single"
      //@ts-ignore
      borderColor={borderColor}
      flexDirection="column"
      paddingLeft={2}
    >
      {lines.map((line, i) => (
        <Box key={i}>
          <Text color="gray">{line || ""}</Text>
        </Box>
      ))}
    </Box>
  );
}
class App extends Component {
  props: { runEvents: EventEmitter; runHash: string };
  state: {
    cells: OrderedMap<string, AppCell>;
    messages: List<any>;
  };
  constructor(props) {
    super(props);
    this.state = {
      cells: OrderedMap(),
      messages: List(),
    };
  }
  _onInspector(data: any) {
    const cellName = data.cell;
    const { cells } = this.state;
    const newCell: AppCell = Object.assign(cells.get(cellName) ?? {}, {
      status: data.status.charAt(0),
      logLines: [],
    });
    this.setState({ cells: cells.set(cellName, newCell) });
  }
  _onTaskStatus(data: any) {
    const cellName = data.task;
    const { cells } = this.state;
    const newCell: AppCell = Object.assign(cells.get(cellName), {
      task: true,
      executing: false,
      target: data.target,
      fresh: data.status === "fresh",
      taskStatusWhy: data.why,
    });
    this.setState({ cells: cells.set(cellName, newCell) });
  }
  _onTaskRun(data: any) {
    const cellName = data.task;
    const { cells } = this.state;
    const newCell: AppCell = Object.assign(cells.get(cellName), {
      executing: data.event === "start",
      logfile: data.logfile,
      taskRunStatus: data.status,
      taskRunExitcode: data.exitcode,
      //why: data.why
    });
    this.setState({ cells: cells.set(cellName, newCell) });
  }
  componentDidMount() {
    this.props.runEvents.on("log", data => {
      this.setState({ messages: this.state.messages.push(data) });
      switch (data.type) {
        case "inspector":
          return this._onInspector(data);
        case "task-status":
          return this._onTaskStatus(data);
        case "task-run":
          return this._onTaskRun(data);
      }
    });
  }
  componentWillUnmount() {
    this.props.runEvents.removeAllListeners("log");
  }
  render() {
    const tasks = Array.from(this.state.cells).filter(
      ([name, cell]) => cell.task
    );
    const debug = true;
    return (
      <Box flexDirection="column">
        {debug ? (
          <Static items={Array.from(this.state.messages)}>
            {(item, i) => (
              <Text key={i.toString()}>{JSON.stringify(item)}</Text>
            )}
          </Static>
        ) : null}
        {
          <Box>
            <Text bold underline>
              Running Oakfile at [TODO] {this.props.runHash}
            </Text>
          </Box>
        }
        {tasks.length ? (
          <Box>
            <Text bold underline>
              Tasks
            </Text>
          </Box>
        ) : null}
        {tasks.map(([name, cell]) => (
          <AppCellLine name={name} cell={cell} key={name} />
        ))}
      </Box>
    );
  }
}

export function runInkApp(runEvents: EventEmitter, runHash: string) {
  return render(<App runEvents={runEvents} runHash={runHash} />);
}
