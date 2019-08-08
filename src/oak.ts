#!/usr/bin/env node

import { oak_static } from "./oak-static";
import { oak_print } from "./oak-print";
import oak_dash from "./oak-dash";

import {
  CommandLineStringParameter,
  CommandLineStringListParameter,
  CommandLineAction,
  CommandLineParser
} from "@microsoft/ts-command-line";

class DashAction extends CommandLineAction {
  private _port: CommandLineStringParameter;
  private _filename: CommandLineStringParameter;
  public constructor() {
    super({
      actionName: "dash",
      summary: "Start a dashboard server to interact with an Oakfile.",
      documentation: "TODO"
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
      defaultValue: "./Oakfile"
    });
    this._port = this.defineStringParameter({
      argumentName: "PORT",
      parameterLongName: "--port",
      parameterShortName: "-p",
      description: "Port to start the server.",
      defaultValue: "8888"
    });
  }
}

class PrintAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;
  public constructor() {
    super({
      actionName: "print",
      summary: "Print information about an Oakfile.",
      documentation: "TODO"
    });
  }
  protected async onExecute(): Promise<void> {
    await oak_print({ filename: this._filename.value });
    return Promise.resolve();
  }

  protected onDefineParameters(): void {
    this._filename = this.defineStringParameter({
      argumentName: "FILENAME",
      parameterLongName: "--file",
      parameterShortName: "-f",
      description: "Path to Oakfile.",
      defaultValue: "./Oakfile"
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
      documentation: "TODO"
    });
  }
  protected async onExecute(): Promise<void> {
    await oak_static({
      filename: this._filename.value,
      targets: this._targets.values
    });
    return;
  }

  protected onDefineParameters(): void {
    this._filename = this.defineStringParameter({
      argumentName: "FILENAME",
      parameterLongName: "--file",
      parameterShortName: "-f",
      description: "Path to Oakfile.",
      defaultValue: "./Oakfile"
    });
    this._targets = this.defineStringListParameter({
      argumentName: "TARGETS",
      parameterLongName: "--targets",
      parameterShortName: "-t",
      description: "List of target names to resolve."
    });
  }
}

class OakCommandLine extends CommandLineParser {
  public constructor() {
    super({
      toolFilename: "oak",
      toolDescription: "CLI for oak."
    });

    this.addAction(new DashAction());
    this.addAction(new PrintAction());
    this.addAction(new StaticAction());
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
