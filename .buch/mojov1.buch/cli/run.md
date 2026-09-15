# `mojo run`

Builds and executes a Mojo file.

## Synopsis

```
mojo run [options] <path> [path-arguments...]
```

The bare form `mojo <path>` is exactly the same command.

## Purpose

> Compiles the Mojo file at the given path and immediately executes it. Another
> way to execute this command is to simply pass a file to `mojo`. For example:
>
>     mojo hello.mojo

Source: <https://mojolang.org/docs/cli/run/>.

`mojo run` performs **ahead-of-time (AOT) compilation**, not interpretation. The
FAQ is explicit: "Mojo is a compiled language. `mojo build` and `mojo run` both
perform ahead-of-time (AOT) compilation." Source:
<https://mojolang.org/docs/faq/>. The get-started tutorial describes the same
command from the user's point of view as performing just-in-time compilation
before running the result (<https://mojolang.org/docs/manual/get-started/>);
the authoritative statement about the compilation model is the FAQ.

## JIT versus build-and-run

There is no separate "JIT command". The two documented execution paths are:

| Path | Command | What happens |
|------|---------|--------------|
| Compile and run in one step | `mojo run hello.mojo` (or `mojo hello.mojo`) | AOT-compiles the file and executes it immediately. |
| Build an artifact, then run it | `mojo build hello.mojo` → `./hello` | Produces a standalone executable; running it is a separate step. |

To build and run in two steps, the get-started tutorial documents exactly this
pair:

```bash
mojo build life.mojo   # saves an executable named `life` in the current directory
./life
```

Source: <https://mojolang.org/docs/manual/get-started/>.

Choose `build` when you want an artifact to ship, benchmark repeatedly without
recompiling, or run outside the Mojo environment. Choose `run` for the edit/run
loop.

## Arguments after the file go to the program

This is the single most important behaviour of `mojo run`:

> Options for this command itself, such as the ones listed below, must appear
> before the input file `path` argument. Any command line arguments that appear
> after the Mojo source file `path` are interpreted as arguments for that Mojo
> program.

Source: <https://mojolang.org/docs/cli/run/>.

So in:

```bash
mojo run -O0 app.mojo --verbose input.txt
```

`-O0` is a compiler option, while `--verbose` and `input.txt` are passed to
`app.mojo`. This is the documented way to pass program arguments; the manual's
debugging page uses the same ordering when it shows
`mojo debug -D DEBUG_ME main.mojo`. Source:
<https://mojolang.org/docs/cli/run/>,
<https://mojolang.org/docs/tools/debugging/>.

> **Open question:** the run page says program arguments are "interpreted as
> arguments for that Mojo program", but it does not document how a Mojo program
> reads them. The `sys` reference exposes `sys.argv()` (used as the default
> `cli_args` for `TestSuite`, see
> <https://mojolang.org/docs/std/testing/testing/>), yet the 1.x CLI pages do not
> state the `argv` convention (whether the file path is `argv[0]`, whether flags
> are stripped). Verify the exact `argv` layout against the next upstream
> release before depending on it.

## Options

`mojo run` accepts the full compilation option set. They are grouped below
exactly as the official page groups them.

### Compilation options

| Option | Meaning |
|--------|---------|
| `--optimization-level <LEVEL>`, `-O`, `--no-optimization (LEVEL=0)` | Optimization level, a number between 0 and 3. Default is 3. |
| `-I <PATH>` | Append the path to the list of directories searched for imported Mojo files. |
| `-D <KEY=VALUE>` | Define a named value readable from the Mojo source. `-Dfoo=42` makes `std.defines` yield the compile-time value `42`. |
| `--debug-level <LEVEL>`, `-g`, `-g0`, `-g1`, `-g2` | Debug info level: `none`, `line-tables`, or `full`. Default `none` (except `mojo debug foo.mojo`, which defaults to `full`). `-g`=`full`, `-g0`=`none`, `-g1`=`line-tables`, `-g2`=`full`. "There are issues when generating debug info for some Mojo programs that have yet to be addressed." |
| `--num-threads <NUM>`, `-j` | Maximum compilation threads. Default 0 = all available threads. |
| `--elaboration-error-include-prelude` | Show elaboration errors with locations in the Mojo startup modules (prelude). |
| `--fp-mode <MODE>` | Floating-point behaviour as `feature=value` items. Only feature: `contract`, `fast` (default) or `off`. `contract=fast` fuses `a + b*c` into an FMA across statements, breaking strict IEEE compliance; `contract=off` disables contraction. |

### `-D` and how it interacts with feature toggles

`-D` defines compile-time parameters, read from the standard library's
`std.sys.defines` module. Both spellings work: `-Dkey=value` and `-D key=value`;
keys and values "must be joined with `=`". A bare `-D KEY` defines a flag with
no value, and `is_defined[name]()` returns `True` for it. Source:
<https://mojolang.org/docs/tools/feature-toggles/>.

The reader functions determine the value's type:

| Reader | Returns | Missing define |
|--------|---------|----------------|
| `is_defined[name]()` | `Bool` — true if `-D name` was passed, regardless of value | never errors |
| `get_defined_bool[name, default=False]()` | `Bool`; truthy values are `1`, `true`/`True`/`TRUE`, `on`/`On`/`ON` | returns `default` |
| `get_defined_int[name]()` / `get_defined_int[name, default]()` | `Int`; only base-10 integers accepted | errors / returns default |
| `get_defined_string[name]()` / `get_defined_string[name, default]()` | `StaticString` | errors / returns default |
| `get_defined_dtype[name, default]()` | `DType`; default required | returns default |

Source: <https://mojolang.org/docs/tools/feature-toggles/>,
<https://mojolang.org/docs/std/sys/defines/>.

The canonical example from the feature-toggles page:

```sh
mojo run -Dmode=release -Dverbose -Dmax_threads=8 hello.mojo

# or

mojo run -D mode=release -D verbose -D max_threads=8 hello.mojo
```

```mojo
from std.sys import get_defined_string

def main():
    comptime mode = get_defined_string["mode", "debug"]()

    comptime if mode == "release":
        print("optimized path")
    else:
        print("debug path with extra checks")
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

`-D` is not the same as the compiler's own feature defines. `-O`/`-g`/`--sanitize`
inject compiler-managed defines (`__OPTIMIZATION_LEVEL`, `__DEBUG_LEVEL`,
`__SANITIZE_ADDRESS`) read through `std.sys.compile`, and `debug_assert()` is
governed by the separate `-D ASSERT=<value>` define, which defaults to `safe`
and is unaffected by `-g` and `-O`. See
[feature toggles](../tooling/feature-toggles.md) and
[compiler and flags](../tooling/compiler-and-flags.md). Source:
<https://mojolang.org/docs/tools/feature-toggles/>.

### Target options

| Option | Meaning |
|--------|---------|
| `--target-triple <TRIPLE>` | Compilation target triple. Defaults to the host target. |
| `--target-cpu <CPU>` | Target CPU. Defaults to the host CPU. |
| `--target-features <FEATURES>` | Target CPU features. Defaults to host features. |
| `--march <ARCHITECTURE>` | Architecture for which to generate code. |
| `--mcpu <CPU>` | CPU for which to generate code. |
| `--mtune <TUNE>` | CPU for which to tune code. |
| `--target-accelerator <ACCELERATOR>` | GPU or accelerator architecture (e.g. `sm_90` for NVIDIA H100, `gfx942` for AMD MI300). |
| `--print-effective-target` | Print the effective target configuration and exit. |
| `--print-supported-targets` | Print all available target names and exit. |
| `--print-supported-cpus` | Print valid CPU names for the specified target and exit. Requires `--target-triple`. |
| `--print-supported-accelerators` | Print all supported GPU/accelerator architectures and exit. |

The two target-flag families — `--target-cpu`/`--target-features` and
`--march`/`--mcpu`/`--mtune` — cannot be mixed in one command; the compiler
rejects it. `--target-triple` and `--target-accelerator` work with both. Source:
<https://mojolang.org/docs/tools/compilation/>.

### Compilation diagnostic options

| Option | Meaning |
|--------|---------|
| `--diagnose-missing-doc-strings` | Emit diagnostics for missing or partial doc strings. |
| `--max-notes-per-diagnostic <INTEGER>` | Upper threshold on the number of notes printed with a diagnostic. Default 10. |
| `--disable-builtins` | Do not use builtins when creating a package. |
| `--disable-warnings` | Do not print warning messages. |
| `--experimental-fixit` | Automatically apply fix-its and rerun. "highly experimental and may result in irreversible data loss." |
| `--experimental-export-fixit <YAML_FILE>` | Export fix-its to a YAML file in clang-tidy format. Apply with `clang-apply-replacements`. Experimental. |
| `--Werror` | Treat warnings as errors. |
| `--Wno-error` | Do not treat warnings as errors. |
| `--warn-on-unstable-apis` | Warn when using unstable APIs from the standard library. |
| `--ignore-incompatible-precompiled-file-errors` | Ignore errors loading incompatible precompiled files. |
| `--ignore-deprecated <NAME>` | Suppress the deprecation warning for the given declaration (`Foo.bar`, or `some_fn` for a top-level declaration). |

The stability page adds an honest caveat about `--warn-on-unstable-apis`: "We
don't currently recommend this because the stable API set is small." Source:
<https://mojolang.org/docs/api-docs/stability/>.

### Linker options

| Option | Meaning |
|--------|---------|
| `-Xlinker <ARG>` | Pass `ARG` to the linker. |
| `--lld-path <PATH>` | Override the `lld` linker path. Takes precedence over `MODULAR_MOJO_MAX_LLD_PATH` and the `mojo-max.lld_path` configuration value. |

### Experimental compilation options

| Option | Meaning |
|--------|---------|
| `--sanitize <CHECK>` | Turns on runtime checks: `address` (memory issues) or `thread` (multi-threading issues). |
| `--shared-libasan` | Dynamically link the address-sanitizer runtime. Requires `--sanitize=address`. |
| `--debug-info-language <LANGUAGE>` | Language emitted in debug info: `Mojo` (default) or `C`. `C` helps tools that don't understand Mojo; not required for `mojo debug`. |

### Common options

| Option | Meaning |
|--------|---------|
| `--diagnostic-format <FORMAT>` | `text` (default) or `json`. |
| `--help`, `-h` | Displays help information. |
| `--help-hidden` | Displays help for hidden options. |

## Realistic invocations

**Fast edit/run loop.** No flags needed; the defaults are `-O3`, no debug info,
no sanitizers.

```bash
mojo run app.mojo
```

**Debug-symbol build for a crash you are about to chase.** The feature-toggles
page documents this combination:

```sh
mojo -g -O0 -D ASSERT=all app.mojo
```

It notes: "A typical release build requires no special flags. Running
`mojo app.mojo` uses `-O3`, emits no debug info and disables sanitizers."
Source: <https://mojolang.org/docs/tools/feature-toggles/>.

**Pass arguments to the program (not the compiler).**

```bash
mojo run app.mojo --input data.txt --verbose
```

**Compile against an out-of-tree package directory.**

```bash
mojo run -I ./vendor app.mojo
```

**Feature toggle from the command line.**

```bash
mojo run -Dmode=release app.mojo
```

## Exit behaviour

- When the program runs to completion, `mojo run` exits with the program's
  result.
- When a compiled program exits non-zero, the CLI reports it. The testing page
  shows the exact shape for a failed test suite:

  ```output
  mojo: error: execution exited with a non-zero result: 1
  ```

  Source: <https://mojolang.org/docs/tools/testing/>.

- Errors during compilation are diagnostics, printed in `text` or `json` per
  `--diagnostic-format`; `--Werror` turns warnings into failures.

> **Open question:** the CLI reference does not publish a complete exit-code
> table for `mojo run` (for example whether compile errors, link errors and
> signal-terminated programs share a code). The only documented non-zero exit is
> the "execution exited with a non-zero result: N" form above. Treat the exit
> code as a pass/fail signal, not as a documented error taxonomy.

## Pitfalls

- **Flags after the filename are program arguments.** `mojo run app.mojo -O0`
  passes `-O0` to `app.mojo`, it does not lower optimization. Put compiler
  options first. Source: <https://mojolang.org/docs/cli/run/>.
- **`run` produces no reusable artifact.** For a binary, use
  [`mojo build`](build.md).
- **Python libraries are not bundled.** Whatever `run` sees at execution time
  must also exist wherever a built binary is executed; `build` does not embed
  Python libraries. Source: <https://mojolang.org/docs/cli/build/>.
- **`--experimental-fixit` can destroy data.** The page warns of "irreversible
  data loss". Prefer `--experimental-export-fixit` if you want review before
  applying. Source: <https://mojolang.org/docs/cli/run/>.
- **`--sanitize` needs the full runtime.** `--shared-libasan` requires
  `--sanitize=address`; the sanitizer options are marked experimental. Source:
  <https://mojolang.org/docs/cli/run/>.
- **`-D` values are strings until a typed reader parses them.** `-D N=0x10`
  fails at `get_defined_int[]()`: "The parser accepts only base-10 integers."
  Source: <https://mojolang.org/docs/tools/feature-toggles/>.
- **Debug info is not flawless.** "Please note that there are issues when
  generating debug info for some Mojo programs that have yet to be addressed."
  Source: <https://mojolang.org/docs/cli/run/>.

## See also

- [`build`](build.md) — the same compilation pipeline, but emitting an artifact.
- [`index`](index.md) — the full command surface.
- [Compiler and flags](../tooling/compiler-and-flags.md) — what the flags change.
- [Feature toggles](../tooling/feature-toggles.md) — `-D` and `-D ASSERT`.
- [CI](../project/ci.md) — `mojo run` in a pipeline.

## Sources

- `mojo run`: <https://mojolang.org/docs/cli/run/>
- `mojo build`: <https://mojolang.org/docs/cli/build/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Mojo CLI reference (single document): <https://mojolang.org/llms-cli.txt>
- Mojo FAQ (compilation model): <https://mojolang.org/docs/faq/>
- Get started with Mojo (build-and-run pair): <https://mojolang.org/docs/manual/get-started/>
- Compilation feature toggles: <https://mojolang.org/docs/tools/feature-toggles/>
- Compilation targets: <https://mojolang.org/docs/tools/compilation/>
- `std.sys.defines` reference: <https://mojolang.org/docs/std/sys/defines/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Testing (exit shape): <https://mojolang.org/docs/tools/testing/>
- Debugging (`mojo debug` ordering): <https://mojolang.org/docs/tools/debugging/>
