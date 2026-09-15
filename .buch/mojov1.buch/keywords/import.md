# import

`import` brings a module or package into the current scope. It is one of the
three import keywords, alongside `from` (selective imports) and `as` (aliasing).

## Purpose

The official keywords reference defines `import` in one line:

> `import` — Imports a module

Source: <https://mojolang.org/docs/reference/keywords/>.

> *Import statements* expose modules and their members to the current scope.
> Imports can appear at module level, inside functions, or inside other scopes.
> They don't need to appear at the top of a file.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

```mojo
import std.math
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## Syntax

```text
import module
import module as alias
import a.b.c
```

> Use parentheses to import on multiple lines for readability and support clean
> commit diffs:

```mojo
from std.collections import (
    Dict,
    Set,
    List,    # Trailing comma is legal
)
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

The module form allows the alias and the dotted path:

```mojo
import std.math
import numpy as np            # Alias the module name to avoid collisions
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## Accessing members after a module import

After `import mymodule`, members are reached through the module name:

```mojo
import mymodule

def main():
    var mine = mymodule.MyPair(2, 4)
    mine.dump()
```

Source: <https://mojolang.org/docs/manual/packages/>.

An alias shortens that:

```mojo
import mymodule as my

def main():
    var mine = my.MyPair(2, 4)
    mine.dump()
```

Source: <https://mojolang.org/docs/manual/packages/>.

## Import resolution order

Since 1.0 the resolution order within a directory is specified:

> Import resolution now follows a consistent preference order within a
> directory: source packages, then precompiled `.mojoc` files, then source
> modules, then legacy precompiled `.mojopkg` files.

Source: <https://mojolang.org/releases/v1.0.0/>.

## Dotted imports bind every prefix

```
Absolute imports `import a.b.c` now bind all of `a`, `a.b`, and `a.b.c` into the
scope, where previously only `a.b.c` was available.
```

Source: <https://mojolang.org/releases/v1.0.0/>.

Two related bugs were fixed at the same time: `import a` followed by `import a.b`
no longer errors, and function-scoped dotted imports now work. Source:
<https://mojolang.org/releases/v1.0.0/>.

## Where imports may appear

> Imports can appear at module level, inside functions, or inside other scopes.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

Function-scoped imports are legal, including dotted ones:

> function-scoped dotted imports (`import a.b` inside a function body) now work.

Source: <https://mojolang.org/releases/v1.0.0/>.

## Packages and `__init__.mojo`

A Mojo package is a directory containing an `__init__.mojo` file:

> A Mojo package is just a collection of Mojo modules in a directory that
> includes an `__init__.mojo` file.

> The `__init__.mojo` file is essential. If you don't have it, Mojo won't
> recognize the directory as a package and you can't import `mymodule`.

Source: <https://mojolang.org/docs/manual/packages/>.

A package's submodules are only reachable through the package name when the
`__init__.mojo` re-exports them, but an absolute import of the submodule always
works:

> An imported package's submodules are now only accessible when the package's
> `__init__.mojo` re-exports them (for example, with `from . import sub`). An
> absolute import of the submodule (`import pkg.submodule`) always works,
> bypassing the `__init__.mojo`.

Source: <https://mojolang.org/releases/v1.0.0/>.

## Escaped identifiers as package names

> Note that if the package name is not a valid identifier, an escaped identifier
> may be used instead:

```mojo
import `модул`
import `package-with-hyphens and a space!` as package_without_hyphens_or_a_space
```

Source: <https://mojolang.org/docs/manual/packages/>.

## Imports and overload sets

Imported names are **not** extendable. The function-declarations reference
explains that "An import brings the name in as a non-function reference: you
can't add another overload to it from your own module, and you can't redefine
it. A local declaration that collides with an import produces an error." Source:
<https://mojolang.org/docs/reference/function-declarations/>.

The workaround is an alias:

```mojo
from some_package import add as imported_add

def add(x: Float64, y: Float64) -> Float64:
    return x + y
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## What changed in 1.0

Additional import changes quoted from the release notes:

- "Relative imports must use `from` (`from . import foo`); the `import .foo` form
  no longer works."
- "Intra-package accesses without explicit `import`s are deprecated and will be
  removed in a future release."
- "You can now import modules and packages through regular (non-package)
  directories using the same path-like syntax, for example,
  `import dir.nested_dir.module`."
- "A standalone module can no longer import its own name (for example,
  `import util` inside `util.mojo`)."
- "Importing functions with the same name from different modules, combining them
  into one overload set, is now deprecated and emits a warning."
- "Wildcard imports now resolve latest first, textually: declarations imported
  last shadow earlier ones, including those implicitly imported from
  `std.prelude`."
- "The compiler now emits error diagnostics on failed imports per import site,
  instead of once per module."
- "The compiler now rejects newlines in the middle of certain statements ...:
  Anywhere in the midst of an `import` statement, save for parenthesized import
  lists."

Source: <https://mojolang.org/releases/v1.0.0/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `from` | Selective or relative import; `from module import name`. |
| `as` | Aliases a module or an imported name. |
| `comptime` | Not an import keyword, but `comptime` values can be exported by modules. |
| `def` | An import collides with a same-named local function; use an alias. |

## Signature vs. body

`import` is a *simple statement* — never part of a signature. It may appear at
module level, inside functions, or inside other scopes, and it does not need to
be at the top of a file. Source:
<https://mojolang.org/docs/reference/simple-statements/>.

## Pitfalls

- **`import .foo`.** No longer valid; relative imports must use
  `from . import foo`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Importing a directory without `__init__.mojo`.** The directory is not a
  package and cannot be imported. Source:
  <https://mojolang.org/docs/manual/packages/>.
- **Importing a `.mojo` file in another directory.** "Currently, you can't import
  `.mojo` files as modules if they reside in other directories. That is, unless
  you treat the directory as a Mojo package." Source:
  <https://mojolang.org/docs/manual/packages/>.
- **A local definition with an imported name.** Rejected; the reference notes the
  collision is an error, and the fix is `from … import name as alias`. Source:
  <https://mojolang.org/docs/reference/function-declarations/>.
- **Intra-package use without an explicit import.** Deprecated and scheduled for
  removal; write `from . import foo`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **A module importing itself.** No longer allowed. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Shadowing surprises from wildcard imports.** With `from … import *`, later
  imports shadow earlier ones, including `std.prelude` names. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Top-level code in `__init__.mojo`.** Not supported; unlike Python, code there
  does not execute on import. Source: <https://mojolang.org/docs/manual/packages/>.
- **Precompiled package version mismatch.** "Loading a `.mojoc` file produced by
  one version of the compiler into another version of the compiler will result in
  a compiler error." Source: <https://mojolang.org/docs/manual/packages/>.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`from`](from.md), [`as`](as.md),
[`simple-statements`](../reference/simple-statements.md),
[`packages-and-modules`](../intro/packages-and-modules.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Modules and packages (manual): <https://mojolang.org/docs/manual/packages/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
