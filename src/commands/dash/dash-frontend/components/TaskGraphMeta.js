import { h, Component } from "preact";
import { duration, bytesToSize } from "../utils/format";
import "./TaskGraphMeta.less";

export default class TaskGraphMeta extends Component {
  render() {
    const { dag, tasks, selectedTask } = this.props;
    if (selectedTask === null)
      return (
        <div className="taskgraphmeta">
          <div>{"none selected"}</div>
        </div>
      );
    const task = dag.node(selectedTask);
    console.log(task);
    return (
      <div className="taskgraphmeta">
        <div className="taskgraphmeta-name">{task.label}</div>
        <table className="taskgraphmeta-table">
          <tr>
            <td>Path</td>
            <td style={{ overflow: "ellipses" }}>{task.target}</td>
          </tr>
          <tr>
            <td>Size</td>
            <td>{bytesToSize(task.bytes)}</td>
          </tr>
          <tr>
            <td>Last Modified</td>
            <td>{task.mtime ? duration(new Date(task.mtime)) : "-"}</td>
          </tr>
        </table>
        <code>
          <pre>{task.cellCode}</pre>
        </code>
      </div>
    );
  }
}
