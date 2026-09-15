# Self

`Self` (capital S) is the keyword that refers to the **enclosing type** inside a
struct or trait definition. It is a literal keyword — a compile-time value that
denotes a type — and must not be confused with `self` (lowercase), which is a
conventional argument name for the instance.

## Purpose

The official keywords reference defines `Self` in one line as a table row with
its value:

> | `Self` | The enclosing type |

and groups it under **Literal keywords**:

> These keywords are also literals. They produce a value directly.

Source: <https://mojolang.org/docs/reference/keywords/>.

> `Self` refers to the enclosing type inside a struct or trait definition:

```mojo
from std.math import sqrt

@fieldwise_init
struct Point:
    var x: Float64
    var y: Float64

    @staticmethod
    def create() -> Self:          # Self refers to Point
        return Self(0.0, 0.0)

    def distance(self) -> Float64: # self is an argument name, not Self
        return sqrt(self.x ** 2 + self.y ** 2)
```

Source: <https://mojolang.org/docs/reference/literals/>.

## `Self` versus `self`

The one-line distinction from the literals reference:

> `Self` (capital S) is a keyword that refers to the type. `self` (lowercase) is
> a conventional argument name for the instance.

Source: <https://mojolang.org/docs/reference/literals/>.

The keywords reference frames the same point through case sensitivity:

> `Self` is a keyword; `self` is a conventional argument name, not a keyword.

Source: <https://mojolang.org/docs/reference/keywords/>.

| Spelling | Kind | Refers to |
|----------|------|-----------|
| `Self` | Keyword (literal) | The enclosing **type** — a compile-time value. |
| `self` | Conventional name | The **instance** argument of a method — a run-time value. |

| Position | Meaning |
|----------|---------|
| `self` in an argument list | The instance receiver (`self`, `mut self`, `ref self`, `out self`, `deinit self`). |
| `Self` in a type position | The concrete enclosing type. |
| `Self.T` | A struct parameter or `comptime` member. |
| `Self(…)` | A constructor call on the enclosing type. |

## `Self` names the concrete type

Inside a parameterized struct, `Self` stands for the fully specified type:

> A parameterized struct can use the `Self` type to represent a concrete instance
> of the struct (that is, with all its parameters specified).

```mojo
struct ParameterizedArray[ElementType: Copyable & Deinitable]:
    ...

    @staticmethod
    def splat(count: Int, value: Self.T) -> Self:
        # Create a new array with count instances of the given value
        return Self(count=count, value=value)
```

> Here, `Self` is equivalent to writing
> `ParameterizedArray[Self.ElementType]`.

Source: <https://mojolang.org/docs/manual/parameters/>.

The same idea in the standard library:

> Although it's valid to write this out (as shown in the return type of
> `splat()`), this can be verbose, so we recommend using the `Self` type ...
> like the `__add__()` example does.

Source: <https://mojolang.org/docs/manual/parameters/>.

## `Self` with struct parameters and `comptime` members

Inside a struct body, parameters are reached through `Self`:

```mojo
@fieldwise_init
struct Pair[T: Copyable & Deinitable]:
    var first: Self.T
    var second: Self.T
```

> Parameters are accessed through `Self` inside the struct body. `Self.T` refers
> to the parameter `T`. **Bare `T` isn't valid in the struct body.**

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

`comptime` members are accessed the same way:

```mojo
struct Test[dtype: DType]:
    comptime default_size = 1024
    comptime DefaultMatrixType = Matrix2D[Self.dtype, Self.default_size, Self.default_size]
    comptime SquareMatrixType[size: Int] = Matrix2D[Self.dtype, size, size]
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

They can also be read from the type or the instance:
`Test[DType.int32]().default_size` and `Test[DType.int32].default_size`. Source:
<https://mojolang.org/docs/reference/struct-declarations/>.

For lifecycle methods, the manual shows `Self` in the parameter and
`Self.T` in fields:

```mojo
@fieldwise_init
struct Pair[T: Copyable & Deinitable]:
    var first: Self.T
    var second: Self.T

    def __init__(out self, *, copy: Self):
        self.first = copy.first
        self.second = copy.second
```

Source: <https://mojolang.org/docs/manual/structs/>.

## `Self` as the receiver type is enforced in 1.0

A method's `self` must have type `Self`. A custom receiver type must be expressed
as a `where` clause instead:

```mojo
struct Foo[T: AnyType]:
    # ERROR: def foo(self: Foo[Int]):
    def foo(self) where Self.T == Int:
        ...
```

> Method `self` parameters must now have type `Self`; switch a custom `self`
> type to a `where` clause.

Source: <https://mojolang.org/releases/v1.0.0/>.

Note that a method with no `mut`/`ref`/`out`/`deinit` convention has `self` as an
immutable reference:

```mojo
struct CountingTool:
    var value: Int

    def __init__(out self):       # out: self is the return value
        self.value = 0

    def increment(mut self):      # mut: modifies self in place
        self.value += 1
