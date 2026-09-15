# compile

`compile` compiles individual Mojo functions at runtime and lets you inspect the
result.

> Runtime function compilation and introspection: assembly, IR, linkage,
> metadata.

> The `compile` package exposes functionality for compiling individual Mojo
> functions and examining their low-level implementation details. It enables
> inspecting generated code, obtaining linkage information, and controlling
> compilation options at runtime. This package provides tools for
> metaprogramming, debugging, and understanding how Mojo code compiles.

The official page names the use cases directly:

> - Inspecting assembly, LLVM IR, or object code output
> - Getting linkage names and module information
> - Examining function metadata like captures
> - Writing compilation output to files
> - Controlling compilation options and targets

Source: <https://mojolang.org/docs/std/compile/>.

## The API

The package has one module, `compile`, exposing `CompiledFunctionInfo` and
`compile_info`.

```text
struct CompiledFunctionInfo
```

> Contains compilation information and results for a function.

Source: <https://mojolang.org/docs/std/compile/compile/CompiledFunctionInfo/>.

```text
def compile_info[...]()
```

> Compiles a function and returns detailed compilation information.

Source: <https://mojolang.org/docs/std/compile/compile/compile_info/>.

## The documented example

The package page shows the intended shape: pass the function as a **parameter**,
then read the fields of the returned info object.

```mojo
from std.compile import compile_info

def my_func():
    print("Hello")

# Get assembly for the function
info = compile_info[my_func]()
print(info.asm)
```

Source: <https://mojolang.org/docs/std/compile/>.

Note the bracket form `compile_info[my_func]()`: the function being compiled is a
compile-time parameter, which is what makes the result available at compile time.

## Idioms

- **Treat `compile_info` as a debugging and analysis tool.** It is for looking at
  what the compiler produced, not for normal program logic.
- **Pass the function as a parameter.** `compile_info[my_func]()` follows the
  Mojo parameter-versus-argument rule; the function is a compile-time input.
- **Read `.asm` for the most direct view.** The package description places
  assembly first in its list of inspectable outputs.
- **Combine with [`reflection`](reflection.md)** for names and signatures:
  `get_function_name` / `get_linkage_name` live in `std.reflection`, while
  `compile` gives you the compiled artifact.

## Pitfalls

- **Expecting this to be a runtime JIT for arbitrary strings.** The documented
  API compiles a *function* and returns information about it; it is not a
  general "evaluate this source" entry point.
- **Assuming the exact field set.** The package page shows `.asm`; the full
  `CompiledFunctionInfo` member list is documented on the struct page, which is
  the authoritative source for additional fields.
- **Using it in a hot path.** Compilation is expensive and belongs in tooling,
  tests and one-off analysis.
- **Assuming a stable API.** See below.

> **Open question:** the official package Markdown documents `compile_info`
> only through the example (`info.asm`) plus a one-line description. The complete
> signature — its parameters, options, and the full field list of
> `CompiledFunctionInfo` (IR, object code, linkage, metadata, file output) — is
> not reproduced in the package page. Read
> <https://mojolang.org/docs/std/compile/compile/CompiledFunctionInfo/> and
> <https://mojolang.org/docs/std/compile/compile/compile_info/> before relying on
> a specific option or field.

## Stability

The `compile` package page and its module page show **no `@stable(since=...)`
marker** and no stability badges. Under the standard-library rule — "We consider
standard library APIs unstable unless specifically marked stable" — these APIs
are **unstable by default**, which is especially likely for a package that
exposes compiler internals. Sources: <https://mojolang.org/docs/std/compile/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `compile` package: <https://mojolang.org/docs/std/compile/>
- Mojo `compile` module: <https://mojolang.org/docs/std/compile/compile/>
- Mojo `CompiledFunctionInfo`: <https://mojolang.org/docs/std/compile/compile/CompiledFunctionInfo/>
- Mojo `compile_info`: <https://mojolang.org/docs/std/compile/compile/compile_info/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
