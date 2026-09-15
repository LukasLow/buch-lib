# Types: the Mojo type system at a glance

Every value in Mojo has a type, and the type is known at compile time. This
page is the map of the type system: what a type *is* in Mojo, how the standard
types are built, the value-semantics and lifecycle traits that every type gets
(or must ask for), and which pages in this chapter go deeper. The concrete
types themselves are covered by the sibling pages
[Integers and floats](integers-and-floats.md),
[Bool and strings](bool-and-strings.md),
[Collections](collections.md),
[Pointers and references](pointers-and-references.md) and
[Optionals and nullability](optionals-and-nullability.md).

## Mojo is statically typed

The official statement is one sentence:

> Mojo is statically typed. Every value has a type that is known at compile
> time.

Source: <https://mojolang.org/docs/reference/types/>.

The compiler uses the type to choose storage layout, select overloads and
generate specialized machine code. A variable's type is fixed at its
declaration and never changes at runtime; see
[Variables and mutability](../basics/variables-and-mutability.md).

```mojo
def main():
    var x = 10       # x is Int
    x = "Foo"        # Error: cannot implicitly convert
                     # 'StringLiteral["Foo"]' value to 'Int'
```

There is no dynamic type dispatch for ordinary values. Everything the compiler
needs to know is available before the program runs.

## Nominal types

Most Mojo types are *nominal* — defined by a `struct`, and equal to another
type only when their *names* match, not their shape:

> Most of the types are *nominal* types, defined by a
> [`struct`](/docs/manual/structs/). These types are nominal (or "named")
> because type equality is determined by the type's *name*, not its
> *structure*.

Source: <https://mojolang.org/docs/manual/types/>.

Two structs with identical fields are still two different types. There are a
few types that are not structs at all:

> - Functions are typed based on their signatures.
> - `NoneType` is a type with one instance, the `None` object, which is used to
>   signal "no value."

Source: <https://mojolang.org/docs/manual/types/>.

The types reference adds two more compiler-defined cases: `Never`, the type of
an expression that never produces a value (it is `!kgen.never`, not a struct),
and the origin types that parameterize pointers and views.
Source: <https://mojolang.org/docs/reference/types/>.

## Standard types are ordinary structs

Nothing about `Int`, `String` or `List` is built into the grammar. The manual
is explicit:

> These standard types aren't privileged. Each of the standard library types is
> defined just like user-defined types—even basic types like `Int` and
> `String`. But these standard library types are the building blocks you'll use
> for most Mojo programs.

Source: <https://mojolang.org/docs/manual/types/>.

That is the design goal in practice: a type you write in your own file can have
exactly the same capabilities as a type from the standard library. The
practical consequence here is that every technique in
[Structs](structs.md) and [Traits](traits.md) applies to built-in types too —
you can add methods to your own types, conform to the same traits, and overload
the same operators.

```mojo
struct Meters:
    var value: Float64

    def __init__(out self, value: Float64):
        self.value = value

    def __add__(self, other: Self) -> Self:
        return Self(self.value + other.value)

def main():
    var a = Meters(1.5)
    var b = Meters(2.0)
    print((a + b).value)   # 3.5
```

## Built-in types and the prelude

Some types are available in every program without an import. They come from the
*prelude*, which the compiler imports into every module:

> Built-in types come from the standard library *prelude*, which the compiler
> imports into every program. The prelude consists of the `builtin` package
> (`Int`, `Bool`, `Error`, and core traits) plus selected types from
> `collections`, `memory`, and `math`.

Source: <https://mojolang.org/docs/reference/types/>.

The prelude and compiler *syntax* are separate concerns, and the difference
shows up immediately with sets:

> Some language constructs have *syntax* without a corresponding name in scope.
> For example, a set *display* doesn't require an import but the `Set` type
> does.

```mojo
var primes = {2, 3, 5, 7}   # set display: compiler syntax, no import

from std.collections import Set
var empty = Set[Int]()      # the name Set must be imported
```

Source: <https://mojolang.org/docs/reference/types/>.

`Set` and `Variant` are the two collection types that are **not** in the
prelude: import `Set` from `std.collections` and `Variant` from `std.utils`.
Source: <https://mojolang.org/docs/reference/types/> and
<https://mojolang.org/releases/v1.0.0/>.

### The built-in families

