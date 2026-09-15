# Standard library overview

The Mojo standard library ships with the language. Its index page describes it
in one line:

> All the data types, structs, traits, functions, and other APIs included with
> Mojo.

Source: <https://mojolang.org/docs/std/>.

This overview explains how the 37 top-level packages are grouped, how to
navigate them, what the stability rule is, which packages are available without
an import, and what is *not* in the standard library.

## The package list

The official page lists **37** top-level packages:

`algorithm`, `atomic`, `base64`, `benchmark`, `bit`, `builtin`, `collections`,
`compile`, `complex`, `documentation`, `ffi`, `format`, `gpu`, `hashlib`, `io`,
`iter`, `itertools`, `logger`, `math`, `memory`, `origin`, `os`, `pathlib`,
`prelude`, `pwd`, `python`, `random`, `reflection`, `runtime`, `stat`,
`subprocess`, `sys`, `tempfile`, `testing`, `time`, `traits`, `utils`.

Source: <https://mojolang.org/docs/std/>. Each package has its own page in this
folder, named after the package: [`algorithm`](algorithm.md),
[`atomic`](atomic.md), [`base64`](base64.md), [`benchmark`](benchmark.md),
[`bit`](bit.md), [`builtin`](builtin.md), [`collections`](collections.md),
[`compile`](compile.md), [`complex`](complex.md),
[`documentation`](documentation.md), [`ffi`](ffi.md), [`format`](format.md),
[`gpu`](gpu.md), [`hashlib`](hashlib.md), [`io`](io.md), [`iter`](iter.md),
[`itertools`](itertools.md), [`logger`](logger.md), [`math`](math.md),
[`memory`](memory.md), [`origin`](origin.md), [`os`](os.md),
[`pathlib`](pathlib.md), [`prelude`](prelude.md), [`pwd`](pwd.md),
[`python`](python.md), [`random`](random.md), [`reflection`](reflection.md),
[`runtime`](runtime.md), [`stat`](stat.md), [`subprocess`](subprocess.md),
[`sys`](sys.md), [`tempfile`](tempfile.md), [`testing`](testing.md),
[`time`](time.md), [`traits`](traits.md), [`utils`](utils.md).

## The stability rule: unstable by default

This is the single most important thing to internalize before using any API in
this chapter.

> We consider standard library APIs unstable unless specifically marked stable.

> In source code, the `@stable(since="version")` decorator marks these APIs.

Source: <https://mojolang.org/docs/api-docs/stability/>.

So the default is **unstable**. An API is only stable when the documentation
explicitly says so:

- Stable structs and traits show a "Stable since <version>" label below the
  struct/trait name.
- Other stable API members show a version badge in the right margin (for
  example, "1.0.0").

Source: <https://mojolang.org/docs/api-docs/stability/>.

Two further rules apply to a stable struct:

- A stable struct's *signature* is stable; its members are stabilized
  separately. "Marking a struct stable means that the struct's *signature* is
  stable. It **doesn't** guarantee that any member APIs are stable."
- A stable struct's signature may still change by adding a new optional
  parameter with a default that matches the previous behavior — which can break
  code that explicitly unbinds all parameters with the ellipsis (`...`).

Source: <https://mojolang.org/docs/api-docs/stability/>.

Stability guarantees are **source-only**. "Stability guarantees apply to source
code only; the Mojo ABI is currently not stable." Source:
<https://mojolang.org/docs/api-docs/stability/>.

The 1.0.0 release notes name the stable set in practice: the traits
`Deinitable`, `Movable`, `Copyable` and `ImplicitlyCopyable` are stable in their
entirety; `Array` (formerly `InlineArray`), `List`, `Span`, `String`, `Bool` and
`Optional` have one or more stable APIs. Source:
<https://mojolang.org/releases/v1.0.0/>.

The compiler can warn per API: "When you invoke Mojo with the
`--warn-on-unstable-apis` flag, it issues a warning for each unstable API you
use." The docs do not currently recommend it "because the stable API set is
small." Source: <https://mojolang.org/docs/api-docs/stability/>.

Every package page in this folder states its own stability situation in a
**Stability** section. When the official docs do not show a marker, the page
says the API is unstable by default rather than guessing.

## `prelude` and `builtin` need no import

`prelude` is the package whose contents are automatically available:

> It is implicitly imported to every Mojo program.

> The `prelude` package contains the core types, traits, and functions that are
> automatically imported into every Mojo program. It provides the foundational
> building blocks of the language including basic types (Int, String, Bool),
> essential traits (Copyable, Movable, Equatable), memory primitives (Pointer,
> Span), and common operations (print, len, range).

Source: <https://mojolang.org/docs/std/prelude/>.

`builtin` is the layer beneath it, and is also implicit:

> This package is implicitly imported. It defines the core vocabulary of Mojo
> programming that every developer uses without thinking about imports.

Source: <https://mojolang.org/docs/std/builtin/>.

The practical rule: types and functions you see in every Mojo program — `Int`,
`String`, `Bool`, `List`, `Dict`, `Optional`, `Span`, `print()`, `len()`,
`range()`, `sort()`, `reversed()`, `swap()` — need no import. Everything else is
imported from its package, usually as `from std.<package> import <symbol>`.
`Set` and `Variant` are the classic traps: the *display* syntax exists in the
core language, but the *types* require an import.

