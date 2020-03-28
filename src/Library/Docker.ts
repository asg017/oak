import { Execution } from "../Execution";
import { default as DockerLib } from "dockerode";

const d = new DockerLib();
d;

function createContainer(dockerClient) {}

export default function Docker(args = {}): () => Execution {}
Docker.Container = createContainer;

/*

d = Docker({parans})

c1 = d.Container()

*/
