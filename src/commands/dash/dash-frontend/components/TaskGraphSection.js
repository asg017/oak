import { h, Component } from "preact";
import TaskGraph from "./TaskGraph";
import TaskGraphMeta from "./TaskGraphMeta";
import TaskGraphControls from "./TaskGraphControls";
import graphlib from "graphlib";
import dagre from "dagre";
import { getPulse } from "../utils/api";
import "./TaskGraphSection.less";

function createDag(tasks, controls) {
  const graph = new graphlib.Graph()
    .setGraph({ rankdir: "TB", ...controls })
    .setDefaultEdgeLabel(() => ({}));

  let n = 0;
  const nodeMap = new Map();

  // create nodes
  tasks.map((cell, i) => {
    nodeMap.set(cell.name, n);
    graph.setNode(n++, {
      label: cell.name,
      taskIndex: i,
      ...cell,
      width: 275,
      height: 75,
    });
  });

  // create edges
  tasks.map(cell => {
    (cell.taskDeps || []).map(dep => {
      if (!nodeMap.has(cell.name) || !nodeMap.has(dep))
        throw Error(`${cell.name} or ${dep} not in nodeMap. ${nodeMap.keys()}`);
      graph.setEdge(nodeMap.get(dep), nodeMap.get(cell.name), {
        fromStatus: graph.node(nodeMap.get(dep)).status,
        toStatus: graph.node(nodeMap.get(cell.name)).status,
        fromWidth: graph.node(nodeMap.get(dep)).width,
        fromHeight: graph.node(nodeMap.get(dep)).height,
      });
    });
  });

  dagre.layout(graph);
  return graph;
}

export default class TaskGraphSection extends Component {
  state = { tasks: null, selectedTask: null, controls: {} };
  componentDidMount() {
    getPulse().then(({ pulseResult }) =>
      this.setState({
        tasks: pulseResult.tasks,
        dag: createDag(pulseResult.tasks, this.state.controls),
      })
    );
  }
  render() {
    const { tasks, dag, selectedTask, controls } = this.state;
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
          onUpdate={controls =>
            this.setState({ controls, dag: createDag(tasks, controls) })
          }
        />
        <TaskGraphMeta dag={dag} tasks={tasks} selectedTask={selectedTask} />
      </div>
    );
  }
}
