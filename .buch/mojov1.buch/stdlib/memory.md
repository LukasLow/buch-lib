# memory

`memory` is Mojo's low-level memory and pointer layer.

> Low-level memory management: pointers, allocations, address spaces.

> The `memory` package provides primitives for direct memory manipulation and
> pointer operations. It offers multiple pointer types with varying safety
> guarantees, from reference-counted smart pointers to raw unsafe pointers, along
> with functions for memory operations and allocation.

> Use this package for performance-critical code requiring manual memory control,
> interfacing with C libraries, implementing custom data structures, or accessing
> specialized memory. **Most code should prefer higher-level collections and
> automatic memory management.**

Source: <https://mojolang.org/docs/std/memory/>.

That last sentence is the intended default: `memory` is for when the automatic
model is not enough.

## Modules

| Module | Contents |
|--------|----------|
| `alloc` | `alloc`, `dealloc`, `unsafe_alloc`, `Layout`, `Allocation`, `ThinAllocation`, `ManagedAllocation` |
| `pointer` | `Pointer`, Mojo's primary pointer type |
| `owned_pointer` | `OwnedPointer`, "a safe, single-ownership smart pointer" |
| `arc_pointer` | `ArcPointer` (atomic reference-counted) and `WeakPointer` |
| `address_space` | `AddressSpace`, the memory address space of a pointer |
| `memory` | Memory operations: `memcpy`, `memset`, `destroy_n`, `forget_deinit`, `is_trivially_*` |
| `stack_allocation` | `unsafe_stack_allocation` |
| `unsafe` | `bitcast`, `pack_bits` — unsafe SIMD manipulation |
| `unsafe_maybe_uninit` | `UnsafeMaybeUninit` |
| `unsafe_pointer` | Backward-compatible aliases for `Pointer` |

Source: <https://mojolang.org/docs/std/memory/>.

The pointer *type* view — `Pointer(to=...)`, the `unsafe_*` operations and
origins — is covered in the types chapter:
[Pointers and references](../types/pointers-and-references.md). This page covers
the package and the allocation API.

## Allocations: `alloc` / `dealloc` / `Layout`

The design is deliberately explicit:

> Allocations are represented by two explicitly destroyed owning handles, so the
> compiler forces every allocation to be released on all paths — either by
> passing it to `dealloc` or by taking the raw pointer with `unsafe_leak()`:
>
> - `Allocation[T]`: the handle returned by `alloc`. It bundles the owning
>   pointer with the `Layout` it was allocated with ...
> - `ThinAllocation[T]`: a bare owning handle that carries only the pointer, with
>   no `Layout`.

Source: <https://mojolang.org/docs/std/memory/alloc/>.

```mojo
from std.memory.alloc import alloc, dealloc, Layout
from std.memory import unsafe_destroy_n

def main():
    var allocation = alloc(Layout[String](count=4))
    var ptr = allocation.unsafe_ptr()

    # initialize the memory
    for i in range(allocation.layout().count()):
        ptr.unsafe_offset(i).unsafe_write("🔥")

    # print the values
    for string in allocation.unsafe_span():
        print(string)

    # deinitialize the values, then deallocate
    unsafe_destroy_n(allocation.unsafe_ptr(), allocation.layout().count())
    dealloc(allocation^)
```

Source: <https://mojolang.org/docs/std/memory/alloc/>.

`Layout[T]` "Describes the shape of a memory allocation for elements of type
`T`", and `Layout[T].single()` is the one-element case. `dealloc` "Deallocates
the storage owned by an `Allocation`."

### The three allocation bugs are compile errors

This is the best part of the design. Because `Allocation` is not `Deinitable`,
the compiler catches the classic hazards:

- **Leak** — an `Allocation` abandoned on a raising path is an error:
  "'allocation' abandoned without being explicitly destroyed".
- **Double free** — `dealloc(allocation^)` consumes the handle, so a second call
  is "use of uninitialized value 'allocation'".
- **Use after free** — a pointer borrowed from the allocation cannot be used
  after the handle is consumed: "potential indirect access to uninitialized value
  'allocation'".

Source: <https://mojolang.org/docs/std/memory/alloc/>.

### Automatic cleanup: `ManagedAllocation`

> For automatic cleanup, an `Allocation` can be converted into a
> `ManagedAllocation[T]` with `into_managed()`. Unlike the two explicitly
> destroyed handles, a `ManagedAllocation` implements `Deinitable`: it
> deallocates its storage in its destructor, which Mojo runs automatically after
> the value's last use (ASAP destruction), so no explicit `dealloc` is needed.

Source: <https://mojolang.org/docs/std/memory/alloc/>. As with `dealloc`, it
"frees the storage without running the destructors of any elements written into
it."

## `Pointer`

`Pointer` is the one pointer type in 1.x:

```text
struct Pointer[mut: Bool, //, T: AnyType, origin: Origin[mut=mut], *, address_space: AddressSpace = AddressSpace.GENERIC]
```

