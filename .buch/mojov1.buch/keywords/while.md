# while

`while` repeats a body as long as a condition stays true. It is Mojo's
conditional loop, and the loop that any custom iterable ultimately desugars to.

## Purpose

The official keywords reference defines `while` in one line:

> `while` — Conditional loop

Source: <https://mojolang.org/docs/reference/keywords/>.

> The `while` loop repeats its body while a condition is true.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

```mojo
var count = 0
while count < 10:
    print(count)
    count += 1
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Syntax

```text
while condition:
    body
while condition:
    body
else:
    body
```

The header ends with `:`, the body is indented, and an optional `else` clause
runs when the loop's condition becomes false. Source:
<https://mojolang.org/docs/reference/compound-statements/>.

The classic Fibonacci example shows the condition doing the bounding work:

```mojo
var fib_prev = 0
var fib_curr = 1

print(fib_prev, end="")
while fib_curr < 50:
    print(",", fib_curr, end="")
    fib_prev, fib_curr = fib_curr, fib_prev + fib_curr
```

```output
0, 1, 1, 2, 3, 5, 8, 13, 21, 34
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

## Condition truthiness

The condition is a boolean expression. A value with a boolean interpretation may
be used directly; the operators manual states the general rule:

> Types that conform to `Boolable` have a truth value, so they can be used
> directly in boolean expressions and `if` conditions. The rules are
> predictable: zero, empty strings, empty collections, and `None` are falsy.
> Everything else is truthy.

Source: <https://mojolang.org/docs/manual/operators/>.

`while True:` is the standard infinite-loop spelling, exited with `break`:

```mojo
while True:
    var item = get_next()
    if item is None:
        break        # Exit loop if no more items
    if not is_valid(item):
        continue     # Skip invalid items
    process(item)    # Only runs for valid items
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## `break` and `continue`

> A `continue` statement skips execution of the rest of the code block and
> resumes with the loop test expression.
>
> A `break` statement terminates execution of the loop.

```mojo
var n = 0
while n < 5:
    n += 1
    if n == 3:
        continue
    print(n, end=", ")
```

```output
1, 2, 4, 5,
```

```mojo
var n = 0
while n < 5:
    n += 1
    if n == 3:
        break
    print(n, end=", ")
```

```output
1, 2,
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

Note the difference from `for`: `continue` in a `while` resumes at the test
expression, not at a "next element" step. If the loop has no progress statement
that `continue` reaches, an accidentally infinite loop is easy to write.

## The `else` clause

`while` accepts an optional `else` clause:

> Optionally, a `while` loop can include an `else` clause. The body of the
> `else` clause executes when the loop's boolean condition evaluates to `False`,
> even if it occurs the first time tested.

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

Both `for` and `while` support `else`. Source:
<https://mojolang.org/docs/reference/compound-statements/>.

## Interaction with `for`

The two loop forms are closely related. A `for` loop is defined in terms of
`while`:

> To support iteration, a sequence must implement `__iter__()` and `__next__()`.
> A `for` loop desugars to a `while` loop that uses these methods.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

That is why `break`/`continue`/`else` behave consistently across both loops.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `for` | The other loop; desugars to `while` over the iteration protocol. |
| `break` | Terminates the loop and suppresses the loop `else`. |
| `continue` | Jumps straight back to the condition test. |
| `else` | Optional clause run when the condition becomes false. |
| `True` | `while True:` is the infinite loop. |
| `and`, `or`, `not` | Compose the loop condition; `and`/`or` short-circuit. |
| `var` | The loop variable must be mutable to be changed in the body. |
| `return` | Exits the enclosing function and suppresses the loop `else`. |

## Signature vs. body

`while` never appears in a signature. It is a statement used inside function and
method bodies. Each `while` body creates a new scope; variables declared inside
it are not visible after the loop.

## Pitfalls

- **Forgetting to make progress.** Unlike `for`, a `while` has no built-in step.
  A body that never changes the values in its condition loops forever.
- **`continue` before the increment.** If `continue` skips the statement that
  advances the loop variable, the condition never changes and the loop hangs.
  This is the most common `while` bug; the official `continue` example increments
  `n` *before* the test.
- **The `else` does not mean "run after a break".** It is the exact opposite:
  `break` suppresses it. Verified above.
- **`else` runs even if the condition was false immediately.** `while n < 4`
  with `n == 5` runs the `else` body on the first test. Verified above.
- **No `while … do` form.** The body is only entered after the condition is
  tested.
- **Truthiness surprises.** An empty collection or empty string is falsy, so
  `while buffer:` stops when the buffer empties. This is usually intended, but
  it is worth knowing.
- **Assignment is not an expression.** `while x = next():` is invalid; use the
  walrus operator `:=` when you need assignment inside the condition. Sources:
  <https://mojolang.org/docs/reference/expressions/>,
  <https://mojolang.org/docs/manual/operators/>.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`for`](for.md), [`break`](break.md), [`continue`](continue.md),
[`else`](else.md), [`True`](true.md), [`control-flow`](../basics/control-flow.md),
[`compound-statements`](../reference/compound-statements.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Mojo expression reference:
  <https://mojolang.org/docs/reference/expressions/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
