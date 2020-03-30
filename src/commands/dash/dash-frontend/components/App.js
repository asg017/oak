import { h, Component } from "preact";
import Header from "./Header";
import AppSection from "./AppSection";

export default class App extends Component {
  render() {
    return (
      <div>
        <Header />
        <AppSection />
      </div>
    );
  }
}
