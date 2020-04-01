import { h, createRef, Component } from "preact";
import * as d3 from "d3";
import "./TaskGraphNode.less";
import { duration, bytesToSize } from "../utils/format";
import { colorVariable } from "../utils/colors";

function TaskGraphNodeContainer(props) {
  const { node, hover, selected } = props;
  const { pulse } = node;
  return (
    <rect
      className={`taskgraphnode-container ${
        selected || hover
          ? `taskgraphnode-container--${selected ? "selected" : "hover"}`
          : ""
      }`}
      rx={7.5}
      ry={7.5}
      width={node.width}
      height={node.height}
      stroke={colorVariable.get(pulse.status)}
      strokeWidth={3}
    ></rect>
  );
}

function TaskGraphNodeStatusBar(props) {
  const { node } = props;
  const { pulse } = node;
  return (
    <g>
      <path
        className={`taskgraphnode-status-bar taskgraphnode-status-bar-${pulse.status}`}
        d={`M0 7.5C0 3.35786 3.35786 0 7.5 0H9V${node.height}H7.5C3.35786 ${
          node.height
        } 0 ${node.height - 3.35} 0 ${node.height - 7.5}V7.5Z`}
      ></path>
    </g>
  );
}

function getIcon(type) {
  switch (type) {
    case "pipenv":
    case "python":
      return "python";
    default:
      return "shell";
  }
}

function TaskGraphNodeType(props) {
  const { node } = props;
  const { pulse } = node;
  return (
    <g className="taskgraphnode-type" transform={`translate(16, 8)`}>
      <image
        width={18}
        height={18}
        xlinkHref={`https://simpleicons.org/icons/${getIcon(pulse.type)}.svg`}
      ></image>
    </g>
  );
}

function TaskGraphNodeStatusLabel(props) {
  const { node } = props;
  const { pulse } = node;
  let status;
  switch (pulse.status) {
    case "up":
      status = `Up to date`;
      break;
    case "dne":
      status = `Does not exist`;
      break;
    case "out-dep":
    case "out-def":
    case "out-upstream":
      status = "Out of date";
      break;
    default:
      status = `${pulse.status} not recognized.`;
      break;
  }
  return (
    <g
      className="taskgraphnode-status-label"
      transform={`translate(16, ${node.height - 10})`}
    >
      <text>
        <tspan>{pulse.mtime > 0 ? duration(new Date(pulse.mtime)) : ""}</tspan>
        <tspan>{pulse.mtime > 0 ? " - " : ""}</tspan>
        <tspan>{status}</tspan>
      </text>
    </g>
  );
}

function TaskGraphNodeTargetSize(props) {
  const { node } = props;
  const { pulse } = node;
  return (
    <g
      className="taskgraphnode-target-size"
      transform={`translate(${node.width - 16}, ${node.height - 10})`}
    >
      <text>{bytesToSize(pulse.bytes)}</text>
    </g>
  );
}

class TaskGraphNodeName extends Component {
  state = {
    //nameLength: this.props.node.label.length,
  };
  textRef = createRef();
  /*
  componentDidMount() {
    const { node } = this.props;
    const t = d3.select(this.textRef.current);
    let textLength = t.node().getComputedTextLength();
    let text = t.text();
    while (textLength > node.width - (28 + 16 + 12) && text.length > 0) {
      text = text.slice(0, -1);
      t.text(text + "...");
      textLength = t.node().getComputedTextLength();
    }

    this.setState({ nameLength: text.length });
  }*/
  render() {
    const { node } = this.props;
    return (
      <g class="taskgraphnode-name" transform={`translate(${16 + 28},22)`}>
        <text ref={this.textRef} alignmentBaseline="hanging">
          {node.label}
        </text>
      </g>
    );
  }
}

export default class TaskGraphNode extends Component {
  state = {
    hover: false,
  };
  render() {
    const { node, onTaskSelect, selected } = this.props;
    const { hover } = this.state;
    return (
      <g
        class="taskgraphnode"
        transform={`translate(${node.x}, ${node.y})`}
        onMouseEnter={() => this.setState({ hover: true })}
        onMouseLeave={() => this.setState({ hover: false })}
        onClick={() => onTaskSelect(node.taskIndex)}
      >
        <TaskGraphNodeContainer node={node} hover={hover} selected={selected} />
        <TaskGraphNodeStatusBar node={node} />
        <TaskGraphNodeType node={node} />
        <TaskGraphNodeStatusLabel node={node} />
        <TaskGraphNodeTargetSize node={node} />
        <TaskGraphNodeName node={node} />
      </g>
    );
  }
}
