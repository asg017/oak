import { h, render, Component } from "preact";
import { createContext } from "preact-context";
import io from "socket.io-client";
import "./style";
import { Runtime, Inspector } from "@observablehq/runtime";
import notebook from "@mbostock/graph-o-matic";

export const OakfileContext = createContext();

export const SocketContext = createContext();

function OakfileCode() {
  return (
    <OakfileContext.Consumer
      render={oakfile => {
        console.log(`qaz`, oakfile);
        if (!oakfile) return <div>No Oakfile...</div>;
        return (
          <div className="OakfileCode">
            <pre>
              <code>{oakfile.contents}</code>
            </pre>
          </div>
        );
      }}
    />
  );
}

function SocketStatus() {
  return (
    <div className="socket-status">
      <SocketContext.Consumer
        render={status => {
          return <div>{status}</div>;
        }}
      />
    </div>
  );
}

class OakfileGraph extends Component {
  componentDidMount() {
    const { oakfile } = this.props;
    const runtime = new Runtime();
    const module = runtime.module(notebook, name => {
      if (name === "chart") {
        return new Inspector(this.base);
      }
    });
    module.redefine("source", () => oakfile.dot);
  }
  render() {
    return <div className="OakfileGraph" />;
  }
}
function OakfileGraphConsume() {
  return (
    <OakfileContext.Consumer
      render={oakfile => {
        if (!oakfile) return <div>No Oakfile...</div>;
        return <OakfileGraph oakfile={oakfile} />;
      }}
    />
  );
}
class SocketProviders extends Component {
  constructor(props) {
    super(props);
    this.state = {
      oakfile: null,
      status: "disconnected",
    };
    this.socket = null;
  }
  _onAuth = () => {
    console.log("auth please");
    this.setState({ status: "auth" });
    this.socket.on("Oakfile", data => {
      console.log("new oakfile:", data);
      this.setState({ oakfile: data });
    });
  };
  _onUnAuth = err => {
    this.setState({ stats: "unauth" });
    console.error("unauthorized: ", err.data);
    throw new Error(err && err.data && err.data.type);
  };
  _onConnect = () => {
    console.log("connected");
    this.setState({ status: "connected" });
    const params = new URL(document.baseURI).searchParams;
    let encodedToken = params.get("token");
    if (!encodedToken) {
      console.error(`need token`);
      this.setState({ status: "unauth" });
      throw Error(`needs token`);
    }
    const token = atob(encodedToken);
    console.log(encodedToken, encodedToken.length, token);
    this.socket
      .emit("authenticate", { token })
      .on("authenticated", this._onAuth)
      .on("unauthorized", this._onUnAuth);
  };
  componentDidMount() {
    this.socket = io.connect("");
    this.socket.on("connect", this._onConnect);
    this.socket.on("disconnect", () => {
      this.setState({ status: "disconnected" });
    });
    this.socket.on("error", () => console.log("soe socket error"));
  }
  render() {
    console.log(this.state);
    const { oakfile, status } = this.state;
    return (
      <div>
        <SocketContext.Provider value={status}>
          <OakfileContext.Provider value={oakfile}>
            {this.props.children}
          </OakfileContext.Provider>
        </SocketContext.Provider>
      </div>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div>
        <h1>Hello</h1>
        <SocketProviders>
          <OakfileCode />
          <OakfileGraphConsume />
          <SocketStatus />
        </SocketProviders>
      </div>
    );
  }
}

render(<App />, document.querySelector("#main"));
