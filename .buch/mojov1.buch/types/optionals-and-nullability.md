# Optionals and nullability

`Optional[T]` is Mojo's type-safe nullable: it holds either a `T` or nothing,
and you must check before extracting. It is also an `Iterable` of zero or one
elements, which makes it compose with `for` loops and the rest of the
collection machinery. This page covers construction, truthiness, the unwrapping
idioms (`value()`, `or_else()`, `take()`, `map()`, `and_then()`), iteration, and
the null-pointer interaction.

## What `Optional` is

The API reference is the definition:

> A type modeling a value which may or may not be present.
>
> Optional values can be thought of as a type-safe nullable pattern. Your value
> can take on a value or `None`, and you need to check and explicitly extract
> the value to get it out.

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

`Optional` is a collection type, not a special language construct. The types
reference lists it with `List`, `Dict` and `Set`, and the manual describes it in
the collection-types section. Sources:
<https://mojolang.org/docs/reference/types/> and
<https://mojolang.org/docs/manual/types/>.

Its parameter bound is the widest possible — `T: AnyType` — with `Movable`,
`Copyable` and the other conformances conditional on the element:

> `Optional` and `Variant` now accept element types that are not `Movable`.
> Their element types are now bounded by `AnyType`, with `Movable`, `Copyable`,
> and related conformances conditional on the element types.

Source: <https://mojolang.org/releases/v1.0.0/>.

> **Open question:** `Optional`'s layout is explicitly not guaranteed. The API
> reference states: "The implementation may apply niche optimizations (for
> example, storing the `None` sentinel inside spare bits of `T`) that alter the
> resulting layout. Do not rely on `size_of[Optional[T]]()`... being stable
> across compiler versions." The only guarantee is that size and alignment are
> at least those of `T`. Source:
> <https://mojolang.org/docs/std/collections/optional/Optional/>.

## Constructing an `Optional`

Four documented ways, two with a value and two empty:

```mojo
var opt1 = Optional(5)
var opt2: Optional[Int] = 5
var opt3 = Optional[Int]()
var opt4: Optional[Int] = None
```

Source: <https://mojolang.org/docs/manual/types/>.

There is also a closure-based constructor for values that cannot be moved:

> The value returned by `call` is constructed directly into the `Optional`'s
> storage without being moved, so this is the only way to populate an
> `Optional` whose element type is not `Movable`.

```mojo
@fieldwise_init
struct Pinned(Movable where False):
    var value: Int

def make() -> Pinned:
    return Pinned(7)

var opt = Optional[Pinned](init_with=make)
print(opt.value().value)   # 7
```

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

The value constructor is `@implicit`, so `var opt: Optional[Int] = 5` works;
the empty constructor accepts `None` exactly:
"**value** (`NoneType`): Must be exactly `None`." Source:
<https://mojolang.org/docs/std/collections/optional/Optional/>.

## Truthiness and checks

An `Optional` is truthy when it holds a value:

> An `Optional` evaluates as `True` when it holds a value, `False` otherwise.

Source: <https://mojolang.org/docs/manual/types/>. The operator reference
states the type-theoretic reason: `Optional` conforms to `Boolable`, and the
general rule is that "zero, empty strings, empty collections, and `None` are
falsy." Source: <https://mojolang.org/docs/manual/operators/>.

```mojo
def main():
    var a = Optional(1)
    var b = Optional[Int](None)

    if a:
        print(a.value())    # 1
    if not b:
        print("empty")      # empty
```

Source: <https://mojolang.org/docs/std/collections/optional/>.

`Optional` also implements the identity operators so that `is None` reads
naturally:

> `__is__` returns `True` if the Optional has no value. "It allows you to use
> the following syntax: `if my_optional is None:`."
>
> `__isnot__` returns `True` if the Optional has a value.

```mojo
def main():
    var opt: Optional[Int] = None
    if opt is None:
        print("No value")        # prints
    opt = 42
    if opt is not None:
        print("Has a value")     # prints
```

