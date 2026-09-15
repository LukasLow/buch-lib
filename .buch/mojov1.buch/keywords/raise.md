# raise

`raise` creates an error, or re-raises the error currently being handled. It is
the statement that makes a function fail.

## Purpose

The official keywords reference defines `raise` in one line:

> `raise` — Raises an error

Source: <https://mojolang.org/docs/reference/keywords/>.

> `raise` raises an error. The function must be declared with `raises` or
> included within a `try` block.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

```mojo
def validate(value: Int) raises -> Bool:
    if value < 0:
        raise Error("value must be non-negative")
    return True
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## The two forms

```text
raise Error("message")     # raise a new error
raise "message"            # string-literal shorthand for Error
raise e                    # re-raise a caught error
raise e^                   # re-raise without copying (transfer)
raise                      # bare re-raise of the active error
```

The errors manual documents the shorthand:

> You can raise an `Error` with the constructor or a string literal shorthand:
>
> ```mojo
> # These are equivalent
> raise Error("file not found")
> raise "file not found"
> ```
>
> The string literal form is a convenience—the compiler automatically wraps it
> in an `Error`.

Source: <https://mojolang.org/docs/manual/errors/>.

## Where `raise` is allowed

`raise` has a context requirement. The simple-statements reference gives both
error cases:

```mojo
raise Error("oops")   # Error: cannot raise error in this context
                      # (surround with try, or mark function as raises)

raise                 # Error: no contextual error to reraise
                      # (bare raise requires an active except block)
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

So a `raise` is legal when either:

1. The enclosing function declares `raises` (with or without a type), so the
   error may propagate; or
2. The `raise` sits inside a `try` block or an `except` handler that supplies
   the context.

## Declaring `raises`

> By declaring `raises`, you tell Mojo that a function may raise an error.

Source: <https://mojolang.org/docs/manual/errors/>.

```mojo
def read_file_fn(path: String) raises -> String:
    if not path:
        raise "path cannot be empty"
    return "contents of " + path
```

Source: <https://mojolang.org/docs/manual/errors/>.

A non-raising caller must handle the error:

```mojo
# This doesn't compile — validate_username() can raise
def process_name(name: String):
    print(validate_username(name))

# This compiles — the error is handled
def process_name_safe(name: String):
    try:
        print(validate_username(name))
    except e:
        print("Invalid:", e)
```

Source: <https://mojolang.org/docs/manual/errors/>.

## Typed errors

A function may declare **one** error type after `raises`:

```mojo
@fieldwise_init
struct ValidationError(Copyable, Writable):
    var field: String
    var reason: String

def validate_username(username: String) raises ValidationError -> String:
    if username.byte_length() == 0:
        raise ValidationError(field="username", reason="cannot be empty")
    return username
```

> Each function can declare at most one error type. The compiler enforces
> this—if any `raise` statement in the function body doesn't match the declared
> type, the program won't compile.

Source: <https://mojolang.org/docs/manual/errors/>.

> In Mojo, any struct can serve as an error type—no special base class or trait
> is required. However, implementing the `Writable` trait is recommended so the
> error produces a readable message when printed or when the program terminates
> with an unhandled error.

Source: <https://mojolang.org/docs/manual/errors/>.

## Constructing a raised typed error

The errors manual shows both the direct form and one wrapped in a type alias:

```mojo
comptime FileError = Variant[NotFoundError, PermissionError]

def open_file(path: String) raises FileError -> String:
    if not path:
        raise FileError(NotFoundError(""))
    if path == "/secret":
        raise FileError(PermissionError("/secret", "admin"))
    return "Contents of " + path
```

Source: <https://mojolang.org/docs/manual/errors/>.

## Re-raising

> To re-raise a caught error, pass it to `raise`:
>
> ```mojo
> try:
>     var result = process_record(-1)
> except e:
>     print("Logging error:", e)
>     raise e  # re-raise
> ```
>
> You can also raise a different error from within an `except` clause.

> Re-raising copies the error, which is cheap because both its message and its
> optional stack trace are reference counted. To avoid the copy, transfer the
> error with the transfer sigil: `raise e^`. A custom error type that doesn't
> conform to `ImplicitlyCopyable` requires the transfer sigil to re-raise.

Source: <https://mojolang.org/docs/manual/errors/>.

There is also the bare re-raise, documented in the simple-statements reference:

```mojo
try:
    validate(value)
    # perform work, knowing value is valid
except e:
    raise   # Re-raises current error to the next handler
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## `raise` and `finally`

A raised (or re-raised) error still runs any `finally` clause on its way out:

> It executes even if another clause exits via `continue`, `break`, `return`, or
> by raising a new error.

Source: <https://mojolang.org/docs/manual/errors/>.

## Unhandled errors

> If an error isn't caught by any handler, your program terminates with a
> non-zero exit code and prints the error message:

```output
Unhandled exception caught during execution: record not found
```

Source: <https://mojolang.org/docs/manual/errors/>.

Stack traces are opt-in for raised errors:

> By default Mojo *doesn't* generate a stack trace when your program raises an
> error—this avoids the additional runtime overhead. To enable stack traces for
> raised errors, set the `MODULAR_DEBUG` environment variable to
> `stack-trace-on-error`.

Source: <https://mojolang.org/docs/manual/errors/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `try` | The block that catches a raise; `raise` may also occur inside one. |
| `except` | Supplies the re-raise context and the caught error. |
| `finally` | Runs before a raised error propagates further. |
| `return` | The other way to leave a function; `raises` distinguishes them. |
| `None` | A function that declares no error type may still return `None`; the two are different concepts. |
| `assert` | Aborts rather than raising a catchable error. |

## Signature vs. body

`raise` is a body statement (a *simple statement*), but it only compiles in a
context determined by a signature: the enclosing function's `raises` clause, or
an enclosing `try`/`except`. The error type a function may raise is part of its
signature; the error type a caller sees is inferred from that signature.

## Pitfalls

- **Raising in a non-raising function.** A compile error; the manual notes that
  a non-raising function that calls a raising function must handle it locally.
- **Raising a type that violates the declared `raises` type.** The declaration
  is a contract: the error must match, or compilation fails. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **Bare `raise` outside an `except`.** "no contextual error to reraise".
  Source: <https://mojolang.org/docs/reference/simple-statements/>.
- **Bare `raises` erases the type at the boundary.** A caller of a bare-`raises`
  function sees `Error`, even if the runtime value is a `ValidationError`, and
  loses field access. Prefer `raises YourErrorType`. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **Re-raising a non-`ImplicitlyCopyable` typed error with `raise e`.** Requires
  `raise e^`. Source: <https://mojolang.org/docs/manual/errors/>.
- **Using `raise` for argument validation that is really a programmer error.**
  `assert`/`abort` are the documented tools for internal-invariant failures;
  `raise` is for error conditions the caller can handle. Source:
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>.
- **One error type per function.** Multiple failure kinds must be modelled inside
  one type, for example with `comptime` variant aliases or `Variant`. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **No `Error` subclassing.** Any struct can be an error type, but a struct can
  also just be the error; there is no inheritance hierarchy to match on.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`try`](try.md), [`except`](except.md), [`finally`](finally.md),
[`assert`](assert.md), [`return`](return.md),
[`simple-statements`](../reference/simple-statements.md),
[`error-model`](../errors/error-model.md),
[`raising-and-propagation`](../errors/raising-and-propagation.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Errors, error handling, and context managers (manual):
  <https://mojolang.org/docs/manual/errors/>
- Functions (manual): <https://mojolang.org/docs/manual/functions/>
- Comptime constraints and assertions (manual):
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>
