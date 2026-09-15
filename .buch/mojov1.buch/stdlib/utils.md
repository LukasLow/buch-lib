# utils

`utils` is the standard library's grab bag of foundational utilities:
multi-dimensional indexing, a type-safe union, a fixed-size tuple, numeric
helpers, thread-synchronization primitives, fast division and compile-time type
functions.

> General utils: indexing, variants, static tuples, and thread synchronization.

> The `utils` package provides foundational data structures and utilities used
> throughout the Mojo standard library. It includes types for multi-dimensional
> indexing, type-safe unions, fixed-size tuples, and thread synchronization
> primitives. These tools solve common programming patterns that don't fit neatly
> into other stdlib packages.

> Use this package when you need low-level building blocks for data structures,
> generic programming with sum types, or fine-grained control over threading and
> indexing operations.

Source: <https://mojolang.org/docs/std/utils/>.

**This page is a curated selection.** The package has eight modules and a large
combined surface; the goal here is that an agent can pick the right module and
use the main type in each, not to reproduce every method. Source lists point at
the complete pages.

## The import rule that catches people out

The package page states an explicit exception:

> `coord` (`Coord`, `coord()`, `Idx`, and related APIs) lives in `std.utils.coord`
> and is not re-exported from this package root so callers use explicit imports
> and avoid widening every `from std.utils import` dependency surface.

Source: <https://mojolang.org/docs/std/utils/>.

