# Operator support for custom types

Every Mojo operator maps to one or more dunder methods. Implement the right
method on your struct and the operator works on your type. This page is the
complete mapping: forward, reversed and in-place forms; unary operators; the
comparison, identity and membership operators and their traits; subscripts and
slices; and a full walkthrough that builds one type supporting every category.

The operator *reference* — precedence, associativity and the symbolic
operators themselves — is on [Operators](../basics/operators.md).

## The three method forms

> Each Mojo operator maps to a set of dunder methods you can add to your
> struct implementation. These methods let you use operator syntax instead of
> calling methods directly.

Source: <https://mojolang.org/docs/manual/structs/operator-support/>.

For a binary operator `a op b`, up to three methods can be involved:

- **Forward**: `a op b` tries `a.__op__(b)` first.
- **Reversed**: "If the forward method doesn't exist or can't handle `b`'s type,
  Mojo falls back to the reversed method on `b`. `a + b` calls
  `b.__radd__(a)`."
- **In-place**: "Called for compound assignment. `a += b` calls
  `a.__iadd__(b)`."

Source: <https://mojolang.org/docs/manual/structs/operator-support/>. The
reversed methods exist precisely for mixed-type expressions where the left
operand cannot know about the right operand's type:

```mojo
a + 5    # calls a.__add__(5)
5 + a    # Int doesn't know your type, falls back to a.__radd__(5)
a += 5   # calls a.__iadd__(5)
```

Source: <https://mojolang.org/docs/manual/structs/operator-support/>.

> **Open question:** the reference and the manual agree on the three-form model,
> but the reference tables sometimes list a method without parentheses (for
> example `__truediv__`, `__floordiv__`, `__pow__`) while the manual always
> writes `__truediv__()`. The names are the same; treat the parentheses as the
> convention, not a different method. Sources:
> <https://mojolang.org/docs/reference/operators/> and
> <https://mojolang.org/docs/manual/structs/operator-support/>.

## Arithmetic operators

| Operator | Forward | Reversed | In-place |
|----------|---------|----------|----------|
| `+` | `__add__()` | `__radd__()` | `__iadd__()` |
| `-` | `__sub__()` | `__rsub__()` | `__isub__()` |
| `*` | `__mul__()` | `__rmul__()` | `__imul__()` |
| `/` | `__truediv__` | `__rtruediv__()` | `__itruediv__()` |
| `//` | `__floordiv__` | `__rfloordiv__()` | `__ifloordiv__()` |
| `%` | `__mod__()` | `__rmod__()` | `__imod__()` |
| `**` | `__pow__()` | `__rpow__()` | `__ipow__()` |
| `@` | `__matmul__()` | `__rmatmul__()` | `__imatmul__()` |

Source: <https://mojolang.org/docs/reference/operators/>.

In-place operators are syntactic sugar for the operator plus assignment:

```mojo
x += y     # x = x + y
x -= y     # x = x - y
x *= y     # x = x * y
x /= y     # x = x / y
x //= y    # x = x // y
x %= y     # x = x % y
x **= y    # x = x ** y
x @= y     # x = x @ y
```

Source: <https://mojolang.org/docs/reference/operators/>.

Two caveats matter:

- **In-place methods are not automatic.** "A type must implement its in-place
  methods explicitly, so not every type that supports `+` also supports `+=`."
  Source: <https://mojolang.org/docs/manual/operators/>.
- **`**` has a trait.** `Powable` "requires `__pow__()`, doesn't provide a
  default." Source: <https://mojolang.org/docs/reference/operators/>.

The reason a type would implement an in-place form is efficiency: "For types
that store data on the heap, in-place operators can avoid allocating
intermediate values." Source:
<https://mojolang.org/docs/manual/operators/>.

## Bitwise operators

| Operator | Forward | Reversed | In-place |
|----------|---------|----------|----------|
| `&` | `__and__()` | `__rand__()` | `__iand__()` |
| `\|` | `__or__()` | `__ror__()` | `__ior__()` |
| `^` | `__xor__()` | `__rxor__()` | `__ixor__()` |
| `<<` | `__lshift__()` | `__rlshift__()` | `__ilshift__()` |
| `>>` | `__rshift__()` | `__rrshift__()` | `__irshift__()` |

Source: <https://mojolang.org/docs/reference/operators/>. The compound forms
follow the same sugar:

