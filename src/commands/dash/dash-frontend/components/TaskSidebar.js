import { h, Component } from "preact";
import "../style.less";

export default class TaskSidebar extends Component {
  render() {
    const { dag, tasks, selectedTask } = this.props;
    return (
      <div className="tasksidebar">
        <div>Sidebar</div>
        <div>
          {selectedTask !== null
            ? dag.node(selectedTask).label
            : "none selected"}
        </div>
      </div>
    );
  }
}
