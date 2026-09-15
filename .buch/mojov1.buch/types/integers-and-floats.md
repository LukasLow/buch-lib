# Integers and floats

Mojo's numeric types are not a set of independent primitives. They are views
onto one vector type, `SIMD`, with a `DType` saying what is stored and a length
saying how many. This page explains that model, then covers the concrete
integer and floating-point types, their bounds and overflow behavior, numeric
literals and materialization, and explicit conversion.

## The SIMD / DType / Scalar model

The types reference states the base of the model:

> Mojo's numeric types are built on `SIMD`, a fixed-size, homogeneous vector of
> primitive values.

Source: <https://mojolang.org/docs/reference/types/>.

The numeric-types reference expands it:

> Every fixed-width numeric type is a one-element `SIMD` called a `Scalar`. The
> `DType` specifies the kind of values stored in a `SIMD` vector, such as `int`,
> `uint`, `float32`, `int64`, or `uint8`.

Source: <https://mojolang.org/docs/reference/numeric-types/>.

So there are three ideas, and it pays to keep them separate:

1. **`SIMD`** is the vector type. A `SIMD` value stores one or more values of
   the same type in a fixed-size vector; the number of values is the *width*
   and must be a power of two. The width is part of the type:
   `SIMD[DType.float32, 4]` is a vector of four 32-bit floats. Source:
   <https://mojolang.org/docs/reference/numeric-types/>.
2. **`DType`** is *not a type*; it is a value that describes a data type.
   "`DType.float64` isn't a *type*, it's a value that describes a data type.
   You can't create a variable with the type `DType.float64`." Source:
   <https://mojolang.org/docs/manual/types/>.
3. **`Scalar`** is a `SIMD` with one element. Every fixed-width numeric name is
   a `Scalar` alias, so `Float32` = `Scalar[DType.float32]` =
   `SIMD[DType.float32, 1]`, and these are all the same type. Source:
   <https://mojolang.org/docs/reference/numeric-types/>.

```mojo
def main():
    var a = SIMD[DType.float32, 4](1.0, 2.0, 3.0, 4.0)
    var doubled = a * 2.0        # elementwise: [2.0, 4.0, 6.0, 8.0]
    print(doubled)

    var v = SIMD[DType.int8, 4](2, 3, 5, 7)
    var w = SIMD[DType.int8, 4](1, 2, 3, 4)
    print(v * w)                 # [2, 6, 15, 28]
```

Arithmetic, comparison and bitwise operations apply to all lanes at once;
`v[0]` reads lane 0 (type `Scalar[DType.int8]`, i.e. `Int8`) and `v[0] = 5`
writes it. Sources: <https://mojolang.org/docs/reference/numeric-types/> and
<https://mojolang.org/docs/manual/types/>.

> **Open question:** the numeric-types reference says `SIMD` has a hard
> compile-time limit of 2**15 (32768) elements, and that the usable width is
> much smaller in practice and hardware-dependent. No official table of
> "recommended widths per target" is given; the page says only "Always
> benchmark to find the optimal width for your workload and target hardware."
> Source: <https://mojolang.org/docs/reference/numeric-types/>.

Reductions collapse a vector to one value, and `min()`/`max()` are free
functions rather than methods:

