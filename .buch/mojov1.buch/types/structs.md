# Structs

A `struct` is Mojo's way to define a type. It bundles fields with methods, has
a fixed compile-time layout, uses value semantics, and — unlike a Python class
— supports neither dynamic dispatch nor inheritance. This page covers declaring
a struct, fields and their rules, initializers (including `@fieldwise_init`),
methods versus free functions, the lifecycle dunders at overview level, and
conditional conformance. The operator dunders get their own page
([Operator support](operator-support.md)), and recursive data structures get
[Self-referential structs](self-referential-structs.md).

## What a struct is

> A struct defines a custom type with fields and methods. Structs are value
> types: each variable holds its own independent copy rather than a reference
> to shared data.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

The manual frames the same idea in terms of static binding:

> Mojo's struct format is designed to provide a static, memory-safe data
> structure that's both powerful and performant. Unlike dynamic objects (such
> as Python classes) that can be modified freely at runtime, structs are defined
> at compile time, which allows Mojo to generate highly optimized code.

Source: <https://mojolang.org/docs/manual/structs/>.

The struct-declarations reference gives the grammar:

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

By convention struct names use `PascalCase`. Inside the body, `Self` (capital)
refers to the struct's own type and `self` (lowercase) is the conventional name
for the instance argument. Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

```mojo
from std.math import sqrt

struct Point:
    var x: Int
    var y: Int

    def __init__(out self, x: Int, y: Int):
        self.x = x
        self.y = y

    def distance(self) -> Float64:
        return sqrt(Float64(self.x * self.x + self.y * self.y))

def main():
    var p = Point(3, 4)
    print(p.distance())   # 5.0
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

The minimal struct uses `pass` for an empty body, and structs cannot be nested:

```mojo
struct ValidationError:
    pass

struct Outer:
    struct Inner:   # Error: nested struct not supported here
        pass
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

### What a struct body may contain

| Element | Syntax | Role |
|---------|--------|------|
| Field | `var name: Type` | Instance data |
| Method | `def name(self, ...)` | Instance behavior |
| Static method | `@staticmethod def name(...)` | Type-level behavior |
| Compile-time constant | `comptime name = value` | Evaluated at compile time |
| Initializer | `def __init__(out self, ...)` | Constructs an instance |
| Destructor | `def __deinit__(deinit self)` | Cleanup at end of lifetime |

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## Fields

Fields are declared with `var` **and** a type annotation. Both are mandatory:

```mojo
struct MyStruct:
    value: Int        # Error: Missing `var` keyword
    var count: Int    # Yes
```

Source: <https://mojolang.org/docs/manual/structs/>.

Every field requires a type annotation too:

```mojo
struct Unsound:
    var x   # Error: struct field declaration must have a type
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

Field requirements, collected:

- **No default values at the declaration.** "You can't assign values when you
  declare fields. You must initialize all of the struct's fields in the
  constructor." A field initializer at the declaration is an error:
  `var foo: Int = 10 # Error: Unknown tokens`. Source:
  <https://mojolang.org/docs/manual/structs/>.
- **Unique names across kinds.** Fields, methods and `comptime` members "all
  exist in the same namespace", so a duplicate is an invalid redeclaration.
  Source: <https://mojolang.org/docs/manual/structs/>.
- **Concrete types only.** A field cannot have a trait as its type: `var item:
  Writable` errors because dynamic traits are not supported. Use a parameter
  and `Self.T`. Source:
  <https://mojolang.org/docs/reference/struct-declarations/>.
- **`mut self` to change a field.** "You must mark `self` as mutable if
  updating a field value." Source: <https://mojolang.org/docs/manual/structs/>.
- **A member name may be reused by an argument or local.** "You can re-use a
  struct member's name for an argument or method variable." Source:
  <https://mojolang.org/docs/manual/structs/>.

```mojo
struct Sound[T: Writable & Copyable & Deinitable]:
    var item: Self.T    # OK: concrete at compile time

def main():
    var g = Sound[Int](item=42)
    print(g.item)       # 42
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

Fields live as long as the instance: "They are created when the struct is
created and destroyed when the struct is destroyed. This model avoids dangling
references and partially constructed objects." Source:
<https://mojolang.org/docs/manual/structs/>.

### Naming conventions

The manual lists the field conventions:

- lowercase `snake_case` for field names (`user_count`, `max_capacity`);
- descriptive names that indicate purpose, not type (`error_msg`, not
  `msg_string`);
- an underscore prefix for internal members (`_private_field`);
- `is_` or `has_` prefixes for booleans (`is_valid`, `has_data`);
- no single-letter names except common mathematical ones (`x`, `y`, `z`).

Source: <https://mojolang.org/docs/manual/structs/>.

## Constructing: `__init__` and `@fieldwise_init`

A struct with fields but no initializer cannot be instantiated at all:

> However, you can't instantiate this struct because it has no constructor
> method.

Source: <https://mojolang.org/docs/manual/structs/>.

The initializer takes `out self`, because it produces the newly initialized
value:

```mojo
struct MyPair:
    var first: Int
    var second: Int

    def __init__(out self, first: Int, second: Int):
        self.first = first
        self.second = second
