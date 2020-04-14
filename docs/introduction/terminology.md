# Oak Concepts


## TODO This isnt an intro. is an in-depth look, too detailed 

Oak's runtime is very unique, and not very intuitive. It's it based on the Observable notebook runtime, which is a reactive programming extension of normal Javascript. You don't need to know Javascript to write and understand Oak, but a solid understanding of the runtime will help greatly!

## `Oakfile`

Every Oak project relies on one file, called `Oakfile`. It contains all the code needed to define the entire project's workflow. 

### Syntax for Oakfiles

Oak uses the Observable notebook parser to parse Oakfiles. This parser is based off of JavaScript, so a majority of Oak syntax in JavaScript. However, there are some key differences that you'll need to know in order to 

### Cells

The Observable notebook parser parses cells, not scripts. You can think of cells as named, small scripts that are independent of each other. For example:

```Javascript 

// This cell is named "alex" and has a value of 4
alex = 4

// this cell is named "brianna" and is defined as a function
brianna = function(str) {
    return str.substring(0, 3)
}

// this is an unnamed cell

```

### JavaScript that doesn't work

Since Oak is parsing for cells, if it comes across something that *isn't* a cell, it will throw a syntax error. For example:

```javascript
const state = "CA"; 
```

This will throw a syntax error! "const" conflicts

Here's what you should do instead: Declare a cell called "state", no need for "const". 

```javascript
state = "CA";
```


To learn more about the difference of scripts/cells, check out [](). However, you won't need to know this in order to use Oak!


### Oak Directory Structure

The `Oakfile` can exist in any directory, and the code that powers the workflow can exist anywhere. For example, here is the directory structure of the most minimal `Oakfile` possible:


```
.
`-- Oakfile
```

That's it! That's all Oak needs, just the `Oakfile`. Of course, when your project gets bigger and bigger, you can add your own code alongside the Oakfile or in it's own directory, like so:

```
.
|-- analyze.R
|-- create_vizualizations.py
|-- download_archive.sh
|-- Oakfile
`-- process_archive
    |-- __init__.py
    `-- process.py
```

Once your projects get even bigger, you can split large `Oakfile`s into separate directories. The same rules apply, and you can import other `Oakfile`s from any other `Oakfile` (learn more [here TODO]()).

One thing to note: when you start to use Oak, Oak will create two directories, `.oak` and `oak_data`, that you should not touch manually. `.oak` is used for metadata storage about your interactions with Oak (which never leaves your computer), and `oak_data` contains the output of your Oak Tasks. It is recommended that you do not version control these. This can be in done in Git with these `.gitignore` snippet:

```
.oak
oak_data/
```


## Workflows and Tasks

A "workflow", in this context, is a series of "tasks" that processes data files. "Tasks", in Oak, are literal objects that you define in Oakfiles. For example:

```javascript
a = new Task({
    target: "a.txt",
    run: a => shell`echo "Hello, world!" > ${a}`
})
```

This is a cell, named `a`, that is defined as a `Task`. A Task, in Oak, is a builtin cell in Oak that helps define the specific steps in a workflow. In this case, it has properties "target", which is a string, and "run", which is a function. 

A Task's target is the output file that the Task creates. In this case, we want Task `a` to eventually create a file called `"a.txt"`. The Oak runtime will determine where this file will be located, so no need to worry about that.

Now, the `run` property is where the actual task execution takes place. It is defined as a function, where the first and only parameter is the absolute path of the target the Task needs to build. It should return a "`TaskExecution`" object, which is done by either using the `shell` or `command` builtin variables. 

`shell` is a builtin variable that executes a shell command on your computer. It's a tagged template, so it can be invoked like so:

```javascript
shell`echo "this will run the 'echo' command on your computer!"`
```

So let's take a look at what `a` defines for `run`:

```javascript
a => shell`echo "Hello, world!" > ${a}`
```

This is an [arrow function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions). The first parameter, named `a`, is the absolute path of the Task's target. In this case, it could look something like `"/home/user/project/oak_data/a.txt"`. When the task is ran, your computer will run the shell command:

```bash
echo "Hello, world!" > "/home/user/project/oak_data/a.txt"
```

**You should NEVER call `.run()` directly.** The Oak runtime will do it for you.

Now, `a`'s target, `"/home/user/project/oak_data/a.txt"`, is the "output" of this task. If another task wanted to use this as an input, we could do something like:

```javascript
b = new Task({
    target: "b.txt",
    run: b => shell`cat ${a} | tr a-z A-Z > ${b}`
})
```

This is a new cell called `b` that is Task. Its target is different, it is now `"b.txt"`. When the task is ran, it runs another shell command, that pipes the contents of `a`'s target file into `tr`, which will, in this case, convert it to uppercase and redirect that `b`'s absolute target path. The actual shell command will look like this:

```bash
cat "/home/user/project/oak_data/a.txt" | tr a-z A-Z > "/home/user/project/oak_data/b.txt"

```




---

Here's another way to think about it. The folks over at Dagster coined the term "data applications", to which [they defined](https://medium.com/dagster-io/introducing-dagster-dbd28442b2b7) as:

> ... a graph of functional computations that produce and consume data assets.

Let's break this down.

> ... a graph ...

This in the DAG!

> ... of functional computations ...

These are the "Tasks", that run kickof Python/R/shell scripts

> ... that produce and consume data assets.

