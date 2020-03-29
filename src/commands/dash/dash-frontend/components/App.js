import { h, Component } from "preact";
import Header from "./Header";
import AppSection from "./AppSection";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      section: "logs",
    };
  }
  componentDidMount() {}
  render() {
    const { section } = this.state;
    return (
      <div>
        <Header
          section={section}
          onSelectionSection={section => this.setState({ section })}
        />
        <AppSection section={section} />
      </div>
    );
  }
}
