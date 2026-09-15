# Traits

A trait is a named contract: methods, associated types and compile-time values
that a conforming type must provide. Traits are how Mojo does polymorphism —
instead of inheritance, a type declares the traits it conforms to, the compiler
verifies every requirement at the point of definition, and generic code is
specialized at compile time with no runtime lookup. This page covers declaring
traits, the contract elements, conformance, parameterizing with traits,
refinement and composition, `where` constraints, and the core traits you meet
everywhere.

## What a trait is

> Traits define contracts between types and the code that use them. Those
> contracts describe behavior, such as the methods a type must provide, as
> well as related (*associated*) types and constants. When a type conforms
> to a trait, the compiler verifies that it satisfies every requirement,
> allowing code to *rely* on the trait's interface.

Source: <https://mojolang.org/docs/manual/traits/>.

The reference puts them in context with other languages:

> A *trait* defines requirements that a conforming type must satisfy,
> including methods, associated types, and constants. Traits are similar to
> *protocols* in Swift, *interfaces* in Java, and *traits* in Rust.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

Trait names use `PascalCase` and describe a capability:
"Capabilities gained by conformance: `Equatable`, `Copyable`, `PathLike`."
Source: <https://mojolang.org/docs/reference/trait-declarations/>.

### Why Mojo has them

The manual's motivation is code reuse without runtime cost:

> Traits are Mojo's pathway to polymorphism. They let you write code that works
> across many types without depending on implementation details that fall
> outside the contract. ... Mojo verifies that every required method,
> associated type, and compile-time value is present, so your code can use them
> without runtime overhead or capability checks.

Source: <https://mojolang.org/docs/manual/traits/>.

That "without runtime overhead" is the point: a function bounded on a trait is
compiled separately for each concrete conforming type. There is no vtable and no
capability check.

## Declaring a trait

```text
trait Name:
    body

trait Name(ParentA, ParentB):
    body
```

> Traits are declared with the `trait` keyword followed by the trait name and
> an optional refinement list. The body contains the trait's requirements,
> both required and provided:

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

Traits must be at the top level of a file — they cannot be nested:

```mojo
struct Outer:
    trait Inner:   # Error: nested trait not supported here
        ...
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

A minimal trait names one required method. The three dots mark it as required:

```mojo
trait DeflectionSensing:
    def fetch_reading(self) -> Float64:
        ...
```

Source: <https://mojolang.org/docs/manual/traits/>.

### Marker traits

> Empty traits are called *marker traits* and signal that a type has a
> specific property or capability without refining other traits or declaring
> requirements:
>
> ```mojo
> trait AnyType:
>     pass
> ```

Source: <https://mojolang.org/docs/reference/trait-declarations/>. The reference
names the built-in marker traits: "`AnyType`, `TrivialRegisterPassable`,
`RegisterPassable`, and `ImplicitlyCopyable`. They tell the compiler about a
type's properties, supporting compile-time optimizations."

## The contract elements

A trait body may contain five kinds of element:

| Element | Syntax | Role |
|---------|--------|------|
| Required method | `...` body | Conforming types must implement |
| Provided method | Code body | Inherited unless overridden |
| Comptime member — associated type | `comptime Name: Trait` | Conforming types provide a concrete type |
| Comptime member — required value | `comptime name: Type` | Conforming types provide a value |
| Comptime member — constant | `comptime name = value` | Shared across all conforming types |

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

The manual groups these into "methods and three kinds of compile-time members:
associated types, required compile-time values, and shared compile-time
constants." Source: <https://mojolang.org/docs/manual/traits/>.

### Required methods

> *Required methods* use the `...` ellipsis in their body. Every conforming
> type must implement them.

```mojo
trait Loggable:
    def log(self, message: String):
        ...
```

Source: <https://mojolang.org/docs/manual/traits/>. The reference adds that
static required methods use the same marker:

```mojo
trait RequiredMethods:
    def required_method(self):
        ...

    @staticmethod
    def required_static_method():
        ...
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

### Provided methods

> *Provided methods* are implemented in the trait. Conforming types can
> override them. Even a default no-op implementation is a valid provided
> method.

```mojo
trait Pausable:
    def pause(self):
        pass
```

Source: <https://mojolang.org/docs/manual/traits/>. A provided method may
return a value:

