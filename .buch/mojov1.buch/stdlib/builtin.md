# builtin

`builtin` is the foundation of the Mojo language: the types, traits and
operations the compiler itself depends on.

> Language foundation: built-in types, traits, and fundamental operations.

> The `builtin` package provides the core types, traits, and operations that form
> the foundation of the Mojo language. It defines fundamental types like
> integers, booleans, and strings, essential traits for type behavior
> (`Copyable`, `Movable`, `Comparable`), and basic operations used throughout all
> Mojo code. Most symbols from this package are automatically available without
> explicit imports through the prelude.

> This package is implicitly imported.

Source: <https://mojolang.org/docs/std/builtin/>.

Because it is implicit, you do **not** import from `builtin` in normal code.
You use its contents directly. This page is therefore organized around the
question "what is always in scope, and what does it do", not around import
statements.

## The core types

| Type | One-line job (from the built-in reference) |
|------|--------------------------------------------|
| `Int` | The default signed integer type; it is `Scalar[DType.int]`. |
| `UInt` | The default unsigned integer type (`Scalar[DType.uint]`). |
| `Bool` | "The primitive Bool scalar value used in Mojo." |
| `SIMD` | "Represents a vector type that leverages hardware acceleration to process multiple data elements with a single operation." |
| `DType` | "Represents a data type specification and provides methods for working with it." |
| `Tuple` | "The type of a literal tuple expression." |
| `StringLiteral` | "This type represents a string literal." |
| `IntLiteral` | A static integer literal value with infinite precision (compile-time only). |
| `FloatLiteral` | "Mojo floating point literal type." |
| `NoneType` | "Represents the absence of a value." |

Sources: <https://mojolang.org/docs/std/builtin/>,
<https://mojolang.org/docs/std/builtin/bool/Bool/>,
<https://mojolang.org/docs/std/builtin/simd/SIMD/>,
<https://mojolang.org/docs/std/builtin/dtype/DType/>.

