import { h, Component } from "preact";
import "./LogsSection.less";
import { getLog, getLogs } from "../utils/api";
import { duration } from "../utils/format";

class LogsSectionLogSelector extends Component {
  render() {
    const { logs, onSelect, selectedLogId } = this.props;
    return (
      <div className="logssection-logselector">
        {logs.map((log, i) => (
          <LogsSectionLogSelectorItem
            key={log.rowid}
            log={log}
            selected={selectedLogId === log.rowid}
            onSelect={() => onSelect(log.rowid)}
          />
        ))}
      </div>
    );
  }
}
function LogsSectionLogSelectorItem(props) {
  const { log, selected, onSelect } = props;
  const { rowid, oakfile, run, cellName, cellAncestorHash, path, time } = log;
  return (
    <div
      className={`logssection-logselectoritem ${
        selected ? "logssection-logselectoritem--selected" : ""
      }`}
      onClick={() => onSelect()}
    >
      <div className="logssection-logselectoritem-title">{cellName}</div>
      <div className="logssection-logselectoritem-rowid">#{rowid}</div>
      <div className="logssection-logselectoritem-time">
        {duration(new Date(time))}
      </div>
    </div>
  );
}

class LogsSectionLogViewer extends Component {
  state = { error: false, loading: false, data: null };
  componentDidUpdate(prevProp) {
    if (prevProp.selectedLogId !== this.props.selectedLogId) {
      getLog(this.props.selectedLogId)
        .then(data => this.setState({ error: false, loading: false, data }))
        .catch(err =>
          this.setState({ error: true, loading: false, data: err })
        );
    }
  }
  render() {
    const { selectedLogId } = this.props;
    const { loading, error, data } = this.state;
    if (loading) return <div className="logssection-logviewer">Loading...</div>;
    if (error)
      return (
        <div className="logssection-logviewer">
          There was a problem loading this page :/{" "}
        </div>
      );
    if (selectedLogId === null)
      return <div className="logssection-logviewer">Select a log to view.</div>;
    console.log(data);
    return (
      <div className="logssection-logviewer">
        <code>
          <pre>{data}</pre>
        </code>
      </div>
    );
  }
}

export default class LogsSection extends Component {
  state = { error: false, loading: true, data: null, selectedLogId: null };
  componentDidMount() {
    this.setState({ loading: true });
    getLogs()
      .then(data => this.setState({ error: false, loading: false, data }))
      .catch(err => this.setState({ error: true, loading: false, data: err }));
  }
  render() {
    const { loading, error, data, selectedLogId } = this.state;
    if (loading) return <div className="logssection">Loading...</div>;
    if (error)
      return (
        <div className="logssection">
          There was a problem loading this page :/{" "}
        </div>
      );
    return (
      <div className="logssection">
        <LogsSectionLogSelector
          logs={data.logs}
          selectedLogId={selectedLogId}
          onSelect={selectedLogId => this.setState({ selectedLogId })}
        />
        <LogsSectionLogViewer selectedLogId={selectedLogId} />
      </div>
    );
  }
}