```

Source: <https://mojolang.org/docs/manual/structs/>. The reference states the
rule and the diagnostic for omitting it:

> `__init__()` uses the `out self` convention to produce the newly initialized
> value. Every field must be assigned before `__init__()` returns:
>
> ```mojo
> struct Unsound:
>     var value: Int
>
>     def __init__(self):
>         pass
>     # Error: __init__ method must return Self type with
>     # 'out' argument
> ```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.
`__init__()` is "implicitly static" and a struct may define multiple overloads.
Source: <https://mojolang.org/docs/reference/struct-declarations/>.

### `@fieldwise_init`

Most structs are aggregations whose constructor simply copies each argument
into the field of the same name. The decorator generates that constructor:

> To save typing, Mojo provides a `@fieldwise_init` decorator, which generates a
> field-wise constructor for the struct.

```mojo
@fieldwise_init
struct MyPair:
    var first: Int
    var second: Int

def main():
    var mine = MyPair(2, 4)
    print(mine.first)   # 2
```

Source: <https://mojolang.org/docs/manual/structs/>.

Synthesis is not always possible:

> Synthesis fails if any field is non-copyable and non-movable:
>
> ```mojo
> @fieldwise_init
> struct Color:
>     var r: UInt8
>     var g: UInt8
>     var b: UInt8
>     var alpha: Alpha
>
>     # Error: cannot synthesize fieldwise init because field
>     # 'alpha' has non-copyable and non-movable type 'Alpha'
> ```

Source: <https://mojolang.org/docs/reference/struct-declarations/>. Details of
the decorator live under [@fieldwise_init](../decorators/fieldwise-init.md).

### Initializer lists

Mojo also has an inferred-type construction form:

> Mojo initializer lists let you construct instances without spelling out the
> full type name and parameters. If the full type can be inferred from context,
> pass the constructor arguments directly between braces, with or without
> keywords. For example `{0.5, fish="salmon"}` calls `__init__(0.5,
> fish="salmon")` on the appropriate struct type.

Source: <https://mojolang.org/docs/manual/structs/>. Note the sharp edge: `{...}`
is also the syntax for set and dict displays, and the compiler resolves the
meaning from the expected type. Source:
<https://mojolang.org/docs/reference/expressions/>.

## Methods

An instance method takes `self` as its first argument. The self convention
decides what the method may do:

| Receiver | Meaning |
|----------|---------|
| `self` | immutable reference (read-only) |
| `mut self` | mutable reference; changes persist |
| `out self` | the results slot, for `__init__` and named results |
| `deinit self` | consumes the instance, for `__deinit__` and named destructors |
| `ref self` | reference with parametric mutability |

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

```mojo
struct MyStruct:
    var value: Int

    def increment(self):
        self.value += 1   # ERROR: expression must be mutable in assignment

    def increment_mut(mut self):
        self.value += 1   # Works
```

Source: <https://mojolang.org/docs/manual/structs/>. The `self` argument is the
only `def` argument that may omit its type, because the compiler already knows
it. The name `self` is only a convention:

> The name `self` is just a convention, and you can use any name you want to
> refer to the struct instance that is always passed as the first argument.

Source: <https://mojolang.org/docs/manual/structs/>.

A method without `self` is an error unless it is marked `@staticmethod`:

```mojo
struct Unsound:
    def broken():
        pass
    # Error: self argument must be present in instance method
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

### Static methods

> A struct can have _static methods_. A static method can be called without
> creating an instance of the struct. Unlike instance methods, a static method
> doesn't receive the implicit `self` argument, so it can't access any fields on
> the struct.

```mojo
struct Logger:
    def __init__(out self):
        pass

    @staticmethod
    def log_info(message: String):
        print("Info: ", message)

def main():
    Logger.log_info("Static method called.")   # via the type
    var l = Logger()
    l.log_info("from instance.")               # via an instance
```

Source: <https://mojolang.org/docs/manual/structs/>. The reference adds what a
static method *can* reach: type parameters and `comptime` members, other static
methods — but no instance fields or instance methods. Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

### Methods versus free functions

The distinction is purely where the declaration sits and how it is called:

- A function at module scope is a **free function**; a function inside a
  `struct` is a **method** and receives the instance as its first argument.
