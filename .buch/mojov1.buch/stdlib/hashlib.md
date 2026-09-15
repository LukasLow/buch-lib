# hashlib

`hashlib` provides hashing: the traits a type implements to be hashable, and the
machinery to compute hashes.

> Cryptographic and non-cryptographic hashing with customizable algorithms.

> The `hashlib` package provides hashing functionality for computing hash values
> of data. It defines the core hashing infrastructure through the `Hasher` trait
> for implementing hash algorithms and the `Hashable` trait for types that can be
> hashed. The package supports both compile-time and runtime hashing with
> pluggable hash algorithm implementations.

> Use this package for implementing hash-based data structures, creating
> hashable types, computing checksums, or building custom hash algorithms. Types
> that implement `Hashable` can be used as dictionary keys or in sets.

Source: <https://mojolang.org/docs/std/hashlib/>.

## The two traits

### `Hashable`

> A trait for types which specify a function to hash their data.

Source: <https://mojolang.org/docs/std/hashlib/hash/Hashable/>.

The shape is a method that updates an existing hasher rather than returning a
number:

```text
def __hash__[H: Hasher](self, mut hasher: H)
```

This is the pattern every collection type uses, for example `Array.__hash__`:
"Hashes the elements of the array using the given hasher." Source:
<https://mojolang.org/docs/std/collections/array/Array/>.

### `Hasher`

> A trait for types that can incrementally compute hash values.

Source: <https://mojolang.org/docs/std/hashlib/hasher/Hasher/>.

"Incrementally" is the key word: a hasher is fed data in pieces, which is what
makes `__hash__` composable for containers.

## The built-in `hash()` function

> Hash a Hashable type using its underlying hash implementation.

Source: <https://mojolang.org/docs/std/hashlib/hash/hash/>.

The module description gives the concrete forms:

> - `Hashable` trait for types implementing `__hash__(self, mut hasher)`
> - `hash[T: Hashable](hashable: T) -> UInt64` built-in function.
> - A `hash()` implementation for arbitrary byte strings,
>   `hash(bytes: Pointer[mut=False, UInt8], n: Int) -> UInt64`, is the workhorse
>   function, which implements efficient hashing via SIMD vectors.
> - `hash(SIMD)` and `hash(UInt8)` implementations ...

Source: <https://mojolang.org/docs/std/hashlib/hash/>.

```mojo
from std.hashlib import hash

def main():
    print(hash("hello"))          # a UInt64
    print(hash(42))
    print(hash(3.14))

    var data = [1, 2, 3]
    print(hash(data))             # works because Array is Hashable
```

## The default hashers

The `hasher` module exports two `comptime` values:

| Name | Value | Used for |
|------|-------|----------|
| `default_hasher` | `AHasher[SIMD[DType.uint64, SIMDLength(4)](0)]` | Runtime hashing |
| `default_comp_time_hasher` | `Fnv1a` | Compile-time hashing |

Source: <https://mojolang.org/docs/std/hashlib/hasher/>.

So the defaults are **AHash** at runtime and **FNV-1a** at compile time. That is
the pluggable part: `Dict` and `Set` carry an `H: Hasher = AHasher[...]`
parameter, so a custom hasher can be supplied per container. Source:
<https://mojolang.org/docs/std/collections/dict/Dict/>.

## Making your own type hashable

Implement `__hash__` by forwarding each field to the hasher:

```mojo
from std.hashlib import Hasher

struct Point(Hashable):
    var x: Int
    var y: Int

    def __hash__[H: Hasher](self, mut hasher: H):
        self.x.__hash__(hasher)
        self.y.__hash__(hasher)

def main():
    print(hash(Point(1, 2)))
```

This is exactly what the library does. `Bool.__hash__` "Updates hasher with the
underlying bytes"; `String.__hash__` does the same. Sources:
<https://mojolang.org/docs/std/builtin/bool/Bool/>,
<https://mojolang.org/docs/std/collections/string/string/String/>.

A type that is `Hashable` can be a `Dict` key or a `Set` element — the
`KeyElement` bound is `Equatable & Hashable & Movable`. Source:
<https://mojolang.org/docs/std/collections/dict/>.

## Idioms

- **Implement `__hash__` via the hasher parameter, not by returning a number.**
  The trait's method mutates the hasher.
- **Hash every field that participates in equality.** Two equal values must hash
  equally; that is the invariant that makes `Dict` work.
- **Rely on `default_hasher` unless you have a reason not to.** Supply an
  explicit `H` only when you need a specific algorithm.
- **Use `hash()` for the byte workhorse too.** The module documents a
  `Pointer[UInt8]` + length overload for hashing a buffer efficiently with SIMD.
- **Note the runtime/compile-time split** when the same value must hash
  identically in both contexts.

## Pitfalls

- **Not conforming to `Hashable` and trying to use a type as a `Dict` key.** The
  key bound requires `Hashable`.
- **Hashing fields in one order and comparing them in another.** Keep equality and
  hashing consistent.
- **Assuming `hashlib` provides cryptographic hashes.** The package description
  calls the algorithms "customizable" and does not claim any cryptographic
  guarantee; treat it as general-purpose hashing for data structures and
  checksums.
- **Mixing compile-time and runtime hashes of the same value.** The defaults are
  different algorithms (`Fnv1a` versus `AHash`).
- **Assuming a stable API.** See below.

> **Open question:** the package description says it supports "both compile-time
> and runtime hashing with pluggable hash algorithm implementations", and the
> `hasher` module names `AHasher` and `Fnv1a`, but the `Hashable` and `Hasher`
> pages do not spell out the full set of provided hasher algorithms or a public
> API for registering a new one. Read
> <https://mojolang.org/docs/std/hashlib/hasher/> and the `AHasher` symbol page
> before building on a specific algorithm choice.

## Stability

The `hashlib` package page, the `hash` and `hasher` module pages, and the
`Hashable`/`Hasher` trait pages show **no `@stable(since=...)` markers** and no
stability badges. Under the standard-library rule — "We consider standard library
APIs unstable unless specifically marked stable" — these APIs are **unstable by
default**. Sources: <https://mojolang.org/docs/std/hashlib/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `hashlib` package: <https://mojolang.org/docs/std/hashlib/>
- Mojo `hash` module: <https://mojolang.org/docs/std/hashlib/hash/>
- Mojo `Hashable` trait: <https://mojolang.org/docs/std/hashlib/hash/Hashable/>
- Mojo `hash` function: <https://mojolang.org/docs/std/hashlib/hash/hash/>
- Mojo `hasher` module: <https://mojolang.org/docs/std/hashlib/hasher/>
- Mojo `Hasher` trait: <https://mojolang.org/docs/std/hashlib/hasher/Hasher/>
- Mojo `Dict` struct: <https://mojolang.org/docs/std/collections/dict/Dict/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
