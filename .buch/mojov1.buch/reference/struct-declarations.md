# Struct declarations

This page is the **complete formal reference** for Mojo struct declarations,
mirroring `/docs/reference/struct-declarations/`. It covers the declaration
grammar, every struct-body element, fields, parameters, trait conformance
including conditional conformance, methods, initializers, lifecycle methods and
`comptime` members. The guided tour is on
[Structs](../types/structs.md); this page gives the exhaustive form.

## What a struct is

> A struct defines a custom type with fields and methods. Structs are value
> types: each variable holds its own independent copy rather than a reference to
> shared data.

```text
struct Name:
    body

struct Name[parameter-list]:
    body

struct Name(TraitA, TraitB):
    body

struct Name[parameter-list](TraitA, TraitB):
    body
```

> By convention, struct names use `PascalCase`. `Self` (capital S) refers to the
> struct's own type inside the body. `self` (lowercase) is a conventional
> argument name for the instance.

```mojo
from std.math import sqrt

struct Point:
    var x: Int
    var y: Int

    def __init__(out self, x: Int, y: Int):
        self.x = x
        self.y = y

    def distance(self) -> Float64:
        return sqrt(
            Float64(self.x * self.x + self.y * self.y)
        )

def main():
    var p = Point(3, 4)
    print(p.distance()) # 5.0
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## Struct body elements

| Element | Syntax | Role |
|---------|--------|------|
| Field | `var name: Type` | Instance data |
| Method | `def name(self, ...)` | Instance behavior |
| Static method | `@staticmethod def name(...)` | Type-level behavior |
| Compile-time constant | `comptime name = value` | Evaluated at compile time |
| Initializer | `def __init__(out self, ...)` | Constructs an instance |
| Destructor | `def __deinit__(deinit self)` | Cleanup at end of lifetime |

> The most minimal struct uses `pass` for an empty body:

```mojo
struct ValidationError:
    pass
```

> Structs can't be nested inside other structs, traits, or functions:

```mojo
struct Outer:
    struct Inner:  # Error: nested struct not supported here
        pass
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## Fields

> Declare each field with `var` and a type annotation. Fields can't have default
> values. All fields must be initialized in `__init__()`:

```mojo
struct Color:
    var r: UInt8
    var g: UInt8
    var b: UInt8

    def __init__(out self, r: UInt8, g: UInt8, b: UInt8):
        (self.r, self.g, self.b) = (r, g, b)
```

> Every field requires a type annotation:

```mojo
struct Unsound:
    var x  # Error: struct field declaration must have a type
```

> Field types must be concrete, not traits. A struct parameter establishes a
> concrete type at compile time:

```mojo
struct Unsound:
    var item: Writable  # Error because dynamic traits not supported

@fieldwise_init
struct Sound[T: Writable & Copyable & Deinitable]:
    var item: Self.T    # OK: concrete at compile time

def main():
    var g = Sound[Int](item=42)
    print(g.item)       # 42
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

| Field rule | Detail |
|------------|--------|
| Declaration | `var name: Type` |
| Type annotation | Required |
| Default value | Not allowed |
| Initialization | Every field must be assigned in `__init__` |
| Trait-typed field | Not allowed; use a parameter and `Self.T` |

### Synthesized initializers

> The `@fieldwise_init` decorator synthesizes an `__init__()` from the struct's
> fields:

```mojo
@fieldwise_init
struct Color:
    var r: UInt8
    var g: UInt8
    var b: UInt8

def main():
    var color = Color(255, 0, 0)
    print(color.r, color.g, color.b)  # 255, 0, 0
```

> Synthesis fails if any field is non-copyable and non-movable:

```mojo
@fieldwise_init
struct Alpha:
    var a: UInt8

@fieldwise_init
struct Color:
    var r: UInt8
    var g: UInt8
    var b: UInt8
    var alpha: Alpha

    # Error: cannot synthesize fieldwise init because field
    # 'alpha' has non-copyable and non-movable type 'Alpha'
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>. The
`@fieldwise_init` decorator has its own page:
[fieldwise-init](../decorators/fieldwise-init.md).

### Recursive references

> Structs can't point to themselves. Mojo won't let you build a type that stores
> another instance of itself, even when nested within an Optional:

```mojo
struct Node:
    var value: String
    var next: Optional[Node]  # Error about this being a recursive
                              # reference
```

