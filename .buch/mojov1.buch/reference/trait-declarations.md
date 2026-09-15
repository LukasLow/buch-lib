# Trait declarations

This page is the **complete formal reference** for Mojo trait declarations,
mirroring `/docs/reference/trait-declarations/`. It covers the declaration
grammar, every trait-body element, required and provided methods, associated
types, required values, constants, refinement, composition, `Some[]` sugar,
restrictions and conformance checks. The guided tour is on
[Traits](../types/traits.md); this page gives the exhaustive form.

## What a trait is

> A *trait* defines requirements that a conforming type must satisfy, including
> methods, associated types, and constants. Traits are similar to *protocols* in
> Swift, *interfaces* in Java, and *traits* in Rust. When a type conforms to a
> trait, the compiler checks every requirement and rejects the code if anything
> is missing.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Trait declarations

> Traits are declared with the `trait` keyword followed by the trait name and an
> optional refinement list. The body contains the trait's requirements, both
> required and provided:

```text
trait Name:
    body

trait Name(ParentA, ParentB):
    body
```

> Traits must be declared at the top level of a file. They can't be nested inside
> structs, other traits, or functions:

```mojo
struct Outer:
    trait Inner:  # Error: nested trait not supported here
        ...
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

### Marker traits

> Empty traits are called *marker traits* and signal that a type has a specific
> property or capability without refining other traits or declaring requirements:

```mojo
trait AnyType:
    pass
```

> Mojo marker traits include: `AnyType`, `TrivialRegisterPassable`,
> `RegisterPassable`, and `ImplicitlyCopyable`. They tell the compiler about a
> type's properties, supporting compile-time optimizations.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Trait body elements

| Element | Syntax | Role |
|---------|--------|------|
| Required method | `...` body | Conforming types must implement |
| Provided method | Code body | Inherited unless overridden |
| Comptime member — associated type | `comptime Name: Trait` | Conforming types provide a concrete type |
| Comptime member — required value | `comptime name: Type` | Conforming types provide a value |
| Comptime member — constant | `comptime name = value` | Shared across all conforming types |

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Trait and member names

> Trait names must be valid identifiers. By convention, they describe a
> capability: `Writable`, `Hashable`, `Copyable`.

| Element | Naming | Notes |
|---------|--------|-------|
| Trait name | `PascalCase` | Capabilities gained by conformance: `Equatable`, `Copyable`, `PathLike`. |
| Instance method | `lower_snake_case()` | Method's action: `write_to()`, `update()` |
| Static method | `lower_snake_case()` | Method's action: `get_type_name`, `get_element_bitwidth` |
| `comptime` members | Trait compositions are `PascalCase`. Values are `lower_snake_case` | Describes use: `KeyElement`, `element_bitwidth` |
| Associated type | `PascalCase` | Describes use: `Element`, `Iterator` |

> When defining traits, avoid private member names with single or double
> underscore prefixes. It may cause required members to be hidden in generated
> documentation from trait users. For similar reasons, don't use `@doc_hidden` to
> hide trait members.
>
> The standard library has a small number of exceptions for required trait
> elements known to the compiler.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Methods

> Traits define both required and provided methods, and both instance and static
> members. Instance methods take `self` as the first parameter. Static methods
> require the `@staticmethod` decorator.

### Required methods

> An ellipsis (`...`) marks a required method. Conforming types must provide an
> implementation:

```mojo
trait RequiredMethods:
    def required_method(self):
        ...

    @staticmethod
    def required_static_method():
        ...

@fieldwise_init
struct SampleStruct(RequiredMethods):
    def required_method(self):
        print("Required method")

    @staticmethod
    def required_static_method():
        print("Required static method")
```

### Provided methods

> A method with a body other than `...` provides a default implementation.
> Conforming types automatically receive that behavior but can also override it:

```mojo
trait ProvidedMethods:
    def provided_method(self):
        print("Provided method")

    @staticmethod
    def provided_static_method():
        print("Provided static method")

@fieldwise_init
struct SampleStruct(ProvidedMethods):
    def provided_method(self):
        print("Overridden provided method")
```

> Both required and provided methods can return values:

```mojo
trait Describable:
    def provided_describe(self) -> String:
        return "no description"  # Type can override this implementation

    def required_describe(self) -> String:
        ...  # Type must provide an implementation for this method
```

> Provided behavior can't use implementation details from any specific conforming
> type, as a trait has no knowledge of a type's capabilities beyond those declared
> in the trait and refinement list. The behavior must work across all conforming
> types.

### `pass` vs `...`

> `pass` and `...` mean distinct things in trait bodies:
>
> - `...` marks a required method stub.
> - `pass` is a no-op that counts as a provided implementation body. It's only
>   valid when the method returns `None`.
>
> If a method declares a return type but uses `pass` as its body, the compiler
> will encourage you to replace it with `...`:

```mojo
trait Unsupported:
    def __compute__(self) -> Int:
        pass
    # Error because trait method with a return type must not use 'pass'.
    # Use '...' to declare the method as required.
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

