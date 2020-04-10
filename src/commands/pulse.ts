import { getPulse } from "../core/pulse";
import { bytesToSize, duration } from "../utils";
import { fileArgument } from "../cli-utils";

export async function pulseCommand(args: { filename: string }): Promise<void> {
  const oakfilePath = fileArgument(args.filename);
  const pulseResult = await getPulse(oakfilePath);
  for (let { task, name } of pulseResult.tasks) {
    const { pulse } = task;
    console.info(
      name,
      ` ${pulse.name} - ${pulse.status} - ${bytesToSize(
        pulse.bytes
      )} - ${duration(new Date(pulse.mtime))}`
    );
  }
}
