# Pointers and references

A pointer is a value that holds a memory address; dereferencing it reads or
writes the value at that address. In 1.0 Mojo has **one** pointer type,
`Pointer`, and unsafety is marked on the individual operation with an
`unsafe_` prefix rather than on the type. This page covers that model, creating
and dereferencing pointers, allocation with `alloc`/`dealloc`, the pointer
lifecycle, nullability through `Optional`, references and origins, and the
`unsafe_` boundary.

The details of ownership and the lifetime checker are on
[Ownership and lifetimes](../memory/ownership-and-lifetimes.md) and
[Origin and borrowing](../memory/origin-and-borrowing.md); allocation is
[Allocators](../memory/allocators.md). This page is the overview plus the
pointer API you need to read and write memory.

## One `Pointer`, unsafety per operation

The 1.0 change is the whole design:

> The `Pointer` and `UnsafePointer` types have been unified. The new unified
> `Pointer` type includes the functionality of `UnsafePointer`, with the unsafe
> operations prefixed with `unsafe_` or requiring an `unsafe_`-prefixed keyword
> argument. The `UnsafePointer` name and the unprefixed unsafe operations are
> deprecated.
>
> The two pointer types share the same layout and convert implicitly, so most
> code is unaffected.

Source: <https://mojolang.org/releases/v1.0.0/>.

The manual adds the safety rationale:

> The `Pointer` type is _safe_ when used to point to an existing value... When
> used this way, the `Pointer` type carries the origin of the value it points
> to. It can be used to store a reference in a struct field.
>
> The `Pointer` type also provides a number of unsafe methods you can use to
> access dynamically-allocated memory, initialize and destroy stored values, and
> more.

Source: <https://mojolang.org/docs/manual/pointers/>.

So the word "unsafe" moves from the type to the call site:

```mojo
def sum4(ptr: Pointer[Int]) -> Int:
    var total = 0
    for i in range(4):
        total += ptr[unsafe_offset=i]   # the unsafe part is marked here
    return total
```

Source (1.0 form): <https://mojolang.org/releases/v1.0.0/>.

### Pointer terminology

The manual defines the vocabulary before the API:

- **Safe pointers** are designed to prevent memory errors; unless you use an API
  designated unsafe, you can use them without worrying about double-free or
  use-after-free.
- **Nullable pointers**: "None of the Mojo standard library pointer types are
  nullable. To model a nullable pointer, use the `Optional` type. For example,
  `Optional[Pointer]` or `Optional[OwnedPointer]`."
- **Owning pointers** own their pointees... "Non-owning pointers may point to
  values owned elsewhere, or may point to dynamically-allocated memory."
- **Uninitialized memory** refers to memory locations that haven't been
  initialized and "may therefore contain random data. Newly-allocated memory is
  uninitialized."
- **Copyability**: "many pointer types can be copied implicitly... The pointer
  itself is a small amount of data to copy (typically 64 bits), and copying the
  pointer doesn't copy the pointee—both the original pointer and the copy point
  to the same memory location and the same value."

Source: <https://mojolang.org/docs/manual/pointers/>.

### The pointer family

| Type | What it is |
|------|------------|
| `Pointer` | Mojo's primary pointer type: one or more contiguous locations; may refer to uninitialized memory. Non-nullable. |
| `OwnedPointer` | Smart pointer to a single value, with exclusive ownership. Allocates implicitly. Not copyable. |
| `ArcPointer` | Reference-counted smart pointer to an owned value, with ownership shareable between instances. Allocates implicitly. Copyable. |

Source: <https://mojolang.org/docs/manual/pointers/>.

The manual's comparison, abridged:

| | `Pointer` | `OwnedPointer` | `ArcPointer` |
|--|-----------|----------------|--------------|
| Safe | Conditionally | Yes | Yes |
| Memory allocation | Manual via `alloc()` | Implicit | Implicit |
| Owns pointee(s) | No | Yes | Yes |
| Implicitly copyable | Yes | No | Yes |
| Nullable | No | No | No |
| Can point to uninitialized memory | Yes | No | No |
| Can point to multiple values | Yes | No | No |

Source: <https://mojolang.org/docs/manual/pointers/>.

```mojo
from std.memory import OwnedPointer, ArcPointer

def main():
    var owned: OwnedPointer[Int]
    owned = OwnedPointer(100)
    owned[] += 10
    print(owned[])            # 110

    var shared = ArcPointer(42)
    var also_shared = shared  # copies the ArcPointer, not the value
    print(also_shared[])      # 42
```