```mojo
var a = SIMD[DType.float32, 4](1.0, 2.0, 3.0, 4.0)
print(a.reduce_add())   # 10.0
print(a.reduce_max())   # 4.0
print(a.reduce_min())   # 1.0
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

### `DType` specifications

`DType` names the number kind. Integers:

| Signed | Width | Unsigned | Width |
|--------|-------|----------|-------|
| `DType.int8` | 8-bit | `DType.uint8` | 8-bit |
| `DType.int16` | 16-bit | `DType.uint16` | 16-bit |
| `DType.int32` | 32-bit | `DType.uint32` | 32-bit |
| `DType.int64` | 64-bit | `DType.uint64` | 64-bit |
| `DType.int128` | 128-bit | `DType.uint128` | 128-bit |
| `DType.int256` | 256-bit | `DType.uint256` | 256-bit |
| `DType.int` | Machine | `DType.uint` | Machine |

Floating point: `DType.float16`, `DType.bfloat16`, `DType.float32`,
`DType.float64`, and the low-precision formats `DType.float8_e4m3fn`,
`DType.float8_e4m3fnuz`, `DType.float8_e5m2`, `DType.float8_e5m2fnuz`,
`DType.float8_e8m0fnu` and `DType.float4_e2m1fn`. Other: `DType.bool`
(boolean, 1-bit). Source: <https://mojolang.org/docs/reference/numeric-types/>.

`DType` is what lets generic numeric code work across number kinds. The
reference's example doubles a `Scalar` of any dtype; note that the conversion
is required because a bare literal cannot be combined directly with a
parameterized type:

```mojo
# Double a value. The cast is required because the parameterized type
# parameter can't be used directly with the literal `2`.
def double[T: DType](x: Scalar[T]) -> Scalar[T]:
    return x * UInt8(2).cast[T]()

def main():
    print(double[DType.float32](Float32(3.5)))   # 7.0
    print(double[DType.int32](Int32(21)))        # 42
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

## Integers

### `Int` — the default integer

`Int` is Mojo's default integer, and it is not a privileged built-in: it is an
alias.

> `Int` is equivalent to `Scalar[DType.int]` and `SIMD[DType.int, 1]`.

Source: <https://mojolang.org/docs/reference/numeric-types/>.

`Int` matches the machine word size, which is why it is the natural type for
counts, indices and `len()` results:

> `Int` matches the hardware's native word size. Under the hood it wraps the
> machine's index register directly, which is why it's the natural choice for
> counting and addressing.

Source: <https://mojolang.org/docs/reference/numeric-types/>.

You can observe the alias identity at compile time:

```mojo
def main():
    var a: Int = 42
    comptime a_type = reflect[type_of(a)].name()
    print("a:", a_type)   # a: SIMD[DType.int, 1]
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

Because `Int` is machine-width, its width is **platform-dependent**:

> `Int` is 64-bit on most platforms today, but that isn't guaranteed. Code that
> depends on a specific width should use a sized type.

Source: <https://mojolang.org/docs/reference/numeric-types/>.

That is a 1.0 change with a migration note: `Int` is now an alias for
`Scalar[DType.int]` and "some conversions have become stricter". Source:
<https://mojolang.org/releases/v1.0.0/>.

### `UInt` — machine-width unsigned

> `UInt` is a machine-width unsigned integer.

Source: <https://mojolang.org/docs/reference/numeric-types/>. The
1.0 release notes record that the former `UInt` struct became an alias:
"`UInt` = `Scalar[DType.uint]`". Source:
<https://mojolang.org/releases/v1.0.0/>.

### Sized integer types

Sized types have a declared width that stays the same on every platform.

| Signed | Width | Unsigned | Width |
|--------|-------|----------|-------|
| `Int8` | 8-bit | `UInt8` | 8-bit |
| `Int16` | 16-bit | `UInt16` | 16-bit |
| `Int32` | 32-bit | `UInt32` | 32-bit |
| `Int64` | 64-bit | `UInt64` | 64-bit |
| `Int128` | 128-bit | `UInt128` | 128-bit |
| `Int256` | 256-bit | `UInt256` | 256-bit |

Each is a `Scalar` alias: `Int32` is `Scalar[DType.int32]`, which is
`SIMD[DType.int32, 1]`. Source:
<https://mojolang.org/docs/reference/numeric-types/>.

The official selection guidance:

> - Use `Int` and `UInt` for counts, indices, loop bounds, and
>   general-purpose math. It's what the standard library expects and returns.
> - Use sized integers when width matters: file layouts, pixel data, hardware
>   registers, or any context where the number of bits is part of the contract.
> - Use named types for scalar work and `SIMD` when you need vectors.

Source: <https://mojolang.org/docs/reference/numeric-types/>.

There is a hard requirement at the accelerator boundary in 1.0: `Int` and
`UInt` no longer conform to `DevicePassable`, so use a fixed-width type such as
`Int32` in GPU kernels. Source:
<https://mojolang.org/releases/v1.0.0/>.

### Integer bounds

Every integer type exposes `MIN` and `MAX` as compile-time constants:

```mojo
def main():
    print(Int.MIN)      # -9223372036854775808 (on a 64-bit platform)
    print(Int.MAX)      # 9223372036854775807
    print(UInt.MIN)     # 0
    print(UInt.MAX)     # 18446744073709551615
    print(UInt8.MAX)    # 255
    print(Int8.MIN)     # -128
    print(UInt32.MAX)   # 4294967295
    print(Int32.MIN)    # -2147483648
    print(SIMD[DType.int16, 1].MIN)  # -32768
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

