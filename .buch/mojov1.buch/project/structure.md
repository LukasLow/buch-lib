# Project structure

How to lay out a real Mojo project: modules, packages, `__init__.mojo`, and how
import resolution works. The source is the official manual page
[Modules and packages](https://mojolang.org/docs/manual/packages/), plus the
v1.0.0 release notes for the 1.x import-resolution rules.

## Modules

> A Mojo module is a single Mojo source file that includes code suitable for use
> by other files that import it.

Source: <https://mojolang.org/docs/manual/packages/>.

A module usually has no `main()`:

```mojo title="mymodule.mojo"
struct MyPair:
    var first: Int
    var second: Int

    def __init__(out self, first: Int, second: Int):
        self.first = first
        self.second = second

    def dump(self):
        print(self.first, self.second)
```

> Notice that this code has no `main()` function, so you can't execute
> `mymodule.mojo`. However, you can import this into another file with a
> `main()` function and use it there.

Source: <https://mojolang.org/docs/manual/packages/>.

A module *may* include `main()` and be executable, but "that's generally not the
practice and modules typically include APIs to be imported and used in other Mojo
programs" (<https://mojolang.org/docs/manual/packages/>).

### Importing a sibling module

Three documented forms, all working when `mymodule.mojo` sits next to
`main.mojo`:

```mojo
# Selective import of one member.
from mymodule import MyPair

def main():
    var mine = MyPair(2, 4)
    mine.dump()
```

```mojo
# Import the whole module; reach members through the module name.
import mymodule

def main():
    var mine = mymodule.MyPair(2, 4)
    mine.dump()
```

```mojo
# Alias the module.
import mymodule as my

def main():
    var mine = my.MyPair(2, 4)
    mine.dump()
```

Source: <https://mojolang.org/docs/manual/packages/>.

> In this example, it only works when `mymodule.mojo` is in the same directory as
> `main.mojo`. Currently, you can't import `.mojo` files as modules if they
> reside in other directories. That is, unless you treat the directory as a Mojo
> package.

Source: <https://mojolang.org/docs/manual/packages/>.

## Packages

> A Mojo package is just a collection of Mojo modules in a directory that
> includes an `__init__.mojo` file. By organizing modules together in a
> directory, you can then import all the modules together or individually.
> Optionally, you can also compile the package into a precompiled `.mojoc` file
> that's quicker to load when used as a dependency to another Mojo compile.

Source: <https://mojolang.org/docs/manual/packages/>.

Minimal package layout:

```ini
main.mojo
mypackage/
    __init__.mojo
    mymodule.mojo
```

The import then names the package:

```mojo title="main.mojo"
from mypackage.mymodule import MyPair

def main():
    var mine = MyPair(2, 4)
    mine.dump()
```

```sh
mojo main.mojo
```

```output
2 4
```

Source: <https://mojolang.org/docs/manual/packages/>.

> The `__init__.mojo` file is essential. If you don't have it, Mojo won't
> recognize the directory as a package and you can't import `mymodule`.

Source: <https://mojolang.org/docs/manual/packages/>.

## `__init__.mojo`

The `__init__.mojo` file has three documented properties:

1. **It marks the directory as a package.** "the `__init__.mojo` file is
   required to indicate that a directory should be treated as a Mojo package, and
   it can be empty."
2. **It cannot hold top-level executable code.** "Currently, top-level code is
   not supported in `.mojo` files, so unlike Python, you can't write code in
   `__init__.mojo` that executes upon import. You can, however, add structs and
   functions, which you can then import from the package name."
3. **It re-exports modules into the package namespace.** Instead of defining APIs
   directly, import module members:

   ```mojo title="__init__.mojo"
   from .mymodule import MyPair
   ```

Source: <https://mojolang.org/docs/manual/packages/>.

With that line, the import in `main.mojo` shortens:

```mojo
from mypackage import MyPair
```

Source: <https://mojolang.org/docs/manual/packages/>.

The standard library demonstrates the mechanism: `std.algorithm`'s
`__init__.mojo` contains `from .functional import *` and
`from .reduction import *`, so `from std.algorithm import map` works as well as
`from std.algorithm.functional import map`. The manual cautions: "Which modules
in the standard library are imported to the package scope varies, and is subject
to change" (<https://mojolang.org/docs/manual/packages/>).

## Import resolution in 1.x

The v1.0.0 release notes overhauled the import system. The rules that matter for
project layout:

- **Preference order within a directory.** "Import resolution now follows a
  consistent preference order within a directory: source packages, then
  precompiled `.mojoc` files, then source modules, then legacy precompiled
  `.mojopkg` files. Previously the order was unspecified."
- **Relative imports must use `from`.** "Relative imports must use `from`
  (`from . import foo`); the `import .foo` form no longer works."
- **Absolute dotted imports bind every prefix.** "Absolute imports
  `import a.b.c` now bind all of `a`, `a.b`, and `a.b.c` into the scope, where
  previously only `a.b.c` was available." Also: `import a` followed by
  `import a.b` no longer errors, and function-scoped dotted imports now work.
- **Submodule access requires re-export from `__init__.mojo`.** "An imported
  package's submodules are now only accessible when the package's
  `__init__.mojo` re-exports them (for example, with `from . import sub`). An
  absolute import of the submodule (`import pkg.submodule`) always works,
  bypassing the `__init__.mojo`."
- **Intra-package access needs explicit imports.** "Intra-package accesses
  without explicit `import`s are deprecated and will be removed in a future
  release. A module must now explicitly import symbols defined elsewhere in its
  own package, with `from . import foo`."
- **Regular directories can hold packages too.** "You can now import modules and
  packages through regular (non-package) directories using the same path-like
  syntax, for example, `import dir.nested_dir.module`. An import statement that
  *resolves* to a directory cannot itself be used for scoped lookups."
- **A module cannot import its own name.** "A standalone module can no longer
  import its own name (for example, `import util` inside `util.mojo`)." Modules
  inside packages are unaffected.
- **Name collisions across modules are deprecated.** "Importing functions with
  the same name from different modules, combining them into one overload set, is
  now deprecated and emits a warning; a future release will reject the second
  import. Import the name from a single module instead."
- **Wildcards resolve latest-first, textually.** "Wildcard imports now resolve
  latest first, textually: declarations imported last shadow earlier ones,
  including those implicitly imported from `std.prelude`."
- **Per-site import diagnostics.** "The compiler now emits error diagnostics on
  failed imports per import site, instead of once per module."

All bullets: <https://mojolang.org/releases/v1.0.0/>. Note the pre-1.0 rule that
"Implicit `std` imports are now an error … Imports from the standard library
must now be fully qualified" — write `from std.testing import TestSuite`, not
`from testing import TestSuite` (<https://mojolang.org/releases/v1.0.0b2/>).

## Package naming and identifiers

> Package names are taken from directory names in the case of source packages, or
> the precompiled (`.mojoc`) filename for binary ones.
>
> Note that if the package name is not a valid identifier, an escaped identifier
> may be used instead.

```mojo
import `модул`
import `package-with-hyphens and a space!` as package_without_hyphens_or_a_space

def main():
    `модул`.`здрасти`()
    package_without_hyphens_or_a_space.hello()
```

Source: <https://mojolang.org/docs/manual/packages/>.

See [syntax](../basics/syntax.md) for escaped identifiers and the keywords
reference (<https://mojolang.org/docs/reference/keywords/>). The 1.x release
notes also deprecated using predefined and reserved words as free-function
names (<https://mojolang.org/releases/v1.0.0/>).

## Precompiled packages

A package can be compiled to a `.mojoc` file that loads faster for consumers:

```sh
mojo precompile mypackage -o mypack.mojoc
```

Then:

```ini
main.mojo
mypack.mojoc
```

```mojo
from mypack.mymodule import MyPair
```

> It makes no real difference to Mojo which way you import a package. When
> importing from source files, the directory name works as the package name,
> whereas when importing from a compiled package, the filename is the package
> name (which you specify with the `mojo precompile` command—it can differ from
> the directory name).

And the rename rule: "If you want to rename your package, you cannot simply edit
the `.mojoc` filename, because the package name is encoded in the file. You must
instead run `mojo precompile` again to specify a new name."

Source: <https://mojolang.org/docs/manual/packages/>. See
[`mojo precompile`](../cli/precompile.md) and
[packaging and distribution](packaging-and-distribution.md).

## A recommended project layout

The official pages show the pieces; the assembly below is the practical shape
for a real project, built only from documented elements (`src/`-style source
packages, `test/` per the testing page's commands, `conda.recipe/` per the
packaging guide).

```text
my-mojo-project/
├── src/
│   └── my_package/
│       ├── __init__.mojo          # marks the package; re-exports public API
│       └── core.mojo              # a module
├── test/
│   └── test_core.mojo             # imports my_package; run with `mojo run -I src`
├── examples/
│   └── demo.mojo                  # an executable with main()
├── conda.recipe/
│   └── recipe.yaml                # packaging recipe (packaging guide)
├── pixi.toml                      # environment (pixi page)
├── pixi.lock                      # generated; do not edit by hand
└── README.md
```

The packaging guide's own example layout is the same idea:

```output
my-mojo-lib/
├── src/
│   └── my_mojo_lib/
│       ├── __init__.mojo
│       └── utils.mojo
├── test.mojo
├── conda.recipe/
│   └── recipe.yaml
├── LICENSE
└── README.md
```

Source: <https://mojolang.org/docs/tools/packaging/>.

The test layout matches the testing page's commands, which always pass
`-I src`: `mojo run -I src test/my_math/test_inc.mojo`
(<https://mojolang.org/docs/tools/testing/>).

### Layering

A defensible layering for Mojo (no framework imposes one, so this is a
convention, not a rule):

| Layer | Example | Import rule |
|-------|---------|-------------|
| **Public API** | `my_package/__init__.mojo` | re-exports the package's surface with `from .core import *` |
| **Implementation modules** | `my_package/core.mojo` | may import siblings with `from . import other` |
| **Executables** | `examples/demo.mojo` | imports `from my_package import …`; owns `main()` |
| **Tests** | `test/test_core.mojo` | imports the target; owns `main()` with `TestSuite` |
| **Packaging** | `conda.recipe/recipe.yaml` | not imported |

The intra-package rule is 1.x-specific: "A module must now explicitly import
symbols defined elsewhere in its own package, with `from . import foo`." Source:
<https://mojolang.org/releases/v1.0.0/>.

## Configuration and secrets

> **Open question — there is no documented Mojo mechanism for configuration or
> secrets.** The official Mojo 1.x pages document no configuration file format
> for Mojo programs and no secrets/environment handling beyond reading the
> environment, where the `std.os` package provides OS access
> ("environment, filesystem, process control",
> <https://mojolang.org/docs/std/>). The page inventory mentions "configuration
> and secrets" for this page, but the official docs do not define a Mojo project
> config file. Practical approach: read environment variables via `std.os`, and
> keep secrets out of the repository; do not teach a nonexistent config format.

Similarly, no `.mojo`-specific project file (analogous to `pyproject.toml`) is
documented. Project configuration that *does* exist is external and documented
elsewhere: `pixi.toml` for the environment ([pixi](../tooling/pixi.md)) and
`conda.recipe/recipe.yaml` for packaging
([packaging guide](https://mojolang.org/docs/tools/packaging/)).

## Pitfalls

- **A package directory without `__init__.mojo`.** It is not a package; imports
  fail. Source: <https://mojolang.org/docs/manual/packages/>.
- **Top-level code in `__init__.mojo`.** Not supported; only declarations and
  imports. Source: <https://mojolang.org/docs/manual/packages/>.
- **Importing `.mojo` files from another directory without a package.** Single
  modules only work as siblings; use a package (or `-I`) otherwise. Sources:
  <https://mojolang.org/docs/manual/packages/>,
  <https://mojolang.org/docs/cli/run/>.
- **`import .foo` for relative imports.** The form no longer works; write
  `from . import foo`. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Relying on implicit intra-package imports.** Deprecated; add
  `from . import foo`. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Assuming submodules are reachable through an import.** Only if
  `__init__.mojo` re-exports them, unless you import the submodule absolutely.
  Source: <https://mojolang.org/releases/v1.0.0/>.
- **Bare `std` imports.** Standard-library imports must be fully qualified.
  Source: <https://mojolang.org/releases/v1.0.0b2/>.
- **Two modules defining the same function name used together.** This overload
  merge is deprecated and will be rejected. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Editing a `.mojoc` filename to rename a package.** The name is encoded; re-run
  `mojo precompile -o`. Source: <https://mojolang.org/docs/manual/packages/>.
- **A module importing its own name.** Rejected in 1.x. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Expecting a Mojo config-file format.** None is documented. Source:
  <https://mojolang.org/llms.txt>.

## See also

- [`mojo precompile`](../cli/precompile.md) — turning a package into `.mojoc`.
- [Packaging and distribution](packaging-and-distribution.md) — conda packaging
  of the layout above.
- [CI](ci.md) — running `mojo run -I src …` in a pipeline.
- [Testing](../tooling/testing.md) — the test layout and commands.
- [Pixi](../tooling/pixi.md) — the environment manifest.
- [Syntax](../basics/syntax.md) — identifiers and escaped identifiers.
- [Install](../intro/install.md) — which package provides the compiler.

## Sources

- Modules and packages (manual): <https://mojolang.org/docs/manual/packages/>
- Mojo v1.0.0 release notes (import system overhaul):
  <https://mojolang.org/releases/v1.0.0/>
- Mojo v1.0.0b2 release notes (implicit `std` imports):
  <https://mojolang.org/releases/v1.0.0b2/>
- `mojo precompile`: <https://mojolang.org/docs/cli/precompile/>
- Packaging: <https://mojolang.org/docs/tools/packaging/>
- Testing (test layout and `-I src`): <https://mojolang.org/docs/tools/testing/>
- Mojo standard library (`std.os`): <https://mojolang.org/docs/std/>
- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
