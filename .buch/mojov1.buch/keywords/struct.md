# struct

`struct` declares a custom type with fields and methods. Structs are Mojo's
primary abstraction mechanism and the way every user-defined type — including
all the standard library types — is built.

## Purpose

The official keywords reference defines `struct` in one line:

> `struct` — Struct type declaration

Source: <https://mojolang.org/docs/reference/keywords/>.

> A struct defines a custom type with fields and methods. Structs are value
> types: each variable holds its own independent copy rather than a reference to
> shared data.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

```mojo
struct MyPair:
    var first: Int
    var second: Int
```

Source: <https://mojolang.org/docs/manual/structs/>.

## Syntax

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

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

By convention struct names are `PascalCase`. Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

## Struct body elements

The reference table, quoted:

| Element | Syntax | Role |
|---------|--------|------|
| Field | `var name: Type` | Instance data |
| Method | `def name(self, ...)` | Instance behavior |
| Static method | `@staticmethod def name(...)` | Type-level behavior |
| Compile-time constant | `comptime name = value` | Evaluated at compile time |
| Initializer | `def __init__(out self, ...)` | Constructs an instance |
| Destructor | `def __deinit__(deinit self)` | Cleanup at end of lifetime |

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

The minimal struct uses `pass`:

```mojo
struct ValidationError:
    pass
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## Fields

Every field requires a `var` and a type annotation, and all fields must be
initialized in `__init__()`:

> You must declare field members with `var` in structs.

Source: <https://mojolang.org/docs/manual/structs/>.

```mojo
struct Unsound:
    var x  # Error: struct field declaration must have a type
```

```mojo
struct Color:
    var r: UInt8
    var g: UInt8
    var b: UInt8

    def __init__(out self, r: UInt8, g: UInt8, b: UInt8):
        (self.r, self.g, self.b) = (r, g, b)
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

Fields cannot have default values and cannot be assigned at the declaration
site:

```mojo
struct MyStruct:
    var foo: Int = 10 # Error: Unknown tokens
    comptime bar = 10 # Yes
```

Source: <https://mojolang.org/docs/manual/structs/>.

Field types must be concrete, not traits: `var item: Writable` is an error, while
`var item: Self.T` with `T` a struct parameter is fine. Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

## Instance creation: `__init__` and `@fieldwise_init`

The constructor must produce the value through an `out self` argument:

```mojo
struct Point:
    var x: Float64
    var y: Float64

    def __init__(out self, x: Float64, y: Float64):
        (self.x, self.y) = (x, y)
```

> Omitting `out self` is an error: `__init__` method must return `Self` type with
> 'out' argument.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

`@fieldwise_init` synthesizes the field-wise constructor for you:

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

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## Mutating: `mut self`

By default a method's `self` is an immutable reference, so mutation is an error:

```mojo
struct MyStruct:
    var value: Int

    def increment(self):
        self.value += 1 # ERROR: expression must be mutable in assignment
```

```mojo
struct MyStruct:
    var value: Int

    def increment(mut self):
        self.value += 1 # Works: Mutable `self` allows assignment
```

Source: <https://mojolang.org/docs/manual/structs/>.

Lifecycle methods take specific `self` conventions: `__init__` takes `out self`
and `__deinit__` takes `deinit self`. Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

## Parameters and `Self`

Structs accept compile-time parameters in square brackets, accessed through
`Self` inside the body:

```mojo
@fieldwise_init
struct Pair[T: Copyable & Deinitable]:
    var first: Self.T
    var second: Self.T
```

> Parameters are accessed through `Self` inside the struct body. `Self.T` refers
> to the parameter `T`. Bare `T` isn't valid in the struct body.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## Trait conformance

Conformance is declared in parentheses after the name (or parameter list):

```mojo
@fieldwise_init
struct MyInt(Writable, Copyable):
    var value: Int

    def write_to[W: Writer](self, mut writer: W):
        writer.write(self.value)
```

> Conformance commits the struct to implementing every method and associated
> type the trait requires. Missing items produce errors.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

Conditional conformance uses `where` in the conformance list:

