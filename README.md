# oak - a new take

oak got very complex, very fast. Most of it was my fault, adding new features when the core idea wasn't fully baked yet, or doing weird workarounds to make it work a certain way.

This is a new start to the same core idea, but with key differences.

1. Instead of node, using quickjs.
2. Focus on a very tight core program that other programs can hook into later on.

lets hope it works!

## Checklist

- [ ] Task targets are "fresh" based on:
  - [ ] mtime
  - [ ] special hash
  - [ ] content hash?
- [ ] Task targets can be:
  - [ ] Files
  - [ ] directories
- [ ] Task deps
  - [ ] Explicit `deps` array
  - [ ] Inferred from `run` return value
  - [ ] Built into the compiler, original `oak` style.
- [ ] Tasks are marked not-fresh when:
  - [ ] file not exist
  - [ ] dep
  - [ ] Oakfile defintion changes
  - [ ] on a cell changes not on entire Oakfile change
- [ ] Imports
  - [ ] Import from a "library" Oakfile.
  - [ ] Importing a task works.
  - [ ] Importing and injecting a task works.

## `sh` checklist

```js
// sh can redirect stdout/stderr
sh`echo "alex" > name.txt`;
sh`echo "alex" 2> name.txt`;

// sh can get final stdout
sh`echo "heya"`.stdout();

// ${value} can be qjs file object
const fd = std.tmpfile();
sh`echo "hi" > ${fd}`;

// ${value} can act as process substition
sh`cat ${sh`echo hello`} ${sh`echo "from the other side"`}`;
```

## Task freshness algo

1. If target doesnt exist, run.
2. If task deps are different than before, run.
3. If any of the task deps have changed since before, run.
4. If the task's run returns a different shell script, run.
5. If any of the arguments in the tasks's run returned shell script is different, run. (???)

- Wouldnt the task deps array catch this? (in v0)
- for env var, I guess...

## db

- Task Executions
  - `cellName TEXT`
    - Not sure if this will be possible without a custom compiler...
  - `targetPath TEXT`
  - ``

```
{
  tasks: {
    "state.json": {
      "depsSignature": "",
      "postRunSignature": "aa09ec8dfe7a098ef7d0a9c7e"
    }
  }
}
```

##

## Far out ideas

- Non-file task targets
  - S3 objects, remote databases, other filesystems
