# sys

`sys` is the low-level system package: command-line arguments, hardware and
target queries, compiler intrinsics, compile-time `-D` defines, compile
information, the debug hook, and process exit.

> System runtime: I/O, hardware info, intrinsics, compile-time utils.

> The `sys` package provides low-level access to system functionality and
> runtime information. It includes tools for interacting with the operating
> system, querying hardware capabilities, and accessing compiler intrinsics. This
> package bridges Mojo code and the underlying system environment.

> Use this package for system-level programming, hardware-specific optimizations,
> or when you need direct access to platform capabilities and compiler features.
> For foreign function interface (FFI) functionality, use the `ffi` module.

Source: <https://mojolang.org/docs/std/sys/>.

Because the package is broad, this page is a **curated selection**: it covers the
modules and the members an agent actually reaches for, not every intrinsic.
The source list at the end points at the complete pages.

## Modules

| Module | Contents |
|--------|----------|
| `arg` | `argv()` — command-line arguments. |
| `info` | `CompilationTarget`, `size_of`, `align_of`, `bit_width_of`, SIMD width helpers, core counts, accelerator queries. |
| `intrinsics` | Optimizer hints and low-level memory/SIMD primitives. |
| `defines` | `is_defined`, `get_defined_*`, `MOJO_VERSION`, `MojoVersion`. |
| `compile` | `DebugLevel`, `OptimizationLevel`, `SanitizeAddress`, `codegen_unreachable`. |
| `terminate` | `exit()`. |
| `debug` | `breakpointhook()`. |

Source: <https://mojolang.org/docs/std/sys/>.

Note the ownership split: `getenv`/`setenv` live in [`os`](os.md), not `sys`, and
C interop lives in [`ffi`](ffi.md).

## `arg` — command-line arguments

```text
def argv() -> Span[StringSpan[ImmStaticOrigin], ImmStaticOrigin]
```

> Gets the list of command line arguments given to the `mojo` CLI.

```mojo title="app.mojo"
from std.sys import argv

def main() raises:
    args = argv()
    for arg in args:
        print(arg)
```

```sh
mojo app.mojo "Hello world"
```

```output
app.mojo
Hello world
```

Source: <https://mojolang.org/docs/std/sys/arg/argv/>.

The returned `Span` borrows static storage: it is valid for the life of the
program, and element type is `StringSpan` (a view, not an owned `String`).

The [`testing`](testing.md) `TestSuite` reads its `--skip`/`--only`/`--skip-all`
flags from these arguments by default.

## `info` — target, hardware and type sizes

The `info` module is the one agents use most:

> You can import these APIs from the `sys` package. For example:
>
> ```mojo
> from std.sys import CompilationTarget
>
> print(CompilationTarget.is_x86())
> ```

Source: <https://mojolang.org/docs/std/sys/info/>.

### Type sizes

```text
def size_of[type: AnyType, target = _current_target()]() -> Int
def size_of[dtype: DType, target = _current_target()]() -> Int
def align_of[type: AnyType]() -> Int
def bit_width_of[type: AnyType]() -> Int
```

> Returns the size of (in bytes) of the type. The size includes any padding
> required by the type's alignment, so it is always a multiple of
> `align_of[type]()` and always matches the stride between adjacent elements of
> an array of the type.

Source: <https://mojolang.org/docs/std/sys/info/size_of/>.

```mojo
from std.sys import align_of, bit_width_of, size_of

def main():
    print(size_of[UInt8]() == 1)
    print(size_of[UInt16]() == 2)
    print(size_of[Int32]() == 4)
    print(size_of[Float64]() == 8)
    print(size_of[SIMD[DType.uint8, 4]]() == 4)
    print(align_of[Float64]())      # 8
    print(bit_width_of[Int32]())    # 32
```

Source: <https://mojolang.org/docs/std/sys/info/size_of/> (the `size_of`
example), <https://mojolang.org/docs/std/sys/info/> for the other names.

`size_of` is the tool for layout reasoning, but note the `Variant` warning in
[`utils`](utils.md): a type may niche-optimize its layout, so a size is not a
stability guarantee.

### Hardware and target queries

The `info` module exports:

| Group | Names |
|-------|-------|
| Core counts | `num_logical_cores()`, `num_physical_cores()`, `num_performance_cores()` |
| Endianness / word size | `is_32bit()`, `is_64bit()`, `is_little_endian()`, `is_big_endian()` |
| Accelerators | `has_accelerator()`, `has_amd_gpu_accelerator()`, `has_amd_rdna_gpu_accelerator()`, `has_apple_gpu_accelerator()`, `has_nvidia_gpu_accelerator()` |
| Compiler target | `is_gpu()`, `is_amd_gpu()`, `is_nvidia_gpu()`, `is_apple_gpu()`, `is_apple_m5()`, `is_triple(...)` |
| SIMD widths | `simd_width_of`, `simd_bit_width`, `simd_byte_width` |
| Misc | `platform_map`, `stdlib_plugin` |

Source: <https://mojolang.org/docs/std/sys/info/>.