| Body | Meaning | Valid with a return type? |
|------|---------|---------------------------|
| `...` | Required method | Yes |
| `pass` | Provided no-op body | Only when the method returns `None` |
| Code | Provided implementation | Yes |

## Comptime members: associated types

> An associated type is a `comptime` member that declares a related subordinate
> type that conforming types must specify. For example, an associated type might
> be the `Element` type for a container or collection trait, or the `Key` and
> `Value` types for a map.
>
> The associated type is declared as a `comptime` member without an initializer.
> Only traits can use this declaration form. Conforming structs provide the
> concrete value that satisfies any constraints declared in the trait.

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
```

> In the following example, `Self` refers to the conforming type, so
> `Self.Associated` refers to the conforming type's value for the associated type
> `Associated`. Associated types can be assigned from call sites. This lets a
> trait work across type families:

```mojo
comptime Base = Copyable & Deinitable & Writable

@fieldwise_init
struct Box[T: Base](Boxable):
    comptime Associated = Self.T
    var value: Self.Associated

    def unbox(self) -> Self.Associated:
        return self.value.copy()
```

> A `comptime` without an assignment, type, or traits is an error:

```mojo
trait Unsupported:
    comptime X
    # Error: expected '=' after comptime declaration

trait Supported:
    comptime X: Copyable # OK: associated type
    comptime y: Int      # OK: required value
    comptime z = 42      # OK: constant
```

> Outside of traits, a `comptime` member without an initializer is an error:

```mojo
struct Unsupported:
    comptime X: Int
    comptime Y: Copyable
    # Error: only traits may contain a comptime member
    # without an initializer
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Comptime members: constants and required values

> A trait can declare `comptime` constants (shared value) and required
> assignments (conforming types must provide a value).

### Constants

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
```

> Don't use traits to define general-purpose constants like `PI` or
> `SPEED_OF_LIGHT`. Define them at the top level of a module for local use, or as
> a public member of a related struct for broader use.

### Comptime members: required values

> A required value is a `comptime` member without an initializer. Conforming
> types must provide a value for it. This is useful when the trait needs a
> compile-time constant that varies across conforming types. For example, a
> `Measurable` trait might require a `unit` string and an `always_positive`
> boolean to validate measurements.

```mojo
trait Measurable:
    comptime unit: StaticString          # Required
    comptime always_positive: Bool       # Required

    def get_value(self) -> Float64: ...  # Required method

def validate[T: Measurable](measurement: T) raises:
    comptime if T.always_positive:
        if Float64(measurement.get_value()) < 0.0:
            raise Error(t"{T.unit} cannot be negative")

@fieldwise_init
struct Pascals(Measurable):
    comptime unit: StaticString = "Pa"
    comptime always_positive: Bool = True
    var value: Float64
    def get_value(self) -> Float64:
        return self.value
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

| Comptime form | Syntax | Requirement |
|---------------|--------|-------------|
| Associated type | `comptime Name: Trait` | Conforming type provides a type |
| Required value | `comptime name: Type` | Conforming type provides a value |
| Constant | `comptime name = value` | Shared; usable in trait bodies |
| Bare | `comptime X` | Error: expected `=` |

## Trait refinement

> When a trait refines another, its constraint includes the parent's constraint:

```mojo
trait Printable:
    def to_string(self) -> String:
        ...

trait PrettyPrintable(Printable):
    def to_pretty_string(self) -> String:
        ...

@fieldwise_init
struct Box[T: Copyable & Writable & Deinitable](PrettyPrintable):
    var value: Self.T

    def to_string(self) -> String:
        return String(t"Box({self.value})")

    def to_pretty_string(self) -> String:
        return String(t"Box with value: {self.value}")

def render[T: PrettyPrintable](item: T):
    # to_string() available: PrettyPrintable refines Printable
    print(item.to_string(), "-", item.to_pretty_string())
```

> A function requiring `T: PrettyPrintable` can call any method from `Printable`
> without naming it in the constraint.

### Constraint resolution order

> When the compiler resolves a trait constraint:
>
> - The parameter's declared traits are checked first.
> - Parent traits are included transitively.
> - If the constraint uses `&`, all composed traits must be satisfied.
> - If a `where` clause is present, its constraints are checked after
>   parameter-level constraints.
>
> If any check fails, the compiler reports which trait the type doesn't conform
> to.
>
> A child trait can override a parent method by declaring a method with the same
> signature. The parent's version is replaced in the child's requirements.
>
> Every trait implicitly refines `AnyType`.

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## `Some[]` as constraint sugar

> `Some[Trait(s)]` is shorthand for a type parameter constrained to that trait or
> composition. It's syntax sugar, not a new mechanism. It moves the constraint
> onto the argument instead of declaring a parameter in one place and using it in
> another. The compiler infers the concrete type at the call site, just as it
> does for an explicit parameter. If inference fails, the compiler asks for an
> explicit parameter instead.

