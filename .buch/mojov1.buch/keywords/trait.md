# trait

`trait` declares a contract: a set of methods, associated types, and compile-time
values that a conforming type must satisfy. Traits are Mojo's route to
polymorphism, and the compiler verifies every requirement at the point of
conformance.

## Purpose

The official keywords reference defines `trait` in one line:

> `trait` — Trait declaration

Source: <https://mojolang.org/docs/reference/keywords/>.

> A *trait* defines requirements that a conforming type must satisfy, including
> methods, associated types, and constants. Traits are similar to *protocols* in
> Swift, *interfaces* in Java, and *traits* in Rust. When a type conforms to a
> trait, the compiler checks every requirement and rejects the code if anything
> is missing.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

```mojo
trait DeflectionSensing:
    def fetch_reading(self) -> Float64:
        ...
```

Source: <https://mojolang.org/docs/manual/traits/>.

## Syntax

```text
trait Name:
    body

trait Name(ParentA, ParentB):
    body
```

> Traits must be declared at the top level of a file. They can't be nested inside
> structs, other traits, or functions.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

```mojo
struct Outer:
    trait Inner:  # Error: nested trait not supported here
        ...
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

By convention trait names are `PascalCase` and describe a capability:
`Writable`, `Hashable`, `Copyable`. Source:
<https://mojolang.org/docs/reference/trait-declarations/>.

## Trait body elements

| Element | Syntax | Role |
|---------|--------|------|
| Required method | `...` body | Conforming types must implement |
| Provided method | Code body | Inherited unless overridden |
| Comptime member — associated type | `comptime Name: Trait` | Conforming types provide a concrete type |
| Comptime member — required value | `comptime name: Type` | Conforming types provide a value |
| Comptime member — constant | `comptime name = value` | Shared across all conforming types |

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Required versus provided methods: `...` versus `pass`

An ellipsis marks a method as required; a code body makes it provided:

```mojo
trait RequiredMethods:
    def required_method(self):
        ...
```

```mojo
trait ProvidedMethods:
    def provided_method(self):
        print("Provided method")
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

The distinction is not cosmetic:

> `pass` and `...` mean distinct things in trait bodies:
>
> - `...` marks a required method stub.
> - `pass` is a no-op that counts as a provided implementation body. It's only
>   valid when the method returns `None`.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

And the compiler rejects the mismatch:

```mojo
trait Unsupported:
    def __compute__(self) -> Int:
        pass
    # Error because trait method with a return type must not use 'pass'.
    # Use '...' to declare the method as required.
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Conformance

A struct conforms by listing the trait in parentheses and implementing its
requirements:

```mojo
@fieldwise_init
struct CapacitiveSensor(Copyable, DeflectionSensing):
    def fetch_reading(self) -> Float64:
        return Float64(21.5)
```

> If a struct claims to conform to `DeflectionSensing` but doesn't implement
> `fetch_reading()`, it won't compile.

Source: <https://mojolang.org/docs/manual/traits/>.

Conformance is explicit — there is no duck typing:

> Traits don't use duck typing. A struct that implements `fetch_reading()` but
> doesn't declare `DeflectionSensing` isn't a conforming type.

Source: <https://mojolang.org/docs/manual/traits/>.

And it is "all or nothing": "A conforming type must satisfy every requirement,
either by implementing it directly or by inheriting a default implementation.
There's no partial conformance." Source:
<https://mojolang.org/docs/manual/traits/>.

## Refinement

A trait can refine another, inheriting all its requirements:

```mojo
trait CalibratableDeflectionSensing(DeflectionSensing):
    def calibrate(mut self):
        ...
```

> A trait can refine another trait, meaning that it inherits every requirement
> from the refined trait while adding new ones.

Source: <https://mojolang.org/docs/manual/traits/>.

"Every trait implicitly refines `AnyType`." Source:
<https://mojolang.org/docs/reference/trait-declarations/>.

## Composition

Multiple traits are combined with `&` in a constraint:

```mojo
trait Loggable:
    def log(self, message: String):
        ...

def poll_and_log[T: DeflectionSensing & Loggable](sensor: T):
    print(sensor.fetch_reading())
    sensor.log("Polling sensor")
```

> Use an ampersand (`&`) to combine them. Any type passed to the parameter must
> conform to every trait in the combination.

Source: <https://mojolang.org/docs/manual/traits/>.

A composition can be named with `comptime`:

```mojo
comptime SensorLike = DeflectionSensing & Loggable
```

> `SensorLike` isn't a new trait. It's shorthand for
> `DeflectionSensing & Loggable`.

Source: <https://mojolang.org/docs/manual/traits/>.

## Associated types

An associated type is a `comptime` member declared without an initializer:

```mojo
trait Boxable:
    comptime Associated: Writable & Copyable & Deinitable

    def unbox(self) -> Self.Associated:
        ...
