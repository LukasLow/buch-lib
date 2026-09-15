# The error model

Mojo does not use stack-unwinding exceptions. It represents errors as **values**,
specifically as alternate return values from functions. That single decision
explains the runtime cost, the syntax, and why error handling works in places
where exceptions cannot.

> Mojo represents errors as values — specifically, as alternate return values from
> functions. Unlike stack-unwinding exceptions in languages like C++ or Java, Mojo
> errors don't require expensive call stack unwinding, so their runtime overhead is
> as low as returning and checking an extra `Bool`. This design also enables error
> handling in contexts where traditional exceptions aren't available, like GPU
> kernels.

Source: <https://mojolang.org/docs/manual/errors/>.

This page covers that model, the built-in `Error` type, `raises`, typed errors,
the error type hierarchy, how errors propagate, and how `raise` relates to
`assert`. The mechanics of handling are on
[raising and propagation](raising-and-propagation.md); safety boundaries are on
[safety and undefined behaviour](safety-and-undefined-behaviour.md).

## Errors are alternate return values

An error interrupts normal execution flow. If the current function has a handler,
execution resumes there; otherwise the error propagates to the caller, and so on.
If no handler catches it, the program terminates with a non-zero exit code and
prints the message:

```output
Unhandled exception caught during execution: record not found
```

Source: <https://mojolang.org/docs/manual/errors/>.

The "alternate return value" framing has three consequences:

1. **The overhead is a `Bool`-like check**, not unwinding.
2. **Stack traces are not automatic.** Collecting one requires heap allocation and
   runtime overhead, so it is disabled by default and enabled with the
   `MODULAR_DEBUG=stack-trace-on-error` environment variable. It applies to the
   built-in `Error` only.
3. **Error handling is available on constrained targets**, including GPU kernels,
   as long as the error representation avoids heap-allocated types such as
   `String`.

Sources: <https://mojolang.org/docs/manual/errors/>.

## Non-raising by default: `raises`

Mojo functions are non-raising unless they declare otherwise.

> Mojo functions are *non-raising* by default. To declare that a function can
> propagate an error to its caller, add the `raises` keyword to the function
> signature.

Source: <https://mojolang.org/docs/manual/functions/>.

```mojo
def raises_error() raises:
    raise Error("There was an error.")
```

A non-raising function that calls a raising one **must handle the error**:

```mojo
# This function will not compile
def unhandled_error():
    raises_error()   # Error: can't call raising function in a non-raising context

# Explicitly handle the error
def handle_error():
    try:
        raises_error()
    except e:
        print("Handled an error:", e)

# Explicitly propagate the error
def propagate_error() raises:
    raises_error()
```

Source: <https://mojolang.org/docs/manual/functions/>.

`raises` is **not a reserved keyword** — it is a declaration word with fixed
meaning in a signature:

> `raises` declares that a function can raise errors.

Source: <https://mojolang.org/docs/reference/keywords/>.

## The built-in `Error` type

`Error` "is the default error type for most Mojo code. It carries a text message
describing what went wrong, and it's the right choice for application-level error
handling — simple, well-supported, and sufficient for the majority of use cases."

There are two equivalent ways to raise one:

```mojo
# These are equivalent
raise Error("file not found")
raise "file not found"
```

> The string literal form is a convenience — the compiler automatically wraps it
> in an `Error`.

Source: <https://mojolang.org/docs/manual/errors/>.

`Error` carries an optional stack trace. In an `except` clause you can call
`get_stack_trace()`, which returns `Optional[String]` and is `None` when
collection was disabled or unavailable:

```mojo
def main() raises:
    try:
        func1()
    except e:
        print(e)
        var stack_trace = e.get_stack_trace()
        if stack_trace:
            print(stack_trace.value())
        else:
            print("No stack trace available")
```

Source: <https://mojolang.org/docs/manual/errors/>.

## Typed errors

Any struct can serve as an error type; no special base class or trait is required.
Implementing `Writable` is recommended so the error prints readably:

```mojo
@fieldwise_init
struct ValidationError(Copyable, Writable):
    var field: String
    var reason: String

    def write_to(self, mut writer: Some[Writer]):
        writer.write("ValidationError(", self.field, "): ", self.reason)
```

Source: <https://mojolang.org/docs/manual/errors/>.

A typed error is declared in the signature:

```mojo
def validate_username(username: String) raises ValidationError -> String:
    if username.byte_length() == 0:
        raise ValidationError(field="username", reason="cannot be empty")
    if username.count_codepoints() < 3:
        raise ValidationError(
            field="username", reason="must be at least 3 characters"
        )
    return username
```

