import { h } from "preact";
import TaskGraphSection from "./TaskGraphSection";
import LogsSection from "./LogsSection";
import "./AppSection.less";

export default function AppSection(props) {
  const { section } = props;
  switch (section) {
    case "taskgraph":
      return (
        <div class="app-section">
          <TaskGraphSection />
        </div>
      );
    case "logs":
      return (
        <div class="app-section">
          <LogsSection />
        </div>
      );
    default:
      throw Error(`${section} not defined in AppSection.`);
  }
}
