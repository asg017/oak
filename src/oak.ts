import { oak_static } from "./oak-static";
import { oak_static2 } from "./oak-static2";
import { oak_print } from "./oak-print";

import {
  CommandLineStringParameter,
  CommandLineStringListParameter,
  CommandLineAction,
  CommandLineParser
} from "@microsoft/ts-command-line";

class PrintAction extends CommandLineAction {
  private _filename: CommandLineStringParameter;
  public constructor() {
    super({
      actionName: "print",
      summary: "Print information about an Oakfile.",
      documentation: "TODO"
    });
  }
  protected onExecute(): Promise<void> {
    oak_print({ filename: this._filename.value });
    return Promise.resolve();
  }

  protected onDefineParameters(): void {
    this._filename = this.defineStringParameter({
      argumentName: "FILENAME",
      parameterLongName: "--file",
      parameterShortName: "-f",
      description: "Path to Oakfile."
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
  protected onExecute(): Promise<void> {
    oak_static({
      filename: this._filename.value,
      targets: this._targets.values
    });
    return Promise.resolve();
  }

  protected onDefineParameters(): void {
    this._filename = this.defineStringParameter({
      argumentName: "FILENAME",
      parameterLongName: "--file",
      parameterShortName: "-f",
      description: "Path to Oakfile."
    });
    this._targets = this.defineStringListParameter({
      argumentName: "TARGETS",
      parameterLongName: "--targets",
      parameterShortName: "-t",
      description: "List of target names to resolve."
    });
  }
}

class StaticAction2 extends CommandLineAction {
  private _filename: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: "staticc",
      summary: "Statically run an Oakfile 2.",
      documentation: "TODO"
    });
  }
  protected onExecute(): Promise<void> {
    oak_static2({
      filename: this._filename.value
    });
    return Promise.resolve();
  }

  protected onDefineParameters(): void {
    this._filename = this.defineStringParameter({
      argumentName: "FILENAME",
      parameterLongName: "--file",
      parameterShortName: "-f",
      description: "Path to Oakfile."
    });
  }
}

class OakCommandLine extends CommandLineParser {
  public constructor() {
    super({
      toolFilename: "oak",
      toolDescription: "CLI for oak."
    });

    this.addAction(new PrintAction());
    this.addAction(new StaticAction());
    this.addAction(new StaticAction2());
  }

  protected onDefineParameters(): void {}

  protected onExecute(): Promise<void> {
    console.log("OakCommandLine executing...");
    return super.onExecute();
  }
}

const cli: OakCommandLine = new OakCommandLine();
cli.execute();