```

> The associated type is declared as a `comptime` member without an initializer.
> Only traits can use this declaration form.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

The conforming type supplies the concrete value: `comptime Associated = String`.
Source: <https://mojolang.org/docs/reference/trait-declarations/>.

Inside a trait, `Self` refers to the conforming type: "`Self` refers to the
conforming type, so `Self.Associated` refers to the conforming type's value for
the associated type". Source:
<https://mojolang.org/docs/reference/trait-declarations/>.

Outside a trait, a `comptime` member without an initializer is an error:

```mojo
struct Unsupported:
    comptime X: Int
    # Error: only traits may contain a comptime member
    # without an initializer
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Marker traits

An empty trait is a marker:

```mojo
trait AnyType:
    pass
```

> Empty traits are called *marker traits* and signal that a type has a specific
> property or capability without refining other traits or declaring
> requirements.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Restrictions

> - Traits don't support parameter lists: `trait Unsupported[T]:` is an error.
> - Traits can't declare or use fields: `var x: Int` is an error.
> - Traits don't support `where` clauses on methods.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

Also: "You can't add traits to existing types." Source:
<https://mojolang.org/docs/manual/traits/>.

## `Some[]` shorthand

`Some[Trait]` moves a constraint onto an argument instead of declaring a
parameter:

> `Some[Trait(s)]` is shorthand for a type parameter constrained to that trait
> or composition. It's syntax sugar, not a new mechanism.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

```mojo
def averaged_poll_2(sensor: Some[DeflectionSensing], samples: Int) -> Float64:
    ...
```

Source: <https://mojolang.org/docs/manual/traits/>.

## Default implementations and conflicts

A provided method is a default that conforming types may override:

```mojo
trait DefaultLoggable:
    def log(self, message: String):
        print("reading logged")

@fieldwise_init
struct BasicSensor(Copyable, DefaultLoggable):
    pass
```

> Default implementations can conflict. If a type conforms to two traits that
> both provide the same method, Mojo won't choose between them.

```mojo
trait PowerCycle:
    def restart(self):
        print("Restarting via power cycle")

trait Rebootable:
    def restart(self):
        print("Restarting via soft reboot")

struct Gateway(PowerCycle, Rebootable):
    pass
    # Error: conflicting default implementations for restart().
```

Source: <https://mojolang.org/docs/manual/traits/>.

Resolving the conflict means implementing the method on the conforming type.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `struct` | Declares conformance in its parentheses and supplies the implementations. |
| `comptime` | Declares associated types, required values, and shared constants in a trait. |
| `Self` | Refers to the conforming type inside the trait. |
| `pass` | An empty marker-trait body, or a provided no-op method. |
| `where` | Constrains trait-conformance conditions; not allowed on trait methods. |
| `def` | Declares trait methods; `...` vs. a body marks required vs. provided. |

## Signature vs. body

`trait` is a top-level declaration. Its **requirements** (method signatures,
associated types, constants) are signature-level, and the compiler checks them at
each conformance. **Provided methods** carry bodies and are inherited. A struct's
conformance list and any `where` clause live in that struct's signature.

## Pitfalls

- **Using `pass` where `...` is meant.** `pass` makes a method provided, so
  conforming types silently inherit a no-op instead of being forced to implement
  it. Source: <https://mojolang.org/docs/reference/trait-declarations/>.
- **A provided method with a return type and a `pass` body.** Rejected; use `...`
  to mark it required. Source:
  <https://mojolang.org/docs/reference/trait-declarations/>.
- **Nesting.** Traits are top-level only.
- **Trait fields.** Traits cannot declare `var` fields; use an associated type or
  required methods. Source:
  <https://mojolang.org/docs/reference/trait-declarations/>.
- **Trait parameters.** `trait Name[T]:` is rejected.
- **`where` on a trait method.** Rejected: "'where' clauses on trait methods are
  not supported." Source:
  <https://mojolang.org/docs/reference/trait-declarations/>.
- **Expecting duck typing.** Declared conformance is required; matching method
  names are not enough. Source: <https://mojolang.org/docs/manual/traits/>.
- **Conflicting defaults.** Two traits providing the same method force the
  conforming type to implement it.
- **Calling a default from an override.** "Mojo doesn't provide a way to call a
  default implementation from an override." Source:
  <https://mojolang.org/docs/manual/traits/>.
- **Underscore-prefixed trait members.** The reference warns that private-looking
  names may hide required members from generated documentation. Source:
  <https://mojolang.org/docs/reference/trait-declarations/>.
- **`comptime` without a value in a struct.** Only traits may omit the
  initializer for a `comptime` member. Source:
  <https://mojolang.org/docs/reference/trait-declarations/>.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`struct`](struct.md), [`Self`](self.md), [`comptime`](comptime.md),
[`pass`](pass.md),
[`trait-declarations`](../reference/trait-declarations.md),
[`traits`](../types/traits.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo trait declarations reference:
  <https://mojolang.org/docs/reference/trait-declarations/>
- Traits (manual): <https://mojolang.org/docs/manual/traits/>
