#!/usr/bin/env node

import { oak_run } from "./commands/run";
import oak_runx from "./commands/runx";
import { oak_pulse } from "./commands/pulse";
import { oak_init } from "./commands/init";
import oak_dash from "./commands/dash";
import oak_version from "./commands/version";
import oak_clean from "./commands/clean";
import { oak_logs } from "./commands/logs";
import { oak_path } from "./commands/path";

import {
  CommandLineChoiceParameter,
  CommandLineStringParameter,
  CommandLineStringListParameter,
  CommandLineAction,
  CommandLineParser,
  CommandLineFlagParameter,
} from "@rushstack/ts-command-line";

class CleanAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;
  private _targets: CommandLineStringListParameter;
  private _force: CommandLineFlagParameter;

  public constructor() {
    super({
      actionName: "clean",
      summary: "Remove task target files.",
      documentation: "TODO",
    });
  }
  protected onExecute(): Promise<void> {
    return oak_clean({
      targets: this._targets.values,
      filename: this._filename.value,
      force: this._force.value,
    });
  }

  protected onDefineParameters(): void {
    this._filename = this.defineStringParameter({
      argumentName: "FILENAME",
      parameterLongName: "--file",
      parameterShortName: "-f",
      description: "Path to Oakfile.",
      defaultValue: "./Oakfile",
    });
    this._force = this.defineFlagParameter({
      parameterLongName: "--force",
      description: "Force deletion of files with no prompt.",
    });
    this._targets = this.defineStringListParameter({
      argumentName: "TARGETS",
      parameterLongName: "--targets",
      parameterShortName: "-t",
      description: "List of target names to resolve.",
    });
  }
}
class DashAction extends CommandLineAction {
  private _port: CommandLineStringParameter;
  private _filename: CommandLineStringParameter;
  public constructor() {
    super({
      actionName: "dash",
      summary: "Start a dashboard server to interact with an Oakfile.",
      documentation: "TODO",
    });
  }
  protected onExecute(): Promise<void> {
    oak_dash({ filename: this._filename.value, port: this._port.value });
    return Promise.resolve();
  }

  protected onDefineParameters(): void {
    this._filename = this.defineStringParameter({
      argumentName: "FILENAME",
      parameterLongName: "--file",
      parameterShortName: "-f",
      description: "Path to Oakfile.",
      defaultValue: "./Oakfile",
    });
    this._port = this.defineStringParameter({
      argumentName: "PORT",
      parameterLongName: "--port",
      parameterShortName: "-p",
      description: "Port to start the server.",
      defaultValue: "8888",
    });
  }
}

class InitAction extends CommandLineAction {
  public constructor() {
    super({
      actionName: "init",
      summary: "Initialize an Oakfile in the current directory..",
      documentation: "TODO",
    });
  }
  protected async onExecute(): Promise<void> {
    await oak_init();
  }
  protected onDefineParameters(): void {}
}

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
    await oak_logs({
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
    await oak_path({
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

class PulseAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: "pulse",
      summary: "Take a pulse of an oak project.",
      documentation: "TODO",
    });
  }
  protected async onExecute(): Promise<void> {
    await oak_pulse({
      filename: this._filename.value,
    });
  }
  protected onDefineParameters(): void {
    this._filename = this.defineStringParameter({
      argumentName: "FILENAME",
      parameterLongName: "--file",
      parameterShortName: "-f",
      description: "Path to Oakfile.",
      defaultValue: "./Oakfile",
    });
  }
}

class RunAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;
  private _targets: CommandLineStringListParameter;
  private _schedule: CommandLineFlagParameter;

  public constructor() {
    super({
      actionName: "run",
      summary: "Run an Oakfile.",
      documentation: "TODO",
    });
  }
  protected async onExecute(): Promise<void> {
    await oak_run({
      filename: this._filename.value,
      targets: this._targets.values,
      schedule: this._schedule.value,
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
      argumentName: "TARGETS",
      parameterLongName: "--targets",
      parameterShortName: "-t",
      description: "List of target names to resolve.",
    });
    this._schedule = this.defineFlagParameter({
      parameterLongName: "--schedule",
      description: "Run Oakfile on defined schedules.",
    });
  }
}

class RunXAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;
  private _targets: CommandLineStringListParameter;
  private _schedule: CommandLineFlagParameter;

  public constructor() {
    super({
      actionName: "runx",
      summary: "Runx an Oakfile.",
      documentation: "TODO",
    });
  }
  protected async onExecute(): Promise<void> {
    await oak_runx({
      filename: this._filename.value,
      targets: this._targets.values,
      schedule: this._schedule.value,
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
      argumentName: "TARGETS",
      parameterLongName: "--targets",
      parameterShortName: "-t",
      description: "List of target names to resolve.",
    });
    this._schedule = this.defineFlagParameter({
      parameterLongName: "--schedule",
      description: "Run Oakfile on defined schedules.",
    });
  }
}

class OakVersionAction extends CommandLineAction {
  public constructor() {
    super({
      actionName: "version",
      summary: "Print version of oak.",
      documentation: "TODO",
    });
  }
  protected onDefineParameters(): void {}
  protected async onExecute(): Promise<void> {
    await oak_version();
    return;
  }
}
class OakCommandLine extends CommandLineParser {
  public constructor() {
    super({
      toolFilename: "oak",
      toolDescription: "CLI for oak.",
    });

    this.addAction(new CleanAction());
    this.addAction(new DashAction());
    this.addAction(new LogsAction());
    this.addAction(new PathAction());
    this.addAction(new PulseAction());
    this.addAction(new RunAction());
    this.addAction(new RunXAction());
    this.addAction(new InitAction());
    this.addAction(new OakVersionAction());
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
