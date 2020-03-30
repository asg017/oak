import { h, Component } from "preact";
import { Router } from "preact-router";
import TaskGraphSection from "./TaskGraphSection";
import LogsSection from "./LogsSection";
import RunsSection from "./RunsSection";

import "./AppSection.less";

class A extends Component {
  render() {
    return <div>hi a</div>;
  }
}
export default function AppSection(props) {
  const { section } = props;
  return (
    <div class="app-section">
      <Router>
        <TaskGraphSection path="task-graph" default />
        <LogsSection path="logs/:logid?" />
        <RunsSection path="runs" />
      </Router>
    </div>
  );
}