### `Byte`

> `Byte` is another name for `UInt8`.

Source: <https://mojolang.org/docs/reference/numeric-types/>. The stated use is
semantic: "Use `Byte` when the data represents raw bytes rather than small
numbers. It's the element type used in many I/O and memory interfaces."

```mojo
var buf: List[Byte] = [0x48, 0x65, 0x6C, 0x6C, 0x6F]
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

## Floating-point types

Mojo has no general `Float` type analogous to `Int`:

> Mojo doesn't provide a `Float` type analogous to `Int`. Instead it provides
> numerous fixed-width floating-point types. Each is an alias for a
> one-element `SIMD`.

Source: <https://mojolang.org/docs/reference/numeric-types/>.

| Type | Bits | Standard | What it is |
|------|------|----------|------------|
| `Float16` | 16 | IEEE 754 binary16 | `Scalar[DType.float16]` |
| `Float32` | 32 | IEEE 754 binary32 | `Scalar[DType.float32]` |
| `Float64` | 64 | IEEE 754 binary64 | `Scalar[DType.float64]` |
| `BFloat16` | 16 | Brain float | `Scalar[DType.bfloat16]` |
| `Float4_e2m1fn` | 4 | OCP MX | `Scalar[DType.float4_e2m1fn]` |
| `Float8_e4m3fn` | 8 | OFP8 | `Scalar[DType.float8_e4m3fn]` |
| `Float8_e4m3fnuz` | 8 | — | `Scalar[DType.float8_e4m3fnuz]` |
| `Float8_e5m2` | 8 | OFP8 | `Scalar[DType.float8_e5m2]` |
| `Float8_e5m2fnuz` | 8 | — | `Scalar[DType.float8_e5m2fnuz]` |
| `Float8_e8m0fnu` | 8 | OFP8 §5.4 | `Scalar[DType.float8_e8m0fnu]` |
| `FloatLiteral` | arbitrary | — | Compile-time only. Materializes to `Float64`. |

Source: <https://mojolang.org/docs/reference/numeric-types/>.

`Float32` and `Float64` are the portable choices; the reference names them "the
portable alternatives for CPU and cross-platform code". Sources:
<https://mojolang.org/docs/reference/numeric-types/> and
<https://mojolang.org/docs/manual/types/>.

### Precision and special values

`Float32` gives roughly 7 significant decimal digits; `Float64` gives roughly
15–16. Source: <https://mojolang.org/docs/reference/numeric-types/>.

IEEE 754 types support `inf`, `-inf`, `nan` and `-0.0`. Access bounds and
special values through `SIMD` constants:

```mojo
def main():
    print(Float32.MAX)          # largest value (may be +inf)
    print(Float32.MIN)          # smallest value (may be -inf)
    print(Float32.MAX_FINITE)   # largest finite value
    print(Float32.MIN_FINITE)   # smallest (most negative) finite value
