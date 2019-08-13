import "./style";
import { Component } from "preact";
import { createContext } from "preact-context";
import io from "socket.io-client";

export const OakfileContext = createContext();

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

function OakfileGraph() {
  return (
    <OakfileContext.Consumer
      render={oakfile => {
        if (!oakfile) return <div>No Oakfile...</div>;
        return (
          <div className="OakfileGraph">
            <pre>
              <code>
                {oakfile.module.cells.map(cell => (
                  <span>
                    {cell.id.name}
                    {cell.references.map(ref => (
                      <span>{ref.name}</span>
                    ))}
                  </span>
                ))}
              </code>
            </pre>
          </div>
        );
      }}
    />
  );
}
class SocketProviders extends Component {
  state = {
    oakfile: null
  };
  socket = null;
  _onAuth = () => {
    console.log("auth please");
    this.socket.on("Oakfile", data => {
      console.log("new oakfile:", data);
      this.setState({ oakfile: data });
    });
  };
  _onUnAuth = err => {
    console.error("unauthorized: ", err.data);
    throw new Error(err.data.type);
  };
  _onConnect = () => {
    console.log("connected");
    const params = new URL(document.baseURI).searchParams;
    const encodedToken = params.get("token");
    if (!encodedToken) {
      console.error(`need token`);
      throw Error(`needs token`);
    }
    const token = atob(encodedToken);
    this.socket.emit("pls");
    this.socket
      .emit("authenticate", { token })
      .on("authenticated", this._onAuth)
      .on("unauthorized", this._onUnAuth);
  };
  componentDidMount() {
    this.socket = io.connect("");
    this.socket.on("connect", this._onConnect);
    this.socket.on("disconnect", () => console.log("socket disconnected"));
    this.socket.on("error", () => console.log("socket error"));
  }
  render() {
    console.log(this.state);
    const { oakfile } = this.state;
    return (
      <div>
        <OakfileContext.Provider value={oakfile}>
          {this.props.children}
        </OakfileContext.Provider>
      </div>
    );
  }
}

export default class App extends Component {
  render() {
    return (
      <div>
        <h1>Hello</h1>
        <SocketProviders>
          <OakfileCode />
          <OakfileGraph />
        </SocketProviders>
      </div>
    );
  }
}
