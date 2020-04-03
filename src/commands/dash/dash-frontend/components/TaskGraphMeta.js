import { Fragment, h, createRef, Component } from "preact";
import { duration, bytesToSize } from "../utils/format";
import "./TaskGraphMeta.less";
import CodeMirror from "codemirror";
import jsMode from "codemirror/mode/javascript/javascript";
import scrollbar from "codemirror/addon/scroll/simplescrollbars";
import scrollbarCSS from "codemirror/addon/scroll/simplescrollbars.css";

function Row(props) {
  const { name, value } = props;
  return (
    <div className="taskgraphmeta-row">
      <div>{name}</div>
      <div>{value}</div>
    </div>
  );
}

function TaskGraphMetaTable(props) {
  const { node } = props;
  const { task } = node;
  const { pulse } = task;
  return (
    <div className="taskgraphmeta-table">
      <Row
        name="Target"
        value={
          <div className="taskgraphmeta-target">
            <code>{task.targetOriginal}</code>
          </div>
        }
      />
      <Row
        name="Path"
        value={
          <div className="taskgraphmeta-path">
            <code>{pulse.target}</code>
          </div>
        }
      />
      <Row
        name="Size"
        value={
          <div className="taskgraphmeta-size">{bytesToSize(pulse.bytes)}</div>
        }
      />
      <Row
        name="Last Modified"
        value={
          <div className="taskgraphmeta-mtime">
            {pulse.mtime ? duration(new Date(pulse.mtime)) : "-"}
          </div>
        }
      />
    </div>
  );
}
class TaskGraphMetaCode extends Component {
  codemirrorRef = createRef();
  codemirror = null;
  _attachCode() {}
  componentDidMount() {
    const { node } = this.props;
    const { task } = node;
    const { signature } = node;
    this.codemirror = CodeMirror(this.codemirrorRef.current, {
      value: signature.cellContents,
      mode: "javascript",
      theme: "twilight",
      readOnly: true,
      lineNumbers: true,
      scrollbarStyle: "simple",
      viewportMargin: Infinity,
    });
    // omg very hack pls fix
    this.codemirror.setSize(
      null,
      this.codemirror.lineCount() * (this.codemirror.defaultTextHeight() + 2)
    );
  }
  componentDidUpdate(prevProp) {
    const { node } = this.props;
    const { signature } = node;
    if (prevProp.node.taskIndex !== node.taskIndex) {
      this.codemirror.setValue(signature.cellContents);
      // omg very hack pls fix
      this.codemirror.setSize(
        null,
        this.codemirror.lineCount() * (this.codemirror.defaultTextHeight() + 5)
      );
    }
  }
  render() {
    return (
      <div>
        <div className="taskgraphmeta-code" ref={this.codemirrorRef}></div>
      </div>
    );
  }
}
function TaskGraphMetaDependenciesList(props) {
  const { dependencies } = props;
  return (
    <div>
      {dependencies.map(d => (
        <div>
          <h4>{d.name}</h4>
          <div>{d.task?.pulse?.status || ""}</div>
        </div>
      ))}
    </div>
  );
}
function TaskGraphMetaDependencies(props) {
  const { dag, nodeMap, pulse } = props;
  console.log(pulse, nodeMap);
  const dependencies = pulse.taskDeps.map(dep => {
    return dag.node(
      nodeMap.get(dep.importId ? `${dep.importId}/${dep.name}` : dep.name)
        .taskIndex
    );
  });
  return (
    <div className="tasgraphmeta-depedencies">
      <h3>Task Dependencies</h3>
      {dependencies.length === 0 ? (
        `There are no dependencies for ${pulse.name}!`
      ) : (
        <TaskGraphMetaDependenciesList dependencies={dependencies} />
      )}
    </div>
  );
}

export default class TaskGraphMeta extends Component {
  render() {
    const { dag, selectedTask, nodeMap } = this.props;
    if (selectedTask === null)
      return (
        <div className="taskgraphmeta">
          <div>{"none selected"}</div>
        </div>
      );
    const node = dag.node(selectedTask);
    const { task } = node;
    const pulse = task?.pulse;
    return (
      <div className="taskgraphmeta">
        <div>
          <h2 className="taskgraphmeta-name">{node.label}</h2>
          <TaskGraphMetaCode node={node} />
          <TaskGraphMetaTable node={node} pulse={pulse} />
          <TaskGraphMetaDependencies
            dag={dag}
            pulse={pulse}
            nodeMap={nodeMap}
          />
        </div>
      </div>
    );
  }
}
