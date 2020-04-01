import { h, Component } from "preact";
import TaskGraph from "./TaskGraph";
import TaskGraphMeta from "./TaskGraphMeta";
import TaskGraphControls from "./TaskGraphControls";
import graphlib from "graphlib";
import dagre from "dagre";
import { getPulse } from "../utils/api";
import "./TaskGraphSection.less";
import io from "socket.io-client";

function createDag(tasks, controls) {
  const graph = new graphlib.Graph()
    .setGraph({ rankdir: "LR", ...controls })
    .setDefaultEdgeLabel(() => ({}));

  let n = 0;
  const nodeMap = new Map();

  // create nodes
  tasks.map((cell, i) => {
    nodeMap.set(cell.pulse.name, n);
    graph.setNode(n++, {
      label: cell.pulse.name,
      taskIndex: i,
      ...cell,
      width: 275,
      height: 75,
    });
  });

  // create edges
  tasks.map(cell => {
    (cell.pulse.taskDeps || []).map(dep => {
      if (!nodeMap.has(cell.pulse.name) || !nodeMap.has(dep))
        throw Error(`${cell.pulse.name} or ${dep} not in nodeMap.`);
      graph.setEdge(nodeMap.get(dep), nodeMap.get(cell.pulse.name), {
        fromStatus: graph.node(nodeMap.get(dep)).pulse.status,
        toStatus: graph.node(nodeMap.get(cell.pulse.name)).pulse.status,
        fromWidth: graph.node(nodeMap.get(dep)).width,
        fromHeight: graph.node(nodeMap.get(dep)).height,
      });
    });
  });

  dagre.layout(graph);
  return { dag: graph, nodeMap };
}

export default class TaskGraphSection extends Component {
  state = { tasks: null, selectedTask: 0, controls: {} };
  componentDidMount() {
    const socket = io.connect("/");
    socket.on("oakfile", data => {
      const { pulse } = data;
      const { dag, nodeMap } = createDag(pulse.tasks, this.state.controls);
      this.setState({
        tasks: pulse.tasks,
        dag,
        nodeMap,
      });
    });
    getPulse().then(({ pulseResult }) => {
      const { dag, nodeMap } = createDag(
        pulseResult.tasks,
        this.state.controls
      );
      this.setState({
        tasks: pulseResult.tasks,
        dag,
        nodeMap,
      });
    });
  }
  render() {
    const { tasks, dag, selectedTask, controls, nodeMap } = this.state;
    if (!tasks || !dag)
      return <div className="taskgraph-section">Loading...</div>;
    return (
      <div className="taskgraph-section">
        <TaskGraph
          dag={dag}
          tasks={tasks}
          onTaskSelect={selectedTask => this.setState({ selectedTask })}
          selectedTask={selectedTask}
        />
        <TaskGraphControls
          controls={controls}
          onUpdate={controls => {
            const { dag, nodeMap } = createDag(tasks, controls);
            this.setState({ controls, dag, nodeMap });
          }}
        />

        <TaskGraphMeta
          dag={dag}
          tasks={tasks}
          nodeMap={nodeMap}
          selectedTask={selectedTask}
        />
      </div>
    );
  }
}
