# None

`None` is the literal that represents the absence of a value. It is the only
value of the type `NoneType`, and it is also what a function implicitly returns
when it has no return value.

## Purpose

The official keywords reference defines `None` in one line as a table row with
its value:

> | `None` | Absence of a value (`NoneType`) |

and groups it under **Literal keywords**:

> These keywords are also literals. They produce a value directly.

Source: <https://mojolang.org/docs/reference/keywords/>.

> `None` represents the absence of a value. It's the only value of type
> `NoneType`.

```mojo
var x: NoneType = None
```

Source: <https://mojolang.org/docs/reference/literals/>.

## `NoneType`

Like `Int` and `String`, `NoneType` is a type, not a language primitive: the
types manual lists it among the types that "aren't defined as structs":

> `NoneType` is a type with one instance, the `None` object, which is used to
> signal "no value."

Source: <https://mojolang.org/docs/manual/types/>.

`NoneType` is the type; `None` is its single value.

## Case sensitivity

> `None` is a keyword; `none` is not.

Source: <https://mojolang.org/docs/reference/keywords/>.

Lowercase `none` is not the literal.

## `None` as the implicit function result

This is one of the most consequential facts about `None` in Mojo:

> A function without an explicit return type returns `None`. These two
> declarations are equivalent:

```mojo
def greet():
    print("hello")

def greet() -> None:
    print("hello")
```

Source: <https://mojolang.org/docs/reference/literals/>.

And:

> A function without an explicit `return` implicitly returns `None`.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

A bare `return` also produces `None`:

```mojo
def greet(name: String):
    if not name:   # String is falsy when empty
        return
    print(t"Hello, {name}!")
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

Because `None` is the "no result" value, it is used as the *result* of
side-effecting functions — which is why the compound-statements reference can
say `x > 0 and print("positive")` is an error "because `None` isn't truthy".
Source: <https://mojolang.org/docs/reference/compound-statements/>.

## `None` versus `Optional`

`None` is the empty state of an `Optional`, but it is not a member of every
`Optional`'s element type:

```mojo
# Two ways to initialize an Optional with no value
var opt3 = Optional[Int]()
var opt4: Optional[Int] = None
```

Source: <https://mojolang.org/docs/manual/types/>.

> An `Optional` evaluates as `True` when it holds a value, `False` otherwise. If
> the `Optional` holds a value, you can retrieve a reference to the value using
> the `value()` method. But calling `value()` on an `Optional` with no value
> results in undefined behavior, so you should always guard a call to `value()`
> inside a conditional that checks whether a value exists.

Source: <https://mojolang.org/docs/manual/types/>.

The documented checks are a truthiness test or an identity test:

```mojo
var opt: Optional[String] = "Testing"
if opt:
    var value_ref = opt.value()
    print(value_ref)
```

```mojo
var opt: Optional[Int] = None
if opt is None:
    print("No value")
```

Sources: <https://mojolang.org/docs/manual/types/>,
<https://mojolang.org/docs/manual/operators/>.

`None` is also what `Optional.or_else()` replaces:

```mojo
var custom_greeting: Optional[String] = None
print(custom_greeting.or_else("Hello"))  # Hello
```

Source: <https://mojolang.org/docs/manual/types/>.

## `None` and truthiness

> Types that conform to `Boolable` have a truth value, so they can be used
> directly in boolean expressions and `if` conditions. The rules are
> predictable: zero, empty strings, empty collections, and `None` are falsy.
> Everything else is truthy.

Source: <https://mojolang.org/docs/manual/operators/>.

So `None` is falsy. But note that `None` and `False` are different values of
different types: `None` is a `NoneType`, `False` is a `Bool`.

## `None` in the standard library

`None` appears in signatures where a value may be absent. One documented example
is the stack-trace accessor:

> You can bind the `Error` instance to a variable in the `except` clause and
> call its `get_stack_trace()` method to get the stack trace as an
> `Optional[String]`. The method returns `None` if stack trace collection was
> disabled or unavailable:

```mojo
var stack_trace = e.get_stack_trace()
if stack_trace:
    print(stack_trace.value())
else:
    print("No stack trace available")
```

Source: <https://mojolang.org/docs/manual/errors/>.

The `Never` type discussion also uses `None` as a returned value in the
construction pattern:

```mojo
def create_list_opt[size: Int]() -> Optional[List[size]]:
    comptime if size < 0:
        return None
    return ...
```

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

## `NoneType` in type functions

A `NoneType` may be selected by a compile-time condition, which is the documented
replacement for the deprecated `ConditionalType` type function:

> Use the equivalent ternary expression instead:
> `comptime Storage = Int if cond else NoneType`.

Source: <https://mojolang.org/releases/v1.0.0/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `return` | A bare `return` and a missing `return` both produce `None`. |
| `is` | `is None` / `is not None` is the documented emptiness check. |
| `True`, `False` | The boolean literals; `None` is falsy but is a distinct value. |
| `def` | `-> None` is equivalent to omitting the return type. |
| `Self` | The other "literal keyword" that names a type rather than a plain value. |
| `if`, `while` | `None` is falsy, so `if value:` tests for presence. |
| `and`, `or`, `not` | Boolean operators require truthy values; `None` is falsy. |

## Signature vs. body

`None` is an expression and a literal. It appears:

- In **bodies** as a value (`return None`, `var x = None`).
- In **signatures** as a return type annotation: `def f() -> None`.
- As an element of parameterized types (`Optional[Int]`, `Optional[String]`).

It never declares a binding by itself.

## Pitfalls

- **Calling `value()` on an empty `Optional`.** Undefined behavior; guard with
  `if opt:` or `opt is None`. Source:
  <https://mojolang.org/docs/manual/types/>.
- **Assuming `None == False`.** They are distinct values of distinct types, even
  though both are falsy.
- **Writing `none`.** Not the keyword. Source:
  <https://mojolang.org/docs/reference/keywords/>.
- **Forgetting that an unannotated function returns `None`.** A missing return
  annotation is not "returns anything"; a caller cannot use a result that was
  never declared.
- **Using `None` as a nullable value where `Optional` is required.** Assigning
  `None` to a non-`Optional` variable of a concrete type does not compile;
  the type parameter must admit the empty state.
- **Expecting `None` to be printable as an empty string.** `NoneType` is the type
  whose `Writable` representation is "None"; use `Optional.otherwise()` or a
  conditional for display-specific formatting.
- **Truthiness as an emptiness test for value types.** For a `Bool` field, `if
  flag:` conflates "false" with "absent"; use `Optional[Bool]` when absence is a
  real state.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`is`](is.md), [`True`](true.md), [`False`](false.md),
[`return`](return.md), [`if`](if.md), [`literals`](../reference/literals.md),
[`optionals-and-nullability`](../types/optionals-and-nullability.md),
[`overview`](../types/overview.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Types (manual): <https://mojolang.org/docs/manual/types/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Errors, error handling, and context managers (manual):
  <https://mojolang.org/docs/manual/errors/>
- Comptime constraints and assertions (manual):
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
