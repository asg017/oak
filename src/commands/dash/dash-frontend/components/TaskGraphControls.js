import { h, Component } from "preact";
export default class TaskGraphControls extends Component {
  render() {
    const { controls, onUpdate } = this.props;
    return (
      <div>
        <div>rankdir</div>
        <select
          onChange={e =>
            onUpdate(Object.assign(controls, { rankdir: e.target.value }))
          }
        >
          <option>TB</option>
          <option>LR</option>
        </select>
      </div>
    );
  }
}