Sources: <https://mojolang.org/docs/std/collections/optional/Optional/> and
<https://mojolang.org/docs/manual/operators/>.

Three equivalent emptiness checks exist. They are all documented, and they
differ only in spelling:

| Check | Form | Official note |
|-------|------|---------------|
| Truthiness | `if opt:` | `Bool(opt)` is `True` when a value is present |
| Identity | `if opt is not None:` | implemented by `__isnot__` |
| Inversion | `if not opt:` | `__invert__` returns `False` if a value is present |

Sources: <https://mojolang.org/docs/std/collections/optional/Optional/> and
<https://mojolang.org/docs/std/collections/optional/>.

## Unwrapping

### `value()` — abort on empty

> If the `Optional` holds a value, you can retrieve a reference to the value
> using the `value()` method. But calling `value()` on an `Optional` with no
> value results in undefined behavior, so you should always guard a call to
> `value()` inside a conditional that checks whether a value exists.

```mojo
var opt: Optional[String] = "Testing"
if opt:
    var value_ref = opt.value()
    print(value_ref)     # Testing
```

Source: <https://mojolang.org/docs/manual/types/>.

The API reference is more specific about the failure mode — it aborts, and the
page says so twice:

> **Notes:** This will abort on empty `Optional`.

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>. The
error type is `EmptyOptionalError`: "An error type for when an empty `Optional`
is accessed." Source:
<https://mojolang.org/docs/std/collections/optional/>.

```mojo
var instance = Optional("Hello")
var x = instance.value()
print(x)                       # Hello
# instance = Optional[String]()
# print(instance.value())      # aborts: attempts to take value from `None`
```

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

`unsafe_value()` is the unguarded twin: "This will **not** abort on empty
`Optional`", and in debug builds it "will deterministically abort". Source:
<https://mojolang.org/docs/std/collections/optional/Optional/>.

`__getitem__` is another unwrapping route and returns a reference:
`def __getitem__(ref self) -> ref[self_is_mut._value] T`. Source:
<https://mojolang.org/docs/std/collections/optional/Optional/>.

### `or_else()` — supply a default

> Alternately, you can use the `or_else()` method, which returns the stored
> value if there is one, or a user-specified default value otherwise:

```mojo
var custom_greeting: Optional[String] = None
print(custom_greeting.or_else("Hello"))   # Hello

custom_greeting = "Hi"
print(custom_greeting.or_else("Hello"))   # Hi
```

Source: <https://mojolang.org/docs/manual/types/>. The method consumes `self`
and requires `T: Deinitable & Movable`:
`def or_else(deinit self, var default: T) -> T where conforms_to(T, Deinitable & Movable)`.
Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

### `take()` — move the value out

> Move the value out of the `Optional`.
>
> **Notes:** This will abort on empty `Optional`.

```mojo
var instance = Optional("Hello")
print(instance.bounds()[0])   # 1
var x = instance.take()       # moves the value out
print(x)                      # Hello
print(instance.bounds()[0])   # 0 — instance is now empty
print(instance)               # None
```

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.
`take()` requires `T: Movable` and moves rather than copies, which is what you
need for a move-only element. `unsafe_take()` is the unguarded form; it
"will **not** abort on empty `Optional`" in release and deterministically aborts
in debug builds. Source:
<https://mojolang.org/docs/std/collections/optional/Optional/>.

### `map()` — transform if present

> Applies a function to the contained value (if any), returning an `Optional`
> containing the result.
>
> Transforms `Optional[T]` into `Optional[To]` by applying `mapper` to the
> contained value. If `self` is empty, returns an empty `Optional[To]` without
> calling `mapper`.

```mojo
var opt = Optional("hello")
var length = opt.map(String.byte_length)
print(length.value())        # 5

var empty = Optional[String](None)
var none_length = empty.map(String.byte_length)
print(none_length.or_else(-1))   # -1 — the mapper was not called
```

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

### `and_then()` — chain a fallible step