Sources: <https://mojolang.org/docs/manual/pointers/> (both examples) and
<https://mojolang.org/docs/manual/pointers/using-pointers/>.

> **Open question:** `reference/types` still presents `UnsafePointer` as a
> separate raw-pointer type alongside `Pointer` in its memory-types table, and
> the manual pages still use `UnsafePointer` in prose, even though the 1.0
> release notes unify the two into one `Pointer` and deprecate the
> `UnsafePointer` name. This book teaches the unified `Pointer`. Treat any
> `UnsafePointer` outside [`versions/1.0.0`](../versions/1.0.0.md) as
> documentation lag. Sources:
> <https://mojolang.org/releases/v1.0.0/>,
> <https://mojolang.org/docs/reference/types/>.

## Creating a pointer

Two routes: point at an existing value, or point at fresh allocated memory.

### Pointing at an existing value

`Pointer(to=value)` takes the address of a value that already exists, and the
origin is inferred from that value:

```mojo
def main():
    var count: Int = 0
    var ptr = Pointer(to=count)   # ptr's type is Pointer[Int, ...]
    ptr[] = 100                   # mutate through the pointer
    print(ptr[])                  # 100
    print(count)                  # 100 — the same storage
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

The manual notes the safety property: "when calling `Pointer(to=value)`, you
don't need to allocate memory, since you're pointing to an existing value."
Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

A pointer with an inferred origin can live in a struct field:

```mojo
def main():
    var s = "Testing"
    var s_ptr = Pointer(to=s)   # s_ptr.origin is the same as s's origin
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

### Allocating memory

Heap allocation goes through `std.memory.alloc`. `alloc()` returns an
`Allocation`, an explicitly destroyed handle:

> The `alloc()` function returns an `Allocation`, an explicitly-destroyed
> handle that holds an unsafe pointer to the allocated memory and the layout
> used to allocate it. Use `dealloc()` to free the allocation and its
> associated memory.

```mojo
from std.memory.alloc import alloc, dealloc, Layout

def main():
    var allocation = alloc(Layout[Int](count=4))
    var ptr = allocation.unsafe_ptr()
    for i in range(4):
        ptr.unsafe_offset(i).unsafe_write(i)

    print(ptr[unsafe_offset=3])   # 3
    dealloc(allocation^)          # must deallocate before scope exit
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>. The manual
also gives the shorthand `alloc[Int](count=4)`. Layout specifies "the type of
value to be stored, the number of values to allocate space for, and
optionally the memory alignment."

Two facts that shape all pointer code:

> Because `Allocation` is an explicitly-destroyed type, you must deallocate it
> before it goes out of scope.
>
> Allocation failure terminates the program; you can't catch this failure with
> a `try/except` block. The `alloc()` function always returns an allocation with
> a valid, non-null pointer pointing to the allocated space. The allocated space
> is *uninitialized*.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## The pointer lifecycle

The manual describes four states and the transitions between them:

- **Uninitialized.** A `Pointer` variable may be declared without a value:
  `var ptr: Pointer[Int, MutUntrackedOrigin]`.
- **Pointing to allocated, uninitialized memory.** `alloc()` returns an
  `Allocation`; `Allocation.unsafe_ptr()` gives a pointer to that memory.
  "Trying to dereference a pointer to uninitialized memory results in undefined
  behavior."
- **Pointing to initialized memory.** Initialize with `unsafe_write()` or
  construct with `Pointer(to=value)`. Then read and mutate with `[]`.
- **Dangling.** After `dealloc(allocation^)`, the address still points at the
  old location but the memory is no longer allocated. "Trying to dereference the
  pointer, or calling any method that would access the memory location, results
  in undefined behavior."

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

### Initializing the pointee

> To initialize allocated memory, `Pointer` provides the `unsafe_write()`
> method, which moves a value into the pointer's memory location:

```mojo
str_ptr.unsafe_write(my_string^)     # move (needs the transfer sigil)
str_ptr.unsafe_write("Owned string") # a newly constructed value
ptr.unsafe_write(copy=my_value)      # copy instead of move
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

The most important rule on this page:

> You cannot safely use the dereference operator on uninitialized memory, even
> to *initialize* a pointee. This is because assigning to a dereferenced
> pointer calls lifecycle methods on the existing pointee (such as the
> destructor, move constructor or copy constructor).

