# Raising and propagation

This page is the practical half of the error model: how to raise, how to handle,
how errors propagate, how `try`/`except`/`else`/`finally` behave clause by clause,
how `raise e` differs from `raise e^`, and how context managers fit in.

The conceptual framing — Mojo represents errors as **values**, as alternate
return values — is on [the error model](error-model.md). Read that first if you
have not.

## The official framing

Quote it in full, because it is the premise of everything else here:

> Mojo represents errors as values — specifically, as alternate return values from
> functions. Unlike stack-unwinding exceptions in languages like C++ or Java, Mojo
> errors don't require expensive call stack unwinding, so their runtime overhead is
> as low as returning and checking an extra `Bool`. This design also enables error
> handling in contexts where traditional exceptions aren't available, like GPU
> kernels.

Source: <https://mojolang.org/docs/manual/errors/>.

## Raising

The built-in `Error` type is the default. Raise it with the constructor or the
string-literal shorthand:

```mojo
# These are equivalent
raise Error("file not found")
raise "file not found"
```

Declaring `raises` tells Mojo the function may raise:

```mojo
def read_file_fn(path: String) raises -> String:
    if not path:
        raise "path cannot be empty"
    return "contents of " + path
```

Source: <https://mojolang.org/docs/manual/errors/>.

When a function raises, it terminates immediately and the error propagates to the
calling function; if that function does not handle it, it keeps propagating up the
call stack. Source: <https://mojolang.org/docs/manual/functions/>.

## Handling: the full `try` syntax

```mojo
try:
    # Code that might raise an error
except e:
    # Runs if an error occurs
else:
    # Runs if no error occurs
finally:
    # Always runs, regardless of outcome
```

> You must include one or both of `except` and `finally`. The `else` clause is
> optional.

Source: <https://mojolang.org/docs/manual/errors/>.

### What each clause does

| Clause | Behaviour |
|--------|-----------|
| `try` | Runs the risky code. If no error occurs, the whole block executes. If an error occurs, execution stops at the `raise` point and continues with `except` (if present) or `finally`. |
| `except` | Runs only when an error occurs in the `try` block. `except e:` binds the error to `e`. A `try` block can have only **one** `except` clause. |
| `else` | Runs only when no error occurs. It is **skipped** if the `try` clause exits via `continue`, `break`, or `return`. |
| `finally` | Runs after `try` and any `except`/`else`, regardless of outcome — even if another clause exits via `continue`, `break`, `return`, or raises a new error. |

Source: <https://mojolang.org/docs/manual/errors/>.

The execution order is fixed:

1. The `try` block runs first.
2. If an error occurs, the matching `except` block runs.
3. If no error occurs, the `else` block (if present) runs after the `try` block.
4. If included, the `finally` block always runs last.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### A worked example

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
                    raise e
                print("except  => handled:", e)
            else:
                print("else    => success:", result)
            finally:
                print("finally => done with id:", id)
    except e:
        print("re-raised error:", e)
```

The documented reading of that run:

- `id == 5`: `process_record()` succeeds, so `else` runs, then `finally`.
- `id == 0`: `continue` exits the `try` block, skipping both `except` and `else`.
  Only `finally` runs.
- `id == 1001`: the call raises; `except` handles it and the loop continues.
- `id == -3`: the "invalid" error is re-raised, so it propagates to the outer
  `try`/`except`. `finally` still runs before propagation, and because the
  re-raise exits the loop, `id == 42` is never processed.

Source: <https://mojolang.org/docs/manual/errors/>.

### Binding, or not binding, the error

```mojo
try:
    risky()
except e:
    print(e)   # e is the caught error
```

Without a binding, the error is caught but not accessible — "There is no default
error variable":

```mojo
try:
    risky()
except:
    print("something went wrong")
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Catching typed errors

When the called function declares `raises ErrorType`, the bound variable's type is
inferred, and its fields are directly accessible:

```mojo
@fieldwise_init
struct NetworkError:
    var message: String
    var code: Int

def fetch() raises NetworkError -> String:
    raise NetworkError("HTCPCP", 418)

def main():
    try:
        var result = fetch()
    except e:              # e is inferred as `NetworkError`
        print(e.message)
        print(e.code)
```

> A `try` block handles one error type. The compiler raises an error if code in
> the `try` block can raise more than one error type.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

