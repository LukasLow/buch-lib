# `mojo build`

Builds an executable from a Mojo file.

## Synopsis

```
mojo build [options] <path>
```

## Purpose

> Compiles the Mojo file at the given path into an executable.
>
> By default, the executable is saved to the current directory and named the
> same as the input file, but without a file extension.

Source: <https://mojolang.org/docs/cli/build/>.

`mojo build` performs **ahead-of-time (AOT) compilation** (FAQ:
<https://mojolang.org/docs/faq/>). It is the command that produces a persistent
artifact; [`mojo run`](run.md) uses the same compilation pipeline but executes
immediately.

Example, from the manual's tutorial:

```bash
mojo build life.mojo   # writes ./life
./life
```

Source: <https://mojolang.org/docs/manual/get-started/>.

## Output options

These options exist only on `build` (not on `run`).

| Option | Meaning |
|--------|---------|
| `-o <PATH>` | Sets the path and filename for the executable output. By default it outputs to the current directory with the same name as the input and no extension. |
| `--emit <FILE_TYPE>` | The type of output file to generate (see the table below). |

### `--emit` values

| Value | Output | Notes |
|-------|--------|-------|
| `exe` | Executable binary (default). | |
| `shared-lib` | Shared (dynamic) library. | Used for Python extension modules and C/C++ callers. |
| `object` | A single object file. | Marked **EXPERIMENTAL**. |
| `llvm` | Unoptimized LLVM IR. | |
| `llvm-bitcode` | Bitcode of unoptimized LLVM IR. | |
| `asm` | Target assembly. | For GPU targets, also emits a sidecar per kernel alongside the host assembly: `.ptx` for NVIDIA, `.amdgcn` for AMD, `.ll` for Metal. |

Source: <https://mojolang.org/docs/cli/build/>.

The compilation-targets page adds which emit values work when
**cross-compiling**: outputs that need linking (`exe`, `shared-lib`) "fails at
the link step when cross-compiling", while `object`, `asm`, `llvm` and
`llvm-bitcode` work. "To produce a cross-compiled executable or shared library,
generate an object file and link it with a toolchain for your target platform."
Source: <https://mojolang.org/docs/tools/compilation/>.

### A shared library from Mojo (C ABI)

The documented recipe uses `--emit shared-lib`, the
[`@export`](../decorators/export.md) decorator and the `abi("C")` effect:

```sh
# Linux
mojo build mylib.mojo --emit shared-lib -o libmylib.so
# macOS
mojo build mylib.mojo --emit shared-lib -o libmylib.dylib
```

```mojo
from std.runtime import initialize_runtime

@export("parallel_sum")
def parallel_sum(n: Int64) abi("C") -> Int64:
    initialize_runtime()
    # ...
```

Two rules the page calls out:

- "Mark each function you want to call from the host with the `@export`
  decorator, giving it a name that's a valid C identifier and the `abi("C")`
  effect so it follows the C calling convention."
- When the host `main()` belongs to C/C++ rather than Mojo, the Mojo runtime is
  never initialized; exported functions that use runtime-dependent APIs (such as
  `parallelize()` or `TaskGroup`) then crash. Call `initialize_runtime()` before
  any runtime-dependent Mojo code. It "is idempotent and inexpensive when the
  runtime is already initialized".

Differences from a Mojo executable, quoted:

> - `sys.argv()` isn't populated with the host program's arguments.
> - The signal handler that prints a stack trace on a crash isn't installed.
> - The runtime, once initialized, remains alive until the process exits; there
>   is no API to shut it down.
> - The host program's dynamic loader must be able to locate the Modular
>   runtime libraries that the shared library depends on (for example, through
>   the rpath entries embedded in the shared library).

Source: <https://mojolang.org/docs/tools/compilation/>.

### Python libraries are not bundled

The single most important limitation:

> Beware that any Python libraries used in your Mojo project are not included in
> the executable binary, so they must be provided by the environment where you
> run the executable.

Source: <https://mojolang.org/docs/cli/build/>.

## Compilation options

Identical to [`mojo run`](run.md#compilation-options); the same table is
documented on both pages.

| Option | Meaning |
|--------|---------|
| `--optimization-level <LEVEL>`, `-O`, `--no-optimization (LEVEL=0)` | Optimization level 0–3. Default 3. |
| `-I <PATH>` | Append the path to the import search directories. |
| `-D <KEY=VALUE>` | Define a compile-time value readable through `std.defines`. `-Dfoo=42` yields `42`. |
| `--debug-level <LEVEL>`, `-g`, `-g0`, `-g1`, `-g2` | Debug info: `none`, `line-tables`, `full`. Default `none`; `-g`=`full`, `-g0`=`none`, `-g1`=`line-tables`, `-g2`=`full`. |
| `--num-threads <NUM>`, `-j` | Maximum compilation threads. Default 0 = all. |
| `--elaboration-error-include-prelude` | Show elaboration errors with prelude locations. |
| `--fp-mode <MODE>` | FP contraction: `contract=fast` (default) or `contract=off`. |

For what `-O`, `-g` and `-D` actually change, and how they interact with
`debug_assert()` and `-D ASSERT`, see
[compiler and flags](../tooling/compiler-and-flags.md) and
[feature toggles](../tooling/feature-toggles.md).

### Debugging a built binary

The debugging page gives the exact recipe: build with `-O0 -g` when the binary
is meant to be debugged.

> For best results, build with the `-O0 -g` command-line options when you build
> a binary that you intend to debug—this produces a binary with full debug info.

```sh
mojo build -O0 -g app.mojo -o app
mojo debug app            # debug the prebuilt binary
```

Source: <https://mojolang.org/docs/tools/debugging/>.

## Target options

Identical to [`mojo run`](run.md#target-options).

| Option | Meaning |
|--------|---------|
| `--target-triple <TRIPLE>` | Target triple; defaults to host. |
| `--target-cpu <CPU>` | Target CPU; defaults to host. |
| `--target-features <FEATURES>` | Target CPU features; defaults to host. |
| `--march <ARCHITECTURE>` | Architecture to generate code for. |
| `--mcpu <CPU>` | CPU to generate code for. |
| `--mtune <TUNE>` | CPU to tune code for. |
| `--target-accelerator <ACCELERATOR>` | GPU/accelerator architecture (e.g. `sm_90`, `gfx942`). |
| `--print-effective-target` | Print the effective target configuration and exit. |
| `--print-supported-targets` | Print all available target names and exit. |
| `--print-supported-cpus` | Print valid CPU names for the target and exit. Requires `--target-triple`. |
| `--print-supported-accelerators` | Print all supported GPU/accelerator architectures and exit. |

### Inspecting and choosing a target

The compilation-targets page documents this sequence. On an Apple M4 laptop the
effective target prints as:

```sh
mojo build --print-effective-target
```

```output
Effective target configuration:
  --target-triple arm64-apple-darwin25.3.0
  --target-cpu apple-m4
  --target-features +aes,+bf16,+complxnum,+crc,+dotprod,+fp-armv8,...
  --target-accelerator metal:4
```

```sh
mojo build --print-supported-targets
mojo build --print-supported-cpus --target-triple=aarch64-apple-macosx
mojo build --print-supported-accelerators
```

Cross-compiling to an object file:

```sh
mojo build --target-triple aarch64-unknown-linux-gnu \
           --target-cpu cortex-a72 \
           --emit object -o myapp.o myapp.mojo
```

GPU kernel compilation:

```sh
mojo build --target-accelerator=nvidia:sm_90 myapp.mojo   # NVIDIA H100
mojo build --target-accelerator=amdgpu:gfx942 myapp.mojo  # AMD MI300X
```

Two cautions the page states:

- "When cross-compiling with Mojo target flags, set `--target-cpu` with
  `--target-triple`. The CPU defaults to your host processor, which may not be
  valid for the target architecture." Omitting it produces an error such as
  `failed to create target info: unknown target CPU 'apple-m4'`.
- "Don't mix the two families": using `--target-cpu` or `--target-features` with
  `--march` or `--mcpu` in the same command is an error:
  `error: --target-cpu cannot be used with --march or --mcpu; use either
  --target-cpu/--target-features or --march/--mcpu/--mtune`.

Source: <https://mojolang.org/docs/tools/compilation/>.

## Compilation diagnostic options

Identical to [`mojo run`](run.md#compilation-diagnostic-options).

| Option | Meaning |
|--------|---------|
| `--diagnose-missing-doc-strings` | Emit diagnostics for missing/partial doc strings. |
| `--max-notes-per-diagnostic <INTEGER>` | Max notes per diagnostic. Default 10. |
| `--disable-builtins` | Do not use builtins when creating a package. |
| `--disable-warnings` | Do not print warning messages. |
| `--experimental-fixit` | Apply fix-its automatically and rerun. "may result in irreversible data loss." |
| `--experimental-export-fixit <YAML_FILE>` | Export fix-its to a clang-tidy YAML file. |
| `--Werror` / `--Wno-error` | Treat / do not treat warnings as errors. |
| `--warn-on-unstable-apis` | Warn on unstable stdlib APIs (the stable set is small). |
| `--ignore-incompatible-precompiled-file-errors` | Ignore incompatible precompiled-file load errors. |
| `--ignore-deprecated <NAME>` | Suppress the deprecation warning for a declaration. |

## Linker options

| Option | Meaning |
|--------|---------|
| `-Xlinker <ARG>` | Pass `ARG` to the linker. |
| `--lld-path <PATH>` | Override the `lld` linker path; takes precedence over `MODULAR_MOJO_MAX_LLD_PATH` and `mojo-max.lld_path`. |

If the bundled `lld` is the problem, `--lld-path` is the documented override.
Source: <https://mojolang.org/docs/cli/build/>.

## Experimental compilation options

| Option | Meaning |
|--------|---------|
| `--sanitize <CHECK>` | Runtime checks: `address` or `thread`. |
| `--shared-libasan` | Dynamically link the address-sanitizer runtime. Requires `--sanitize=address`. |
| `--debug-info-language <LANGUAGE>` | `Mojo` (default) or `C` in emitted debug info. |

### Sanitizers and GPU bounds checking

- `--sanitize=address` injects the compile-time define `__SANITIZE_ADDRESS=1`;
  `--sanitize=thread` does not inject a define (only `address` does). Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- GPU bounds checking is enabled with the assertion define, not with
  `--sanitize`: "Use `mojo build -D ASSERT=all` to enable bounds checking on
  GPU; use `-D ASSERT=none` to disable all asserts including CPU bounds
  checking." Source: <https://mojolang.org/releases/v1.0.0b1/>.

## Common options

| Option | Meaning |
|--------|---------|
| `--diagnostic-format <FORMAT>` | `text` (default) or `json`. |
| `--help`, `-h` | Displays help information. |
| `--help-hidden` | Displays help for hidden options. |

## Realistic invocations

**Ship a default-optimized binary.**

```bash
mojo build app.mojo                 # -> ./app
mojo build app.mojo -o bin/app      # explicit output
```

**Debug build.**

```bash
mojo build -O0 -g app.mojo -o app-debug
```

**Emit LLVM IR for inspection.**

```bash
mojo build --emit llvm -o app.ll app.mojo
```

**Emit host assembly plus GPU kernel sidecars.**

```bash
mojo build --emit asm --target-accelerator=nvidia:sm_90 kernel.mojo
```

**Build a C-callable shared library (Python extension module path).**

```bash
mojo build mojo_module.mojo --emit shared-lib -o mojo_module.so
```

The `mojo-from-python` manual page documents exactly this command as the manual
alternative to the Python import hook. Source:
<https://mojolang.org/docs/manual/python/mojo-from-python/>.

## Exit behaviour

- Success: the artifact is written and the command exits 0.
- Compile or link failure: a diagnostic is printed (text or JSON) and the
  command exits non-zero; `--Werror` also fails the build on warnings.

> **Open question:** the CLI reference does not publish an exit-code taxonomy
> for `mojo build`. It documents `--Werror`/`--Wno-error` (warning severity) and
> the diagnostic formats, but not distinct codes for compile vs. link failures.
> Treat non-zero as failure.

## Pitfalls

- **Python libraries are not embedded.** The binary "must be provided by the
  environment where you run the executable." Source:
  <https://mojolang.org/docs/cli/build/>.
- **Default output name can surprise you.** `mojo build life.mojo` writes `life`
  to the *current* directory, not next to the source. Use `-o` to be explicit.
  Source: <https://mojolang.org/docs/cli/build/>.
- **Cross-compiling `exe`/`shared-lib` fails at link.** Only object/asm/IR
  emission works cross-target without an external linker. Source:
  <https://mojolang.org/docs/tools/compilation/>.
- **Mixing `--target-cpu` with `--mcpu`/`--march` is an error.** Pick one flag
  family. Source: <https://mojolang.org/docs/tools/compilation/>.
- **`--emit object` is experimental.** The page marks it `(EXPERIMENTAL)`.
  Source: <https://mojolang.org/docs/cli/build/>.
- **Debug info has known gaps.** "there are issues when generating debug info
  for some Mojo programs." Source: <https://mojolang.org/docs/cli/build/>.
- **A shared library needs `initialize_runtime()` when called from C/C++.**
  Runtime-dependent APIs segfault otherwise. Source:
  <https://mojolang.org/docs/tools/compilation/>.
- **`--experimental-fixit` is destructive.** Use
  `--experimental-export-fixit` for reviewable fixes. Source:
  <https://mojolang.org/docs/cli/build/>.

## See also

- [`run`](run.md) — compile and execute in one step.
- [`precompile`](precompile.md) — the package equivalent of `build`.
- [`debug`](debug.md) — debugging the binary you just built.
- [Compiler and flags](../tooling/compiler-and-flags.md) — `-O`, `-g`, `-D`.
- [Feature toggles](../tooling/feature-toggles.md) — `-D ASSERT`.
- [CI](../project/ci.md) — `mojo build` as a pipeline gate.
- [Packaging and distribution](../project/packaging-and-distribution.md) —
  distributing what `build` produces.

## Sources

- `mojo build`: <https://mojolang.org/docs/cli/build/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Mojo CLI reference (single document): <https://mojolang.org/llms-cli.txt>
- Compilation targets: <https://mojolang.org/docs/tools/compilation/>
- Debugging (build with `-O0 -g`): <https://mojolang.org/docs/tools/debugging/>
- Calling Mojo from Python (shared-lib command):
  <https://mojolang.org/docs/manual/python/mojo-from-python/>
- Get started with Mojo (build-and-run pair):
  <https://mojolang.org/docs/manual/get-started/>
- Compilation feature toggles: <https://mojolang.org/docs/tools/feature-toggles/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0b1 release notes (GPU bounds checking):
  <https://mojolang.org/releases/v1.0.0b1/>
