# Stability guarantees

Mojo 1.0 did not just freeze the language; it published a *stability model* —
a written contract about which parts may change and how. The contract has one
dominant asymmetry that you must internalize:

> **The language is stable by default. The standard library is unstable by
> default.**

Everything else on this page follows from that asymmetry.

The stability page opens with its own caveat, which this page preserves rather
than hides:

> "This is an early and preliminary version of our stability discussion. We'll
> update this page as we finalize the Mojo 1.x stability model."
> — [stability](https://mojolang.org/docs/api-docs/stability/)

## The versioning contract

Mojo follows semantic versioning, but the scope of the promise is precise:

> "The Mojo language and standard library follow semantic versioning for
> language features and standard library APIs identified as stable."
> — [stability](https://mojolang.org/docs/api-docs/stability/)

The semver rules are quoted verbatim:

| Version kind | Rule (official wording) |
|--------------|-------------------------|
| Major (1.0, 2.0) | "Major versions (1.0, 2.0) can contain breaking changes that aren't backward-compatible." |
| Minor (1.1, 1.2) | "Minor versions (1.1, 1.2) can add new functionality in a backward-compatible way." |
| Patch (1.0.1, 1.2.1) | "Patch versions (1.0.1, 1.2.1) can contain bug fixes that are backward-compatible." |

Two limits qualify the whole contract:

1. **Source-only.** "Stability guarantees apply to source code only; the Mojo
   ABI is currently not stable." Recompiling is always expected; binary
   compatibility between versions is not promised.
2. **Escape hatches on both sides.** "Unstable features can change at any
   point." and "We may make exceptions to the stability policy if we discover a
   critical issue with a stabilized API."

## The standard library: unstable by default

This is the single most important fact for anyone writing Mojo against the
stdlib:

> "We consider standard library APIs unstable unless specifically marked
> stable. In source code, the `@stable(since="<version>")` decorator marks
> these APIs."
> — [stability](https://mojolang.org/docs/api-docs/stability/)

The `@stable(since="<version>")` decorator is the machine-readable marker. In
the API documentation the markers are rendered as:

- Stable structs and traits show a "Stable since *version*" label below the
  struct/trait name.
- Other stable API members show a *version* badge in the right margin.

### Struct stability is signature-only

Marking a struct stable does **not** stabilize its members:

> "Marking a struct stable means that the struct's *signature* is stable. It
> **doesn't** guarantee that any member APIs are stable. We stabilize member
> APIs on a case-by-case basis."
> — [stability](https://mojolang.org/docs/api-docs/stability/)

So "`List` is stable" is imprecise. The *type* is stable in its signature; you
still check each method's badge.

### The two documented exceptions

Even stable APIs may change in exactly two situations.

**1. Overload sets may evolve.**

> "For functions and methods, stabilizing one or more members of an overload set
> doesn't guarantee those exact members will continue to exist. The exact
> overload set may evolve, but it will continue to support the same inputs."

**2. New optional parameters may be added — and can break `...` unbinding.**

A new optional parameter with a behavior-matching default is backward-compatible
in most cases. But it "can break code that explicitly unbinds all parameters
using the ellipsis (`...`)". The stability page works the example in full:

```mojo
def callee(l: List[Int]):
    pass

def caller(l: List[Int, ...]):
    callee(l)
```

Since `List` has only one parameter, `List[Int, ...]` unbinds nothing; `List[Int]`
and `List[Int, ...]` are the same type. Now suppose `List` gains an optional
parameter:

```mojo
struct List[T: Movable, /, A: Allocator = DefaultAllocator]:
```

Then the code above no longer compiles. `List[Int, ...]` now unbinds `A`, so
`caller()` becomes parameterized on `A` and accepts a `List` with *any* `A`,
while `callee()` accepts only the default `A`. **Pitfall:** using `...` to mean
"all remaining parameters" is not future-proof for a stdlib type that may grow a
parameter.

### `--warn-on-unstable-apis` exists but is not recommended

Mojo has a flag that warns on unstable API use, and the same paragraph explains
why you should not rely on it yet:

> "When you invoke Mojo with the `--warn-on-unstable-apis` flag, it issues a
> warning for each unstable API you use. We don't currently recommend this
> because the stable API set is small."
> — [stability](https://mojolang.org/docs/api-docs/stability/)

So there is no practical automated "am I on stable APIs?" check in 1.0.0.

## The language: stable by default

The other half of the asymmetry:

> "A wide part of the Mojo language is stable. Most language constructs,
> including control flow, types, and ownership, are stable. As a rule, Mojo's
> lifetime and operator dunders such as `__add__()`, `__init__()`, and
> `__deinit__()` are stable."
> — [stability](https://mojolang.org/docs/api-docs/stability/)

The FAQ states the default rule directly:

> "We consider language features stable unless we explicitly identify them as
> experimental or unstable."
> — [FAQ](https://mojolang.org/docs/faq/)

### What is *not* covered: language internals

A small set of features exists "to support the compiler, the standard library,
or advanced metaprogramming". The docs treat them as implementation details:
they "may change or disappear without notice and don't have stability
guarantees".

Crucially, these **cannot be marked**:

> "Unlike standard library APIs, these language features *can't be marked* as
> stable or unstable and the compiler won't warn when you use them
> (`--warn-on-unstable-apis`)."
> — [stability](https://mojolang.org/docs/api-docs/stability/)

**Avoid any language feature with a leading double underscore (`__`)** unless
the manual explicitly documents it as stable. Documented examples of unsafe
prefixed keywords:

- `__mlir_type`
- `__mlir_op`
- `__mlir_attr`
- `__generator_type`

Rarely used dunder features that are "not yet stabilized" include
`__merge_with__()`, `__list_literal__`, and `__literal_size__`.

### Internal-use decorators to avoid

Some decorators exist only for migration, compiler implementation or stdlib
development. Avoid decorators named like:

- `@parameter`, `@__copy_capture` — legacy closure support
- `@__allow_legacy_custom_self_types`
- `@__name`
- `@__llvm_arg_metadata`
- `@__unsafe_nested_origins_read_only`

The rule to generalize: **"Consider any decorators beginning with `@__` as
internal and unstable, unless the manual explicitly documents them as public."**

### `async`/`await` is unstable

The async system is not finished, and the docs say so plainly:

> "Mojo's async system isn't fully built out. So although the `async` and
> `await` keywords aren't prefixed, consider them unstable as well. Any async
> behavior may be subject to change."
> — [stability](https://mojolang.org/docs/api-docs/stability/)

> **Open question — `async`/`await` are called keywords but are absent from the
> keyword reference.** The [keywords reference](https://mojolang.org/docs/reference/keywords/)
> does not list `async` or `await` at all, yet the stability page calls them
> keywords and the 1.0.0 release notes reference syntax "between the `async` and
> `def` keywords" ([v1.0.0](https://mojolang.org/releases/v1.0.0/)). The roadmap
> lists first-class `async` support as an unstarted item
> ([roadmap](https://mojolang.org/docs/roadmap/)). Treat them as unstable syntax,
> not as stable language features.

## The 1.x promise

1.0.0 is explicit that 1.x is not a freeze, it is a *slowdown*:

> "With Mojo 1.0 we're beginning to define the stability policies for the Mojo
> language and standard library. During the 1.x timeframe, changes should mostly
> be additive. We may still make breaking changes, but they'll be managed with
> care."
> — [v1.0.0](https://mojolang.org/releases/v1.0.0/)

The same page states: "most core language features are stable, meaning they
won't be removed or changed in ways that breaks source compatibility. And we've
*started* marking standard library APIs as stable, beginning with a deliberately
small set that we'll grow in subsequent releases."

## The first stable set (1.0.0)

The initial stable stdlib surface is deliberately small. The 1.0.0 notes list:

**Stable in their entirety (traits):**

- `Deinitable`
- `Movable`
- `Copyable`
- `ImplicitlyCopyable`

**Types with one or more stable APIs:**

- `Array` (formerly `InlineArray`)
- `List`
- `Span`
- `String`
- `Bool`
- `Optional`

("Formerly `InlineArray`" is the release note's own parenthetical.) Stable
status is marked per-API in the reference; see
[stability](https://mojolang.org/docs/api-docs/stability/) for how to read the
badges.

## Practical takeaway for an agent

The stability model translates into concrete behavior when you write Mojo:

1. **Prefer stable APIs, but do not assume "stable" extends to members.** Check
   the badge on the member, not on the containing struct. A stable struct's
   signature is stable; its methods are stabilized "on a case-by-case basis".
2. **Expect stdlib churn between minor versions.** The FAQ's own rule — stdlib
   is unstable unless marked — means a 1.1 upgrade can rename or reshape an
   unmarked API. This is by contract, not a defect.
3. **Pin the version.** Because the stable surface is small and the stdlib is
   otherwise moving, an agent-generated project should pin the exact Mojo
   version and upgrade deliberately, re-reading the release notes for the APIs
   it uses.
4. **Do not build on `__`-prefixed anything.** The compiler will not warn; the
   `--warn-on-unstable-apis` flag skips these, and they can vanish without
   notice.
5. **Treat `async`/`await` as unstable** even though they look like ordinary
   keywords.
6. **Avoid `...` in type applications** where the type may grow a parameter
   (the documented `List[T, ...]` trap).
7. **Re-read this page.** Its own header says it is preliminary; the model will
   be updated upstream.

## How this page maps to the rest of the buch

- For which version is current and what changed when, see
  [version history](version-history.md).
- For how to read the stable/unstable markers in an API signature, see
  [reading API docs](reading-api-docs.md).

## Sources

- https://mojolang.org/docs/api-docs/stability/
- https://mojolang.org/docs/faq/
- https://mojolang.org/docs/reference/keywords/
- https://mojolang.org/docs/roadmap/
- https://mojolang.org/releases/v1.0.0/
