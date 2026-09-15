# and

`and` is the word-spelled logical AND operator. It combines two boolean
operands and short-circuits: if the left operand is false, the right operand is
not evaluated at all.

## Purpose

The official keywords reference defines `and` in one line:

> `and` — Logical AND

Source: <https://mojolang.org/docs/reference/keywords/>.

The keywords reference groups the five word operators together:

> Five operators are spelled as words rather than symbols. Symbolic operators
> (`+`, `-`, `*`, `^`, `//`, etc.) are punctuation, not keywords.

Source: <https://mojolang.org/docs/reference/keywords/>.

The operators manual explains the spelling choice:

> Boolean operators use words (`and`, `or`, `not`) instead of symbols like `&&`
> and `||`.

Source: <https://mojolang.org/docs/manual/operators/>.

```mojo
print(True and False)   # False
```

Source: <https://mojolang.org/docs/manual/operators/>.

## Result type and truthiness

`and` is a boolean operator: its operands must have a boolean interpretation.
Types conforming to `Boolable` can be used directly:

> Types that conform to `Boolable` have a truth value, so they can be used
> directly in boolean expressions and `if` conditions. The rules are
> predictable: zero, empty strings, empty collections, and `None` are falsy.
> Everything else is truthy.

Source: <https://mojolang.org/docs/manual/operators/>.

This is not Python: Mojo's `and` does not return the last operand. A shortcut
like `x > 0 and print("positive")` is an error "because `None` isn't truthy" —
the operator expects a boolean, not a statement. Source:
<https://mojolang.org/docs/reference/compound-statements/>.

## Short-circuit evaluation

This is the defining property:

> The `and` and `or` operators stop as soon as the result is known. With `and`,
> if the left side is falsy, the right side isn't evaluated.

Source: <https://mojolang.org/docs/manual/operators/>.

The control-flow manual shows it with side effects:

```mojo
def true_func() -> Bool:
    print("Executing true_func")
    return True

def false_func() -> Bool:
    print("Executing false_func")
    return False

print('Short-circuit "and" evaluation')
if false_func() and true_func():
    print("True result")
```

```output
Short-circuit "and" evaluation
Executing false_func
```

> If the first argument to an `and` operator evaluates to `False`, the second
> argument is not evaluated.

Source: <https://mojolang.org/docs/manual/control-flow/>.

Short-circuiting "is useful when the right side has side effects or is expensive
to compute". Source: <https://mojolang.org/docs/manual/operators/>.

The classic use is guarding an expression that would be invalid on its own:

```mojo
def main():
    var value = 0
    if value != 0 and 100 // value > 5:
        print("safe")
```

Here the division is only reached when `value` is non-zero.

## Precedence and associativity

From the operator reference's precedence table (higher binds tighter):

| Precedence | Operators | Notes |
|------------|-----------|-------|
| 11 | `not` | Boolean NOT, prefix |
| 12 | `and` | Boolean AND, short-circuits |
| 13 | `or` | Boolean OR, short-circuits |

Source: <https://mojolang.org/docs/reference/operators/>.

So `not` binds tighter than `and`, and `and` binds tighter than `or`. That makes
`a or b and c` group as `a or (b and c)`. `and` associates left to right — the
reference notes that "Unless noted, operators associate left to right", and `and`
is not one of the two exceptions (exponentiation and the ternary operator).
Source: <https://mojolang.org/docs/reference/operators/>.

Comparisons bind tighter than `and` (comparison precedence 10, `and` 12), so
`x > 0 and y > 0` needs no parentheses. When grouping is not obvious, use
parentheses: the manual notes that they "cost nothing at runtime and make your
intent clear". Source: <https://mojolang.org/docs/manual/operators/>.

## Chained comparisons are not `and`

Comparison operators chain with each other, not with `and`:

```mojo
a < b < c        # equivalent to: (a < b) and (b < c)
```

Source: <https://mojolang.org/docs/reference/operators/>.

The chaining is a property of the comparison operators themselves (each
intermediate value is evaluated once); writing `and` explicitly would evaluate
the middle operand twice.

## `and` in compile-time conditions

`and` works in `comptime if` conditions and `where` clauses, because those
conditions are compile-time boolean expressions:

```mojo
comptime if size_of[Int]() == 8 and is_little_endian():
    ...
```

The constraint system also understands a limited amount of boolean structure: a
known proposition of the form `A and B` satisfies a requirement of `A` alone, or
of `B` alone. Source:
<https://mojolang.org/docs/manual/metaprogramming/constraints/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `or` | The dual operator; looser precedence, also short-circuits. |
| `not` | Prefix negation; tighter precedence than `and`. |
| `True`, `False` | The boolean literals `and` combines. |
| `if`, `while` | The usual places a boolean `and` expression is tested. |
| `comptime` | `comptime if` conditions may use `and` at compile time. |
| `in`, `is` | Membership/identity operators at comparison precedence, so they bind tighter than `and`. |

## Signature vs. body

`and` never appears in a signature. It is an expression operator usable in any
expression context: bodies, conditions, `where` clauses, `comptime` expressions,
and compile-time parameter expressions.

## Pitfalls

- **Expecting Python semantics.** In Python `a and b` returns one of the
  operands; in Mojo both operands must be boolean, and the result is a `Bool`.
  A statement on the right is an error. Source:
  <https://mojolang.org/docs/reference/compound-statements/>.
- **Missing short-circuit side effects.** If the right operand is expensive or
  has side effects, remember it may not run. This is often the point, but it is
  a bug when you relied on the call happening.
- **Mixing `and`/`or` without parentheses.** `and` binds tighter than `or`, so
  `a or b and c` is `a or (b and c)`, not `(a or b) and c`. Add parentheses.
- **Using `&&`.** Not Mojo; use `and`.
- **Truthiness surprises.** Empty collections and empty strings are falsy, so
  `if items and items[0] > 0` may skip the second check for legitimate empty
  input.
- **Using `and` as a value.** It is an operator, not a function; it cannot be
  passed around.
- **Comparing floats inside `and`.** `==` on floats is unreliable; use
  `isclose()`. Source: <https://mojolang.org/docs/manual/operators/>.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`or`](or.md), [`not`](not.md), [`True`](true.md),
[`False`](false.md), [`if`](if.md), [`while`](while.md),
[`operators`](../basics/operators.md). `reference/operators` (planned) stays a
plain code span; the operator reference is covered by
[`basics/operators.md`](../basics/operators.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo operator reference:
  <https://mojolang.org/docs/reference/operators/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Comptime constraints and assertions (manual):
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>
