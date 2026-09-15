# Feature toggles

Mojo lets you conditionally enable or disable behaviour at compile time. This
page is the complete guide, based on the official
[Compilation feature toggles](https://mojolang.org/docs/tools/feature-toggles/)
page, the [`std.sys.defines`](https://mojolang.org/docs/std/sys/defines/)
reference, and the [`std.sys.info`](https://mojolang.org/docs/std/sys/info/)
reference.

> Mojo provides several mechanisms for compile-time feature gating and
> configuration:
>
> - **Compile-time defines** (`-D` and `sys.defines`): pass values from the
>   command line into Mojo code
> - **Compile-time conditionals and platform detection** (`comptime if`,
>   `comptime assert`, `sys.info`): branch or halt compilation based on
>   compile-time conditions
> - **Debug and optimization gating** (`debug_assert()`): control debug-only
>   behavior and runtime checks

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

The `-D` flag on the CLI side is documented on
[`mojo run`](../cli/run.md), [`mojo build`](../cli/build.md),
[`mojo debug`](../cli/debug.md), and every other compiling command.

## Compile-time conditionals

### `comptime assert` — compile-time preconditions

`comptime assert` halts compilation when its condition evaluates to `False`:

> Unlike a runtime assertion, it executes during compilation and produces a
> compiler error with your message.

```mojo
from std.sys import is_gpu

def gpu_kernel():
    # Called from a CPU build
    comptime assert is_gpu(), "this function requires a GPU target"
    # ... GPU-specific code
```

Calling it from a CPU build produces:

```text
note: constraint failed: this function requires a GPU target
    comptime assert is_gpu(), "this function requires a GPU target"
    ^
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

Use it "to declare compile-time preconditions on parameters or compilation
targets." The manual's constraints page adds that after a `comptime assert`, the
asserted condition is known true for the rest of the scope
(<https://mojolang.org/docs/manual/metaprogramming/constraints/>). See also
[`assert`](../keywords/assert.md).

### `comptime if` — compile-time branching

> Use `comptime if` to select code paths at compile time. The condition must be
> *parameter-evaluable*, that is, the compiler must reason about it and it can
> depend on `comptime` values and parameter expressions.

Command:

```sh
mojo run -Dmode=release hello.mojo
```

Code:

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

`comptime if` is the branch; `-D` supplies the value. `comptime for` (used in
the notebooks examples) is the same idea over a compile-time sequence
(<https://mojolang.org/docs/tools/notebooks/>).

## Compile-time defines with `-D`

### Passing defines

```sh
mojo run -Dmode=release -Dverbose -Dmax_threads=8 hello.mojo

# or

mojo run -D mode=release -D verbose -D max_threads=8 hello.mojo
```

> You can write either `-Dkey=value` or `-D key=value`. Keys and values must be
> joined with `=`.

Supported forms:

- `-D KEY=VALUE` — the value is parsed as a string, integer, or boolean,
  "depending on which `get_defined_*[]()` function reads it";
- `-D KEY` — a flag with no value; `is_defined[]()` returns `True`;
- `-D KEY=42` — numeric values read with `get_defined_int[]()`.

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

> **All define names are compile-time `StaticString` parameters, not runtime
> strings.** So the name must be a compile-time parameter at the call site.

### `is_defined[name]()`

Returns `True` when `-D name` was passed, regardless of value. "It never
errors."

```mojo
from std.sys import is_defined

def main():
    comptime if is_defined["verbose"]():
        print("verbose mode enabled")
```

> `is_defined[name]()` is similar to C's `#ifdef`. It checks only whether a
> define exists. The value is ignored.

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

### `get_defined_bool[name, default=False]()`

Returns a `Bool`. It distinguishes "defined" from "truthy":

- values treated as `True`: `1`, `true`/`True`/`TRUE`, `on`/`On`/`ON`
- any other assigned string value returns `False`
- errors when the define does not provide a value

| Command | Compiler view | Result |
|---------|---------------|--------|
| `mojo -D verbose app.mojo` | `verbose` defined, no value | Error |
| `mojo -D verbose=on app.mojo` | `verbose="on"` | `True` |
| `mojo -D verbose=yes app.mojo` | `verbose="yes"` | `False` (`yes` is not recognized) |
| `mojo app.mojo` | define missing | `default` → `False` |

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

The page warns against `default=True`: "It reverses the meaning in a confusing
way: missing values become `True`, while present-but-non-truthy values such as
`-D verbose=banana` or `-D verbose=0` become `False`." Prefer `is_defined[]()`
when you mean presence.

### `get_defined_int[name]()` and the defaulted form

```mojo
from std.sys import get_defined_int

def main():
    comptime threads = get_defined_int["max_threads"]()
    print(t"Up to {threads} threads")
```

> The parser accepts only base-10 integers. For example, `-D N=10` works.
> `-D N=0x10`, `-D N=0o10`, and `-D N=1_000` all fail at the
> `get_defined_int[]()` call site. … Non-integer values such as
> `-D max_threads=eight` fail the same way.

The defaulted form `get_defined_int[name, default]()` returns the default for a
**missing** define; "If the define exists but its value is not a valid integer,
compilation still fails." Source:
<https://mojolang.org/docs/tools/feature-toggles/>.

### `get_defined_string[name]()` and the defaulted form

```mojo
from std.sys import get_defined_string

def main():
    comptime mode = get_defined_string["mode"]()
    comptime if mode == "release":
        print("release build")
```

The defaulted form handles only an entirely missing define:

```mojo
from std.sys import get_defined_string

def main():
    comptime mode = get_defined_string["mode", "debug"]()
    comptime if mode == "release":
        print("release build")
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

### `get_defined_dtype[name, default]()`

Returns a `DType`; a default is required. Use it to parameterize numeric code:

```sh
mojo -D dtype=float8_e4m3fn -D ctype=bfloat16 app.mojo
```

```mojo
from std.sys import get_defined_dtype

def main() raises:
    comptime a_type = get_defined_dtype["dtype", DType.bfloat16]()
    comptime c_type = get_defined_dtype["ctype", DType.bfloat16]()
    matmul[a_type, c_type](a, b, c)
```

> Values are parsed by the standard library's internal `DType` parser, which
> expects canonical names such as `float16`, `bfloat16`, and `float8_e4m3fn`.
> Misspelled or aliased names such as `fp16` and `bf16` don't necessarily produce
> compile-time errors at the `get_defined_dtype[]()` call site.

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

### Why `-D` is not a preprocessor

> Unlike C-style `-D` flags, which produce preprocessor strings, Mojo treats
> `-D` values as first-class compile-time parameters in the type system.
>
> This allows the compiler to specialize code such as `matmul[]()` for every
> `DType` combination passed on the command line, without runtime branching.

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

## Platform and architecture detection with `sys.info`

`sys.info` provides compile-time, parameter-evaluable functions for branching on
compilation targets.

### OS detection

- `CompilationTarget.is_linux()`
- `CompilationTarget.is_macos()`

> Mojo does not currently support Windows targets natively, so there is no
> Windows detection API.

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

### CPU detection

- `CompilationTarget.is_x86()`
- `CompilationTarget.is_apple_silicon()`
- `CompilationTarget.is_apple_m1()` through `CompilationTarget.is_apple_m5()`

### Instruction-set detection

- `CompilationTarget.has_avx512f()`
- `CompilationTarget.has_neon()`

### GPU and accelerator detection

Check whether code is compiling **for** a specific accelerator:

- `is_nvidia_gpu()`
- `is_amd_gpu()`
- `is_apple_gpu()`
- `is_gpu()`

Check whether the **host system** has a detected accelerator:

- `has_accelerator()`
- `has_nvidia_gpu_accelerator()`
- `has_amd_gpu_accelerator()`
- `has_apple_gpu_accelerator()`

> The distinction matters:
>
> - `is_nvidia_gpu()` asks: "am I compiling for an NVIDIA GPU?"
> - `has_nvidia_gpu_accelerator()` asks whether NVIDIA GPU acceleration is
>   available.

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

Example:

```mojo
from std.sys import CompilationTarget

def compute():
    comptime if CompilationTarget.has_avx512f():
        print("AVX-512 path")
    elif CompilationTarget.is_apple_silicon():
        print("Apple Silicon path")
    else:
        print("generic path")
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

The `std.sys.info` reference lists the full function set, including
`is_32bit()`, `is_64bit()`, `is_big_endian()`, `is_little_endian()`, `is_triple()`,
`num_logical_cores()`, `num_physical_cores()`, `num_performance_cores()`,
`platform_map()`, `simd_bit_width()`, `simd_byte_width()`, `simd_width_of()`,
`size_of()`, `align_of()`, `bit_width_of()` and `stdlib_plugin()`
(<https://mojolang.org/docs/std/sys/info/>).

> To target a different platform, set the architecture, CPU, feature set, or
> accelerator from the command line.

Source: <https://mojolang.org/docs/tools/feature-toggles/>. See
[compiler and flags](compiler-and-flags.md) for the target flags.

## Built-in defines

Mojo provides several built-in defines. "Other than `ASSERT`, each is populated
by the compiler from a driver flag. Use the driver flag rather than `-D` so the
define matches the compiler's behavior."

| Define | Flag | Type | Values |
|--------|------|------|--------|
| `__OPTIMIZATION_LEVEL` | `-O` / `--optimization-level` | `Int` | `0`, `1`, `2`, `3` (default `3`) |
| `__DEBUG_LEVEL` | `-g` / `--debug-level` | `String` | `"line-tables"`, `"full"` |
| `__SANITIZE_ADDRESS` | `--sanitize=address` | `Int` | `0` (off, default), `1` (on) |

> If `-g` is omitted, `__DEBUG_LEVEL` is not injected; `DebugLevel.level`
> returns `"none"` as a library fallback.
>
> `--sanitize` also accepts `thread` (ThreadSanitizer), but only
> `--sanitize=address` injects a compile-time define.

Read them through `std.sys.compile` as `OptimizationLevel.level` (an `Int`),
`DebugLevel.level` (a `String`) and `SanitizeAddress` (a `Bool`). Source:
<https://mojolang.org/docs/tools/feature-toggles/>.

### `ASSERT` and `debug_assert()`

| Define | Flag | Type | Values |
|--------|------|------|--------|
| `ASSERT` | `-D ASSERT=<value>` | `String` | `none`, `safe` (default), `all`, `warn` |

Levels:

- `none`: disable all assertions
- `safe` (default in non-debug builds): only run assertions tagged
  `assert_mode="safe"`
- `all`: run every `debug_assert()` call
- `warn`: run every assertion, but emit warnings instead of aborting

```sh
mojo run -D ASSERT=all hello.mojo
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

Tagging convention:

```mojo
debug_assert[assert_mode="safe"](n >= 0,
    "nth: n must be non-negative",
)
```

- tag "constant-time checks such as bounds tests and integer comparisons" with
  `assert_mode="safe"`;
- leave "traversals, allocations, and more expensive invariant checks" untagged.

The plain `Bool` form always evaluates the condition, even when assertions are
disabled:

```mojo
debug_assert(len(data) > 0, "data must not be empty")
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

Caution: "`debug_assert()` is silently disabled on Apple GPU targets."

### Debug and optimization are independent

| Goal | Flag | Effect |
|------|------|--------|
| Emit full debug info (LLDB symbols) | `-g` / `--debug-level=full` | sets `__DEBUG_LEVEL="full"` |
| Emit line tables only | `-g1` / `--debug-level=line-tables` | sets `__DEBUG_LEVEL="line-tables"` |
| Disable optimization | `-O0` / `--no-optimization` | sets `__OPTIMIZATION_LEVEL=0` |
| Enable AddressSanitizer | `--sanitize=address` | sets `__SANITIZE_ADDRESS=1` |
| Enable all `debug_assert()` checks | `-D ASSERT=all` | independent of `-g` and `-O` |

A typical debug configuration:

```sh
mojo -g -O0 -D ASSERT=all app.mojo
```

> The `-g` and `-O` driver flags don't affect `debug_assert()`. If you want these
> behaviors together, pass each flag explicitly.

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

Release: `mojo app.mojo` uses `-O3`, emits no debug info and disables
sanitizers. The one exception is `debug_assert()`, whose default mode is `safe`,
so assertions tagged always-on still execute; pass `-D ASSERT=none` to disable
them (<https://mojolang.org/docs/tools/feature-toggles/>).

> **Note — MAX has its own assertion system.** "The MAX runtime defines its own
> assertion system through the `MODULAR_DEBUG=assert-level=...` environment
> variable, with levels such as `none`, `warn`, `safe`, and `all`. … The two
> systems are independent." Source:
> <https://mojolang.org/docs/tools/feature-toggles/>.

## `std.sys.defines` version value

The `defines` module also exposes a compile-time Mojo version:

```mojo
comptime MOJO_VERSION = MojoVersion()
```

"The version of the Mojo language used for the current compilation, available at
compile time." `MojoVersion` "represents the Mojo version as major, minor, and
patch numbers." Source: <https://mojolang.org/docs/std/sys/defines/>.

## A worked feature-toggle example

Combine the pieces: a `comptime` define selects behaviour, platform detection
picks a code path, and assertions are gated separately.

```mojo
from std.sys import get_defined_string, is_defined, is_gpu
from std.sys import CompilationTarget

def run_kernel():
    comptime assert is_gpu(), "run_kernel() requires a GPU target"
    # GPU code here

def main():
    comptime mode = get_defined_string["mode", "debug"]()

    comptime if mode == "release":
        # No debug-only checks in release.
        pass
    else:
        comptime if is_defined["verbose"]():
            print("verbose build")

    comptime if CompilationTarget.has_avx512f():
        print("AVX-512 path")
    elif CompilationTarget.is_apple_silicon():
        print("Apple Silicon path")
    else:
        print("generic path")
```

```sh
mojo run -Dmode=release app.mojo
mojo run -Dmode=debug -Dverbose app.mojo
mojo build --target-accelerator=nvidia:sm_90 gpu_app.mojo
```

Every construct above is documented:
<https://mojolang.org/docs/tools/feature-toggles/> and
<https://mojolang.org/docs/tools/compilation/>.

## Pitfalls

- **A missing define with a non-defaulted reader.** `get_defined_int[name]()`
  and `get_defined_string[name]()` fail compilation if the name is missing; use
  the two-parameter form or `is_defined[]()`. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **`get_defined_bool` and the word "yes".** Only `1`, `true`/`True`/`TRUE`,
  `on`/`On`/`ON` are truthy; `yes` returns `False`. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **`default=True` on `get_defined_bool`.** It inverts intuition; use
  `is_defined[]()` instead. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **Hex/octal/underscored integers.** Only base-10 is accepted by
  `get_defined_int[]()`; `0x10`, `0o10` and `1_000` fail. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **DType aliases.** `fp16`/`bf16` "don't necessarily produce compile-time errors
  at the `get_defined_dtype[]()` call site"; use canonical names. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **Treating `-D` as a preprocessor.** Define values are compile-time
  parameters in the type system; use `comptime` to consume them. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **Using `-D O=2` instead of `-O`.** Compiler-managed defines come from driver
  flags; use the flag. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **Expecting `-g`/`-O` to control `debug_assert()`.** They do not; use
  `-D ASSERT`. Source: <https://mojolang.org/docs/tools/feature-toggles/>.
- **`debug_assert()` on Apple GPU.** It is silently disabled there. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **Confusing `is_*` with `has_*_accelerator`.** `is_nvidia_gpu()` is about the
  compilation target; `has_nvidia_gpu_accelerator()` is about the host. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **No Windows detection API.** "Mojo does not currently support Windows targets
  natively, so there is no Windows detection API." Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **Confusing Mojo and MAX assertion systems.** `-D ASSERT` is Mojo;
  `MODULAR_DEBUG=assert-level=...` is MAX. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.

## See also

- [Compiler and flags](compiler-and-flags.md) — `-O`, `-g`, `-D ASSERT`,
  sanitizers and targets in one place.
- [`mojo run`](../cli/run.md), [`mojo build`](../cli/build.md) — the `-D` option
  tables.
- [`assert`](../keywords/assert.md) — the keyword, its gating, and the open
  question about a bare `assert`.
- [`comptime`](../keywords/comptime.md) — compile-time evaluation.
- [CI](../project/ci.md) — using toggles in a pipeline.

## Sources

- Compilation feature toggles: <https://mojolang.org/docs/tools/feature-toggles/>
- `std.sys.defines`: <https://mojolang.org/docs/std/sys/defines/>
- `std.sys.info`: <https://mojolang.org/docs/std/sys/info/>
- `mojo build`: <https://mojolang.org/docs/cli/build/>
- `mojo run`: <https://mojolang.org/docs/cli/run/>
- Compilation targets: <https://mojolang.org/docs/tools/compilation/>
- Comptime constraints and assertions (manual):
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>
- Mojo keywords reference (`assert` gating):
  <https://mojolang.org/docs/reference/keywords/>
- Jupyter notebooks (`comptime for`): <https://mojolang.org/docs/tools/notebooks/>