`Int` and the numeric types are **SIMD scalar aliases**; that model is explained
in [`builtin`'s own `simd` module](builtin.md) and in the numeric-types chapter.
The short version:

```mojo
comptime Scalar = SIMD[length=1]
comptime Int    = Scalar[DType.int]
comptime Int32  = Scalar[DType.int32]
comptime Float64 = Scalar[DType.float64]
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

### `SIMD` in one screen

```mojo
# All zeros
var zeros = SIMD[DType.float32, 4]()

# Splat one value across all lanes
var twos = SIMD[DType.float32, 4](2.0)

# Explicit lane values
var v = SIMD[DType.float32, 4](1.0, 2.0, 3.0, 4.0)

# Elementwise arithmetic
var scaled = v * twos          # [2.0, 4.0, 6.0, 8.0]

# Reductions
print(v.reduce_add())          # 10.0
print(v.reduce_max())          # 4.0

# Per-lane comparison returns a mask, not a Bool
var positive = v.gt(2.0)       # SIMD[DType.bool, 4]
print(positive.select(v, -v))  # [ -1.0, -2.0, 3.0, 4.0]

# Casting
print(v.cast[DType.int32]())   # [1, 2, 3, 4]
```

Sources: <https://mojolang.org/docs/std/builtin/simd/SIMD/>,
<https://mojolang.org/reference/numeric-types/>.

The key APIs in one list: construction (`value`, `v1, v2, …`, `()`), element
access (`v[i]`), arithmetic (`+ - * / % //`), comparison (`== != < <= > >=`), bit
operations (`& | ^ ~ << >>`), reductions (`reduce_add`, `reduce_mul`,
`reduce_min`, `reduce_max`, `reduce_and`, `reduce_or`, `reduce_xor`, generic
`reduce[func]`), conditional selection (`select`), vector manipulation
(`shuffle`, `slice`, `join`, `split`), and `cast[target_dtype]()`.

Sources: <https://mojolang.org/docs/std/builtin/simd/SIMD/>,
<https://mojolang.org/docs/std/builtin/simd/>.

### `DType`

`DType` is a value, not a type: "Represents a data type specification". Its
members include the signed integers (`int8` … `int64`, `int`), their unsigned
counterparts (`uint8` … `uint64`, `uint`), the floats (`float16`, `bfloat16`,
`float32`, `float64`, and the sub-byte formats) and `bool`. Source:
<https://mojolang.org/docs/std/builtin/dtype/DType/>.

The parameter `length` of `SIMD` is a `SIMDLength`; use `SIMDLength` when
inferring a width in a parameter position and `Int` everywhere else. Source:
<https://mojolang.org/docs/std/builtin/simd_length/SIMDLength/>.

### `Tuple`

```mojo
var t = Tuple[Int, String](1, "example")
var x, y = t           # destructuring
print(x, y)            # 1 example
print(t[1])            # example
```

`Tuple` is "the type of a literal tuple expression" and is the only place
multiple concrete types coexist in one value without `Variant`. Source:
<https://mojolang.org/docs/std/builtin/tuple/Tuple/>.

### `Error`

```mojo
raise Error("something went wrong")
raise Error("value ", v, " is out of range")  # variadic Writable args
```

`Error` is cheap to copy: "the message and the optional stack trace are both
reference counted, so re-raising a caught error with `raise e` costs a reference
count increment. Transfer with `raise e^` to avoid even that." Source:
<https://mojolang.org/docs/std/builtin/error/Error/>.

## The core traits

The traits that every Mojo type interacts with. The lifetime traits have their
own page in [`traits`](traits.md); the comparison and conversion traits live
here.

| Trait | Meaning |
|-------|---------|
| `AnyType` | The most basic trait; all Mojo types extend it by default. |
| `Equatable` | "A type which can be compared for equality with other instances of itself." |
| `Comparable` | "A type which can be compared for order with other instances of itself." |
| `Boolable` | A type that can be converted to `Bool` or used in `if`/`while` conditions. |
| `Intable` / `IntableRaising` | A type convertible to `Int`; the `Raising` variant may fail. |
| `Floatable` / `FloatableRaising` | A type convertible to `Float64`; the `Raising` variant may fail. |
| `Sized` / `SizedRaising` | A type with an integer length. |
| `Defaultable` | "A type with a default constructor." |
| `Identifiable` | A type with an identity comparable against other instances. |
| `Indexer` | A type usable as an index into a collection or pointer. |
| `RegisterPassable` / `TrivialRegisterPassable` | Marker traits for register-passable types. |
| `DevicePassable` | "marks types as passable to accelerator devices." |

Sources: <https://mojolang.org/docs/std/builtin/>,
<https://mojolang.org/docs/std/builtin/comparable/>,
<https://mojolang.org/docs/std/builtin/bool/Boolable/>,
<https://mojolang.org/docs/std/builtin/value/>,
<https://mojolang.org/docs/std/builtin/identifiable/>,
<https://mojolang.org/docs/std/builtin/device_passable/>.

## The built-in operations

These functions are callable without an import.

### `len`

```mojo
print(len([1, 2, 3]))     # 3
print(len("hello"))       # 5 (bytes)
```

`len()` is backed by the `Sized` trait: "The `Sized` trait describes a type
that has an integer length (such as a string or array)." Source:
<https://mojolang.org/docs/std/builtin/len/>.

### `range`

> `range()` returns the integer sequence `[0, end)`.

Source: <https://mojolang.org/docs/std/builtin/range/>.

```mojo
for i in range(3):
    print(i)              # 0 1 2
```

### `sort`

```mojo
var values = [3, 1, 2]
sort(values)              # in place
print(values)             # [1, 2, 3]
```

`sort` "Sort a span in-place. The function doesn't return anything, the span is
updated in-place." The module also provides `partition` — "Partition the input
buffer inplace such that first k elements are the largest (or smallest if
cmp_fn is < operator) elements." Source:
<https://mojolang.org/docs/std/builtin/sort/>.

### `reversed`

```mojo
for x in reversed([1, 2, 3]):
    print(x)              # 3 2 1
```

`reversed()` works on anything conforming to `ReversibleRange`. Source:
<https://mojolang.org/docs/std/builtin/reversed/>.

### `swap`

```mojo
var a = 1
var b = 2
swap(a, b)
print(a, b)               # 2 1
```

Source: <https://mojolang.org/docs/std/builtin/swap/>.

### `hex`, `oct`, `bin`

```mojo
print(hex(255))   # 0xff
print(oct(8))     # 0o10
print(bin(5))     # 0b101
```

Sources: <https://mojolang.org/docs/std/builtin/format_int/>,
<https://mojolang.org/docs/std/builtin/format_int/hex/>,
<https://mojolang.org/docs/std/builtin/format_int/bin/>.

### `materialize`

> Explicitly materialize a compile-time parameter into a run-time value.

Source: <https://mojolang.org/docs/std/builtin/value/materialize/>.

### `breakpoint` and `debug_assert`

- `breakpoint()` — "Cause an execution trap with the intention of requesting the
  attention of a debugger." Source:
  <https://mojolang.org/docs/std/builtin/breakpoint/breakpoint/>.
- `debug_assert(cond)` — "Asserts that the condition is true at run time."
  Source: <https://mojolang.org/docs/std/builtin/debug_assert/debug_assert/>.

## Variadics

The package provides the machinery behind variadic functions and parameters:
`VariadicList`, `ParameterList`, `VariadicPack` and `TypeList`. Source:
<https://mojolang.org/docs/std/builtin/variadics/>.

```mojo
from std.builtin.variadics import VariadicPack  # only when naming it

def total[*Ts: Intable](*values: *Ts) -> Int:
    var sum = 0
    for i in range(len(values)):
        sum += Int(values[i])
    return sum

def main():
    print(total(1, 2, 3))   # 6
```

Variadics are covered in depth in
[parameters and generics](../functions/parameters-and-generics.md).

## Slices

`Slice`, `StridedSlice` and `ContiguousSlice` are the types behind `x[a:b]` and
`x[a:b:c]`. They are documented in
[expressions](../reference/expressions.md). Source:
<https://mojolang.org/docs/std/builtin/builtin_slice/>.

## Idioms

- **Do not import from `builtin`.** It is implicit; an explicit import is
  noise.
- **Think of `Int` as a one-lane SIMD.** All SIMD methods are available on it.
- **Prefer `len(x)` over `x.size`.** The `size` spelling is deprecated across the
  library (for example `Array.size`).
- **Use `Equatable`/`Comparable` as bounds** on generic code that compares.
- **Use `debug_assert` for internal invariants** and the
  [`testing`](testing.md) assertions inside tests.

## Pitfalls

- **Assuming `Int` is a plain machine integer.** It is `Scalar[DType.int]`, so
  conversions can be stricter than expected.
- **Using a literal `2` with a `DType` parameter.** The numeric-types reference
  casts explicitly for that reason: `UInt8(2).cast[T]()`.
- **Splatting a vector by accident.** `SIMD[dtype, 8](2.0)` is eight lanes of
  `2.0`, not one.
- **Treating `__eq__` as a lane mask.** `__eq__` on a `SIMD` returns a single
  `Bool` testing the whole vector; use `.eq()`/`.gt()`/`.lt()` for a per-lane
  mask. Source: <https://mojolang.org/docs/std/builtin/simd/SIMD/>.
- **Expecting `cast[]` to clamp.** Out-of-range casts wrap (two's complement).
- **Reading `Array.size` or `SIMD.size`.** Both are deprecated aliases for
  `length`. Source: <https://mojolang.org/docs/std/builtin/simd/SIMD/>.
- **Reaching for `len()` on a raising type without handling the error.**
  `SizedRaising` exists precisely for lengths that can fail.

> **Open question:** the built-in reference has an `int` module
> (`https://mojolang.org/docs/std/builtin/int/`), but the symbol page for `Int`
> at `https://mojolang.org/docs/std/builtin/int/Int/` returned no Markdown in
> this verification pass, so `Int`'s own member list is not reproduced here. Use
> the `SIMD` page for the scalar API, since `Int` is `Scalar[DType.int]`, and
> verify any `Int`-specific method against the upstream page.

## Stability

The `builtin` package page shows **no `@stable(since=...)` marker** on the
package, and its modules are not individually badged on the package page. Under
the standard-library rule — "We consider standard library APIs unstable unless
specifically marked stable" — the `builtin` APIs are **unstable by default**.
The *language-level* constructs they model (control flow, types, ownership, and
operator/lifetime dunders such as `__add__`, `__init__`, `__deinit__`) are a
separate matter and are described as stable on the language-stability page.
Sources: <https://mojolang.org/docs/std/builtin/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `builtin` package: <https://mojolang.org/docs/std/builtin/>
- Mojo `bool` module: <https://mojolang.org/docs/std/builtin/bool/>
- Mojo `Bool` struct: <https://mojolang.org/docs/std/builtin/bool/Bool/>
- Mojo `simd` module: <https://mojolang.org/docs/std/builtin/simd/>
- Mojo `SIMD` struct: <https://mojolang.org/docs/std/builtin/simd/SIMD/>
- Mojo `dtype` module: <https://mojolang.org/docs/std/builtin/dtype/>
- Mojo `DType` struct: <https://mojolang.org/docs/std/builtin/dtype/DType/>
- Mojo `error` module: <https://mojolang.org/docs/std/builtin/error/>
- Mojo `Error` struct: <https://mojolang.org/docs/std/builtin/error/Error/>
- Mojo `tuple` module: <https://mojolang.org/docs/std/builtin/tuple/>
- Mojo `len` module: <https://mojolang.org/docs/std/builtin/len/>
- Mojo `range` module: <https://mojolang.org/docs/std/builtin/range/>
- Mojo `sort` module: <https://mojolang.org/docs/std/builtin/sort/>
- Mojo `reversed` module: <https://mojolang.org/docs/std/builtin/reversed/>
- Mojo `swap` module: <https://mojolang.org/docs/std/builtin/swap/>
- Mojo `format_int` module: <https://mojolang.org/docs/std/builtin/format_int/>
- Mojo `variadics` module: <https://mojolang.org/docs/std/builtin/variadics/>
- Mojo `comparable` module: <https://mojolang.org/docs/std/builtin/comparable/>
- Mojo `value` module: <https://mojolang.org/docs/std/builtin/value/>
- Mojo numeric types reference: <https://mojolang.org/docs/reference/numeric-types/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
