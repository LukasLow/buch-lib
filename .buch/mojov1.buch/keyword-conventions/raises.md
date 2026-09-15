# raises

`raises` is a function **effect**: it declares that a function can raise an
error to its caller. It appears between the argument list and the return arrow,
and an optional error type may follow it.

`raises` is **not a reserved keyword**. It is not in the official keyword
tables; the keywords reference lists it at the end of the *Conventions*
section, because it "has fixed meaning in declarations". See
[the chapter index](index.md).

## What it means

The official sentence:

> `raises` declares that a function can raise errors.

Source: <https://mojolang.org/docs/reference/keywords/>.

The function-declarations reference calls it an *effect* and gives its position:

> Effects appear after the closing parenthesis and before `->`.

> Declares that the function can raise an error. An optional error type can
> follow `raises`.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## Functions are non-raising by default

This is the single most important fact about `raises`: a Mojo function does not
raise unless it says so.

> Mojo functions are _non-raising_ by default. To declare that a function can
> propagate an error to its caller, add the `raises` keyword to the function
> signature. A non-raising function that calls a raising function **must handle
> any possible errors.**

Source: <https://mojolang.org/docs/manual/functions/>.

So a function that calls a raising function has exactly three choices: declare
`raises` itself, handle the error with `try`/`except`, or fail to compile.

```mojo
def raises_error() raises:
    raise Error("There was an error.")

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

## Bare `raises` vs. typed `raises`

`raises` alone means "this function may raise the built-in `Error`". A type name
after `raises` declares a *typed error*:

```mojo
def parse(text: String) raises -> Int:
    # may raise Error
    ...

def validate(value: Int) raises ValidationError -> Int:
    # may raise ValidationError
    ...
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

> A function can specify at most one error type after `raises`.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

The manual explains how typed errors are caught — `except e:` infers the type
from the called function:

```mojo
try:
    var name = validate_username("")
except e:
    # e is a ValidationError — access fields directly
    print("Error in field '" + e.field + "': " + e.reason)
```

Source: <https://mojolang.org/docs/manual/errors/>.

A `try` block handles exactly one error type. Calling functions that raise
different error types in the same `try` block is rejected by the compiler:

```output
error: cannot call function that may raise 'Error' in a context that
supports an error type of 'ValidationError'
```

Source: <https://mojolang.org/docs/manual/errors/>.

## `raises Never`

`Never` is a type that can't be instantiated. It gives two guarantees in a
`raises` clause:

- `raises YourErrorType -> Never` — the function always raises and never
  returns.
- `raises Never -> ReturnType` — the function never raises; this is equivalent
  to omitting `raises`.

```mojo
# These two signatures are equivalent:
def safe_add(a: Int, b: Int) raises Never -> Int:
    return a + b

def safe_add(a: Int, b: Int) -> Int:
    return a + b
```

Source: <https://mojolang.org/docs/manual/errors/>.

## Parametric raises

The error type can be a compile-time parameter, so a higher-order function
propagates the error type of its function argument:

```mojo
def run_action[
    ErrorType: AnyType,
](action: def() thin raises ErrorType -> Int) raises ErrorType -> Int:
    return action()
```

Source: <https://mojolang.org/docs/manual/errors/>.

`run_action` raises `NetworkError` when given a function that raises it, and
`Never` when given a non-raising function. Source:
<https://mojolang.org/docs/manual/errors/>.

## `raises` and closures

In a closure declaration, `raises` goes between the argument list and the
capture list:

```mojo
def name(argument-list) raises {capture-list} -> ReturnType:
    body
```

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

```mojo
def main() raises:
    var y = 2

    def divide(x: Int) raises {var y} -> Int:
        if y == 0:
            raise Error("divide by zero")
        return x // y

    print(divide(10))   # 5
```

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

## `raises` is not part of the signature for overloads

Two functions that differ only in whether they `raises` are the same signature
for overload-set purposes, and the second declaration is rejected:

```mojo
def maybe_raise(x: Int) -> Int:
    return x

# Error because `maybe_raise` already has this signature;
# `raises` isn't part of the signature for overload purposes
def maybe_raise(x: Int) raises -> Int:
    raise Error("nope")
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

If both behaviours are needed, give them different names or argument shapes.

## `raises` and non-Mojo ABIs

Raising functions change the calling convention, so they cannot be combined
with a non-Mojo `abi()`:

> - accepts `def (String) abi("Mojo") raises`
> - rejects `def (String) abi("C") raises`

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## Pitfalls

- **Calling a raising function from a non-raising one.** It is a compile error;
  add `raises` or handle it. Verified above.
- **Forgetting that non-raising is the default.** A bare `def` does not raise,
  even if its body contains a `raise` — the declaration controls the effect.
  Verified above.
- **Declaring two error types.** `raises A B` is not legal; at most one type is
  allowed. Source: <https://mojolang.org/docs/reference/function-declarations/>.
- **Mixing error types in one `try`.** The compiler rejects it; use separate
  `try` blocks or wrap the `Error`. Verified above.
- **Overloading on `raises` alone.** The two declarations are duplicates.
  Verified above.
- **Combining `abi("C")` with `raises`.** Rejected by the compiler. Verified
  above.
- **Using `raises` as an ordinary name.** It is not reserved, so it can be an
  identifier outside a declaration. Source:
  <https://mojolang.org/docs/reference/keywords/>.

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Functions (manual): <https://mojolang.org/docs/manual/functions/>
- Errors, error handling, and context managers (manual):
  <https://mojolang.org/docs/manual/errors/>
- Mojo closure declarations reference:
  <https://mojolang.org/docs/reference/closure-declarations/>
