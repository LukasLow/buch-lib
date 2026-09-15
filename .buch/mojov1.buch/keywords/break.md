# break

`break` exits the innermost enclosing loop immediately. It is a control-transfer
statement used inside `for`, `while`, and (as `comptime for`) compile-time
loops.

## Purpose

The official keywords reference defines `break` in one line:

> `break` — Exits the innermost loop

Source: <https://mojolang.org/docs/reference/keywords/>.

> `break` exits the innermost loop immediately.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

```mojo
for x in range(10):
    if x == 5:
        break        # Stop at 5
    print(x)         # Prints 0, 1, 2, 3, 4
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## Where `break` is allowed

`break` is a *simple statement*:

> A *simple statement* performs a single action on one logical line. Multiple
> simple statements can share a line when separated by semicolons.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

It is only valid inside a loop body. Outside a loop, there is nothing for it to
exit; the compiler rejects it. It is also available inside `comptime for`, where
it stops the unrolled sequence.

## What it does to each construct

| Construct | Effect of `break` |
|-----------|-------------------|
| `for` loop | Exits the loop; remaining elements are not visited. |
| `while` loop | Exits the loop; the condition is not re-tested. |
| `comptime for` | Stops the compile-time unrolling; later iterations are not generated. |
| `try` inside a loop | The `try` block's `else` clause is skipped if `break` leaves the `try` block. |
| Loop with `else` | Suppresses the loop's `else` clause, because the loop did not exit normally. |

The `while` example from the manual:

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

The `for` example from the manual:

```mojo
for i in range(5):
    if i == 3:
        break
    print(i, end=", ")
```

```output
0, 1, 2,
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

## `break` and the loop `else` clause

This is the interaction that makes `break` interesting. The manual is explicit:

> The `else` clause does *not* execute if a `break` or `return` statement
> terminates the `for` loop.

Source: <https://mojolang.org/docs/manual/control-flow/>.

That is the basis of the standard search idiom:

```mojo
var found = False
for item in items:
    if item == target:
        found = True
        break
else:
    print("not found")   # Only runs if break was never hit
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

`break` is what distinguishes "I found it and stopped" from "the loop ran to
completion without finding anything".

## `break` versus `continue`

`break` leaves the loop; `continue` only leaves the current iteration and
resumes at the next element (or the next condition test for `while`). The
official example puts both in one loop:

```mojo
for x in range(10):
    if x == 5:
        break        # Stop at 5
    if x % 2 == 0:
        continue     # Skip even numbers
    print(x)         # Prints 1, 3
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

Neither keyword carries a value; to send a result out of a loop, assign to a
variable declared before the loop, or use `return` to leave the whole function.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `for`, `while` | The constructs `break` exits. |
| `continue` | The complementary statement: skips the iteration rather than the loop. |
| `else` | Loop clause that `break` suppresses. |
| `return` | Leaves the entire function; also suppresses the loop `else`. |
| `comptime` | `comptime for` accepts `break`, stopping the compile-time unroll. |
| `if` | The usual guard around a `break`. |

## Signature vs. body

`break` never appears in a signature. It is a body-only statement with no
arguments and no value. A semicolon may separate it from another simple
statement on the same line, but the conventional style is its own line.

## Pitfalls

- **Only the innermost loop is exited.** Nested loops need one `break` per
  level, or a flag, or a `return` from the enclosing function. There is no
  labelled `break` in Mojo.
- **It silently changes loop-`else` behaviour.** Adding a `break` to a loop that
  has an `else` clause suppresses the `else`; that may be exactly the intent, or
  may silently disable the "no result" path.
- **`break` inside `except`/`else` of a `try`.** If the `try` block exits via
  `break`, the `try`'s `else` clause is skipped. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **`break` outside a loop.** A syntax/compile error — it must be lexically
  inside a loop body.
- **`break` inside a closure or nested function.** A nested function is a new
  scope and not part of the surrounding loop; loop control keywords must belong
  to the loop they exit.
- **No `break` with a value.** Unlike some languages, Mojo has no
  `break value`. Use `return` or an assigned variable.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`for`](for.md), [`while`](while.md), [`continue`](continue.md),
[`else`](else.md), [`return`](return.md),
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
