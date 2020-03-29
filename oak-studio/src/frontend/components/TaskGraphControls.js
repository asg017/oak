import { h, Component } from "preact";
export default class TaskGraphControls extends Component {
  render() {
    const { controls, onUpdate } = this.props;
    return (
      <div>
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
        <div>
          <div>align</div>
          <select
            onChange={e =>
              onUpdate(
                Object.assign(controls, {
                  align: e.target.value === "none" ? null : e.target.value,
                })
              )
            }
          >
            <option>none</option>
            <option>UL</option>
            <option>UR</option>
            <option>DL</option>
            <option>DR</option>
          </select>
        </div>
      </div>
    );
  }
}
