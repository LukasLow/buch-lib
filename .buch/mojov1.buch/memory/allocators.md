# Allocators and memory

Mojo gives you both automatic memory management through ownership and explicit,
low-level control through pointers and allocations. This page covers where
memory lives (stack versus heap), how to allocate and free it in current 1.x
terms, the `Allocation`/`ThinAllocation` handles, and the safer smart-pointer
alternatives you should reach for first.

The ownership model behind all of this is on
[ownership and lifetimes](ownership-and-lifetimes.md); the `Pointer` API itself
is in [pointers and references](../types/pointers-and-references.md).

## Two places: stack and heap

A running program divides memory into four segments — text, data, stack and heap.
The first two are statically sized; the stack and heap change size as the program
runs.

> The *stack* stores data local to the current function. When a function is
> called, the program allocates a block of memory — a *stack frame* — that is
> exactly the size required to store the function's data, including any
> *fixed-size* local variables. ... Dynamically-sized values that can change in
> size at runtime are instead stored in the heap, which is a much larger region of
> memory that allows for dynamic memory allocation.

> Technically, a local variable for such a value is still stored in the call
> stack, but its value is a fixed-size pointer to the real value on the heap.

Source: <https://mojolang.org/docs/manual/values/>.

The stack is managed automatically by the compiler; heap memory is managed
explicitly, "either indirectly — by using standard library types like `List` and
`String` — or directly, using the `UnsafePointer` API." Source:
<https://mojolang.org/docs/manual/values/>. In current 1.x naming, that API is
the unified `Pointer` plus `alloc()`; the old `UnsafePointer` name is a
deprecated alias (see the rename note below).

## The 1.x story: one `Pointer`, `unsafe_` at the operation

The current rule is that there is **one** pointer type, and unsafety is marked
per operation:

> Unsafe operations are prefixed with `unsafe_` or use a keyword argument
> prefixed with `unsafe_`.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

The `memory` package is the home of these primitives:

| Module | What it provides |
|--------|------------------|
| `address_space` | The memory address space of a pointer. |
| `alloc` | Layout-aware memory allocation and deallocation. |
| `arc_pointer` | Reference-counted smart pointers. |
| `memory` | Functions for memory manipulation. |
| `owned_pointer` | `OwnedPointer`, a safe single-ownership smart pointer. |
| `pointer` | `Pointer`, Mojo's primary pointer type. |
| `stack_allocation` | `unsafe_stack_allocation` for stack-based allocation. |
| `unsafe` | Utilities for unsafe manipulation of SIMD values. |
| `unsafe_maybe_uninit` | `UnsafeMaybeUninit`, a wrapper for possibly-uninitialized memory. |
| `unsafe_pointer` | `UnsafePointer` and related aliases as backward-compatible names for `Pointer`. |

Source: <https://mojolang.org/docs/std/memory/>.

> **Migration note:** `UnsafePointer` (and the unprefixed operations such as
> `load()`, `store()`, `take_pointee()`) belong to the pre-1.0 pointer split. In
> 1.x they are deprecated aliases; the current names are `Pointer` and the
> `unsafe_*` operations. The full old→new table is in
> [`versions/1.0.0`](../versions/1.0.0.md).

## Prefer a smart pointer first

Before allocating by hand, the standard library offers ownership-managing types.
The pointer-types overview compares them:

| | `Pointer` | `OwnedPointer` | `ArcPointer` |
|---|---|---|---|
| Safe | Conditionally (safe methods plus `unsafe_` methods) | Yes | Yes |
| Memory allocation | Manual via `alloc()` | Implicit | Implicit |
| Owns pointee(s) | No | Yes | Yes |
| Implicitly copyable | Yes | No | Yes |
| Nullable | No | No | No |
| Can point to uninitialized memory | Yes | No | No |
| Can point to multiple values | Yes | No | No |

Source: <https://mojolang.org/docs/manual/pointers/>.

- `OwnedPointer` "is a smart pointer designed for cases where there is single
  ownership of the underlying data." It allocates and moves or copies the value
  into reserved memory; it can be moved but not copied.
- `ArcPointer` is reference-counted and can be freely copied: the count is
  incremented on copy and decremented on destruction, and when it reaches zero
  "the stored value is destroyed and the allocated memory is freed."

Source: <https://mojolang.org/docs/manual/pointers/>.

```mojo
from std.memory import ArcPointer

struct SharedDict(ImplicitlyCopyable):
    var attributes: ArcPointer[Dict[String, String]]

    def __init__(out self):
        var attributesDict: Dict[String, String] = {}
        self.attributes = ArcPointer(attributesDict^)
```

Source: <https://mojolang.org/docs/manual/pointers/>. Note that `ArcPointer`'s
reference count is thread-safe, but reads and writes to the stored value are not;
callers synchronize.

## Allocating memory: `alloc()`, `Layout`, `dealloc()`