```mojo
x &= y     # x = x & y
x |= y     # x = x | y
x ^= y     # x = x ^ y
x <<= y    # x = x << y
x >>= y    # x = x >> y
```

Source: <https://mojolang.org/docs/reference/operators/>.

A caution that is easy to miss: `^` is both XOR and the transfer sigil.

> **Disambiguation:** `^` means XOR when followed by a value, and transfer when
> used directly after a variable name.
>
> ```mojo
> a ^ b   # XOR
> a^      # transfer
> ```

Source: <https://mojolang.org/docs/reference/operators/>. The manual's warning
is sharper still:

> In expressions where the meaning could be ambiguous, Mojo treats it as XOR.
> For example, `x^+1` is `(x ^ (+1))`, not `((x^) + 1)`.

Source: <https://mojolang.org/docs/manual/operators/>.

## Unary operators

| Operator | Method |
|----------|--------|
| `-x` | `__neg__()` |
| `+x` | `__pos__()` |
| `~x` | `__invert__()` |

Source: <https://mojolang.org/docs/reference/operators/>. The manual's
description: "A unary operator returns the original value if unchanged, or a
new value representing the result." Source:
<https://mojolang.org/docs/manual/structs/operator-support/>.

```mojo
@fieldwise_init
struct MyInt:
    var value: Int

    def __neg__(self) -> Self:
        return Self(-self.value)

def main():
    print((-MyInt(5)).value)   # -5
```

Source: <https://mojolang.org/docs/manual/structs/operator-support/>.

There is exactly one postfix unary operator, and it is not implementable:

| Operator | Method |
|----------|--------|
| `x^` | Compiler implementation only |

> Use the `^` sigil for ownership transfer. `consume(a^)` transfers ownership
> of `a` to the `consume` function.

Source: <https://mojolang.org/docs/reference/operators/>. So `^` as transfer is
a language feature, not something a struct can overload; `^` as XOR *is*
overloadable through `__xor__`.

## Comparison operators

| Operator | Method | Trait | Default? |
|----------|--------|-------|----------|
| `==` | `__eq__()` | `Equatable` | Yes |
| `!=` | `__ne__()` | `Equatable` | Yes |
| `<` | `__lt__()` | `Comparable` | No |
| `<=` | `__le__()` | `Comparable` | Yes |
| `>` | `__gt__()` | `Comparable` | Yes |
| `>=` | `__ge__()` | `Comparable` | Yes |

Source: <https://mojolang.org/docs/reference/operators/>.

The trait defaults are the reason you rarely write all six:

> `Equatable` provides `__eq__()` if all your struct's fields conform to
> `Equatable` using pairwise field comparison. `__ne__()` derives from
> `__eq__()`.
>
> `Comparable` provides `__le__()`, `__gt()`, and `__ge()`, all derived from
> `__lt__()`. You implement `__lt__()`.
>
> `Comparable` refines `Equatable`, so conforming to `Comparable` requires both
> traits.

Source: <https://mojolang.org/docs/reference/operators/>. The manual summarizes
the design advice and the mechanism:

> Operators do not require that you conform your types to traits. However, there
> are benefits to doing so. The `Comparable` trait provides defaults for `<=`,
> `>`, and `>=`. You just implement `__lt__()` and `__eq__()`.
>
> Similarly, the `Equatable` trait provides defaults for `__eq__()` and `__ne__()`
> when all fields are `Equatable`.
>
> For types without a natural ordering (like complex numbers), only implement
> `Equatable`, and not `Comparable`.

Source: <https://mojolang.org/docs/manual/structs/operator-support/>.

The operator-support walkthrough makes the default explicit for a `Complex`
type:

> `Equatable` supplies a default `__eq__()` that uses compile-time reflection to
> compare every field, and a default `__ne__()` that returns the inverse of
> `__eq__()`. A `Complex` is equal to another exactly when both fields match, so
> the reflection-based default is exactly the behavior you want.

Source: <https://mojolang.org/docs/manual/structs/operator-support/>. Note the
floating-point consequence stated there: "because a floating-point `NaN` never
equals itself, a `Complex` holding a `NaN` won't equal itself either."

## Identity and membership

| Operator | Method | Trait | Default? |
|----------|--------|-------|----------|
| `is` | `__is__()` | `Identifiable` | No |
| `is not` | `__isnot__()` | `Identifiable` | Yes |
| `in` | `__contains__()` | — | No |
| `not in` | `__contains__()` | — | No |

