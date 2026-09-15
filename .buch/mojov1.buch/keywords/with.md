# with

`with` manages resources through *context managers*. It runs a block of code
with setup (`__enter__()`) and guaranteed cleanup (`__exit__()`), so resources
are released even when the block exits early or raises an error.

## Purpose

The official keywords reference defines `with` in one line:

> `with` — Context manager statement

Source: <https://mojolang.org/docs/reference/keywords/>.

> A `with` statement manages resources using context managers. *Context
> managers* define setup (`__enter__`) and cleanup (`__exit__`) operations. The
> cleanup always runs when the block exits, even if an error occurs.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

```mojo
with open("file.txt") as f:
    var content = f.read()
# File is closed here, even if an error occurred
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Syntax

```text
with expression:
    body

with expression as name:
    body

with expression as name, expression as name:
    body
```

The `as` target is optional; when present, it binds the value returned by
`__enter__()`. Multiple context managers "can share a single `with` statement",
and the form "is equivalent to nested `with` statements":

```mojo
with open("input.txt") as f_in, open("output.txt", "w") as f_out:
    f_out.write(f_in.read())
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## The protocol: `__enter__()` and `__exit__()`

The two dunder methods are the whole interface:

- "`__enter__()` is called by the `with` statement to enter the runtime context.
  The `__enter__()` method should initialize any state necessary for the context
  and return the context manager."
- "`__exit__()` is called when the `with` code block completes execution, even
  if the `with` code block terminates with a call to `continue`, `break`, or
  `return`. The `__exit__()` method should release any resources associated with
  the context."

Source: <https://mojolang.org/docs/manual/errors/>.

Notably, `__exit__()` is optional:

> A context manager that defines only `__enter__()` is valid; `__exit__()` is
> optional. When the block exits, `__exit__()` is called if it exists, even if
> an error occurs.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

A minimal custom context manager, quoted from the reference:

```mojo
struct Scope(ImplicitlyCopyable):
    var label: String

    def __init__(out self, label: String):
        self.label = label

    def __enter__(self) -> Self:
        # perform setup tasks
        print("entering", self.label)
        return self

    def __exit__(self):
        # perform cleanup tasks
        print("exiting", self.label)

def main():
    with Scope("setup") as s:
        print("inside", s.label)
    # entering setup
    # inside setup
    # exiting setup
```

The reference explains the `ImplicitlyCopyable` conformance: "`__enter__`
returns `self` so the `as` target binds to the manager. The `ImplicitlyCopyable`
conformance lets the compiler return `self` by value." Source:
<https://mojolang.org/docs/reference/compound-statements/>.

The errors manual shows the same idea with a `mut` receiver and a `Timer`:

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

Source: <https://mojolang.org/docs/manual/errors/>.

## Conditional `__exit__()`: suppressing errors

A second `__exit__()` overload may receive the error that occurred:

```mojo
def __exit__(self, error: Error) raises -> Bool
```

> Given the `Error` that occurred as an argument, the method can do any of the
> following:
>
> - Return `True` to suppress the error.
> - Return `False` to re-raise the error.
> - Raise a new error.

Source: <https://mojolang.org/docs/manual/errors/>.

Order of operations on error: "If the `with` code block raises an error, then
the `__exit__()` method runs before any error processing occurs (that is, before
it is caught by a `try`/`except` structure or your program terminates)."
Source: <https://mojolang.org/docs/manual/errors/>.

A parameterized overload handles **typed** errors and preserves their type:

```mojo
def __exit__[ErrType: AnyType](self, err: ErrType) -> Bool
```

Source: <https://mojolang.org/docs/manual/errors/>.

The errors manual warns that "the `__exit__(self, error: Error)` overload
handles only `Error` values", so typed errors need the parameterized form.

## Scope of the `as` binding

> `with` statement variables bound with `as` are scoped to the `with` block:

```mojo
with open("file.txt") as f:
    var data = f.read()
# f is not accessible here
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

When the block ends, the manager is destroyed: "After the `__exit__()` method
returns, the context manager is destroyed." Source:
<https://mojolang.org/docs/manual/errors/>.

## Why use it instead of `try`/`finally`

The errors manual builds the case directly. The naive version forgets that
`read()` can raise:

```mojo
var f = open(input_file, "r")
var content = f.read()   # if this raises, close() never runs
f.close()
```

Rewriting with `try`/`finally` works but is verbose. The `with` form is
equivalent and shorter:

```mojo
with open(input_file, "r") as f:
    var content = f.read()
    # Process the content as needed
```

Source: <https://mojolang.org/docs/manual/errors/>.

Recognised standard-library context managers listed by the manual include
`FileHandle`, `NamedTemporaryFile`, `TemporaryDirectory`,
`BlockingScopedLock`, and `assert_raises`. Source:
<https://mojolang.org/docs/manual/errors/>.

The `open()` call itself raises; a function that uses `with open(...)` must
therefore be declared `raises`, or handle the error.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `as` | Binds the `__enter__()` result to a name, scoped to the block. |
| `try`, `except`, `finally` | The manual equivalent; `with` plus `__exit__()` replaces the common `try`/`finally` pattern. |
| `raise` | `__exit__()` may re-raise or raise a new error. |
| `return`, `break`, `continue` | All still trigger `__exit__()`. |
| `pass` | May be used in a `__exit__()` implementation that does nothing. |
| `struct` | Context managers are structs implementing the dunder protocol. |

## Signature vs. body

`with` is a statement used in function and method bodies and never appears in a
signature. The *protocol* it calls, however, lives in struct declarations:
`__enter__()` and `__exit__()` are method signatures with enforced shapes
(`__exit__(self)` and the optional error overloads).

## Pitfalls

- **Forgetting that `open()` raises.** In the manual's example the block is
  written inside a `raises` context; a non-raising caller must handle the error.
- **Assuming `__exit__()` receives all errors.** The `Error` overload handles
  only `Error`; typed errors require the parameterized
  `__exit__[ErrType]()`. Source: <https://mojolang.org/docs/manual/errors/>.
- **Suppressing by default.** Returning `True` from the error overload swallows
  the error. Return `False` unless suppression is deliberate.
- **Expecting the manager itself after the block.** The `as` name is scoped to
  the block, and "the context manager is destroyed" after `__exit__()`.
  Source: <https://mojolang.org/docs/manual/errors/>.
- **Assuming `__exit__()` is required.** It is optional; a manager with only
  `__enter__()` is valid. If cleanup is required, write it.
- **`__enter__` returning `self` by value.** In the official example this
  depends on `ImplicitlyCopyable`; without such conformance the return may not
  compile. Source: <https://mojolang.org/docs/reference/compound-statements/>.
- **Nested vs. comma-separated managers.** `with a as x, b as y` is equivalent
  to nested `with` statements — the managers are entered left to right and
  exited in reverse.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`as`](as.md), [`try`](try.md), [`except`](except.md),
[`finally`](finally.md), [`raise`](raise.md), [`struct`](struct.md),
[`compound-statements`](../reference/compound-statements.md),
[`error-model`](../errors/error-model.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Errors, error handling, and context managers (manual):
  <https://mojolang.org/docs/manual/errors/>