```

Source: <https://mojolang.org/docs/reference/keywords/>.

## `Self` in traits

Inside a trait, `Self` refers to the **conforming type**, not to the trait:

> In the following example, `Self` refers to the conforming type, so
> `Self.Associated` refers to the conforming type's value for the associated
> type `Associated`:

```mojo
trait Boxable:
    comptime Associated: Writable & Copyable & Deinitable

    def unbox(self) -> Self.Associated:
        ...
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

A provided default may use `Self` members declared by the trait:

```mojo
trait DeflectionSensing:
    def fetch_reading(self) -> Float64:
        ...

    comptime absolute_tolerance: Float64 = 0.05

    def within_tolerance(self) -> Bool:
        return abs(self.fetch_reading()) <= Self.absolute_tolerance
```

Source: <https://mojolang.org/docs/manual/traits/>.

## `Self` in `where` clauses and conformance

`Self` is available wherever the enclosing declaration is in scope, including
constraints:

```mojo
trait Unsupported:
    def maybe(self) -> Int where conforms_to(Self, Sized):
        ...
    # Error: 'where' clauses on trait methods are not supported
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

The function-declarations reference shows `Self` restricting a method's
availability on a struct parameter:

```mojo
struct Foo[T: AnyType]:
    def foo(self) where Self.T == Int:
        ...
```

Source: <https://mojolang.org/releases/v1.0.0/>.

`Self` also appears in overload constraints:

```mojo
def which(var self) -> Int where not conforms_to(
    Self, TrivialRegisterPassable
):
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

And in conditional-conformance conditions:

```mojo
@align(Self.alignment)
struct AlignedBuffer[alignment: Int]:
    var data: Int
```

Source: <https://mojolang.org/docs/reference/decorators/align/>.

## `Self` as a value: construction

`Self(...)` constructs the enclosing type, which is how factory methods avoid
naming the type twice:

```mojo
@staticmethod
def create() -> Self:
    return Self(0.0, 0.0)
```

Source: <https://mojolang.org/docs/reference/literals/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `struct` | The declaration whose type `Self` denotes. |
| `trait` | `Self` denotes the conforming type inside a trait. |
| `comptime` | `comptime` members are reached as `Self.name`. |
| `def` | Methods use `self` as a receiver; `Self` appears in types and `where`. |
| `None` | The other literal keyword that names a type (`NoneType`). |
| `where` | `Self` conditions appear in `where` clauses and conformance lists. |

## Signature vs. body

`Self` appears in **both**:

- In **signatures**: argument types (`copy: Self`), return types (`-> Self`),
  `where` clauses (`Self.T == Int`), and conformance lists.
- In **bodies**: field and argument types (`var first: Self.T`), `comptime`
  member expressions, and value positions such as `Self(0.0, 0.0)`.

`Self` is valid only inside a struct or trait declaration (and the declarations
it contains); it has no meaning at module scope.

## Pitfalls

- **Writing `Self` where `self` is meant, or vice versa.** `def f(Self)` is not a
  receiver declaration; `def f(self) -> self` uses a name, not a type.
- **Bare `T` inside a struct body.** Struct parameters are not in scope under
  their bare names; use `Self.T`. Source:
  <https://mojolang.org/docs/reference/struct-declarations/>.
- **Declaring a custom `self` type.** No longer allowed; use a `where` clause on
  `Self`. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Forgetting `mut` on `self` when mutating.** The default receiver is an
  immutable reference. Source:
  <https://mojolang.org/docs/reference/keywords/>.
- **Assuming `Self` in a trait means the trait.** It means the conforming type.
  Source: <https://mojolang.org/docs/reference/trait-declarations/>.
- **Using `Self` at module scope.** It denotes an enclosing type; there is none.
- **Confusing `Self` with the type's name.** `Self` is preferable in factory
  methods and `comptime` members because it tracks parameters automatically.
- **Naming a parameter or field `Self`.** It is a reserved keyword; use an
  escaped identifier if a name is truly required. Source:
  <https://mojolang.org/docs/reference/keywords/>.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`struct`](struct.md), [`trait`](trait.md),
[`comptime`](comptime.md), [`None`](none.md),
[`where`](../keyword-conventions/where.md), [`literals`](../reference/literals.md),
[`struct-declarations`](../reference/struct-declarations.md),
[`trait-declarations`](../reference/trait-declarations.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Mojo struct declarations reference:
  <https://mojolang.org/docs/reference/struct-declarations/>
- Mojo trait declarations reference:
  <https://mojolang.org/docs/reference/trait-declarations/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Structs (manual): <https://mojolang.org/docs/manual/structs/>
- Traits (manual): <https://mojolang.org/docs/manual/traits/>
- Parameterization (manual): <https://mojolang.org/docs/manual/parameters/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
