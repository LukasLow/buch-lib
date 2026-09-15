# @explicit_destroy

`@explicit_destroy` disables automatic destruction for a struct and requires
callers to end a value's lifetime with a **named destructor method**. If a value
is abandoned without such a call, the compiler emits an error.

> The `@explicit_destroy` decorator disables automatic destruction via the
> `__del__()` method and requires explicit cleanup through named destructor
> methods. When applying this decorator, you must call a named destructor method
> to consume the value. If you don't, the compiler emits an error.

Source: <https://mojolang.org/docs/reference/decorators/explicit-destroy/>.

> **Open question:** the official decorator page still spells the automatic
> destructor `__del__()` in its opening paragraph and its "Implicit vs. explicit
> destruction" section, but 1.0 renamed the destructor to `__deinit__()`
> (`__del__()` still works with a deprecation warning). The quotation is kept
> verbatim; read `__del__()` as today's `__deinit__()`. Source:
> <https://mojolang.org/releases/v1.0.0/>. See
> [`versions/1.0.0`](../versions/1.0.0.md).

Use it when cleanup must be deliberate: it can fail and need error handling, it
has multiple valid outcomes, or its order matters. The reference's examples are
saving-and-closing versus discarding buffered data.

## Target

`@explicit_destroy` applies to `struct` declarations only. Source:
<https://mojolang.org/docs/reference/decorators/>.

## Implicit versus explicit destruction

Mojo has two destruction models:

- **Implicit destruction (the default).** The compiler calls `__deinit__()`
  automatically when a value has no further uses. You may override
  `__deinit__()`, but the compiler does not verify that any cleanup actually
  happened.
- **Explicit destruction.** Automatic destruction is off. You must call a named
  destructor method before the value leaves scope. Failing to do so is a
  compile-time error.

Source: <https://mojolang.org/docs/reference/decorators/explicit-destroy/>.

## Basic usage

Mark the type and define named destructors that take `deinit self`:

```mojo
@explicit_destroy
struct FileBuffer:
    var path: String
    var data: String

    def __init__(out self, path: String):
        self.path = path
        self.data = ""

    def write(mut self, content: String):
        self.data += content

    def save_and_close(deinit self) raises:
        write_to_disk(self.path, self.data)
```

Source: <https://mojolang.org/docs/reference/decorators/explicit-destroy/>.

Calling one is mandatory; the transfer sigil consumes the value:

```mojo
def write_log(path: String, message: String) raises:
    var buffer = FileBuffer(path)
    buffer.write(message)
    buffer^.save_and_close()  # Required before `buffer` leaves scope
```

Source: <https://mojolang.org/docs/reference/decorators/explicit-destroy/>.

Unlike `__deinit__()`, a named destructor may raise, which is one reason to opt
into explicit destruction. Source:
<https://mojolang.org/docs/manual/lifecycle/death/>.

## Custom error messages

`@explicit_destroy` takes an optional string that appears in the compiler's
diagnostic when a value is abandoned:

```mojo
@explicit_destroy("Must call save_and_close() or discard()")
struct FileBuffer:
    def save_and_close(deinit self) raises:
        write_to_disk(self.path, self.data) # Store data

    def discard(deinit self):
        pass  # Abandon without writing
```

Source: <https://mojolang.org/docs/reference/decorators/explicit-destroy/>.

In 1.0 the message argument is required — using `@explicit_destroy` without it
is an error, and the decorator no longer opts the type out of `Deinitable`:

> The `@explicit_destroy` decorator no longer opts a struct out of `Deinitable`
> conformance. Use `Deinitable where False` instead... Use
> `@explicit_destroy("custom error")` to give users additional instruction when
> an instance cannot be deleted implicitly. Using `@explicit_destroy` without an
> error-string argument is now an error.

Source: <https://mojolang.org/releases/v1.0.0/>.

## The `deinit self` convention

The named destructor's `self` uses the `deinit` convention, which means it takes
ownership and marks the value destroyed. A `deinit self` method can chain to
another `deinit` method, delegating cleanup. See
[`keyword-conventions/deinit`](../keyword-conventions/deinit.md) and the
lifecycle page. Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

## Interaction with parameterized code

Generic code over `AnyType` can accept both `Deinitable` and explicitly
destructible values, but it can't automatically destroy the latter — explicit
destructors are type-specific and cannot be named generically. Options given by
the manual:

- accept the value by reference instead of by ownership,
- return or transfer it instead of consuming it,
- require `Deinitable` so `__deinit__()` can run automatically.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

## Pitfalls

- **Forgetting the destructor call.** It is a compile-time error; the value is
  "abandoned without being explicitly destroyed". Verified above.
- **Omitting the error string.** In 1.0 that is itself an error. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Expecting `@explicit_destroy` to opt out of `Deinitable`.** It no longer
  does; write `struct T(Deinitable where False):`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Calling a normal `__deinit__` explicitly.** Don't call destructors by hand;
  use the named destructor API the type provides. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Making the named destructor non-raising when cleanup can fail.** Named
  destructors may raise; use that. Source:
  <https://mojolang.org/docs/reference/decorators/explicit-destroy/>.
- **Trying to destroy a linear value generically.** Parameterized code cannot
  name the type's destructor; constrain or borrow instead. Verified above.

## Sources

- `@explicit_destroy` reference:
  <https://mojolang.org/docs/reference/decorators/explicit-destroy/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
- Value destruction (manual):
  <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo v1.0.0 release notes:
  <https://mojolang.org/releases/v1.0.0/>
