import { h, Component } from "preact";
import { duration } from "../utils/format";

export default class Header extends Component {
  state = {
    meta: null,
  };
  componentDidMount() {
    fetch(`/api/meta`)
      .then(r => r.json())
      .then(meta => this.setState({ meta }));
  }
  render() {
    const { meta } = this.state;
    if (!meta) return <div className="header">Loading...</div>;
    return (
      <div className="header">
        <div className="header-title">Oak Dash</div>
        <div>
          <span className="header-path">{meta.oakfilePath}</span>
        </div>
        <div className="header-timestamp">{`Last update: ${duration(
          new Date(meta.stat.mtime)
        )}`}</div>
      </div>
    );
  }
}
