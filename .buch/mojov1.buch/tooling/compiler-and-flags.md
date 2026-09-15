# Compiler and flags

This page explains Mojo's compilation model and the flags that change what the
compiler emits and what code sees at compile time. The primary sources are the
official tools pages
[Compilation targets](https://mojolang.org/docs/tools/compilation/) and
[Compilation feature toggles](https://mojolang.org/docs/tools/feature-toggles/),
plus the option tables on
[`mojo build`](https://mojolang.org/docs/cli/build/) and
[`mojo run`](https://mojolang.org/docs/cli/run/).

## The compilation model

Mojo is a compiled language:

> Mojo is a compiled language. `mojo build` and `mojo run` both perform
> ahead-of-time (AOT) compilation.

Source: <https://mojolang.org/docs/faq/>.

So there are two entry points into the same AOT pipeline:

| Command | Pipeline | Result |
|---------|----------|--------|
| `mojo run file.mojo` (or `mojo file.mojo`) | compile → execute | program output; no artifact |
| `mojo build file.mojo` | compile → link | an artifact (`exe`, `shared-lib`, `object`, `llvm`, `llvm-bitcode`, `asm`) |

The **compilation options, target options, diagnostic options, linker options and
experimental sanitizer options are identical** on `run` and `build`; `build`
adds the output options (`-o`, `--emit`). Sources:
<https://mojolang.org/docs/cli/run/>,
<https://mojolang.org/docs/cli/build/>.

### Targets

A *target* describes where and how the program runs:

> *Compilation targets* describe where and how your program runs. They define
> the platform, CPU, features, and optional accelerators used during code
> generation, for both native and cross-compilation workflows, including
> GPU-enabled (*heterogeneous builds*).

Source: <https://mojolang.org/docs/tools/compilation/>.

A target has four components:

- **architecture** — the base instruction set (x86-64, AArch64, …);
- **CPU model** — processor-specific behaviour;
- **feature set** — individual capabilities (AVX-512, Neon, …);
- **accelerator architecture** — the GPU or other accelerator, if any.

"If you don't set these explicitly, the compiler uses your host system." A
*target triple* identifies the platform as architecture + vendor + OS, e.g.
`x86_64-unknown-linux-gnu` or `aarch64-apple-macosx`.

## What the flags change

### Optimization: `-O` / `--optimization-level`

| Flag | Effect |
|------|--------|
| `--optimization-level <LEVEL>` | Sets the optimization level, a number between 0 and 3. |
| `-O` | Shorthand for `--optimization-level`. |
| `--no-optimization` | Equivalent to `LEVEL=0`. |

The default is **3**. Source: <https://mojolang.org/docs/cli/run/>.

`-O` also injects a compile-time define that library code can read:

| Define | Flag | Type | Values |
|--------|------|------|--------|
| `__OPTIMIZATION_LEVEL` | `-O` / `--optimization-level` | `Int` | `0`, `1`, `2`, `3` (default `3`) |

Read it through `std.sys.compile` as `OptimizationLevel.level` (an `Int`):

```mojo
from std.sys.compile import OptimizationLevel

def main():
    comptime if OptimizationLevel.level == 0:
        print("unoptimized build")
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

### Debug info: `-g` / `--debug-level`

| Flag | Level |
|------|-------|
| `--debug-level <LEVEL>` | `none`, `line-tables`, or `full` |
| `-g`, `-g2` | `full` |
| `-g0` | `none` |
| `-g1` | `line-tables` |

Default is `none` — "except when using `mojo debug foo.mojo`, which defaults to
`full`." The CLI pages caution: "there are issues when generating debug info for
some Mojo programs that have yet to be addressed." Source:
<https://mojolang.org/docs/cli/build/>,
<https://mojolang.org/docs/cli/run/>.

`-g` injects `__DEBUG_LEVEL` (a `String`, `"line-tables"` or `"full"`), read
through `std.sys.compile` as `DebugLevel.level`. "If `-g` is omitted,
`__DEBUG_LEVEL` is not injected; `DebugLevel.level` returns `"none"` as a
library fallback." Source:
<https://mojolang.org/docs/tools/feature-toggles/>.

```mojo
from std.sys.compile import DebugLevel

def main():
    comptime if DebugLevel.level == "full":
        print(
            "full debug info emitted: enabling source-aware logging"
        )
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

For a binary you intend to debug, the documented recipe is `-O0 -g`
(<https://mojolang.org/docs/tools/debugging/>).

### Feature defines: `-D`

`-D <KEY=VALUE>` defines a named compile-time value, read via `std.sys.defines`:

> `-Dfoo=42` defines a name `foo` that, when queried with the `std.defines`
> module from within the Mojo program, would yield the compile-time value `42`.

Both `-Dkey=value` and `-D key=value` are accepted; keys and values "must be
joined with `=`". A bare `-D KEY` defines a flag that `is_defined[]()` reports as
`True`. Source:
<https://mojolang.org/docs/cli/build/>,
<https://mojolang.org/docs/tools/feature-toggles/>.

Feature toggles are covered in depth in
[feature toggles](feature-toggles.md). The short version:

| Reader | Missing define |
|--------|----------------|
| `is_defined[name]()` | `False` (never errors) |
| `get_defined_bool[name, default=False]()` | returns `default` |
| `get_defined_int[name]()` / `get_defined_int[name, default]()` | errors / returns default |
| `get_defined_string[name]()` / `get_defined_string[name, default]()` | errors / returns default |
| `get_defined_dtype[name, default]()` | returns `default` |

Sources: <https://mojolang.org/docs/tools/feature-toggles/>,
<https://mojolang.org/docs/std/sys/defines/>.

### `assert` is gated by `-D ASSERT`

Runtime assertions in Mojo are controlled by the `ASSERT` define:

| Define | Flag | Type | Values |
|--------|------|------|--------|
| `ASSERT` | `-D ASSERT=<value>` | `String` | `none`, `safe` (default), `all`, `warn` |

The levels, verbatim:

- `none`: disable all assertions
- `safe` (default in non-debug builds): only run assertions tagged
  `assert_mode="safe"`
- `all`: run every `debug_assert()` call
- `warn`: run every assertion, but emit warnings instead of aborting

```sh
mojo run -D ASSERT=all hello.mojo
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

The keywords reference states the gating in one line: "`assert` — Aborts if a
condition is false (gated by `-D ASSERT`)" (<https://mojolang.org/docs/reference/keywords/>).
`debug_assert()` "reads this value directly", and the ASSERT setting is
**independent of `-g` and `-O`**:

> The `-g` and `-O` driver flags don't affect `debug_assert()`. If you want these
> behaviors together, pass each flag explicitly.

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

A typical debug build therefore combines several flags:

```sh
mojo -g -O0 -D ASSERT=all app.mojo
```

and a release build needs none, because "Running `mojo app.mojo` uses `-O3`,
emits no debug info and disables sanitizers." Source:
<https://mojolang.org/docs/tools/feature-toggles/>.

Two special cases:

- **GPU bounds checking** is an ASSERT matter: "Use `mojo build -D ASSERT=all`
  to enable bounds checking on GPU; use `-D ASSERT=none` to disable all asserts
  including CPU bounds checking." Source:
  <https://mojolang.org/releases/v1.0.0b1/>.
- **Apple GPU:** "`debug_assert()` is silently disabled on Apple GPU targets."
  Source: <https://mojolang.org/docs/tools/feature-toggles/>.

> **Open question — a bare run-time `assert` under the default level.** The
> keywords reference only says `assert` is "gated by `-D ASSERT`", and the tools
> page describes the levels for assertions in general (`none`, `safe`, `all`,
> `warn`) without stating whether a *bare* `assert` statement counts as a
> `"safe"` (always-on) assertion or as an *untagged* one that runs only under
> `-D ASSERT=all`/`warn`. The pre-1.0 release note that introduced the statement
> said it is active "when compiled with `-D ASSERT=all` and are no-ops
> otherwise", but that is a 0.x statement not restated on the 1.x pages. See
> [`assert`](../keywords/assert.md) for the full note. Sources:
> <https://mojolang.org/docs/reference/keywords/>,
> <https://mojolang.org/docs/tools/feature-toggles/>,
> <https://mojolang.org/releases/v0.26.2/>.

### Sanitizers: `--sanitize`

| Flag | Effect |
|------|--------|
| `--sanitize <CHECK>` | Runtime checks: `address` (memory issues) or `thread` (multi-threading issues). |
| `--shared-libasan` | Dynamically link the address-sanitizer runtime. Requires `--sanitize=address`. |

`--sanitize=address` injects `__SANITIZE_ADDRESS` (an `Int`, `0`/`1`); "only
`--sanitize=address` injects a compile-time define" — `thread` does not. Read it
as `SanitizeAddress` (a `Bool`) through `std.sys.compile`. Both flags are marked
experimental on the CLI pages. Sources:
<https://mojolang.org/docs/tools/feature-toggles/>,
<https://mojolang.org/docs/cli/build/>.

### Floating-point contraction: `--fp-mode`

| Flag | Effect |
|------|--------|
| `--fp-mode <MODE>` | Comma-separated `feature=value` items; only feature is `contract`. |
| `contract=fast` (default) | Like Clang's `-ffp-contract=fast`: fuses `a + b*c` into an FMA across statements, "breaking strict IEEE compliance". |
| `contract=off` | Disables contraction. |

Source: <https://mojolang.org/docs/cli/build/>.

### Threads: `--num-threads` / `-j`

Maximum number of compilation threads. Default 0 = use all available threads.
Source: <https://mojolang.org/docs/cli/run/>.

### Import path: `-I`

Appends a directory to the list searched for imported Mojo files. Used by every
compiling command and by `mojo doc`/`mojo precompile` (which document only `-I`).
Sources: <https://mojolang.org/docs/cli/run/>,
<https://mojolang.org/docs/cli/doc/>,
<https://mojolang.org/docs/cli/precompile/>.

### Prelude locations: `--elaboration-error-include-prelude`

Shows elaboration errors with locations in the Mojo startup modules (prelude).
Source: <https://mojolang.org/docs/cli/build/>.

## Warning and diagnostic flags

| Flag | Effect |
|------|--------|
| `--disable-warnings` | Do not print warning messages. |
| `--Werror` | Treat warnings as errors. |
| `--Wno-error` | Do not treat warnings as errors. |
| `--warn-on-unstable-apis` | Warn when using unstable APIs from the standard library. |
| `--ignore-deprecated <NAME>` | Suppress the deprecation warning for a declaration (`Foo.bar`, or `some_fn` at top level). |
| `--diagnostic-format <FORMAT>` | `text` (default) or `json`. |
| `--max-notes-per-diagnostic <INTEGER>` | Max notes printed with a diagnostic. Default 10. |
| `--experimental-fixit` | Apply fix-its and rerun. Destructive. |
| `--experimental-export-fixit <YAML_FILE>` | Export fix-its to a clang-tidy YAML file. |
| `--diagnose-missing-doc-strings` | Emit diagnostics for missing/partial doc strings. |
| `--ignore-incompatible-precompiled-file-errors` | Ignore incompatible precompiled-file load errors. |
| `--disable-builtins` | Do not use builtins when creating a package. |

The stability page's honest caveat on `--warn-on-unstable-apis`: "We don't
currently recommend this because the stable API set is small." Source:
<https://mojolang.org/docs/api-docs/stability/>.

## Target flags

Two families reach the same result and **cannot be mixed**.

### Mojo target flags

| Flag | Purpose |
|------|---------|
| `--target-triple` | Platform (arch + vendor + OS). |
| `--target-cpu` | Specific processor model. |
| `--target-features` | Individual feature toggles. |
| `--target-accelerator` | GPU or accelerator architecture. |

### GCC/Clang-compatible flags

| Flag | Purpose |
|------|---------|
| `--march` | Architecture or CPU subtype to generate code for. |
| `--mcpu` | CPU model (sets architecture and tuning). |
| `--mtune` | Optimization hint for a specific processor. |

### Shared flags

`--target-triple` and `--target-accelerator` are always valid and work with
either family.

The compiler enforces the separation:

```sh
# This fails:
mojo build --target-cpu=haswell --mcpu=skylake myapp.mojo
```

```output
error: --target-cpu cannot be used with --march or --mcpu;
use either --target-cpu/--target-features or --march/--mcpu/--mtune
```

Source: <https://mojolang.org/docs/tools/compilation/>.

Also documented: when cross-compiling with Mojo target flags, set
`--target-cpu` along with `--target-triple`, because the CPU otherwise defaults
to the host processor and may be invalid for the target architecture.

### Inspection flags

| Flag | Prints |
|------|--------|
| `--print-effective-target` | The effective target configuration after absorbing all flags, then exits. |
| `--print-supported-targets` | All available target names. |
| `--print-supported-cpus` | Valid CPU names for the target (requires `--target-triple`). |
| `--print-supported-accelerators` | All supported GPU/accelerator architectures. |

Example effective target:

```output
Effective target configuration:
  --target-triple arm64-apple-darwin25.3.0
  --target-cpu apple-m4
  --target-features +aes,+bf16,+complxnum,+crc,+dotprod,+fp-armv8,...
  --target-accelerator metal:4
```

Source: <https://mojolang.org/docs/tools/compilation/>.

## The compiler-managed defines in one table

| Define | Flag | Type | Values |
|--------|------|------|--------|
| `__OPTIMIZATION_LEVEL` | `-O` / `--optimization-level` | `Int` | `0`–`3` (default `3`) |
| `__DEBUG_LEVEL` | `-g` / `--debug-level` | `String` | `"line-tables"`, `"full"` (absent if `-g` omitted) |
| `__SANITIZE_ADDRESS` | `--sanitize=address` | `Int` | `0` (default), `1` |
| `ASSERT` | `-D ASSERT=<value>` | `String` | `none`, `safe` (default), `all`, `warn` |

Other than `ASSERT`, "each is populated by the compiler from a driver flag. Use
the driver flag rather than `-D` so the define matches the compiler's behavior."
Source: <https://mojolang.org/docs/tools/feature-toggles/>.

> **Note — do not confuse Mojo asserts with MAX runtime debug levels.** "The MAX
> runtime defines its own assertion system through the
> `MODULAR_DEBUG=assert-level=...` environment variable, with levels such as
> `none`, `warn`, `safe`, and `all`. … The two systems are independent." Source:
> <https://mojolang.org/docs/tools/feature-toggles/>.

## Build profiles: a practical set

These are combinations of documented flags, grouped by intent.

| Profile | Flags | Effect |
|---------|-------|--------|
| **Release (default)** | none | `-O3`, no debug info, no sanitizers. |
| **Debuggable** | `-g -O0` | Full debug info, no optimization. |
| **Assert-heavy debug** | `-g -O0 -D ASSERT=all` | Runs every `debug_assert()`. |
| **Warnings-as-errors CI** | `--Werror` | Any warning fails the build. |
| **Address sanitizer** | `--sanitize=address` | Memory-error checks (`__SANITIZE_ADDRESS=1`). |
| **Thread sanitizer** | `--sanitize=thread` | Multi-threading checks (no define injected). |
| **Strict IEEE floats** | `--fp-mode contract=off` | Disables FMA contraction across statements. |
| **Cross object file** | `--target-triple … --target-cpu … --emit object` | Relocatable object for another platform. |

The "release (default)" row is the official statement: "A typical release build
requires no special flags. Running `mojo app.mojo` uses `-O3`, emits no debug
info and disables sanitizers." Source:
<https://mojolang.org/docs/tools/feature-toggles/>.

## Pitfalls

- **Expecting `-g` to enable `debug_assert()`.** It does not; assertions are
  controlled by `-D ASSERT` and are independent of `-g` and `-O`. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **Reading `__OPTIMIZATION_LEVEL` directly instead of via `std.sys.compile`.**
  The documented access path is `OptimizationLevel.level` and `DebugLevel.level`.
  Source: <https://mojolang.org/docs/tools/feature-toggles/>.
- **Using `-D O=2` instead of `-O`.** Compiler-managed defines are populated
  from driver flags; "use the driver flag rather than `-D` so the define matches
  the compiler's behavior." Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **Mixing target-flag families.** `--target-cpu`/`--target-features` with
  `--march`/`--mcpu`/`--mtune` is an error. Source:
  <https://mojolang.org/docs/tools/compilation/>.
- **Omitting `--target-cpu` when cross-compiling.** The host CPU default is
  likely invalid for the target. Source:
  <https://mojolang.org/docs/tools/compilation/>.
- **Assuming all `--emit` values cross-compile.** `exe` and `shared-lib` "fail at
  the link step when cross-compiling"; link with a target toolchain instead.
  Source: <https://mojolang.org/docs/tools/compilation/>.
- **Passing compiler flags after the filename.** On `mojo run`, everything after
  the path is a program argument. Put flags first. Source:
  <https://mojolang.org/docs/cli/run/>.
- **Treating `--warn-on-unstable-apis` as a quality gate.** The stable API set is
  deliberately small; the docs currently do not recommend it. Source:
  <https://mojolang.org/docs/api-docs/stability/>.
- **`--experimental-fixit` can lose data.** "highly experimental and may result
  in irreversible data loss"; prefer `--experimental-export-fixit`. Source:
  <https://mojolang.org/docs/cli/build/>.
- **Debug info has known gaps.** "there are issues when generating debug info
  for some Mojo programs." Source: <https://mojolang.org/docs/cli/run/>.

## See also

- [Feature toggles](feature-toggles.md) — `-D` in full, with every reader
  function and the platform-detection API.
- [`mojo build`](../cli/build.md) and [`mojo run`](../cli/run.md) — the complete
  option tables.
- [Formatter and linter](formatter-and-linter.md) — the warning flags in a
  quality-gate context.
- [Debugging and profiling](debugging-and-profiling.md) — using `-O0 -g`.
- [Testing](testing.md) — running a suite with these flags.
- [CI](../project/ci.md) — pinning a compiler version and running the gates.

## Sources

- Compilation targets: <https://mojolang.org/docs/tools/compilation/>
- Compilation feature toggles: <https://mojolang.org/docs/tools/feature-toggles/>
- `mojo build`: <https://mojolang.org/docs/cli/build/>
- `mojo run`: <https://mojolang.org/docs/cli/run/>
- Mojo FAQ (AOT compilation): <https://mojolang.org/docs/faq/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- `std.sys.defines`: <https://mojolang.org/docs/std/sys/defines/>
- Debugging (`-O0 -g` recipe): <https://mojolang.org/docs/tools/debugging/>
- Mojo v1.0.0b1 release notes (GPU bounds checking):
  <https://mojolang.org/releases/v1.0.0b1/>
- Keywords reference (`assert` gating):
  <https://mojolang.org/docs/reference/keywords/>
- Mojo v0.26.2 release notes (pre-1.0 `assert` statement wording, version
  history only): <https://mojolang.org/releases/v0.26.2/>