```mojo
var allocation = alloc[String](count=1)
var str_ptr = allocation.unsafe_ptr()
# str_ptr[] = "Testing"     # undefined behavior — do not do this
str_ptr.unsafe_write("Testing")
str_ptr[] += " pointers"    # works now that the pointee is initialized
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

### Reading and moving pointees

`[]` reads and mutates an initialized pointee. `unsafe_offset()` reaches other
elements; `unsafe_take_pointee()` moves the value out; `unsafe_deinit_pointee()`
destroys it in place:

> The `unsafe_take_pointee()` method moves a pointee from the memory location
> pointed to by `ptr`. This is a consuming move... It leaves the memory location
> uninitialized.
>
> The `unsafe_deinit_pointee()` method calls the destructor on the pointee, and
> leaves the memory location pointed to by `ptr` uninitialized.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Multiple values and offsets

`unsafe_offset()` returns a **new** pointer offset by a number of *values* (not
bytes) from the original, and can move backwards with a negative offset:

```mojo
var third_ptr = first_ptr.unsafe_offset(2)
ptr = ptr.unsafe_offset(1)   # advance: assign the result back
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

There is a subscript spelling for the same thing:

```mojo
ptr[unsafe_offset=3] = 0
# equivalent to:
ptr.unsafe_offset(3)[] = 0
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>. The manual's
runnable example initializes six `Float64` values and reads them back:

```mojo
from std.memory.alloc import alloc, Layout

def main():
    var allocation = alloc(Layout[Float64](count=6))
    var float_ptr = allocation.unsafe_ptr()
    for offset in range(6):
        float_ptr.unsafe_offset(offset).unsafe_write(0.0)

    float_ptr[unsafe_offset=2] = 3.0
    for offset in range(6):
        print(float_ptr[unsafe_offset=offset], end=", ")
    # 0.0, 0.0, 3.0, 0.0, 0.0, 0.0,
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

`unsafe_load()` / `unsafe_store()` (scalar aligned loads and stores),
`unsafe_strided_load()` / `unsafe_strided_store()`, and `unsafe_gather()` /
`unsafe_scatter()` cover the SIMD access patterns. Sources:
<https://mojolang.org/docs/manual/pointers/using-pointers/> and
<https://mojolang.org/releases/v1.0.0/>.

Pointer subtraction is the one arithmetic operator available on safe pointers:

> `Pointer` now supports subtracting two pointers to compute the signed
> distance between them in elements of the pointee type, via the new
> `offset_from()` method; the `-` operator does the same.

Source: <https://mojolang.org/releases/v1.0.0/>.

## Freeing memory

> Calling `dealloc()` on an allocation frees the allocated memory. It doesn't
> call the destructors on any values stored in the memory—you need to do that
> explicitly.

```mojo
ptr.unsafe_deinit_pointee()   # destroy the value
dealloc(allocation^)          # then free the storage
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>. Two more
facts:

- "Since deallocating an `Allocation` or `ThinAllocation` consumes the
  allocation, you're protected from freeing an allocation twice."
- Forgetting to free leaks: "Disposing of a pointer without freeing the
  associated memory can result in a memory leak."

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

### Allocations and raising functions

Because `Allocation` must be consumed, it conflicts with a function that may
exit through an error. The compiler reports the leak:

```mojo
def allocating_function() raises:
    var data = alloc[Float64](count=64)
    # ...
    raising_function(data.unsafe_ptr())
    # error: 'data' abandoned without being explicitly destroyed
    dealloc(data^)
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>. Two fixes
are documented: deallocate in the error path with `try`/`except`, or — as a last
resort — take the raw pointer with `unsafe_leak()` and manage the lifetime
yourself. The manual lists the downsides of the leak route: an error still
leaks, and reconstructing the allocation risks freeing twice.

```mojo
def allocating_function() raises:
    var data = alloc[Float64](count=64)
    try:
        raising_function(data.unsafe_ptr())
    except e:
        dealloc(data^)
        raise e^
    dealloc(data^)
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

### Holding an allocation in a struct

`Allocation` carries layout data that a struct can often drop. `into_thin()`
returns a `ThinAllocation`, and `unsafe_with_layout()` reconstructs the
`Allocation` for deallocation:

```mojo
struct Counter:
    comptime _layout = Layout[Int].single()
    var _alloc: ThinAllocation[Int]

    def __init__(out self, value: Int):
        self._alloc = alloc(Self._layout).into_thin()
        self._alloc.unsafe_ptr().unsafe_write(value)

    def increment(mut self):
        self._alloc.unsafe_ptr()[] += 1

    def __deinit__(deinit self):
        dealloc(self._alloc^.unsafe_with_layout(Self._layout))
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Origins and references