```mojo
trait Describable:
    def provided_describe(self) -> String:
        return "no description"

    def required_describe(self) -> String:
        ...
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>. The crucial
constraint on a default body:

> Provided behavior can't use implementation details from any specific
> conforming type, as a trait has no knowledge of a type's capabilities
> beyond those declared in the trait and refinement list. The behavior
> must work across all conforming types.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

### `pass` versus `...`

These look similar but mean different things:

> - `...` marks a required method stub.
> - `pass` is a no-op that counts as a provided implementation body. It's only
>   valid when the method returns `None`.

Source: <https://mojolang.org/docs/reference/trait-declarations/>. Using `pass`
on a method that declares a return type is an error:

```mojo
trait Unsupported:
    def __compute__(self) -> Int:
        pass
    # Error because trait method with a return type must not use 'pass'.
    # Use '...' to declare the method as required.
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

### Associated types

An associated type declares a subordinate type that each conforming type must
specify — the canonical use is a collection's `Element`:

> *Associated types* require conforming types to declare a subordinate
> type. They're most commonly used in collections, where a parameterized
> collection declares an element type.

```mojo
trait Container:
    associatedtype Element: Movable
```

Source: <https://mojolang.org/docs/manual/traits/>.

The reference gives the mechanism and an example where the conforming type
provides the associated type as a `comptime`:

> The associated type is declared as a `comptime` member without an
> initializer. Only traits can use this declaration form. Conforming structs
> provide the concrete value that satisfies any constraints declared in the
> trait.

```mojo
trait Boxable:
    comptime Associated: Writable & Copyable & Deinitable

    def unbox(self) -> Self.Associated:
        ...

@fieldwise_init
struct ConcreteBox(Boxable):
    comptime Associated = String
    var value: Self.Associated

    def unbox(self) -> Self.Associated:
        return self.value.copy()

def main():
    var box = ConcreteBox(value="Hello")
    var unboxed = box.unbox()   # known to be Copyable
    print(unboxed)              # known to be Writable
    _ = unboxed^                # known to be Deinitable
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>. The
conformance constraints propagate: because the trait declares
`comptime Associated: Writable & Copyable & Deinitable`, code that receives a
`Self.Associated` may use all three capabilities without repeating them.

Associated types can also be assigned from a type parameter, "which lets a trait
work across type families":

```mojo
comptime Base = Copyable & Deinitable & Writable

@fieldwise_init
struct Box[T: Base](Boxable):
    comptime Associated = Self.T
    var value: Self.Associated

    def unbox(self) -> Self.Associated:
        return self.value.copy()
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

> **Open question:** the manual traits page uses the dedicated keyword
> `associatedtype Element: Movable`, while the trait-declarations reference
> describes the same concept as a `comptime` without an initializer
> (`comptime Associated: Writable & Copyable & Deinitable`) and states that
> "only traits may contain a comptime member without an initializer". The
> reference's own example error messages use the `comptime` spelling, and the
> reference's summary table lists only `comptime Name: Trait`. The manual may be
> ahead of or behind the reference. The `comptime` form is the one the detailed
> reference documents; verify `associatedtype` against the compiler before
> relying on it. Sources: <https://mojolang.org/docs/manual/traits/> and
> <https://mojolang.org/docs/reference/trait-declarations/>.

### Required values and shared constants

> - *Required compile-time values* must be defined by every conforming type.
>   They're often used for values that vary across implementations.
>
> - *Shared compile-time constants* are defined by the trait and shared by
>   every conforming type.

```mojo
trait Pausable:
    comptime max_pause_seconds: Float64     # required value

trait DeflectionSensing:
    comptime absolute_tolerance: Float64 = 0.05   # shared constant
```

Source: <https://mojolang.org/docs/manual/traits/>.

A conforming type supplies a required value with `comptime name = value`:

```mojo
@fieldwise_init
struct Timer(Copyable, Pausable):
    comptime max_pause_seconds: Float64 = 30.0

    def pause(self):
        print("Paused")
```

Source: <https://mojolang.org/docs/manual/traits/>.

The reference's fuller example shows a required value and a constant computed
from an associated type:

