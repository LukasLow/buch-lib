# Debugging and profiling

This page covers the documented debugger workflow and the documented profiling
story. The debugger is LLDB-based; the profiling story is deliberately reported
only as far as the official docs support it. Where the docs are silent, this
page marks an open question rather than inventing a profiler.

Sources: [Debugging](https://mojolang.org/docs/tools/debugging/),
[`mojo debug`](https://mojolang.org/docs/cli/debug/),
[`std.benchmark`](https://mojolang.org/docs/std/benchmark/), and the
[Debug Console](https://mojolang.org/docs/tools/debugging/) section of the
debugging page.

## Two debugger front ends, one backend

| Front end | How you start it | Best for |
|-----------|------------------|----------|
| **Command line (LLDB)** | `mojo debug file.mojo` (no `--vscode`) | terminal workflows, GPU via cuda-gdb |
| **VS Code** | the Run or Debug button, F5, or `mojo debug --vscode file.mojo` | visual breakpoints, variables, call stack |

Both are described in the debugging guide
(<https://mojolang.org/docs/tools/debugging/>). The command page documents the
four session modes in full; see [`mojo debug`](../cli/debug.md) for every option.

The `mojo` package includes the debugger:

> The `mojo` package includes the [LLDB debugger](https://lldb.llvm.org/) and a
> Mojo LLDB plugin. Together these provide the low-level debugging interface for
> the Mojo extension.

Source: <https://mojolang.org/docs/tools/debugging/>.

## Command-line workflow

### Build and debug a source file

```bash
mojo debug myproject.mojo
```

> By default, this mode uses `-O0` and `--debug-level=full` as compilation
> options.

Source: <https://mojolang.org/docs/cli/debug/>.

### Build a binary for debugging, then debug it

```sh
mojo build -O0 -g myproject.mojo -o myproject
mojo debug myproject
```

> For best results, build with the `-O0 -g` command-line options when you build
> a binary that you intend to debug—this produces a binary with full debug info.
> (When you call `mojo debug` on a Mojo source file, it includes debug
> information by default.)

Source: <https://mojolang.org/docs/tools/debugging/>.

For what those flags change, see [compiler and flags](compiler-and-flags.md).

### Launch on VS Code

```bash
mojo debug --vscode myproject.mojo
mojo debug --vscode myproject
```

Sources: <https://mojolang.org/docs/tools/debugging/>,
<https://mojolang.org/docs/cli/debug/>.

### Attach to a running process

```bash
mojo debug --vscode --pid <PROCESS_ID>
mojo debug --vscode --process-name <PROCESS_NAME>
```

Source: <https://mojolang.org/docs/tools/debugging/>.

### Turn a debug path on with `-D` and `comptime if`

A documented idiom for including extra debug code only when asked:

```mojo
from std.sys import is_defined

def some_function_with_issues():
    # ...
    comptime if is_defined["DEBUG_ME"]():
        breakpoint()
```

```bash
mojo debug -D DEBUG_ME main.mojo
```

> The `is_defined()` function returns a compile-time true or false value based on
> whether the specified name is defined. Since the `breakpoint()` call is inside
> a `comptime if` statement, it is only included in the compiled code when the
> `DEBUG_ME` name is defined on the command line.

Source: <https://mojolang.org/docs/tools/debugging/>.

### Programmatic breakpoints

```mojo
if some_value.is_valid():
   do_the_right_thing()
else:
   # We should never get here!
   breakpoint()
```

> If you have VS Code open and run this code in debug mode (either using VS Code
> or `mojo debug`), hitting the `breakpoint()` call causes an error, which
> triggers the debugger.

Source: <https://mojolang.org/docs/tools/debugging/>.

**Assertions open the debugger too.** The same page notes: "The `testing` module
includes a number of ways to specify assertions. Assertions also trigger an
error, so can open the debugger in the same way that a `breakpoint()` call
will." So a failing test can be the entry point into a debug session. See
[testing](testing.md).

## Debugging GPU code

The backend choice determines what you can debug:

| Backend | Flag | CPU Mojo | GPU Mojo |
|---------|------|----------|----------|
| LLDB | default | "great support" | "no support at all" |
| cuda-gdb | `--cuda-gdb` | "minimal support" | supported |

Sources: <https://mojolang.org/docs/cli/debug/>,
<https://mojolang.org/docs/tools/debugging/>.

The debugging guide adds the constraints:

> The `mojo` package also includes support for debugging Mojo programs running on
> GPU. This requires some extra software and configuration. Currently GPU
> debugging only works with NVIDIA GPUs.

Source: <https://mojolang.org/docs/tools/debugging/>.

GPU launch configurations support `breakOnLaunch`, `initCommands` and
`legacyDebugger` attributes, and use `"type": "mojo-cuda-gdb"` instead of
`mojo-lldb` (<https://mojolang.org/docs/tools/debugging/>).

## The VS Code debug session

### Launch configurations

Templates the Mojo debugger provides:

- **Debug current Mojo file** — launches and debugs the file in the active
  editor tab.
- **Debug Mojo file** — identifies a specific file regardless of the active tab.
- **Debug binary** — operates on a prebuilt binary (any LLDB-supported mixture
  of Mojo, C, C++); set the `program` field.
- **Attach to process** — attaches to a running process chosen from a list.

All configurations require `name`, `request` (`launch` or `attach`) and `type`
(`mojo-lldb`, or `mojo-cuda-gdb` on GPU). Optional attributes include `args`,
`cwd`, `description`, `env`, `mojoFile`, `pid`, `program`, and
`runInTerminal`. GPU configurations add `breakOnLaunch`, `initCommands` and
`legacyDebugger`. Source: <https://mojolang.org/docs/tools/debugging/>.

Important restriction:

> Mojo launch configurations don't allow you to specify compilation options. If
> you need to specify compilation options, you can build the binary using `mojo
> build`, then use a launch configuration with the `program` option to launch the
> compiled binary.

Source: <https://mojolang.org/docs/tools/debugging/>.

### Stepping

The debug toolbar documents Continue/Pause, Step Over, Step Into, Step Out,
Restart, Stop. Source: <https://mojolang.org/docs/tools/debugging/>.

### Breakpoints

Supported: standard, logpoints, function, data, triggered, and **error
breakpoints** ("break on raise"). Not supported: conditional breakpoints based
on an expression — "it does support hit counts, which VS Code classifies as a
kind of conditional breakpoint". Source:
<https://mojolang.org/docs/tools/debugging/>.

### The Debug Console

> The **Debug Console** gives you a command-line interface to the debugger. The
> **Debug Console** processes LLDB commands and Mojo expressions.
>
> Anything prefixed with a colon (`:`) is treated as an LLDB command. Any other
> input is treated as an expression.
>
> Currently Mojo expressions are limited to inspecting variables and their
> fields. The console also supports subscript notation (`vector[index]`) for
> certain data structures in the standard library, including `List` and `SIMD`.

Source: <https://mojolang.org/docs/tools/debugging/>.

The console "only accepts input when the program is paused."

### Documented limitations

> - No support for breaking automatically on Mojo errors.
> - When stepping out of a function, the returned value is not displayed.
> - LLDB doesn't support stopping or resuming individual threads.

Source: <https://mojolang.org/docs/tools/debugging/>.

## Profiling: the documented story

The debugging guide's "Tips and tricks" section names several standard-library
features "that aren't directly related to the debugger, but which can help you
debug your programs":

> - Programmatic breakpoints.
> - Setting parameters from the Mojo command line.

Source: <https://mojolang.org/docs/tools/debugging/>.

That is the full list. There is **no documented standalone profiler command, no
`mojo profile`, and no profiling section** on the 1.x tools pages. Be precise
about what does exist:

### 1. Benchmarking with `std.benchmark`

The documented performance-measurement facility in the standard library is the
`benchmark` package:

> The `benchmark` package provides tools for measuring and analyzing the
> performance of Mojo code. It enables statistical benchmarking with automatic
> warmup, batch execution, and comprehensive reporting including mean, min, max,
> and total time statistics across multiple runs.

```mojo
from std.benchmark import run
from std.time import sleep

def sleeper():
    sleep(.01)

var report = run(sleeper)
print(report.mean())
```

```output
0.012256487394957985
```

`run()` returns a `Report`; `report.print()` prints a summary and
`report.print_full()` prints every batch. `run()` takes four arguments: warmup
iterations, max iterations, min total time and max total time, and "the min
total time will take precedence over max iterations". `Unit.ms` /
`report.mean("ms")` select a time unit. Source:
<https://mojolang.org/docs/std/benchmark/>.

This is **timing/benchmarking**, not sampling profiling. It tells you how long a
function takes; it does not attribute time to source lines.

### 2. Timing with `std.time`

The `std.time` package provides "monotonic clocks, performance counters, sleep,
`time_function`" (<https://mojolang.org/docs/std/>). `std.benchmark` builds on
`std.time`. For ad-hoc measurement, `std.time` is the documented primitive.

### 3. The `compile` package

The `compile` package provides "[r]untime function compilation and introspection:
assembly, IR, linkage, metadata" (<https://mojolang.org/docs/std/>). That is
introspection, not profiling, but it is where you inspect emitted code.

### 4. Sanitizers

`--sanitize=address` and `--sanitize=thread` turn on runtime checks for memory
and threading issues. These detect bugs, not hotspots. Source:
<https://mojolang.org/docs/tools/feature-toggles/>.

### 5. System introspection

`std.sys.info` exposes `num_logical_cores()`, `num_performance_cores()` and
`num_physical_cores()` ("the number of physical performance cores across all CPU
sockets. If not known, returns the total number of physical cores") — useful when
interpreting parallel timings. Source:
<https://mojolang.org/docs/std/sys/info/>.

### What is NOT documented

> **Open question — there is no documented profiler.** The official 1.x Mojo
> docs contain no profiling command, no `mojo profile`, no documented sampling
> profiler, and no flame-graph tooling. The debugging page covers the debugger
> and names only programmatic breakpoints and `-D` parameters as extra debug
> aids; the `benchmark` package is the documented performance-measurement tool.
> Do not present any third-party profiler or vendor tool as "the Mojo profiler".
> If you need attribution-level profiling, treat it as out of scope of the
> official documentation and verify with the tool's own docs. Sources:
> <https://mojolang.org/docs/tools/debugging/>,
> <https://mojolang.org/docs/std/benchmark/>,
> <https://mojolang.org/llms.txt>.

> **Open question — no documented `perf`/`instruments` integration.** Whether a
> Mojo-built binary (which has debug info with `-g` and is a native executable)
> can be profiled by platform tools such as Linux `perf` or macOS Instruments is
> not stated anywhere in the official Mojo 1.x docs. The debugging page says the
> debugger can debug native programs written in other languages; it says nothing
> about external profilers. Do not assert compatibility; test it yourself.

> **Open question — `Debug Console` as an inspection tool, not a profiler.** The
> console can inspect variables and their fields and index into `List`/`SIMD`,
> but there is no documented timing or sampling feature in it. Source:
> <https://mojolang.org/docs/tools/debugging/>.

## Troubleshooting

The debugging guide documents two VS Code RPC errors:

- `error: can't connect to the RPC debug server socket: Connection refused` —
  make sure VS Code is open; restart it; close other windows.
- `error: couldn't get a valid response from the RPC server` — VS Code must be
  open to a valid Mojo codebase; close extra windows; restart VS Code; reinstall
  the SDK; as a last resort restart the computer.

Source: <https://mojolang.org/docs/tools/debugging/>.

And a Python-environment note:

> The Mojo extension relies on the Python extension for locating your Python
> environment. In some cases, this appears to default to your globally-installed
> environment, even when a virtual environment exists. If the Mojo extension
> cannot find your SDK installation, try invoking the "Python: Set Project
> Environment" command and selecting your virtual environment.

Source: <https://mojolang.org/docs/tools/debugging/>.

## Installing the debugger

- The `mojo` package includes the debugger and LLDB; `mojo-compiler` does not
  (<https://mojolang.org/docs/faq/>).
- The extension is on the
  [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=modular-mojotools.vscode-mojo)
  and the
  [Open VSX Registry](https://open-vsx.org/extension/modular-mojotools/vscode-mojo)
  (<https://mojolang.org/docs/tools/debugging/>).
- GPU debugging needs extra software and, currently, an NVIDIA GPU
  (<https://mojolang.org/docs/tools/debugging/>).

## Pitfalls

- **Debugging an optimized binary.** Build with `-O0 -g`; otherwise debug info is
  missing. Source: <https://mojolang.org/docs/tools/debugging/>.
- **Expecting compilation options in a VS Code launch configuration.** They are
  not supported; build first, then debug the `program`. Source:
  <https://mojolang.org/docs/tools/debugging/>.
- **Expression-based conditional breakpoints.** Unsupported for Mojo; use hit
  counts. Source: <https://mojolang.org/docs/tools/debugging/>.
- **Expecting LLDB to debug GPU code.** It has "no support at all for Mojo GPU
  code"; use cuda-gdb, which in turn degrades CPU debugging. Source:
  <https://mojolang.org/docs/cli/debug/>.
- **Looking for a profiler in the CLI.** There is none documented; measure with
  `std.benchmark`/`std.time` and inspect code with `std.compile`. Sources:
  <https://mojolang.org/docs/std/benchmark/>,
  <https://mojolang.org/docs/std/>.
- **Forgetting `--vscode` ordering.** `--vscode` and other session options come
  before the file; runtime args come after it. Source:
  <https://mojolang.org/docs/cli/debug/>.
- **Reading `debug_assert()` as affected by `-g`.** It is controlled by
  `-D ASSERT` only. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **`--X` in RPC mode.** It is ignored when the session runs on VS Code. Source:
  <https://mojolang.org/docs/cli/debug/>.

## See also

- [`mojo debug`](../cli/debug.md) — every session mode and option.
- [`mojo build`](../cli/build.md) — building a debug binary.
- [Compiler and flags](compiler-and-flags.md) — `-O0`, `-g`, `-D ASSERT`,
  sanitizers.
- [Testing](testing.md) — assertions as debugger entry points, and benchmarking
  tools.
- [Editor and LSP](editor-and-lsp.md) — installing the VS Code extension.
- [Formatter and linter](formatter-and-linter.md) — the quality loop.

## Sources

- Debugging: <https://mojolang.org/docs/tools/debugging/>
- `mojo debug`: <https://mojolang.org/docs/cli/debug/>
- `mojo build`: <https://mojolang.org/docs/cli/build/>
- `std.benchmark`: <https://mojolang.org/docs/std/benchmark/>
- `std.time` (listed): <https://mojolang.org/docs/std/>
- `std.compile` (listed): <https://mojolang.org/docs/std/>
- `std.sys.info`: <https://mojolang.org/docs/std/sys/info/>
- Compilation feature toggles (sanitizers, ASSERT):
  <https://mojolang.org/docs/tools/feature-toggles/>
- Testing (assertions trigger the debugger):
  <https://mojolang.org/docs/tools/testing/>
- Mojo FAQ (debugger in the `mojo` package):
  <https://mojolang.org/docs/faq/>
- Official docs map: <https://mojolang.org/llms.txt>
