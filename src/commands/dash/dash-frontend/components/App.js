import { h, Component } from "preact";
import Header from "./Header";
import AppSection from "./AppSection";
import io from "socket.io-client";

export default class App extends Component {
  componentDidMount() {
    const socket = io.connect("/");
    socket.on("oakfile", data => {
      console.log("socket.on oakfile", data);
    });
  }
  render() {
    return (
      <div>
        <Header />
        <AppSection />
      </div>
    );
  }
}
