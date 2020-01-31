#!/usr/bin/env node

import { oak_run } from "./commands/run";
import { oak_status } from "./commands/status";
import { oak_pulse } from "./commands/pulse";
import { oak_print } from "./commands/print";
import { oak_init } from "./commands/init";
import oak_dash from "./commands/dash";
import oak_version from "./commands/version";
import oak_clean from "./commands/clean";

import {
  CommandLineChoiceParameter,
  CommandLineStringParameter,
  CommandLineStringListParameter,
  CommandLineAction,
  CommandLineParser,
  CommandLineFlagParameter,
} from "@microsoft/ts-command-line";

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

class PrintAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;
  private _output: CommandLineChoiceParameter;
  public constructor() {
    super({
      actionName: "print",
      summary: "Print information about an Oakfile.",
      documentation: "TODO",
    });
  }
  protected async onExecute(): Promise<void> {
    await oak_print({
      filename: this._filename.value,
      output: this._output.value,
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
    this._output = this.defineChoiceParameter({
      parameterLongName: "--output",
      parameterShortName: "-o",
      description: "How to output the Oakfile printing.",
      defaultValue: "stdout",
      alternatives: ["stdout", "dot", "png"],
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

class StatusAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: "status",
      summary: "Check the status of an Oakfile.",
      documentation: "TODO",
    });
  }
  protected async onExecute(): Promise<void> {
    await oak_status({
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
    this.addAction(new PrintAction());
    this.addAction(new PulseAction());
    this.addAction(new StatusAction());
    this.addAction(new RunAction());
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