```mojo
from std.sys.info import bit_width_of

comptime BaseElement = Copyable & Deinitable & Writable

trait Test:
    comptime Element: RegisterPassable
    comptime element_bitwidth = bit_width_of[Self.Element]()

@fieldwise_init
struct SampleStruct[T: BaseElement](Test):
    comptime Element = Int64
    var x: Self.T

    def show_element_bitwidth(self):
        print(Self.element_bitwidth)

def main():
    var s = SampleStruct[Int64](x=42)
    s.show_element_bitwidth()   # 64
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>. Note the
style guidance attached to it:

> Don't use traits to define general-purpose constants like `PI` or
> `SPEED_OF_LIGHT`. Define them at the top level of a module for local use,
> or as a public member of a related struct for broader use.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

A required value used in a default body is accessed through `Self`:

```mojo
trait DeflectionSensing:
    def fetch_reading(self) -> Float64:
        ...

    comptime absolute_tolerance: Float64 = 0.05

    def within_tolerance(self) -> Bool:
        return abs(self.fetch_reading()) <= Self.absolute_tolerance
```

Source: <https://mojolang.org/docs/manual/traits/>.

## Conforming to a trait

> A struct conforms to a trait by listing it in parentheses after the
> struct name and implementing its required methods:

```mojo
@fieldwise_init
struct CapacitiveSensor(Copyable, DeflectionSensing):
    def fetch_reading(self) -> Float64:
        return Float64(21.5)
```

Source: <https://mojolang.org/docs/manual/traits/>. If a required method is
missing, the code does not compile:

> If a struct claims to conform to `DeflectionSensing` but doesn't implement
> `fetch_reading()`, it won't compile. At compile time, Mojo verifies that
> `CapacitiveSensor` satisfies every `DeflectionSensing` requirement,
> including its methods and comptime elements.

Source: <https://mojolang.org/docs/manual/traits/>.

The reference shows the same check with its diagnostic:

```mojo
trait Sized:
    def __len__(self) -> Int: ...

@fieldwise_init
struct SizedStruct[T: Copyable](Sized):
    var backing_store: List[Self.T]

# Error about missing a trait's required function '__len__'.
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

### No duck typing

> Traits don't use duck typing. A struct that implements `fetch_reading()`
> but doesn't declare `DeflectionSensing` isn't a conforming type.

Source: <https://mojolang.org/docs/manual/traits/>. And from the "Things to
know" section:

> **Conformance is explicit.** A struct that happens to implement
> `fetch_reading()` doesn't conform to `DeflectionSensing` unless it
> declares the trait. Mojo checks declared conformance, not just matching
> method names.
>
> **Traits are all or nothing.** A conforming type must satisfy every
> requirement, either by implementing it directly or by inheriting a
> default implementation. There's no partial conformance.
>
> **You can't add traits to existing types.** Conformance is declared where
> a type is defined. You can't retroactively make `Float64`, `Int`, or any
> other type you don't own conform to a new trait.

Source: <https://mojolang.org/docs/manual/traits/>.

That last point matters in practice: if you need `Float64` to satisfy your
trait, you cannot conform it yourself. Either constrain on an existing trait,
or define a newtype struct that wraps the value and conforms.

### Conformance lists and conditional conformance

A conformance list accepts both plain traits and `where`-qualified ones, and
multiple traits may be listed with commas or composed with `&`:

```mojo
@fieldwise_init
struct Pair[T: Copyable & Deinitable](
    Equatable where conforms_to(T, Equatable),
    Writable where conforms_to(T, Writable),
    Copyable
):
    var first: Self.T
    var second: Self.T
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.
[Structs](structs.md) covers conditional conformance in full.

### Conflicting defaults

If two traits provide the same method, a conforming type must implement it:

```mojo
trait Greeter:
    def greet(self):
        print("Hello from Greeter")

trait Welcomer:
    def greet(self):
        print("Welcome from Welcomer")

@fieldwise_init
struct Host(Greeter, Welcomer):
    pass
    # Error about a trait method requirement greet having conflicting
    # default implementations in Greeter and Welcomer; you must
    # implement it manually
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>. The same is
true of conflicting *provided* implementations in the manual's
`PowerCycle`/`Rebootable` example:

> Resolve the conflict by implementing `restart()` on `Gateway`. Your
> implementation overrides both defaults.

Source: <https://mojolang.org/docs/manual/traits/>.

### Overriding a default

Conforming types inherit provided implementations and can override them — but
there is a limit:

> Mojo doesn't provide a way to call a default implementation from an
> override.

Source: <https://mojolang.org/docs/manual/traits/>.

## Parameterizing with traits

This is where traits pay off. By constraining a compile-time parameter, a
single function works across every conforming type:

```mojo
trait DeflectionSensing:
    def fetch_reading(self) -> Float64:
        ...

def averaged_poll[
    SensorType: DeflectionSensing,
](sensor: SensorType, samples: Int) -> Float64:
    var total: Float64 = 0.0
    for _ in range(samples):
        total += sensor.fetch_reading()
    return total / Float64(samples)
```

