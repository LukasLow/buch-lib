# Origins and borrowing

The Mojo compiler includes a **lifetime checker**, "a compiler pass that analyzes
dataflow through your program. It identifies when variables are valid and inserts
destructor calls when a variable's lifetime ends." To do that it uses a special
compile-time value called an **origin**.

> Specifically, an origin answers two questions:
> - What variable "owns" this value?
> - Can the value be mutated using this reference?

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

This page covers origin types and origin values, `ref` arguments and `ref`
return values (including union origins), and how origins make borrows safe.
Ownership itself is on [ownership and lifetimes](ownership-and-lifetimes.md).

## How origins track reference validity

```mojo
def print_str(s: String):
    print(s)

def main():
    var name: String = "Joan"
    print_str(name)
```

Both `name` and `s` refer to the same logical storage space, "and have
associated origin values that lets the Mojo compiler reason about them."

> Origin tracking and lifetime checking is done at compile time, so origins don't
> track the actual storage space allocated for the `name` variable, for example.
> Instead, origins track variables symbolically, so the compiler tracks that
> `print_str()` is called with a value owned by `name` in the caller's scope. By
> tracking how owned data flows through the program, the compiler can identify the
> lifetimes of values.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

Most of the time origins are handled automatically. You interact with them
directly in two situations:

- When working with references — specifically `ref` arguments and `ref` return
  values.
- When working with types parameterized on the origin of the data they refer to,
  such as `Pointer` or `Span`.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

A crucial property: origins are how Mojo keeps borrowed data alive.

> Among other things, Mojo uses origins to extend the lifetimes of referenced
> values, so values aren't destroyed prematurely.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>. This is the same
rule as "if there are existing references to a value, Mojo extends the lifetime
of the owner" on [ownership and lifetimes](ownership-and-lifetimes.md).

You cannot create an origin from nothing — it must be derived from an existing
value. Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

## Origin types and values

Mojo supplies a struct and several `comptime` aliases for origin types. The
`ImmOrigin` and `MutOrigin` `comptime` values represent immutable and mutable
origins:

```mojo
struct ImmutRef[origin: ImmOrigin]:
    pass
```

`Origin` specifies an origin with parametric mutability:

```mojo
struct ParametricRef[
    is_mutable: Bool,
    //,
    origin: Origin[mut=is_mutable]
]:
    pass
```

`is_mutable` is an infer-only parameter, and the `origin` value is often
inferred, too:

```mojo
from std.memory import Pointer

def use_pointer():
    var a = 10
    var ptr = Pointer(to=a)   # origin inferred from `a`
```

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

The documented ways to specify an origin value:

| Kind | Spelling | Meaning |
|------|----------|---------|
| Static | `ImmStaticOrigin` | An immutable value that lasts for the duration of the program; string literals have one. |
| Derived | `origin_of(value)` | The origin associated with the value (or values) passed in. |
| Inferred | infer-only parameter | Captures the origin of an argument. |
| Untracked | `MutUntrackedOrigin`, `ImmUntrackedOrigin` | Values not tracked by the lifetime checker, such as dynamically allocated memory. |
| Wildcard | `ImmUnsafeAnyOrigin`, `MutUnsafeAnyOrigin` | A reference that might access any live value. |

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

### Derived origins and `origin_of()`

`origin_of()` takes an origin value or a value with a memory location:

```mojo
origin_of(self)
origin_of(x.y)
origin_of(foo())
```

