# continue

`continue` skips the rest of the current loop iteration and moves on to the
next one. It is the loop-control statement that complements `break`.

## Purpose

The official keywords reference defines `continue` in one line:

> `continue` — Skips to the next loop iteration

Source: <https://mojolang.org/docs/reference/keywords/>.

> `continue` skips to the next iteration.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

```mojo
for x in range(10):
    if x == 5:
        break        # Stop at 5
    if x % 2 == 0:
        continue     # Skip even numbers
    print(x)         # Prints 1, 3
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## What "the next iteration" means

For a `for` loop, `continue` resumes with the next element of the sequence:

> A `continue` statement skips execution of the rest of the code block and
> resumes the loop with the next element of the collection.

Source: <https://mojolang.org/docs/manual/control-flow/>.

For a `while` loop, there is no "next element": `continue` jumps straight back
to the condition test:

> A `continue` statement skips execution of the rest of the code block and
> resumes with the loop test expression.

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

Source: <https://mojolang.org/docs/manual/control-flow/>.

In that example `n += 1` is **before** the `continue`, which is what lets the
loop terminate. See the pitfalls.

## Filtering with `continue`

The reference combines `continue` with a validity check, which is the common
filtering pattern:

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

The same shape works in `for` loops:

```mojo
for value in range(10):
    if value % 2 == 0:
        continue
    print(value)   # 1, 3, 5, 7, 9
```

## `continue` and `else` clauses

`continue` does **not** suppress a loop's `else` clause, because it does not
exit the loop:

> An optional `else` clause runs when the loop exits normally. It does not run
> if the loop exits with `break`.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

Only `break` (or `return`) prevents the `else` from running.

`continue` does, however, interact with the `try` statement inside a loop:

> The `else` clause is *skipped* if the `try` clause exits via `continue`,
> `break`, or `return`.

Source: <https://mojolang.org/docs/manual/errors/>.

So a `continue` inside a `try` block skips that `try`'s `except`/`else` and
runs only `finally` before resuming the loop.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `for` | `continue` resumes at the next element. |
| `while` | `continue` resumes at the condition test. |
| `break` | The complementary statement: exits the whole loop. |
| `else` | Loop clause unaffected by `continue` (only `break`/`return` suppress it). |
| `try`, `except`, `finally` | A `continue` inside `try` skips `except`/`else` but runs `finally`. |
| `if` | The usual guard around a `continue`. |
| `comptime` | Valid inside `comptime for` bodies. |

## Signature vs. body

`continue` never appears in a signature. It is a body-only simple statement: no
arguments, no value, valid only lexically inside a loop.

## Pitfalls

- **The `while` infinite-loop trap.** If the code that advances the loop
  variable comes *after* a `continue`, the condition never changes and the loop
  never ends. Put the progress statement first, or restructure the condition.
  The official `while` example deliberately increments before the test.
- **Only the innermost loop continues.** A `continue` in a nested loop skips
  only the inner loop's current element; outer loops are unaffected. There is
  no labelled form.
- **`continue` is not a `goto`.** It cannot jump out of the loop or into another
  scope.
- **It hides the `try` `else`.** In Mojo's `try` statement, a `continue` leaving
  the `try` block skips the `else` clause. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **`continue` outside a loop.** A compile error — there is no loop to continue.
- **`continue` and `finally`.** `finally` still runs before the loop resumes, so
  cleanup code cannot be skipped by a `continue`.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`for`](for.md), [`while`](while.md), [`break`](break.md),
[`else`](else.md), [`try`](try.md),
[`simple-statements`](../reference/simple-statements.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Errors, error handling, and context managers (manual):
  <https://mojolang.org/docs/manual/errors/>