`CompilationTarget` is the struct form of the target queries, "a struct that
provides information about a target architecture". Its static methods include
`is_x86()`, `is_linux()`, `is_macos()`, `is_apple_silicon()`,
`is_apple_m1()`…`is_apple_m5()`, `has_sse4()`, `has_avx()`, `has_avx2()`,
`has_avx512f()`, `has_fma()`, `has_vnni()`, `has_intel_amx()`, `has_neon()`,
`has_neon_int8_dotprod()`, `has_neon_int8_matmul()`, `is_neoverse_n1()`,
`default_compile_options()` and `unsupported_target_error[...]()`. Source:
<https://mojolang.org/docs/std/sys/info/CompilationTarget/>.

```mojo
from std.sys import CompilationTarget, num_logical_cores

def main():
    print("cores:", num_logical_cores())
    comptime if CompilationTarget.is_linux():
        print("target: Linux")
    elif CompilationTarget.is_macos():
        print("target: macOS")
    else:
        print("target: other")
```

Sources: <https://mojolang.org/docs/std/sys/info/num_logical_cores/>,
<https://mojolang.org/docs/std/sys/info/CompilationTarget/>.

These are **compile-time** predicates. The accelerator queries answer "was this
compiled for a machine with X", not "is there an X right now"; use them in
`comptime if`, as the manual's metaprogramming page does with
`has_accelerator()`. Source:
<https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

## `defines` — compile-time `-D` values

`defines` reads name/value pairs set on the command line with `-D`:

> You can use these functions to set parameter values or runtime constants based
> on name-value pairs defined on the command line. For example:
>
> ```mojo
> from std.sys import is_defined
>
> comptime float_type = DType.float32 if is_defined["FLOAT32"]() else DType.float64
>
> # Use `float_type` as a constant.
> ```
>
> And on the command line:
>
> ```
> mojo -D FLOAT32 main.mojo
> ```

Source: <https://mojolang.org/docs/std/sys/defines/>.

| Name | Purpose |
|------|---------|
| `is_defined[name]()` | "Return true if the named value is defined." |
| `get_defined_bool[name]()` | Boolean-valued define, with a default. |
| `get_defined_int[name]()` | Integer-valued define; compilation fails if undefined. |
| `get_defined_string[name]()` | String-valued define; compilation fails if undefined. |
| `get_defined_dtype[name]()` | `DType`-valued define, with a default. |
| `MOJO_VERSION` | `comptime` value — "The version of the Mojo language used for the current compilation." |
| `MojoVersion` | Struct with `major`, `minor`, `patch`. |

Source: <https://mojolang.org/docs/std/sys/defines/>,
<https://mojolang.org/docs/std/sys/defines/MojoVersion/>.

```mojo
from std.sys import is_defined, MOJO_VERSION

def main():
    comptime if is_defined["DEBUG"]():
        print("debug build")
    print(MOJO_VERSION.major, MOJO_VERSION.minor, MOJO_VERSION.patch)
```

Source: <https://mojolang.org/docs/std/sys/defines/>. See
[compiler and flags](../tooling/compiler-and-flags.md) for the `-D` option itself.

## `compile` — compilation settings

| Name | Meaning |
|------|---------|
| `OptimizationLevel` | "Represents the optimization level used during compilation." |
| `DebugLevel` | "Represents the debug level used during compilation." |
| `SanitizeAddress` | "True if address sanitizer is enabled at compile-time." |
| `codegen_unreachable[cond, msg, *extra]()` | "Compilation fails if cond is True and the caller of the function is being generated as runtime code." |

Source: <https://mojolang.org/docs/std/sys/compile/>,
<https://mojolang.org/docs/std/sys/compile/codegen_unreachable/>.

`codegen_unreachable` is the tool for making a provably-dead branch a hard error
in generated code, rather than silently mis-compiling it.

## `intrinsics` — optimizer hints and low-level primitives

The module is explicitly low-level:

> Defines intrinsics.

Source: <https://mojolang.org/docs/std/sys/intrinsics/>. The members split into
two groups.

**Optimizer hints** — these are the safe, portable ones:

| Function | Purpose |
|----------|---------|
| `likely(val)` | Hint that `val` is probably `True`. |
| `unlikely(val)` | Hint that `val` is probably `False`. |
| `expect(val, expected)` | Hint about the expected value of `val`. |
| `assume(cond)` | "Signals to the optimizer that the condition is always true." |
| `llvm_intrinsic[...]` | Call a named LLVM intrinsic. |

Source: <https://mojolang.org/docs/std/sys/intrinsics/>.

```mojo
from std.sys import likely, unlikely

def takes_fast_path(x: Int) -> Int:
    if likely(x > 0):
        return x
    if unlikely(x == Int.MIN):
        return 0
    return -x
```

Source: <https://mojolang.org/docs/std/sys/intrinsics/> (`likely`/`unlikely`
descriptions).

**Accelerator and SIMD primitives** — GPU/SIMD specific and not portable to host
CPU code: `ballot`, `masked_load`/`masked_store`, `gather`/`scatter`,
`compressed_store`, `strided_load`/`strided_store`, `prefetch`, `readfirstlane`,
`sendmsg`, `implicitarg_ptr`, plus the `Prefetch*` enums. Source:
<https://mojolang.org/docs/std/sys/intrinsics/>.

