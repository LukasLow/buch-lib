# finally

`finally` is the always-run clause of a `try` statement. Whatever happens in the
other clauses — success, error, `return`, `break`, `continue`, or a re-raise —
the `finally` block executes.

## Purpose

The official keywords reference defines `finally` in one line:

> `finally` — Always-execute clause in a `try` block

Source: <https://mojolang.org/docs/reference/keywords/>.

> Each `try` statement requires at least one `except` or `finally` clause.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

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

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Syntax

```text
try:
    body
finally:
    body

try:
    body
except e:
    body
finally:
    body
```

`finally` may be used alone with `try` — it does not require an `except`. That
is what makes it the cleanup-only form.

## The guarantee

The errors manual states the guarantee in full:

> `finally` — Runs after the `try` and any `except` or `else` clause, regardless
> of outcome. It executes even if another clause exits via `continue`, `break`,
> `return`, or by raising a new error. Use `finally` to release resources (such
> as file handles) that must be cleaned up regardless of whether an error
> occurred.

Source: <https://mojolang.org/docs/manual/errors/>.

The four-clause execution order is fixed:

1. The `try` block runs first.
1. If an error occurs, the matching `except` block runs.
1. If no error occurs, the `else` block (if present) runs after the `try` block.
1. If included, a `finally` block always runs last.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## The canonical use: cleanup that must not be skipped

The errors manual motivates `finally` with a file example. The naive version is
wrong because `read()` can raise and skip `close()`:

```mojo
var f = open(input_file, "r")
var content = f.read()
f.close()
```

The `try`/`finally` version makes cleanup unconditional:

```mojo
var f = open(input_file, "r")

try:
    var content = f.read()
finally:
    # Ensure that the file handle is closed even if read() raises an error
    f.close()
```

Source: <https://mojolang.org/docs/manual/errors/>.

For types that provide a context manager, the `with` statement expresses the
same thing more concisely; see [`with`](with.md).

## `finally` and early exits

A `return` inside `try` still runs `finally` before the function actually
returns. The same holds for `break` and `continue` inside a loop, and for a
re-raised error:

- "It executes even if another clause exits via `continue`, `break`, `return`,
  or by raising a new error." Source:
  <https://mojolang.org/docs/manual/errors/>.
- In the manual's four-clause example, the re-raise path prints the `finally`
  line *before* the error propagates to the outer handler.

One subtlety: the `else` clause is **skipped** when the `try` block exits via
`continue`, `break`, or `return` — but `finally` still runs. Source:
<https://mojolang.org/docs/manual/errors/>.

## `finally` and the error type restriction

The one-error-type-per-`try` rule belongs to the statement as a whole. If a
`try` block calls functions that raise different error types, the compiler
rejects it regardless of what `finally` does:

```output
error: cannot call function that may raise 'Error' in a context that
supports an error type of 'ValidationError'
```

Source: <https://mojolang.org/docs/manual/errors/>.

## Interaction with context managers

A `with` block's `__exit__()` plays the role `finally` plays for `try`:

> `__exit__()` is called when the `with` code block completes execution, even if
> the `with` code block terminates with a call to `continue`, `break`, or
> `return`.

> If the `with` code block raises an error, then the `__exit__()` method runs
> before any error processing occurs (that is, before it is caught by a
> `try`/`except` structure or your program terminates).

Source: <https://mojolang.org/docs/manual/errors/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `try` | The block `finally` belongs to. |
| `except` | Handler; `except` and `finally` may appear together, or `finally` alone. |
| `else` | Success-only clause that runs before `finally`. |
| `return`, `break`, `continue` | All still trigger `finally`. |
| `raise` | A raised or re-raised error still triggers `finally` on the way out. |
| `with` | The context-manager spelling of the cleanup pattern. |

## Signature vs. body

`finally` never appears in a signature. It is a clause of the `try` statement,
used in function and method bodies, and its body introduces its own scope.

## Pitfalls

- **A bare `try`/`finally` has no way to swallow errors.** It cleans up and then
  the error continues to propagate. If recovery is wanted, an `except` is also
  needed.
- **`finally` does not run on process abort.** Like any code, a `finally` block
  cannot execute if the runtime aborts or crashes; it is not a substitute for a
  destructor in types that manage resources.
- **Do not `return` from `finally` casually.** A `return` there overrides any
  earlier return value and would be very hard to read; keep `finally` bodies to
  cleanup.
- **State changed in `finally` is visible.** `finally` runs before the enclosing
  function actually returns, so mutations there affect the caller-visible state.
- **The clause is required to pair with `try` correctly.** `try` needs at least
  one of `except`/`finally`; a `try` with only `else` is a syntax error.
  Source: <https://mojolang.org/docs/reference/compound-statements/>.
- **Raising inside `finally`.** The manual explicitly lists this case: a new
  error raised in another clause still leads to `finally` running, and an error
  raised inside `finally` replaces the original one — so keep it exception-free.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`try`](try.md), [`except`](except.md), [`else`](else.md),
[`raise`](raise.md), [`return`](return.md), [`with`](with.md),
[`compound-statements`](../reference/compound-statements.md),
[`error-model`](../errors/error-model.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Errors, error handling, and context managers (manual):
  <https://mojolang.org/docs/manual/errors/>
