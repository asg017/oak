import { h, Component } from "preact";
import "./LogsSection.less";
import { route } from "preact-router";
import { getLog, getLogs } from "../utils/api";
import { duration } from "../utils/format";

class LogsSectionLogSelector extends Component {
  render() {
    const { logs, onSelect, selectedLog } = this.props;
    return (
      <div className="logssection-logselector">
        {logs.map((log, i) => (
          <LogsSectionLogSelectorItem
            key={log.rowid}
            log={log}
            selected={selectedLog && selectedLog.rowid === log.rowid}
            onSelect={() => onSelect(log)}
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
      onClick={() => {
        route(`/logs?logid=${rowid}`);
        onSelect();
      }}
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
    if (
      Boolean(this.props.selectedLog) ^ Boolean(prevProp.selectedLog) ||
      prevProp.selectedLog.rowid !== this.props.selectedLog.rowid
    ) {
      getLog(this.props.selectedLog.rowid)
        .then(data => this.setState({ error: false, loading: false, data }))
        .catch(err =>
          this.setState({ error: true, loading: false, data: err })
        );
    }
  }
  render() {
    const { selectedLog } = this.props;
    const { loading, error, data } = this.state;
    if (loading) return <div className="logssection-logviewer">Loading...</div>;
    if (error)
      return (
        <div className="logssection-logviewer">
          There was a problem loading this page :/{" "}
        </div>
      );
    if (selectedLog === null)
      return <div className="logssection-logviewer">Select a log to view.</div>;
    return (
      <div className="logssection-logviewer">
        <div>{selectedLog.cellName}</div>
        <div>{selectedLog.rowid}</div>
        <div>{duration(new Date(selectedLog.time))}</div>
        <div>
          <code>{selectedLog.path}</code>
        </div>
        <code>
          <pre>{data}</pre>
        </code>
      </div>
    );
  }
}

export default class LogsSection extends Component {
  state = { error: false, loading: true, data: null, selectedLog: null };
  componentDidMount() {
    this.setState({ loading: true });
    getLogs()
      .then(data => this.setState({ error: false, loading: false, data }))
      .catch(err => this.setState({ error: true, loading: false, data: err }));
  }
  render() {
    const { logid } = this.props;
    const { loading, error, data, selectedLog } = this.state;

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
          selectedLog={selectedLog}
          onSelect={selectedLog => this.setState({ selectedLog })}
        />
        <LogsSectionLogViewer selectedLog={selectedLog} />
      </div>
    );
  }
}
