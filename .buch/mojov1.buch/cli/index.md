# The `mojo` command-line interface

This chapter is the complete command surface of the `mojo` CLI. Its purpose is
practical: after reading it, an agent or developer can drive the whole Mojo
toolchain from a terminal with no access to the internet. Every command, every
documented option, the exact synopsis and the exit behaviour are recorded here;
each command has its own page.

The official CLI reference opens with the synopsis:

```
mojo <command>
mojo [run-options] <path>
mojo [options]
mojo
```

Source: <https://mojolang.org/docs/cli/>.

## What the CLI is

> The `mojo` CLI provides all the tools you need for Mojo development, such as
> commands to run, compile, and precompile Mojo code. A list of all commands are
> listed below, and you can learn more about each one by adding the `--help`
> option to the command (for example, `mojo precompile --help`).

Source: <https://mojolang.org/docs/cli/>.

The CLI is installed together with the `mojo` package (or the smaller
`mojo-compiler` package). `mojo build` and `mojo run` both perform ahead-of-time
compilation; Mojo is a compiled language, not an interpreted one
(<https://mojolang.org/docs/faq/>). `mojo format`, `mojo repl` and the debugger
ship only in the full `mojo` package, not in `mojo-compiler`
(<https://mojolang.org/docs/faq/>).

## Two commands have shortcuts

Two commands may be omitted entirely:

- **Running a file.** `mojo <path>` is identical to `mojo run <path>`. The
  official wording: "you can run a Mojo file by simply passing the filename to
  `mojo`".
- **The REPL.** `mojo` with no commands starts a REPL session.

So `mojo hello.mojo` and `mojo run hello.mojo` are the same command, and bare
`mojo` and `mojo repl` are the same command. Source:
<https://mojolang.org/docs/cli/>.

## The complete command surface

All eight commands, their purpose, and the page that documents them:

| Command | Purpose | Page |
|---------|---------|------|
| `mojo run` | Builds and executes a Mojo file. | [`run`](run.md) |
| `mojo build` | Builds an executable from a Mojo file. | [`build`](build.md) |
| `mojo repl` | Launches the Mojo REPL. | [`repl`](repl.md) |
| `mojo debug` | Launches the Mojo debugger using the command-line interface or an external editor. | [`debug`](debug.md) |
| `mojo precompile` | Precompiles a Mojo package. | [`precompile`](precompile.md) |
| `mojo format` | Formats Mojo source files. | [`format`](format.md) |
| `mojo doc` | Compiles docstrings from a Mojo file. | [`doc`](doc.md) |
| `mojo demangle` | Demangles the given name. | [`demangle`](demangle.md) |

The purpose column above is the official one-line description from
<https://mojolang.org/docs/cli/>.

> **Note — the official page also says "package".** The CLI reference's own
> `llms-cli.txt` preamble describes the command list as "build, run, debug,
> format, package, doc, demangle, and repl", and the `mojo precompile` page
> still accepts a `.mojopkg` output filename. But the *command* is `precompile`,
> not `package`: `mojo package` was renamed to `mojo precompile` in v1.0.0b2
> (<https://mojolang.org/releases/v1.0.0b2/>). Write `mojo precompile` in 1.x;
> see [`precompile`](precompile.md) and
> [Mojo 1.0.0](../versions/1.0.0.md). Source of the command list:
> <https://mojolang.org/docs/cli/> and <https://mojolang.org/llms-cli.txt>.

## How the commands relate

The commands fall into five groups. Knowing which group a task belongs to is
most of the navigation:

| Group | Commands | What they share |
|-------|----------|-----------------|
| **Run / build** | `run`, `build` | The compilation pipeline. They accept the same compilation, target, diagnostic, linker and sanitizer options. `build` stops at an artifact; `run` executes it. |
| **Package** | `precompile` | Compiles a directory into a `.mojoc` package. Its own page links to [modules and packages](../project/structure.md). |
| **Interactive / debug** | `repl`, `debug` | Both are LLDB-based sessions; `repl` forwards its arguments to `lldb`, `debug` drives LLDB or cuda-gdb. |
| **Source tooling** | `format`, `doc`, `demangle` | Operate on sources or symbol names rather than building an executable. |
| **Cache / version** | global options | `--version`, `--print-cache-location`, `--clear-cache`. |

Two relationships deserve to be stated explicitly because they trip people up:

- **`run` and `build` share an options block.** The compilation, target,
  diagnostic, linker and experimental-sanitizer option lists are byte-for-byte
  the same on both pages. The only difference in the option sets is that `build`
  adds the output options (`-o`, `--emit`). Source:
  <https://mojolang.org/docs/cli/build/>, <https://mojolang.org/docs/cli/run/>.
- **`debug` reuses `run`'s compilation options and defaults.** The `debug` page
  says its options "can include any compilation options expected by the
  `mojo run`", and that building-and-debugging a file defaults to `-O0
  --debug-level=full`. Source: <https://mojolang.org/docs/cli/debug/>.

## The pipeline in one table

| You want to… | Command | Where the result lands |
|--------------|---------|------------------------|
| Try a file quickly | `mojo file.mojo` (= `mojo run file.mojo`) | stdout/stderr; nothing persisted |
| Ship a program | `mojo build file.mojo -o prog` | `prog` next to you |
| Share a library | `mojo precompile mypkg -o mypkg.mojoc` | `mypkg.mojoc` |
| Reformat sources | `mojo format src/**/*.mojo` | files edited in place |
| Emit API docs | `mojo doc mypkg -o docs.json` | JSON (stdout if no `-o`) |
| Debug a crash | `mojo debug file.mojo` | an LLDB session |
| Explore interactively | `mojo` | an LLDB-backed REPL |
| Read a mangled symbol | `mojo demangle <name>` | the demangled name |
| Find the compile cache | `mojo --print-cache-location` | the cache path |
| Wipe the compile cache | `mojo --clear-cache -f` | cache removed |

## Global options

These belong to the `mojo` command itself, not to a subcommand. They are
documented under three headings on the CLI reference page.

### Diagnostic options

| Option | Meaning |
|--------|---------|
| `--version`, `-v` | Prints the Mojo version and exits. |

`mojo --version` prints a semantic Mojo version (for example `1.0.0...`) since
v1.0.0b1, replacing the older internal build identifier
(<https://mojolang.org/releases/v1.0.0b1/>).

### Cache management options

| Option | Meaning |
|--------|---------|
| `--print-cache-location` | Prints the Mojo compile cache (`.mojo_cache`) location and exits. |
| `--clear-cache` | Removes the Mojo compile cache (`.mojo_cache`) after confirmation. Pass `-f` / `--force` to skip the confirmation prompt. |

The cache path "honors the existing precedence (`MODULAR_CACHE_DIR`,
`MODULAR_HOME`, `MODULAR_DERIVED_PATH`, `XDG_CACHE_HOME`, etc.)". The v1.0.0b2
release notes show the exact interaction:

```text
$ mojo --print-cache-location
/home/you/.cache/modular/.mojo_cache

$ mojo --clear-cache
This will remove the Mojo compile cache at:
  /home/you/.cache/modular/.mojo_cache
Proceed? [y/N] y
Removed /home/you/.cache/modular/.mojo_cache

$ mojo --clear-cache -f   # no prompt
```

Source: <https://mojolang.org/docs/cli/> and
<https://mojolang.org/releases/v1.0.0b2/>.

### Common options

| Option | Meaning |
|--------|---------|
| `--help`, `-h` | Displays help information. |
| `--help-hidden` | Displays help for hidden options. |

## A worked end-to-end session

All of these commands are documented; the ordering is the documented pipeline
(`mojo run` → `mojo build` → `mojo precompile` → `mojo doc`) applied to one
project.

```sh
# 1. Layout: a module plus a package.
#    main.mojo
#    mypackage/__init__.mojo
#    mypackage/mymodule.mojo

# 2. Try the program (JIT-like "run", AOT-compiled under the hood).
mojo main.mojo

# 3. Precompile the package so import is faster for downstream builds.
mojo precompile mypackage -o mypack.mojoc

# 4. Build the program into a standalone executable.
mojo build main.mojo -o main

# 5. Emit API docs from the same sources.
mojo doc mypackage -o docs.json

# 6. Format everything before committing.
mojo format main.mojo mypackage/
```

Steps 2–4 and the import behaviour are documented on
<https://mojolang.org/docs/manual/packages/>; step 5 on
<https://mojolang.org/docs/cli/doc/>; step 6 on
<https://mojolang.org/docs/cli/format/>.

## Global option quick reference

| Flag | `run` | `build` | `repl` | `debug` | `precompile` | `format` | `doc` | `demangle` |
|------|:-----:|:-------:|:------:|:-------:|:------------:|:--------:|:-----:|:----------:|
| `--help`, `-h` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `--help-hidden` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `--version`, `-v` | global only | | | | | | | |
| `--print-cache-location` | global only | | | | | | | |
| `--clear-cache` | global only | | | | | | | |

Every command page documents its own options in full; this table only shows the
options every command shares. Source: <https://mojolang.org/docs/cli/> and the
individual command pages.

## Pitfalls

- **Options must come before the file.** On `mojo run` (and therefore on bare
  `mojo file.mojo`), "options for this command itself … must appear before the
  input file `path` argument. Any command line arguments that appear after the
  Mojo source file `path` are interpreted as arguments for that Mojo program."
  A flag typed after the filename becomes a program argument, not a compiler
  flag. Source: <https://mojolang.org/docs/cli/run/>.
- **`mojo format` rewrites files in place.** It takes `<sources...>` and formats
  them; there is no dry-run flag documented on the 1.x page. Source:
  <https://mojolang.org/docs/cli/format/>.
- **`mojo build` does not bundle Python libraries.** "any Python libraries used
  in your Mojo project are not included in the executable binary, so they must
  be provided by the environment where you run the executable." Source:
  <https://mojolang.org/docs/cli/build/>.
- **`mojo precompile` output is compiler-version-locked.** Loading a `.mojoc`
  produced by a different compiler version errors. Source:
  <https://mojolang.org/docs/cli/precompile/>.
- **`mojo doc` output format is explicitly unstable.** "This output format is
  subject to change." Do not build a tool that depends on the JSON shape.
  Source: <https://mojolang.org/docs/cli/doc/>.
- **`mojo debug` and `mojo repl` depend on LLDB.** Both forward to or build on
  LLDB (the REPL forwards its arguments to `lldb` directly). Source:
  <https://mojolang.org/docs/cli/repl/>, <https://mojolang.org/docs/cli/debug/>.

## See also

- [`build`](build.md), [`run`](run.md), [`format`](format.md),
  [`repl`](repl.md), [`doc`](doc.md), [`precompile`](precompile.md),
  [`debug`](debug.md), [`demangle`](demangle.md).
- [Compiler and flags](../tooling/compiler-and-flags.md) — what `-O`, `-g`, `-D`
  and `-D ASSERT` actually change.
- [Feature toggles](../tooling/feature-toggles.md) — `-D` in depth.
- [Structure](../project/structure.md) — packages and import resolution.
- [Packaging and distribution](../project/packaging-and-distribution.md) —
  `.mojoc` and conda packages.
- [CI](../project/ci.md) — the same commands in a pipeline.

## Sources

- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- `mojo build`: <https://mojolang.org/docs/cli/build/>
- `mojo run`: <https://mojolang.org/docs/cli/run/>
- `mojo repl`: <https://mojolang.org/docs/cli/repl/>
- `mojo debug`: <https://mojolang.org/docs/cli/debug/>
- `mojo precompile`: <https://mojolang.org/docs/cli/precompile/>
- `mojo format`: <https://mojolang.org/docs/cli/format/>
- `mojo doc`: <https://mojolang.org/docs/cli/doc/>
- `mojo demangle`: <https://mojolang.org/docs/cli/demangle/>
- Mojo CLI reference (single document): <https://mojolang.org/llms-cli.txt>
- Mojo manual — modules and packages: <https://mojolang.org/docs/manual/packages/>
- Mojo FAQ: <https://mojolang.org/docs/faq/>
- Mojo v1.0.0b1 release notes: <https://mojolang.org/releases/v1.0.0b1/>
- Mojo v1.0.0b2 release notes: <https://mojolang.org/releases/v1.0.0b2/>