An *origin* answers two questions: "What variable 'owns' this value?" and "Can
the value be mutated using this reference?" Sources:
<https://mojolang.org/docs/manual/values/lifetimes/> and
<https://mojolang.org/docs/manual/pointers/using-pointers/>.

`Pointer` is parameterized on the origin of the memory it points to. The
documented full signature:

```text
struct Pointer[
    mut: Bool,
    //,
    T: AnyType,
    origin: Origin[mut=mut],
    *,
    address_space: AddressSpace = AddressSpace.GENERIC,
]
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

The origin rules you meet in practice:

- **`Pointer(to=value)`** infers the origin from the pointee: "`s_ptr.origin` is
  the same as the origin of `s`."
- **`alloc()`** returns a pointer with origin `MutUntrackedOrigin`, meaning it
  is mutable and does not alias existing values — "This memory isn't tracked by
  Mojo's lifetime checker and you're responsible for freeing it."
- **Inside a struct**, "you usually don't have to worry about the origin, as
  long as the pointer isn't exposed outside of the struct. But if the struct
  exposes a pointer or reference to that memory, you need to set the origin
  appropriately."

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

The origin kinds, from the lifetimes manual:

| Kind | Value | Meaning |
|------|-------|---------|
| Static | `ImmStaticOrigin` | "immutable values that last for the duration of the program" |
| Derived | `origin_of(value)` | the origin associated with the given value(s) |
| Inferred | inferred parameter | captured from an argument |
| Untracked | `MutUntrackedOrigin`, `ImmUntrackedOrigin` | memory not owned by another variable (for example heap allocation) |
| Wildcard | `ImmUnsafeAnyOrigin`, `MutUnsafeAnyOrigin` | "a reference that might access any live value" |

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

A struct that exposes its storage should tie the returned pointer's origin to
itself:

```mojo
def as_ptr(mut self) -> Pointer[String, origin_of(self.o_ptr)]:
    return Pointer(to=self.o_ptr[])
```

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

And a function that should accept a pointer but forbid mutation pins the `mut`
parameter and leaves the origin inferred:

```mojo
def print_bytes(bytes: Pointer[mut=False, Byte, _], count: Int):
    for i in range(count):
        print(hex(bytes[unsafe_offset=i]), end=" ")
    print()
```

> By binding the infer-only `mut` parameter to `False`, and leaving the origin
> unbound (using `_`), this signature lets the compiler infer the origin, but
> forces the origin to be immutable. Mojo can implicitly cast a mutable pointer
> to an immutable pointer...

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

Wildcard origins are discouraged: "the use of wildcard origins is discouraged,
and should be used as a last resort", because they disable ASAP destruction,
exclusivity checking and unused-variable warnings. Source:
<https://mojolang.org/docs/manual/values/lifetimes/>.

### References versus pointers

A reference is a name bound to an existing storage location; a pointer is a
value holding an address. The language-level reference forms are the `ref`
binding and the parameterized `ref` argument and return:

```mojo
var items: List[Int] = [99, 77, 33, 12]

var item = items[1]      # a copy
item += 1
print(items[1])          # 77 — unchanged

ref item_ref = items[1]  # a reference binding
item_ref += 1
print(items[1])          # 78 — changed through the reference
```

Source: <https://mojolang.org/docs/manual/variables/>. Reference bindings cannot
be reassigned — `ref x = ...` twice for the same name is an error. Source:
<https://mojolang.org/docs/manual/variables/>.

`ref` as an argument convention gives parametric mutability, and a `ref` return
value requires an origin specifier:

```mojo
def pick_one(cond: Bool, ref a: String, ref b: String) -> ref[a, b] String:
    return a if cond else b