```

The reference explains the distinction: "`MAX` and `MIN` may be infinite for
floating-point types. `MAX_FINITE` and `MIN_FINITE` give the largest and
smallest representable finite values." Source:
<https://mojolang.org/docs/reference/numeric-types/>.

`FloatLiteral` also carries the special values as compile-time constants:
`FloatLiteral.nan`, `FloatLiteral.infinity`, `FloatLiteral.negative_infinity`
and `FloatLiteral.negative_zero`. Use `is_nan()` and `is_neg_zero()` to test
them, "since `nan == nan` is `False` and `negative_zero == 0.0` is `True`."
Source: <https://mojolang.org/docs/reference/numeric-types/>.

The low-precision naming suffixes encode layout and limits: `e4m3` is 4
exponent bits and 3 mantissa bits; `fn` means "finite — no infinity or negative
infinity encodings"; `uz` means "unsigned zero — no negative zero encoding";
`fnu` means "finite, no sign, unsigned zero". Source:
<https://mojolang.org/docs/reference/numeric-types/>.

> **Open question:** the numeric-types reference says there is "no single
> `Float8` type in Mojo" but also that `DType.float8_e3m4` "exists as a dtype
> value but has no `Scalar` alias". The list of `Float8_*` `Scalar` aliases and
> the list of `DType.float8_*` values is therefore not one-to-one. Always
> construct low-precision values through `Scalar[DType....]` explicitly when the
> alias is missing. Source: <https://mojolang.org/docs/reference/numeric-types/>.

### Floating-point comparison

Do not compare floating-point values with `==`. The types manual gives a
concrete demonstration where the equality is surprising:

```mojo
var big_num = 1.0e16
var bigger_num = big_num + 1.0
print(big_num == bigger_num)
```

Output:

```output
True
```

Source: <https://mojolang.org/docs/manual/types/>. The numeric-types reference
shows the accumulation case and the fix:

```mojo
from std.math import isclose

var total: Float64 = 0.0
for _ in range(10):
    total += 0.1
print(total == 1.0)        # False
print(isclose(total, 1.0)) # True
```

Sources: <https://mojolang.org/docs/manual/operators/> and
<https://mojolang.org/docs/reference/numeric-types/>.

## Numeric literals and materialization

Mojo has two compile-time literal types, `IntLiteral` and `FloatLiteral`. They
"support arbitrary precision and exist only during compilation." Source:
<https://mojolang.org/docs/reference/numeric-types/>.

```mojo
var a: Int = 42            # becomes Int
var b: Int8 = 42           # becomes Int8
var c: Float32 = 42        # becomes Float32
var d: UInt64 = 1_000_000  # becomes UInt64
```

Source: <https://mojolang.org/docs/reference/numeric-types/>. The process of
converting a compile-time-only value into a runtime value is called
**materialization**:

> This process of converting a value that can only exist at compile time into a
> runtime value is called *materialization*.

Source: <https://mojolang.org/docs/manual/types/>. Defaults: `IntLiteral` "can
convert to any finite-precision integer type, defaulting to `Int`"; 
`FloatLiteral` "converts to any finite-precision floating-point type, defaulting
to `Float64`". Source: <https://mojolang.org/docs/manual/types/>.

```mojo
var float1 = 3.3          # Float64 (the default)
var float2: Float32 = 7.5 # Float32
var int1 = 5              # Int (the default)
var int2: Int8 = 4        # Int8
```

Source: <https://mojolang.org/docs/manual/types/>.

Compile-time arithmetic on literals does not overflow or lose precision:

```mojo
comptime big = 2 ** 200     # arbitrary precision, no overflow
var x = 42                  # this IntLiteral materializes to Int
```

Source: <https://mojolang.org/docs/reference/numeric-types/>. Literals also
adapt to the types around them in expressions, and that is **not** implicit
conversion between variables:

> This isn't implicit conversion. The literal doesn't have a runtime type yet.
> It becomes whatever type the context requires.

```mojo
var x = Float32(1.0)
var y = x * 0.5           # 0.5 becomes Float32
var z = x + 2             # 2 becomes Float32
```

Source: <https://mojolang.org/docs/reference/numeric-types/>. The lexer rules
for integer and float literals (bases, underscores, leading zeros, exponent
digits) are covered on [Literals](../basics/literals.md).

## Explicit conversion

Numeric operators never narrow or widen operands:

> In Mojo, numeric operators **don't** automatically narrow or widen operands
> to a common type. You need to explicitly convert the operands to the desired
> type.

Source: <https://mojolang.org/docs/manual/types/>.

Between `SIMD`-based types, use `.cast[]`; between `Int` and `SIMD`-based types,
use constructors:

```mojo
def main():
    var i = 42                    # Int
    var f = Float32(i)            # Int -> Float32 (constructor)
    var u = UInt64(i)             # Int -> UInt64
    var narrow = Int8(i)          # Int -> Int8

    var a = Float32(3.14)
    var b = a.cast[DType.int32]() # Float32 -> Int32 (.cast)
    var c = a.cast[DType.float64]()  # Float32 -> Float64

    var s = Int64(i)              # Int -> Int64
    var back = Int(s)             # Int64 -> Int