Source: <https://mojolang.org/docs/manual/traits/>. The call site needs no
square brackets because the compiler infers `SensorType` from the argument:

```mojo
var sensor = CapacitiveSensor()
var average_reading = averaged_poll(sensor, 10)
print("Average reading:", average_reading)   # 21.5
```

Source: <https://mojolang.org/docs/manual/traits/>.

### `Some[Trait]` shorthand

When you do not need to name the type again, the constraint can move onto the
argument:

> `Some[Trait(s)]` is shorthand for a type parameter constrained to that
> trait or composition. It's syntax sugar, not a new mechanism. It moves
> the constraint onto the argument instead of declaring a parameter in one
> place and using it in another.

```mojo
def averaged_poll_2(sensor: Some[DeflectionSensing], samples: Int) -> Float64:
    var total: Float64 = 0.0
    for _ in range(samples):
        total += sensor.fetch_reading()
    return total / Float64(samples)
```

Source: <https://mojolang.org/docs/manual/traits/>. Use the named form when the
type must appear more than once, for example to require two arguments of the
same conforming type:

```mojo
def compare_readings[
    SensorType: DeflectionSensing
](a: SensorType, b: SensorType) -> Float64:
    return a.fetch_reading() - b.fetch_reading()
```

Source: <https://mojolang.org/docs/manual/traits/>.

`Some[]` works in argument, function-type, variadic and operator-overload
positions. It does **not** work for a struct field, because "the compiler can't
infer a concrete type for a struct field":

```mojo
@fieldwise_init
struct Struct(Writable):
    var x: Some[Copyable & ImplicitlyDeletable & Writable]
    # Error: a `Some` struct field has no concrete type to infer
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>. Use an
explicit type parameter there instead.

### `where` constraints

A `where` clause attaches constraints to a declaration after its signature, and
is where the `conforms_to` expression is most often used. The function-declarations
reference example:

```mojo
def compare[T: AnyType](x: T, y: T) -> Int32 where conforms_to(T, Comparable):
    if x < y:
        return -1
    elif x > y:
        return 1
    else:
        return 0
```

Source: <https://mojolang.org/docs/reference/function-declarations/>. In 1.0 a
`where` clause also accepts a string-literal message that the compiler reports
when the constraint fails:

> `where` clauses now accept an optional string-literal message, written
> `where (condition, "message")`. The compiler includes the message in the
> diagnostic when the constraint fails, and supports it everywhere `where`
> clauses are allowed...

```mojo
def foo[sc: Int]() where (sc > 1, "scaling factor must be greater than 1"):
    ...
```

Source: <https://mojolang.org/releases/v1.0.0/>.

A `where` clause belongs at the end of the declaration, not inside the parameter
list. Both misplaced forms are errors in 1.x:

```mojo
# Wrong: `where` is not allowed inside a parameter list.
def wrong[n: Int where n > 0]():
    pass

# Wrong: `where` clauses can only be used with compile-time parameters.
def wrong(x: Int where x > 0):
    pass
```

Sources: <https://mojolang.org/docs/reference/function-declarations/> and
<https://mojolang.org/releases/v1.0.0/>.

The reference also states the constraint resolution order:

> - The parameter's declared traits are checked first.
> - Parent traits are included transitively.
> - If the constraint uses `&`, all composed traits must be satisfied.
> - If a `where` clause is present, its constraints are checked after
>   parameter-level constraints.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

### `conforms_to`

`conforms_to(T, Trait)` is a compile-time expression that tests conformance. It
is one of three built-in compile-time introspection expressions:

```mojo
type_of(x)             # type of an expression
conforms_to(T, Trait)  # test trait conformance
origin_of(x)           # origin of a reference
```

> These three expressions are used for reflection, conditional type
> conformance, and origin sets. They return compiler-internal types and won't
> print.

Source: <https://mojolang.org/docs/reference/expressions/>. Its two main uses
are the `where` clause (above) and conditional conformance in a struct's
conformance list. Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

## Combining traits

Multiple traits can be required of one parameter with `&`:

```mojo
trait Loggable:
    def log(self, message: String):
        ...

def poll_and_log[T: DeflectionSensing & Loggable](sensor: T):
    print(sensor.fetch_reading())
    sensor.log("Polling sensor")