```

> Because the compiler can't statically determine which branch will be picked,
> this function must use the union origin `[a, b]`... The returned reference is
> mutable if **both** `a` and `b` are mutable.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

The same page states the assignment rule that ties the two concepts together:

> If you assign a `ref` return value to a variable, the variable receives a
> *copy* of the referenced item. Use a reference binding if you need to capture
> the reference for future use.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

> **Open question:** the manual's `ref`-argument documentation shows both
> `ref[origin_of(self)]` and the shorthand `ref[self]` as equivalent origin
> specifiers, and lists `AddressSpace` values and `_` (unbound) as the other
> allowed forms. A complete formal grammar for origin specifiers is not given in
> one place; assemble it from the `values/lifetimes` page and the `Pointer`
> signature. Source:
> <https://mojolang.org/docs/manual/values/lifetimes/>.

## Nullability

`Pointer` is non-nullable, so a null pointer is modelled with `Optional`:

```mojo
def main():
    var ptr = Optional[Pointer[Int, MutUntrackedOrigin]]()
    if ptr:
        var p = ptr.value()
        print(p[])
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>. The
manual gives the layout guarantee and the deferred-initialization alternative:

> `Optional[Pointer]` has the same memory layout as a raw pointer, so you can
> pass it across FFI boundaries as `NULL`.
>
> When you need a non-null value for deferred initialization, use
> `unsafe_dangling()` instead of an `Optional`:
>
> ```mojo
> var ptr = Pointer[Int, MutUntrackedOrigin].unsafe_dangling()
> ```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

`Optional` in full is on [Optionals and nullability](optionals-and-nullability.md).

## Safety

> To use `Pointer` safely, you need to ensure that the pointer points to a
> single, initialized value. If the value is logically owned by the pointer, you
> need to ensure the value's destructor is called before deallocating the
> memory.
>
> Using `Pointer(to=value)` and the simple dereference (`ptr[]`) ensures that
> the pointer is as safe as the value it's pointing to.
>
> Using any APIs prefixed with `unsafe_` (or that have keyword arguments
> prefixed with `unsafe_`) results in a potentially unsafe operation.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>. The three
responsibilities the manual lists for unsafe use:

- If you allocate memory, you must deallocate it.
- You must track whether pointees are initialized or uninitialized.
- When accessing more than one value, you must track the allocation size and
  which values are initialized.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Pitfalls

- **Writing `UnsafePointer` in new code.** It is the deprecated pre-1.0 name for
  the unified `Pointer`; the old name and the unprefixed operations still work
  but warn and are hidden from generated docs. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Using `ptr[i]` for an offset.** The 1.x spelling is
  `ptr[unsafe_offset=i]` / `ptr.unsafe_offset(i)`; the bare subscript now means
  "unsafe" and is deprecated in that position. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Assigning through a dereference to initialize memory.**
  `ptr[] = value` on uninitialized memory is undefined behavior because it runs
  lifecycle methods on a non-existent value. Use `unsafe_write()`. Verified
  above.
- **Forgetting to deallocate an `Allocation`.** It is explicitly destroyed and
  the compiler reports an abandoned value; free it with `dealloc(allocation^)`.
  Verified above.
- **Assuming `dealloc` destroys the values.** It frees storage only; call
  `unsafe_deinit_pointee()` first for each initialized value. Verified above.
- **Expecting to catch allocation failure.** "Allocation failure terminates the
  program; you can't catch this failure with a `try/except` block." Verified
  above.
- **Holding a pointer without tracking whether it is still valid.** After
  `dealloc`, the pointer dangles and any access is undefined behavior. Verified
  above.
- **Treating a null pointer as a value.** Pointers are non-nullable; model null
  with `Optional[Pointer[...]]` or a non-null placeholder with
  `unsafe_dangling()`. Verified above.
- **Using a wildcard origin because it is convenient.** It disables ASAP
  destruction, exclusivity checking and unused-variable warnings; the manual
  calls it a last resort. Verified above.
- **Assuming a pointer copy copies the pointee.** Copying a pointer copies the
  address; both point at the same memory. Verified above.
- **Forgetting `mut` when a method must hand out a mutable origin.** The
  derived origin from an immutable `self` is immutable, so the returned pointer
  is read-only. Verified above.

## Sources

- Intro to pointers (manual): <https://mojolang.org/docs/manual/pointers/>
- Using pointers (manual): <https://mojolang.org/docs/manual/pointers/using-pointers/>
- Lifetimes, origins, and references (manual): <https://mojolang.org/docs/manual/values/lifetimes/>
- Variables (manual): <https://mojolang.org/docs/manual/variables/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