| Family | Types available without import | Covered by |
|--------|-------------------------------|------------|
| Numeric | `Int`, `Int8`–`Int256`, `UInt8`–`UInt256`, `UInt`, `Byte`, `Float16`, `Float32`, `Float64`, `BFloat16`, `Float8_*`, `SIMD`, `DType`, `Scalar`, `IntLiteral`, `FloatLiteral` | [Integers and floats](integers-and-floats.md) |
| Text | `String`, `StringSpan`, `StaticString`, `StringLiteral`, `Codepoint` | [Bool and strings](bool-and-strings.md) |
| Collection | `List`, `Dict`, `Optional`, `Tuple`, `Array` | [Collections](collections.md), [Optionals and nullability](optionals-and-nullability.md) |
| Collection (import) | `Set`, `Variant` | [Collections](collections.md) |
| Memory | `Pointer`, `Span`, `AddressSpace`, `Allocation` | [Pointers and references](pointers-and-references.md) |
| Other | `Bool`, `Error`, `Never`, `NoneType`, `Slice` | [Bool and strings](bool-and-strings.md), [Optionals and nullability](optionals-and-nullability.md) |

Sources: <https://mojolang.org/docs/reference/types/> and
<https://mojolang.org/docs/reference/numeric-types/>.

## Value semantics

A `struct` is a value type. The struct-declarations reference states the rule
directly: "Structs are value types: each variable holds its own independent
copy rather than a reference to shared data." Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

That single sentence explains most of the differences from Python:

```mojo
var first = [1, 2, 3]
var second = first.copy()   # explicit copy: an independent List
second.append(4)
print(first)    # [1, 2, 3]
print(second)   # [1, 2, 3, 4]
```

Assignment does not alias; it copies or transfers. The Python-looking
`b = a` that shares a list becomes an explicit `ref b = a` in Mojo. Sources:
<https://mojolang.org/docs/manual/types/> and
<https://mojolang.org/docs/manual/variables/>. See
[Value semantics](../memory/value-semantics.md) and
[Ownership and lifetimes](../memory/ownership-and-lifetimes.md) for the details.

> **Open question:** the 1.x documentation teaches value semantics and
> explicit copy, but does not give a single normative sentence that *all*
> structs are value types without exception. The struct-declarations and
> structs-manual pages both state it for structs; register-passable and
> explicitly-destroyed types add lifecycle qualifications. Verify against the
> next upstream release before asserting an exception-free rule.

## Lifecycle traits: what you get and what you must ask for

A struct's lifecycle behavior is governed by traits rather than by syntax. The
relevant ones are `Deinitable`, `Movable`, `Copyable` and `ImplicitlyCopyable`.

### `Deinitable` is automatic

The struct-declarations reference states the implicit conformance:

> The compiler automatically conforms every struct to `AnyType` and
> `Deinitable` when all members are also `Deinitable`.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

So a plain struct over deinitable fields is destroyed automatically at its last
use, with a synthesized no-op destructor unless you write `__deinit__()`.
Source: <https://mojolang.org/docs/manual/lifecycle/death/>. If a member is not
`Deinitable`, the compiler cannot verify safe destruction and reports the value
as "abandoned without being destroyed" unless you make the type explicitly
destroyed. Source: <https://mojolang.org/docs/reference/struct-declarations/>.

### `Movable` is on by default

In 1.0, struct types are `Movable` by default:

> Struct types are now `Movable` by default. To opt out of always-on
> movability, either explicitly specify a conditionally `Movable` conformance
> using `Movable where <cond>`, or opt out of `Movable` conformance entirely
> using `Movable where False`.

Source: <https://mojolang.org/releases/v1.0.0/>.

The move constructor is synthesized: "If a struct conforms to `Movable` but
doesn't define `__init__(move:)`, the compiler synthesizes one that moves each
field." Source: <https://mojolang.org/docs/reference/struct-declarations/>.

### `Copyable` and `ImplicitlyCopyable` are opt-in

Mojo structs are **not** copyable by default. The manual's example produces
three errors, and the third names the mechanism:

> `var d = a^  # value of type 'MyPair' cannot be copied or moved; consider
> conforming it to 'Copyable', which also adds 'Movable' conformance.`

Source: <https://mojolang.org/docs/manual/structs/>.

Adding `Copyable` makes a struct explicitly copyable and also movable:

> The `Copyable` trait provides two ways to copy a value: the `copy()` instance
> method and the copy initializer. In addition, `Copyable` automatically adds
> movability, so you won't need to add both `Copyable` _and_ `Movable` to your
> declarations.

Source: <https://mojolang.org/docs/manual/structs/>.

`ImplicitlyCopyable` is the strongest opt-in — it permits `var b = a` with no
`.copy()`:

> A type should only be implicitly copyable if copying the type is inexpensive
> and has no side effects. Unnecessary copies can be a big drain on memory and
> performance, so use this trait with caution.

Source: <https://mojolang.org/docs/manual/structs/>.

This split is a 1.0 default flip: before it, `Copyable` meant "implicitly
copyable". In 1.x, `List`, `Dict`, `Set` and `Array` are explicitly copyable
only; `Int`, `Float64` and `Bool` are the typical `ImplicitlyCopyable` value
types. Sources: <https://mojolang.org/releases/v1.0.0/> and
<https://mojolang.org/docs/manual/variables/>.

