# origin

`origin` defines the compile-time values that let Mojo track references.

> Defines Mojo's origin types.

> An origin is a compile-time value that names the variable a reference borrows
> from, and whether that reference permits mutation. The compiler uses origins to
> check that a reference never outlives the value it points to, enforce mutable
> exclusivity between references, and destroy values as soon as their last use.

> Most origins are inferred automatically—from `ref` arguments, from parametric
> types like `Pointer` and `Span`, or from `origin_of()`. Reach for `Origin` and
> its aliases (`ImmOrigin`, `MutOrigin`, `ImmUntrackedOrigin`,
> `MutUntrackedOrigin`, `ImmStaticOrigin`) when an API needs to name an origin
> explicitly.

Source: <https://mojolang.org/docs/std/origin/>.

For the conceptual background, see the memory chapter's
[Origin and borrowing](../memory/origin-and-borrowing.md) and the types chapter's
[Pointers and references](../types/pointers-and-references.md).

## `Origin`

```text
struct Origin[mut: Bool]
```

> This represents a origin reference for a memory value.

Source: <https://mojolang.org/docs/std/origin/Origin/>. The `mut` parameter
carries mutability: an immutable origin and a mutable origin are different
types, and the compiler uses that difference to enforce exclusivity.

## The origin aliases

| Alias | Meaning (from the docs) |
|-------|-------------------------|
| `ImmOrigin` | "Immutable origin reference type." |
| `MutOrigin` | "Mutable origin reference type." |
| `ImmUntrackedOrigin` | "An immutable origin the lifetime checker does not track." |
| `MutUntrackedOrigin` | "A mutable origin the lifetime checker does not track." |
| `ImmStaticOrigin` | "An origin for strings and other always-immutable static constants." |
| `UntrackedOrigin[*, mut: Bool]` | "An origin the lifetime checker does not track, because it aliases no existing value." |
| `OriginSet` | "A set of origin parameters." |
| `AnyOrigin[*, mut: Bool]` | "An origin that might access any memory value." |
| `UnsafeAnyOrigin[*, mut: Bool]` | "The universal origin: an unsafe origin that might alias any memory value." |

Source: <https://mojolang.org/docs/std/origin/>.

### Tracked vs untracked

The distinction is the useful part of the package:

> An untracked origin is the empty origin: it promises the reference aliases no
> value the compiler is managing, so there is nothing for the lifetime checker to
> track or extend. That is exactly the behavior you want when interfacing with
> memory from outside the Mojo program. For example, the pointer returned by
> `alloc()` carries an untracked origin, because the allocated block aliases no
> Mojo-owned value.

Source: <https://mojolang.org/docs/std/origin/>.

So: a reference into a Mojo value gets a **tracked** origin (the compiler watches
its lifetime), while memory from outside the language — an allocation, a pointer
from C — gets an **untracked** one, because there is no Mojo value to track.

## `UnsafeAnyOrigin` — do not reach for it

The docs are unusually direct about this one:

> Because a reference with this origin might alias any live value, it forces the
> lifetime checker into its most conservative behavior, defeating the guarantees
> the origin system is meant to provide:
>
> - It extends unrelated lifetimes. Every other value in scope is kept alive for
>   as long as the reference is live, even values it never points to, effectively
>   halting ASAP destruction.
> - It hides unused-variable warnings ...
> - It disables mutable exclusivity checking ...

> **Safety:** This is a temporary compiler escape hatch from Mojo's early days,
> not a capability to reach for. It will never be stabilized and is slated for
> deprecation and removal.

Source: <https://mojolang.org/docs/std/origin/>.

Treat any use of `UnsafeAnyOrigin` (or `as_unsafe_any_origin()` on a
[`Pointer`](memory.md)) as a migration task, not a design choice.

## Naming an origin in an API

When your own function returns a reference, it can name the origin it borrows
from. The function-declarations reference shows the syntax:

```mojo
def get_first[T: Copyable](ref data: List[T]) -> ref[data[0]] T:
    return data[0]
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

Library types expose origin parameters the same way. For example `Span` is
parameterized on `origin: Origin[mut=mut]`, and `StringSpan` is a specialization
with an immutable static origin.

```mojo
from std.memory.alloc import alloc, dealloc, Layout

def main():
    var allocation = alloc(Layout[Int](count=1))
    var ptr = allocation.unsafe_ptr()   # carries MutUntrackedOrigin
    ptr.unsafe_store(0, 42)
    print(ptr[unsafe_offset=0])         # 42
    dealloc(allocation^)
```

The allocation's origin is untracked, which is why the caller must keep the
`Allocation` alive until the pointer is done with — exactly the compile-time
error the memory package turns the use-after-free into.

## Idioms

- **Let origins be inferred.** Write `origin_of(x)` when you must name one; most
  APIs already do this for you.
- **Use `ImmStaticOrigin` for compile-time string constants** — that is what the
  `StringSpan[ImmStaticOrigin]` parameters on library APIs expect.
- **Use an untracked origin for foreign memory.** That is the documented meaning:
  no Mojo value is being aliased.
- **Return a reference with the origin of the thing it came from**
  (`ref[data[0]] T`), so the caller's lifetime checking is precise.
- **Read origins as part of a type's signature**, not as a runtime value. They
  appear in brackets and never affect execution.

## Pitfalls

- **Reaching for `UnsafeAnyOrigin` to silence an error.** It disables the checks
  you want: lifetimes, exclusivity and unused-variable warnings. Source:
  <https://mojolang.org/docs/std/origin/>.
- **Confusing `ImmUntrackedOrigin` with `ImmStaticOrigin`.** Untracked means "the
  checker is not watching"; static means "lives for the whole program".
- **Trying to use an origin as a runtime value.** Origins are compile-time only.
- **Assuming `AnyOrigin` is safe.** Its own aliases resolve to the unsafe
  universal origin (`ImmutAnyOrigin` and `MutAnyOrigin` are aliases of
  `ImmUnsafeAnyOrigin`/`MutUnsafeAnyOrigin`). Source:
  <https://mojolang.org/docs/std/origin/>.
- **Forgetting the `mut` parameter.** A mutable and an immutable origin are
  different types; a mismatch is a compile error, not a warning.

> **Open question:** the origin page marks `ImmUnsafeAnyOrigin` and
> `MutUnsafeAnyOrigin` as "an unsafe escape hatch slated for removal", and
> `ImmutAnyOrigin`/`MutAnyOrigin` as aliases of those unsafe origins. The
> migration path for code currently using them is not given on the page; verify
> against the `origin` package page and the lifetimes guide
> (<https://mojolang.org/docs/manual/values/lifetimes/>) before choosing a
> replacement.

## Stability

The `origin` package page and the `Origin` struct page show **no
`@stable(since=...)` marker** and no stability badge. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — these APIs are **unstable by default**. `UnsafeAnyOrigin` is
additionally documented as never being stabilized. Sources:
<https://mojolang.org/docs/std/origin/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `origin` package: <https://mojolang.org/docs/std/origin/>
- Mojo `Origin` struct: <https://mojolang.org/docs/std/origin/Origin/>
- Mojo function declarations reference: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo lifetimes guide: <https://mojolang.org/docs/manual/values/lifetimes/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
