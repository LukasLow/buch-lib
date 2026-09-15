# `mojo debug`

Launches the Mojo debugger using the command-line interface or an external
editor.

## Synopsis

```
mojo debug [debug-options]
```

## Purpose

> This command, which underneath uses the LLDB debugger, or cuda-gdb, offers four
> basic debug session modes.

Source: <https://mojolang.org/docs/cli/debug/>.

The `mojo` package includes LLDB and a Mojo LLDB plugin:

> The `mojo` package includes the [LLDB debugger](https://lldb.llvm.org/) and a
> Mojo LLDB plugin. Together these provide the low-level debugging interface for
> the Mojo extension. You can also use the `mojo debug` command to start a
> command-line debugging session using LLDB or to launch a Mojo debugging
> session in VS Code.

Source: <https://mojolang.org/docs/tools/debugging/>.

`mojo debug` is **LLDB-based**, and the debugger "can debug programs written in
other standard native languages like Rust, C and C++, as it is based on LLDB or
cuda-gdb" (<https://mojolang.org/docs/cli/debug/>).

## The four session modes

The page names them exactly; the command shape is the contract.

### 1. Build and debug a Mojo file

```
mojo debug [options] <file.mojo> [runtime args]
```

> Builds the Mojo file at the given path and launches it under the debugger.
> Options, which come before the Mojo file, can include any compilation options
> expected by the `mojo run`, as well as regular debugging commands. Runtime
> args, which come after the Mojo file, are passed directly to the debuggee upon
> launch. By default, this mode uses `-O0` and `--debug-level=full` as
> compilation options.

Source: <https://mojolang.org/docs/cli/debug/>.

### 2. Debug a precompiled program

```
mojo debug [options] <program> [runtime args]
```

> Launches the program at the given path in the debugger. Options, which come
> before the program path, cannot include compilation commands. Runtime args,
> which come after the program path, are passed directly to the debuggee upon
> launch.

Source: <https://mojolang.org/docs/cli/debug/>.

This is why the debugging guide tells you to build with `-O0 -g` when you intend
to debug a binary later:

> For best results, build with the `-O0 -g` command-line options when you build
> a binary that you intend to debug—this produces a binary with full debug info.
> (When you call `mojo debug` on a Mojo source file, it includes debug
> information by default.)

Source: <https://mojolang.org/docs/tools/debugging/>.

### 3. Attach to a running process

```
mojo debug [options] [--pid <pid> | --process-name <process-name>]
```

> Attaches to the process specified by pid or name, which can be the full path of
> the process' executable. Options other than the process identifier cannot
> include compilation options.

Source: <https://mojolang.org/docs/cli/debug/>.

### 4. Start the debugger CLI

```
mojo debug [options]
```

> Launches the debugger CLI with support for debugging Mojo programs. This
> command only supports LLDB or cuda-gdb options via the `--X` option.

Source: <https://mojolang.org/docs/cli/debug/>.

## Two interfaces: CLI and VS Code

> * CLI: By default, all debug session modes are launched using the regular
>   debugger command-line interface.
> * VS Code Debug Server: If you add the `--vscode` option, the debug session is
>   launched in VS Code via the Mojo extension. VS Code must be running and the
>   Mojo extension must be enabled. Besides that, the environment variables and
>   the current working directory of this invocation are preserved when
>   launching programs in the debugger on VS Code.

Source: <https://mojolang.org/docs/cli/debug/>.

## Debugger backends

| Backend | Flag | CPU Mojo | GPU Mojo |
|---------|------|----------|----------|
| LLDB | default | "great support" | "no support at all" |
| cuda-gdb | `--cuda-gdb` | "minimal support" | supported |

> * LLDB: this is the default debugger and has great support for CPU Mojo code,
>   but has no support at all for Mojo GPU code.
> * cuda-gdb: this is invoked via the `--cuda-gdb` option and has minimal
>   support for CPU Mojo code but it has support for GPU Mojo code.

Source: <https://mojolang.org/docs/cli/debug/>.

The debugging guide adds that GPU debugging "requires some extra software and
configuration" and that "Currently GPU debugging only works with NVIDIA GPUs."
Source: <https://mojolang.org/docs/tools/debugging/>.

## Options

### Attach options

| Option | Meaning |
|--------|---------|
| `--pid <PID>` | Attach to the process with the given PID. |
| `--process-name <NAME>` | Attach to the process with the given name or path. |

### cuda-gdb options

| Option | Meaning |
|--------|---------|
| `--cuda-gdb` | Use cuda-gdb instead of LLDB. Can step into GPU code, but degrades CPU debugging. |
| `--cuda-gdb-path <CUDA_GDB_PATH>` | Use the given path instead of looking for cuda-gdb in `PATH`. |
| `--break-on-launch` | Set cuda-gdb's breakOnLaunch option: break on the first instruction of every launched kernel. |

### Compilation options

Identical to [`mojo run`](run.md#compilation-options).

| Option | Meaning |
|--------|---------|
| `--optimization-level <LEVEL>`, `-O`, `--no-optimization (LEVEL=0)` | Optimization level 0–3. Default 3, but `mojo debug <file.mojo>` defaults to `-O0`. |
| `-I <PATH>` | Append the given path to the import search directories. |
| `-D <KEY=VALUE>` | Define a compile-time value readable from the source. |
| `--debug-level <LEVEL>`, `-g`, `-g0`, `-g1`, `-g2` | Debug info level. Default `none`, but `mojo debug foo.mojo` defaults to `full`. |
| `--num-threads <NUM>`, `-j` | Maximum compilation threads. Default 0 = all. |
| `--elaboration-error-include-prelude` | Show elaboration errors with prelude locations. |
| `--fp-mode <MODE>` | FP contraction: `contract=fast` (default) or `contract=off`. |

### Target options

Identical to [`mojo run`](run.md#target-options): `--target-triple`,
`--target-cpu`, `--target-features`, `--march`, `--mcpu`, `--mtune`,
`--target-accelerator`, `--print-effective-target`,
`--print-supported-targets`, `--print-supported-cpus`,
`--print-supported-accelerators`.

### Compilation diagnostic options

Identical to [`mojo run`](run.md#compilation-diagnostic-options):
`--diagnose-missing-doc-strings`, `--max-notes-per-diagnostic`,
`--disable-builtins`, `--disable-warnings`, `--experimental-fixit`,
`--experimental-export-fixit`, `--Werror`, `--Wno-error`,
`--warn-on-unstable-apis`, `--ignore-incompatible-precompiled-file-errors`,
`--ignore-deprecated`.

### Debugger options

| Option | Meaning |
|--------|---------|
| `--X <ARG>` | Pass `ARG` as an argument to the debugger when the session is launched using the debugger CLI. Can be given multiple times. Ignored in RPC mode. |

`--X` is the documented channel for backend-specific flags; the fourth session
mode "only supports LLDB or cuda-gdb options via the `--X` option". Source:
<https://mojolang.org/docs/cli/debug/>.

### Debug server options

| Option | Meaning |
|--------|---------|
| `--vscode` | Launch the debug session in VS Code via the Mojo extension. |
| `--rpc` | Alias for `--vscode`. |
| `--terminal <TERMINAL>` | Terminal for a launch session: `console` (default; VS Code Debug Console) or `dedicated` (a dedicated terminal in the editor). |
| `--port <PORT>` | Port for the RPC debug server. Defaults to trying 12355–12364 inclusive. |
| `--stop-on-entry` | Automatically stop after launch. |
| `--init-command <INIT_COMMAND>` | Initialization command executed on debugger startup. Can be given multiple times. |

### Linker options

| Option | Meaning |
|--------|---------|
| `-Xlinker <ARG>` | Pass `ARG` to the linker. |
| `--lld-path <PATH>` | Override the `lld` linker path; takes precedence over `MODULAR_MOJO_MAX_LLD_PATH` and `mojo-max.lld_path`. |

### Experimental compilation options and common options

`--sanitize <CHECK>` (`address`/`thread`), `--shared-libasan`,
`--debug-info-language <LANGUAGE>`; and `--help`, `-h`, `--help-hidden`.
Source: <https://mojolang.org/docs/cli/debug/>.

## Realistic invocations

**Build and debug a source file.** Options come first, runtime args after the
file:

```bash
mojo debug myproject.mojo
```

The debugging guide shows the VS Code variant:

```bash
mojo debug --vscode myproject.mojo
```

**Debug a prebuilt binary.**

```sh
mojo build -O0 -g myproject.mojo -o myproject
mojo debug myproject
mojo debug --vscode myproject
```

**Attach to a running process.**

```bash
mojo debug --vscode --pid <PROCESS_ID>
mojo debug --vscode --process-name <PROCESS_NAME>
```

Both are documented on <https://mojolang.org/docs/tools/debugging/>.

**Turn a debug path on with `-D`.** The debugging guide uses `-D` plus a
`comptime if` and the built-in `breakpoint()`:

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

> To activate this code, use the `-D` command-line option to define `DEBUG_ME`.
> The `is_defined()` function returns a compile-time true or false value based on
> whether the specified name is defined. Since the `breakpoint()` call is inside
> a `comptime if` statement, it is only included in the compiled code when the
> `DEBUG_ME` name is defined on the command line.

Source: <https://mojolang.org/docs/tools/debugging/>.

**Debug GPU code with cuda-gdb.**

```bash
mojo debug --cuda-gdb --break-on-launch kernel.mojo
```

`--break-on-launch` and `--cuda-gdb` are documented on the CLI page; the
combinations above follow from those definitions
(<https://mojolang.org/docs/cli/debug/>).

**Programmatic breakpoint.** From the debugging guide:

```mojo
if some_value.is_valid():
   do_the_right_thing()
else:
   # We should never get here!
   breakpoint()
```

"If you have VS Code open and run this code in debug mode (either using VS Code
or `mojo debug`), hitting the `breakpoint()` call causes an error, which
triggers the debugger." Source:
<https://mojolang.org/docs/tools/debugging/>.

## Documented debugger capabilities and limitations

The debugging guide lists the supported stepping operations (Continue/Pause,
Step Over, Step Into, Step Out, Restart, Stop) and the current limitations:

> - No support for breaking automatically on Mojo errors.
> - When stepping out of a function, the returned value is not displayed.
> - LLDB doesn't support stopping or resuming individual threads.

Source: <https://mojolang.org/docs/tools/debugging/>.

Breakpoints: the debugger supports standard, logpoint, function, data and
triggered breakpoints, plus **error breakpoints** ("break on raise") that break
whenever a `raise` statement executes. Conditional breakpoints based on an
expression are **not** supported for Mojo code; hit counts are
(<https://mojolang.org/docs/tools/debugging/>).

The Debug Console "processes LLDB commands and Mojo expressions": input
prefixed with `:` is an LLDB command, anything else is an expression. Mojo
expressions are "limited to inspecting variables and their fields", with
subscript notation for `List` and `SIMD`; the console only accepts input while
the program is paused (<https://mojolang.org/docs/tools/debugging/>).

## Exit behaviour

- With VS Code (`--vscode`) and a broken server connection, the command fails
  with documented errors such as `error: can't connect to the RPC debug server
  socket: Connection refused` and `error: couldn't get a valid response from the
  RPC server` (source:
  <https://mojolang.org/docs/tools/debugging/>).
- When the debug session ends, control returns to the shell.

> **Open question:** the CLI reference publishes no exit-code table for
> `mojo debug`. Only the VS Code RPC failure messages above are documented.

## Pitfalls

- **Program arguments after the file.** As with `mojo run`, "Runtime args, which
  come after the Mojo file, are passed directly to the debuggee upon launch."
  Compiler options must come before the file. Source:
  <https://mojolang.org/docs/cli/debug/>.
- **Debugging a binary that was not built for debugging.** Build with `-O0 -g`;
  otherwise "you can't produce a binary with full debug info". Source:
  <https://mojolang.org/docs/tools/debugging/>.
- **Mojo launch configurations cannot specify compilation options.** "If you
  need to specify compilation options, you can build the binary using `mojo
  build`, then use a launch configuration with the `program` option." Source:
  <https://mojolang.org/docs/tools/debugging/>.
- **Conditional breakpoints by expression are unsupported.** Use hit counts.
  Source: <https://mojolang.org/docs/tools/debugging/>.
- **GPU and CPU debugging conflict.** LLDB has "no support at all for Mojo GPU
  code"; cuda-gdb degrades CPU debugging. Pick per task. Source:
  <https://mojolang.org/docs/cli/debug/>.
- **The Mojo extension needs its Python environment found.** "In some cases,
  this appears to default to your globally-installed environment… run the
  `Python: Set Project Environment` command." Source:
  <https://mojolang.org/docs/tools/debugging/>.
- **VS Code must be running for `--vscode`.** And multiple VS Code windows can
  trigger the documented RPC errors. Source:
  <https://mojolang.org/docs/tools/debugging/>.
- **`--X` is ignored in RPC mode.** It applies only to the CLI debug session.
  Source: <https://mojolang.org/docs/cli/debug/>.

## See also

- [`index`](index.md) — the full command surface.
- [`run`](run.md) — the compilation options `debug` reuses.
- [`build`](build.md) — building a binary with `-O0 -g` before debugging.
- [Debugging and profiling](../tooling/debugging-and-profiling.md) — the full
  debugger workflow and the documented profiling story.
- [Editor and LSP](../tooling/editor-and-lsp.md) — the VS Code extension.

## Sources

- `mojo debug`: <https://mojolang.org/docs/cli/debug/>
- Debugging: <https://mojolang.org/docs/tools/debugging/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Mojo CLI reference (single document): <https://mojolang.org/llms-cli.txt>
- `mojo build`: <https://mojolang.org/docs/cli/build/>
- Compilation targets: <https://mojolang.org/docs/tools/compilation/>
- Mojo FAQ (debugger in the `mojo` package):
  <https://mojolang.org/docs/faq/>
