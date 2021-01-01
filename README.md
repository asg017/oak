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

// sh can get finala stdout
sh`echo "heya"`.stdout();

// ${value} can be qjs file object
const fd = std.tmpfile();
sh`echo "hi" > ${fd}`;

// ${value} can act as process substition
sh`cat ${sh`echo hello`} ${sh`echo "from the other side"`}`;
```
