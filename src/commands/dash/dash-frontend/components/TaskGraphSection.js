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
  for (const { task, name, signature } of tasks) {
    const node = {
      label: name,
      name,
      taskIndex: n,
      signature,
      task,
      width: 275,
      height: 75,
    };
    nodeMap.set(name, node);
    graph.setNode(n++, node);
    task.pulse.taskDeps.map(dep => {
      if (dep.importId) {
        const node = {
          label: `(imported cell) ${dep.name}`,
          name: `${dep.importId}/${dep.name}`,
          taskIndex: n,
          task: null,
          signature: null,
          width: 275,
          height: 75,
        };
        nodeMap.set(`${dep.importId}/${dep.name}`, node);
        graph.setNode(n++, node);
      }
    });
  }
  console.log(tasks, nodeMap);
  // create edges
  for (const { task, name } of tasks) {
    (task.pulse.taskDeps || []).map(dep => {
      const depKey = dep.importId ? `${dep.importId}/${dep.name}` : dep.name;

      if (!nodeMap.has(name) || !nodeMap.has(depKey))
        throw Error(`${name} or ${depKey} not in nodeMap.`);

      const from = graph.node(nodeMap.get(depKey).taskIndex);
      const to = graph.node(nodeMap.get(name).taskIndex);

      graph.setEdge(from.taskIndex, to.taskIndex, {
        fromStatus: from.task?.pulse?.status || "import",
        toStatus: to.task.pulse.status,
        fromWidth: to.width,
        fromHeight: to.height,
      });
    });
  }

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
