import { h, Component } from "preact";
import Header from "./Header";
import TaskGraphSection from "./TaskGraphSection";

export default class App extends Component {
  render() {
    return (
      <div>
        <Header />
        <TaskGraphSection />
      </div>
    );
  }
}