> To build recursive data structures such as linked lists and trees, you must use
> unsafe pointers.

Source: <https://mojolang.org/docs/reference/struct-declarations/>. The pattern
is taught on
[Self-referential structs](../types/self-referential-structs.md).

## Parameters

> Structs accept compile-time parameters in square brackets. Parameters are
> accessed through `Self` inside the struct body. `Self.T` refers to the
> parameter `T`. Bare `T` isn't valid in the struct body:

```mojo
@fieldwise_init
struct Pair[T: Copyable & Deinitable]:
    var first: Self.T
    var second: Self.T
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>. `Self` is a
reserved keyword ([`keywords/self`](../keywords/self.md)); generics are taught on
[Parameters and generics](../functions/parameters-and-generics.md).

## Trait conformance

> Declare conformance in parentheses after the name or parameter list. Separate
> multiple traits with commas or compose them with `&`:

```mojo
@fieldwise_init
struct MyInt(Writable, Copyable):
    var value: Int

    def write_to[W: Writer](self, mut writer: W):
        writer.write(self.value)

def main():
    var my_int = MyInt(42)
    print(my_int)  # 42
```

> Conformance commits the struct to implementing every method and associated type
> the trait requires. Missing items produce errors:

```mojo
@fieldwise_init
struct Incomplete(Sized):
    var value: Int
    # Error: 'Incomplete' does not implement all requirements
    # for 'Sized'
    # Note: required function '__len__' is not implemented
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

### Conformance lists

> A conformance list accepts traits and conditional `where` clauses:

```mojo
@fieldwise_init
struct Pair[T: Copyable & Deinitable](
    Equatable where conforms_to(T, Equatable)
):
    var first: Self.T
    var second: Self.T
```

### Implicit conformances

> The compiler automatically conforms every struct to `AnyType` and `Deinitable`
> when all members are also `Deinitable`. With parameterized types, the
> parameter's traits must include `Deinitable` for this to apply:

```mojo
@fieldwise_init
struct Box[T: Copyable & Deinitable](
    Equatable where conforms_to(T, Equatable)
):
    var item: Self.T

def main():
    var box = Box(42)
    print(box.item)  # OK
```

> Without `Deinitable`, the compiler can't verify that the struct is safe to
> destroy using the built-in `__deinit__()` destructor:

```mojo
@fieldwise_init
struct Box[T: Copyable](
    Equatable where conforms_to(T, Equatable)
):
    var item: Self.T

def main():
    var box = Box(42)
    print(box.item)
    # Error about the 'box' being abandoned without being destroyed.
```

### Synthesized lifecycle methods

> If a struct conforms to `Movable` but doesn't define `__init__(move:)`, the
> compiler synthesizes one that moves each field. The same applies to `Copyable`
> and `__init__(copy:)`. Synthesis fails if any field can't support the
> operation:

```mojo
struct Unsound(Copyable):
    var item: SomeMoveOnlyType
    # Error: cannot synthesize copy constructor because
    # field 'item' has non-copyable type SomeMoveOnlyType
```

### Default method conflicts

> When two traits provide conflicting defaults for the same method, the struct
> must implement it manually:

```mojo
trait A:
    def foo(self) -> Int:
        return 42

trait B:
    def foo(self) -> Int:
        return 1024

@fieldwise_init
struct S(A & B):
    pass

# Error about conflicting default implementations in two traits
# reminding you to implement the implementation manually
```

### Conditional conformance

> Conditional conformance lets a struct conform to a trait when certain
> conditions are met. For example, the following structs conform to a set of
> (mostly hypothetical) traits when their parameters meet specific criteria:

```mojo
from std.sys import is_gpu

@fieldwise_init
struct Mathematical(
    GPUComputable where is_gpu()
):
    # conforms only on GPU targets

@fieldwise_init
struct FixedBuffer[T: Copyable, N: Int](
    Iterable where N > 0
):
    # conforms if N is one or more, but not if N is zero or negative

@fieldwise_init
struct Tensor[dtype: DType](
    FloatMath where dtype.is_floating_point()
):
    # conforms when dtype is a floating point type

@fieldwise_init
struct Tagged[kind: StringLiteral](
    Printable where kind == "debug"
):
    # only conforms in debug mode

@fieldwise_init
struct Box[T: Copyable](
    Equatable where conforms_to(T, Equatable)
):
    # conforms to Equatable only when T does
```

