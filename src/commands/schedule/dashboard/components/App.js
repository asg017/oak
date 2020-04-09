import { h, Component } from "preact";
import io from "socket.io-client";

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      currentSchedulePulse: null,
    };
    this.socket = {};
  }
  componentDidMount() {
    this.socket = io.connect("/schedulepulse");

    this.socket.on("pulse", pulse =>
      this.setState({ currentSchedulePulse: pulse })
    );
  }
  componentWillUnmount() {
    this.socket.removeAllListeners();
  }
  render() {
    const { cells } = this.state;
    return (
      <div>
        Hello, Schedule Dash
        <div>
          <div>
            <h1>Oak Schedule Dashboard</h1>
          </div>
          <div>
            <code>/path/to/Oakfile</code>
          </div>
        </div>
        <div className="summarysection">
          <h2>Summary</h2>
          <div>
            <ul>
              <li>Started X Hours ago</li>
              <li>X ticks across X schedulers</li>
              <li>X Task Runs</li>
              <ul>
                <li>X Succesful</li>
                <li>X failed</li>
              </ul>
            </ul>
          </div>
        </div>
        <div>
          {Array.from(cells).map(([cellName, { name, status }]) => (
            <div key={name}>
              {name} {status}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