| Context | With a parameter | With `Some` |
|---------|------------------|-------------|
| Argument | `def foo[T: Intable, //](x: T)` | `def foo(x: Some[Intable])` |
| Function type | `def f[F: def(Int) -> None](func: F)` | `def f(func: Some[def(Int) -> None])` |
| Variadic | `def show[*Ts: Writable](*pack: *Ts)` | `def show(*pack: *SomeTypeList[Writable])` |
| Operator overload | `def __getitem__[I: Indexer, //](self, idx: I)` | `def __getitem__(self, idx: Some[Indexer])` |

### Where `Some` doesn't work

> The compiler can't infer a concrete type for a struct field:

```mojo
@fieldwise_init
struct Struct(Writable):
    var x: Some[Copyable & ImplicitlyDeletable & Writable]
    # Error: a `Some` struct field has no concrete type to infer
```

> Use an explicit type parameter instead:

```mojo
@fieldwise_init
struct Struct[T: Copyable & ImplicitlyDeletable & Writable](Writable):
    var x: Self.T
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Trait restrictions

> Traits don't support parameter lists:

```mojo
trait Unsupported[T]:  # Error: trait declarations do not support
    ...                # parameters
```

> Traits can't declare or use fields:

```mojo
trait Unsupported:
    var x: Int  # Error: traits do not support 'var' fields
```

> Traits don't support `where` clauses on methods:

```mojo
trait Unsupported:
    def maybe(self) -> Int where conforms_to(Self, Sized):
        ...
    # Error: 'where' clauses on trait methods are not supported
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

| Restriction | Detail |
|-------------|--------|
| No parameter lists | `trait Name[T]:` is rejected |
| No fields | `var x: Int` in a trait is rejected |
| No `where` on methods | Conditions belong on parameters/conformance, not trait methods |
| No nesting | Traits are top-level only |

## Conformance checks

> The compiler checks every requirement and errors on unmet ones.

### Missing methods

```mojo
trait Sized:
    def __len__(self) -> Int: ...

@fieldwise_init
struct SizedStruct[T: Copyable](Sized):
    var backing_store: List[Self.T]

# Error about missing a trait's required function '__len__'.
```

### Missing required members

```mojo
trait Container:
    comptime Element: Copyable

@fieldwise_init
struct Bag(Container):
    var data: Int
    # Error: 'Bag' does not implement all requirements for
    # 'Container'
    # Note: required member 'Element' is not specified
```

### Type mismatch on associated types

```mojo
trait Taggable:
    comptime Tag: Sized

@fieldwise_init
struct Widget(Taggable):
    comptime Tag = Bool
    # Error since Bool is not Sized
```

### Provided method conflicts

> When two traits in a struct's conformance list produce conflicting provided
> methods for the same method, the struct must implement it manually:

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

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Trait declaration grammar (consolidated)

```text
trait_decl      → "trait" name ["(" refinement_list ")"] ":" suite

name            → IDENT | "`" KEYWORD "`"
refinement_list → type ("," type)* [","]

trait_body      → required_method | provided_method
                | associated_type | required_value | constant
                | "pass"
required_method → "def" NAME "(" "self" ... ")" [effects] [":" type] ":" "..."
                  | "@staticmethod" "def" NAME "(" ... ")" ":" "..."
provided_method → "def" NAME "(" ... ")" [":" type] ":" suite
associated_type → "comptime" NAME ":" type
required_value  → "comptime" NAME ":" type
constant        → "comptime" NAME "=" expression
```

Sources: <https://mojolang.org/docs/reference/trait-declarations/> and
<https://mojolang.org/docs/reference/literals/>.

## Pitfalls

- **Nesting a trait.** Traits are top-level only; a nested `trait` is rejected.
  Verified above.
- **Using `pass` for a required method that returns a value.** `pass` is a
  provided body and is only valid when the method returns `None`; use `...`.
  Verified above.
- **Declaring `comptime X` with no value, type or traits.** That is an error.
  Verified above.
- **Putting a `comptime` member without an initializer in a struct.** Only traits
  allow that form. Verified above.
- **Giving a trait a parameter list.** Traits do not support parameters. Verified
  above.
- **Declaring a field in a trait.** Traits do not support `var` fields. Verified
  above.
- **Putting a `where` clause on a trait method.** Not supported. Verified above.
- **Defining a trait constant for a general-purpose value.** Put `PI` and similar
  at module scope or on a related struct. Verified above.
- **Relying on a `Some[]` struct field.** The compiler can't infer a concrete
  type; use an explicit parameter. Verified above.
- **Forgetting an associated type or required value.** Conformance fails with a
  "does not implement all requirements" error. Verified above.
- **Assuming a child trait keeps the parent's version of an overridden method.**
  The child's method replaces the parent's requirement. Verified above.
- **Naming trait members with a leading underscore.** It can hide required
  members from generated documentation. Verified above.
- **Expecting a `where` clause to be checked before parameter-level traits.** The
  parameter's declared traits are checked first. Verified above.

## Sources

- Mojo trait declarations reference: <https://mojolang.org/docs/reference/trait-declarations/>
- Mojo struct declarations reference: <https://mojolang.org/docs/reference/struct-declarations/>
- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Mojo function declarations reference: <https://mojolang.org/docs/reference/function-declarations/>
