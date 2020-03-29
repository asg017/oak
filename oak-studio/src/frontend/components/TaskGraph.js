import { h, createRef, Component } from "preact";
import TaskGraphNode from "./TaskGraphNode";
import TaskGraphEdge from "./TaskGraphEdge";
import * as d3 from "d3";
import "./TaskGraph.less";

export default class TaskGraph extends Component {
  svgRef = createRef();
  state = {
    zoomTransform: null,
  };

  componentDidMount() {
    const { dag } = this.props;
    d3.select(this.svgRef.current).call(
      d3
        .zoom()
        .extent([
          [0, 0],
          [dag.graph().width, dag.graph().height],
        ])
        .scaleExtent([0.2, 3])
        .on("zoom", this._zoomed.bind(this))
    );
  }
  _zoomed() {
    this.setState({ zoomTransform: d3.event.transform });
  }
  render() {
    const { dag, onTaskSelect, selectedTask } = this.props;
    const { zoomTransform } = this.state;
    return (
      <div className="taskgraph">
        <svg
          ref={this.svgRef}
          width={dag.graph().width}
          height={dag.graph().height}
          preserveAspectRatio="none"
        >
          <g transform={zoomTransform || ""}>
            <g>
              {dag.nodes().map(i => (
                <TaskGraphNode
                  node={dag.node(i)}
                  selected={selectedTask === dag.node(i).taskIndex}
                  onTaskSelect={onTaskSelect}
                />
              ))}
            </g>
            <g>
              {dag.edges().map(i => (
                <TaskGraphEdge edge={dag.edge(i)} />
              ))}
            </g>
          </g>
        </svg>
      </div>
    );
  }
}