It is **stable since 1.0.0**. The key properties, quoted:

> - This pointer is non-nullable by design. To model a nullable pointer, use
>   `Optional[Pointer[...]]`, which shares the same layout (the null address is
>   the `None` niche) so it remains zero-overhead.
> - It does not own existing memory. `alloc()` returns an `Allocation` that owns
>   heap-allocated memory; get a `Pointer` to it with `.unsafe_ptr()`, and release
>   the memory by passing the `Allocation` to `dealloc()`.
> - For simple read/write access, use `ptr.unsafe_offset(i)[]` or
>   `ptr[unsafe_offset=i]` ... .
> - For SIMD operations on numeric data, use `Pointer[Scalar[DType.xxx]]` with
>   `unsafe_load[dtype=DType.xxx]()` and `unsafe_store[dtype=DType.xxx]()`.

Source: <https://mojolang.org/docs/std/memory/pointer/Pointer/>.

The safety split is the rule to carry: "Constructing a `Pointer` to an existing
value (`Pointer(to=value)`) and dereferencing it (`ptr[]`) are safe operations...
Working with dynamically-allocated or uninitialized memory is unsafe. Those
operations are named with an `unsafe_` prefix."

### Element-wise and vectorized access

```mojo
from std.memory.alloc import alloc, dealloc, Layout

def main():
    var allocation = alloc(Layout[Float32](count=4))
    var ptr = allocation.unsafe_ptr()

    for i in range(4):
        ptr.unsafe_store(i, Float32(i))
    print(ptr.unsafe_load(2))   # 2.0

    dealloc(allocation^)
```

Source: <https://mojolang.org/docs/std/memory/pointer/Pointer/>.

```mojo
from std.memory.alloc import alloc, dealloc, Layout

def main():
    var allocation = alloc(Layout[Int32](count=8))
    var ptr = allocation.unsafe_ptr()
    var vec = SIMD[DType.int32, 4](1, 2, 3, 4)

    ptr.unsafe_store(0, vec)
    print(ptr.unsafe_load[width=4](0))   # [1, 2, 3, 4]
    dealloc(allocation^)
```

Source: <https://mojolang.org/docs/std/memory/pointer/Pointer/>.

### Pointer arithmetic and dereference

```mojo
var foo: Int = 123
var ptr = Pointer(to=foo)      # safe: points at a live Mojo value
print(ptr[])                   # 123
# No unsafe_free(): the value was not heap-allocated.
```

Source: <https://mojolang.org/docs/std/memory/pointer/Pointer/>.

The pointer API in one list: `unsafe_offset`, `unsafe_load`/`unsafe_store`,
`unsafe_strided_load`/`unsafe_strided_store`, `unsafe_gather`/`unsafe_scatter`,
`unsafe_write`, `unsafe_write_move_from`, `unsafe_deinit_pointee`,
`unsafe_take_pointee`, `unsafe_free`, `unsafe_bitcast`, `unsafe_mut_cast`,
`unsafe_origin_cast`, `unsafe_address_space_cast`, `unsafe_dangling`,
`offset_from`, `swap_pointees`, `as_imm`, `as_unsafe_any_origin` and `mut_cast`.

## The smart pointers

- **`OwnedPointer`** — "a safe, single-ownership smart pointer." Source:
  <https://mojolang.org/docs/std/memory/owned_pointer/>.
- **`ArcPointer`** — "Atomic reference-counted pointer", with **`WeakPointer`**,
  "Non-owning atomic reference to an `ArcPointer`'s allocation." Source:
  <https://mojolang.org/docs/std/memory/arc_pointer/>.

These give you heap ownership without writing `dealloc` by hand, at the cost of
the reference counting.

## Memory operations

The `memory` module is the raw-memory toolbox: `memcpy`, `memmove`, `memcmp`,
`memset`, `memset_zero`, `uninit_copy_n`, `uninit_move_n`, `destroy_n`,
`unsafe_destroy_n`, `forget_deinit`, and the `is_trivially_copyable` /
`is_trivially_movable` / `is_trivially_deletable` queries. Source:
<https://mojolang.org/docs/std/memory/memory/>.

```mojo
from std.memory import memcpy, memset_zero

def main():
    var src = [1, 2, 3]
    var dst = [0, 0, 0]
    memcpy(dst.unsafe_ptr(), src.unsafe_ptr(), 3)
    print(dst)              # [1, 2, 3]

    memset_zero(dst.unsafe_ptr(), 3)
    print(dst)              # [0, 0, 0]
```

`forget_deinit` deserves a call-out because its name is alarming:
"Takes ownership and skips running `__deinit__` deinitializers." Source:
<https://mojolang.org/docs/std/memory/memory/forget_deinit/>.

## Address spaces and stack allocation

- `AddressSpace` — "Address space of the pointer", used as the `address_space`
  parameter on `Pointer` and `Span`. Source:
  <https://mojolang.org/docs/std/memory/address_space/AddressSpace/>.