> **Curated selection:** the `intrinsics` module contains roughly twenty
> functions whose exact semantics depend on the target ISA. This page names them
> and covers the optimizer hints in detail; for the signature and constraints of
> a specific SIMD/GPU intrinsic, read its own page from the module index.
> Source: <https://mojolang.org/docs/std/sys/intrinsics/>.

## `terminate` and `debug`

```text
def exit()
def exit[intable: Intable](code: intable)
```

> Exits from Mojo. Unlike the Python implementation this does not raise an
> exception to exit.

Source: <https://mojolang.org/docs/std/sys/terminate/exit/>.

```text
def breakpointhook()
```

> Cause an execution trap with the intention of requesting the attention of a
> debugger.

Source: <https://mojolang.org/docs/std/sys/debug/breakpointhook/>. This is the
hook behind the built-in `breakpoint()` described in [`builtin`](builtin.md).

## Idioms

- **Use `argv()` for command-line input**; it is already on the import path as
  `from std.sys import argv`.
- **Put target checks in `comptime if`.** `is_linux()`, `has_avx2()` and friends
  are compile-time predicates; they can prune code before codegen.
- **Use `-D` plus `is_defined`/`get_defined_*` for build variants**, not runtime
  environment variables (those are `os.getenv`).
- **Use `size_of`/`align_of`/`bit_width_of` for layout reasoning** in generic
  code rather than hardcoded widths.
- **Use `likely`/`unlikely` sparingly** and only on measured hot branches.
- **Use `exit(code)` at the top level.** It is a hard exit, not an exception;
  cleanup code after it does not run.
- **Use `MOJO_VERSION` for version-conditional code**, though 1.x code should
  rarely need it.

## Pitfalls

- **Expecting `sys` to hold environment variables.** `getenv`/`setenv` are in
  [`os`](os.md).
- **Using `sys` for C interop.** That is [`ffi`](ffi.md).
- **Treating `has_*_gpu_accelerator()` as a runtime device probe.** They are
  compile-time queries about the build target.
- **Assuming `get_defined_int` has a default.** Unlike the bool/dtype variants
  (which take a default), the int and string variants fail compilation when the
  name is undefined. Source: <https://mojolang.org/docs/std/sys/defines/>.
- **Calling CPU-only accelerator intrinsics on the host.** `ballot`, `gather`
  and friends are target-specific.
- **Expecting `exit()` to unwind.** It exits immediately; destructors after the
  call do not run.
- **Caching `argv()` elements as `String`.** They are `StringSpan` views; copy
  to `String` if you need owned storage.
- **Assuming a stable API.** See below.

> **Open question:** the `sys` package page lists module-level responsibilities
> ("I/O, hardware info, intrinsics, compile-time utils") and mentions I/O, but
> none of its seven modules (`arg`, `compile`, `debug`, `defines`, `info`,
> `intrinsics`, `terminate`) is an I/O module; console and file I/O live in
> [`io`](io.md). It is unclear whether the "I/O" in the package summary refers to
> something else or is a stale description. Sources:
> <https://mojolang.org/docs/std/sys/>,
> <https://mojolang.org/docs/std/io/>.

## Stability

The `sys` package page, its module pages and its member pages show **no
`@stable(since=...)` marker** and no stability badges. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/sys/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `sys` package: <https://mojolang.org/docs/std/sys/>
- Mojo `arg` module: <https://mojolang.org/docs/std/sys/arg/>
- Mojo `argv` function: <https://mojolang.org/docs/std/sys/arg/argv/>
- Mojo `info` module: <https://mojolang.org/docs/std/sys/info/>
- Mojo `size_of`: <https://mojolang.org/docs/std/sys/info/size_of/>
- Mojo `CompilationTarget`: <https://mojolang.org/docs/std/sys/info/CompilationTarget/>
- Mojo `num_logical_cores`: <https://mojolang.org/docs/std/sys/info/num_logical_cores/>
- Mojo `defines` module: <https://mojolang.org/docs/std/sys/defines/>
- Mojo `is_defined`: <https://mojolang.org/docs/std/sys/defines/is_defined/>
- Mojo `MojoVersion`: <https://mojolang.org/docs/std/sys/defines/MojoVersion/>
- Mojo `compile` module: <https://mojolang.org/docs/std/sys/compile/>
- Mojo `codegen_unreachable`: <https://mojolang.org/docs/std/sys/compile/codegen_unreachable/>
- Mojo `intrinsics` module: <https://mojolang.org/docs/std/sys/intrinsics/>
- Mojo `terminate` module: <https://mojolang.org/docs/std/sys/terminate/>
- Mojo `exit` function: <https://mojolang.org/docs/std/sys/terminate/exit/>
- Mojo `debug` module: <https://mojolang.org/docs/std/sys/debug/>
- Mojo `breakpointhook`: <https://mojolang.org/docs/std/sys/debug/breakpointhook/>
- Mojo manual — Compile-time evaluation: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
