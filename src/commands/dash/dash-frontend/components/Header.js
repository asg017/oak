import { h, Component } from "preact";
import NavBar from "./NavBar";
import { duration } from "../utils/format";
import { getMeta } from "../utils/api";
import "./Header.less";

export default class Header extends Component {
  state = {
    meta: null,
  };
  componentDidMount() {
    getMeta().then(meta => this.setState({ meta }));
  }
  render() {
    const { meta } = this.state;
    if (!meta) return <div className="header">Loading...</div>;
    return (
      <div className="header">
        <div className="header-title">Oak Studio</div>
        <div>
          <div className="header-path">
            <div className="header-path-container">
              <span>{meta.oakfilePath}</span>
            </div>
          </div>
        </div>
        <NavBar />
      </div>
    );
  }
}
