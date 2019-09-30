#!/usr/bin/env node

import { oak_static } from "./oak-static";
import { oak_print } from "./oak-print";
import { oak_init } from "./oak-init";
import oak_dash from "./oak-dash";
import oak_version from "./oak-version";

import {
  CommandLineChoiceParameter,
  CommandLineStringParameter,
  CommandLineStringListParameter,
  CommandLineAction,
  CommandLineParser,
  CommandLineFlagParameter,
} from "@microsoft/ts-command-line";
import oak_clean from "./oak-clean";

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

class StaticAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;
  private _targets: CommandLineStringListParameter;

  public constructor() {
    super({
      actionName: "static",
      summary: "Statically run an Oakfile.",
      documentation: "TODO",
    });
  }
  protected async onExecute(): Promise<void> {
    await oak_static({
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
    this.addAction(new StaticAction());
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
