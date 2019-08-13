import "./style";
import { Component } from "preact";
import { createContext } from "preact-context";
import io from "socket.io-client";

const OakfileContext = createContext(13);

function X() {
  return <OakfileContext.Consumer render={um => <div>{um}x</div>} />;
}
export default class App extends Component {
  render() {
    const params = new URL(document.baseURI).searchParams;
    const encodedToken = params.get("token");
    if (!encodedToken) {
      console.error(`need token`);
      throw Error(`needs token`);
    }
    console.log(params, encodedToken);
    const token = atob(encodedToken);
    var socket = io.connect("");

    const onConnect = () => {
      console.log("connected");
      const onAuth = () => {
        console.log("auth please");
        socket.on("Oakfile", data => {
          console.log("new oakfile:", data);
        });
      };
      const onUnAuth = err => {
        console.error("unauthorized: ", err.data);
        throw new Error(err.data.type);
      };
      console.log(token);
      socket.emit("pls");
      socket
        .emit("authenticate", { token })
        .on("authenticated", onAuth)
        .on("unauthorized", onUnAuth);
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", () => {
      console.log("socket disconnected");
    });
    socket.on("error", () => {
      console.log("socket error");
    });
    return (
      <div>
        <h1>Hello, World!</h1>
        <OakfileContext.Provider value={42}>
          <X />
          <div>yeet</div>
        </OakfileContext.Provider>
      </div>
    );
  }
}
