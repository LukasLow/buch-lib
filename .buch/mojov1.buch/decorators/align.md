# @align

`@align(N)` sets a **minimum memory alignment** for values of a struct type: the
compiler guarantees that every value of the type starts at an address that is a
multiple of `N` bytes. The requirement becomes part of the type, enforced
everywhere the type is used.

```mojo
from std.sys import align_of

@align(64)
struct CacheAligned:
    var data: Int

def main():
    print(align_of[CacheAligned]())  # Prints 64
```

Source: <https://mojolang.org/docs/reference/decorators/align/>.

Most Mojo code never needs it. Reach for `@align` when the type must satisfy a
hardware boundary — GPU descriptors, SIMD access, cache-line separation — or
when you want to stop tracking alignment manually at every allocation site.

Source: <https://mojolang.org/docs/reference/decorators/align/>.

## Target

`@align` applies to `struct` declarations only. Source:
<https://mojolang.org/docs/reference/decorators/>.

## What alignment means

An address is N-byte aligned when it is evenly divisible by N:

- 8-byte aligned addresses: 0, 8, 16, 24, …
- 64-byte aligned addresses: 0, 64, 128, 192, …

> Alignment affects where a value begins in memory, not how large the value is.

Source: <https://mojolang.org/docs/reference/decorators/align/>.

## It is a minimum, not an override

The actual alignment of a struct is the maximum of three things:

- the value from `@align(N)`,
- the struct's natural alignment (the largest alignment of its fields),
- the alignment requirements of embedded aligned fields.

```mojo
from std.sys import align_of

@align(4)
struct TryToReduce:
    var x: Int  # Int has 8-byte natural alignment

def main():
    print(align_of[TryToReduce]())  # Prints 8
```

Source: <https://mojolang.org/docs/reference/decorators/align/>.

Alignment is inherited: a struct containing an aligned field is at least as
aligned as that field.

```mojo
from std.sys import align_of

@align(64)
struct CacheAligned:
    var x: Int

struct Container:
    var aligned: CacheAligned
    var other: Int

def main():
    print(align_of[Container]())  # Prints 64
```

Source: <https://mojolang.org/docs/reference/decorators/align/>.

## Stack, heap and arrays

Both stack and heap allocations respect `@align`, and `@align` guarantees the
base address of an array of the type. The struct's size is padded to a multiple
of its alignment, so array stride respects it:

```mojo
from std.sys import size_of, align_of

@align(64)
struct CacheAligned:
    var data: Int  # 8 bytes

def demonstrate_array_stride():
    print(align_of[CacheAligned]())  # 64
    print(size_of[CacheAligned]())   # 64
```

Source: <https://mojolang.org/docs/reference/decorators/align/>.

## Register-passable interaction

When `@align` is present, a single-field register-passable struct is **not**
flattened, so the alignment survives:

```mojo
from std.sys import align_of, size_of

@align(32)
struct AlignedTrivial(RegisterPassable):
    var value: Int

def main():
    print(align_of[AlignedTrivial]())  # 32
    print(size_of[AlignedTrivial]())  # 8
```

Source: <https://mojolang.org/docs/reference/decorators/align/>.

## Parameterized alignment

The argument may be a struct parameter, which lets one type carry a
parametric alignment:

```mojo
from std.sys import align_of

@align(Self.alignment)
struct AlignedBuffer[alignment: Int]:
    var data: Int

def main():
    print(align_of[AlignedBuffer[64]]())   # Prints 64
    print(align_of[AlignedBuffer[128]]())  # Prints 128
```

The alignment is validated at instantiation, so `AlignedBuffer[3]` is a
compile-time error. Source:
<https://mojolang.org/docs/reference/decorators/align/>.

Note that all instances of a parameterized type share one alignment requirement
unless you parameterize it as above; the official page demonstrates both the
shared and the tuned cases. Source:
<https://mojolang.org/docs/reference/decorators/align/>.

## Requirements and errors

The official requirements:

- The alignment value must be a positive power of 2.
- The maximum supported alignment is 2^29 bytes.
- The value must be known at compile time.
- The decorator requires exactly one argument.

Source: <https://mojolang.org/docs/reference/decorators/align/>.

Each of these is a compile-time error, in order: `@align(0)`, `@align(3)`,
`@align(1073741824)` (2^30), `@align` with no argument, `@align(64, 128)` with
two arguments, and `@align("64")` with a non-integer. Source:
<https://mojolang.org/docs/reference/decorators/align/>.

`@align(1)` is explicitly valid and warning-free: it never reduces alignment
below the natural alignment, and is useful as a fallback in parametric code.
Source: <https://mojolang.org/docs/reference/decorators/align/>.

## Pitfalls

- **Expecting `@align` to lower alignment.** It only raises it; the natural
  alignment always wins. Verified above.
- **Using a non-power-of-2 or zero value.** `@align(0)` and `@align(3)` are
  compile errors. Verified above.
- **Exceeding 2^29.** Larger values are rejected. Verified above.
- **Passing a non-integer.** The argument must be a compile-time integer.
  Verified above.
- **Forgetting that size is padded.** `size_of` of an aligned struct is rounded
  up to its alignment, which affects array stride. Verified above.
- **Assuming per-instantiation alignment for free.** A parameterized struct
  shares one alignment unless the argument is parameterized. Verified above.

## Sources

- `@align` reference: <https://mojolang.org/docs/reference/decorators/align/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
