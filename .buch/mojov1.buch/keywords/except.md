# except

`except` is the error-handler clause of a `try` statement. It names where
control resumes when the `try` block raises, and optionally binds the error to a
variable.

## Purpose

The official keywords reference defines `except` in one line:

> `except` — Error handler clause

Source: <https://mojolang.org/docs/reference/keywords/>.

> Each `try` statement requires at least one `except` or `finally` clause.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

```mojo
var result: Bool
try:
    result = risky()
except e:
    handle(e)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Syntax

```text
try:
    body
except e:
    body

try:
    body
except:
    body
```

Two forms are available:

| Form | Meaning |
|------|---------|
| `except e:` | Catches the error and binds it to the name `e`. |
| `except:` | Catches the error without binding it. |

> Bind the error to a name with `except name`. ... Without a binding, the error
> is caught but not accessible. There is no default error variable. This is
> useful when you want to respond to an error state without needing the error
> details.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Only one `except` per `try`

This is the restriction that separates Mojo from many other languages:

> `except` — Runs only when an error occurs in the `try` block. If you provide a
> variable name (`except e:`), the error is bound to that variable. A `try` block
> can have only one `except` clause.

Source: <https://mojolang.org/docs/manual/errors/>.

There is no `except A as e:` / `except B as e:` chain, and no filtering by
exception type at the clause level. The compound-statements reference states the
same thing from the type side: "A `try` block handles one error type. The
compiler raises an error if code in the `try` block can raise more than one
error type." Source:
<https://mojolang.org/docs/reference/compound-statements/>.

The errors manual is explicit about the syntax that does **not** exist:

> Mojo doesn't support `except ErrorType as e:` syntax—the type is always
> inferred from the function being called.

Source: <https://mojolang.org/docs/manual/errors/>.

## Typed errors: the binding is inferred

When the called function declares a specific error type, the bound variable has
that type, and its fields are directly accessible:

```mojo
@fieldwise_init
struct NetworkError:
    var message: String
    var code: Int

def fetch() raises NetworkError -> String:
    raise NetworkError("HTCPCP", 418)

try:
    var result = fetch()
except e:              # e is inferred as `NetworkError`
    print(e.message)   # Known types support direct field access
    print(e.code)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

The errors manual adds that this is automatic: "The compiler automatically
infers the error type from the function being called, so `except e:` gives you a
fully typed error value—no casting required." Source:
<https://mojolang.org/docs/manual/errors/>.

## Handling several error types

Because one `try` block handles one error type, distinct error types need
distinct blocks:

```mojo
# Each try block handles one error type
try:
    var name = validate_username(input)
except e:
    # e is a ValidationError — access fields directly
    print("Validation failed:", e.field, e.reason)

try:
    var file = open_file(path)
except e:
    # e is a FileError — match on variant
    if e == FileError.not_found:
        print("Missing:", path)
```

Source: <https://mojolang.org/docs/manual/errors/>.

Within a single error type that represents several conditions — the enumerated
error pattern — the discrimination happens with ordinary `if`/`elif` inside the
`except` body:

```mojo
try:
    print(open_file("/secret"))
except e:
    if e == FileError.not_found:
        print("Not found:", e)
    elif e == FileError.permission_denied:
        print("Permission denied:", e)
```

Source: <https://mojolang.org/docs/manual/errors/>.

## Re-raising from `except`

Inside the handler, the current error can be re-raised or replaced:

```mojo
try:
    var result = process_record(-1)
except e:
    print("Logging error:", e)
    raise e   # re-raise
```

> You can also raise a different error from within an `except` clause.

> Re-raising copies the error, which is cheap because both its message and its
> optional stack trace are reference counted. To avoid the copy, transfer the
> error with the transfer sigil: `raise e^`. A custom error type that doesn't
> conform to `ImplicitlyCopyable` requires the transfer sigil to re-raise.

Source: <https://mojolang.org/docs/manual/errors/>.

## The `as` keyword is **not** used with `except`

Despite the wording of the keywords table for `as` ("Aliasing in imports and
`except` clauses"), the errors manual states plainly that Mojo does not support
`except ErrorType as e:`. In the error syntax documented for 1.x the binding is
simply `except e:`. The `as` spelling documented for `except` clauses is
therefore not shown in any current error example.

> **Open question:** the official keywords reference describes `as` as
> "Aliasing in imports and `except` clauses", but the 1.x errors manual
> explicitly says "Mojo doesn't support `except ErrorType as e:` syntax" and
> every error example uses the bare `except e:` form. It is unclear whether
> `except ... as ...` is a planned spelling, a legacy spelling, or a wording
> slip in the keywords table. Verify against the next upstream release before
> documenting an `except … as …` form. Sources:
> <https://mojolang.org/docs/reference/keywords/>,
> <https://mojolang.org/docs/manual/errors/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `try` | The block whose errors `except` handles. |
| `finally` | Always-run clause; at least one of `except`/`finally` is required. |
| `else` | Runs on success, so it is mutually exclusive with `except` for a given run. |
| `raise` | Produces or re-raises the error inside the handler. |
| `if`, `elif` | Discriminate between conditions of a single error type inside the handler. |
| `with` | Replaces the common `try`/`finally` cleanup pattern. |

## Signature vs. body

`except` never appears in a signature. It is a clause of the `try` statement and
is used only in function and method bodies. The error *type* it can catch is
determined by the signatures of the functions called inside `try`, not by
anything written at the `except`.

## Pitfalls

- **`except` without `try`.** A syntax error; `except` has no meaning outside a
  `try` statement.
- **Trying to chain typed handlers.** There is exactly one `except` clause per
  `try` and no type filter on it; use separate `try` blocks or an enumerated
  error type. Source: <https://mojolang.org/docs/manual/errors/>.
- **Expecting `except Type as e`.** Not supported in 1.x; write `except e`.
  Source: <https://mojolang.org/docs/manual/errors/>.
- **Assuming an unbound `except` gives access to the error.** There is no default
  error variable; without a binding the error is caught but inaccessible.
  Source: <https://mojolang.org/docs/reference/compound-statements/>.
- **Re-raising a non-copyable typed error with `raise e`.** Needs `raise e^`.
  Source: <https://mojolang.org/docs/manual/errors/>.
- **Forgetting that `finally` runs too.** In a full `try`/`except`/`else`/
  `finally` statement, cleanup belongs in `finally`, not at the end of `except`.
- **Catching and swallowing.** An `except` body that neither re-raises nor
  records the error hides failures; `Error`'s message shows nothing unless it is
  used.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`try`](try.md), [`finally`](finally.md), [`else`](else.md),
[`raise`](raise.md), [`with`](with.md),
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