See [`prelude`](prelude.md) and [`builtin`](builtin.md) for the details, and the
types chapter for the type-level view
([Types overview](../types/overview.md), [Collections](../types/collections.md)).

## The package taxonomy

The 37 packages fall into a handful of jobs. Use this table to find the right
package before opening its page.

| Job | Packages |
|-----|----------|
| Language foundation, always available | [`builtin`](builtin.md), [`prelude`](prelude.md), [`traits`](traits.md) |
| Core data types | [`collections`](collections.md), [`utils`](utils.md) |
| Iteration | [`iter`](iter.md), [`itertools`](itertools.md) |
| Numbers and bit math | [`math`](math.md), [`complex`](complex.md), [`bit`](bit.md), [`random`](random.md) |
| Text and encoding | [`format`](format.md), [`base64`](base64.md), [`hashlib`](hashlib.md) |
| Memory and ownership | [`memory`](memory.md), [`origin`](origin.md) |
| Files, OS and processes | [`io`](io.md), [`os`](os.md), [`pathlib`](pathlib.md), [`sys`](sys.md), [`tempfile`](tempfile.md), [`subprocess`](subprocess.md), [`stat`](stat.md), [`pwd`](pwd.md) |
| Performance and concurrency | [`algorithm`](algorithm.md), [`benchmark`](benchmark.md), [`time`](time.md), [`atomic`](atomic.md), [`runtime`](runtime.md), [`gpu`](gpu.md) |
| Testing and quality | [`testing`](testing.md) |
| Metaprogramming and introspection | [`reflection`](reflection.md), [`compile`](compile.md), [`documentation`](documentation.md) |
| Interop | [`python`](python.md), [`ffi`](ffi.md) |
| Diagnostics | [`logger`](logger.md) |

Two more entries from the official index are *packages*, not top-level ones:
`collections.string` (the string subpackage) and `os.path` (path functions). Both
are covered under their parent pages, [`collections`](collections.md) and
[`os`](os.md).

## A short reading order for an agent

1. [`prelude`](prelude.md) and [`builtin`](builtin.md) — what is always in scope.
2. [`collections`](collections.md) — the containers you use for most data.
3. [`iter`](iter.md) and [`itertools`](itertools.md) — how to loop over them.
4. [`format`](format.md) and [`io`](io.md) — how to print and read.
5. [`math`](math.md), [`bit`](bit.md), [`random`](random.md) — numeric work.
6. [`memory`](memory.md) and [`origin`](origin.md) — only when you need manual
   memory or a reference's lifetime.
7. [`testing`](testing.md) — to prove the code works.
8. [`os`](os.md), [`pathlib`](pathlib.md), [`subprocess`](subprocess.md),
   [`tempfile`](tempfile.md) — when the program touches the filesystem or a
   process.
9. [`python`](python.md) and [`ffi`](ffi.md) — when you cross a language
   boundary.
10. [`reflection`](reflection.md), [`compile`](compile.md),
    [`documentation`](documentation.md) — metaprogramming and API docs.

## What is *not* in the standard library: tensors and accelerators

There is **no `tensor` package and no `nn` package** at the standard-library top
level. Tensor and neural-network APIs live in the separate **MAX** package.
Source: <https://mojolang.org/docs/std/> (the package list) and
<https://mojolang.org/releases/v1.0.0/>.

Two related facts:

- `layout` is now bundled with MAX instead of Mojo, and some
  accelerator-related standard-library APIs moved to the `max` Mojo package.
  Source: <https://mojolang.org/releases/v1.0.0/>.
- The remaining GPU primitives stay in [`gpu`](gpu.md), but the kernel-launching
  interface does not: "Currently, the `DeviceContext` struct provides the
  interface for compiling and launching GPU kernels inside MAX custom
  operations." Source: <https://mojolang.org/docs/std/gpu/>.

So when a task involves tensors, `nn`, or launching kernels, the answer is
"that is MAX, not the Mojo standard library". The book's GPU page
([gpu and accelerators](../concurrency/gpu-and-accelerators.md)) explains the
split in context; [`gpu`](gpu.md) documents only what remains in `std.gpu`.

> **Open question:** the stdlib index page lists the 37 packages and the 1.0.0
> release notes state that `layout` and some accelerator APIs moved to MAX, but
> no official page enumerates the complete set of MAX-side replacements for the
> moved APIs. Verify each moved symbol against the MAX documentation before
> relying on a replacement.

## How to read a package page in this folder

Every package page here follows the same shape:

- **What it is for** — the job, quoting the package's own description.
- **What an agent actually uses** — the main types and functions with their
  signatures and at least one runnable 1.x example.
- **Idioms** — the way the package is meant to be used.
- **Pitfalls** — the failures that are easy to hit.
- **Stability** — whether the APIs are marked stable, with the
  `@stable(since=...)` evidence where the docs show it, or unstable by default.
- **Sources** — the official pages actually read.

Pages for large packages are an explicit **curated selection**, not an
exhaustive API dump: the official package has far more members than a reader needs
to work. When a page omits symbols, it says so; the source list still points at
the complete API page.

## Sources

- Mojo standard library index: <https://mojolang.org/docs/std/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo `prelude` package: <https://mojolang.org/docs/std/prelude/>
- Mojo `builtin` package: <https://mojolang.org/docs/std/builtin/>
- Mojo `gpu` package: <https://mojolang.org/docs/std/gpu/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