```

Sources: <https://mojolang.org/docs/reference/numeric-types/> and
<https://mojolang.org/docs/manual/types/>.

The official reason conversions are explicit:

> Implicit numeric conversions can hide precision loss and sign changes. For
> example, `Int64(-1)` becoming `UInt64(18446744073709551615)` is a bug, not a
> convenience. Mojo requires an explicit conversion so the intent is clear.

Source: <https://mojolang.org/docs/reference/numeric-types/>.

Any scalar numeric type can be converted to `Int` by passing it to the `Int()`
constructor; the manual adds that any struct implementing `Intable` or
`IntableRaising` can be converted the same way. Source:
<https://mojolang.org/docs/manual/types/>.

## Sharp edges and pitfalls

- **Assuming `Int` is 64-bit.** `Int` is machine-width. Code that depends on a
  width must use `Int64` (or another sized type). Verified above.
- **Assuming integer overflow traps.** It does not. Signed overflow wraps into
  the negative range and unsigned overflow wraps to zero, using two's
  complement: `Int8(127) + Int8(1)` is `-128`, `UInt8(255) + UInt8(1)` is `0`.
  "Mojo doesn't trap on overflow. If you need overflow detection, check the
  operands before the operation." Source:
  <https://mojolang.org/docs/reference/numeric-types/>.
- **Expecting `Int(Float32(3.9))` to round.** Float-to-int truncates toward
  zero: `Int(Float32(3.9))` is `3` and `Int(Float32(-3.9))` is `-3`. Source:
  <https://mojolang.org/docs/reference/numeric-types/>.
- **Comparing NaN.** `nan == nan` is always `False`, which affects SIMD masks
  and conditional selection. Source:
  <https://mojolang.org/docs/reference/numeric-types/>.
- **Treating `DType.float64` as a type.** It is a value. The type is
  `SIMD[DType.float64, 1]`, or the alias `Float64`. Verified above.
- **Relying on 128-bit and 256-bit integers for speed.** `Int128`/`UInt256`
  and friends "exist but have limited hardware support on most platforms";
  benchmark before using them in performance-critical code. Source:
  <https://mojolang.org/docs/reference/numeric-types/>.
- **Using `Float8` on CPU.** These types "require GPU hardware for efficient
  execution"; arithmetic is not supported at runtime on CPU, and they cannot
  convert to or from any integer type on any platform (including `Bool`).
  Source: <https://mojolang.org/docs/reference/numeric-types/>.
- **Dividing `Int` with `/` expecting a float.** In 1.x `Int.__truediv__` is
  truncating integer division returning `Int`; use an explicit `Float64` cast
  for floating-point division. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Using `size` on `SIMD`.** The parameter was renamed to `length`; positional
  `SIMD[DType.float32, 4]` is unaffected, but the keyword form
  `SIMD[dtype, size=4]` is an error and must be `length=`. Source:
  <https://mojolang.org/releases/v1.0.0/>.

## Sources

- Mojo numeric types reference: <https://mojolang.org/docs/reference/numeric-types/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Types (manual): <https://mojolang.org/docs/manual/types/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