### Conditional conformance and compile-time values

> Conditional conformance can depend only on information known at compile time.
> While it often uses traits to constrain conformance, conditional conformance
> isn't limited to traits. A condition can use any compile-time value that can be
> evaluated in a clear and consistent way.
>
> That said, conformance can't depend on a computed compile-time member. Trait
> conformance is part of the type's signature, and the signature is needed to
> resolve members. Depending on a computed member would create a circular
> dependency.

### Conditional conformance and default implementations

> The `Writable` trait offers a default implementation that uses reflection to
> automatically write struct fields. Declare the trait conformance after ensuring
> that all fields are `Writable`:

```mojo
@fieldwise_init
struct Point(Writable):
    var x: Float64
    var y: Float64
```

> Consider a parameterized version of this `Pair` type. ... A better solution is
> to use conditional conformance. Ensure `Pair` conforms to `Writable` only when
> its fields do:

```mojo
@fieldwise_init
struct Pair[T: Copyable & Deinitable](
    Writable where conforms_to(T, Writable)
):
    var first: Self.T
    var second: Self.T
```

### Mixed trait lists

> You can combine conditional and non-conditional traits in the same conformance
> list:

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

## Methods

> Instance methods take `self` as the first argument. The convention on `self`
> determines access:
>
> - Bare `self`: immutable reference.
> - `mut self`: allows modification.
> - `out`, `deinit`: used by lifecycle methods.
> - `out`: also used to specify a named result slot.
> - `ref`: used to declare an argument with parametric mutability, and which must
>   be passed in memory regardless of its type.

> A method without `self` is an error unless it's marked `@staticmethod`:

```mojo
struct Unsound:
    def broken():
        pass
    # Error: self argument must be present in instance method

struct OK:
    @staticmethod
    def utility():  # No self required
        pass
```

| `self` convention | Effect |
|-------------------|--------|
| `self` | Immutable reference; modification is an error |
| `mut self` | Modifiable in place |
| `var self` | Owned; reached with `^` at the call site |
| `out self` | The return slot (`__init__`) |
| `deinit self` | Destructive transfer (`__deinit__`, consuming methods) |
| `ref self` | Parametric mutability, passed in memory |

### Static methods

> `@staticmethod` marks a method that belongs to the type, not to instances.
>
> It can access type parameters and comptime members, can call other static
> methods, has no `self`, and has no access to instance fields and instance
> methods.

```mojo
struct MathUtils:
    comptime pi: Float64 = 3.141592653589793

    @staticmethod
    def square(x: Int) -> Int:
        return x * x
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>. See also
[staticmethod](../decorators/staticmethod.md).

### Dunder methods

> *Dunder methods* (double-underscored names) let a struct work with operators,
> built-in functions, and lifecycle events: `__init__()`, `__add__()`,
> `__str__()`, and so on.

Source: <https://mojolang.org/docs/reference/struct-declarations/>. The mapping
from operator to dunder is on
[Operator support](../types/operator-support.md).

## Instance creation with initializers

> `__init__()` uses the `out self` convention to produce the newly initialized
> value. Every field must be assigned before `__init__()` returns:

```mojo
struct Point:
    var x: Float64
    var y: Float64

    def __init__(out self, x: Float64, y: Float64):
        (self.x, self.y) = (x, y)

def main():
    var p = Point(3.0, 4.0)
    print(p.x, p.y)  # 3.0 4.0
```

> Omitting `out self` is an error:

```mojo
struct Unsound:
    var value: Int

    def __init__(self):
        pass
    # Error: __init__ method must return Self type with
    # 'out' argument
```

> `__init__()` is implicitly static. Structs can define multiple `__init__()`
> overloads.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## Instance tear-down with destructors

> `__deinit__()` runs when the compiler detects no further access to an instance.
> Its `self` uses the `deinit` convention:

```mojo
def __deinit__(deinit self):
    print("cleaning up")
