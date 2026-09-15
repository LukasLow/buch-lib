# traits

`traits` is the package of Mojo's core lifetime and value-semantics traits:
`AnyType`, `Deinitable`, `Movable`, `Copyable` and `ImplicitlyCopyable`.

> Core object-lifetime and value-semantics traits.

> The `traits` package defines the stabilized traits that describe how Mojo
> values are created, copied, moved, and destroyed: `AnyType`, `Deinitable`,
> `Movable`, `Copyable`, and `ImplicitlyCopyable`. These traits are Mojo
> built-ins and are automatically imported into every Mojo program through the
> prelude.

Source: <https://mojolang.org/docs/std/traits/>.

Two facts follow from that wording, and they are the reason this page is short:

1. **Do not import them.** They are built-ins, re-exported by
   [`prelude`](prelude.md).
2. **They are stable.** This is the one stdlib package the 1.0.0 notes name as
   stabilized in its entirety.

The *concepts* — declaring traits, conformance, refinement, composition,
`where` constraints, and how these five traits fit the type system — are covered
in [Traits](../types/traits.md). This page is the package-level API reference:
the modules, the documented contract of each trait, and the stability status.

## Modules

| Module | Defines |
|--------|---------|
| `anytype` | `AnyType` |
| `deinitable` | `Deinitable` |
| `movable` | `Movable` |
| `copyable` | `Copyable` and `ImplicitlyCopyable` |

Source: <https://mojolang.org/docs/std/traits/>.

The official module pages state the "no import" rule explicitly:

> These are Mojo built-ins, so you don't need to import them.

Source: <https://mojolang.org/docs/std/traits/copyable/>.

## `AnyType` — the root trait

> [Stable since 1.0.0]
>
> The most basic trait that all Mojo types extend by default. All Mojo struct
> types always conform to `AnyType`. This trait imposes no requirements on the
> types that conform to it, not even that they provide a `__deinit__()` implicit
> destructor. A type that conforms to `AnyType` but not to `Deinitable` is called
> a linear type, also known as a non-`Deinitable` type. Generic code will commonly
> want to use `T: Deinitable` instead of `T: AnyType`.

Source: <https://mojolang.org/docs/std/traits/anytype/AnyType/>.

The same page explains *why* the root is this minimal: Mojo "does not require
that a type provide an implicitly-callable destructor function" — a type may
instead require the caller to invoke a named destructor. That makes linear types
(guards that force an explicit action, like `save_and_close(deinit self)`)
expressible:

```mojo
from std.pathlib import Path

struct FileBuffer(Deinitable where False):
    def __init__(out self, path: Path):
        pass  # open the file

    def write(self, data: Some[Writable]):
        pass  # buffered write

    def save_and_close(deinit self):
        pass  # flush and close

# ERROR: 'file' abandoned without being explicitly destroyed
# def write_greeting_to_file(var file: FileBuffer):
#     file.write("Hello there!")
#
# FIX: add `file^.save_and_close()`
```

Source: <https://mojolang.org/docs/std/traits/anytype/AnyType/>.

The key insight from that page: because `AnyType` has no destructor requirement,
"a type can choose to provide only named, explicitly-callable destructor
methods," and the compiler then refuses to drop such a value on the floor.

## `Deinitable` — automatic destruction

> [Stable since 1.0.0]
>
> A trait for types that require lifetime management through destructors. … It
> indicates that a type has a destructor that needs to be called when instances
> go out of scope. This is essential for types that own resources like memory,
> file handles, or other system resources that need proper cleanup.
>
> By default, all Mojo types implement `Deinitable`, unless they opt-in to
> required explicit named destructor methods using a `Deinitable where False`, or
> conditionally with `Deinitable where <cond>`.

Source: <https://mojolang.org/docs/std/traits/deinitable/Deinitable/>.

Required method:

```text
def __deinit__(deinit self)
```

Source: <https://mojolang.org/docs/std/traits/deinitable/Deinitable/>.

The documented example, complete:

```mojo
from std.memory.alloc import alloc, dealloc, Layout, Allocation

struct ResourceOwner(Deinitable):
    var allocation: Allocation[Int]

    def __init__(out self, size: Int):
        self.allocation = alloc(Layout[Int](count=size))

    def __deinit__(deinit self):
        # Clean up owned resources
        dealloc(self.allocation^)
```

Source: <https://mojolang.org/docs/std/traits/deinitable/Deinitable/>.

Three rules from that page:

- "Any type with an implicit `__deinit__()` destructor must implement this
  trait."
- "The destructor (`__deinit__`) is called automatically when an instance's
  lifetime ends."
- "Composition of types with implicit destructors automatically get an implicit
  destructor."

The practical default is important: **a struct that owns nothing needs no
`__deinit__`** — it is `Deinitable` automatically. You implement the trait
explicitly when you own a resource and must release it.

