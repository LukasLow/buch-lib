# False

`False` is the boolean false literal. It is the value of type `Bool` that
represents a false condition, and it is one of the four literal keywords.

## Purpose

The official keywords reference defines `False` in one line — as a table row
with its value:

> | `False` | boolean false |

and groups it under **Literal keywords**:

> These keywords are also literals. They produce a value directly.

Source: <https://mojolang.org/docs/reference/keywords/>.

> `True` and `False` represent boolean truth values.

```mojo
var x = True
var y = False
```

Source: <https://mojolang.org/docs/reference/literals/>.

## Case sensitivity

All keywords are case-sensitive, and the reference names `True`/`true` as the
example: "`True` is a keyword; `true` is not." The same rule applies to `False`.
Source: <https://mojolang.org/docs/reference/keywords/>.

## Type: `Bool`

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

## Where `False` is used

- As a default in a boolean variable that is later set:

```mojo
var found = False
for item in items:
    if item == target:
        found = True
        break
else:
    print("not found")  # Only runs if break was never hit
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

- As the result of a predicate that did not hold.
- As the default value of an optional boolean argument:

```mojo
def greet(name: String, loud: Bool = False):
    print(t"Hello, {name if not loud else name.upper()}!")
```

Source: <https://mojolang.org/docs/reference/expressions/>.

- As the comparison result when a condition is not met (`10 != 10` is `False`).
  Source: <https://mojolang.org/docs/manual/operators/>.

## `False` and truthiness

The general truthiness rules are about values that are not `False`:

> Types that conform to `Boolable` have a truth value, so they can be used
> directly in boolean expressions and `if` conditions. The rules are
> predictable: zero, empty strings, empty collections, and `None` are falsy.
> Everything else is truthy.

Source: <https://mojolang.org/docs/manual/operators/>.

So `0`, `""`, an empty collection and `None` are *falsy* — but they are not the
`Bool` value `False`, and they are not equal to it. Only `Bool` has the values
`True` and `False`.

## Constant folding

`False` can be the result of compile-time folding:

> - `4 % 2` == `0`
> - `1 == 1` == `True`

The same mechanism folds a comparison that does not hold to `False`. Source:
<https://mojolang.org/docs/manual/metaprogramming/constraints/>.

## The `Optional` special case

An `Optional` is *falsy* when empty, but its empty state is the value `None`, not
`False`:

```mojo
var opt4: Optional[Int] = None
```

> An `Optional` evaluates as `True` when it holds a value, `False` otherwise.

Source: <https://mojolang.org/docs/manual/types/>.

The documented tests for emptiness are `if opt:` and `opt is None`; see
[`None`](none.md) and [`is`](is.md).

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `True` | The only other `Bool` value; `not False` is `True`. |
| `and`, `or`, `not` | Boolean operators that consume and produce `False`. |
| `if`, `while` | Statements whose conditions are boolean expressions. |
| `None` | A falsy value that is **not** `False`. |
| `Self` | The other uppercase literal keyword; unlike `False`, it names a type. |
| `assert` | A failing assertion condition is one that evaluated to `False`. |
| `break`, `else` | The `found = False` / `break` / loop-`else` search idiom uses `False` as a starting state. |

## Signature vs. body

`False` never appears in a signature as a declaration. It is a literal
**expression**, usable in bodies, conditions, default argument values, `comptime`
expressions and `where` clauses.

## Pitfalls

- **Writing `false`.** Lowercase `false` is not the keyword.
- **Treating falsy as "equal to `False`".** An empty `String`, a zero `Int`, and
  `None` are falsy but are not `Bool` values. Comparisons such as `"" == False`
  are not the intended test; use the value's own condition or an explicit check.
- **Comparing floats to `False`.** `nan == nan` is `False`, so boolean results
  from float comparisons need care. Source:
  <https://mojolang.org/docs/reference/numeric-types/>.
- **Initialising a flag with the wrong default.** `var found = False` before a
  search is a pattern, but forgetting to set it to `True` produces a wrong
  "not found" branch.
- **Expecting `and`/`or` to return an operand.** Both yield `Bool`; the result is
  `True` or `False`, never the operand itself.
- **Using `False` as an integer.** `Bool` and integer types are distinct; convert
  explicitly where a numeric value is required.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`True`](true.md), [`None`](none.md), [`and`](and.md),
[`or`](or.md), [`not`](not.md), [`is`](is.md),
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
- Mojo expression reference:
  <https://mojolang.org/docs/reference/expressions/>
- Comptime constraints and assertions (manual):
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>
- Mojo numeric types reference:
  <https://mojolang.org/docs/reference/numeric-types/>
