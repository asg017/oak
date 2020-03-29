import { h } from "preact";
import "./NavBar.less";

export default function(props) {
  return (
    <div className="navbar">
      <div className="navbar-item">Task Graph</div>
      <div className="navbar-item navbar-item--disabled">Code</div>
      <div className="navbar-item navbar-item--disabled">Runs</div>
      <div className="navbar-item navbar-item--disabled">Logs</div>
    </div>
  );
}