```

Source: <https://mojolang.org/docs/manual/traits/>. The manual distinguishes the
two composition mechanisms:

> Refinement and composition solve different problems. Use refinement when
> one trait naturally extends another and that relationship should always
> hold. Use composition when a function or type needs multiple independent
> capabilities.

Source: <https://mojolang.org/docs/manual/traits/>.

A repeated combination can be named with `comptime`:

```mojo
comptime SensorLike = DeflectionSensing & Loggable

struct SmartSensor(Copyable, SensorLike):
    def fetch_reading(self) -> Float64:
        return 18.2

    def log(self, message: String):
        print("reading logged")
```

> `SensorLike` isn't a new trait. It's shorthand for
> `DeflectionSensing & Loggable`. Any type that conforms to both traits
> automatically satisfies `SensorLike`; there's nothing extra to declare.

Source: <https://mojolang.org/docs/manual/traits/>. Note the 1.0 warning about
redundant composition: `comptime T : AnyType & Copyable` warns because
"`Copyable` already implies `AnyType`". Source:
<https://mojolang.org/releases/v1.0.0/>.

## Refinement

> A trait can refine another trait, meaning that it inherits every
> requirement from the refined trait while adding new ones.

```mojo
trait CalibratableDeflectionSensing(DeflectionSensing):
    def calibrate(mut self):
        ...

struct EddyCurrentSensor(CalibratableDeflectionSensing):
    def fetch_reading(self) -> Float64:
        # its implementation
        ...

    def calibrate(mut self):
        # its implementation
        ...
```

Source: <https://mojolang.org/docs/manual/traits/>. A conforming
`EddyCurrentSensor` must implement `calibrate()` as well as everything
`DeflectionSensing` requires, and inherits `within_tolerance()`'s default
implementation. Source: <https://mojolang.org/docs/manual/traits/>.

The reference states the constraint rule and how a child can replace a parent
method:

> A child trait can override a parent method by declaring a method with the
> same signature. The parent's version is replaced in the child's
> requirements.

And the implicit root:

> Every trait implicitly refines `AnyType`.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

Refinement is transitive at the constraint level:

```mojo
trait Printable:
    def to_string(self) -> String:
        ...

trait PrettyPrintable(Printable):
    def to_pretty_string(self) -> String:
        ...

def render[T: PrettyPrintable](item: T):
    # to_string() available: PrettyPrintable refines Printable
    print(item.to_string(), "-", item.to_pretty_string())
```

> A function requiring `T: PrettyPrintable` can call any method from
> `Printable` without naming it in the constraint.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

### Associated types in refinement

A refinable trait relationship can also carry associated types; the trait may
provide defaults computed from them. The reference's `Test` / `SampleStruct`
example above shows a `comptime` value derived via `bit_width_of[Self.Element]()`.
Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Trait restrictions

Three things traits do not support:

```mojo
trait Unsupported[T]:  # Error: trait declarations do not support parameters
    ...

trait Unsupported:
    var x: Int  # Error: traits do not support 'var' fields

trait Unsupported:
    def maybe(self) -> Int where conforms_to(Self, Sized):
        ...
    # Error: 'where' clauses on trait methods are not supported
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>. So a trait
cannot be parameterized, cannot hold fields, and cannot constrain an individual
method with `where`. Use compile-time members for trait-level values, and put
constraints on the consuming declaration.

## Core traits you meet everywhere

These names appear in nearly every signature and conformance list. All are
covered here at the level this chapter needs; the per-API detail lives in
[the `traits` stdlib page](../stdlib/traits.md).

| Trait | What it means |
|-------|---------------|
| `AnyType` | The implicit root trait; every trait refines it. |
| `Deinitable` | The value can be destroyed automatically with `__deinit__()`. Implicit for simple structs. |
| `Movable` | The value can be moved; structs are `Movable` by default in 1.x. |
| `Copyable` | The value can be copied explicitly (`.copy()`), and is then also movable. |
| `ImplicitlyCopyable` | The value may be copied implicitly (`var b = a`); implies `Copyable` and `Movable`. |
| `Equatable` | Provides `==` and `!=` (default `__eq__` by field comparison). |
| `Comparable` | Refines `Equatable`; requires `__lt__` and derives `<=`, `>`, `>=`. |
| `Boolable` | Provides a truth value used in boolean contexts. |
| `Writable` | Provides text output for `print()` and `String()`. |
| `Sized` | Provides `__len__`. |
| `Iterable` / `IterableOwned` | Provides iteration, by reference or by ownership. |
| `KeyElement` | `Equatable & Hashable & Movable`: the key bound for `Dict` and `Set`. |
| `RegisterPassable` / `TrivialRegisterPassable` | Marker traits about register passing, used by the compiler for optimization. |

