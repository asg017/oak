import { h } from "preact";
import { useState } from "preact/hooks";

import "./ControlBar.less";

function RunButton() {
  return (
    <div className="controlbar-run">
      <span>▶</span> Run
    </div>
  );
}

function AutoRunPrompt() {
  return (
    <div className="controlbar-autorunprompt">
      <input type="checkbox"></input>
      <span>Automatically run on Oakfile save?</span>
    </div>
  );
}

export default function ControlBar() {
  const [count, setCount] = useState(0);
  return (
    <div className="controlbar" onClick={() => setCount(count + 1)}>
      <div className="controlbar-container">
        <AutoRunPrompt />
        <RunButton />
      </div>
    </div>
  );
}