> Calls `mapper` on the contained value (if any), returning the result.
>
> Unlike `map()`, the mapper function itself returns an `Optional`. This allows
> chaining operations that may each independently fail. Sometimes called "flat
> map" in other languages.

```mojo
def try_parse_int(s: String) -> Optional[Int]:
    try:
        return Int(s)
    except:
        return None

def main():
    var opt = Optional("42")
    print(opt.and_then(try_parse_int).value())    # 42

    var empty = Optional[String](None)
    print(empty.and_then(try_parse_int).or_else(-1))   # -1
```

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

Both `map()` and `and_then()` now work with linear element types — they "move
the contained value out and destroy the emptied `Optional` explicitly". Source:
<https://mojolang.org/releases/v1.0.0/>.

`map()` and `and_then()` do not *short-circuit* the way `and`/`or` do on
booleans; they are transformations that preserve emptiness. Sources:
<https://mojolang.org/docs/std/collections/optional/Optional/>.

### `copied()` — Optional of a pointer to Optional of the value

An `Optional[Pointer[T]]` can be converted into an `Optional[T]` by copying the
pointee — useful after an API hands back an optional pointer:

```mojo
var data = "foo"
var opt = Optional(Pointer(to=data))
var opt_owned: Optional[String] = opt.copied()
```

> If `self` is an empty `Optional`, the returned `Optional` will be empty as
> well.

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

## `Optional` as an `Iterable` of 0 or 1

This is the 1.0 change that matters most for control flow:

> `Optional` no longer conforms to `Iterator`; it is now an `Iterable`
> collection of 0 or 1 elements.

Source: <https://mojolang.org/releases/v1.0.0/>.

> `Optional` acts as a collection of size 0 or 1.

```mojo
def main():
    var instance = Optional("Hello")
    for value in instance:
        print(value)             # Hello — printed once

    instance = None
    for value in instance:
        print(value)             # an empty Optional yields nothing
```

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

A `for` over an `Optional` therefore runs zero or one time — a compact
alternative to an `if` block. There is also a consuming form,
`__iter__(var self)`, which "consumes the `Optional` and returns an iterator
over its value", and requires `T: Deinitable & Movable`. Source:
<https://mojolang.org/docs/std/collections/optional/Optional/>.

`bounds()` reports the length as a collection, which is a good way to reason
about it in generic code:

```mojo
def main():
    var empty_instance = Optional[Int]()
    var populated_instance = Optional[Int](50)
    print(empty_instance.bounds()[0])       # 0
    print(populated_instance.bounds()[0])   # 1
```

> **Returns:** A tuple containing the length (0 or 1) and an `Optional`
> containing the length.

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

> **Open question:** `Optional` is documented as conforming to `Iterable`, and
> the release notes state that it is no longer an `Iterator`. Code that calls
> `next()` directly on an `Optional` was the pre-1.0 pattern and no longer
> compiles; iterate it instead. The exact interaction with generic `Iterable`
> bounds that request a mutable iterator is not spelled out on the `Optional`
> page. Sources: <https://mojolang.org/releases/v1.0.0/> and
> <https://mojolang.org/docs/std/collections/optional/Optional/>.

## Nullability for pointers

`Optional` is Mojo's answer to the null pointer, because none of the pointer
types is nullable:

> **Nullable pointers**: some languages use a sentinel value to represent a
> pointer that doesn't point to anything (a "null pointer"). None of the Mojo
> standard library pointer types are nullable. To model a nullable pointer, use
> the `Optional` type.

```mojo
var ptr = Optional[Pointer[Int, MutUntrackedOrigin]]()

if ptr:
    var p = ptr.value()
    print(p[])
```

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>. Two
documented consequences:

> This creates an `Optional` with a value of `None`, which is equivalent to a
> null pointer. `Optional[Pointer]` has the same memory layout as a raw pointer,
> so you can pass it across FFI boundaries as `NULL`.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>. This is the
one documented exception to the open question about `Optional`'s layout: the
`Optional[Pointer]` case is guaranteed to match a raw pointer.