Source: <https://mojolang.org/docs/reference/operators/>.

The direction of `in` is the thing to remember:

> `x in collection` calls `collection.__contains__(x)`. The method is on the
> **container**, not the element. `not in` calls the same method and negates the
> result.

Source: <https://mojolang.org/docs/reference/operators/>.

`is` is identity, not equality, and the standard library implements it sparingly:

> `is` tests object identity, not equality. Stdlib types that implement it
> include `ArcPointer`, `PythonObject`, and `Optional` (for `is None` checks).

Source: <https://mojolang.org/docs/reference/operators/>. `Identifiable`
"requires `__is__()`. `__isnot__()` is provided (calls `not (self is rhs)`)."
Source: <https://mojolang.org/docs/reference/operators/>.

## Subscript operators

| Operation | Method |
|-----------|--------|
| `obj[key]` (read) | `__getitem__()` |
| `obj[key] = val` (write) | `__setitem__()` |

Source: <https://mojolang.org/docs/reference/operators/>. Both "accept variadic
arguments (for multi-dimensional indexing)." Source:
<https://mojolang.org/docs/reference/operators/>.

```mojo
struct MySeq[T: Copyable]:
    def __getitem__(self, idx: Int) -> T:
        ...

    def __setitem__(mut self, idx: Int, value: T):
        ...
```

> For multi-dimensional collections, make use of variadics or multiple index
> arguments:

```mojo
struct Grid[T: Copyable]:
    # Fixed two dimensions
    def __getitem__(self, x: Int, y: Int) -> T:
        ...

    # Arbitrary dimensions
    def __getitem__(self, *indices: Int) -> T:
        ...
```

Source: <https://mojolang.org/docs/manual/structs/operator-support/>.

### Slices

Subscripting with `obj[1:5]` passes a `Slice`. Implement `__getitem__()` with a
`Slice` parameter and normalize it with `indices()`:

> Each `Slice` has three optional fields: `start`, `end`, and `step`. You
> normalize these by calling `indices()`. Pass your type's size. This returns a
> triplet of values representing the span adjusted to your extent, resolving
> omitted values or negative indices into non-negative positions:

```mojo
struct MySeq[T: Copyable]:
    var size: Int

    def __getitem__(self, span: Slice) -> Self:
        var start: Int
        var end: Int
        var step: Int
        start, end, step = span.indices(self.size)
        ...
```

Source: <https://mojolang.org/docs/manual/structs/operator-support/>.

`Slice` itself is a built-in type: "A `Slice` holds `start`, `end`, and `step`,
each an `Optional[Int]`. It's the descriptor that subscript syntax with colons
produces; it carries no data of its own." Source:
<https://mojolang.org/docs/reference/types/>.

### Returning a reference from `__getitem__`

A `ref` return value lets subscripting hand out a mutable reference instead of a
copy. The lifetimes manual gives the standard implementation and notes the
trade-off:

> With a `ref` argument, `__getitem__()` can return a mutable reference that can
> be modified directly. This has pros and cons compared to using a
> `__setitem__()` method:
>
> - The mutable reference is more efficient—a single update isn't broken up
>   across two methods. However, the referenced value must be in memory.
> - A `__getitem__()`/`__setitem__()` pair allows for arbitrary code to be run
>   when values are retrieved and set. For example, `__setitem__()` can validate
>   or constrain input values.

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
```

Source: <https://mojolang.org/docs/manual/values/lifetimes/>. The return type
must carry an origin specifier — for a `ref` return value "you **must** provide
an origin specifier" — and tying it to `self` gives parametric mutability: the
returned reference "will be mutable if the method was called using a mutable
reference." Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

This is the same mechanism that gives `List[int]` its `ref`-returning
`__getitem__`; the *interior origin* rule that invalidates such a reference
after a container mutation is covered in
[Collections](collections.md).

## Boolean conversion: `Boolable`

`Boolable` is not an operator, but it is how a type becomes usable in a boolean
context — `if instance:` and `Bool(instance)`. The walkthrough shows both the
conformance and the method:

```mojo
struct Complex(Boolable, ...):
    ...

    def __bool__(self) -> Bool:
        return self.re != 0.0 or self.im != 0.0

def main():
    print(Bool(Complex(0.0, 0.0)))    # False
    print(Bool(Complex(-1.2, 6.5)))   # True
    if Complex(-1.2, 6.5):
        print("nonzero")
