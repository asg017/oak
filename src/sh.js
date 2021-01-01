import * as os from "os";
import * as std from "std";
const STATE = {
  INITIAL: 1,
  CMD_NAME: 2,

  ARGS: 3,
  ARG_PARSE_TOKEN: 4,
  ARG_PARSE_VALUE: 5,
  ARG_PARSE_STRING_SINGLE: 6,
  ARG_PARSE_STRING_DOUBLE: 7,
};

const char_is = {
  whitespace: (c) => /\s/.test(c),
  nonwhitespace: (c) => /\S/.test(c),
};

function parseShellTemplate(strings, values) {
  const pipes = [];

  let cmdFile;
  let args = [];

  let argString;
  let argToken;
  let argValue;

  let state = STATE.INITIAL;
  for (let i = 0; i < strings.length; i++) {
    const s = strings[i];
    const v = values[i];

    for (let si = 0; si < s.length; si++) {
      const char = s[si];
      switch (state) {
        case STATE.INITIAL:
          if (char_is.whitespace(char)) continue;
          else {
            state = STATE.CMD_NAME;
            cmdFile = char;
          }
          break;
        case STATE.CMD_NAME:
          if (char_is.nonwhitespace(char)) {
            cmdFile += char;
            continue;
          } else {
            state = STATE.ARGS;
          }
          break;
        case STATE.ARGS:
          if (char_is.whitespace(char)) continue;
          else if (char === "'") {
            state = STATE.ARG_PARSE_STRING_SINGLE;
            argString = "";
          } else if (char === '"') {
            state = STATE.ARG_PARSE_STRING_DOUBLE;
            argString = "";
          } else if (char === "|") {
            state = STATE.INITIAL;
            pipes.push({
              cmdFile,
              args,
            });
            cmdFile = null;
            args = [];
          } else {
            state = STATE.ARG_PARSE_TOKEN;
            argToken = char;
          }
          break;
        case STATE.ARG_PARSE_TOKEN:
          if (char_is.whitespace(char)) {
            args.push(argToken);
            state = STATE.ARGS;
          } else {
            argToken += char;
            continue;
          }
          break;
        case STATE.ARG_PARSE_VALUE:
          if (char_is.whitespace(char)) {
            state = STATE.ARGS;
            args.push(argValue);
          } else {
            argValue += char;
          }
          break;
        case STATE.ARG_PARSE_STRING_SINGLE:
          if (char === "'") {
            state = STATE.ARGS;
            args.push(argString);
          } else {
            argString += char;
          }
          break;
        case STATE.ARG_PARSE_STRING_DOUBLE:
          if (char === '"') {
            state = STATE.ARGS;
            args.push(argString);
          } else {
            argString += char;
          }
          break;
      }
    }

    // this is where the "[value]" would happen
    if (v) {
      switch (state) {
        case STATE.INITIAL:
          throw Error("CMD_NAME_ERROR");
        case STATE.CMD_NAME:
          throw Error("CMD_NAME_ERROR");
        case STATE.ARGS:
          state = STATE.ARG_PARSE_VALUE;
          argValue = v.toString();
          break;
        case STATE.ARG_PARSE_TOKEN:
          argToken += v.toString();
          break;
        case STATE.ARG_PARSE_VALUE:
          argValue += v.toString();
          break;
        case STATE.ARG_PARSE_STRING_SINGLE:
          throw Error(`SHL_EXPRESSION_ERROR`);
        case STATE.ARG_PARSE_STRING_DOUBLE:
          throw Error(`SHL_EXPRESSION_ERROR`);
          break;
      }
    }
  }
  // this is where "EOF" would happen
  switch (state) {
    case STATE.INITIAL:
      throw Error("CMD_NAME_ERROR");
    case STATE.CMD_NAME:
      // aint no problem
      break;
    case STATE.ARGS:
      // aint no problem
      break;
    case STATE.ARG_PARSE_TOKEN:
      // aint no problem
      args.push(argToken);
      break;
    case STATE.ARG_PARSE_VALUE:
      // aint no problem
      args.push(argValue);
      break;
    case STATE.ARG_PARSE_STRING_SINGLE:
    case STATE.ARG_PARSE_STRING_DOUBLE:
      throw Error("ARG_STRING_ERROR");
  }
  if (cmdFile) pipes.push({ cmdFile, args });
  return pipes;
}

export class ShellPipeline {
  constructor(pipes = []) {
    this.pipes = pipes;
    if (this.pipes.length < 1)
      throw Error("New ShellPipelines must have at least one pipe.");
    this.head = this.pipes[0];
    this.tail = this.pipes[this.pipes.length - 1];
  }

  cap() {
    os.exec(["tee"], {
      block: false,
      stdin: this.tail.r,
      stdout: std.out.fileno(),
    });
  }

  end() {
    this.pipes.forEach((pipe) => {
      const [ret, status] = os.waitpid(pipe.pid, 0);
      os.close(pipe.w);
      if (ret !== pipe.pid)
        throw Error(`ret not pid ret=${ret} pipe.pid=${pipe.pid}`);
      if ((status & 0x7f) !== 0)
        throw Error(`(status & 0x7f) !== 0 ${status & 0x7f}`);
      if (status >> 8 !== 0) throw Error(`status >> 8 !== 0) #{status >> 8}`);
    });
  }

  pipe(shellPipe) {
    const newPipes = this.pipes.slice();
    newPipes.push(shellPipe);
    const newPipeline = new ShellPipeline(newPipes);
    return newPipeline;
  }
}

class ShellPipe {
  constructor(cmdFile, cmdArgs, r) {
    this.cmdFile = cmdFile;
    this.cmdArgs = cmdArgs;

    this.unixPipe = os.pipe();

    this.r = this.unixPipe[0];
    this.w = this.unixPipe[1];

    this.pid = os.exec([cmdFile, ...cmdArgs], {
      block: false,
      stdin: r,
      stdout: this.w,
    });
    print(`ShellPipe exec ${this.pid} ${cmdFile} ${cmdArgs.join(" ")}`);
  }
}

export function shell(strings, ...values) {
  const pipes = parseShellTemplate(strings, values);
  const top = pipes.shift();
  const firstPipe = new ShellPipe(top.cmdFile, top.args, std.in.fileno());
  let pipeline = new ShellPipeline([firstPipe]);
  for (const pipe of pipes) {
    const p = new ShellPipe(pipe.cmdFile, pipe.args, pipeline.tail.r);
    pipeline = pipeline.pipe(p);
  }
  pipeline.cap();
  return pipeline;
}
