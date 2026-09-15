# bit

`bit` is Mojo's bit-manipulation toolkit.

> Bitwise operations: manipulation, counting, rotation, and power-of-two
> utilities.

> The `bit` package provides low-level bitwise operations and utilities for
> efficient bit manipulation on integer values and SIMD vectors. It includes
> functions for counting bits, reversing bit patterns, byte swapping, rotating
> bits, and computing power-of-two boundaries.

> Use this package for low-level bit manipulation, implementing custom hash
> functions, optimizing memory layouts, working with packed data structures, or
> any algorithm requiring direct bit-level control.

Source: <https://mojolang.org/docs/std/bit/>.

## The functions

All functions live in the `bit` module, and the import path is the package root:

```mojo
from std.bit import count_leading_zeros
```

Source: <https://mojolang.org/docs/std/bit/bit/>.

| Function | What it does |
|----------|--------------|
| `bit_not` | Bitwise NOT on a SIMD vector of integer values. |
| `bit_reverse` | Reverses the bit pattern of an integer value. |
| `bit_width` | Minimum number of bits needed to represent each element of an integer SIMD vector. |
| `byte_swap` | Byte-swaps an integer with an even number of bytes. |
| `count_leading_zeros` | Counts the number of leading zeros of an integer. |
| `count_trailing_zeros` | Counts the number of trailing zeros for an integer. |
| `log2_ceil` | Ceiling of the base-2 logarithm of an integer value. |
| `log2_floor` | Floor of the base-2 logarithm of an integer value. |
| `next_power_of_two` | Smallest power of 2 **≥** the input; values ≤ 1 are ceiled to 1. |
| `prev_power_of_two` | Largest power of 2 **≤** the input; values ≤ 0 are floored to 0. |
| `pop_count` | Counts the number of bits set in an integer value. |
| `rotate_bits_left` | Shifts bits left by `shift` bits, with wrap-around. |
| `rotate_bits_right` | Shifts bits right by `shift` bits, with wrap-around. |

Source: <https://mojolang.org/docs/std/bit/bit/>.

The `mask` module adds two more: `is_negative` ("Get a bitmask of whether the
value is negative") and `splat` ("Elementwise splat the boolean value of each
element in the SIMD vector into all bits of the corresponding element in a new
SIMD vector"). Source: <https://mojolang.org/docs/std/bit/mask/>.

## A runnable example

The functions operate on integers and SIMD vectors; the scalar case is a
one-lane SIMD, so the same call works on `Int`:

```mojo
from std.bit import (
    pop_count,
    count_trailing_zeros,
    count_leading_zeros,
    bit_reverse,
    next_power_of_two,
    prev_power_of_two,
    log2_floor,
    log2_ceil,
    rotate_bits_left,
    rotate_bits_right,
)

def main():
    var n = Int32(0b1011_0000)          # 176

    print(pop_count(n))                 # 3
    print(count_trailing_zeros(n))      # 4
    print(count_leading_zeros(n))       # 24 (32-bit type)

    print(bit_reverse(Int8(0b0000_0001)))  # -128 (bit pattern 1000_0000)

    print(next_power_of_two(100))       # 128
    print(prev_power_of_two(100))       # 64

    print(log2_floor(100))              # 6
    print(log2_ceil(100))               # 7

    print(rotate_bits_left(Int8(1), 1))   # 2
    print(rotate_bits_right(Int8(2), 1))  # 1
```

`bit_reverse` preserves the type's bit width; a reversed `Int8` with the top bit
set reads as a negative value. That is expected: `bit_reverse` reverses the bit
pattern, it does not interpret it as unsigned.

## Idioms

- **Use `next_power_of_two` when sizing a buffer or a hash table.** It gives the
  smallest power-of-two capacity that fits, which is what the docs describe.
- **Use `pop_count` for cardinality and Hamming distance**, `count_trailing_zeros`
  to find the lowest set bit, and `count_leading_zeros` to find the highest.
- **Use `log2_floor`/`log2_ceil` instead of a floating-point `log2()`** when the
  input is an integer; they are exact.
- **Work in SIMD.** Every function accepts and returns SIMD vectors, so a batch
  of integers costs the same call as one.
- **Reach for `mask` only for sign tests and bit-splats.** `is_negative` and
  `splat` are the two helpers there.

## Pitfalls

- **Negative inputs to the power-of-two helpers.** `next_power_of_two` ceils any
  value ≤ 1 to 1; `prev_power_of_two` floors any value ≤ 0 to 0. They do not
  error. Verified from <https://mojolang.org/docs/std/bit/bit/>.
- **Forgetting that `bit_reverse` respects the type width.** Reverse an `Int8`
  and you get an `Int8`, with the sign bit in play. Cast to an unsigned type
  first if you want the unsigned reading.
- **Using `log2_floor` on 0.** The docs do not define behaviour for 0; treat 0 as
  a caller-side special case.
- **Reimplementing `pop_count` with a loop.** The library function maps to a
  hardware instruction.
- **Assuming a stable API.** See below.

### Reading a `SIMD` result

`pop_count`, `bit_width`, `bit_not` and friends accept a SIMD vector and return a
SIMD vector, so a result of width > 1 prints as a list:

```mojo
from std.bit import pop_count

def main():
    var v = SIMD[DType.uint8, 4](0, 1, 3, 7)
    print(pop_count(v))   # [0, 1, 2, 3]
```

The scalar forms print a plain number. This is the same
`SIMD`-is-the-numeric-model rule described in
[Vectorization and SIMD](../concurrency/vectorization-and-simd.md).

## Stability

The `bit` package page, the `bit` module page and the `mask` module page show
**no `@stable(since=...)` marker** and no stability badges. Under the
standard-library rule — "We consider standard library APIs unstable unless
specifically marked stable" — these functions are **unstable by default**.
Sources: <https://mojolang.org/docs/std/bit/>,
<https://mojolang.org/docs/std/bit/bit/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `bit` package: <https://mojolang.org/docs/std/bit/>
- Mojo `bit` module: <https://mojolang.org/docs/std/bit/bit/>
- Mojo `mask` module: <https://mojolang.org/docs/std/bit/mask/>
- Mojo `pop_count`: <https://mojolang.org/docs/std/bit/bit/pop_count/>
- Mojo `next_power_of_two`: <https://mojolang.org/docs/std/bit/bit/next_power_of_two/>
- Mojo `log2_floor`: <https://mojolang.org/docs/std/bit/bit/log2_floor/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
