# return

`return` exits a function and optionally hands a value back to the caller. It is
the statement that ends a function's execution early or produces its result.

## Purpose

The official keywords reference defines `return` in one line:

> `return` — Returns from a function

Source: <https://mojolang.org/docs/reference/keywords/>.

> `return` exits a function and optionally returns a value.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

```mojo
def greet(name: String):
    if not name:   # String is falsy when empty
        return
    print(t"Hello, {name}!")

def get_value() -> Int:
    return 42

def early_exit(items: List[Int], target: Int) -> Bool:
    for item in items:
        if item == target:
            return True
    return False
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## Two forms

`return` may appear with or without a value:

```mojo
return 42       # returns a value
return          # returns None / ends the function early
```

The manual's rule for the implicit case:

> A function without an explicit `return` implicitly returns `None`.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

And the function-declarations reference describes the two interchangeable
declarations:

```mojo
# The following function definitions are equivalent
def greet(name: String):
    print("Hello,", name)

def greet(name: String) -> None:
    print("Hello,", name)
```

Source: <https://mojolang.org/docs/manual/functions/>.

## Where `return` is allowed

> `return` is only valid inside a function.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

```mojo
return 42    # Error: cannot return from this context
```

A bare `return` in a function that is not supposed to return a value is fine;
a `return value` in a function whose declared return type cannot accept the
value is a type error.

## Returning a value: `->` versus named results

A function has two ways to produce a result. Either declare the type with
`->`:

```mojo
def get_greeting() -> String:
    return "Hello"
```

Or declare a named result with the `out` argument convention, in which case the
`return` becomes optional:

> A function with a named result argument doesn't need to include an explicit
> `return` statement ... If the function terminates without a `return`, or at a
> `return` statement with no value, the value of the `out` argument is returned
> to the caller.

Source: <https://mojolang.org/docs/manual/functions/>.

```mojo
def get_name_tag(var name: String, out name_tag: NameTag):
    name_tag = NameTag(name^)
    # no `return` needed; `name_tag` is the result
```

The two signatures are interchangeable to the caller:

```mojo
def get_name_tag(var name: String) -> NameTag:
    ...
def get_name_tag(var name: String, out name_tag: NameTag):
    ...
```

Source: <https://mojolang.org/docs/manual/functions/>.

A function with an `out` argument **cannot** also declare `-> Type`:
"function cannot have both an 'out' argument and an explicit result type."
Source: <https://mojolang.org/docs/reference/function-declarations/>.

## Returning references

A function can return a reference instead of an owned value, but the return type
must carry an origin:

> A function can also return a mutable or immutable reference using a `ref`
> return value.

> Note that you **must** provide an origin specifier for a `ref` return value.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

```mojo
def get_first[T: Copyable](ref data: List[T]) -> ref[data[0]] T:
    return data[0]
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

At the call site, capturing that reference needs a `ref` binding; a plain `var`
receives a copy:

```mojo
var name_copy = list[2]   # owned copy of list[2]
ref name_ref = list[2]    # reference to list[2]
```

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

## `return` and loops

A `return` inside a loop exits the enclosing function immediately, and therefore
also suppresses the loop's `else` clause, exactly like `break`:

> The `else` clause does *not* execute if a `break` or `return` statement
> terminates the `for` loop.

Source: <https://mojolang.org/docs/manual/control-flow/>.

That property is what makes the search-in-a-function idiom work:

```mojo
def early_exit(items: List[Int], target: Int) -> Bool:
    for item in items:
        if item == target:
            return True
    return False
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## `return` and `try`/`finally`

`finally` runs even when the `try` block returns:

> `finally` — Runs after the `try` and any `except` or `else` clause, regardless
> of outcome. It executes even if another clause exits via `continue`, `break`,
> `return`, or by raising a new error.

Source: <https://mojolang.org/docs/manual/errors/>.

A `return` inside a `try` block therefore does not skip cleanup.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `def` | The construct `return` belongs to. |
| `None` | The implicit result of a function without a `return`. |
| `break`, `continue` | Loop control; `return` leaves the whole function instead. |
| `else` | A `return` from a loop body suppresses the loop `else`. |
| `try`, `except`, `finally` | `finally` still runs before a `return` completes. |
| `raise` | The other abrupt way to leave a function. |
| `ref` | Return type spelling for reference results. |

## Signature vs. body

`return` itself is a **body** statement and never appears in a signature. The
*possibility* of returning, however, is part of the signature: `-> T` declares
the result type, and the `raises` effect governs whether the function may also
leave by raising.

## Pitfalls

- **`return` outside a function.** A compile error: "cannot return from this
  context". Source:
  <https://mojolang.org/docs/reference/simple-statements/>.
- **Relying on the implicit `None` at module scope.** A function with no
  `return` returns `None`; do not let a missing result stay silent by accident.
- **Mixing implicit and explicit results.** A function with an `out` argument
  returns the `out` value when a bare `return` (or no return) is used, but can
  return a different value with `return value`. Be explicit about which one you
  mean.
- **`return` and `finally`.** Cleanup in `finally` always runs — do not
  duplicate it at the return site.
- **Returning a local by reference.** A `ref` return value must be tied to an
  origin that outlives the call; returning a reference into a local value is a
  lifetime error. Source:
  <https://mojolang.org/docs/manual/values/lifetimes/>.
- **Transferring a returned local.** Returning a non-`Movable` local value by
  name fails:

  ```mojo
  def create_immovable_object2(var name: String) -> ImmovableObject:
      var obj = ImmovableObject(name^)
      return obj^   # Error: not copyable or movable
  ```

  Constructing directly in the `return` works, or use a named `out` result.
  Source: <https://mojolang.org/docs/manual/functions/>.
- **`raises` is not a value.** A function that can fail declares `raises` in its
  signature and leaves via `raise`, not via a returned sentinel — though
  returning `Optional` or a `Variant` is a valid alternative design.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`None`](none.md), [`raise`](raise.md), [`try`](try.md),
[`finally`](finally.md), [`break`](break.md), [`ref`](ref.md),
[`simple-statements`](../reference/simple-statements.md),
[`function-declarations`](../reference/function-declarations.md),
[`error-model`](../errors/error-model.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Functions (manual): <https://mojolang.org/docs/manual/functions/>
- Lifetimes, origins, and references (manual):
  <https://mojolang.org/docs/manual/values/lifetimes/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Errors, error handling, and context managers (manual):
  <https://mojolang.org/docs/manual/errors/>