- A method is called with dot syntax (`instance.method(args)`); a free function
  is called by name (`method(instance, args)`).
- `@staticmethod` removes the instance argument and makes the function callable
  on the type.

Sources: <https://mojolang.org/docs/manual/structs/> and
<https://mojolang.org/docs/reference/function-declarations/>.

## `comptime` members

A `comptime` member is a type-level constant, not instance storage:

> `comptime` declares type-level members inside a struct. They're evaluated at
> compile time and can't be modified at runtime. Use them for constants, type
> aliases, and computed members.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

```mojo
@fieldwise_init
struct Matrix2D[dtype: DType, w: Int, h: Int]:
    pass

struct Test[dtype: DType]:
    comptime default_size = 1024
    comptime DefaultMatrixType = Matrix2D[Self.dtype, Self.default_size, Self.default_size]
    comptime SquareMatrixType[size: Int] = Matrix2D[Self.dtype, size, size]

def main():
    print(Test[DType.int32].default_size)   # 1024
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>. Access works
on the type or on an instance (`Test[DType.int32]().default_size`).

## Parameters in structs

A struct's compile-time parameters live in square brackets and are accessed
through `Self` inside the body — `Self.T`, not bare `T`:

> Structs accept compile-time parameters in square brackets. Parameters are
> accessed through `Self` inside the struct body. `Self.T` refers to the
> parameter `T`. Bare `T` isn't valid in the struct body:

```mojo
@fieldwise_init
struct Pair[T: Copyable & Deinitable]:
    var first: Self.T
    var second: Self.T
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## Trait conformance

Conformance is declared in parentheses after the name (or after the parameter
list) and is checked at compile time:

```mojo
@fieldwise_init
struct MyInt(Writable, Copyable):
    var value: Int

    def write_to[W: Writer](self, mut writer: W):
        writer.write(self.value)

def main():
    var my_int = MyInt(42)
    print(my_int)   # 42
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

Missing requirements are errors, and the diagnostic names the missing item:

```mojo
@fieldwise_init
struct Incomplete(Sized):
    var value: Int
    # Error: 'Incomplete' does not implement all requirements for 'Sized'
    # Note: required function '__len__' is not implemented
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

### Conditional conformance

A struct can conform to a trait only when a condition holds. The condition is a
`where` clause in the conformance list, and it must be resolvable at compile
time:

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
struct Box[T: Copyable](
    Equatable where conforms_to(T, Equatable)
):
    # conforms to Equatable only when T does
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

The reference states the limits of the condition:

> That said, conformance can't depend on a computed compile-time member. Trait
> conformance is part of the type's signature, and the signature is needed to
> resolve members. Depending on a computed member would create a circular
> dependency.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

Conditional and unconditional traits can be mixed in one list, and conditional
conformance pairs naturally with a default implementation such as `Writable`'s
reflection-based writer:

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

Source: <https://mojolang.org/docs/reference/struct-declarations/>. Printing a
`Pair[NotWritable]` fails with a `Writable` nonconformance error; printing a
`Pair[Int]` works because `Int` is `Writable`. Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

## The lifecycle dunders at a glance

Two dunder methods bracket an instance's lifetime. Details are the subject of the
[lifecycle chapter](../lifecycle/index.md); what follows is the overview.

### `__deinit__` — destruction

> As soon as a value/object is no longer used, Mojo destroys it. Mojo does *not*
> wait until the end of a code block—or even until the end of an
> expression—to destroy an unused value. It destroys values using an "as soon as
> possible" (ASAP) destruction policy...

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

The destructor takes `deinit self`:

```mojo
@fieldwise_init
struct Balloon(Writable):
    var color: String

    def __deinit__(deinit self):
        print("Destroyed", String(self))
```

Source: <https://mojolang.org/docs/manual/lifecycle/death/>. Key properties:

- Mojo synthesizes a no-op `__deinit__()` for implicitly deinitable structs, so
  most structs need no destructor at all. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.
- "A custom `__deinit__()` overrides the default. `__deinit__()` can't be
  overloaded." Source:
  <https://mojolang.org/docs/reference/struct-declarations/>.
- A custom destructor is an *extra* cleanup event: fields are still destroyed
  normally. Source: <https://mojolang.org/docs/manual/lifecycle/death/>.
- "You shouldn't call the destructor explicitly." Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.
- The destructor for a pointer **does not** destroy pointees; you must call
  `unsafe_deinit_pointee()` yourself. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.

### `__init__` family — creation, copy and move

`__init__` is the general initializer, and the copy and move constructors are
`__init__` overloads with keyword-only arguments. The reference's summary:

- a move constructor is `def __init__(out self, *, move: Self)`;
- a copy constructor is `def __init__(out self, *, copy: Self)`;
- both are synthesized from trait conformance when possible.