Sources: <https://mojolang.org/docs/manual/traits/>,
<https://mojolang.org/docs/reference/trait-declarations/>,
<https://mojolang.org/docs/manual/structs/>,
<https://mojolang.org/docs/reference/types/> and
<https://mojolang.org/releases/v1.0.0/>. The `Deinitable`, `Movable`, `Copyable`
and `ImplicitlyCopyable` traits are stable in their entirety in 1.0.0; see
[the release notes](https://mojolang.org/releases/v1.0.0/).

### `Equatable` and `Comparable` in practice

Operator traits are the ones you will most often want to conform to, because
they give you operators for free.

> [`Equatable`] provides `__eq__()` if all your struct's fields conform to
> `Equatable` using pairwise field comparison. `__ne__()` derives from
> `__eq__()`.
>
> [`Comparable`] provides `__le__()`, `__gt()`, and `__ge()`, all derived from
> `__lt__()`. You implement `__lt__()`.
>
> `Comparable` refines `Equatable`, so conforming to `Comparable` requires both
> traits. If all your fields are `Equatable`, you implement `__lt__()` at a
> minimum.

Source: <https://mojolang.org/docs/reference/operators/>. The manual adds the
design advice:

> For types without a natural ordering (like complex numbers), only implement
> `Equatable`, and not `Comparable`.

Source: <https://mojolang.org/docs/manual/structs/operator-support/>.

```mojo
@fieldwise_init
struct Version(Comparable):
    var major: Int
    var minor: Int

    def __lt__(self, other: Self) -> Bool:
        if self.major != other.major:
            return self.major < other.major
        return self.minor < other.minor

def main():
    var a = Version(1, 2)
    var b = Version(1, 10)
    print(a < b)    # True
    print(a >= b)   # False — derived from __lt__
    print(a == b)   # False — derived from field comparison
```

The trait contracts shown are from
<https://mojolang.org/docs/reference/operators/>; the operator dunder tables are
on [Operator support](operator-support.md).

## Pitfalls

- **Expecting duck typing.** Implementing a method with the right name does not
  conform a type; you must list the trait. Verified above.
- **Partial conformance.** There is no such thing; a missing requirement is a
  compile error naming the missing item. Verified above.
- **Trying to conform a type you do not own.** Conformance is declared at the
  type definition, so you cannot add a trait to `Int` or `Float64`. Verified
  above.
- **Calling a default implementation from an override.** Not supported.
  Verified above.
- **Conflicting defaults.** Two traits with a same-signature provided method
  require the conforming type to implement it. Verified above.
- **Putting `where` in the wrong place.** A `where` cannot appear inside a
  parameter list or argument list. Verified above.
- **Using `pass` in a return-typed trait method.** `pass` is only valid for
  `None`-returning provided methods; use `...` to mark a requirement. Verified
  above.
- **Parameterizing a trait.** `trait Foo[T]:` is an error. Use a `comptime`
  member or a consumer-side parameter. Verified above.
- **Declaring a field in a trait.** `var` is not allowed in a trait body.
  Verified above.
- **Using `Some[Trait]` on a struct field.** There is no concrete type to
  infer; use an explicit type parameter. Verified above.
- **Assuming `associatedtype` and `comptime Name: Trait` are interchangeable
  spellings in the current release.** The two official pages disagree; see the
  open question above.
- **Adding redundant composition.** `AnyType & Copyable` warns because
  `Copyable` already implies `AnyType`. Source:
  <https://mojolang.org/releases/v1.0.0/>.

## Sources

- Traits (manual): <https://mojolang.org/docs/manual/traits/>
- Mojo trait declarations reference: <https://mojolang.org/docs/reference/trait-declarations/>
- Mojo struct declarations reference: <https://mojolang.org/docs/reference/struct-declarations/>
- Mojo function declarations reference: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo operator reference: <https://mojolang.org/docs/reference/operators/>
- Add operator support to custom types (manual): <https://mojolang.org/docs/manual/structs/operator-support/>
- Mojo structs (manual): <https://mojolang.org/docs/manual/structs/>
- Mojo expressions reference: <https://mojolang.org/docs/reference/expressions/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
