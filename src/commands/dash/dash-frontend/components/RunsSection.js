import { h, Component } from "preact";
import "./RunsSection.less";
import { getRun, getRuns } from "../utils/api";
import { duration } from "../utils/format";

class RunsSectionRunSelector extends Component {
  render() {
    const { runs, onSelect, selectedRunId } = this.props;
    return (
      <div className="runssection-runselector">
        {runs.map((run, i) => (
          <RunsSectionRunSelectorItem
            key={run.rowid}
            run={run}
            selected={selectedRunId === run.rowid}
            onSelect={() => onSelect(run.rowid)}
          />
        ))}
      </div>
    );
  }
}
function RunsSectionRunSelectorItem(props) {
  const { run, selected, onSelect } = props;
  const { rowid, oakfile, cellName, cellAncestorHash, path, time } = run;
  return (
    <div
      className={`runssection-runselectoritem ${
        selected ? "runssection-runselectoritem--selected" : ""
      }`}
      onClick={() => onSelect()}
    >
      <div className="runssection-runselectoritem-title">{cellName}</div>
      <div className="runssection-runselectoritem-rowid">#{rowid}</div>
      <div className="runssection-runselectoritem-time">
        {duration(new Date(time))}
      </div>
    </div>
  );
}

class RunsSectionRunViewer extends Component {
  state = { error: false, loading: false, data: null };
  componentDidUpdate(prevProp) {
    if (prevProp.selectedRunId !== this.props.selectedRunId) {
      getRun(this.props.selectedRunId)
        .then(data => this.setState({ error: false, loading: false, data }))
        .catch(err =>
          this.setState({ error: true, loading: false, data: err })
        );
    }
  }
  render() {
    const { selectedRunId } = this.props;
    const { loading, error, data } = this.state;
    if (loading) return <div className="runssection-runviewer">Loading...</div>;
    if (error)
      return (
        <div className="runssection-runviewer">
          There was a problem loading this page :/{" "}
        </div>
      );
    if (selectedRunId === null)
      return <div className="runssection-runviewer">Select a run to view.</div>;
    return (
      <div className="runssection-runviewer">
        <code>
          <pre>{data}</pre>
        </code>
      </div>
    );
  }
}

export default class RunsSection extends Component {
  state = { error: false, loading: true, data: null, selectedRunId: null };
  componentDidMount() {
    this.setState({ loading: true });
    getRuns()
      .then(data => this.setState({ error: false, loading: false, data }))
      .catch(err => this.setState({ error: true, loading: false, data: err }));
  }
  render() {
    const { loading, error, data, selectedRunId } = this.state;
    if (loading) return <div className="runssection">Loading...</div>;
    if (error)
      return (
        <div className="runssection">
          There was a problem loading this page :/{" "}
        </div>
      );
    return (
      <div className="runssection">
        <RunsSectionRunSelector
          runs={data.runs}
          selectedRunId={selectedRunId}
          onSelect={selectedRunId => this.setState({ selectedRunId })}
        />
        <RunsSectionRunViewer selectedRunId={selectedRunId} />
      </div>
    );
  }
}
