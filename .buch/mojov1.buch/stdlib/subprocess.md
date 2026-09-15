# subprocess

`subprocess` runs an external command and returns its output.

> Execute external processes and commands.

> The `subprocess` package provides utilities for spawning and interacting with
> external processes. It enables running shell commands, capturing their output,
> and integrating external tools into Mojo programs. This package handles process
> execution, output capture, and resource cleanup automatically.

> Use this package when you need to execute shell commands, integrate with
> external tools, or automate system tasks from within Mojo code.

Source: <https://mojolang.org/docs/std/subprocess/>.

It has one module, `subprocess`:

> Provides utilities for executing shell commands and capturing output.
>
> This module offers functions for running shell commands in subprocesses and
> retrieving their output, similar to Python's `subprocess` module. It handles
> process creation, output capture, and resource cleanup automatically.

Source: <https://mojolang.org/docs/std/subprocess/subprocess/>.

## The entire API: `run()`

```text
def run(cmd: String) -> String
```

> Runs the specified command and returns the output as a string.
>
> This function executes the given command in a subprocess, captures its standard
> output, and returns it as a string. It automatically handles opening and closing
> the subprocess.

> **Args:** `cmd` (`String`) — The command to execute as a string.
>
> **Returns:** `String` — The standard output of the command as a string, with
> trailing whitespace removed.
>
> **Raises:** This function raises if:
>
> - The command cannot be executed.
> - There is an IO error reading from the subprocess.
> - The data written by the subprocess is not valid UTF-8.

Source: <https://mojolang.org/docs/std/subprocess/subprocess/run/>.

That is the whole documented surface. This is a deliberately small package: one
function, one string in, one string out.

### A runnable example

```mojo
from std.subprocess import run

def main() raises:
    var listing = run("ls -la")
    print(listing)

    var version = run("uname -a")
    print(version)
```

Source: <https://mojolang.org/docs/std/subprocess/subprocess/run/>.

Because the command is a **shell command string**, quoting and injection are the
caller's responsibility: `run` does not offer an argument list, so a value
interpolated into the string can change the command that runs. See the security
note below.

## For the richer process API, use `os.process`

`subprocess` is the simple "run a command, get its stdout" entry point. When you
need a long-lived child, a pipe to interact with, or a termination status, the
[`os`](os.md) package's `process` module is the documented lower-level API:

| Type | Purpose |
|------|---------|
| `Process` | "Create and manage child processes from file executables." |
| `ProcessStatus` | "Represents the termination status of a process." |
| `Pipe` | "Create a pipe for interprocess communication." |

Source: <https://mojolang.org/docs/std/os/process/>.

So the split is:

- **One-shot command, output as a string** → `subprocess.run()`.
- **Interactive or long-lived child, pipes, exit status** → `os.process`.

## Idioms

- **Use `run()` for one-shot commands.** It handles process creation, capture
  and cleanup.
- **Remember trailing whitespace is stripped.** `run("echo hi")` returns `"hi"`,
  not `"hi\n"`; `run("printf 'a\n\n'")` returns `"a"`.
- **Call it from a `raises` function.** Three documented failure modes raise.
- **Treat the output as UTF-8 text.** Binary output is out of scope: invalid
  UTF-8 raises rather than being returned.
- **Parse the output deliberately.** The return is a single `String`; split it
  yourself with the `String` API when you need fields.
- **Reach for `os.process` when a string is not enough.**
- **Never build a command from untrusted input.** Prefer fixed command strings
  and validate any interpolated value.

## Pitfalls

- **Shell injection.** `run` takes a command string that a shell-like executor
  interprets; concatenating untrusted data into it lets the data become code.
  There is no argument-list overload documented.
- **Assuming a clean exit is checked.** The function returns stdout as a string;
  it does not return an exit code. To observe termination status, use
  `os.process.ProcessStatus` (see [`os`](os.md)).
- **Expecting stderr.** Only standard output is captured and returned;
  diagnostics on stderr are not part of the result.
- **Assuming the output ends in a newline.** Trailing whitespace is removed.
- **Ignoring the environment.** The child inherits the parent's environment, so
  `PATH` and similar variables affect which binary runs.
- **Treating binary data as text.** Non-UTF-8 output raises.
- **Depending on the working directory.** The child starts in the process's
  current directory; pass an absolute path or change directory with
  `os.chdir` ([`os`](os.md)) first.
- **Assuming a stable API.** See below.

> **Open question:** the official documentation documents exactly one function,
> `run(cmd: String) -> String`. It does not document a way to pass arguments as a
> list, to capture stderr, to set the child's environment or working directory, or
> to read the exit code. Whether those facilities exist on `run` as undocumented
> overloads, or only through `std.os.process`, is not stated. Verify against the
> installed toolchain before relying on them. Sources:
> <https://mojolang.org/docs/std/subprocess/subprocess/>,
> <https://mojolang.org/docs/std/os/process/>.

## Stability

The `subprocess` package page, the module page and the `run` page show **no
`@stable(since=...)` marker** and no stability badges. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/subprocess/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `subprocess` package: <https://mojolang.org/docs/std/subprocess/>
- Mojo `subprocess` module: <https://mojolang.org/docs/std/subprocess/subprocess/>
- Mojo `run` function: <https://mojolang.org/docs/std/subprocess/subprocess/run/>
- Mojo `os.process` module: <https://mojolang.org/docs/std/os/process/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