The `@explicit_destroy` decorator interacts with this trait; 1.0 changed the
relationship. See [explicit destroy](../decorators/explicit-destroy.md) and the
release notes.

## `Movable` — ownership transfer

> [Stable since 1.0.0]
>
> The Movable trait denotes a type whose value can be moved.

Source: <https://mojolang.org/docs/std/traits/movable/Movable/>. Required method:

```text
def __init__(out self, *, deinit move: Self)
```

Source: <https://mojolang.org/docs/std/traits/movable/Movable/>.

Implementing it enables the transfer sigil `^`:

```mojo
struct Foo(Movable):
    def __init__(out self):
        pass

    def __init__(out self, *, deinit move: Self):
        print("moving")

def return_foo[T: Movable](var foo: T) -> T:
    return foo^

def main():
    var foo = Foo()
    var res = return_foo(foo^)   # prints "moving"
```

Source: <https://mojolang.org/docs/std/traits/movable/Movable/>.

**1.x default:** "Struct types are now `Movable` by default." To opt out, either
declare a conditional conformance with `Movable where <cond>` or opt out
entirely with `Movable where False`. Source:
<https://mojolang.org/releases/v1.0.0/>. So most structs do not need to write
`Movable` at all.

## `Copyable` and `ImplicitlyCopyable`

### `Copyable`

> [Stable since 1.0.0]
>
> The Copyable trait denotes a type whose value can be explicitly copied.

Source: <https://mojolang.org/docs/std/traits/copyable/Copyable/>. Requirements:
the copy constructor `def __init__(out self, *, copy: Self)` and, because it
"implements" `Movable`, the move constructor. It provides `copy()`, which the
reference documents as "a convenience method for `Self(copy=self)`", and notes
"[o]verriding this method is not allowed." Source:
<https://mojolang.org/docs/std/traits/copyable/Copyable/>.

```mojo
struct Foo(Copyable):
    var s: String

    def __init__(out self, s: String):
        self.s = s

    def __init__(out self, *, copy: Self):
        print("copying value")
        self.s = copy.s

def copy_return[T: Copyable](foo: T) -> T:
    var copy = foo.copy()
    return copy^

def main():
    var foo = Foo("test")
    var res = copy_return(foo)   # prints "copying value"
```

Source: <https://mojolang.org/docs/std/traits/copyable/Copyable/>.

`Copyable` is *explicit* copyability: assignment `var b = a` does not compile for
a type that is only `Copyable`. That is why `Array`, `List`, `Dict` and `Set`
require `.copy()`. See [`collections`](collections.md).

### `ImplicitlyCopyable`

> [Stable since 1.0.0]
>
> A marker trait to permit compiler to insert implicit calls to the copy
> constructor in order to make a copy of the object when needed. … all
> `ImplicitlyCopyable` types are required to conform to `Copyable`, which ensures
> there is only one definition for the logic of how a type is copied.

Source: <https://mojolang.org/docs/std/traits/copyable/ImplicitlyCopyable/>.

It is a **marker**: no additional methods are required. The page gives explicit
design guidance:

> Types that are expensive to copy, or where implicit copying could mask a logic
> error, typically should not be `ImplicitlyCopyable`.

> **Note:** `ImplicitlyCopyable` should only be used to mark structs that may be
> copied implicitly. It should not be used as a trait bound
> (`T: ImplicitlyCopyable`) on functions or types, except in special
> circumstances. Generic code that may perform copies should always use the more
> general `T: Copyable` bound.

Source: <https://mojolang.org/docs/std/traits/copyable/ImplicitlyCopyable/>.

```mojo
@fieldwise_init
struct Point(ImplicitlyCopyable):
    var x: Int
    var y: Int

def main():
    var p = Point(5, 10)
    var p2 = p          # implicit copy: allowed
```

Source: <https://mojolang.org/docs/std/traits/copyable/ImplicitlyCopyable/>.

## The trait graph

The documented refinement relationships, put together:

```text
AnyType
├── Movable                       (default for struct types in 1.x)
│   └── Copyable                  (implies Movable)
│       └── ImplicitlyCopyable    (marker; implies Copyable)
└── Deinitable                    (default for struct types)
```

Sources: <https://mojolang.org/docs/std/traits/anytype/AnyType/>,
<https://mojolang.org/docs/std/traits/movable/Movable/>,
<https://mojolang.org/docs/std/traits/copyable/Copyable/>,
<https://mojolang.org/docs/std/traits/copyable/ImplicitlyCopyable/>,
<https://mojolang.org/docs/std/traits/deinitable/Deinitable/>. Each trait page
lists its "Implemented traits": `Movable` implements `AnyType`; `Copyable`
implements `AnyType` and `Movable`; `ImplicitlyCopyable` implements `AnyType`,
`Copyable` and `Movable`; `Deinitable` implements `AnyType`.

## The other traits are elsewhere

