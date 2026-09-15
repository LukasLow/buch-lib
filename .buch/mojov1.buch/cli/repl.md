# `mojo repl`

Launches the Mojo REPL.

## Synopsis

```
mojo repl [lldb-options]
```

Launching the REPL requires no command at all: bare `mojo` starts it too.

## Purpose

> Launches a Mojo read-evaluate-print loop (REPL) environment, which provides
> interactive development in the terminal. You can also start the REPL by
> simply running `mojo`.
>
> Any number of options and arguments may be specified on the command line.
> These are then forwarded to the underlying lldb tool, which runs the REPL.

Source: <https://mojolang.org/docs/cli/repl/>.

Three consequences follow directly from that wording:

1. **The REPL is interactive development in the terminal.** It is for trying
   expressions and language constructs, not for building artifacts.
2. **Bare `mojo` is the same command.** `mojo repl` and `mojo` behave the same.
3. **Its arguments are LLDB arguments, not Mojo options.** The page lists no
   `-I`, no `-D`, no `-O` for `repl`; "any number of options and arguments …
   are then forwarded to the underlying lldb tool". The documented options are
   only the shared common options.

`mojo repl` ships with the full `mojo` package; `mojo-compiler` does not include
it (<https://mojolang.org/docs/faq/>).

## Options

| Option | Meaning |
|--------|---------|
| `--help`, `-h` | Displays help information. |
| `--help-hidden` | Displays help for hidden options. |

Those are the only options the `repl` page documents under "Common options".
There is no dedicated "REPL options" or "Compilation options" section on the
official page. Everything else on the command line is passed through to LLDB.
Source: <https://mojolang.org/docs/cli/repl/>.

> **Open question — what LLDB accepts here.** Because the REPL forwards its
> arguments to LLDB, the usable flags are LLDB's, and the official Mojo 1.x
> pages do not enumerate which LLDB options make sense in a REPL session. For
> LLDB-specific flags, consult LLDB's own documentation; do not infer Mojo
> compiler flags for `mojo repl`. Source:
> <https://mojolang.org/docs/cli/repl/>.

## Realistic invocations

**Start the REPL.**

```bash
mojo repl
```

**Start it the short way.**

```bash
mojo
```

The CLI reference documents both forms explicitly (<https://mojolang.org/docs/cli/>).

**Forward an option to LLDB.** Because arguments are forwarded to `lldb`
verbatim, use the LLDB form for LLDB options:

```bash
mojo repl -o "settings set target.x86-disassembly-flavor intel"
```

> **Open question:** this shape (`-o <command>`) is the LLDB command form and is
> *not* documented on the Mojo REPL page, which names no concrete forwarded
> option. Treat it as an illustration of forwarding, not as a documented Mojo
> flag. Source: <https://mojolang.org/docs/cli/repl/>.

## What you get

The manual's tutorial shows the REPL's role in the first-program loop: "REPL,
formatter, run/build loop" (<https://mojolang.org/docs/manual/get-started/>).
The FAQ lists the REPL among the components of the `mojo` package, alongside the
formatter and debugger (<https://mojolang.org/docs/faq/>).

The REPL is the fastest way to check a language construct without creating a
file. Note that this book's own teaching pages assume file-based programs with a
`main()` entry point, because that is what `mojo run` and `mojo build` accept.

## Exit behaviour

- Leaving the REPL returns control to the shell with exit code 0.
- A failure inside the REPL is reported interactively; it does not terminate the
  shell, and the page documents no special exit semantics.

> **Open question:** the REPL page documents no exit codes. Treat it as an
> interactive tool whose exit code is not part of any documented contract.

## Pitfalls

- **Do not pass compiler flags to `mojo repl` expecting them to apply.** They
  are forwarded to LLDB, not to the Mojo compiler. If you need `-O`, `-g` or
  `-D`, use [`mojo run`](run.md) or [`mojo build`](build.md). Source:
  <https://mojolang.org/docs/cli/repl/>.
- **The REPL is not the tool for a full program.** Programs with a `main()`
  entry point belong in a file and run through `mojo run`. Source:
  <https://mojolang.org/docs/manual/get-started/>.
- **`mojo-compiler` does not include the REPL.** On a minimal install, bare
  `mojo` may not offer the REPL; install the `mojo` package for it. Source:
  <https://mojolang.org/docs/faq/>.
- **LLDB is an implementation detail you may hit.** The REPL is implemented on
  top of LLDB, so LLDB errors can surface in a REPL session. Source:
  <https://mojolang.org/docs/cli/repl/>.

## See also

- [`index`](index.md) — the full command surface, including the bare-`mojo`
  shortcut.
- [`run`](run.md) — run a file instead of typing expressions.
- [`debug`](debug.md) — the other LLDB-based command, for debugging rather than
  exploring.
- [Editor and LSP](../tooling/editor-and-lsp.md) — the editor-integrated
  alternative for interactive work.

## Sources

- `mojo repl`: <https://mojolang.org/docs/cli/repl/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Mojo CLI reference (single document): <https://mojolang.org/llms-cli.txt>
- Mojo FAQ (package contents): <https://mojolang.org/docs/faq/>
- Get started with Mojo (REPL in the loop):
  <https://mojolang.org/docs/manual/get-started/>
