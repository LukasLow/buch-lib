# Vectorization and SIMD

SIMD is not a specialist tool bolted onto Mojo; it is **the core of Mojo's
numeric model**. Every fixed-width numeric type is a one-element `SIMD`, and the
`DType` abstraction that underlies all of them is the same abstraction that
describes a 16-lane vector. This page covers three connected things:

1. **The `SIMD` type and the `DType` model** — what a vector is, how width and
   element type are parameters, and how a `Scalar` is the one-lane case.
2. **`vectorize`** — the library function that turns a loop into SIMD work.
3. **How this connects to numeric types** — `Int`, `Float32` and friends are
   `SIMD` aliases, and that is why the same arithmetic works for scalars and
   vectors.

Sources are the official numeric-types reference
(<https://mojolang.org/docs/reference/numeric-types/>), the manual types page
(<https://mojolang.org/docs/manual/types/>), the `SIMD` API reference
(<https://mojolang.org/docs/std/builtin/simd/SIMD/>), the `simd` package index
(<https://mojolang.org/docs/std/builtin/simd/>), and the `vectorize` reference
(<https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>).

## `SIMD` is a core type

> "Mojo's numeric primitives are built on `SIMD` vectors. Every fixed-width
> numeric type is a one-element `SIMD` called a `Scalar`. The `DType` specifies
> the kind of values stored in a `SIMD` vector, such as `int`, `uint`, `float32`,
> `int64`, or `uint8`."
> — <https://mojolang.org/docs/reference/numeric-types/>

> "`SIMD` stands for "Single Instruction, Multiple Data". It lets the CPU operate
> on multiple values at once using a single instruction.
>
> A `SIMD` value stores one or more values of the same type in a fixed-size
> vector. The number of values is called the *width*, and it must be a power of
> two.
>
> The width is part of the type. For example, `SIMD[DType.float32, 4]` is a
> vector of four 32-bit floats. `SIMD[DType.int8, 16]` is a vector of sixteen
> 8-bit integers."
> — <https://mojolang.org/docs/reference/numeric-types/>

The declaration is parameterized on two things:

```text
struct SIMD[dtype: DType, length: SIMDLength]
```

Source: <https://mojolang.org/docs/std/builtin/simd/SIMD/>.

- `dtype` selects the element kind (`DType.float32`, `DType.int8`, …).
- `length` is the lane count, a `SIMDLength`, and must be a positive power of 2.

The manual makes the performance claim:

> "Modern CPUs can process 4, 8, 16, or more values in parallel with SIMD, which
> can significantly improve performance over scalar operations."
> — <https://mojolang.org/docs/reference/numeric-types/>

And the API reference states the design properties:

> "Key properties:
>
> - **Hardware-mapped**: Directly maps to CPU vector registers
> - **Type-safe**: Data types and vector sizes are checked at compile time
> - **Zero-cost**: No runtime overhead compared to hand-optimized intrinsics
> - **Portable**: Same code works across different CPU architectures (x86, ARM,
>   etc.)
> - **Composable**: Seamlessly integrates with Mojo's parallelization features"
> — <https://mojolang.org/docs/std/builtin/simd/SIMD/>

## The `SIMDLength` type

The length parameter is not `Int`; it is `SIMDLength`:

> "A new `SIMDLength` type has been added for the length of `SIMD` vectors. Use
> it when inferring a parameter from a `SIMD` argument, as in
> `def frob[w: SIMDLength](v: SIMD[DType.int, w]): ...`; leave the length unbound
> (`SIMD[DType.int, _]`) to be parametric over any `SIMD` type, and use `Int` in
> all other situations."
> — <https://mojolang.org/releases/v1.0.0/>

Its own reference adds: "Represents a type appropriate for the length of a simd
vector. Note: Typically you should use `Int` instead."
(<https://mojolang.org/docs/std/builtin/simd_length/SIMDLength/>) The practical
rule: write `SIMDLength` in a *parameter* position that infers a vector width;
write `Int` everywhere else.

> **Pitfall:** the second `SIMD` parameter was renamed from `size` to `length`
> in 1.0.0. "Positional uses such as `SIMD[DType.float32, 4]` are unaffected, and
> reading the parameter as `v.size` still works but warns. Binding it by keyword
> as `SIMD[dtype, size=4]` is an error and must be updated to `length=`."
> (<https://mojolang.org/releases/v1.0.0/>) Write `length=`.

## `Scalar`: the one-lane case

> "A `SIMD` with one element is called a `Scalar`. Every fixed-width numeric name
> in Mojo is a `Scalar` alias:"

```mojo
# These are all the same type
var a: Scalar[DType.float32] = 3.14
var b: Float32 = 3.14
var c: SIMD[DType.float32, 1] = 3.14
```

> "When you write `Float32`, you're writing `Scalar[DType.float32]`, which is
> `SIMD[DType.float32, 1]`."
> — <https://mojolang.org/docs/reference/numeric-types/>

This is the connection to the numeric-types model, stated exactly:

```mojo
comptime Scalar = SIMD[length=1]
comptime Int = Scalar[DType.int]
comptime Int8 = Scalar[DType.int8]
comptime Float32 = Scalar[DType.float32]
```

> "This means that whether you're working with a single `Float32` value or a
> vector of float32 values, the math operations go through exactly the same code
> path."
> — <https://mojolang.org/docs/manual/types/>

So "should I use a vector or a scalar?" is a **width** question, not a
language-feature question. `Int32` *is* `SIMD[DType.int32, 1]`.

### `Int` is a `Scalar` alias

> "`Int` is now an alias for `Scalar[DType.int]` and integer literals
> materialize to this `Scalar` type. Because of this, some conversions have
> become stricter."
> — <https://mojolang.org/releases/v1.0.0/>

```mojo
Comptime Int = Scalar[DType.int]   # i.e. SIMD[DType.int, 1]
```

**Pitfall:** because `Int` is a `SIMD`, the `SIMD` methods are available on it
(`.cast[]`, `.reduce_add()`, elementwise comparison via `.gt()`, …). That is a
feature, but it also means some `Int` conversions are stricter than you might
expect from a plain integer type.

## `DType`: the element kind

> "`DType` names the kind of values stored in a `SIMD` vector, such as
> `float32`, `int64`, or `uint8`. A `DType` doesn't store data. It tells `SIMD`
> how to interpret each element and which operations to use:"

```mojo
# DType selects a number kind, such as 32-bit float or 8-bit integer
var x: SIMD[DType.float32, 4] = # ...  # four 32-bit floats
var y: SIMD[DType.int8, 16] = # ...    # sixteen 8-bit ints
```

> — <https://mojolang.org/docs/reference/numeric-types/>

`DType` also enables generic code over element kinds:

```mojo
# Double a value. The cast is required because the parameterized type
# parameter can't be used directly with the literal `2`.
def double[T: DType](x: Scalar[T]) -> Scalar[T]:
    return x * UInt8(2).cast[T]()
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

**Pitfall:** the literal `2` cannot be used directly with a `DType` parameter;
the reference explicitly casts, `UInt8(2).cast[T]()`, for that reason.

### The `DType` table

**Signed integers** (`DType.int8`, `int16`, `int32`, `int64`, `int128`, `int256`,
and platform-width `int`) and their unsigned counterparts `uint8` … `uint256`,
`uint`. Source: <https://mojolang.org/docs/reference/numeric-types/>.

**Floating-point DTypes**:

| Value | Selects |
|---|---|
| `DType.float16` | 16-bit IEEE half |
| `DType.bfloat16` | 16-bit brain float |
| `DType.float32` | 32-bit IEEE single |
| `DType.float64` | 64-bit IEEE double |
| `DType.float8_e4m3fn` | 8-bit (4-exp, 3-mantissa) |
| `DType.float8_e4m3fnuz` | 8-bit, unsigned zero |
| `DType.float8_e5m2` | 8-bit (5-exp, 2-mantissa) |
| `DType.float8_e5m2fnuz` | 8-bit, unsigned zero |
| `DType.float8_e8m0fnu` | 8-bit (8-exp, no mantissa) |
| `DType.float4_e2m1fn` | 4-bit (2-exp, 1-mantissa) |
| `DType.bool` | Boolean (1-bit) |

Source: <https://mojolang.org/docs/reference/numeric-types/>.

> "`DType.float64` isn't a *type*, it's a value that describes a data type. You
> can't create a variable with the type `DType.float64`. You can create a
> variable with the type `SIMD[DType.float64, 1]` (or `Float64`, which is the
> same thing)."
> — <https://mojolang.org/docs/manual/types/>

## Using `SIMD`

### Constructing

From the API reference (<https://mojolang.org/docs/std/builtin/simd/SIMD/>):

| Form | Result |
|---|---|
| `SIMD[dtype, length]()` | all zeros |
| `SIMD[dtype, length](value)` | splat one value across all lanes |
| `SIMD[dtype, length](v0, v1, ...)` | explicit lane values; lane count must match |
| `SIMD[dtype, length](other: SIMD[other_dtype, length])` | cast from another vector |
| `SIMD[dtype, length](*, from_bits: SIMD[int_dtype, length])` | reinterpret bits |
| `SIMD[dtype, length]()(*, py: PythonObject)` | from a Python value (raises) |

```mojo
var v = SIMD[DType.float32, 4](1.0, 2.0, 3.0, 4.0)
var doubled = v * 2.0   # All four elements doubled
print(doubled) # [2.0, 4.0, 6.0, 8.0]
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

**Pitfall:** a length greater than 1 with a single value **splats**, it does not
error — `SIMD[DType.float32, 8](2.0)` is eight twos. Splatting is intentional and
documented, but it is easy to misread as "one lane".

### Element access

> "Read and write individual elements by index ("*lane*"):"

```mojo
v[0]       # Read element 0 → Scalar[DType.float32]
v[0] = 5.0 # Write element 0
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

### Elementwise operations

> "Arithmetic, comparison, and bitwise operations apply to all elements at once:"

```mojo
var a = SIMD[DType.float32, 4](1.0, 2.0, 3.0, 4.0)
var b = SIMD[DType.float32, 4](5.0, 6.0, 7.0, 8.0)

var sum = a + b        # [6.0, 8.0, 10.0, 12.0]
var prod = a * b       # [5.0, 12.0, 21.0, 32.0]
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

The `SIMD` reference lists the supported operators: `+`, `-`, `*`, `/`, `%`, `//`
for arithmetic; `==`, `!=`, `<`, `<=`, `>`, `>=` for comparison; `&`, `|`, `^`,
`~`, `<<`, `>>` for bit operations; plus `sqrt()`, `sin()`, `cos()`, `fma()` and
other math functions. (<https://mojolang.org/docs/std/builtin/simd/SIMD/>)

**Pitfall:** the scalar comparison methods and the vector comparison methods do
different things. `__eq__` on a vector "compares two SIMD vectors for equality"
and returns a single `Bool`; `eq()` returns `SIMD[DType.bool, length]` — a
per-lane mask. Use `.gt()`, `.lt()`, `.eq()` etc. when you need a mask.

```mojo
# Double the positive values and negate the negative values
var values = SIMD[DType.int32, 4](1, -2, 3, -4)
var is_positive = values.gt(0)  # greater-than: gets SIMD of booleans
var result = is_positive.select(values * 2, values * -1)
print(result)  # => [2, 2, 6, 4]
```

Source: <https://mojolang.org/docs/std/builtin/simd/SIMD/>.

### Reductions

> "Reductions combine all elements into a single value:"

```mojo
a.reduce_add()         # 10.0
a.reduce_max()         # 4.0
a.reduce_min()         # 1.0
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

The full set is `reduce_add`, `reduce_mul`, `reduce_min`, `reduce_max`,
`reduce_and`, `reduce_or`, `reduce_xor`, plus a generic `reduce[func]`. Each
takes an optional `size_out: Int = 1` parameter for partial reductions.
(<https://mojolang.org/docs/std/builtin/simd/SIMD/>)

### Casting

> "Casting converts each element to a different numeric type. The number of
> elements stays the same, even when the target type is wider or narrower:"

```mojo
var a = SIMD[DType.float32, 4](1.0, 2.0, 3.0, 4.0)
var ints = a.cast[DType.int32]()    # [1, 2, 3, 4]
var wide = a.cast[DType.float64]()  # 4 × Float64
var tiny = a.cast[DType.float16]()  # 4 × Float16
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

The reference documents the semantics precisely, including that float→int
"floors":

```mojo
# Basic casting preserves value within range
Int8(UInt8(127)) == Int8(127)

# Numbers above signed max wrap to negative using two's complement
Int8(UInt8(128)) == Int8(-128)
Int8(UInt8(129)) == Int8(-127)
Int8(UInt8(256)) == Int8(0)

# Negative signed cast to unsigned using two's complement
UInt8(Int8(-128)) == UInt8(128)
UInt8(Int8(-127)) == UInt8(129)
UInt8(Int8(-1)) == UInt8(255)

# Truncate precision after downcast and upcast
Float64(Float32(Float64(123456789.123456789))) == Float64(123456792.0)

# Rightmost bits of significand become 0's on upcast
Float64(Float32(0.3)) == Float64(0.30000001192092896)

# Numbers equal after truncation of float literal and cast truncation
Float32(Float64(123456789.123456789)) == Float32(123456789.123456789)

# Float to int/uint floors
Int64(Float64(42.2)) == Int64(42)
```

Source: <https://mojolang.org/docs/std/builtin/simd/SIMD/>.

**Pitfall:** `cast[]` does not saturate. Out-of-range casts wrap (two's
complement), so a `UInt8(200)` cast to `Int8` is negative. If you need clamping,
use `.clamp(lo, hi)`.

### Clamping, min/max

> "Clamping restricts elements to a range. Both bounds are inclusive, so the
> result can equal the bounds:"

```mojo
# max(min(self, upper_bound), lower_bound)
a.clamp(1.5, 3.5)     # [1.5, 2.0, 3.0, 3.5]
```

> "`min()` and `max()` are free functions, not methods:"

```mojo
min(a, b)              # Element-wise minimum
max(a, b)              # Element-wise maximum
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

**Pitfall:** `clamp`, `min`, `max` and `fma` are easy to mix up: `clamp` is a
method on `SIMD`; `min`/`max` are free functions. The reference calls this out
explicitly.

### Width limits

> "`SIMD` has a hard limit of 2**15 (32768) elements. This is a compile-time
> limit, not a runtime one.
>
> In practice, the usable width is much smaller and depends on the hardware. For
> example, `SIMD[DType.float32, 4]` fits in a 128-bit register, while
> `SIMD[DType.float32, 16]` requires 512 bits, which matches or exceeds the width
> of most SIMD registers.
>
> Always benchmark to find the optimal width for your workload and target
> hardware."
> — <https://mojolang.org/docs/reference/numeric-types/>

The `SIMD` struct page adds a stronger warning:

> "**Caution:** If you declare a SIMD vector size larger than the vector
> registers of the target hardware, the compiler will break up the SIMD into
> multiple vector registers for compatibility. However, you should avoid using a
> vector that's more than 2x the hardware's vector register size because the
> resulting code will perform poorly."
> — <https://mojolang.org/docs/std/builtin/simd/SIMD/>

**Pitfall:** a big width does not mean more speed. The hardware splits it into
multiple registers, and the manual says performance degrades beyond 2× the
register width.

### Portability: ask the target, do not guess

Hardware width is queryable at compile time:

```mojo
def simd_width_of[type: RegisterPassable, target: ... = _current_target()]() -> Int
def simd_width_of[dtype: DType, target: ... = _current_target()]() -> Int
```

> "Returns the vector size of the type on the host system."
> — <https://mojolang.org/docs/std/sys/info/simd_width_of/>

Use it instead of hard-coding 4 or 8:

```mojo
from std.sys import simd_width_of

comptime simd_width = simd_width_of[DType.int32]()
```

`simd_width_of` returns a number of **elements**, not bytes, for the given
`dtype`. That is the value to pass as the `simd_width` parameter of `vectorize`.

## `vectorize`: turning a loop into SIMD work

`vectorize` is the library entry point. From the reference
(<https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>):

> "Simplifies SIMD optimized loops by mapping a function across a range from 0
> to `size`, incrementing by `simd_width` at each step. The remainder of
> `size % simd_width` will run in separate iterations."

> "You describe the work; the library decides how to distribute it across SIMD
> lanes, threads, or cores."
> — <https://mojolang.org/docs/manual/functions/closures/>

### Signature and the basic example

```mojo
def vectorize[
    func: def[width: Int](idx: Int) -> None,
    //,
    simd_width: Int,
    /,
    *,
    unroll_factor: Int = Int(1),
](size: Int, closure: func)
```

The documented example:

```mojo
from std.algorithm.functional import vectorize
from std.memory.alloc import alloc, dealloc, Layout
from std.sys import simd_width_of

# The amount of elements to loop through
comptime size = 10
# How many Dtype.int32 elements fit into the SIMD register (4 on 128bit)
comptime simd_width = simd_width_of[DType.int32]()  # assumed to be 4 in this example

def main():
    var allocation = alloc(Layout[Int32](count=size))

    def closure[width: Int](i: Int) {mut}:
        print("storing", width, "els at pos", i)
        allocation.unsafe_ptr().store[width=width](i, Int32(i))

    vectorize[simd_width](size, closure)
    print(allocation.unsafe_ptr().load[width=simd_width]())
    print(allocation.unsafe_ptr().load[width=simd_width](simd_width))

    dealloc(allocation^)
```

```plaintext
storing 4 els at pos 0
storing 4 els at pos 4
storing 1 els at pos 8
storing 1 els at pos 9
[0, 0, 0, 0, 4, 4, 4, 4, 8, 9]
```

Source: <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>.

Four things to read out of that example:

- **`simd_width` is a compile-time parameter.** It appears in square brackets:
  `vectorize[simd_width](size, closure)`. It is not a run-time argument.
- **The closure is parameterized on `width`.** `def closure[width: Int](i: Int)`.
  The wrapper calls it with the full `simd_width` for main iterations and with a
  smaller `width` for the remainder.
- **The index is the lane-group start**, not the lane. The closure is expected to
  process `width` consecutive elements starting at `i` — which is what
  `store[width=width](i, value)` does.
- **The remainder runs separately.** For `size = 10` and `simd_width = 4`, the
  manual's output shows two full-width iterations plus two scalar ones.

**Pitfall:** the closure index is a group offset. Writing `results[i] = ...`
inside a `vectorize` closure assigns one element per *group*, not per element.
Use a width-aware store/load, as the official example does, or index with
`i + lane`.

### The `evl` variant (predicated tail)

A second overload keeps the SIMD width fixed and passes an **effective vector
length** for the partial tail:

> "The main loop runs with a fixed SIMD width of `simd_width`. Any remainder
> (`size % simd_width`) is executed with a single final call using predication via
> the `evl` (effective vector length) argument.
>
> Compared to `vectorize` variants that run the remainder as scalar iterations
> (`width=1`), this version keeps the SIMD width fixed and passes the number of
> active lanes in `evl` for the last (partial) vector. The closure is responsible
> for honoring `evl` (e.g. using masked loads/stores) to avoid out-of-bounds
> accesses."

```mojo
from std.algorithm.functional import vectorize
from std.memory.alloc import alloc, dealloc, Layout
from std.sys import simd_width_of
from std.math import iota
from std.sys.intrinsics import masked_store

comptime size = 10
comptime simd_width = simd_width_of[DType.int32]()  # assumed 4 in this example

def main():
    var allocation = alloc(Layout[Int32](count=size))

    def closure[width: Int](i: Int, evl: Int) {mut}:
        print("storing", evl, "of", width, "els at pos", i)
        var val = SIMD[DType.int32, width](i)

        # Optimization: Constant propagation eliminates this check in the main loop
        if evl == width:
            allocation.unsafe_ptr().store[width=width](i, val)
        else:
            # Tail loop: Generate mask from EVL to prevent OOB
            var mask = iota[DType.int32, width]().lt(Int32(evl))
            masked_store[width](val, allocation.unsafe_ptr() + i, mask)

    vectorize[simd_width](size, closure)

    print(allocation.unsafe_ptr().load[width=simd_width]())
    print(allocation.unsafe_ptr().load[width=simd_width](simd_width))
    print(allocation.unsafe_ptr().load[width=2](2 * simd_width))
    dealloc(allocation^)
```

```plaintext
storing 4 of 4 els at pos 0
storing 4 of 4 els at pos 4
storing 2 of 4 els at pos 8
[0, 0, 0, 0]
[4, 4, 4, 4]
[8, 8]
```

Source: <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>.

The reference spells out the contract:

> "For all full SIMD iterations `evl == simd_width`. For the final partial
> iteration `0 < evl < simd_width`."

> "**Pitfall:** this implementation does not execute the remainder as scalar
> iterations. The closure must correctly handle `evl` to keep memory accesses
> in-bounds."
> — <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>

And the edge case: "If `size < simd_width`, the loop will consist of a single
call: `closure[simd_width](0, size)`."

**Pitfall:** the `evl` closure signature is
`def[width: Int](idx: Int, evl: Int) -> None`. Two indices, one of them the
active-lane count. Getting that wrong changes which elements are written.

### Compile-time `size`

A third overload takes `size` as a parameter:

```mojo
def vectorize[
    func: def[width: Int](idx: Int) -> None,
    //,
    simd_width: Int,
    /,
    *,
    size: Int,
    unroll_factor: Int = Int(1),
](closure: func)
```

> "The remainder of `size % simd_width` will run in a single iteration if it's an
> exponent of 2. … If the remainder is not an exponent of 2 (2, 4, 8, 16 ...)
> there will be a separate iteration for each element. However passing `size` as a
> parameter also allows the loop for the remaining elements to be unrolled."
> — <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>

**Pitfall:** the compile-time overload passes `size` as a *parameter*, not an
argument: `vectorize[simd_width, size=size, unroll_factor=2](closure)`. Mixing
the two overloads' call shapes silently selects a different implementation.

### Unrolling

All overloads accept `unroll_factor`:

> "You can also unroll the main loop to potentially improve performance at the
> cost of binary size. In the generated assembly the function calls will be
> repeated, resulting in fewer arithmetic, comparison, and conditional jump
> operations."
> — <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>

The trade-off is explicit: faster loop body, larger binary.

### Where `vectorize` is imported from

The official examples use:

```mojo
from std.algorithm.functional import vectorize
```

while the API page lives under
`std/algorithm/backend/vectorize/vectorize`
(<https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>). The
`functional` module's index confirms it "Implements higher-order functions" and
that "You can import these APIs from the `algorithm` package":
<https://mojolang.org/docs/std/algorithm/functional/>.

`vectorize` is *not* a keyword. The keywords reference lists library and builtin
names that are wrongly taken for keywords, and names `vectorize` explicitly
(<https://mojolang.org/docs/reference/keywords/>).

## How it connects to the numeric-types model

The chain is short and worth stating as a diagram:

```text
DType            (a value: float32, int8, …)
   │
   ▼
SIMD[DType, length]     (a vector of `length` elements of that kind)
   │
   ├── length == 1  ──►  Scalar[DType]      (e.g. Int32 = Scalar[DType.int32])
   │
   └── length > 1   ──►  a SIMD vector      (e.g. SIMD[DType.float32, 4])
```

Consequences an agent should carry:

1. **Numeric types are vector types with width 1.** `Int`, `Int8`, `UInt64`,
   `Float16`, `Float32`, `Float64`, `BFloat16` — all are `Scalar[DType.*]`.
2. **The same operations exist at both widths.** `+`, `*`, `==`, `.cast[]`,
   `.reduce_add()` work on a scalar and on a vector.
3. **Genericity over dtypes is the normal pattern.** A function taking
   `[T: DType](x: Scalar[T])` works for every fixed-width numeric type; a
   function taking `SIMD[T, w]` also works for vectors of any width `w`.
4. **`SIMDLength` is the width type**, and `Int` is the right type for ordinary
   arithmetic; only parameter inference should use `SIMDLength`.
5. **`vectorize` is how you cross from a scalar loop to vector work**, with
   `simd_width_of[dtype]()` telling you the hardware width.

## Other vectorization building blocks

`std.algorithm` groups "High performance data operations including vectorization,
functional map, and tiling" (<https://mojolang.org/docs/std/algorithm/>). Besides
`vectorize`:

- **`map`** (from `std.algorithm`): "Maps a function over the integer range
  `[0, size)`. This lets you apply an integer index-based operation across data
  captured by the mapped function." It is eager (unlike the lazy `iter.map`):

  > "Don't confuse `algorithm.map` (this eager, index-based helper) with
  > `iter.map`, which returns a lazy iterator that applies a function to each
  > element."
  > — <https://mojolang.org/docs/std/algorithm/backend/cpu/map/map/>

- **`tile`** (from `std/algorithm/backend/tile`): "A generator that launches work
  groups in specified list of tile sizes." A tile size is a compile-time width:
  "`work_on[3](5)` should launch computation on item 5,6,7, and should be
  semantically equivalent to `work_on[1](5)`, `work_on[1](6)`,
  `work_on[1](7)`." There are 1-D and 2-D forms, plus a runtime-tile-size form.
  (<https://mojolang.org/docs/std/algorithm/backend/tile/tile/>)

- **`unswitch` / `tile_and_unswitch`**: "Implementations of unswitch and
  tile_and_unswitch functions", plus `tile_middle_unswitch_boundaries` which
  "Divides 1d iteration space into three parts and tiles them with different
  steps." (<https://mojolang.org/docs/std/algorithm/backend/unswitch/>)

- **Low-level SIMD intrinsics** in `std.sys.intrinsics`: `gather`, `scatter`,
  `strided_load`, `strided_store`, `masked_load`, `masked_store`,
  `compressed_store`, `prefetch`, `assume`, `expect`, `likely`, `unlikely`,
  `llvm_intrinsic` and more. (<https://mojolang.org/docs/std/sys/intrinsics/>)

  `masked_store` is what the `evl` example above uses to keep the tail in bounds.

## Pitfalls

- **Using `size=` for the `SIMD` length.** It was renamed to `length` in 1.0.0;
  the keyword form is now an error.
- **Treating `SIMD[DType.x, n](v)` as one-lane.** A single value splats across
  all lanes.
- **Confusing `__eq__` (one `Bool`) with `.eq()` (a lane mask).** Vector
  comparisons that return a `Bool` test the whole vector; use `.eq()`/`.gt()`/
  `.lt()` for per-lane masks.
- **Expecting `cast[]` to clamp.** It wraps on overflow.
- **Choosing a width larger than the hardware register.** The compiler splits it
  and performance degrades; avoid more than 2× the register width, and prefer
  `simd_width_of[dtype]()`.
- **Indexing per element inside a `vectorize` closure.** The index is a
  lane-group start; use width-aware load/store.
- **Ignoring `evl` in the predicated `vectorize` overload.** It writes
  out of bounds.
- **Mixing the run-time-`size` and compile-time-`size` overloads.** Their call
  shapes differ (`vectorize[w](size, fn)` vs
  `vectorize[w, size=n](fn)`).
- **Calling `vectorize` a keyword.** It is a library function.
- **Assuming `Float8`/`Float4` arithmetic works everywhere.** The numeric
  reference documents that most of these require specific GPU hardware, and that
  "None of these types support arithmetic at runtime on CPU."
  (<https://mojolang.org/docs/reference/numeric-types/>)
- **Assuming `Int128`/`Int256` are fast.** "128-bit and 256-bit integers are
  software-emulated" on most platforms.

## Open questions

> **Open question:** the `vectorize` reference documents three overloads with
> the same name but does not state the overload-resolution rule that selects
> between the run-time-`size` and compile-time-`size` forms. The difference is
> visible at the call site, but a generic wrapper could resolve unexpectedly.
> Test the resolved overload when writing wrappers around `vectorize`.

> **Open question:** the numeric-types reference says `SIMD` "has a hard limit of
> 2**15 (32768) elements", while the `SIMD` struct page says only that the length
> "must be positive and a power of 2". The limit is stated in one place and not
> the other; treat 2**15 as the practical compile-time bound until the two pages
> agree.

> **Open question:** the numeric-types reference shows `simd_width_of[DType.int32]()`
> returning the element count, but the hardware-register relationship for narrow
> types (for example `float8`, `bool`) is not documented. Verify empirically for
> sub-byte and 1-bit dtypes before relying on a returned width.

## Sources

- <https://mojolang.org/docs/reference/numeric-types/>
- <https://mojolang.org/docs/manual/types/>
- <https://mojolang.org/docs/std/builtin/simd/>
- <https://mojolang.org/docs/std/builtin/simd/SIMD/>
- <https://mojolang.org/docs/std/builtin/simd_length/SIMDLength/>
- <https://mojolang.org/docs/std/algorithm/>
- <https://mojolang.org/docs/std/algorithm/functional/>
- <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>
- <https://mojolang.org/docs/std/algorithm/backend/cpu/map/map/>
- <https://mojolang.org/docs/std/algorithm/backend/tile/tile/>
- <https://mojolang.org/docs/std/algorithm/backend/unswitch/>
- <https://mojolang.org/docs/std/sys/info/simd_width_of/>
- <https://mojolang.org/docs/std/sys/intrinsics/>
- <https://mojolang.org/docs/reference/keywords/>
- <https://mojolang.org/docs/manual/functions/closures/>
- <https://mojolang.org/releases/v1.0.0/>
