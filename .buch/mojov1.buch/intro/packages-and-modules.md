# Packages and modules

This page is the map of how Mojo code is organised **on disk** — what a module
is, what a package is, how `__init__.mojo` changes import resolution, how a
package is precompiled, and where an agent should actually put files in a real
project. It is written to be used: every section ends in a decision you can make
about a file path.

It is sourced from the official manual page
[Modules and packages](https://mojolang.org/docs/manual/packages/), the
[Packaging guide](https://mojolang.org/docs/tools/packaging/), and the v1.0.0
release notes for the 1.x import-resolution rules
(<https://mojolang.org/releases/v1.0.0/>).

The project-level companion pages are [project structure](../project/structure.md)
(the recommended layout and layering) and
[packaging and distribution](../project/packaging-and-distribution.md) (turning
the layout into a distributable conda package). This page is the *rules*;
those pages are the *recipes*.

> **Scope note.** The buch documents Mojo `%%mojo.version%%`. Import resolution
> changed in 1.0.0; the rules below are the 1.x rules. The old→new mapping is in
> [Mojo 1.0.0](../versions/1.0.0.md).

## The three levels: file, directory, precompiled file

| Level | What it is | Import name comes from | Marks the unit |
|-------|------------|------------------------|----------------|
| **Module** | A single `.mojo` source file | The file name (minus `.mojo`) | the `.mojo` file |
| **Source package** | A directory of modules | The directory name | an `__init__.mojo` inside it |
| **Precompiled package** | A `.mojoc` file | The file name (minus `.mojoc`) | the `.mojoc` file itself |

The manual's definitions are short and worth keeping verbatim:

> A Mojo module is a single Mojo source file that includes code suitable for use
> by other files that import it.

> A Mojo package is just a collection of Mojo modules in a directory that
> includes an `__init__.mojo` file.

Source: <https://mojolang.org/docs/manual/packages/>.

"It makes no real difference to Mojo which way you import a package. When
importing from source files, the directory name works as the package name,
whereas when importing from a compiled package, the filename is the package name
(which you specify with the `mojo precompile` command—it can differ from the
directory name)." Source: <https://mojolang.org/docs/manual/packages/>.

## Modules

A module is a normal `.mojo` file whose contents are meant to be imported, not
run. The manual's `mymodule.mojo` has no `main()`:

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
practice and modules typically include APIs to be imported and used in other
Mojo programs" (<https://mojolang.org/docs/manual/packages/>).

### Importing a sibling module

Three documented forms work when `mymodule.mojo` sits in the same directory as
`main.mojo`:

```mojo
# 1. Selective import of one member.
from mymodule import MyPair

def main():
    var mine = MyPair(2, 4)
    mine.dump()
```

```mojo
# 2. Import the whole module and reach members through the module name.
import mymodule

def main():
    var mine = mymodule.MyPair(2, 4)
    mine.dump()
```

```mojo
# 3. Alias the module.
import mymodule as my

def main():
    var mine = my.MyPair(2, 4)
    mine.dump()
```

Source: <https://mojolang.org/docs/manual/packages/>.

**The sibling limit is the central pitfall for file placement:**

> In this example, it only works when `mymodule.mojo` is in the same directory as
> `main.mojo`. Currently, you can't import `.mojo` files as modules if they
> reside in other directories. That is, unless you treat the directory as a Mojo
> package, as described in the next section.

Source: <https://mojolang.org/docs/manual/packages/>.

**Decision for an agent:** the moment a second file you want to import does *not*
live next to the importer, stop and make the directory a package (add
`__init__.mojo`), or pass the directory on the search path with `-I`. Do not
create a flat pile of `.mojo` files and expect cross-directory imports to work.

## Packages: a directory with `__init__.mojo`

Minimal source package layout:

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

### `__init__.mojo`: three documented properties

1. **It marks the directory as a package.** "the `__init__.mojo` file is
   required to indicate that a directory should be treated as a Mojo package, and
   it can be empty."
2. **It cannot hold top-level executable code.** "Currently, top-level code is
   not supported in `.mojo` files, so unlike Python, you can't write code in
   `__init__.mojo` that executes upon import. You can, however, add structs and
   functions, which you can then import from the package name."
3. **It re-exports modules into the package namespace.** Instead of defining
   APIs directly, import module members:

   ```mojo title="__init__.mojo"
   from .mymodule import MyPair
   ```

Source: <https://mojolang.org/docs/manual/packages/>.

With that line, the import in `main.mojo` shortens from
`from mypackage.mymodule import MyPair` to `from mypackage import MyPair`
(<https://mojolang.org/docs/manual/packages/>).

The rule behind it: "instead of adding APIs in the `__init__.mojo` file, you can
import module members, which has the same effect by making your APIs accessible
from the package name, instead of requiring the
`<package_name>.<module_name>` notation." Source:
<https://mojolang.org/docs/manual/packages/>.

The standard library demonstrates it. `std.algorithm`'s `__init__.mojo` contains
`from .functional import *` and `from .reduction import *`, so both
`from std.algorithm.functional import map` and `from std.algorithm import map`
work. The manual cautions: "Which modules in the standard library are imported to
the package scope varies, and is subject to change."
(<https://mojolang.org/docs/manual/packages/>)

## Import resolution in 1.x — the rules an agent must apply

The 1.0.0 release notes overhauled the import system "to make name resolution
explicit and consistent" (<https://mojolang.org/releases/v1.0.0/>). The bullets
that decide where a file goes:

- **Preference order within a directory.** "Import resolution now follows a
  consistent preference order within a directory: source packages, then
  precompiled `.mojoc` files, then source modules, then legacy precompiled
  `.mojopkg` files."
- **Relative imports must use `from`.** "Relative imports must use `from`
  (`from . import foo`); the `import .foo` form no longer works."
- **Absolute dotted imports bind every prefix.** "Absolute imports
  `import a.b.c` now bind all of `a`, `a.b`, and `a.b.c` into the scope."
- **Submodule access requires re-export from `__init__.mojo`.** "An imported
  package's submodules are now only accessible when the package's
  `__init__.mojo` re-exports them … An absolute import of the submodule
  (`import pkg.submodule`) always works, bypassing the `__init__.mojo`."
- **Intra-package access needs explicit imports.** "Intra-package accesses
  without explicit `import`s are deprecated and will be removed in a future
  release. A module must now explicitly import symbols defined elsewhere in its
  own package, with `from . import foo`."
- **Regular directories can hold packages too.** "You can now import modules and
  packages through regular (non-package) directories using the same path-like
  syntax, for example, `import dir.nested_dir.module`."
- **A module cannot import its own name.** "A standalone module can no longer
  import its own name (for example, `import util` inside `util.mojo`). Modules
  inside packages are unaffected."
- **Name collisions across modules are deprecated.** "Importing functions with
  the same name from different modules … is now deprecated and emits a warning;
  a future release will reject the second import."
- **Wildcards resolve latest-first, textually.** "Wildcard imports now resolve
  latest first, textually: declarations imported last shadow earlier ones,
  including those implicitly imported from `std.prelude`."

All bullets: <https://mojolang.org/releases/v1.0.0/>.

One more resolution rule from the betas: standard-library imports must be fully
qualified. "Imports from the standard library must now be fully qualified" —
write `from std.testing import TestSuite`, not `from testing import TestSuite`
(<https://mojolang.org/releases/v1.0.0b2/>).

### Names are resolved, not guessed

Two naming facts decide the import string:

- **Package name = directory name** for source packages, or **the `.mojoc`
  filename** for precompiled ones: "Package names are taken from directory names
  in the case of source packages, or the precompiled (`.mojoc`) filename for
  binary ones." Source: <https://mojolang.org/docs/manual/packages/>.
- **Escaped identifiers make invalid names importable.** "Note that if the
  package name is not a valid identifier, an escaped identifier may be used
  instead":

  ```mojo
  import `модул`
  import `package-with-hyphens and a space!` as package_without_hyphens_or_a_space

  def main():
      `модул`.`здрасти`()
      package_without_hyphens_or_a_space.hello()
  ```

  Source: <https://mojolang.org/docs/manual/packages/>.

Identifier rules and escaped backtick identifiers are on
[syntax](../basics/syntax.md) and the keywords reference
(<https://mojolang.org/docs/reference/keywords/>).

## Building / precompiling a package

A source package can be compiled into a `.mojoc` file that loads faster for
consumers:

```sh
mojo precompile mypackage -o mypack.mojoc
```

Afterwards, the package is just the compiled file, and the import uses the file's
name:

```ini
main.mojo
mypack.mojoc
```

```mojo
from mypack.mymodule import MyPair
```

Source: <https://mojolang.org/docs/manual/packages/>.

The manual's contract for the artifact:

> A `.mojoc` file contains non-elaborated code, so you _can_ share it across
> systems. The code becomes an architecture-specific executable only after it's
> imported into a Mojo program that's then compiled with `mojo build`.
>
> The `.mojoc` format is not intended as a generic distributable format,
> however, as it is tied to the exact version of the compiler that produced it.

Source: <https://mojolang.org/docs/manual/packages/>.

And the rename rule: "If you want to rename your package, you cannot simply edit
the `.mojoc` filename, because the package name is encoded in the file. You must
instead run `mojo precompile` again to specify a new name."
(<https://mojolang.org/docs/manual/packages/>)

The command's own page adds that it requires the `__init__.mojo` first — "To
create a Mojo package, first add an `__init__.mojo` file to your package
directory. Then pass that directory name to this command, and specify the output
path and filename with `-o`" (<https://mojolang.org/docs/cli/precompile/>). Full
command reference: [`mojo precompile`](../cli/precompile.md).

### Precompilation inside a conda package

In the packaging pipeline, the `.mojoc` is the build output and its install
location is what makes it discoverable:

```yaml
build:
  script:
    - mojo precompile src/my_mojo_lib -o ${{ PREFIX }}/lib/mojo/my_mojo_lib.mojoc
```

> It's important that this command outputs the `.mojoc` file into
> `$PREFIX/lib/mojo/`, because this path is what makes the package
> auto-discoverable by the Mojo compiler.

Source: <https://mojolang.org/docs/tools/packaging/>. The recipe also pins
`mojo-compiler` in `requirements.build`/`host` and uses
`pin_compatible('mojo-compiler')` in `requirements.run`, because precompiled
files "compile against a specific compiler version and might not be compatible
with other versions" (<https://mojolang.org/docs/tools/packaging/>). The full
recipe is on
[packaging and distribution](../project/packaging-and-distribution.md).

## The packaging guide's documented layout

The packaging guide's example project is the canonical shape:

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

Source: <https://mojolang.org/docs/tools/packaging/>. Note the three structural
facts it encodes: the importable package lives under `src/`, it is a package
because of `__init__.mojo`, and the conda recipe lives at
`conda.recipe/recipe.yaml` (the guide: by convention, "store your recipe in your
project root at `conda.recipe/recipe.yaml`", which is where rattler-build "looks
by default").

The [project structure](../project/structure.md) page extends this into a
working layout with `test/`, `examples/`, `pixi.toml` and a layering table. Its
recommended shape, built only from documented elements:

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
│   └── recipe.yaml                # packaging recipe
├── pixi.toml                      # environment
├── pixi.lock                      # generated; do not edit by hand
└── README.md
```

## Where do I put this file? — a decision table

| The file… | Put it… | Import it as… |
|-----------|---------|---------------|
| Is the entry point of a runnable program | anywhere (commonly project root or `examples/`) | nothing imports it; it owns `main()` |
| Is API code shared with a sibling file in the same directory | next to the importer | `from mymodule import X` |
| Is API code imported from **another** directory | inside the package directory, and the directory gets `__init__.mojo` | `from mypackage.mymodule import X` (or `from mypackage import X` if re-exported) |
| Is a module the rest of the package should see unqualified | import it in `__init__.mojo` with `from .mymodule import X` | `from mypackage import X` |
| Is imported by a module in the same package | keep it in the package | `from . import foo` (explicit — required in 1.x) |
| Is a test | `test/`, importing the package | run with `mojo run -I src test/…` (`-I` adds the search path) |
| Is a package you want to ship | precompile it to `.mojoc`, or conda-package it | `from mypack.mymodule import X` |

The `-I` flag is the documented escape hatch when the package root is not the
working directory: on `mojo run`, `mojo build`, `mojo precompile` and `mojo doc`,
`-I <PATH>` "[a]ppends the given path to the list of directories searched for
imported Mojo files" (<https://mojolang.org/docs/cli/run/>,
<https://mojolang.org/docs/cli/precompile/>). The testing page's commands always
pass `-I src`: `mojo run -I src test/my_math/test_inc.mojo`
(<https://mojolang.org/docs/tools/testing/>).

> **Open question — a native Mojo package manager does not exist yet.** The
> packages page says only: "We're also working on plans for a native Mojo
> package manager." Distribution in 1.x is via conda packages, not a
> Mojo-native registry. Do not teach a `mojo add`-style command. Sources:
> <https://mojolang.org/packages/>,
> <https://mojolang.org/docs/tools/packaging/>.

## Pitfalls

- **A package directory without `__init__.mojo`.** It is not a package; the
  import fails. Source: <https://mojolang.org/docs/manual/packages/>.
- **Top-level code in `__init__.mojo`.** Not supported; only declarations and
  imports. Source: <https://mojolang.org/docs/manual/packages/>.
- **Importing a `.mojo` file from another directory without a package.** Single
  modules only work as siblings; use a package or `-I`. Sources:
  <https://mojolang.org/docs/manual/packages/>,
  <https://mojolang.org/docs/cli/run/>.
- **`import .foo` for relative imports.** The form no longer works; write
  `from . import foo`. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Relying on implicit intra-package imports.** Deprecated; add
  `from . import foo`. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Assuming a submodule is reachable through an import.** Only if
  `__init__.mojo` re-exports it, unless you import the submodule absolutely.
  Source: <https://mojolang.org/releases/v1.0.0/>.
- **Bare `std` imports.** Standard-library imports must be fully qualified.
  Source: <https://mojolang.org/releases/v1.0.0b2/>.
- **Two modules defining the same imported function name.** The overload merge is
  deprecated and will be rejected. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Editing a `.mojoc` filename to rename a package.** The name is encoded;
  re-run `mojo precompile -o`. Source:
  <https://mojolang.org/docs/manual/packages/>.
- **A module importing its own name.** Rejected in 1.x. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Shipping a `.mojoc` across compiler versions.** It errors; distribute a conda
  package instead. Sources: <https://mojolang.org/docs/manual/packages/>,
  <https://mojolang.org/docs/tools/packaging/>.

## See also

- [Project structure](../project/structure.md) — the recommended layout and
  layering, with the same rules applied.
- [Packaging and distribution](../project/packaging-and-distribution.md) —
  `.mojoc`, the conda recipe, and the `modular-community` channel.
- [`mojo precompile`](../cli/precompile.md) — the precompilation command in
  full.
- [Packages and environments](packages-and-environments.md) — getting packages
  and dependencies into a project.
- [Syntax](../basics/syntax.md) — identifiers and escaped identifiers.
- [Import](../keywords/import.md) and [`from`](../keywords/from.md) — the
  keyword pages.
- [Testing](../tooling/testing.md) — the `-I src` test layout.

## Sources

- Modules and packages (manual): <https://mojolang.org/docs/manual/packages/>
- Packaging: <https://mojolang.org/docs/tools/packaging/>
- `mojo precompile`: <https://mojolang.org/docs/cli/precompile/>
- `mojo run` (`-I`): <https://mojolang.org/docs/cli/run/>
- Mojo testing (`-I src`): <https://mojolang.org/docs/tools/testing/>
- Mojo v1.0.0 release notes (import-resolution overhaul):
  <https://mojolang.org/releases/v1.0.0/>
- Mojo v1.0.0b2 release notes (fully qualified `std` imports):
  <https://mojolang.org/releases/v1.0.0b2/>
- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Packages (distribution, native manager only planned):
  <https://mojolang.org/packages/>
