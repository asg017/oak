import { h, createRef, Component } from "preact";
import { duration, bytesToSize } from "../utils/format";
import "./TaskGraphMeta.less";
import CodeMirror from "codemirror";
import jsMode from "codemirror/mode/javascript/javascript";

export default class TaskGraphMeta extends Component {
  codemirrorRef = createRef();
  codemirror = null;
  _attachCode() {}
  componentDidMount() {
    const { dag, selectedTask } = this.props;
    const task = dag.node(selectedTask);
    this.codemirror = CodeMirror(this.codemirrorRef.current, {
      value: task.cellCode,
      mode: "javascript",
      theme: "twilight",
      readOnly: true,
      lineNumbers: true,
    });
  }
  componentDidUpdate(prevProp) {
    const { dag, selectedTask } = this.props;
    if (prevProp.selectedTask !== selectedTask) {
      const task = dag.node(selectedTask);
      this.codemirror.setValue(task.cellCode);
    }
  }
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
        <div className="taskgraphmeta-code-header">Task Code</div>
        <div className="taskgraphmeta-code" ref={this.codemirrorRef}></div>
      </div>
    );
  }
}