Mojo does **not** support `except ErrorType as e:` syntax; the type is always
inferred from the called function. Source:
<https://mojolang.org/docs/manual/errors/>.

If you must call functions with different error types, use separate `try` blocks:

```mojo
try:
    var name = validate_username(input)
except e:
    print("Validation failed:", e.field, e.reason)

try:
    var file = open_file(path)
except e:
    # e is a FileError — match on variant
    if e == FileError.not_found:
        print("Missing:", path)
```

Source: <https://mojolang.org/docs/manual/errors/>.

## Re-raising: `raise e` versus `raise e^`

To re-raise a caught error, pass it to `raise`:

```mojo
try:
    var result = process_record(-1)
except e:
    print("Logging error:", e)
    raise e   # re-raise
```

You can also raise a different error from inside an `except` clause. The
difference between the two forms:

> Re-raising copies the error, which is cheap because both its message and its
> optional stack trace are reference counted. To avoid the copy, transfer the error
> with the transfer sigil: `raise e^`. A custom error type that doesn't conform to
> `ImplicitlyCopyable` requires the transfer sigil to re-raise.

Source: <https://mojolang.org/docs/manual/errors/>.

So:

| Form | Behaviour | When required |
|------|-----------|---------------|
| `raise e` | Copies the error, then raises the copy. | Error type is `ImplicitlyCopyable` (including `Error`). |
| `raise e^` | Transfers the error with `^`; no copy. | Error type is not `ImplicitlyCopyable` — the transfer sigil is required. |

## Propagation rules

Unhandled errors propagate as alternate return values. Three practical rules
follow.

### Non-raising callers must handle

```mojo
# Error: can't call raising function in a non-raising context
def unhandled_error():
    raises_error()
```

Source: <https://mojolang.org/docs/manual/functions/>.

### Bare `raises` erases the type

> Using bare `raises` (without a type) on an function that calls typed-error
> functions causes *type erasure* — the compiler forgets the specific error type,
> even though the runtime preserves the error's identity.

The caller receives an `Error`, not the original type:

```mojo
# Anti-pattern: bare raises erases type info at compile time
def validate_bare_raises(value: Int) raises -> Int:
    return validate_typed(value)

try:
    _ = validate_bare_raises(-5)
except e:
    # e is typed as Error — no field access available
    print(e)
```

> The error message still shows `ValidationError` because the runtime preserves the
> original error's `Writable` output. But the compiler sees only `Error`, so you
> lose access to structured fields. Always use `raises YourErrorType` to maintain
> type safety.

Source: <https://mojolang.org/docs/manual/errors/>.

### One error type per `try`

The compiler rejects a `try` block whose body can raise two different types:

```output
error: cannot call function that may raise 'Error' in a context that
supports an error type of 'ValidationError'
```

Source: <https://mojolang.org/docs/manual/errors/>.

Combine those with the typed-error conversion pattern from
[the error model](error-model.md): catch the `Error` and wrap it in your typed
error at the API boundary.

## Context managers: `with`

A *context manager* manages resources such as files, network connections and
database connections, releasing them automatically when they are no longer needed.
The `with` statement guarantees cleanup even when an error occurs:

```mojo
with open(input_file, "r") as f:
    var content = f.read()
    # Process the content as needed
```

The naive alternative calls `close()` explicitly and ignores that `read()` could
raise and prevent the close; the `try`/`finally` version fixes that, and the `with`
statement is the built-in way to express it:

```mojo
# try/finally equivalent
var f = open(input_file, "r")
try:
    var content = f.read()
finally:
    f.close()
```

Source: <https://mojolang.org/docs/manual/errors/>.

Multiple context managers can share one `with`:

```mojo
with open(input_file, "r") as f_in, open(output_file, "w") as f_out:
    var input_text = f_in.read()
    var output_text = input_text.upper()
    f_out.write(output_text)
```

Source: <https://mojolang.org/docs/manual/errors/>.

### Writing a custom context manager

Implement `__enter__()` and `__exit__()`:

- `__enter__()` "is called by the `with` statement to enter the runtime context.
  ... should initialize any state necessary for the context and return the context
  manager."
- `__exit__()` "is called when the `with` code block completes execution, even if
  the `with` code block terminates with a call to `continue`, `break`, or
  `return`. ... should release any resources associated with the context."

> If the `with` code block raises an error, then the `__exit__()` method runs
> before any error processing occurs.