Sources: <https://mojolang.org/docs/reference/struct-declarations/> and
<https://mojolang.org/docs/manual/structs/>. Synthesis fails when a field cannot
support the operation:

```mojo
struct Unsound(Copyable):
    var item: SomeMoveOnlyType
    # Error: cannot synthesize copy constructor because
    # field 'item' has non-copyable type SomeMoveOnlyType
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

The manual's `MyPair` example shows the copy constructor written out:

```mojo
struct MyPair(Copyable):
    var first: Int
    var second: Int

    def __init__(out self, first: Int, second: Int):
        self.first = first
        self.second = second

    def __init__(out self, *, copy: Self):
        self.first = copy.first
        self.second = copy.second
```

Source: <https://mojolang.org/docs/manual/basics/>.

> **Open question:** the pre-1.0 move/copy constructor names
> (`__moveinit__(out self, deinit existing: Self)` and `__copyinit__(out self,
> existing: Self)`) are gone; 1.x uses the `__init__(..., *, move/copy: Self)`
> forms above. [Instance initialization](../lifecycle/initialization.md) owns
> the full treatment, and the authoritative 1.0 migration table lives in
> [`versions/1.0.0`](../versions/1.0.0.md). Verify the exact current spellings
> against the lifecycle chapter.

## Structs versus classes

The manual's comparison table, condensed:

> - Python classes are dynamic: they allow for dynamic dispatch,
>   monkey-patching (or "swizzling"), and dynamically binding instance fields at
>   runtime.
> - Mojo structs are static: they are bound at compile-time (you cannot add
>   methods at runtime).
> - Mojo structs do not support inheritance ("sub-classing"), but a struct can
>   implement traits.
> - Python classes support class attributes... Mojo structs don't support
>   static data members.

Source: <https://mojolang.org/docs/manual/structs/>.

Mojo has no dynamic dispatch for ordinary calls; all dispatch is static. When
you need polymorphism, you use traits and parameterized functions. Source:
<https://mojolang.org/docs/manual/structs/>.

## Dunder methods

> *Dunder methods* (double-underscored names) let a struct work with operators,
> built-in functions, and lifecycle events: `__init__()`, `__add__()`,
> `__str__()`, and so on.

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

The manual groups their jobs into two:

> - Operator overloading: ... methods are designed to overload operators such as
>   `<` (less-than), `+` (add), and `|` (or)...
> - Lifecycle event handling: These special methods deal with the lifecycle and
>   value ownership of an instance.

Source: <https://mojolang.org/docs/manual/structs/>. The operator half is the
subject of [Operator support](operator-support.md). The manual also warns
against calling dunders directly — they are invoked by the language. Source:
<https://mojolang.org/docs/manual/structs/>.

## Pitfalls

- **Forgetting `var` on a field.** `value: Int` is an error; fields are declared
  with `var` and a type. Verified above.
- **Putting a default on a field.** Field initializers are rejected; initialize
  in `__init__` (or let `@fieldwise_init` do it). Verified above.
- **Missing `out self` on `__init__`.** "`__init__` method must return Self type
  with 'out' argument". Verified above.
- **Forgetting `mut` on the receiver.** An unannotated `self` is immutable, so
  `self.field = ...` fails. Verified above.
- **Nesting a struct.** Structs cannot be declared inside other structs, traits
  or functions. Verified above.
- **Trying to inherit.** There is no sub-classing; use trait conformance and
  composition with `&`. Verified above.
- **Making a field a trait type.** Fields must be concrete; use a parameter and
  `Self.T`. Verified above.
- **Naming two members the same.** Fields, methods and `comptime` members share
  one namespace. Verified above.
- **Relying on a synthesized copy.** Copyability is opt-in through `Copyable`;
  a plain struct is movable but not copyable. Source:
  <https://mojolang.org/docs/manual/structs/>.
- **Conditioning conformance on a computed member.** Conformance is part of the
  signature and cannot depend on a computed member. Verified above.
- **Declaring a method without `self` outside `@staticmethod`.** That is an
  error rather than a free function inside a struct. Verified above.

## Sources

- Mojo structs (manual): <https://mojolang.org/docs/manual/structs/>
- Mojo struct declarations reference: <https://mojolang.org/docs/reference/struct-declarations/>
- Mojo function declarations reference: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo expressions reference: <https://mojolang.org/docs/reference/expressions/>
- Value destruction (manual): <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo language basics (manual): <https://mojolang.org/docs/manual/basics/>
- Traits (manual): <https://mojolang.org/docs/manual/traits/>
- Add operator support to custom types (manual): <https://mojolang.org/docs/manual/structs/operator-support/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
