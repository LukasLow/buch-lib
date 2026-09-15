# not

`not` is the word-spelled logical NOT operator. It is a prefix unary operator
that negates a boolean value.

## Purpose

The official keywords reference defines `not` in one line:

> `not` — Logical NOT

Source: <https://mojolang.org/docs/reference/keywords/>.

It is one of the five keyword operators, "spelled as words rather than symbols".
Source: <https://mojolang.org/docs/reference/keywords/>.

> Boolean operators use words (`and`, `or`, `not`) instead of symbols like `&&`
> and `||`.

Source: <https://mojolang.org/docs/manual/operators/>.

```mojo
print(not True)   # False
```

Source: <https://mojolang.org/docs/manual/operators/>.

The types manual shows the same operator used to invert a variable:

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

## Syntax and placement

`not` is a **prefix** operator: it goes immediately before its operand.

```text
not expression
```

It is not an infix operator and cannot be used between two operands. There is no
`not in` and `not is` token pair — the membership and identity negations are
spelled `not in` and `is not` respectively (see the two entries below).

## Precedence

From the operator reference (higher binds tighter):

| Precedence | Operators | Notes |
|------------|-----------|-------|
| 10 | `==` `!=` `<` `<=` `>` `>=` | Comparisons |
| 10 | `in` `not in` | Membership |
| 10 | `is` `is not` | Identity |
| 11 | `not` | Boolean NOT, prefix |
| 12 | `and` | Boolean AND, short-circuits |
| 13 | `or` | Boolean OR, short-circuits |

Source: <https://mojolang.org/docs/reference/operators/>.

So `not` binds **looser** than comparisons and membership/identity checks, and
**tighter** than `and` and `or`. This is convenient:

```mojo
not x == y          # parses as: not (x == y)
not x in items      # parses as: not (x in items)
not a and not b     # parses as: (not a) and (not b)
```

The manual's quick summary also lists the boolean order: "boolean logic (`not`
before `and` before `or`)". Source:
<https://mojolang.org/docs/manual/operators/>.

The `not in` and `is not` spellings are listed in the precedence table as
comparison-precedence (10) operators, so they bind tighter than a preceding
`not`. Source: <https://mojolang.org/docs/reference/operators/>.

## Negating membership and identity

The natural negations of the other word operators have dedicated spellings:

```mojo
var colors = ["red", "green", "blue"]
print("yellow" not in colors)   # True

var opt: Optional[Int] = None
if opt is not None:
    print("Has a value")
```

Sources: <https://mojolang.org/docs/manual/operators/>,
<https://mojolang.org/docs/reference/operators/>.

The operator reference lists them explicitly:

| Operator | Method | Trait | Default? |
|----------|--------|-------|----------|
| `is` | `__is__()` | `Identifiable` | No |
| `is not` | `__isnot__()` | `Identifiable` | Yes |
| `in` | `__contains__()` | — | No |
| `not in` | `__contains__()` | — | No |

and notes that "`not in` calls the same method and negates the result". Source:
<https://mojolang.org/docs/reference/operators/>.

## Truthiness

`not` operates on any value with a boolean interpretation. Types conforming to
`Boolable` can be used directly:

> Types that conform to `Boolable` have a truth value, so they can be used
> directly in boolean expressions and `if` conditions. The rules are
> predictable: zero, empty strings, empty collections, and `None` are falsy.
> Everything else is truthy.

Source: <https://mojolang.org/docs/manual/operators/>.

That makes idioms such as the following work:

```mojo
def greet(name: String):
    if not name:   # String is falsy when empty
        return
    print(t"Hello, {name}!")
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

The errors manual uses the same pattern for validation:

```mojo
def open_file(path: String) raises FileError -> String:
    if not path:
        raise FileError.not_found
    ...
```

Source: <https://mojolang.org/docs/manual/errors/>.

## `not` at compile time

`not` works in compile-time conditions and in the constraint system, where it
participates in canonicalization:

> - `x >= 2` == `not (x < 2)`

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

This means a `where` clause written with `not` may be recognized as identical to
one written with the complementary comparison.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `and` | Looser than `not`; a `not` operand binds first. |
| `or` | Loosest of the three. |
| `in` | `not in` is the negated membership spelling. |
| `is` | `is not` is the negated identity spelling. |
| `True`, `False` | `not True` is `False` and vice versa. |
| `if`, `while` | Common contexts for a negated condition. |
| `comptime` | `not` may appear in `comptime if` and `where` conditions. |

## Signature vs. body

`not` never appears in a signature. It is a prefix expression operator usable in
bodies, conditions, `where` clauses, `comptime` expressions, and parameter
expressions.

## Pitfalls

- **Using `!`.** Not Mojo; `!` is not the logical NOT operator. Mojo's `!` is
  the inequality operator when doubled (`!=`), and there is no prefix `!`.
- **Assuming `not` binds tighter than comparisons.** It does not: `not x == y` is
  `not (x == y)`, which is usually what you want, but it is worth knowing
  explicitly.
- **`not a in b`.** This parses as `not (a in b)` because `in` binds tighter. The
  idiomatic spelling is nevertheless `a not in b`; use it for clarity.
- **Negating a non-boolean.** The operand must have a boolean interpretation;
  truthiness rules apply.
- **Double negation confusion.** `not not x` is valid but rarely what you mean.
- **Confusing `not` with bitwise `~`.** `~x` inverts bits of an integer;
  `not x` negates a boolean.
- **Precedence with `and`/`or`.** `not a and b` is `(not a) and b`, not
  `not (a and b)`; add parentheses when in doubt. Source:
  <https://mojolang.org/docs/manual/operators/>.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`and`](and.md), [`or`](or.md), [`in`](in.md), [`is`](is.md),
[`True`](true.md), [`False`](false.md),
[`operators`](../basics/operators.md). `reference/operators` (planned) stays a
plain code span.

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo operator reference:
  <https://mojolang.org/docs/reference/operators/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Types (manual): <https://mojolang.org/docs/manual/types/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Errors, error handling, and context managers (manual):
  <https://mojolang.org/docs/manual/errors/>
- Comptime constraints and assertions (manual):
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>