A context manager that defines only `__enter__()` is valid; `__exit__()` is
optional in that case. Source:
<https://mojolang.org/docs/manual/errors/> and
<https://mojolang.org/docs/reference/compound-statements/>.

```mojo
@fieldwise_init
struct Timer(ImplicitlyCopyable):
    var start_time: Int

    def __init__(out self):
        self.start_time = 0

    def __enter__(mut self) -> Self:
        self.start_time = Int(time.perf_counter_ns())
        return self

    def __exit__(mut self):
        var end_time = time.perf_counter_ns()
        var elapsed_time_ms = round(
            Float64(end_time - self.start_time) / 1e6, 3
        )
        print("Elapsed time:", elapsed_time_ms, "milliseconds")
```

`__enter__` returns `self` so the `as` target binds to the manager; the
`ImplicitlyCopyable` conformance lets the compiler return `self` by value.
Source: <https://mojolang.org/docs/reference/compound-statements/>.

### Conditional `__exit__()` for `Error`

Besides `__exit__(self)`, you can overload `__exit__()` so a different form runs
when an `Error` occurs:

```mojo
def __exit__(self, error: Error) raises -> Bool
```

> Given the `Error` that occurred as an argument, the method can do any of the
> following: Return `True` to suppress the error. Return `False` to re-raise the
> error. Raise a new error.

Source: <https://mojolang.org/docs/manual/errors/>.

### Typed errors in `__exit__()`

The `__exit__(self, error: Error)` overload handles only `Error`. For typed
errors, implement a parameterized method with a compile-time error type
parameter:

```mojo
def __exit__[ErrType: AnyType](self, err: ErrType) -> Bool
```

> This method receives the typed error directly, preserving its full type
> information.

You can then use reflection to inspect the type at compile time:

```mojo
def __exit__[ErrType: AnyType](self, err: ErrType) -> Bool:
    comptime type_name = reflect[ErrType].name()
    print("Releasing:", self.name)
    print("  Error type:", type_name)

    comptime if conforms_to(ErrType, Writable):
        print("  Message:", err)

    return self.suppress_errors
```

Source: <https://mojolang.org/docs/manual/errors/>.

## Pitfalls

- **`else` after `continue`/`break`/`return`.** It is skipped; `finally` still
  runs. Verified above.
- **Multiple `except` clauses.** A `try` block may have only one. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **Expecting `except ErrorType as e:`.** Not supported; the type is inferred.
  Source: <https://mojolang.org/docs/manual/errors/>.
- **Calling `raise e` on a non-`ImplicitlyCopyable` error.** It requires
  `raise e^`. Source: <https://mojolang.org/docs/manual/errors/>.
- **Using bare `raises` on a wrapper.** It erases the compile-time type; the
  caller cannot access structured fields. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **Mixing error types in one `try`.** Rejected by the compiler; use separate
  blocks. Source: <https://mojolang.org/docs/manual/errors/>.
- **Relying on an exception variable existing without binding.** `except:` without
  a name catches but does not bind; there is no default variable. Source:
  <https://mojolang.org/docs/reference/compound-statements/>.
- **Expecting `__exit__` to suppress errors by default.** Only the `Bool`-returning
  overload can; `__exit__(self)` cannot. Source:
  <https://mojolang.org/docs/manual/errors/>.

## Open questions

> **Open question:** the reference says a `for`/`while` `else` clause runs when the
> loop "exits normally", and the error page's example shows `continue` inside a
> `try` skipping `else`. The interaction between loop-control statements and a
> `try` block's `else` is illustrated but not stated as a general rule beyond that
> example. Prefer explicit control flow when the distinction matters.

> **Open question:** the errors page notes that the plain `except:` binding rule is
> documented only in the compound-statements reference, not the manual. The two
> agree; no conflict found.

## Sources

- Mojo manual — Errors, error handling, and context managers: <https://mojolang.org/docs/manual/errors/>
- Mojo reference — Compound statements (`try`, `with`, loop `else`): <https://mojolang.org/docs/reference/compound-statements/>
- Mojo manual — Functions (raising and non-raising): <https://mojolang.org/docs/manual/functions/>
- Mojo manual — Control flow: <https://mojolang.org/docs/manual/control-flow/>
- Mojo manual — Reflection (`__exit__` typed overload): <https://mojolang.org/docs/manual/metaprogramming/reflection/>
