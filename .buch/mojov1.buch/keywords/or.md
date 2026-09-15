# or

`or` is the word-spelled logical OR operator. It combines two boolean operands
and short-circuits: if the left operand is true, the right operand is not
evaluated at all.

## Purpose

The official keywords reference defines `or` in one line:

> `or` — Logical OR

Source: <https://mojolang.org/docs/reference/keywords/>.

Like `and`, `not`, `in` and `is`, `or` is one of the five keyword operators:
"Five operators are spelled as words rather than symbols. Symbolic operators
(`+`, `-`, `*`, `^`, `//`, etc.) are punctuation, not keywords." Source:
<https://mojolang.org/docs/reference/keywords/>.

> Boolean operators use words (`and`, `or`, `not`) instead of symbols like `&&`
> and `||`.

Source: <https://mojolang.org/docs/manual/operators/>.

```mojo
print(True or False)   # True
```

Source: <https://mojolang.org/docs/manual/operators/>.

## Result type and truthiness

`or` operates on boolean values. Types conforming to `Boolable` can be used
directly:

> Types that conform to `Boolable` have a truth value, so they can be used
> directly in boolean expressions and `if` conditions. The rules are
> predictable: zero, empty strings, empty collections, and `None` are falsy.
> Everything else is truthy.

Source: <https://mojolang.org/docs/manual/operators/>.

As with `and`, Mojo's `or` is not Python's: it produces a `Bool`, it does not
return the first truthy operand.

## Short-circuit evaluation

> The `and` and `or` operators stop as soon as the result is known. ... With
> `or`, if the left side is truthy, the right side is skipped.

Source: <https://mojolang.org/docs/manual/operators/>.

The control-flow manual demonstrates it:

```mojo
def true_func() -> Bool:
    print("Executing true_func")
    return True

def false_func() -> Bool:
    print("Executing false_func")
    return False

print('Short-circuit "or" evaluation')
if true_func() or false_func():
    print("True result")
```

```output
Short-circuit "or" evaluation
Executing true_func
True result
```

> If the first argument to an `or` operator evaluates to `True`, the second
> argument is not evaluated.

Source: <https://mojolang.org/docs/manual/control-flow/>.

Because `false_func()` never ran, its "Executing false_func" line is absent from
the output.

## Precedence and associativity

From the operator reference (higher binds tighter):

| Precedence | Operators | Notes |
|------------|-----------|-------|
| 11 | `not` | Boolean NOT, prefix |
| 12 | `and` | Boolean AND, short-circuits |
| 13 | `or` | Boolean OR, short-circuits |

Source: <https://mojolang.org/docs/reference/operators/>.

`or` is the **loosest** boolean operator: both `not` and `and` bind tighter.
`a or b and c` is therefore `a or (b and c)`; use parentheses if you mean
`(a or b) and c`. `or` associates left to right. Source:
<https://mojolang.org/docs/reference/operators/>.

Comparisons, membership and identity (precedence 10) bind tighter than `or`, so
`x == 1 or x == 2` groups as expected without parentheses.

## Typical uses

- Guards and fallbacks in conditions.
- Defaults in compile-time conditions, e.g. `comptime if is_gpu() or is_apple_silicon():`.
- Restricting allowed parameter values in a `where` clause. The
  function-declarations reference uses exactly this:

  ```mojo
  def process[n: Int](data: SIMD[DType.float32, n]) -> Float32 where (
      n == 1 or n == 2 or n == 4 or n == 8 or n == 16 or n == 32
  ):
      ...
  ```

  Source: <https://mojolang.org/docs/reference/function-declarations/>.

- The constraint system treats `A` as evidence for `A or B` for any `B`: a known
  proposition `A` satisfies a requirement of `A or B`. Source:
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `and` | The dual operator; tighter precedence, also short-circuits. |
| `not` | Prefix negation; tighter precedence than `or`. |
| `True`, `False` | The boolean literals `or` combines. |
| `if`, `while` | The usual places a boolean `or` expression is tested. |
| `comptime` | `comptime if` conditions may use `or`; `where` clauses use it for value sets. |
| `in`, `is` | Bind tighter than `or`. |

## Signature vs. body

`or` never appears in a signature. It is an expression operator, usable in
bodies, conditions, `where` clauses, `comptime` expressions and parameter
expressions.

## Pitfalls

- **Expecting Python semantics.** `or` does not return the first truthy operand;
  both operands are boolean and the result is a `Bool`.
- **Precedence mistakes with `and`.** `and` binds tighter, so mixed expressions
  may group differently from what you intended. Parenthesize.
- **Hidden side effects.** If a right-hand operand has a side effect, it runs
  only when the left is false — an intentional feature and an easy bug.
- **Using `||`.** Not Mojo; use `or`.
- **Over-broad `or` chains in `where` clauses.** `n == 1 or n == 2 or …` forces
  the caller to prove the whole disjunction; the constraint system's limited
  reasoning may demand explicit `comptime assert` evidence instead. Source:
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>.
- **Truthiness of `Optional`.** An `Optional` is truthy when it holds a value;
  `opt or default` is not a valid "unwrap with default" idiom — use
  `or_else()`. Source: <https://mojolang.org/docs/manual/types/>.
- **Confusing `or` with the bitwise `|`.** The word operator is logical; `|` is
  bitwise and has a different precedence (bitwise OR is tighter than
  comparisons).

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`and`](and.md), [`not`](not.md), [`True`](true.md),
[`False`](false.md), [`if`](if.md),
[`operators`](../basics/operators.md). `reference/operators` (planned) stays a
plain code span.

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo operator reference:
  <https://mojolang.org/docs/reference/operators/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Comptime constraints and assertions (manual):
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>