> Each function can declare at most one error type. The compiler enforces this —
> if any `raise` statement in the function body doesn't match the declared type,
> the program won't compile.

Source: <https://mojolang.org/docs/manual/errors/>.

Typed errors work on GPUs and embedded targets "as long as you avoid
heap-allocated types like `String`." Source:
<https://mojolang.org/docs/manual/errors/>.

## The error type hierarchy

Mojo's error model is not an inheritance hierarchy; it is a set of roles a type
can play. The named types and effects:

| Name | Role |
|------|------|
| `Error` | The built-in default error type, carrying a text message and an optional stack trace. |
| a `raises` error type | Any struct used in `raises YourType`; at most one per function. |
| `Never` | A type with no constructors, used to mark "always raises" or "never raises". |
| `raises Never` | Equivalent to a non-raising function. |
| `-> Never` | The function always raises and never returns a value. |

Source: <https://mojolang.org/docs/manual/errors/>.

### `Never`

> `Never` is a type with no constructors — it can't be instantiated.

- `raises YourErrorType -> Never` — "The function *always* raises and never
  returns a value." Because `Never` can substitute for any type, the compiler
  allows such a function in place of a return value:

```mojo
def panic(msg: String) raises -> Never:
    raise Error(msg)

def get_value_or_panic(maybe: Optional[Int]) raises -> Int:
    if maybe:
        return maybe.value()
    panic("value is missing")
```

- `raises Never -> ReturnType` — "The function *never* raises and always returns
  a value. This is equivalent to omitting `raises` entirely."

Source: <https://mojolang.org/docs/manual/errors/>.

### Parametric raises

A parameterized function can propagate the error type of a function argument. The
function type uses `thin`, because the argument is a noncapturing function value:

```mojo
def run_action[
    ErrorType: AnyType
](action: def() thin raises ErrorType -> Int) raises ErrorType -> Int:
    return action()
```

`ErrorType` is inferred from the function passed in; if the argument does not
raise, the compiler infers `Never` and `run_action` itself becomes non-raising.
Source: <https://mojolang.org/docs/manual/errors/>.

## How errors propagate

Propagation is by return: an unhandled error becomes the caller's error, matching
the caller's declared error type. Two rules govern it:

- **Type erasure through bare `raises`.** A function declared with a bare `raises`
  that calls a typed-error function causes type erasure:

  > Using bare `raises` (without a type) on an function that calls typed-error
  > functions causes *type erasure* — the compiler forgets the specific error
  > type, even though the runtime preserves the error's identity.

  The caller then sees `Error`, not the original type, and loses field access.
  The runtime message still shows the original type's `Writable` output.

- **One error type per `try` context.** A `try` block handles one error type;
  the compiler rejects a block that can raise more than one.

Source: <https://mojolang.org/docs/manual/errors/>.

The official recommendation for code that mixes both styles:

> - **Use `raises YourErrorType`** — Always specify the error type in function
>   signatures. Bare `raises` discards type information.
> - **Use separate `try` blocks** — When calling functions with different error
>   types, use nested or sequential `try` blocks to handle each type
>   independently.

Source: <https://mojolang.org/docs/manual/errors/>.

To convert between styles, wrap the `Error` at an API boundary:

```mojo
def wrapped_validate(value: Int) raises ValidationError -> Int:
    try:
        return validate_with_error(value)
    except e:
        raise ValidationError(field="value", reason=String(e))
```

Source: <https://mojolang.org/docs/manual/errors/>.

## `raise` and `assert`

`raise` and `assert` are both in the keyword reference's error-handling group,
but they are different mechanisms:

| Keyword | Purpose (official keyword table wording) |
|---------|------------------------------------------|
| `raise` | Raises an error |
| `assert` | Aborts if a condition is false (gated by `-D ASSERT`) |

Source: <https://mojolang.org/docs/reference/keywords/>.

The distinction:

- **`raise`** is the explicit, typed mechanism: it produces an error value that
  propagates as an alternate return value and can be caught with `try`/`except`.
- **`assert`** aborts when a condition is false. It is gated by the `-D ASSERT`
  compile-time define, not by `try`/`except`. Its purpose is to state program
  invariants, not to model recoverable failures.

The gating is stated precisely on the feature-toggles page. `-D ASSERT` takes a
value and `debug_assert()` reads it directly:

| `-D ASSERT=` value | Behaviour |
|--------------------|-----------|
| `none` | disable all assertions |
| `safe` (default in non-debug builds) | only run assertions tagged `assert_mode="safe"` |
| `all` | run every `debug_assert()` call |
| `warn` | run every assertion, but emit warnings instead of aborting |

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

