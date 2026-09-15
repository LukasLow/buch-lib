# else

`else` is the default branch: it supplies the code that runs when no other
branch applies. In Mojo it has four distinct uses — an `if` chain, a loop
(`for` and `while`), a `try` statement, and the conditional (ternary)
expression.

## Purpose

The official keywords reference defines `else` in one line:

> `else` — Default branch in conditionals or loops

Source: <https://mojolang.org/docs/reference/keywords/>.

The reference's compound-statements page and the errors manual show where the
keyword actually appears. This page covers **the construct**, not just the
token: all four positions `else` can occupy.

## Use 1 — the `else` clause of an `if` chain

```text
if condition:
    body
elif condition:
    body
else:
    body
```

> The `else` block runs if no condition is true.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

```mojo
var temp_celsius = 25
if temp_celsius <= 0:
    print("It is freezing.")
elif temp_celsius < 20:
    print("It is cool.")
elif temp_celsius < 30:
    print("It is warm.")
else:
    print("It is hot.")
```

```output
It is warm.
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

An `if` without any `elif` may still use `else`:

```mojo
def main():
    var temp_celsius = Float64(25)
    if temp_celsius > 20:
        print("It is warm.")
    else:
        print("It is not warm.")
```

## Use 2 — the `else` clause of a `for` loop

A `for` loop may carry an `else` clause that runs after the loop finished
iterating normally:

```mojo
for i in range(5):
    print(i, end=", ")
else:
    print("\nFinished executing 'for' loop")
```

```output
0, 1, 2, 3, 4,
Finished executing 'for' loop
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

The clause runs **even if the iterable was empty**:

```mojo
from std.collections import List

var empty: List[Int] = []
for i in empty:
    print(i)
else:
    print("Finished executing 'for' loop")
```

```output
Finished executing 'for' loop
```

And it does **not** run when `break` (or `return`) leaves the loop early:

> The `else` clause does *not* execute if a `break` or `return` statement
> terminates the `for` loop.

Source: <https://mojolang.org/docs/manual/control-flow/>.

```mojo
var animals = ["cat", "aardvark", "hippopotamus", "dog"]
for animal in animals:
    if animal == "dog":
        print("Found a dog")
        break
else:
    print("No dog found")
```

```output
Found a dog
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

The compound-statements reference states the same rule in one line: "An
optional `else` clause runs when the loop exits normally. It does not run if the
loop exits with `break`", and notes that "Both `for` and `while` loops support
`else`." Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Use 3 — the `else` clause of a `while` loop

`while` supports `else` with the same break-sensitive rule:

```mojo
var n = 5

while n < 4:
    print(n)
    n += 1
else:
    print("Loop completed")
```

```output
Loop completed
```

> The `else` clause does *not* execute if a `break` or `return` statement exits
> the `while` loop.

Source: <https://mojolang.org/docs/manual/control-flow/>.

```mojo
var n = 0
while n < 5:
    n += 1
    if n == 3:
        break
    print(n)
else:
    print("Executing else clause")
```

```output
1
2
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

## Use 4 — the `else` clause of a `try` statement

`try`/`except`/`else`/`finally` is the other construct that gives a branch to
`else`: it runs only when the `try` block finished **without** raising.

```mojo
try:
    operation()
except e:
    handle_error(e)   # Runs if an error occurs
else:
    on_success()      # Runs only if no error occurred
finally:
    cleanup()         # Always runs
```

Execution order, quoted from the reference:

1. The `try` block runs first.
1. If an error occurs, the matching `except` block runs.
1. If no error occurs, the `else` block (if present) runs after the `try` block.
1. If included, a `finally` block always runs last.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

The errors manual adds an important interaction with the loop-control keywords:
the `else` clause is *skipped* if the `try` block exits via `continue`, `break`,
or `return`. Source: <https://mojolang.org/docs/manual/errors/>.

Also note that `else` is optional in a `try` statement, while at least one of
`except` and `finally` is required: "You must include one or both of `except`
and `finally`." Source: <https://mojolang.org/docs/manual/errors/>.

## Use 5 — the `else` of the conditional expression

Inside an expression, `else` pairs with `if` to form the ternary operator:

```mojo
var temp_celsius = 15
var forecast = "warm" if temp_celsius > 20 else "cool"
print("The forecast for today is", forecast)
```

```output
The forecast for today is cool
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

The expression form is right-associative and can be chained, and its `else`
branch is *not* a block — it is a single expression. Source:
<https://mojolang.org/docs/reference/expressions/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `if` | The chain that owns the first three uses; `else` cannot appear alone. |
| `elif` | Sits between `if` and `else` in a chain. |
| `for`, `while` | Loop constructs that accept an `else` clause. |
| `break`, `return` | Leaving the loop through either suppresses the loop `else`. |
| `continue`, `break`, `return` | Leaving a `try` block through any of them skips its `else`. |
| `try`, `except`, `finally` | The error-handling construct whose optional success branch is `else`. |

## Signature vs. body

`else` never appears in a signature. In statements it is always the final clause
of its construct; in the conditional expression it separates the two result
values. `else` bodies (in `if`, loops, and `try`) each introduce a new scope.

## Pitfalls

- **The loop-`else` trap.** `else` on a `for`/`while` does *not* mean "run only
  if the loop had zero iterations", and it does *not* mean "run after a break".
  It means "run after normal termination". Using `break` to end the search
  suppresses it, which is exactly why the idiom works for "not found" messages.
  Verified above.
- **`for … else` without a `break`.** If no path in the body breaks, the `else`
  always runs — including for empty iterables. Do not write it expecting it to
  be conditional.
- **`else` on `try` is skipped by loop control.** A `continue` inside `try`
  jumps to the next iteration and skips both `except` and `else`; only `finally`
  runs. Source: <https://mojolang.org/docs/manual/errors/>.
- **`else` is not a statement on its own.** It must follow `if`/`elif`, a loop
  header, a `try` block, or the `if` of a conditional expression.
- **`else` in an expression is not a block.** In the ternary form the branch is
  one expression; `pass` is not an expression and cannot be used there
  (`print("x") if cond else pass` is an error). Source:
  <https://mojolang.org/docs/reference/compound-statements/>.
- **Indentation.** Every `else` clause is dedented back to the level of its
  `if`/`for`/`while`/`try` header.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`if`](if.md), [`elif`](elif.md), [`for`](for.md),
[`while`](while.md), [`break`](break.md), [`try`](try.md), [`except`](except.md),
[`finally`](finally.md), [`control-flow`](../basics/control-flow.md),
[`compound-statements`](../reference/compound-statements.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Mojo expression reference:
  <https://mojolang.org/docs/reference/expressions/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Errors, error handling, and context managers (manual):
  <https://mojolang.org/docs/manual/errors/>
