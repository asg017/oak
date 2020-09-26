#!/usr/bin/env node

import { logsCommand } from "./commands/logs";
import { pathCommand } from "./commands/path";
import { runCommand } from "./commands/run";
import { versionCommand } from "./commands/version";

import {
  CommandLineStringParameter,
  CommandLineStringListParameter,
  CommandLineAction,
  CommandLineParser,
  CommandLineFlagParameter,
} from "@rushstack/ts-command-line";

class LogsAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;
  private _targets: CommandLineStringListParameter;
  public constructor() {
    super({
      actionName: "logs",
      summary: "Show the logs from a previous oak run.",
      documentation: "TODO",
    });
  }
  protected async onExecute(): Promise<void> {
    await logsCommand({
      filename: this._filename.value,
      targets: this._targets.values,
    });
    return;
  }

  protected onDefineParameters(): void {
    this._filename = this.defineStringParameter({
      argumentName: "FILENAME",
      parameterLongName: "--file",
      parameterShortName: "-f",
      description: "Path to Oakfile.",
      defaultValue: "./Oakfile",
    });
    this._targets = this.defineStringListParameter({
      argumentName: "TARGET",
      parameterLongName: "--target",
      parameterShortName: "-t",
      description: "Task name associated with the log.",
      required: true,
    });
  }
}

class PathAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;
  private _targets: CommandLineStringListParameter;
  public constructor() {
    super({
      actionName: "path",
      summary: "Get the target's path of an Oak Task.",
      documentation: "TODO",
    });
  }
  protected async onExecute(): Promise<void> {
    await pathCommand({
      filename: this._filename.value,
      targets: this._targets.values,
    });
    return;
  }

  protected onDefineParameters(): void {
    this._filename = this.defineStringParameter({
      argumentName: "FILENAME",
      parameterLongName: "--file",
      parameterShortName: "-f",
      description: "Path to Oakfile.",
      defaultValue: "./Oakfile",
    });
    this._targets = this.defineStringListParameter({
      argumentName: "TARGET",
      parameterLongName: "--target",
      parameterShortName: "-t",
      description: "Task name associated with the log.",
      required: true,
    });
  }
}

class RunAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;
  private _overrides: CommandLineStringListParameter;
  private _redefines: CommandLineStringListParameter;
  private _stdout: CommandLineStringParameter;
  private _stdin: CommandLineStringParameter;
  private _targets: CommandLineStringListParameter;

  public constructor() {
    super({
      actionName: "run",
      summary: "Run an Oakfile.",
      documentation: "TODO",
    });
  }
  protected async onExecute(): Promise<void> {
    await runCommand({
      filename: this._filename.value,
      overrides: this._overrides.values,
      targets: this._targets.values,
      stdout: this._stdout.value,
      stdin: this._stdin.value,
      redefines: this._redefines.values,
    });
    return;
  }

  protected onDefineParameters(): void {
    this._filename = this.defineStringParameter({
      argumentName: "FILENAME",
      parameterLongName: "--file",
      parameterShortName: "-f",
      description: "Path to Oakfile.",
      defaultValue: "./Oakfile",
    });
    this._overrides = this.defineStringListParameter({
      argumentName: "OVERRIDESTRING",
      parameterLongName: "--override",
      description:
        "List of override-formatted strings to override cells as Tasks.",
    });
    this._redefines = this.defineStringListParameter({
      argumentName: "CELLDEFINITION",
      parameterLongName: "--redefine",
      description: "Code that redefines a cell in the Oakfile.",
    });
    this._stdout = this.defineStringParameter({
      argumentName: "TASKNAME",
      parameterLongName: "--stdout",
      description:
        "The name of a Task cell that should be printed to stdout once complete.",
    });
    this._stdin = this.defineStringParameter({
      argumentName: "TASKNAME",
      parameterLongName: "--stdin",
      description:
        "The name of a Task cell whose target should be overwritten by the contents of stdin.",
    });
    this._targets = this.defineStringListParameter({
      argumentName: "TARGETS",
      parameterLongName: "--targets",
      parameterShortName: "-t",
      description: "List of target names to resolve.",
    });
  }
}


class VersionAction extends CommandLineAction {
  public constructor() {
    super({
      actionName: "version",
      summary: "Print version of oak.",
      documentation: "TODO",
    });
  }
  protected onDefineParameters(): void {}
  protected async onExecute(): Promise<void> {
    versionCommand();
  }
}
class OakCommandLine extends CommandLineParser {
  public constructor() {
    super({
      toolFilename: "oak",
      toolDescription: "CLI for oak.",
    });

    this.addAction(new LogsAction());
    this.addAction(new PathAction());
    this.addAction(new RunAction());
    this.addAction(new VersionAction());
  }

  protected onDefineParameters(): void {}

  protected async onExecute(): Promise<void> {
    await super.onExecute();
    return;
  }
}
(async function main(): Promise<void> {
  const cli: OakCommandLine = new OakCommandLine();
  await cli.execute();
  return;
})();
