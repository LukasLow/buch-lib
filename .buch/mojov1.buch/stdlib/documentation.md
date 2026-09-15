# documentation

`documentation` controls what appears in generated Mojo documentation.

> Documentation built-ins: decorators and utilities for doc generation.

> The `documentation` package provides tools for controlling documentation
> generation and visibility in Mojo. It offers decorators and utilities that
> influence how APIs appear in generated documentation, allowing library authors
> to hide implementation details while maintaining clean public interfaces.

> Use this package when authoring libraries to control which symbols appear in
> generated documentation, hide internal implementation details, or manage the
> public API surface shown to users.

Source: <https://mojolang.org/docs/std/documentation/>.

## The API

The package has one module, `documentation`, providing:

> Provides decorators and utilities for interacting with Mojo documentation
> generation and validation.

Source: <https://mojolang.org/docs/std/documentation/documentation/>.

Its documented symbol is `doc_hidden`:

> Indicate that the decorated declaration is hidden from documentation
> generation.

Source: <https://mojolang.org/docs/std/documentation/documentation/doc_hidden/>.

## Usage: `@doc_hidden`

The decorator is applied to a declaration you do not want in the generated docs:

```mojo
from std.documentation import doc_hidden

@doc_hidden
def internal_helper(x: Int) -> Int:
    """Implementation detail — never appears in `mojo doc` output."""
    return x * 2
```

The decorator's job is exactly this: the declaration still compiles and is still
callable; it is simply omitted from documentation generation. Source:
<https://mojolang.org/docs/std/documentation/documentation/doc_hidden/>.

The book's decorator reference covers `@doc_hidden` in context:
[doc-hidden](../decorators/doc-hidden.md). Generating the documentation itself
is the job of `mojo doc`, covered in [`cli/doc.md`](../cli/doc.md).

## Idioms

- **Hide implementation details, not bugs.** `@doc_hidden` controls doc output;
  it does not change visibility or access.
- **Prefer a leading underscore-style internal name *and* `@doc_hidden`** when a
  helper must be public for technical reasons but is not part of the API.
- **Do not hide the public API surface.** The package is for hiding internals; a
  hidden public entry point is a documentation defect.
- **Pair it with a real docstring** on the declarations that do appear.

## Pitfalls

- **Expecting `@doc_hidden` to enforce encapsulation.** It only affects generated
  documentation.
- **Hiding something users need.** Anything not in the docs effectively does not
  exist for an offline reader.
- **Assuming the decorator set is larger than documented.** The package page
  documents `doc_hidden`; utility helpers beyond it are not enumerated there.
- **Assuming a stable API.** See below.

> **Open question:** the package description says it offers "decorators and
> utilities ... for interacting with Mojo documentation generation and
> validation", but the package-level Markdown names only `doc_hidden`. The
> additional validation utilities are not enumerated at that level; read
> <https://mojolang.org/docs/std/documentation/documentation/> for the complete
> module surface before relying on a helper beyond `doc_hidden`.

## Stability

The `documentation` package page and its module page show **no
`@stable(since=...)` marker** and no stability badges. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — `doc_hidden` and any sibling utilities are **unstable by default**.
Sources: <https://mojolang.org/docs/std/documentation/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `documentation` package: <https://mojolang.org/docs/std/documentation/>
- Mojo `documentation` module: <https://mojolang.org/docs/std/documentation/documentation/>
- Mojo `doc_hidden`: <https://mojolang.org/docs/std/documentation/documentation/doc_hidden/>
- Mojo decorators reference: <https://mojolang.org/docs/reference/decorators/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
