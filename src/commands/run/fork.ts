import { oak_run } from "../../core/run";
const [oakfile, runHash, ...targets] = process.argv.slice(2, process.argv.length)
oak_run({
    filename:oakfile,
    targets: targets,
    runHash
}).then(()=>process.exit(0))