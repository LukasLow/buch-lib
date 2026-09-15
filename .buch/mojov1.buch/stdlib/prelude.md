# prelude

`prelude` is the part of the standard library that is **already in scope** in
every Mojo program. You never import it.

> Standard library prelude: fundamental types, traits, and operations
> auto-imported.

> This package's contents form the basic vocabulary of Mojo programming that
> every developer uses. It is implicitly imported to every Mojo program.

> The `prelude` package contains the core types, traits, and functions that are
> automatically imported into every Mojo program. It provides the foundational
> building blocks of the language including basic types (Int, String, Bool),
> essential traits (Copyable, Movable, Equatable), memory primitives (Pointer,
> Span), and common operations (print, len, range). This package defines the
> default namespace that makes Mojo code immediately usable without explicit
> imports.

Source: <https://mojolang.org/docs/std/prelude/>.

That description is the whole package page: `prelude` is a *re-export* layer, not
a new set of implementations. It gathers symbols from [`builtin`](builtin.md),
[`collections`](collections.md), [`traits`](traits.md), [`memory`](memory.md) and
other packages into the namespace every file starts with.

## The practical rule

If a name appears in ordinary Mojo code without an import, it came from the
prelude (or is a language built-in). Concretely, the following are available
with no `from ... import`:

| Category | Names the official description names |
|----------|--------------------------------------|
| Basic types | `Int`, `String`, `Bool` |
| Essential traits | `Copyable`, `Movable`, `Equatable` |
| Memory primitives | `Pointer`, `Span` |
| Common operations | `print`, `len`, `range` |

Source: <https://mojolang.org/docs/std/prelude/>.

The stdlib overview adds the containers that also arrive without an import:
`List`, `Dict`, `Optional`, and the functions `sort`, `reversed` and `swap`.
Source: [Standard library overview](overview.md), which states the rule as:

> The practical rule: types and functions you see in every Mojo program — `Int`,
> `String`, `Bool`, `List`, `Dict`, `Optional`, `Span`, `print()`, `len()`,
> `range()`, `sort()`, `reversed()`, `swap()` — need no import.

## What the prelude brings in

`prelude` re-exports from the packages that own the implementations. The
important consequence for reading this book: a page under `stdlib/` may document
a type that you already had in scope.

| Layer | Owner package | What reaches you through the prelude |
|-------|---------------|--------------------------------------|
| Language foundation | [`builtin`](builtin.md) | `Int`, `UInt`, `Bool`, `SIMD`, `DType`, `Tuple`, `StringLiteral`, `NoneType`, `Error`, `len`, `range`, `sort`, `reversed`, `swap`, `hex`/`oct`/`bin`, `materialize`, plus the comparison/conversion traits. |
| Core data types | [`collections`](collections.md) | `List`, `Array`, `Dict`, `Optional`, `String`, `StringSpan`, `Span`. |
| Lifetime and value traits | [`traits`](traits.md) | `AnyType`, `Deinitable`, `Movable`, `Copyable`, `ImplicitlyCopyable`. |
| Memory | [`memory`](memory.md) | `Pointer`, `Allocation`, `alloc`/`dealloc` and the unsafe memory APIs. |
| Reflection | [`reflection`](reflection.md) | `reflect[T]`, the `comptime` alias for `Reflected[T]`. |
| I/O | [`io`](io.md) | `print`, `input`, and `open`/`FileHandle`. |

Sources: <https://mojolang.org/docs/std/prelude/>,
<https://mojolang.org/docs/std/builtin/>,
<https://mojolang.org/docs/std/io/io/>,
<https://mojolang.org/docs/std/reflection/>.

The `print`, `len`, `range` and `open` entries are described in their own
packages as built-ins:

> These are Mojo built-ins, so you don't need to import them.

Source: <https://mojolang.org/docs/std/io/io/>. `reflect` is explicit about it too:
"`reflect` is auto-imported via the prelude, so it is available without an
explicit import." Source: <https://mojolang.org/docs/std/reflection/reflect/>.

## `prelude` versus `builtin`

The two are easy to confuse, and the distinction is worth holding onto:

- **[`builtin`](builtin.md)** is the *implementation layer*. It "defines the
  core vocabulary of Mojo programming" and is itself implicitly imported.
  Source: <https://mojolang.org/docs/std/builtin/>.
- **`prelude`** is the *namespace layer*. It is the default namespace assembled
  from `builtin` plus `collections`, `traits`, `memory`, `reflection` and `io`.

