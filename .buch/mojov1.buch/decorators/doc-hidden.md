# @doc_hidden

`@doc_hidden` marks a declaration as hidden from documentation generation. The
declaration stays fully usable in source code; it simply does not appear in the
generated API docs.

> The `@doc_hidden` decorator marks a declaration as hidden from documentation
> generation. It allows you to exclude internal implementation details, special
> methods, or other code from appearing in published API documentation while
> keeping them accessible in your source code.

Source: <https://mojolang.org/docs/reference/decorators/doc-hidden/>.

## Target

`@doc_hidden` applies to `struct`, `def`, methods, `comptime` declarations and
struct fields. Source: <https://mojolang.org/docs/reference/decorators/>.

## The dunder rule

This is the reason the decorator exists at all:

> API members with names starting and ending with double underscores ("dunder"
> members) are always treated as public and included in documentation unless
> they are decorated with `@doc_hidden`.
>
> Mojo treats any other API names starting with a single or double underscore
> (`_` or `__`) as internal and omits them from the generated documentation—no
> need for `@doc_hidden`.

Source: <https://mojolang.org/docs/reference/decorators/doc-hidden/>.

So a helper named `_helper` is hidden automatically, but an alternative
`__init__()` overload cannot be hidden by renaming — dunders are public by
default. `@doc_hidden` is the only way to hide it.

## It only affects documentation

> The `@doc_hidden` decorator only affects documentation generation. Hidden
> declarations are fully accessible in source code and can be accessed like any
> other declaration. The same is true of internal declarations that start with
> underscores—they are internal _by convention_, there are no access
> restrictions.

Source: <https://mojolang.org/docs/reference/decorators/doc-hidden/>.

There is no access control in Mojo here: `_name` and `@doc_hidden` are
conventions, not permissions.

## Usage

```mojo
struct Calculator:
    """A simple calculator struct demonstrating @doc_hidden."""

    var value: Int

    def __init__(out self, initial_value: Int = 0):
        """Creates a new Calculator with an initial value.

        Args:
            initial_value: The starting value for the calculator. Defaults to 0.
        """
        self.value = initial_value

    @doc_hidden
    def __init__(out self):
        """Internal initializer that should not appear in public documentation.

        This constructor exists for implementation purposes but users should
        prefer the constructor that takes an initial value.
        """
        self.value = 0

    def add(mut self, amount: Int):
        """Adds a value to the calculator.

        Args:
            amount: The value to add.
        """
        self.value += amount
```

Source: <https://mojolang.org/docs/reference/decorators/doc-hidden/>.

The no-argument `__init__()` still works; it just does not appear in the docs.

## What can be hidden

- **Functions and methods**, including constructors and other special methods.
  The decorator hides only the overload immediately following it, so one name
  can have both documented and hidden overloads:

  ```mojo
  struct Point:
      @doc_hidden
      def __init__(out self):
          pass
  ```

- **Entire structs** — `@doc_hidden struct InternalHelper:`

- **`comptime` values and members** — `@doc_hidden comptime INTERNAL_CONSTANT = 42`

- **Struct fields** —

  ```mojo
  struct PublicStruct:
      @doc_hidden
      var implementation_detail: Int
  ```

Source: <https://mojolang.org/docs/reference/decorators/doc-hidden/>.

## When to use it

The reference lists three cases:

- Alternative constructors and dunder methods that users should not call
  directly.
- Internal helper methods that are implementation details.
- Deprecated internals kept for compatibility.

Source: <https://mojolang.org/docs/reference/decorators/doc-hidden/>.

## Pitfalls

- **Expecting `@doc_hidden` to restrict access.** It does not; the declaration
  remains fully callable. Verified above.
- **Trying to hide a dunder by renaming it.** Dunders are public by default;
  use `@doc_hidden`. Verified above.
- **Assuming it hides a whole overload set.** It hides only the declaration
  immediately below it. Verified above.
- **Adding it to a name that already starts with `_`.** Such names are already
  omitted; the decorator is redundant there. Verified above.
- **Confusing it with the removed `@doc_private`.** That older spelling was
  removed; the current decorator is `@doc_hidden`. Source:
  <https://mojolang.org/releases/v1.0.0/>.

## Sources

- `@doc_hidden` reference:
  <https://mojolang.org/docs/reference/decorators/doc-hidden/>
- Mojo decorators reference (target table):
  <https://mojolang.org/docs/reference/decorators/>
- Mojo v1.0.0 release notes (`@doc_private` removed):
  <https://mojolang.org/releases/v1.0.0/>