```mojo
@fieldwise_init
struct Point(ImplicitlyCopyable):
    var x: Float64
    var y: Float64

def main():
    var a = Point(1.0, 2.0)
    var b = a          # OK: implicitly copyable
    b.x = 9.0
    print(a.x, b.x)    # 1.0 9.0 — independent values
```

> **Open question:** the exact set of standard-library types that conform to
> `ImplicitlyCopyable` in the current 1.x release is only partly stated. The
> release notes name `Error` and describe the general rule
> ("simple value types"), and the API reference lists the implemented traits per
> type. Read the trait list on the type's own API page rather than assuming.
> Source: <https://mojolang.org/releases/v1.0.0/>.

## Traits are the polymorphism mechanism

Mojo structs do not support inheritance. They conform to **traits** instead:

> - Mojo structs are static: they are bound at compile-time (you cannot add
>   methods at runtime).
> - Mojo structs do not support inheritance ("sub-classing"), but a struct can
>   implement [traits](/docs/manual/traits/).

Source: <https://mojolang.org/docs/manual/structs/>.

A trait is a named contract of methods, associated types and compile-time
values. The compiler verifies conformance at the point where the struct is
defined, and there is no runtime lookup: a parameterized function bounded on
`T: SomeTrait` is specialized for each concrete type. Source:
<https://mojolang.org/docs/manual/traits/>.

The three facts to hold onto, all from the traits manual:

- **Conformance is explicit.** "A struct that implements `fetch_reading()` but
  doesn't declare `DeflectionSensing` isn't a conforming type."
- **All or nothing.** "A conforming type must satisfy every requirement, either
  by implementing it directly or by inheriting a default implementation."
- **You cannot add traits to existing types.** "Conformance is declared where a
  type is defined."

Source: <https://mojolang.org/docs/manual/traits/>. Full coverage is on
[Traits](traits.md).

## What this chapter covers

| Page | Topic |
|------|-------|
| [Integers and floats](integers-and-floats.md) | `SIMD`, `DType`, `Scalar`, `Int`, `UInt`, sized integers, `Byte`, floating-point types, numeric literals and conversions |
| [Bool and strings](bool-and-strings.md) | `Bool`, `String`, `StringSpan`, `StaticString`, `Codepoint`, grapheme-cluster iteration |
| [Structs](structs.md) | `struct` declarations, fields, methods, `__init__`, `__deinit__`, conditional conformance |
| [Traits](traits.md) | Trait declarations, conformance, provided methods, associated types, refinement, `conforms_to` |
| [Collections](collections.md) | `Array`, `List`, `Dict`, `Set`, `Tuple`, `Span` and how to choose |
| [Pointers and references](pointers-and-references.md) | The unified `Pointer`, `unsafe_*` operations, references and origins |
| [Optionals and nullability](optionals-and-nullability.md) | `Optional`, `None`, `Optional` as `Iterable`, unwrapping idioms |
| [Operator support](operator-support.md) | Implementing dunder methods so custom types work with operators |
| [Self-referential structs](self-referential-structs.md) | Why a struct cannot contain itself, and how pointers build linked lists and trees |

## Pitfalls

- **Assuming standard types are special.** `Int` and `List` are structs like
  yours; they are not compiler primitives. Expect the same rules (nominal
  typing, explicit conformance, no inheritance). Verified above.
- **Assuming a struct is copyable.** Structs are `Movable` by default but
  **not** copyable. `var b = a` fails unless the type is `ImplicitlyCopyable`;
  write `.copy()` or transfer with `^`. Verified above.
- **Assuming assignment shares state.** Value semantics means a copy or a
  transfer, never an alias. Use `ref` when you want a shared reference.
  Verified above.
- **Using an unimported collection name.** A `{...}` set display works without
  an import, but the type `Set` does not — import it from `std.collections`.
  Verified above.
- **Expecting inheritance.** Structs cannot extend other structs. Factor shared
  behavior into a trait and conform to it. Verified above.
- **Expecting `Movable where False` to behave like an old opt-out keyword.**
  Conditional and opt-out movability are written as `where` clauses on the
  conformance, not as decorators. Source:
  <https://mojolang.org/releases/v1.0.0/>.

## Sources

- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Types (manual): <https://mojolang.org/docs/manual/types/>
- Mojo structs (manual): <https://mojolang.org/docs/manual/structs/>
- Mojo struct declarations reference: <https://mojolang.org/docs/reference/struct-declarations/>
- Mojo trait declarations reference: <https://mojolang.org/docs/reference/trait-declarations/>
- Traits (manual): <https://mojolang.org/docs/manual/traits/>
- Mojo numeric types reference: <https://mojolang.org/docs/reference/numeric-types/>
- Value destruction (manual): <https://mojolang.org/docs/manual/lifecycle/death/>
- Variables (manual): <https://mojolang.org/docs/manual/variables/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
