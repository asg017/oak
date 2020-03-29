import { h } from "preact";
import "./NavBar.less";

function NavBarItem(props) {
  const { label, selected = false, disabled = false, onSelect } = props;
  return (
    <div
      className={`navbar-item ${disabled ? "navbar-item--disabled" : ""} ${
        selected ? "navbar-item--selected" : ""
      }`}
      onClick={() => !disabled && onSelect()}
    >
      {label}
    </div>
  );
}
export default function NavBar(props) {
  const { onSelect, section } = props;
  return (
    <div className="navbar">
      <NavBarItem
        label="Task Graph"
        selected={section === "taskgraph"}
        onSelect={() => onSelect("taskgraph")}
      />

      <NavBarItem
        label="Code"
        selected={section === "code"}
        onSelect={() => onSelect("code")}
        disabled
      />

      <NavBarItem
        label="Runs"
        selected={section === "runs"}
        onSelect={() => onSelect("runs")}
        disabled
      />

      <NavBarItem
        label="Logs"
        selected={section === "logs"}
        onSelect={() => onSelect("logs")}
      />
    </div>
  );
}
