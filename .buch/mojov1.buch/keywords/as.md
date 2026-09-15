# as

`as` binds a name in two places: it aliases a module or an imported member in an
import statement, and it binds the result of a `with` statement's `__enter__()`.

## Purpose

The official keywords reference defines `as` in one line:

> `as` — Aliasing in imports and `except` clauses

Source: <https://mojolang.org/docs/reference/keywords/>.

`as` is listed under **Imports**, together with `import` and `from`. Source:
<https://mojolang.org/docs/reference/keywords/>.

## Use 1 — aliasing in imports

### Aliasing a module

```mojo
import std.math
import numpy as np            # Alias the module name to avoid collisions
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

The packages manual shows the same for a local module:

```mojo
import mymodule as my

def main():
    var mine = my.MyPair(2, 4)
    mine.dump()
```

Source: <https://mojolang.org/docs/manual/packages/>.

### Aliasing an imported member

```mojo
from std.collections import Dict as Dictionary   # Alias the imported name
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

Aliasing is essential when a local declaration would otherwise collide with an
imported name:

```mojo
from some_package import add as imported_add

def add(x: Float64, y: Float64) -> Float64:
    return x + y
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

`as` also works for package names that are not valid identifiers:

```mojo
import `package-with-hyphens and a space!` as package_without_hyphens_or_a_space
```

Source: <https://mojolang.org/docs/manual/packages/>.

## Use 2 — binding a context manager in `with`

In a `with` statement, `as` binds the value returned by `__enter__()`:

```mojo
with open("file.txt") as f:
    var content = f.read()
# File is closed here, even if an error occurred
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

> When a `with` block is entered, `__enter__()` is called on the context manager
> expression. The result is bound to the `as` target if present.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

The binding is scoped to the block:

> `with` statement variables bound with `as` are scoped to the `with` block:

```mojo
with open("file.txt") as f:
    var data = f.read()
# f is not accessible here
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

Multiple managers may each have their own `as` target:

```mojo
with open("input.txt") as f_in, open("output.txt", "w") as f_out:
    f_out.write(f_in.read())
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Use 3 — the `except` question

The keywords table says `as` is used for "Aliasing in imports and `except`
clauses". However, the errors manual states that Mojo does **not** support
`except ErrorType as e:`:

> Mojo doesn't support `except ErrorType as e:` syntax—the type is always
> inferred from the function being called.

Source: <https://mojolang.org/docs/manual/errors/>.

Every documented error example binds with the bare form `except e:`:

```mojo
try:
    risky()
except e:
    print(e)   # e is the caught error
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

> **Open question:** the official keywords reference lists `as` as "Aliasing in
> imports and `except` clauses", but the 1.x errors manual says the
> `except ErrorType as e:` form is not supported, and no current error example
> uses `as` in an `except` clause. It is unclear whether `as`-in-`except` is a
> planned spelling, a legacy spelling, or a wording slip in the keywords table.
> The run-time `except` binding in 1.x is `except name:`. Verify against the next
> upstream release before documenting an `except … as …` form. Sources:
> <https://mojolang.org/docs/reference/keywords/>,
> <https://mojolang.org/docs/manual/errors/>.

## Use 4 — `for … as`?

There is no `for … as` form. The 1.0 release notes list the binding forms that
are unaffected by the `var` deprecation: "for targets, `with ... as`,
`except ... as`, comprehension targets, and the `_` discard." Source:
<https://mojolang.org/releases/v1.0.0/>.

The `var` warning does not apply to those forms, but note that the documented
`except` spelling in 1.x examples is still `except e:` — see the open question
above.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `import` | `as` aliases a whole module. |
| `from` | `as` aliases a single imported member. |
| `with` | `as` binds the context manager returned by `__enter__()`. |
| `except` | The keywords table mentions `as` here, but 1.x documents only `except e:`. |
| `var` | `as` bindings are not variable declarations and do not need `var`. |

## Signature vs. body

`as` is part of two statements (`import`/`from` and `with`) and never appears in a
signature. In imports it renames a module or member in the current scope; in
`with` it introduces a block-scoped binding.

## Pitfalls

- **Expecting `except ErrorType as e:` to work.** The errors manual says it does
  not; use `except e:` and the compiler infers the type. Source:
  <https://mojolang.org/docs/manual/errors/>.
- **Redeclaring an aliased name.** An alias introduces a name in the same scope;
  importing the same name twice under different aliases is fine, but a local
  definition with the aliased name is a collision.
- **`as` without a target.** Both forms require a name after `as`.
- **Assuming the `with … as` binding outlives the block.** It is scoped to the
  `with` block. Source: <https://mojolang.org/docs/reference/compound-statements/>.
- **Adding `var` to an `as` binding.** `with open(…) as var f` is not the
  documented form; `as` introduces its own binding.
- **Aliasing away readability.** `import math as m` is fine; single-letter aliases
  for standard-library packages make code harder to read.
- **Importing a module under an alias that hides a keyword.** Escaped
  identifiers exist for names that are not valid identifiers, but an alias is
  usually the better fix.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`import`](import.md), [`from`](from.md), [`with`](with.md),
[`except`](except.md), [`simple-statements`](../reference/simple-statements.md),
[`packages-and-modules`](../intro/packages-and-modules.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Modules and packages (manual): <https://mojolang.org/docs/manual/packages/>
- Errors, error handling, and context managers (manual):
  <https://mojolang.org/docs/manual/errors/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
