import { h, createRef, Component } from "preact";
import * as d3 from "d3";
import "../style.less";
import { duration, bytesToSize } from "../utils/format";

function TaskGraphNodeContainer(props) {
  const { node, hover, selected } = props;
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
    ></rect>
  );
}

function TaskGraphNodeStatusBar(props) {
  const { node } = props;
  return (
    <g>
      <path
        className={`taskgraphnode-status-bar taskgraphnode-status-bar-${node.status}`}
        d={`M0 7.5C0 3.35786 3.35786 0 7.5 0H9V${node.height}H7.5C3.35786 ${
          node.height
        } 0 ${node.height - 3.35} 0 ${node.height - 7.5}V7.5Z`}
      ></path>
    </g>
  );
}

function TaskGraphNodeType(props) {
  const { node } = props;
  return (
    <g
      className="taskgraphnode-type"
      transform={`translate(${node.width - 28 - 8}, 10)`}
    >
      <circle
        className={`taskgraphnode-circle`}
        cx={11}
        cy={11}
        r={14}
        fill="none"
        stroke="red"
      ></circle>
      <image
        width={18}
        height={18}
        x={2}
        y={2}
        xlinkHref={`https://simpleicons.org/icons/docker.svg`}
      ></image>
    </g>
  );
}

function TaskGraphNodeStatusLabel(props) {
  const { node } = props;
  return (
    <g
      className="taskgraphnode-status-label"
      transform={`translate(16, ${node.height - 10})`}
    >
      <text>
        <tspan>{node.mtime > 0 ? duration(new Date(node.mtime)) : ""}</tspan>
        <tspan>{node.mtime > 0 ? " - " : ""}</tspan>
        <tspan>
          {node.status == "up"
            ? "Up to date"
            : node.status === "out"
            ? "Out of date"
            : "Does not exist"}
        </tspan>
      </text>
    </g>
  );
}

function TaskGraphNodeTargetSize(props) {
  const { node } = props;
  return (
    <g
      className="taskgraphnode-target-size"
      transform={`translate(${node.width - 16}, ${node.height - 10})`}
    >
      <text>{bytesToSize(node.bytes)}</text>
    </g>
  );
}

class TaskGraphNodeName extends Component {
  state = {
    nameLength: this.props.node.label.length,
  };
  textRef = createRef();
  componentDidMount() {
    const { node } = this.props;
    const t = d3.select(this.textRef.current);
    let textLength = t.node().getComputedTextLength();
    let text = t.text();
    while (textLength > node.width - (28 + 16 + 12) && text.length > 0) {
      text = text.slice(0, -1);
      t.text(text + "...");
      textLength = t.node().getComputedTextLength();
      console.log(text, t.text());
    }

    this.setState({ nameLength: text.length });
  }
  render() {
    const { node } = this.props;
    const { nameLength } = this.state;
    return (
      <g class="taskgraphnode-name" transform="translate(16,20)">
        <text ref={this.textRef} alignmentBaseline="hanging">
          {`${node.label.substring(0, nameLength)}${
            node.label.length !== nameLength ? "..." : ""
          }`}
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