> The `origin_of()` operator is analyzed statically at compile time; the
> expressions passed to `origin_of()` are never evaluated. (For example, when the
> compiler analyzes `origin_of(foo())`, it doesn't run the `foo()` function.)

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

A struct that exposes a pointer to its own data ties the pointer's origin to
`self`:

```mojo
from std.memory import OwnedPointer, Pointer

struct BoxedString:
    var o_ptr: OwnedPointer[String]

    def __init__(out self, value: String):
        self.o_ptr = OwnedPointer(value)

    def as_ptr(mut self) -> Pointer[String, origin_of(self.o_ptr)]:
        return Pointer(to=self.o_ptr[])
```

> Note that the `as_ptr()` method takes its `self` argument as `mut self`. If it
> used the default argument convention, it would be immutable, and the derived
> origin (`origin_of(self.o_ptr)`) would also be immutable.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

### Origin unions

Passing multiple expressions to `origin_of()` expresses the union of their
origins:

```mojo
origin_of(a, b)
```

> The union of two or more origins creates a new origin that references all of
> the original origins for the purposes of lifetime extension (so a union of the
> origins of `a` and `b` extends both lifetimes). An origin union is mutable if
> and only if all of its constituent origins are mutable.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

### Origin sets

> An `OriginSet` is not a type of origin, it represents a group of origins. Origin
> sets are used for tracking the lifetimes of values captured in parametric
> closures. An `OriginSet` **isn't** a general-purpose mechanism for expressing a
> combination of multiple origins. Instead, you can use `origin_of()` to express
> an origin union.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

### Untracked and wildcard origins

The untracked origins "represent values that do not alias any existing value.
That is, they point to memory that is not owned by any other variable, and are
therefore not tracked by the lifetime checker." A struct that allocates memory
should generally free it in its destructor. Source:
<https://mojolang.org/docs/manual/values/lifetimes/>.

The wildcard origins come with a strong warning:

> Using a pointer with a wildcard origin into a scope effectively disables Mojo's
> ASAP destruction for any values in that scope, as long as the pointer is live.
> It also prevents Mojo from enforcing argument exclusivity and hides unused
> variable warnings. Accordingly, the use of wildcard origins is discouraged, and
> should be used as a last resort.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

## `ref` arguments

The `ref` convention gives an argument **parametric mutability**: the same
function works whether the caller passes a mutable or an immutable reference.
The documented reasons to use it:

- You want to accept an argument with parametric mutability.
- You want to tie the lifetime of one argument to another.
- You want an argument guaranteed to be passed in memory — "useful for
  parameterized arguments that need an identity, whether or not the concrete type
  is register passable."

Two spellings:

```text
ref arg_name: arg_type
ref[origin_specifier(s)] arg_name: arg_type
```

In the first form the origin and mutability are inferred from the value passed
in. The second form's origin clause accepts:

- An origin value.
- An arbitrary expression, treated as shorthand for `origin_of(expression)` —
  `ref[origin_of(self)]` and `ref[self]` are equivalent.
- An `AddressSpace` value.
- `_` to mark the origin *unbound*, equivalent to omitting the specifier.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

Naming the origin is what lets you tie a return value to an argument. `Span` is
the canonical example because it is parameterized on the origin of the data it
points to:

```mojo
from std.collections import List, Span

def to_byte_span[
    is_mutable: Bool,
    //,
    origin: Origin[mut=is_mutable],
](ref[origin] list: List[Byte]) -> Span[Byte, origin]:
    return Span(list)

def main():
    var list: List[Byte] = [77, 111, 106, 111]
    _ = to_byte_span(list)
```

The `origin` parameter is inferred from `list` and reused as the span's origin:

> Since the `Span` takes on the origin of the `list` argument, the Mojo compiler
> can identify the span's data as owned by the list. The span will have the same
> lifetime as the list, and the span will be mutable if the list is mutable.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

## `ref` return values

A function can return a reference instead of a value:

```text
-> ref[origin_specifier(s)] arg_type
```

> Note that you **must** provide an origin specifier for a `ref` return value.

This is how `__getitem__()` returns a mutable reference that can be modified in
place, versus a `__getitem__()`/`__setitem__()` pair:

```mojo
struct NameList:
    var names: List[String]

    def __init__(out self, *names: String):
        self.names = []
        for name in names:
            self.names.append(name)

    def __getitem__(ref self, index: Int) raises -> ref[self.names[0]] String:
        if index >= 0 and index < len(self.names):
            return self.names[index]
        else:
            raise Error("index out of bounds")

def main() raises:
    var list = NameList("Thor", "Athena", "Dana", "Vrinda")
    ref name = list[2]
    print(name)     # Dana
    name += "?"
    print(list[2])  # Dana?
```

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

The trade-off the docs state:

> - The mutable reference is more efficient — a single update isn't broken up
>   across two methods. However, the referenced value must be in memory.
> - A `__getitem__()`/`__setitem__()` pair allows for arbitrary code to be run
>   when values are retrieved and set. For example, `__setitem__()` can validate
>   or constrain input values.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

### Bind a reference to keep it

Assigning a `ref` return value to a variable copies it; use a reference binding
to keep the reference:

```mojo
var name_copy = list[2]   # owned copy of list[2]
ref name_ref = list[2]    # reference to list[2]
```

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

### Parametric mutability of return values

Tying the return origin to `self` makes the returned reference's mutability
follow the caller's:

```mojo
def __getitem__(ref self, index: Int) raises -> ref[self] String:
    ...
```

> Since the `origin` of the return value is tied to the origin of `self`, the
> returned reference will be mutable if the method was called using a mutable
> reference. The method still works if you have an immutable reference to the
> `NameList`, but it returns an immutable reference.

> Without parametric mutability, you'd need to write two versions of
> `__getitem__()`, one that accepts an immutable `self` and another that accepts a
> mutable `self`.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

### Return values with union origins

When a function may return a reference to one of several inputs, the origin is
the union, so the compiler keeps **both** alive:

```mojo
def pick_one(cond: Bool, ref a: String, ref b: String) -> ref[a, b] String:
    return a if cond else b
```

> Because the compiler can't statically determine which branch will be picked,
> this function must use the union origin `[a, b]`. This ensures that the compiler
> extends the lifetime of *both* values as long as the returned reference is live.
> The returned reference is mutable if **both** `a` and `b` are mutable.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

## Origins on pointers

`Pointer` carries an origin parameter, so a pointer's validity is tracked like a
reference's:

```mojo
var s = "Testing"
var s_ptr = Pointer(to=s)   # s_ptr.origin is the origin of `s`
```

A pointer obtained from `alloc()` instead has `MutUntrackedOrigin`, meaning it
aliases no existing value and is not tracked; you are responsible for freeing it.
Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

When taking a pointer as an argument, you can pin one part of the origin and
leave the rest to inference: "By binding the infer-only `mut` parameter to
`False`, and leaving the origin unbound (using `_`), this signature lets the
compiler infer the origin, but forces the origin to be immutable." Mojo can
implicitly cast a mutable pointer to an immutable pointer, so a mutable pointer
can be passed where the function cannot mutate the data. Source:
<https://mojolang.org/docs/manual/values/lifetimes/>.

Allocator-level detail is on [allocators](allocators.md).

## Pitfalls

- **Trying to construct an origin directly.** Origins are created by the
  compiler; derive them from values with `origin_of()`. Source:
  <https://mojolang.org/docs/manual/values/lifetimes/>.
- **Omitting the origin specifier on a `ref` return.** It is required. Source:
  <https://mojolang.org/docs/manual/values/lifetimes/>.
- **Assigning a `ref` return to a plain variable and expecting a reference.** You
  get a copy; use a `ref` binding. Source:
  <https://mojolang.org/docs/manual/values/lifetimes/>.
- **Holding an interior reference across a mutation of the container.** Element
  references carry the container's interior origin, and the checker rejects a
  reference held across a mutation. See [`versions/1.0.0`](../versions/1.0.0.md).
- **Reaching for wildcard origins.** They disable ASAP destruction in the scope,
  defeat argument exclusivity, and hide unused-variable warnings. Source:
  <https://mojolang.org/docs/manual/values/lifetimes/>.
- **Using an untracked origin and expecting the checker to manage the memory.**
  Untracked memory is outside the ownership system; the allocating type must free
  it. Source: <https://mojolang.org/docs/manual/values/lifetimes/>.
- **Returning one of two references with a single origin.** Use the union
  `ref[a, b]`; otherwise the compiler cannot know both owners must stay alive.
  Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

## Open questions

> **Open question:** the lifetimes page is titled "Lifetimes, origins, and
> references" and calls origin tracking the compiler's mechanism for validity,
> but the `origin` package and the full `Origin` API are documented only in the
> standard library ([`stdlib/origin`](../stdlib/origin.md)). The manual states
> the concepts but not the complete type surface; consult that page for the API.

> **Open question:** "borrow checking" and "exclusivity" are described in the
> context of arguments and origins, but the docs do not use a formal borrow
> terminology. Treat "borrowing" in this book as a plain-language name for
> lifetime-checked references, not as a separately documented language feature.

## Sources

- Mojo manual — Lifetimes, origins, and references: <https://mojolang.org/docs/manual/values/lifetimes/>
- Mojo manual — Ownership: <https://mojolang.org/docs/manual/values/ownership/>
- Mojo manual — Intro to value ownership: <https://mojolang.org/docs/manual/values/>
- Mojo manual — Using pointers: <https://mojolang.org/docs/manual/pointers/using-pointers/>
- Mojo reference — Function declarations: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo v1.0.0 release notes (interior origins): <https://mojolang.org/releases/v1.0.0/>