In day-to-day code the difference rarely matters: you use both without an
import. It matters when you read the documentation, because the same symbol
(`String`, for example) is described on the `builtin` or `collections` page while
being available from the prelude.

## What is *not* in the prelude

Names that need an explicit import are the ones agents most often get wrong.
The classic traps:

- **`Set`** — the literal `{1, 2, 3}` is core display syntax, but the type
  `Set[Int]` requires `from std.collections import Set`.
- **`Variant`** — `from std.utils import Variant`.
- **`Path`** — `from std.pathlib import Path`.
- **`Ordering`/`Atomic`**, **`Logger`**, **`Bencher`**, **`TestSuite`**, and the
  `testing` assertion helpers all require imports from their packages.

See [`collections`](collections.md) and [`utils`](utils.md) for the full
import-path tables.

### A runnable example

Everything below is in scope with no import at all:

```mojo
def main():
    var numbers: List[Int] = [3, 1, 2]   # List and list literal
    sort(numbers)                        # builtin function
    print(numbers)                       # print, no import

    var maybe = Optional(1)              # Optional
    if maybe:
        print(maybe.value())

    print(len(numbers))                  # len
    for i in range(2):                   # range
        print(i)
```

Every one of `List`, `sort`, `print`, `Optional`, `len` and `range` resolves
without an import. The `from std.…` lines you see in other pages exist because
those pages document symbols that the prelude does *not* carry.

## Idioms

- **Do not import the prelude.** Writing `from std.prelude import Int` is noise;
  the symbol is already in scope.
- **Do not import from `builtin` either.** It is implicit for the same reason.
- **Reach for the owner package when you need the import path.** To know whether
  a type is auto-imported, check whether it lives in `builtin` or `collections`;
  the prelude page itself lists no members.
- **Treat `reflect[T]` as free.** It is auto-imported, while `Reflected[T]` in a
  signature must be imported from `std.reflection`.
- **When in doubt, look at the package page.** The symbol's own page names the
  module and the import.

## Pitfalls

- **Assuming `prelude` defines its own APIs.** It re-exports; the authoritative
  member documentation lives on the owner package's pages.
- **Assuming everything in a package is auto-imported.** Only the curated
  prelude set is; `Set`, `Variant` and `Path` are not.
- **Importing a prelude symbol by module path and shadowing it.** A local
  declaration or an explicit import that collides with a prelude name is a
  compile error or a shadowing bug.
- **Confusing the display syntax with the type.** `{1, 2, 3}` and `[1, 2, 3]`
  build a `Set`/`Array` display, but naming `Set[T]` still needs an import.
- **Expecting one exhaustive list.** The official `prelude` page describes the
  package in prose; it does not enumerate members.

> **Open question:** the official `prelude` page describes the package by
> category and names only a representative set of symbols (`Int`, `String`,
> `Bool`, `Copyable`, `Movable`, `Equatable`, `Pointer`, `Span`, `print`, `len`,
> `range`). It publishes no complete member list, so this page's tables are a
> curated selection assembled from the owner packages' pages and the stdlib
> overview, not an upstream enumeration. Verify a specific symbol against its
> owner package page before depending on its presence in the prelude. Sources:
> <https://mojolang.org/docs/std/prelude/>,
> <https://mojolang.org/docs/std/>.

## Stability

The `prelude` package page shows **no `@stable(since=...)` marker**. Under the
standard-library rule — "We consider standard library APIs unstable unless
specifically marked stable" — the *re-export surface* is unstable by default.
The individual symbols inherit the stability of their owner: the traits
`AnyType`, `Deinitable`, `Movable`, `Copyable` and `ImplicitlyCopyable` are
stable in their entirety, and `Array`, `List`, `Span`, `String`, `Bool` and
`Optional` have one or more stable APIs. Sources:
<https://mojolang.org/docs/std/prelude/>,
<https://mojolang.org/docs/api-docs/stability/>,
<https://mojolang.org/releases/v1.0.0/>.

See [`traits`](traits.md) and [`collections`](collections.md) for the per-symbol
detail.

## Sources

- Mojo `prelude` package: <https://mojolang.org/docs/std/prelude/>
- Mojo standard library index: <https://mojolang.org/docs/std/>
- Mojo `builtin` package: <https://mojolang.org/docs/std/builtin/>
- Mojo `io.io` module (`print`, `input`): <https://mojolang.org/docs/std/io/io/>
- Mojo `reflect` module: <https://mojolang.org/docs/std/reflection/reflect/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