`traits` holds **only** the five lifetime/value traits above. The rest of the
trait vocabulary lives in other packages and is covered on their pages:

| Trait | Where |
|-------|-------|
| `Equatable`, `Comparable`, `Boolable`, `Identifiable`, `Defaultable`, `RegisterPassable`, `DevicePassable` | [`builtin`](builtin.md) |
| `Hashable`, `Hasher` | [`hashlib`](hashlib.md) |
| `Iterable`, `IterableOwned`, `Iterator` | [`iter`](iter.md) |
| `Writable`, `Writer` | [`format`](format.md) / [`io`](io.md) |
| `Sized`, `SizedRaising` | [`builtin`](builtin.md) |
| `PathLike`, `PathLikeRaising` | [`os`](os.md) |
| `ConvertibleFromPython`, `ConvertibleToPython` | [`python`](python.md) |

Sources: <https://mojolang.org/docs/std/builtin/>,
<https://mojolang.org/docs/std/hashlib/>,
<https://mojolang.org/docs/std/iter/>,
<https://mojolang.org/docs/std/format/>.

## Idioms

- **Do not import these traits.** The prelude carries them.
- **Do not write `Movable` on a normal struct.** Struct types are `Movable` by
  default in 1.x; opt *out* with `Movable where False` when you need to.
- **Do not write `Deinitable` on a struct that owns nothing.** It is automatic.
- **Bound generic code on `Copyable`, not `ImplicitlyCopyable`.**
- **Use `ImplicitlyCopyable` deliberately**, on cheap value types where a hidden
  copy is acceptable.
- **Use `Deinitable where False` for a linear type** that must be explicitly
  destroyed by a named method.
- **Use `^` to move rather than copy** when ownership can transfer.
- **Reach for the concept page** ([Traits](../types/traits.md)) when you need
  conformance syntax rather than the package contents.

## Pitfalls

- **Importing the traits.** They are built-ins; `from std.traits import Copyable`
  is unnecessary.
- **Expecting `Copyable` to allow implicit copies.** It does not; that is what
  `ImplicitlyCopyable` adds.
- **Using `ImplicitlyCopyable` as a generic bound.** The trait's own page advises
  against it; use `Copyable`.
- **Assuming a struct needs a `__deinit__` to be `Deinitable`.** Ownership-free
  structs get an implicit destructor and conform automatically.
- **Forgetting that a stable struct's *signature* is not its *members*.** For
  these five traits the 1.0.0 notes say they are "stable in their entirety", so
  this caveat does not bite here — but it does for `Array`/`List`/`String`.
- **Marking a type both `Deinitable where False` and expecting implicit
  destruction.** A linear type must be consumed explicitly.
- **Re-implementing `copy()`.** "Overriding this method is not allowed."

## Stability

This is the package where the stability rule *does* apply positively. The 1.0.0
release notes name the stable set:

> The `Deinitable`, `Movable`, `Copyable`, and `ImplicitlyCopyable` traits, which
> are stable in their entirety.

Source: <https://mojolang.org/releases/v1.0.0/>. Each trait's own page carries the
`Stable since 1.0.0` label (`AnyType`, `Deinitable`, `Movable`, `Copyable`,
`ImplicitlyCopyable`). Sources:
<https://mojolang.org/docs/std/traits/anytype/AnyType/>,
<https://mojolang.org/docs/std/traits/deinitable/Deinitable/>,
<https://mojolang.org/docs/std/traits/movable/Movable/>,
<https://mojolang.org/docs/std/traits/copyable/Copyable/>,
<https://mojolang.org/docs/std/traits/copyable/ImplicitlyCopyable/>.

The `traits` package *page* itself carries no badge, but its five traits are
individually marked. So on this page the answer is: **stable**, unlike most of
the stdlib chapter. See [overview](overview.md) for the general rule.

## Sources

- Mojo `traits` package: <https://mojolang.org/docs/std/traits/>
- Mojo `anytype` module: <https://mojolang.org/docs/std/traits/anytype/>
- Mojo `AnyType` trait: <https://mojolang.org/docs/std/traits/anytype/AnyType/>
- Mojo `deinitable` module: <https://mojolang.org/docs/std/traits/deinitable/>
- Mojo `Deinitable` trait: <https://mojolang.org/docs/std/traits/deinitable/Deinitable/>
- Mojo `movable` module: <https://mojolang.org/docs/std/traits/movable/>
- Mojo `Movable` trait: <https://mojolang.org/docs/std/traits/movable/Movable/>
- Mojo `copyable` module: <https://mojolang.org/docs/std/traits/copyable/>
- Mojo `Copyable` trait: <https://mojolang.org/docs/std/traits/copyable/Copyable/>
- Mojo `ImplicitlyCopyable` trait: <https://mojolang.org/docs/std/traits/copyable/ImplicitlyCopyable/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