```

> Implicitly deletable structs get a default `__deinit__()`. A custom
> `__deinit__()` overrides the default. `__deinit__()` can't be overloaded.
>
> Explicitly destroyed structs write their own cleanup logic, using a consuming
> method with `deinit self`.
>
> Opt out with `Deinitable where False`.

Source: <https://mojolang.org/docs/reference/struct-declarations/>. The
lifecycle model is taught on
[Initialization](../lifecycle/initialization.md) and
[Death](../lifecycle/death.md); `@explicit_destroy` has its own page:
[explicit-destroy](../decorators/explicit-destroy.md).

## `comptime` members

> `comptime` declares type-level members inside a struct. They're evaluated at
> compile time and can't be modified at runtime. Use them for constants, type
> aliases, and computed members:

```mojo
@fieldwise_init
struct Matrix2D[dtype: DType, w: Int, h: Int]:
    pass

struct Test[dtype: DType]:
    comptime default_size = 1024
    comptime DefaultMatrixType = Matrix2D[Self.dtype, Self.default_size, Self.default_size]
    comptime SquareMatrixType[size: Int] = Matrix2D[Self.dtype, size, size]

def main():
    print(Test[DType.int32].default_size) # 1024
```

> Access these constants on the instance or the type. For example,
> `Test[DType.int32]().default_size` and `Test[DType.int32].default_size`.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

Unlike in traits, a `comptime` member **without an initializer** is not allowed
in a struct: "only traits may contain a comptime member without an initializer".
Source: <https://mojolang.org/docs/reference/trait-declarations/>.

## Struct declaration grammar (consolidated)

```text
struct_decl     → "struct" name ["[" parameter_list "]"]
                  ["(" conformance_list ")"] ":" suite

name            → IDENT | "`" KEYWORD "`"
conformance_list→ conformance ("," conformance)* [","]
conformance     → type ["where" constraint]

struct_body     → field | method | static_method
                | comptime_member | init | deinit | "pass"
field           → "var" NAME ":" type
method          → "def" NAME "(" "self" ... ")" ":" suite
static_method   → "@staticmethod" "def" NAME "(" ... ")" ":" suite
init            → "def" "__init__" "(" "out" "self" ... ")" ":" suite
deinit          → "def" "__deinit__" "(" "deinit" "self" ")" ":" suite
comptime_member → "comptime" NAME ("[" parameter_list "]")? ["="] expression
```

Sources: <https://mojolang.org/docs/reference/struct-declarations/> and
<https://mojolang.org/docs/reference/trait-declarations/>.

## Pitfalls

- **Nesting a struct.** Structs can't be nested inside structs, traits or
  functions. Verified above.
- **Giving a field a default value.** Fields can't have defaults; initialize them
  in `__init__`. Verified above.
- **Leaving out a field's type annotation.** Every field requires one. Verified
  above.
- **Typing a field with a trait.** Trait-typed fields are rejected; use a
  parameter and `Self.T`. Verified above.
- **Referring to a bare parameter `T` inside the body.** Use `Self.T`. Verified
  above.
- **Making a struct contain itself.** Even via `Optional[Self]` that is a
  recursive reference; use pointers and see
  [Self-referential structs](../types/self-referential-structs.md). Verified above.
- **Omitting `out self` on `__init__`.** The compiler rejects the initializer.
  Verified above.
- **Overloading `__deinit__`.** It can't be overloaded. Verified above.
- **Relying on `@fieldwise_init` when a field is non-copyable and non-movable.**
  Synthesis fails. Verified above.
- **Assuming a `Writable` default works for a parameterized field.** Add
  conditional conformance with `where conforms_to(T, Writable)`. Verified above.
- **Depending on a computed `comptime` member for conformance.** Conformance
  can't depend on a computed member; it is part of the signature. Verified above.
- **Leaving a parameter out of `Deinitable`.** Without it the compiler can't
  confirm the struct is safe to destroy. Verified above.
- **Forgetting to implement a method a trait requires.** Every requirement is
  checked; conflicts between two traits' defaults must be implemented manually.
  Verified above.
- **Writing a method with no `self` and no `@staticmethod`.** That is an error.
  Verified above.
- **Declaring a `comptime` member without an initializer in a struct.** Only
  traits allow that form. Source:
  <https://mojolang.org/docs/reference/trait-declarations/>.

## Sources

- Mojo struct declarations reference: <https://mojolang.org/docs/reference/struct-declarations/>
- Mojo trait declarations reference: <https://mojolang.org/docs/reference/trait-declarations/>
- Mojo function declarations reference: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