```

Source: <https://mojolang.org/docs/manual/structs/operator-support/> (conformance
list and `__bool__`); the `Bool(x)` expression form is shown by the same
walkthrough. The general truthiness rule is on the operators page: "zero, empty
strings, empty collections, and `None` are falsy. Everything else is truthy."
Source: <https://mojolang.org/docs/manual/operators/>.

## Walkthrough: a `Complex` type

The official walkthrough builds one struct that exercises every category. What
follows is the shape of it; the full runnable code is on the manual page.

### Base type and conformance

```mojo
from std.math import sqrt

@fieldwise_init
struct Complex(
    Boolable,
    Equatable,
    TrivialRegisterPassable,
    Writable,
):
    var re: Float64
    var im: Float64
```

Source: <https://mojolang.org/docs/manual/structs/operator-support/>. The
conformance choices carry two lessons:

- Conforming to `TrivialRegisterPassable` "gives you value semantics without
  needing to write special lifecycle methods."
- "`Equatable` lets you compare two instances, and `Writable` produces output
  for `print()` statements", while `Boolable` "lets you use a `Complex` value in
  a Boolean context".

Source: <https://mojolang.org/docs/manual/structs/operator-support/>.

That first point is the lifecycle note to hold onto: for a simple aggregate, a
marker trait about register passing is enough to get copy and move semantics, so
you do not have to hand-write `__init__(copy:)`, `__init__(move:)` or
`__deinit__`. Source:
<https://mojolang.org/docs/manual/structs/operator-support/>. The traits
themselves are covered on [Traits](traits.md), and the lifecycle dunders on
[Structs](structs.md).

### Convenience initializer and printing

```mojo
    def __init__(out self, re: Float64):
        self.re = re
        self.im = 0.0

    def write_to(self, mut writer: Some[Writer]):
        writer.write("(", self.re)
        if self.im < 0:
            writer.write(" - ", -self.im)
        else:
            writer.write(" + ", self.im)
        writer.write("i)")

    def write_repr_to(self, mut writer: Some[Writer]):
        t"Complex(re = {self.re}, im = {self.im})".write_to(writer)
```

```mojo
def main():
    var c = Complex(3.14, -2.72)
    print(c)          # (3.14 - 2.72i)
    print(repr(c))    # Complex(re = 3.14, im = -2.72)
```

Source: <https://mojolang.org/docs/manual/structs/operator-support/>.

### Unary and binary arithmetic

```mojo
    def __pos__(self) -> Self:
        return self

    def __neg__(self) -> Self:
        return Self(-self.re, -self.im)

    def __add__(self, rhs: Self) -> Self:
        return Self(self.re + rhs.re, self.im + rhs.im)

    def __sub__(self, rhs: Self) -> Self:
        return Self(self.re - rhs.re, self.im - rhs.im)

    def __mul__(self, rhs: Self) -> Self:
        return Self(
            self.re * rhs.re - self.im * rhs.im,
            self.re * rhs.im + self.im * rhs.re,
        )

    def __truediv__(self, rhs: Self) -> Self:
        var denom = rhs.squared_norm()
        return Self(
            (self.re * rhs.re + self.im * rhs.im) / denom,
            (self.im * rhs.re - self.re * rhs.im) / denom,
        )
```

Source: <https://mojolang.org/docs/manual/structs/operator-support/>.

### Reversed methods for mixed types

These are what make `2.5 + c` work:

```mojo
    # Forward: Complex + Float64
    def __add__(self, rhs: Float64) -> Self:
        return Self(self.re + rhs, self.im)

    # Reversed: Float64 + Complex
    def __radd__(self, lhs: Float64) -> Self:
        return Self(self.re + lhs, self.im)
```

```mojo
var c = Complex(-1.2, 6.5)
print(c + 2.5)    # (1.3 + 6.5i)
print(2.5 + c)    # (1.3 + 6.5i) — reversed method
```

Source: <https://mojolang.org/docs/manual/structs/operator-support/>. Without
`__radd__()`, "`2.5 + c` would fail because `Float64` doesn't know about
`Complex`."

### In-place methods

```mojo
    def __iadd__(mut self, rhs: Self):
        self.re += rhs.re
        self.im += rhs.im

    def __iadd__(mut self, rhs: Float64):
        self.re += rhs

    def __imul__(mut self, rhs: Self):
        var new_re = self.re * rhs.re - self.im * rhs.im
        var new_im = self.re * rhs.im + self.im * rhs.re
        self.re = new_re
        self.im = new_im
