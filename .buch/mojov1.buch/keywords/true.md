# True

`True` is the boolean true literal. It is the value of type `Bool` that
represents a true condition, and it is one of the four literal keywords.

## Purpose

The official keywords reference defines `True` in one line — as a table row with
its value:

> | `True` | boolean true |

and groups it under **Literal keywords**:

> These keywords are also literals. They produce a value directly.

Source: <https://mojolang.org/docs/reference/keywords/>.

The literals reference:

> `True` and `False` represent boolean truth values.

```mojo
var x = True
var y = False
```

Source: <https://mojolang.org/docs/reference/literals/>.

## Case sensitivity

`True` is a keyword; `true` is not. The reference is explicit:

> All keywords are case-sensitive:
>
> - `True` is a keyword; `true` is not.
> - `None` is a keyword; `none` is not.
> - `Self` is a keyword; `self` is a conventional argument name, not a keyword.

Source: <https://mojolang.org/docs/reference/keywords/>.

So `true` used as a literal is not the keyword; lowercase spellings are ordinary
identifiers and are not defined by the language.

## Type: `Bool`

`True` is a value of the `Bool` type:

> Mojo's `Bool` type represents a boolean value. It can take one of two values,
> `True` or `False`. You can negate a boolean value using the `not` operator.

```mojo
var conditionA = False
var conditionB: Bool
conditionB = not conditionA
print(conditionA, conditionB)
```

```output
False True
```

Source: <https://mojolang.org/docs/manual/types/>.

## Where `True` is used

- As a boolean condition, either directly (`while True:`) or as part of an
  expression.
- As the operand or result of the boolean operators `and`, `or`, `not`.
- As a value returned from a predicate function.
- As a value stored in a `Bool` field or `Optional[Bool]`.

```mojo
def is_positive(value: Int) -> Bool:
    if value > 0:
        return True
    return False
```

The infinite loop idiom:

```mojo
while True:
    var item = get_next()
    if item is None:
        break       # Exit loop if no more items
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## `True` and truthiness

`True` is the canonical truthy value; every value with a boolean interpretation
compares against it through the `Boolable` trait:

> Types that conform to `Boolable` have a truth value, so they can be used
> directly in boolean expressions and `if` conditions. The rules are
> predictable: zero, empty strings, empty collections, and `None` are falsy.
> Everything else is truthy.

Source: <https://mojolang.org/docs/manual/operators/>.

Note that `True` is not the same thing as "non-empty": other types are truthy
without being equal to `True` as a value. `True` is a `Bool` literal, not a
generic truth marker.

## `True` in conditions vs. as a value

Mojo's boolean operators require boolean operands, not arbitrary values used as
shortcuts. The compound-statements reference names the failure mode:

```mojo
x > 0 and print("positive")  # Error because 'None' isn't truthy
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

This is not Python: there is no implicit coercion of arbitrary values into a
boolean result by the `and`/`or` operators.

## Constant folding

`1 == 1` folds to `True` at compile time:

> Certain primitive operations on constants can be canonicalized into a new
> constant. For example:
>
> - `1 + 1` == `2`
> - `4 % 2` == `0`
> - `1 == 1` == `True`

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `False` | The only other `Bool` value. |
| `and`, `or`, `not` | The boolean operators that consume and produce `True`/`False`. |
| `if`, `while` | The statements whose conditions are boolean expressions. |
| `None` | A literal keyword whose value is *falsy* but is **not** `False` and not equal to `True`. |
| `Self` | The other uppercase literal keyword; unlike `True`, it names a type. |
| `assert` | A failing `assert` condition is exactly "the condition evaluated to `False`". |
| `comptime` | `comptime if True:` is a legal compile-time branch condition. |

## Signature vs. body

`True` never appears in a signature as a declaration. It is a literal
**expression**, usable in bodies, conditions, parameter expressions, `comptime`
expressions and `where` clauses.

## Pitfalls

- **Writing `true`.** Lowercase `true` is not the keyword. Source:
  <https://mojolang.org/docs/reference/keywords/>.
- **Assuming `True` and `1` are interchangeable.** They are different values of
  different types; some APIs require a `Bool`, not an integer. An `Int` can be
  converted explicitly, and `Bool` no longer conforms to `Indexer`. Source:
  <https://mojolang.org/releases/v0.26.2/>.
- **Comparing floats to `True`/`False`.** Boolean literals say nothing about
  float comparisons; remember that `nan == nan` is `False`. Source:
  <https://mojolang.org/docs/reference/numeric-types/>.
- **Using `True` as a sentinel.** For "no value", `None` and `Optional` are the
  documented mechanism, not a boolean flag.
- **Expecting `and`/`or` to return an operand.** Mojo's operators yield `Bool`;
  the Python idiom `x or True` does not carry `x`'s value.
- **Storing `True` where a sized integer is meant.** Use a sized type such as
  `UInt8`/`Int8` for bit flags; `Bool` is its own type.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`False`](false.md), [`None`](none.md), [`Self`](self.md),
[`and`](and.md), [`or`](or.md), [`not`](not.md),
[`literals`](../reference/literals.md),
[`bool-and-strings`](../types/bool-and-strings.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Types (manual): <https://mojolang.org/docs/manual/types/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Comptime constraints and assertions (manual):
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>
- Mojo numeric types reference:
  <https://mojolang.org/docs/reference/numeric-types/>
- Mojo v0.26.2 release notes: <https://mojolang.org/releases/v0.26.2/>
