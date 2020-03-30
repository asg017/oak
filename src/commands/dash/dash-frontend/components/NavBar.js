import { h } from "preact";
import { Link } from "preact-router/match";
import "./NavBar.less";

function NavBarItem(props) {
  const { label, href, disabled = false } = props;
  return (
    <Link
      activeClassName="navbar-item--selected"
      className={`navbar-item ${disabled ? "navbar-item--disabled" : ""}`}
      href={href}
    >
      {label}
    </Link>
  );
}
export default function NavBar() {
  return (
    <div className="navbar">
      <NavBarItem label="Task Graph" href="/task-graph" />
      <NavBarItem label="Code" disabled />
      <NavBarItem label="Runs" href="/runs" />
      <NavBarItem label="Logs" href="/logs" />
    </div>
  );
}
