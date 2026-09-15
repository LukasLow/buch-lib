# from

`from` starts a selective or relative import: it names a module and then the
members to bring into scope. It is the counterpart to `import`.

## Purpose

The official keywords reference defines `from` in one line:

> `from` — Selective import from a module

Source: <https://mojolang.org/docs/reference/keywords/>.

> *Import statements* expose modules and their members to the current scope.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

```mojo
from std.collections import Dict, Set
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## Syntax

```text
from module import name
from module import name as alias
from module import *
from module import (name1, name2,)
from . import name
from .module import name
```

The simple-statements reference gives the main forms:

### Selective imports

```mojo
from std.math import sqrt, pi
from std.collections import Dict as Dictionary   # Alias the imported name
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

### Wildcard imports

```mojo
from std.math import *  # Imports all public names from the std.math module
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

### Multi-line imports

```mojo
from std.collections import (
    Dict,
    Set,
    List,    # Trailing comma is legal
)
```

> Use parentheses to import on multiple lines for readability and support clean
> commit diffs.

Source: <https://mojolang.org/docs/reference/simple-statements/>.

### Relative imports

Relative imports must use `from`:

> Relative imports must use `from` (`from . import foo`); the `import .foo` form
> no longer works.

Source: <https://mojolang.org/releases/v1.0.0/>.

The packages manual shows the same form re-exporting a module from a package's
`__init__.mojo`:

```mojo
from .mymodule import MyPair
```

Source: <https://mojolang.org/docs/manual/packages/>.

## What `from` makes importable

A module is a single `.mojo` file; a package is a directory with
`__init__.mojo`. Both can be named after `from`:

```mojo
from mymodule import MyPair
from mypackage.mymodule import MyPair
```

Source: <https://mojolang.org/docs/manual/packages/>.

And because `__init__.mojo` can re-export, members become importable from the
package name itself:

```mojo
# __init__.mojo
from .mymodule import MyPair
```

```mojo
# main.mojo
from mypackage import MyPair
```

Source: <https://mojolang.org/docs/manual/packages/>.

The standard library uses the same mechanism, which is why some members can be
imported from a package name and others need the module name:

```mojo
from std.algorithm.functional import map
from std.algorithm import map   # because algorithm/__init__.mojo re-exports
```

Source: <https://mojolang.org/docs/manual/packages/>.

## Aliasing imported names

`as` renames either a module or a single imported member:

```mojo
from std.collections import Dict as Dictionary
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

The function-declarations reference explains why this matters for overload
sets — a local declaration cannot collide with an imported name:

```mojo
from some_package import add as imported_add

def add(x: Float64, y: Float64) -> Float64:
    return x + y
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## Imports and overload sets

> An import brings the name in as a non-function reference: you can't add another
> overload to it from your own module, and you can't redefine it. A local
> declaration that collides with an import produces an error.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

Combining functions with the same name from different modules into one overload
set is deprecated in 1.x:

> Importing functions with the same name from different modules, combining them
> into one overload set, is now deprecated and emits a warning; a future release
> will reject the second import. Import the name from a single module instead.

Source: <https://mojolang.org/releases/v1.0.0/>.

## Wildcard imports and shadowing

> Wildcard imports now resolve latest first, textually: declarations imported
> last shadow earlier ones, including those implicitly imported from
> `std.prelude`.

Source: <https://mojolang.org/releases/v1.0.0/>.

## Where imports may appear

Imports "can appear at module level, inside functions, or inside other scopes"
and "don't need to appear at the top of a file". Source:
<https://mojolang.org/docs/reference/simple-statements/>.

The compiler also rejects newlines in the middle of an import statement, except
inside a parenthesized import list. Source:
<https://mojolang.org/releases/v1.0.0/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `import` | The module-level form; `from` adds member selection. |
| `as` | Aliases a module or a single imported member. |
| `comptime` | Not an import keyword; re-exported `comptime` values are ordinary names. |
| `def` | A local function with an imported name is an error; alias instead. |

## Signature vs. body

`from` is a *simple statement*, never part of a signature. It may appear at
module level, inside functions, or inside other scopes.

## Pitfalls

- **`import .foo`.** Invalid; use `from . import foo`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Importing a bare directory.** Only an `__init__.mojo` package is importable
  as a package. Source: <https://mojolang.org/docs/manual/packages/>.
- **Assuming `from pkg import submodule` works without a re-export.** Submodules
  are accessible through the package only when `__init__.mojo` re-exports them;
  otherwise import the submodule absolutely. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Colliding with a local definition.** Import the name under an alias. Source:
  <https://mojolang.org/docs/reference/function-declarations/>.
- **Overloading imported functions from several modules.** Deprecated and
  scheduled to be rejected. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Wildcard imports.** Legal but they obscure provenance and can shadow the
  prelude; prefer explicit name lists.
- **Intra-package use without an explicit import.** Deprecated; write
  `from . import foo`. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Newlines inside an import.** Rejected unless the import list is parenthesized.
  Source: <https://mojolang.org/releases/v1.0.0/>.
- **Confusing `from` with the `for`/`in` grammar.** They are unrelated tokens.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`import`](import.md), [`as`](as.md),
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
