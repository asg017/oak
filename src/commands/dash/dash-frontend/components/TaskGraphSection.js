import { h, Component } from "preact";
import TaskGraph from "./TaskGraph";
import TaskSidebar from "./TaskSidebar";
import graphlib from "graphlib";
import dagre from "dagre";

function createDag(tasks) {
  const graph = new graphlib.Graph()
    .setGraph({ rankdir: "TB" })
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
      height: 100,
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
      });
    });
  });

  dagre.layout(graph);
  return graph;
}

export default class TaskGraphSection extends Component {
  state = { tasks: null, selectedTask: null };
  componentDidMount() {
    fetch("api/pulse")
      .then(r => r.json())
      .then(({ pulseResult }) =>
        this.setState({
          tasks: pulseResult.tasks,
          dag: createDag(pulseResult.tasks),
        })
      );
  }
  render() {
    const { tasks, dag, selectedTask } = this.state;
    if (!tasks || !dag)
      return <div className="taskgraph-section">Loading...</div>;
    return (
      <div className="taskgraph-section">
        <div>
          <TaskGraph
            dag={dag}
            tasks={tasks}
            onTaskSelect={selectedTask => this.setState({ selectedTask })}
            selectedTask={selectedTask}
          />
          <TaskSidebar dag={dag} tasks={tasks} selectedTask={selectedTask} />
        </div>
      </div>
    );
  }
}