Two details that matter when reading the gate:

- `-g` and `-O` **do not affect** assertion behavior; pass `-D ASSERT=...`
  explicitly. A typical debug invocation is `mojo -g -O0 -D ASSERT=all app.mojo`.
- The plain `Bool` form always evaluates its condition, even when assertions are
  disabled. Tag cheap checks `assert_mode="safe"`; leave expensive invariant
  checks untagged. `debug_assert()` is silently disabled on Apple GPU targets.

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

```mojo
debug_assert[assert_mode="safe"](n >= 0, "nth: n must be non-negative")
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

> **Open question:** the keyword reference states that `assert` is "gated by
> `-D ASSERT`", and the feature-toggles page describes the `-D ASSERT` levels as
> controlling `debug_assert()`. The pages do not state one-to-one that the bare
> `assert` statement and `debug_assert()` share the same gate. This book treats
> `-D ASSERT` as the controlling define for both, per the keyword table, and
> recommends `debug_assert()` with an explicit `assert_mode` when you need the
> documented level semantics.

## Deinitialization and linear interactions

Errors interact with the value lifecycle in one important place: **explicitly
destroyed ("linear") types must be consumed on every path, including error
paths.** A function that raises can exit before a `Deinitable where False` value
is destroyed, and the compiler rejects that as an abandoned value.

The `FileBuffer` example from the destruction page shows the shape of the
requirement: an explicit destructor can raise, which "gives you control over how
an instance is deallocated. If a destructor raises an error, the call stack can
return to logic that selects an alternative cleanup path, such as invoking a
secondary destructor."

The same pattern appears with allocations: an `Allocation` must be consumed
before it goes out of scope, so a raising function needs a `try`/`except` that
deallocates before re-raising, or it fails to compile. See
[allocators](../memory/allocators.md) and
[death](../lifecycle/death.md).

> **Pitfall:** `raise e` copies the error; `raise e^` transfers it. A custom
> error type that is not `ImplicitlyCopyable` requires the transfer sigil to
> re-raise. Source: <https://mojolang.org/docs/manual/errors/>.

## Pitfalls

- **Calling a raising function from a non-raising one.** The call must be handled
  with `try`/`except` or the caller must declare `raises`. Source:
  <https://mojolang.org/docs/manual/functions/>.
- **Using bare `raises` with typed errors.** It erases the compile-time type; the
  caller gets `Error` and cannot access structured fields. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **Mixing error types in one `try` block.** The compiler reports
  `cannot call function that may raise 'X' in a context that supports an error
  type of 'Y'`. Use separate blocks. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **Expecting stack traces by default.** They require `MODULAR_DEBUG`, and the
  built-in `Error` is the only type that captures them. `mojo run` also doesn't
  include debug symbols; use `mojo build -g`. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **Treating `assert` as a recoverable error.** It aborts; it is not a `raise`.
  Source: <https://mojolang.org/docs/reference/keywords/>.
- **Assuming `-g`/`-O` change assertions.** They do not; use `-D ASSERT=...`.
  Source: <https://mojolang.org/docs/tools/feature-toggles/>.
- **Declaring more than one error type.** `raises A` is the maximum. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **Forgetting a linear type on an error path.** An explicitly destroyed value
  must be consumed before the function exits, including via `raise`. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.

## Open questions

> **Open question:** whether the bare `assert` statement and `debug_assert()`
> are gated by the same `-D ASSERT` semantics is not stated one-to-one in the
> official pages; see the marker above. Verify both against the compiler if you
> depend on the exact level.

> **Open question:** the errors page describes stack traces as "a feature of the
> built-in `Error` type only" and says typed errors "currently don't capture stack
> traces". Whether a future 1.x release adds typed-error traces is not documented.

## Sources

- Mojo manual — Errors, error handling, and context managers: <https://mojolang.org/docs/manual/errors/>
- Mojo manual — Functions (raising and non-raising): <https://mojolang.org/docs/manual/functions/>
- Mojo reference — Identifiers, keywords, and conventions: <https://mojolang.org/docs/reference/keywords/>
- Mojo tools — Feature toggles (`-D ASSERT`, `debug_assert()`): <https://mojolang.org/docs/tools/feature-toggles/>
- Mojo manual — Value destruction (explicit destruction, raising destructors): <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo manual — Using pointers (allocations and raising functions): <https://mojolang.org/docs/manual/pointers/using-pointers/>
