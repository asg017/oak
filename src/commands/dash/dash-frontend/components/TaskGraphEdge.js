import { h, Component } from "preact";
import { line, curveCardinal } from "d3";
import { colorVariable } from "../utils/colors";
import "./TaskGraphEdge.less";

const l = line()
  .x(d => d.x)
  .y(d => d.y)
  .curve(curveCardinal);

function TaskGraphEdgePath(props) {
  const { edge } = props;
  return (
    <g>
      <path
        class="taskgraphedge-path"
        d={l(edge.points)}
        stroke={colorVariable.get(edge.fromStatus)}
      ></path>
    </g>
  );
}
function TaskGraphEdgeFrom(props) {
  const { edge } = props;
  return (
    <g class="taskgraphedge-from">
      <circle
        cx={edge.points[0].x}
        cy={edge.points[0].y}
        stroke="#d5d5d5"
        fill={colorVariable.get(edge.fromStatus)}
        r={4}
      ></circle>
    </g>
  );
}
function TaskGraphEdgeTo(props) {
  const { edge } = props;
  return (
    <g class="taskgraphedge-to">
      <circle
        cx={edge.points[2].x}
        cy={edge.points[2].y}
        stroke="#d5d5d5"
        fill={colorVariable.get(edge.toStatus)}
        r={4}
      ></circle>
    </g>
  );
}

export default function TaskGraphEdge(props) {
  const { edge } = props;
  return (
    <g
      class="taskgraphedge"
      transform={`translate(${edge.fromWidth / 2}, ${edge.fromHeight / 2})`}
    >
      <TaskGraphEdgePath edge={edge} />
      <TaskGraphEdgeFrom edge={edge} />
      <TaskGraphEdgeTo edge={edge} />
    </g>
  );
}