```mojo
@fieldwise_init
struct Pair[T: Copyable & Deinitable](Writable where conforms_to(T, Writable)):
    var first: Self.T
    var second: Self.T
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## Value semantics: `Copyable`, `Movable`, `ImplicitlyCopyable`

Mojo structs are **not** copyable or movable by default:

> Mojo structs are not copyable or movable by default.

Source: <https://mojolang.org/docs/manual/structs/>.

But 1.0 changed the default for movability: "Struct types are now `Movable` by
default." Source: <https://mojolang.org/releases/v1.0.0/>. To make copies
possible, add `Copyable`; to make copies implicit, add `ImplicitlyCopyable`:

```mojo
struct MyPair(Copyable):
    ...

struct MyPair(ImplicitlyCopyable):
    ...
```

> `ImplicitlyCopyable` automatically implies `Copyable` and `Movable` ... A type
> should only be implicitly copyable if copying the type is inexpensive and has
> no side effects.

Source: <https://mojolang.org/docs/manual/structs/>.

## No nesting, no inheritance

> Structs can't be nested inside other structs, traits, or functions.

```mojo
struct Outer:
    struct Inner:  # Error: nested struct not supported here
        pass
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

> Mojo structs do not support inheritance ("sub-classing"), but a struct can
> implement traits.

Source: <https://mojolang.org/docs/manual/structs/>.

Recursive references are also rejected: "Structs can't point to themselves ...
To build recursive data structures such as linked lists and trees, you must use
unsafe pointers." Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

## Methods versus static methods

An instance method takes `self`; a method without `self` must be marked
`@staticmethod`:

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

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

The manual adds that a static method "can be called without creating an instance
of the struct" and "can't access any fields on the struct". Source:
<https://mojolang.org/docs/manual/structs/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `trait` | Declares the contracts a struct may conform to. |
| `def` | Declares struct methods and lifecycle methods. |
| `var` | Declares fields (with a type) and binds local variables. |
| `ref` | Declares reference receivers and `ref` return types on methods. |
| `Self` | Names the enclosing type inside the body and its signatures. |
| `comptime` | Declares type-level members that are not stored per instance. |
| `pass` | Provides an empty struct body. |
| `lambda` | Can be stored in a struct field only when it is thin. |

## Signature vs. body

`struct` itself is a top-level declaration, not a statement in a body. What lives
in signatures are the fields, method signatures, `self` conventions, trait
conformance lists, and `where` clauses. What lives in bodies are method bodies
and initializers.

## Pitfalls

- **Missing `var` on a field.** `value: Int` inside a struct is an error; fields
  "must be declared using `var`". Source:
  <https://mojolang.org/docs/manual/structs/>.
- **Missing `mut` on a mutating method.** An unannotated `self` is an immutable
  reference; `self.value += 1` fails. Source:
  <https://mojolang.org/docs/manual/structs/>.
- **Forgetting `out self` on `__init__`.** The compiler rejects it. Source:
  <https://mojolang.org/docs/reference/struct-declarations/>.
- **Assuming structs are copyable.** They are not copyable by default; a copy
  needs `ImplicitlyCopyable` (implicit) or an explicit `.copy()` with `Copyable`.
  Source: <https://mojolang.org/docs/manual/structs/>.
- **Field default values.** Fields cannot have defaults; initialize in the
  constructor, or use `comptime` members for compile-time constants. Source:
  <https://mojolang.org/docs/manual/structs/>.
- **Field type is a trait.** `var item: Writable` is rejected; use a parameter
  and `Self.T`. Source:
  <https://mojolang.org/docs/reference/struct-declarations/>.
- **Nested structs.** Not supported; move the inner type to module scope.
- **Name collisions.** Fields, methods, and `comptime` members share one
  namespace, so a field and a method cannot have the same name. Source:
  <https://mojolang.org/docs/manual/structs/>.
- **Assuming `Writable` gives you printing for free.** The default
  implementation uses reflection and requires every field to be `Writable`, or
  you must write `write_to()`. Source:
  <https://mojolang.org/docs/reference/struct-declarations/>.
- **`__del__` in old code.** The destructor is `__deinit__()` in 1.x;
  `__del__` is deprecated. Source: <https://mojolang.org/releases/v1.0.0/>.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`trait`](trait.md), [`Self`](self.md), [`var`](var.md),
[`comptime`](comptime.md),
[`struct-declarations`](../reference/struct-declarations.md),
[`structs`](../types/structs.md), [`overview`](../types/overview.md),
[`initialization`](../lifecycle/initialization.md),
[`fieldwise-init`](../decorators/fieldwise-init.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo struct declarations reference:
  <https://mojolang.org/docs/reference/struct-declarations/>
- Structs (manual): <https://mojolang.org/docs/manual/structs/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
