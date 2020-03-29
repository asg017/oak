import { h, createRef, Component } from "preact";
import { duration, bytesToSize } from "../utils/format";
import "./TaskGraphMeta.less";
import CodeMirror from "codemirror";
import jsMode from "codemirror/mode/javascript/javascript";
import scrollbar from "codemirror/addon/scroll/simplescrollbars";
import scrollbarCSS from "codemirror/addon/scroll/simplescrollbars.css";

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
      scrollbarStyle: "simple",
    });
    // omg very hack pls fix
    this.codemirror.setSize(580, task.cellCode.split("\n").length * 20);
  }
  componentDidUpdate(prevProp) {
    const { dag, selectedTask } = this.props;
    if (prevProp.selectedTask !== selectedTask) {
      const task = dag.node(selectedTask);
      this.codemirror.setValue(task.cellCode);
      // omg very hack pls fix
      this.codemirror.setSize(580, task.cellCode.split("\n").length * 20);
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