So `from std.utils import Variant` and `from std.utils import StaticTuple` work,
but `Coord` requires `from std.utils.coord import Coord`. The same page also
notes `type_functions.ConditionalType` is deprecated in favour of a ternary
expression, and that the `Coord`/`coord()`/`Idx` family lives in `coord`. See the
[open question](#open-questions) about the re-export rule's exact scope.

## Modules

| Module | Main contents |
|--------|----------------|
| `variant` | `Variant[*Ts]` — "A union that can hold a runtime-variant value from a set of predefined types." |
| `static_tuple` | `StaticTuple[element_type, size]` — "A statically sized tuple type which contains elements of homogeneous types." |
| `index_` | `IndexList[size]`, the `Index()` constructor, `product()`. |
| `coord` | `Coord`, `ComptimeInt`, `CoordLike`, `coord()`, `Idx`, `StaticCoord`, `DynamicCoord`, `crd2idx`, `idx2crd`. |
| `lock` | `BlockingSpinLock`, `BlockingScopedLock`, `SpinWaiter`. |
| `numerics` | `FPUtils`, `FlushDenormals`, `inf`/`nan`/`isfinite`/`isinf`/`isnan`, `nextafter`, `get_accum_type`. |
| `fast_div` | `FastDiv[dtype]` — "Implements fast division for a given type." |
| `type_functions` | `ConditionalType` (deprecated). |

Source: <https://mojolang.org/docs/std/utils/>.

## `Variant` — a runtime-variant value

`Variant[*Ts: AnyType]` is "a discriminated union type, similar to `std::variant`
in C++ or `enum` in Rust. It can store exactly one value that can be any of the
specified types, determined at runtime." Memory is the largest member plus a
discriminant. Source: <https://mojolang.org/docs/std/utils/variant/Variant/>.

The documented idioms, quoted:

> - use `isa[T]()` to check what type a variant is
> - use `unsafe_unwrap[T]()` to take a value from the variant
> - use `[T]` to get a value out of a variant
>   - This currently does an extra copy/move until we have origins
>   - It also temporarily requires the value to be mutable
> - use `set[T](var new_value: T)` to reset the variant to a new value
> - use `is_type_supported[T]` to check if the variant permits the type `T`
>
> **Note**: Currently, variant operations require the variant to be mutable
> (`mut`), even for read operations.

Source: <https://mojolang.org/docs/std/utils/variant/Variant/>.

```mojo
from std.utils import Variant

comptime IntOrString = Variant[Int, String]

def to_string(mut x: IntOrString) -> String:
    if x.isa[String]():
        return x[String]
    return String(x[Int])

def main():
    var an_int = IntOrString(4)
    var a_string = IntOrString("I'm a string!")
    print(a_string[String])   # I'm a string!
    print(an_int[Int])        # 4

    var who_knows = IntOrString(0)
    who_knows.set[String]("I'm also a string!")
    print(to_string(who_knows))
    if who_knows.isa[String]():
        print("It's a String!")
```

Source: <https://mojolang.org/docs/std/utils/variant/Variant/>.

The heterogeneous-list pattern is the most common real use:

```mojo
comptime MixedType = Variant[Int, Float64, String, Bool]

var mixed_list = List[MixedType]()
mixed_list.append(MixedType(42))
mixed_list.append(MixedType(3.14))
mixed_list.append(MixedType("hello"))

for item in mixed_list:
    if item.isa[String]():
        print("String:", item[String])
    elif item.isa[Int]():
        print("Integer:", item[Int])
```

Source: <https://mojolang.org/docs/std/utils/variant/Variant/>.

Key methods beyond those: `unwrap[T](deinit self) -> T` (checked take),
`unsafe_unwrap[T]()` (unchecked), `replace[Tin, Tout]`, `unsafe_replace`,
`deinit_with[T, F]` (destroy a non-`Deinitable` member in place), and
`is_type_supported[T]()`. `take`/`unsafe_take` are **deprecated** in favour of
`unwrap`/`unsafe_unwrap`. Source:
<https://mojolang.org/docs/std/utils/variant/Variant/>.

To store a value whose type is not `Movable`, construct it in place with the
`init_with=` closure: "the only way to store a value whose type is not
`Movable`." Source: <https://mojolang.org/docs/std/utils/variant/Variant/>.

### The layout warning

> The layout of `Variant` is not guaranteed and may change at any time. … Do not
> rely on `size_of[Variant[...]]()` or `align_of[Variant[...]]()` being stable
> across language versions. The only guarantee is that the size and alignment
> will be at least as large as those of the largest type among `Ts`.

Source: <https://mojolang.org/docs/std/utils/variant/Variant/>.

## `StaticTuple` — fixed-size homogeneous tuple

`StaticTuple[element_type: RegisterPassable & ImplicitlyCopyable & Deinitable,
size: Int]` is "a statically sized tuple type which contains elements of
homogeneous types." Source:
<https://mojolang.org/docs/std/utils/static_tuple/StaticTuple/>.

Construction forms:

| Form | Meaning |
|------|---------|
| `StaticTuple[E, N]()` | "Constructs an empty (undefined) tuple." |
| `StaticTuple[E, N](fill=v)` | Every element is `v`. |
| `StaticTuple[E, N](*elems)` | From N arguments. |
| `StaticTuple[E, N][*values]()` | "Creates a tuple constant using the specified values." |

Source: <https://mojolang.org/docs/std/utils/static_tuple/StaticTuple/>.

It provides element access (`get[index]`, `self[idx]`), `__setitem__`, `__len__`,
static `get_type_name()`, and the full comparison set (`__lt__`, `__le__`,
`__eq__`, `__ne__`, `__gt__`, `__ge__` — the ordering ones lexicographic).

```mojo
from std.utils import StaticTuple

def main():
    var t = StaticTuple[Int, 4](fill=7)
    print(len(t))       # 4
    print(t[2])         # 7
    print(t.get[0]())   # 7
    t[1] = 9
    print(t[1])         # 9

    var v = StaticTuple[Int, 3][1, 2, 3]()
    print(v.get_type_name())   # StaticTuple[Int, 3]
```

Source: <https://mojolang.org/docs/std/utils/static_tuple/StaticTuple/>.

## `IndexList` and `Index()` — N-D indices

`IndexList[size: Int, *, element_type: DType = DType.int64]` is "a base struct
that implements size agnostic index functions." Its storage is
`data: StaticTuple[Scalar[element_type], size]`. Source:
<https://mojolang.org/docs/std/utils/index_/IndexList/>.

Construct it through the `Index()` function:

```text
def Index[*Ts: Intable, *, dtype: DType = DType.int64](*args: *Ts.values) -> IndexList[Int(len(Ts.values)), element_type=dtype]
```

Source: <https://mojolang.org/docs/std/utils/index_/Index-function/>.

```mojo
from std.utils import Index, IndexList

def main():
    var idx = Index(1, 2, 3)          # IndexList[3]
    print(len(idx))                   # 3
    print(idx[0], idx[1], idx[2])     # 1 2 3
    print(idx + Index(1, 1, 1))       # element-wise add
    print(idx.reverse())
    print(idx.flattened_length())
    print(idx.get_row_major_strides())
    print(idx.as_tuple())
```

Source: <https://mojolang.org/docs/std/utils/index_/IndexList/>. Note the
comparison rule: "A tuple is less-than another tuple if all corresponding
elements of lhs is less than rhs. Note: This is **not** a lexical comparison."
Element-wise arithmetic (`+ - * //`), `remu`, `cast[dtype]`, `canonicalize`,
`flattened_length`, `get_row_major_strides` and `get_type_name` round it out.

`product()` computes "a product of values in the tuple up to the given index."
Source: <https://mojolang.org/docs/std/utils/index_/>.

## `coord` — mixed compile-time/runtime indices

`Coord` is the layout-aware sibling of `IndexList`, holding a mix of static and
dynamic dimensions:

> A struct representing tuple-like data with compile-time and runtime elements.

Source: <https://mojolang.org/docs/std/utils/coord/Coord/>. Its parameter pack is
`*element_types: CoordLike`, and each element is either a `ComptimeInt[v]` (a
"Compile-time known index value") or a runtime `Scalar[dtype]`.

The module also exports the `comptime` helpers `coord[*values]` (build from
compile-time ints), `Idx[value]` ("A compile-time coordinate index value"),
`StaticCoord[value, size]`, `DynamicCoord[dtype, size]`, and `All` ("keep this
entire dimension"). Source: <https://mojolang.org/docs/std/utils/coord/>.

The linear-index conversions are the functions most likely to be used directly:

```text
def crd2idx[Index, Shape, Stride, out_type: DType = DType.int64](crd, shape, stride) -> Scalar[out_type]
def idx2crd[Shape, Stride, out_dtype: DType = DType.int64](idx: Int, shape, stride) -> Coord[...]
```

> `crd2idx` — "Calculate the linear index from a coordinate tuple."

> `idx2crd` — "Calculate the coordinate tuple from a linear index. … the
> per-element formula: `coord[i] = (idx // stride[i]) % shape[i]`."

Sources: <https://mojolang.org/docs/std/utils/coord/crd2idx/>,
<https://mojolang.org/docs/std/utils/coord/idx2crd/>.

```mojo
from std.utils.coord import Idx, coord, crd2idx, idx2crd, StaticCoord

def main():
    comptime shape = StaticCoord[4, 2]()   # (4, 4)
    comptime stride = StaticCoord[4, 2]()
    var c = coord[1, 2]
    print(crd2idx(c, shape, stride))       # linear index
    print(idx2crd(5, shape, stride))       # coordinate for a linear index
    var static_idx = Idx[3]
    print(static_idx)
```

Sources: <https://mojolang.org/docs/std/utils/coord/>,
<https://mojolang.org/docs/std/utils/coord/idx2crd/>.

`idx2crd`'s return type is elaborate because it preserves static information:
"When a shape dimension is statically known to be 1, the corresponding output
coordinate is a `ComptimeInt[0]`. Otherwise, coordinates are `Scalar[out_dtype]`."
Source: <https://mojolang.org/docs/std/utils/coord/idx2crd/>.

> **Curated selection:** `Coord` itself exposes a large surface (`flatten`,
`concat`, `make_dynamic`, `cast`, `product`, `sum`, `inner_product`,
`reverse`, `size`, `rank`, `static_product`, and more). This page shows the
`comptime` constructors and the two index conversions; read
<https://mojolang.org/docs/std/utils/coord/Coord/> for the rest.

## `lock` — thread synchronization

> This module provides low-level locking mechanisms for thread synchronization,
> including spin locks with blocking behavior and scoped lock guards for automatic
> lock management.

Source: <https://mojolang.org/docs/std/utils/lock/>.

| Type | Purpose |
|------|---------|
| `BlockingSpinLock` | "A basic locking implementation that uses an integer to represent the owner of the lock." |
| `BlockingScopedLock[origin]` | "A scope adapter for BlockingSpinLock." |
| `SpinWaiter` | "A proxy for the C++ runtime's SpinWaiter type." |

`BlockingSpinLock` has `lock(owner: Int)` and `unlock(owner: Int) -> Bool`, where
`owner` is "usually an address". `BlockingScopedLock` acquires on `__enter__` and
releases on `__exit__`. Sources:
<https://mojolang.org/docs/std/utils/lock/BlockingSpinLock/>,
<https://mojolang.org/docs/std/utils/lock/BlockingScopedLock/>.

```mojo
from std.utils.lock import BlockingScopedLock, BlockingSpinLock

def main():
    var lock = BlockingSpinLock()
    with BlockingScopedLock(lock):
        pass   # critical section
```

Sources: <https://mojolang.org/docs/std/utils/lock/BlockingSpinLock/>,
<https://mojolang.org/docs/std/utils/lock/BlockingScopedLock/>. The full
treatment of concurrency is in [Async and
parallelism](../concurrency/async-and-parallelism.md), which also discusses the
`BlockingSpinLock` pitfalls (it is a spin lock, not a mutex).

## `numerics` — floating-point helpers

| Name | Purpose |
|------|---------|
| `FPUtils[dtype]` | "Collection of utility functions for working with FP values." |
| `FlushDenormals` | "Flushes and denormals are set to zero within the context and the state is restored to the prior value on exit." |
| `inf`, `neg_inf`, `nan` | Build the special values for a dtype. |
| `isfinite`, `isinf`, `isnan` | Element-wise predicates returning `SIMD[DType.bool, width]`. |
| `max_finite`, `min_finite`, `max_or_inf`, `min_or_neg_inf` | Range bounds. |
| `nextafter` | "Computes next representable value of `arg0` in the direction of `arg1`." |
| `get_accum_type` | "Returns the recommended dtype for accumulation operations." |

Sources: <https://mojolang.org/docs/std/utils/numerics/>,
<https://mojolang.org/docs/std/utils/numerics/FPUtils/>,
<https://mojolang.org/docs/std/utils/numerics/isnan/>.

`FPUtils` decomposes a float into sign, exponent and mantissa — useful for
bit-level work: `mantissa_width`, `exponent_width`, `exponent_bias`, the masks
(`mantissa_mask`, `sign_mask`, `exponent_mask`, `quiet_nan_mask`),
`bitcast_to_integer`/`bitcast_from_integer`, `get_sign`/`set_sign`,
`get_exponent`/`set_exponent`, `get_mantissa`/`set_mantissa`, and `pack(sign,
exponent, mantissa)`. Source:
<https://mojolang.org/docs/std/utils/numerics/FPUtils/>.

```mojo
from std.utils.numerics import FPUtils, isfinite, isinf, isnan

def main():
    var x = Float32(1.5)
    print(isnan(x))                                    # [False]
    print(isinf(x))                                    # [False]
    print(isfinite(x))                                 # [True]
    print(FPUtils[DType.float32].mantissa_width())     # 23
    print(FPUtils[DType.float32].exponent_width())     # 8
    print(FPUtils[DType.float32].bitcast_to_integer(x))
```

Sources: <https://mojolang.org/docs/std/utils/numerics/FPUtils/>,
<https://mojolang.org/docs/std/utils/numerics/isnan/>.

`isfinite`, `isinf` and `isnan` are element-wise on SIMD, so they return a
`SIMD[DType.bool, width]` mask, not a single `Bool`. Source:
<https://mojolang.org/docs/std/utils/numerics/isnan/>.

## `fast_div` — division by a constant

> This method replaces division by constants with a sequence of shifts and
> multiplications, significantly optimizing division performance.

Source: <https://mojolang.org/docs/std/utils/fast_div/>.

```text
struct FastDiv[dtype: DType]
    def __init__(divisor: Int = Int(1)) -> Self
    def __rtruediv__(self, other: Scalar[Self.uint_type]) -> Scalar[Self.uint_type]
    def __rmod__(self, other: Scalar[Self.uint_type]) -> Scalar[Self.uint_type]
    def __rdiv__(self, other: Scalar[Self.uint_type]) -> Scalar[Self.uint_type]
    def __divmod__(self, other: Scalar[Self.uint_type]) -> Tuple[Scalar[Self.uint_type], Scalar[Self.uint_type]]
```

Source: <https://mojolang.org/docs/std/utils/fast_div/FastDiv/>. Construct it
once with the divisor and reuse it; the division is spelled `other / fastdiv` and
dispatches to `__rtruediv__`. It is "for a given type" — the divisor must be
constant, which is exactly the case where the transform is valid.

## `type_functions`

`ConditionalType` "conditionally selects between two types" by a compile-time
boolean. Source: <https://mojolang.org/docs/std/utils/type_functions/>. It is
**deprecated**:

> **Deprecated:** Use the ternary expression `T if cond else U` instead.

Source: <https://mojolang.org/docs/std/utils/type_functions/>.

## Idioms

- **Use `Variant` for a heterogeneous `List`.** A `List`'s element type is fixed;
  `List[Variant[A, B]]` is the escape hatch.
- **Check with `isa[T]()` before `[T]`.** Indexing a variant with the wrong type
  aborts the program.
- **Use `StaticTuple` instead of a `Tuple`** when you want one homogeneous
  element type and a fill/compare/arithmetic-friendly container.
- **Use `IndexList`/`Index()` for N-D index math**, and `Coord` when the shape
  mixes compile-time and runtime dimensions.
- **Use `BlockingScopedLock` with `with`** rather than manual `lock`/`unlock`, so
  the release happens on every exit path.
- **Use `FastDiv` in an inner loop divided by a constant.**
- **Replace `ConditionalType` with `T if cond else U`.**
- **Expect `Coord` to need a `std.utils.coord` import.**

## Pitfalls

- **Importing `Coord` from the package root.** The package page says `coord` "is
  not re-exported from this package root."
- **Indexing a `Variant` without `isa`.** The docs warn the program aborts if the
  type is not actually held.
- **Requiring a `mut` value for read operations.** "Currently, variant operations
  require the variant to be mutable (`mut`), even for read operations."
- **Relying on `Variant`'s layout.** It is explicitly not guaranteed.
- **Calling the deprecated `Variant.take`/`unsafe_take`.** Use `unwrap`/
  `unsafe_unwrap`.
- **Using `ConditionalType` in new code.** It is deprecated for the ternary form.
- **Treating `IndexList` comparisons as lexicographic.** They are element-wise
  across all positions.
- **Assuming `isnan` returns a `Bool`.** It returns a lane mask.
- **Expecting `FPUtils` on a non-float dtype.** The dtype is constrained to be
  floating point.
- **Holding a `BlockingSpinLock` across a `parallelize()` call.** It is a spin
  lock for short critical sections.
- **Assuming a stable API.** See below.

### Open questions

> **Open question:** the package page says only that `coord` "is not re-exported
> from this package root," while the `index_` module page shows
> `from std.utils import IndexList` and the `static_tuple` page shows
> `from std.utils import StaticTuple`. It is not stated which of the other
> subpackage symbols (for example `type_functions.ConditionalType`,
> `fast_div.FastDiv`, `lock.BlockingSpinLock`) are re-exported. Verify each
> import path against the installed toolchain. Sources:
> <https://mojolang.org/docs/std/utils/>,
> <https://mojolang.org/docs/std/utils/index_/>,
> <https://mojolang.org/docs/std/utils/static_tuple/>.

> **Open question:** `1.0.0` renamed `Reflected.field_type[name]` to
> `Reflected.field[name]` and added `field_at[idx]` (reflection), and deprecated
> `std.utils.type_functions.ConditionalType` in favour of a ternary expression.
> Both changes affect this chapter; this page reflects the 1.0.0 spelling. Source:
> <https://mojolang.org/releases/v1.0.0/>.

## Stability

The `utils` package page, its module pages and its member pages show **no
`@stable(since=...)` marker** and no stability badges. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — these APIs are **unstable by default**. Note in particular the explicit
`Variant` layout warning and the deprecated `ConditionalType`. Sources:
<https://mojolang.org/docs/std/utils/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `utils` package: <https://mojolang.org/docs/std/utils/>
- Mojo `variant` module: <https://mojolang.org/docs/std/utils/variant/>
- Mojo `Variant` struct: <https://mojolang.org/docs/std/utils/variant/Variant/>
- Mojo `static_tuple` module: <https://mojolang.org/docs/std/utils/static_tuple/>
- Mojo `StaticTuple` struct: <https://mojolang.org/docs/std/utils/static_tuple/StaticTuple/>
- Mojo `index_` module: <https://mojolang.org/docs/std/utils/index_/>
- Mojo `IndexList` struct: <https://mojolang.org/docs/std/utils/index_/IndexList/>
- Mojo `Index` function: <https://mojolang.org/docs/std/utils/index_/Index-function/>
- Mojo `coord` module: <https://mojolang.org/docs/std/utils/coord/>
- Mojo `Coord` struct: <https://mojolang.org/docs/std/utils/coord/Coord/>
- Mojo `crd2idx`: <https://mojolang.org/docs/std/utils/coord/crd2idx/>
- Mojo `idx2crd`: <https://mojolang.org/docs/std/utils/coord/idx2crd/>
- Mojo `lock` module: <https://mojolang.org/docs/std/utils/lock/>
- Mojo `BlockingSpinLock`: <https://mojolang.org/docs/std/utils/lock/BlockingSpinLock/>
- Mojo `BlockingScopedLock`: <https://mojolang.org/docs/std/utils/lock/BlockingScopedLock/>
- Mojo `numerics` module: <https://mojolang.org/docs/std/utils/numerics/>
- Mojo `FPUtils`: <https://mojolang.org/docs/std/utils/numerics/FPUtils/>
- Mojo `isnan`: <https://mojolang.org/docs/std/utils/numerics/isnan/>
- Mojo `fast_div` module: <https://mojolang.org/docs/std/utils/fast_div/>
- Mojo `FastDiv`: <https://mojolang.org/docs/std/utils/fast_div/FastDiv/>
- Mojo `type_functions` module: <https://mojolang.org/docs/std/utils/type_functions/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