```

```mojo
var c = Complex(-1.0, -1.0)
c += Complex(0.5, -0.5)
print(c)       # (-0.5 - 1.5i)
c += 2.75      # uses the Float64 overload
print(c)       # (2.25 - 1.5i)
```

Source: <https://mojolang.org/docs/manual/structs/operator-support/>. The
in-place methods take `mut self` and return nothing; "In-place methods modify
`self` directly instead of returning a new value."

### Subscript access

```mojo
    def __getitem__(self, idx: Int) raises -> Float64:
        if idx == 0:
            return self.re
        if idx == 1:
            return self.im
        raise "index out of bounds"

    def __setitem__(mut self, idx: Int, value: Float64) raises:
        if idx == 0:
            self.re = value
        elif idx == 1:
            self.im = value
        else:
            raise "index out of bounds"
```

```mojo
var c = Complex(3.14)
print(c[0], c[1])   # 3.14 0.0
c[1] = 42.0
print(c)            # (3.14 + 42.0i)
```

Source: <https://mojolang.org/docs/manual/structs/operator-support/> (signatures)
and the same page's `__getitem__` note that reads and writes go through the pair.

## Design rules

- **Conform to `Equatable` when equality is fieldwise.** The default does the
  right thing for aggregates; only write `__eq__` when the semantics differ.
- **Conform to `Comparable` only when there is a natural order.** The manual
  says "For types without a natural ordering (like complex numbers), only
  implement `Equatable`, and not `Comparable`."
- **Implement reversed methods for every mixed-type operation you want to
  support.** A forward method alone supports only `YourType op Other`.
- **Implement in-place methods explicitly if `+=` should be efficient or even
  exist.** They do not derive from the forward method.
- **Prefer traits for operator categories** (`Equatable`, `Comparable`,
  `Boolable`, `Writable`) so generic code bounded on the trait can use your
  type.
- **Keep `__repr__`-style output (`write_repr_to`) constructible-looking.** The
  walkthrough's `write_repr_to` "produces a string that mirrors how you'd
  construct the value in code".

Sources: <https://mojolang.org/docs/manual/structs/operator-support/> and
<https://mojolang.org/docs/reference/operators/>.

## Pitfalls

- **Expecting `+=` to work because `+` works.** In-place methods are separate
  and must be implemented explicitly. Verified above.
- **Forgetting reversed methods.** `5 + a` fails even when `a + 5` works,
  because `Int` does not know your type. Verified above.
- **Assuming `^` always means XOR.** `a ^ b` is XOR; `a^` is transfer, and the
  transfer form is compiler-only. `x^+1` parses as XOR with `+1`. Sources:
  <https://mojolang.org/docs/reference/operators/> and
  <https://mojolang.org/docs/manual/operators/>.
- **Putting `__contains__` on the element.** Membership is `collection.__contains__(element)`.
  Verified above.
- **Writing all six comparisons by hand.** `Comparable` derives four of them
  from `__lt__`, and `Equatable` derives `__ne__` from `__eq__`. Verified above.
- **Conforming to `Comparable` for a type with no natural order.** Use
  `Equatable` alone. Verified above.
- **Returning a copy where a `ref` is intended.** A `ref` return needs an origin
  specifier, and the referenced value must live in memory. Verified above.
- **Using a `Slice` without normalizing it.** Call `indices(self.size)` to
  resolve omitted and negative values before indexing. Verified above.
- **Assuming the reflection-based `__eq__` gives float-exact semantics.** It
  compares fields; a field that is `NaN` never equals itself. Verified above.
- **Implementing `__bool__` without conforming to `Boolable`.** The method is
  what the trait requires; declare the conformance so generic `Boolable` code
  accepts your type. Verified above.
- **Hand-writing lifecycle dunders for a simple aggregate.** A marker trait such
  as `TrivialRegisterPassable` (or the `Copyable`/`Movable` traits) gives value
  semantics without them. Verified above.

## Sources

- Add operator support to custom types (manual): <https://mojolang.org/docs/manual/structs/operator-support/>
- Mojo operator reference: <https://mojolang.org/docs/reference/operators/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Lifetimes, origins, and references (manual): <https://mojolang.org/docs/manual/values/lifetimes/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
