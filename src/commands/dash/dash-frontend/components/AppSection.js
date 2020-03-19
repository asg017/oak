import { h } from "preact";
import TaskGraphSection from "./TaskGraphSection";
import "./AppSection.less";

export default function AppSection(props) {
  const section = "task-graph";
  switch (section) {
    case "task-graph":
      return (
        <div class="app-section">
          <TaskGraphSection />
        </div>
      );
    default:
      throw Error(`${section} not defined in AppSection.`);
  }
}