Allocation needs a **layout**, which specifies the type to store, how many
values, and optionally the alignment. `alloc()` returns an `Allocation` — an
explicitly-destroyed handle holding an unsafe pointer and the layout — and
`dealloc()` frees it:

```mojo
from std.memory.alloc import alloc, dealloc, Layout

def main():
    var allocation = alloc(Layout[Int](count=4))
    var ptr = allocation.unsafe_ptr()
    for i in range(4):
        ptr.unsafe_offset(i).unsafe_write(i)
    dealloc(allocation^)
```

> You can also write the allocation above as `alloc[Int]({count = 4})`.

> Because `Allocation` is an explicitly-destroyed type, you must deallocate it
> before it goes out of scope.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

Two facts about failure and state:

> Allocation failure terminates the program; you can't catch this failure with a
> `try/except` block. The `alloc()` function always returns an allocation with a
> valid, non-null pointer pointing to the allocated space. The allocated space is
> *uninitialized* — like a variable that's been declared but not initialized.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## The pointer lifecycle

A pointer value is in one of several states, and the transitions are where bugs
happen:

- **Uninitialized.** A `Pointer` variable can be declared but uninitialized.
- **Pointing to allocated, uninitialized memory.** From `alloc()`; dereferencing
  it is undefined behavior until you write a value.
- **Pointing to initialized memory.** Initialize with `unsafe_write(value^)` or
  `unsafe_write(copy=value)`, or point at an existing value with
  `Pointer(to=value)`; then read and mutate with `ptr[]`.
- **Dangling.** After `dealloc()`, the address still points at the previous
  location, but the memory is no longer allocated; dereferencing is undefined
  behavior.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

### Initialize, then dereference

```mojo
var allocation = alloc[String]({count = 1})
var str_ptr = allocation.unsafe_ptr()
# str_ptr[] = "Testing"   # Undefined behavior!
str_ptr.unsafe_write("Testing")
str_ptr[] += " pointers"   # Works now
```

> You cannot safely use the dereference operator on uninitialized memory, even to
> *initialize* a pointee. This is because assigning to a dereferenced pointer calls
> lifecycle methods on the existing pointee (such as the destructor, move
> constructor or copy constructor).

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

To move or copy into the memory:

```mojo
str_ptr.unsafe_write(my_string^)          # move (transfer sigil)
str_ptr.unsafe_write("Owned string")      # newly constructed value
ptr.unsafe_write(copy=my_value)           # explicit copy
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

### Destroy and remove pointees

- `unsafe_take_pointee()` — "moves a pointee from the memory location pointed to
  by `ptr`. This is a consuming move. ... It leaves the memory location
  uninitialized."
- `unsafe_deinit_pointee()` — "calls the destructor on the pointee, and leaves
  the memory location ... uninitialized."
- `unsafe_write_move_from(self, src)` — moves the value pointed to by `src` into
  the location pointed to by `self`; afterwards "ownership of that value
  transfers from `src` to `self` and the memory at `src` is uninitialized."

> Both `unsafe_take_pointee()` and `unsafe_deinit_pointee()` require that the
> pointer is non-null, and the memory location contains a valid, initialized value
> of the pointee's type; otherwise the function results in undefined behavior.

> Mojo assumes the destination memory is uninitialized. It does not destroy
> existing contents before writing the value from `src`.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

### Freeing does not destroy

```mojo
def __deinit__(deinit self):
    var ptr = self.data.unsafe_ptr()
    for i in range(self.size):
        ptr.unsafe_offset(i).unsafe_deinit_pointee()
    dealloc(self.data^.unsafe_with_layout({count = self.size}))
```

The point the docs make twice:

> Note that a pointer doesn't *own* any values in the memory it points to, so when
> a pointer is destroyed, Mojo doesn't call the destructors on those values.

> Calling `dealloc()` on an allocation frees the allocated memory. It doesn't call
> the destructors on any values stored in the memory — you need to do that
> explicitly.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/> and
<https://mojolang.org/docs/manual/lifecycle/death/>.

Disposing of a pointer without freeing its memory leaks. Because deallocating an
`Allocation` consumes it, you are protected from double-free "unless you use the
`unsafe_leak()` method." Source:
<https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Storing multiple values

A single allocation can hold many values in one contiguous block; `unsafe_offset()`
returns a new pointer offset by a number of values (the offset may be negative):

```mojo
var allocation = alloc(Layout[Float64](count=6))
var float_ptr = allocation.unsafe_ptr()
for offset in range(6):
    float_ptr.unsafe_offset(offset).unsafe_write(0.0)

float_ptr[unsafe_offset=2] = 3.0
for offset in range(6):
    print(float_ptr[unsafe_offset=offset], end=", ")
```

```output
0.0, 0.0, 3.0, 0.0, 0.0, 0.0,
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Holding an allocation in a struct

`Allocation` stores layout data (two `Int` values, typically 16 extra bytes).
When a struct already tracks its own size, store a `ThinAllocation` instead:
"an explicitly-destroyed wrapper around a pointer." `Allocation.into_thin()`
consumes the allocation and returns the thin one; to deallocate, reconstruct the
layout with `unsafe_with_layout()`:

```mojo
struct Counter:
    comptime _layout = Layout[Int].single()
    var _alloc: ThinAllocation[Int]

    def __init__(out self, value: Int):
        self._alloc = alloc(Self._layout).into_thin()
        self._alloc.unsafe_ptr().unsafe_write(value)

    def increment(mut self):
        self._alloc.unsafe_ptr()[] += 1

    def get(self) -> Int:
        return self._alloc.unsafe_ptr()[]

    def __deinit__(deinit self):
        dealloc(
            self._alloc^.unsafe_with_layout(Self._layout)
        )
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Allocations and raising functions

Because `Allocation` and `ThinAllocation` must be consumed before going out of
scope, they conflict with raising functions: an error can exit before the
`dealloc()` call, and the compiler flags a potential leak.

```mojo
def allocating_function() raises:
    var data = alloc[Float64]({count = 64})
    # error: 'data' abandoned without being explicitly destroyed: An `Allocation`
    #   owns heap storage and must be consumed before it goes out of scope.
    raising_function(data.unsafe_ptr())
    dealloc(data^)
```

The documented first remedy is `try`/`except`:

```mojo
def allocating_function() raises:
    var data = alloc[Float64]({count = 64})
    try:
        raising_function(data.unsafe_ptr())
    except e:
        dealloc(data^)
        raise e^
    dealloc(data^)
```

Where that is not viable, `unsafe_leak()` takes ownership of the allocation's
pointer, but "You should consider this pattern a last resort":

```mojo
def leaky_function() raises:
    var data_ptr = alloc[Float64]({count = 64}).unsafe_leak()
    raising_function(data_ptr)
    dealloc(
        ThinAllocation(unsafe_owned_ptr=data_ptr).unsafe_with_layout(
            {count = 64}
        )
    )
```

The documented downsides: an error in `raising_function()` leaks the memory, and
reconstructing an allocation from a pointer risks double-free. Source:
<https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Stack allocation

For stack-based allocation, the `memory` package provides
`unsafe_stack_allocation`. Source: <https://mojolang.org/docs/std/memory/>. The
docs do not give it a worked example in the manual, so treat its exact behavior
as API-level detail; see the [`memory` stdlib page](../stdlib/memory.md).

## Pitfalls

- **Assigning through a dereference on uninitialized memory.** It runs lifecycle
  methods on a non-existent value; use `unsafe_write()` first. Source:
  <https://mojolang.org/docs/manual/pointers/using-pointers/>.
- **Assuming `dealloc()` destroys the pointees.** It only frees memory; call
  `unsafe_deinit_pointee()` per element when they own resources. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Dereferencing after `dealloc()`.** The pointer is dangling; any access is
  undefined behavior. Source:
  <https://mojolang.org/docs/manual/pointers/using-pointers/>.
- **Forgetting to consume an `Allocation`.** It is explicitly destroyed; the
  compiler rejects leaving it live. Source:
  <https://mojolang.org/docs/manual/pointers/using-pointers/>.
- **Using `unsafe_leak()` casually.** It defeats lifetime tracking and can leak or
  double-free. Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.
- **Trying to catch allocation failure.** `alloc()` terminates the program on
  failure; there is no `try`/`except` for it. Source:
  <https://mojolang.org/docs/manual/pointers/using-pointers/>.
- **Modeling a null pointer with a default-constructed pointer.** 1.x pointer
  types are non-nullable; use `Optional[Pointer[...]]` or
  `Pointer.unsafe_dangling()` for deferred initialization. Source:
  <https://mojolang.org/docs/manual/pointers/using-pointers/>.
- **Writing `UnsafePointer` or the unprefixed operations in new code.** They are
  deprecated aliases; use `Pointer` and `unsafe_*`. Source:
  <https://mojolang.org/docs/std/memory/>.

## Open questions

> **Open question:** the manual's ownership introduction still refers to "the
> `UnsafePointer` API", while the pointers and memory pages present the unified
> `Pointer` with per-operation `unsafe_` markers. This book teaches the current
> `Pointer` API and records `UnsafePointer` → `Pointer` in
> [`versions/1.0.0`](../versions/1.0.0.md).

> **Open question:** `unsafe_stack_allocation` is listed in the `memory` package
> but has no manual walkthrough in the pages this book builds from. Its exact
> lifetime and alignment rules are unverified here.

## Sources

- Mojo manual — Using pointers: <https://mojolang.org/docs/manual/pointers/using-pointers/>
- Mojo manual — Intro to pointers: <https://mojolang.org/docs/manual/pointers/>
- Mojo manual — Intro to value ownership: <https://mojolang.org/docs/manual/values/>
- Mojo manual — Value destruction (destructor and pointee cleanup): <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo standard library — `memory` package: <https://mojolang.org/docs/std/memory/>
- Mojo v1.0.0 release notes (pointer unification): <https://mojolang.org/releases/v1.0.0/>
