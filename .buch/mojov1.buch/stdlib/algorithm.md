# algorithm

`algorithm` provides Mojo's high-performance data operations. Its own one-line
job description:

> High performance data operations including vectorization, functional map, and
> tiling.

Source: <https://mojolang.org/docs/std/algorithm/>.

The package is small at the top level: one subpackage, `backend`, and one module,
`functional`.

## What it is for

`algorithm` is the layer between a plain scalar loop and hand-written SIMD
intrinsics. It does three related things:

- **`vectorize`** — run a closure over a range in SIMD-width chunks.
- **`map`** — apply an index-based function over `[0, size)`.
- **`tile` / `unswitch`** — transform an iteration space into work groups and
  hoist loop-invariant branches.

The SIMD model itself (`SIMD`, `DType`, `Scalar`) lives in
[`builtin`](builtin.md); `algorithm` is the library of loop transformations that
uses it. The concurrency chapter's
[Vectorization and SIMD](../concurrency/vectorization-and-simd.md) page covers
`vectorize` in full detail; this page is the package-level entry point and a
curated selection.

## `vectorize`

The primary API an agent reaches for. From the reference:

> Simplifies SIMD optimized loops by mapping a function across a range from 0 to
> `size`, incrementing by `simd_width` at each step. The remainder of
> `size % simd_width` will run in separate iterations.

Source: <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>.

The documented example, with the import path the official docs use:

```mojo
from std.algorithm.functional import vectorize
from std.memory.alloc import alloc, dealloc, Layout
from std.sys import simd_width_of

comptime size = 10
comptime simd_width = simd_width_of[DType.int32]()  # 4 on a 128-bit register

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

```output
storing 4 els at pos 0
storing 4 els at pos 4
storing 1 els at pos 8
storing 1 els at pos 9
[0, 0, 0, 0, 4, 4, 4, 4, 8, 9]
```

The three facts to carry: `simd_width` is a **compile-time parameter**
(`vectorize[simd_width](size, closure)`); the closure is itself parameterized on
`width`; and the index is the **start of a lane group**, not a lane index. The
last point is why the example uses `store[width=width](i, value)` rather than
`results[i] = value`.

There is also an overload that keeps the width fixed and passes an **effective
vector length** for the tail:

```mojo
def closure[width: Int](i: Int, evl: Int) {mut}:
    ...
```

The contract is stated explicitly: "For all full SIMD iterations
`evl == simd_width`. For the final partial iteration `0 < evl < simd_width`."
That overload does not run the remainder as scalars, so the closure must honor
`evl` with masked loads/stores.

Source: <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>.

## `map`

> Maps a function over the integer range [0, size). This lets you apply an
> integer index-based operation across data captured by the mapped function
> (for example, an indexed buffer).

Source: <https://mojolang.org/docs/std/algorithm/backend/cpu/map/map/>.

Do not confuse this eager, index-based helper with [`iter.map`](iter.md), which
returns a **lazy** iterator applying a function to each element of an iterable.
The official reference calls this out directly.

## `tile` and `unswitch`

- **`tile`** (from `std/algorithm/backend/tile`): "A generator that launches work
  groups in specified list of tile sizes." A tile size is a compile-time width:
  "`work_on[3](5)` should launch computation on item 5,6,7, and should be
  semantically equivalent to `work_on[1](5)`, `work_on[1](6)`, `work_on[1](7)`."
  There are 1-D and 2-D forms and a runtime-tile-size form.
- **`unswitch`** and **`tile_and_unswitch`**: "Performs a functional unswitch
  transformation" — hoisting a loop-invariant condition out of the loop.
  **`tile_middle_unswitch_boundaries`** "Divides 1d iteration space into three
  parts and tiles them with different steps."

Sources: <https://mojolang.org/docs/std/algorithm/backend/tile/tile/>,
<https://mojolang.org/docs/std/algorithm/backend/unswitch/>.

## Idioms

- **Parameterize on `simd_width`, do not hard-code it.** Ask the target:
  `comptime simd_width = simd_width_of[DType.int32]()`. Source:
  <https://mojolang.org/docs/std/sys/info/simd_width_of/>.
- **Treat the closure index as a group offset.** If the closure processes one
  element, it must add the lane index itself; the standard pattern is a
  width-aware load/store.
- **Import `vectorize` from `std.algorithm.functional`.** That is the path the
  official examples use, even though the API page lives under
  `std/algorithm/backend/vectorize/vectorize`.
- **Measure before optimizing.** `algorithm` primitives change the generated
  code; use [`benchmark`](benchmark.md) to confirm the change is a win.

## Pitfalls

- **Writing `results[i] = ...` inside a `vectorize` closure.** `i` is a lane-group
  start, so this writes one element per group. Verified source
  <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>.
- **Ignoring the `evl` argument in the predicated overload.** It writes out of
  bounds. Source:
  <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>.
- **Mixing the run-time-`size` and compile-time-`size` `vectorize` overloads.**
  Their call shapes differ: `vectorize[w](size, fn)` versus
  `vectorize[w, size=n](fn)`. Source:
  <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>.
- **Confusing `algorithm.map` with `iter.map`.** One is eager and index-based,
  the other lazy and element-based.
- **Calling `vectorize` a keyword.** It is a library function; the keywords
  reference lists it explicitly among names wrongly taken for keywords. Source:
  <https://mojolang.org/docs/reference/keywords/>.
- **Choosing an arbitrary width.** A width larger than the hardware register is
  split by the compiler and performs poorly. Source:
  <https://mojolang.org/docs/std/builtin/simd/SIMD/>.

## Stability

The `algorithm` package page shows **no `@stable(since=...)` marker** on its
modules and no stability badge on the package itself. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — the `algorithm` APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/algorithm/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `algorithm` package: <https://mojolang.org/docs/std/algorithm/>
- Mojo `vectorize` reference: <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>
- Mojo `algorithm.backend` subpackage: <https://mojolang.org/docs/std/algorithm/backend/>
- Mojo `map` reference: <https://mojolang.org/docs/std/algorithm/backend/cpu/map/map/>
- Mojo `tile` reference: <https://mojolang.org/docs/std/algorithm/backend/tile/tile/>
- Mojo `unswitch` module: <https://mojolang.org/docs/std/algorithm/backend/unswitch/>
- Mojo `functional` module: <https://mojolang.org/docs/std/algorithm/functional/>
- Mojo `simd_width_of` reference: <https://mojolang.org/docs/std/sys/info/simd_width_of/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo keywords reference: <https://mojolang.org/docs/reference/keywords/>