- `unsafe_stack_allocation` — "Allocates data buffer space on the stack given a
  data type and number of elements." Source:
  <https://mojolang.org/docs/std/memory/stack_allocation/unsafe_stack_allocation/>.
- `UnsafeMaybeUninit` — "A wrapper type to represent memory that may or may not
  be initialized." Source:
  <https://mojolang.org/docs/std/memory/unsafe_maybe_uninit/UnsafeMaybeUninit/>.
- `bitcast` and `pack_bits` in the `unsafe` module. Source:
  <https://mojolang.org/docs/std/memory/unsafe/>.

## Idioms

- **Do not use `memory` unless you must.** The package's own guidance: "Most code
  should prefer higher-level collections and automatic memory management."
- **Pair `alloc` with `dealloc` on every path.** The compiler enforces it; do not
  fight it with early `return`s that abandon the handle.
- **Use `ManagedAllocation` when automatic cleanup is what you want.**
- **Use `Pointer(to=live_value)` when you can.** It is the safe construction and
  it keeps lifetime tracking.
- **Model a nullable pointer as `Optional[Pointer[...]]`**, not as a null
  pointer — `Pointer` is non-nullable by design.
- **Destroy before deallocating.** `dealloc` frees storage but does not run
  element destructors; call `unsafe_destroy_n` (or the typed equivalent) first
  for non-trivial elements.
- **Prefer `OwnedPointer`/`ArcPointer` over hand-rolled pointer ownership.**

## Pitfalls

- **Abandoning an `Allocation`.** It is a compile error, including on error paths.
  Source: <https://mojolang.org/docs/std/memory/alloc/>.
- **Double `dealloc`.** The handle is consumed; the second call is a
  use-of-uninitialized error. Source:
  <https://mojolang.org/docs/std/memory/alloc/>.
- **Using a pointer after the allocation is freed.** Rejected at compile time via
  the borrowing rule. Source: <https://mojolang.org/docs/std/memory/alloc/>.
- **Expecting `dealloc` to destroy elements.** It frees storage only.
- **Using `unsafe_dangling()` as a null sentinel.** "Note that the address of the
  returned pointer may potentially be that of a valid pointer, which means this
  must not be used as a 'not yet initialized' sentinel value." Source:
  <https://mojolang.org/docs/std/memory/pointer/Pointer/>.
- **Reaching for `UnsafeAnyOrigin`.** The origin docs call it "a temporary
  compiler escape hatch ... It will never be stabilized and is slated for
  deprecation and removal." Source: <https://mojolang.org/docs/std/origin/>.
- **Assuming `unsafe_*` operations check anything.** They do not: out-of-bounds
  is undefined behavior by contract.
- **Forgetting `unsafe_destroy_n` before `dealloc` on `String`-like elements** —
  that leaks each element's own buffer.

## Stability

The package mixes a stable type with unstable infrastructure:

| API | Stability |
|-----|-----------|
| `Pointer` | **Stable since 1.0.0** (struct). |
| `alloc`, `dealloc`, `Layout`, `Allocation`, `OwnedPointer`, `ArcPointer`, the `memory` operations | **Unstable by default** — no marker on the package or module pages. |

Remember the member rule: a stable struct's signature is stable, not necessarily
its members. Sources:
<https://mojolang.org/docs/std/memory/pointer/Pointer/>,
<https://mojolang.org/docs/std/memory/>,
<https://mojolang.org/docs/api-docs/stability/>.

> **Open question:** the `memory` package page says it "offers multiple pointer
> types with varying safety guarantees, from reference-counted smart pointers to
> raw unsafe pointers", but the raw `Pointer` is stable while `OwnedPointer` and
> `ArcPointer` carry no marker. The intended default for new code is not stated
> on the package page; treat `Pointer` as the primary type and the smart pointers
> as unstable conveniences.

## Sources

- Mojo `memory` package: <https://mojolang.org/docs/std/memory/>
- Mojo `alloc` module: <https://mojolang.org/docs/std/memory/alloc/>
- Mojo `Pointer` struct: <https://mojolang.org/docs/std/memory/pointer/Pointer/>
- Mojo `pointer` module: <https://mojolang.org/docs/std/memory/pointer/>
- Mojo `owned_pointer` module: <https://mojolang.org/docs/std/memory/owned_pointer/>
- Mojo `arc_pointer` module: <https://mojolang.org/docs/std/memory/arc_pointer/>
- Mojo `memory` module: <https://mojolang.org/docs/std/memory/memory/>
- Mojo `address_space` module: <https://mojolang.org/docs/std/memory/address_space/>
- Mojo `stack_allocation` module: <https://mojolang.org/docs/std/memory/stack_allocation/>
- Mojo `unsafe` module: <https://mojolang.org/docs/std/memory/unsafe/>
- Mojo `unsafe_maybe_uninit` module: <https://mojolang.org/docs/std/memory/unsafe_maybe_uninit/>
- Mojo `origin` package: <https://mojolang.org/docs/std/origin/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