The self-referential-structs page builds linked lists directly on this pattern;
see [Self-referential structs](self-referential-structs.md).

## Linear (non-`Deinitable`) element types

`Optional[T]` supports element types that are neither `Movable` nor
`Deinitable`, with the relevant operations conditional on the element:

> `deinit_with()` on both types also no longer requires `Movable`, so element
> types that are neither `Movable` nor `Deinitable` are fully usable.

```mojo
@fieldwise_init
struct ExplicitDeinit(Movable, Deinitable where False):
    var data: Int

    def explicit_deinit(deinit self):
        pass

def main():
    var opt = Optional(ExplicitDeinit(5))
    opt^.deinit_with(ExplicitDeinit.explicit_deinit)
```

Source (pattern and signatures):
<https://mojolang.org/docs/std/collections/optional/Optional/> and
<https://mojolang.org/releases/v1.0.0/>.

Empty linear optionals can be destroyed without a deinitializer:

> `deinit_assert_empty()` destroys an empty `Optional`, asserting that it holds
> no value... In safe-assert builds it aborts if the `Optional` is non-empty.

```mojo
var opt: Optional[ExplicitDeinit] = None
opt^.deinit_assert_empty()
```

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

## Formatting and equality

`Optional` conforms to `Writable`, so `print()` works, and its representation
distinguishes present from absent:

- `print(Optional(5))` prints `5`.
- An empty `Optional` prints `None`.

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>. Equality
also has a `None` overload:

> `__eq__` returns `True` if a value is not present. — `def __eq__(self, rhs:
> None) -> Bool`
>
> `__ne__` returns `True` if a value is present. — `def __ne__(self, rhs: None)
> -> Bool`

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>. So
`opt == None` and `opt != None` work, in addition to `is None` / `is not None`.

## Pitfalls

- **Calling `value()` without a check.** It aborts on an empty `Optional` — the
  error type is `EmptyOptionalError`, but it is an abort, not a catchable
  exception. Guard it with `if opt:` or use `or_else()`. Verified above.
- **Using an `Optional` as an iterator.** It is an `Iterable`, not an
  `Iterator`; `opt.next()` was the pre-1.0 pattern and no longer compiles.
  Source: <https://mojolang.org/releases/v1.0.0/>.
- **Assuming `Optional` and `T` have the same size.** The layout is explicitly
  unspecified apart from being at least as large as `T`; do not size arithmetic
  against `Optional[T]`. Verified above.
- **Using `take()` when you only have an immutable reference.** `take(mut self)`
  requires mutability, and it moves the value out, leaving the `Optional`
  empty. Verified above.
- **Confusing `value()` with `unsafe_value()`.** Both return a reference; only
  `value()` aborts on empty in all builds. Verified above.
- **Expecting `map()` to call the mapper on an empty `Optional`.** It returns
  an empty `Optional[To]` and does not call `mapper`. Verified above.
- **Modelling a null pointer with a special address.** Pointers are
  non-nullable; use `Optional[Pointer[...]]`, or `unsafe_dangling()` when you
  need a non-null placeholder for deferred initialization. Verified above.
- **Forgetting the transfer sigil with a linear `Optional`.** Tearing down a
  non-`Deinitable` optional needs `opt^.deinit_with(...)` or
  `opt^.deinit_assert_empty()`. Verified above.
- **Comparing with `==` when identity is meant.** `optional == None` uses
  `__eq__`; `optional is None` uses `__is__`. Both are documented, but `is`
  expresses the intent for the null check. Verified above.

## Sources

- Mojo `Optional` API: <https://mojolang.org/docs/std/collections/optional/Optional/>
- Mojo `optional` module: <https://mojolang.org/docs/std/collections/optional/>
- Types (manual): <https://mojolang.org/docs/manual/types/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Using pointers (manual): <https://mojolang.org/docs/manual/pointers/using-pointers/>
- Intro to pointers (manual): <https://mojolang.org/docs/manual/pointers/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
