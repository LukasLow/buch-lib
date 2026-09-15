# try

`try` begins an error-handling block. It is the keyword that opens the
`try`/`except`/`else`/`finally` statement, which detects and recovers from
errors raised inside it.

## Purpose

The official keywords reference defines `try` in one line:

> `try` — Begins an error-handling block

Source: <https://mojolang.org/docs/reference/keywords/>.

> A `try` statement executes code that may raise errors.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

```mojo
var result: Bool
try:
    result = risky()
except e:
    handle(e)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## How Mojo errors work

`try` is the recovery half of a design in which errors are values, not
stack-unwinding exceptions:

> Mojo represents errors as values—specifically, as alternate return values from
> functions. Unlike stack-unwinding exceptions in languages like C++ or Java,
> Mojo errors don't require expensive call stack unwinding, so their runtime
> overhead is as low as returning and checking an extra `Bool`.

Source: <https://mojolang.org/docs/manual/errors/>.

This is why `try` does not catch anything that a called function does not
declare: a function is non-raising by default, and a caller can only see errors
that a `raises` function is allowed to produce.

## Syntax and required clauses

```text
try:
    body
except e:
    body
else:
    body
finally:
    body
```

> Each `try` statement requires at least one `except` or `finally` clause.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

`else` is optional:

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

The errors manual repeats the rule and its consequences for the optional parts:
"You must include one or both of `except` and `finally`. The `else` clause is
optional." Source: <https://mojolang.org/docs/manual/errors/>.

## Execution order

Quoted from the compound-statements reference:

1. The `try` block runs first.
1. If an error occurs, the matching `except` block runs.
1. If no error occurs, the `else` block (if present) runs after the `try` block.
1. If included, a `finally` block always runs last.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

The errors manual adds the early-exit behaviour:

> `try` — Contains code that might raise an error. If no error occurs, the
> entire block executes. If an error occurs, execution stops at the `raise`
> point and continues with the `except` clause (if present) or the `finally`
> clause.

> `else` — Runs only when no error occurs in the `try` block. The `else` clause
> is *skipped* if the `try` clause exits via `continue`, `break`, or `return`.

Source: <https://mojolang.org/docs/manual/errors/>.

## A complete four-clause example

```mojo
def process_record(id: Int) raises -> String:
    if id < 0:
        raise Error("invalid record ID: must be non-negative")
    if id > 999:
        raise Error("record not found")
    return String("record_", id)

def main() raises:
    try:
        for id in [5, 0, 1001, -3, 42]:
            var result: String
            try:
                if id == 0:
                    continue
                result = process_record(id)
            except e:
                if "invalid" in String(e):
                    print("except  => fatal:", e)
                    raise e
                print("except  => handled:", e)
            else:
                print("else    => success:", result)
            finally:
                print("finally => done with id:", id)
    except e:
        print("\nre-raised error:", e)
```

Source: <https://mojolang.org/docs/manual/errors/>.

From its output the manual draws four lessons:

- `id == 5`: success, so `else` runs, then `finally`.
- `id == 0`: `continue` exits the `try` block, "skipping both `except` and
  `else`. Only `finally` runs."
- `id == 1001`: `raises` inside the `try` block, and the `except` handler runs.
- `id == -3`: the handler re-raises, so the error reaches the outer `try`; "The
  `finally` clause still runs before the error propagates."

Source: <https://mojolang.org/docs/manual/errors/>.

## One error type per `try` block

This is a hard restriction:

> A `try` block handles one error type. The compiler raises an error if code in
> the `try` block can raise more than one error type.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

The errors manual gives the diagnostic for mixing the built-in `Error` with a
typed error:

```output
error: cannot call function that may raise 'Error' in a context that
supports an error type of 'ValidationError'
```

and recommends: "To call both functions, use separate `try` blocks or wrap the
`Error`-raising function as shown in Wrap `Error` at API boundaries." Source:
<https://mojolang.org/docs/manual/errors/>.

## Binding the error

> Bind the error to a name with `except name`. ... Without a binding, the error
> is caught but not accessible. There is no default error variable.

```mojo
try:
    risky()
except e:
    print(e)   # e is the caught error

try:
    risky()
except:
    print("something went wrong")
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

For typed errors, the bound variable's type is inferred from the called
function, so field access works directly:

```mojo
try:
    var result = fetch()
except e:              # e is inferred as NetworkError
    print(e.message)
    print(e.code)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## `try` versus `with`

For resource cleanup, `with` is the shorter spelling of the `try`/`finally`
pattern. The errors manual shows the equivalence and recommends the
context-manager form when the resource type provides one. See
[`with`](with.md).

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `except` | The handler clause; at most one per `try` block. |
| `finally` | Always-run clause; satisfies the clause requirement on its own. |
| `else` | Runs only when the `try` block completed without raising. |
| `raise` | Produces the error the `try` block catches; bare `raise` re-raises. |
| `continue`, `break`, `return` | Leaving the `try` block early skips `except` and `else` but still runs `finally`. |
| `raises` | The signature effect that tells the caller a function may raise. |

## Signature vs. body

`try` never appears in a signature; the signature counterpart is `raises`.
`try` is a statement used inside function and method bodies, and each clause
introduces its own scope.

## Pitfalls

- **`try` alone is a syntax error.** It needs at least one `except` or
  `finally`. Source: <https://mojolang.org/docs/reference/compound-statements/>.
- **Two error types in one `try`.** Rejected: a `try` block handles one error
  type. Use separate blocks. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **`else` is not a catch-all.** It runs on success, not on failure, and it is
  skipped by `continue`/`break`/`return` inside `try` — so it is not a reliable
  "success hook" in loops.
- **Bare `raises` erases the type.** If a function declares a bare `raises` and
  calls a typed-error function, the caller sees `Error`, not the typed error, and
  field access is lost. Source: <https://mojolang.org/docs/manual/errors/>.
- **Re-raising copies unless you transfer.** `raise e` copies the error (cheap,
  reference counted, and allowed in 1.0 because `Error` is
  `ImplicitlyCopyable`); `raise e^` avoids the copy, and is required for a custom
  error type that is not `ImplicitlyCopyable`. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **`try` cannot catch what is not declared.** A non-raising function cannot
  propagate an error at all; a non-raising caller must handle the raising callee
  locally. Source: <https://mojolang.org/docs/manual/functions/>.
- **Using `try` for control flow.** Errors should be exceptional; for ordinary
  absence, `Optional` or `Variant` is clearer.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`except`](except.md), [`finally`](finally.md),
[`else`](else.md), [`raise`](raise.md), [`with`](with.md), [`assert`](assert.md),
[`compound-statements`](../reference/compound-statements.md),
[`error-model`](../errors/error-model.md),
[`raising-and-propagation`](../errors/raising-and-propagation.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Errors, error handling, and context managers (manual):
  <https://mojolang.org/docs/manual/errors/>
- Functions (manual): <https://mojolang.org/docs/manual/functions/>
