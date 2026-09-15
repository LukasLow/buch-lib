# `mojo precompile`

Precompiles a Mojo package.

## Synopsis

```
mojo precompile [options] <path>
```

> **The command is `precompile`, not `package`.** `mojo package` was renamed to
> `mojo precompile` in v1.0.0b2, and the `.mojopkg` extension was deprecated in
> favour of `.mojoc`. Write `mojo precompile` in 1.x. Source:
> <https://mojolang.org/releases/v1.0.0b2/>. See also
> [Mojo 1.0.0](../versions/1.0.0.md).

## Purpose

Precompiles a directory of Mojo source files into a binary package you can share
and import into other Mojo programs and modules.

> A precompiled Mojo package is faster to build with compared to building it from
> source. It is not intended as a distributable format as it is tied to the
> version of the compiler that produced it. Loading a precompiled package using
> a compiler of a different version will error. Despite this, it is technically
> portable across different systems because it is not an architecture-specific
> format (it includes only non-elaborated code). The code becomes an
> architecture-specific executable only after it's imported into a Mojo program
> that is then compiled with `mojo build`.

Source: <https://mojolang.org/docs/cli/precompile/>.

Read that carefully; it is the whole contract:

| Property | Value |
|----------|-------|
| Faster to build against than source | Yes |
| Generic distributable format | **No** — tied to the exact compiler version |
| Architecture-specific | **No** — contains non-elaborated code |
| Errors when loaded by a different compiler version | Yes |
| Becomes architecture-specific | Only after import + `mojo build` |

The manual's packages page repeats the same warning and adds the reason
`.mojoc` is still shareable:

> A `.mojoc` file contains non-elaborated code, so you _can_ share it across
> systems. The code becomes an architecture-specific executable only after it's
> imported into a Mojo program that's then compiled with `mojo build`.
>
> The `.mojoc` format is not intended as a generic distributable format,
> however, as it is tied to the exact version of the compiler that produced it.
> Loading a `.mojoc` file produced by one version of the compiler into another
> version of the compiler will result in a compiler error.

Source: <https://mojolang.org/docs/manual/packages/>.

## Prerequisite: `__init__.mojo`

> To create a Mojo package, first add an `__init__.mojo` file to your package
> directory. Then pass that directory name to this command, and specify the
> output path and filename with `-o`.

Source: <https://mojolang.org/docs/cli/precompile/>.

Without `__init__.mojo`, "Mojo won't recognize the directory as a package and
you can't import `mymodule`." Source:
<https://mojolang.org/docs/manual/packages/>. See
[structure](../project/structure.md) for the package layout and
`__init__.mojo` semantics.

## Options

### Output options

| Option | Meaning |
|--------|---------|
| `-o <PATH>` | Sets the path and filename for the output package. The filename **must end with `.mojoc` or `.mojopkg`**. The filename defines the package name you import (minus the extension). If omitted, a `.mojoc` file is generated in the current working directory, named after the input directory. |

Two consequences the page states directly:

- **The filename is the import name.** "The filename given here defines the
  package name you can then use to import the code (minus the file extension)."
  So `mojo precompile mypackage -o mypack.mojoc` makes the package importable as
  `mypack`, not `mypackage`.
- **You cannot rename by editing the file.** The manual: "If you want to rename
  your package, you cannot simply edit the `.mojoc` filename, because the
  package name is encoded in the file. You must instead run `mojo precompile`
  again to specify a new name." Source:
  <https://mojolang.org/docs/manual/packages/>.

`.mojopkg` is accepted but deprecated. The v1.0.0b2 release notes: "the
`.mojopkg` file extension has been deprecated; favor the `.mojoc` file extension
instead." The import-resolution order prefers `.mojoc` and treats `.mojopkg` as
"legacy" (v1.0.0 release notes). Source:
<https://mojolang.org/releases/v1.0.0b2/>,
<https://mojolang.org/releases/v1.0.0/>.

### Compilation options

| Option | Meaning |
|--------|---------|
| `-I <PATH>` | Appends the given path to the list of directories to search for imported Mojo files. |

Note what is **not** on the 1.x `precompile` page: no `-O`, no `-g`, no `-D`, no
target or linker options. Its compilation surface is only `-I` plus the
diagnostic block. Source: <https://mojolang.org/docs/cli/precompile/>.

### Compilation diagnostic options

| Option | Meaning |
|--------|---------|
| `--diagnose-missing-doc-strings` | Emits diagnostics for missing or partial doc strings. |
| `--max-notes-per-diagnostic <INTEGER>` | Max notes printed with a diagnostic. Default 10. |
| `--disable-builtins` | Do not use builtins when creating the package. |
| `--disable-warnings` | Do not print warning messages. |
| `--experimental-fixit` | Automatically apply fix-its and rerun. "may result in irreversible data loss." |
| `--experimental-export-fixit <YAML_FILE>` | Export fix-its to a clang-tidy YAML file. |
| `--Werror` | Treat warnings as errors. |
| `--Wno-error` | Do not treat warnings as errors. |
| `--warn-on-unstable-apis` | Warn when using unstable APIs from the standard library. |
| `--ignore-incompatible-precompiled-file-errors` | Ignore errors loading incompatible precompiled files. |
| `--ignore-deprecated <NAME>` | Suppress the deprecation warning for the given declaration. |

### Common options

| Option | Meaning |
|--------|---------|
| `--diagnostic-format <FORMAT>` | `text` (default) or `json`. |
| `--help`, `-h` | Displays help information. |
| `--help-hidden` | Displays help for hidden options. |

> **Note — the `-kgenModule` flag was removed.** v1.0.0b2 removed
> `-kgenModule` from `mojo precompile`; it emitted a serialized KGEN module
> (`.mlirbc`) instead of a `.mojoc` package and was only used internally. Do not
> reference it in 1.x. Source: <https://mojolang.org/releases/v1.0.0b2/>.

## Realistic invocations

**Precompile a package with an explicit name.**

```bash
mojo precompile mypackage -o mypack.mojoc
```

**Precompile with default output.** The output is a `.mojoc` named from the
input directory:

```bash
mojo precompile mypackage        # -> ./mypackage.mojoc
```

**Precompile with imports resolved from an extra directory.**

```bash
mojo precompile -I ./vendor mypackage -o mypack.mojoc
```

**Fail the precompile on any warning.**

```bash
mojo precompile --Werror mypackage -o mypack.mojoc
```

**Precompile a package that depends on another precompiled package.**

```bash
mojo precompile -I ./deps depender -o depender.mojoc
```

## How the result is used

The manual documents the source-to-package migration in full. Starting layout:

```ini
main.mojo
mypackage/
    __init__.mojo
    mymodule.mojo
```

`main.mojo` imports through the package name:

```mojo
from mypackage.mymodule import MyPair

def main():
    var mine = MyPair(2, 4)
    mine.dump()
```

Precompile the package, move the source away, and fix the import to match the
new package name:

```sh
mojo precompile mypackage -o mypack.mojoc
```

```ini
main.mojo
mypack.mojoc
```

```mojo
from mypack.mymodule import MyPair
```

"It makes no real difference to Mojo which way you import a package" — from
source files the directory name is the package name; from a compiled package
the filename is the package name. Source:
<https://mojolang.org/docs/manual/packages/>.

## Precompilation in the packaging pipeline

`mojo precompile` is the build step of the official conda packaging flow. The
packaging guide's `recipe.yaml` uses:

```yaml
build:
  script:
    - mojo precompile src/my_mojo_lib -o ${{ PREFIX }}/lib/mojo/my_mojo_lib.mojoc
```

Two rules the guide highlights:

- "It's important that this command outputs the `.mojoc` file into
  `$PREFIX/lib/mojo/`, because this path is what makes the package
  auto-discoverable by the Mojo compiler."
- "The required `mojo-compiler` version must be specified in the
  `requirements.build` section", and `pin_compatible('mojo-compiler')` generates
  the run constraint, "preventing your package from silently running against an
  incompatible runtime."

Source: <https://mojolang.org/docs/tools/packaging/>. See
[packaging and distribution](../project/packaging-and-distribution.md).

## Exit behaviour

- Success: the package file is written; the command exits 0.
- A missing `__init__.mojo`, an unresolvable import or a warning promoted by
  `--Werror` fails the command with a non-zero exit.
- Loading a precompiled file from a different compiler version errors; the
  `--ignore-incompatible-precompiled-file-errors` flag suppresses that error
  when *loading* precompiled files.

> **Open question:** the CLI reference publishes no exit-code table for
> `mojo precompile`. Only `--Werror`/`--Wno-error` document severity control.

## Pitfalls

- **Treating `.mojoc` as a distributable format.** It is compiler-version-locked
  and will error across versions. For distribution, use conda packaging. Sources:
  <https://mojolang.org/docs/cli/precompile/>,
  <https://mojolang.org/docs/tools/packaging/>.
- **Renaming by editing the filename.** The package name is encoded in the file;
  re-run `mojo precompile` with the new `-o` name. Source:
  <https://mojolang.org/docs/manual/packages/>.
- **Forgetting `__init__.mojo`.** The directory is not a package without it, and
  `precompile` needs a package. Source:
  <https://mojolang.org/docs/manual/packages/>.
- **Expecting `-O`/`-g`/`-D` on `precompile`.** The page documents only `-I` and
  the diagnostic block; the emitted `.mojoc` holds non-elaborated code, and
  optimization happens when a consumer runs `mojo build`. Sources:
  <https://mojolang.org/docs/cli/precompile/>,
  <https://mojolang.org/docs/manual/packages/>.
- **A `.mojopkg` shadowing a `.mojoc`.** The compiler now "prefers a `.mojoc`
  module over a stale `.mojopkg` of the same name when both live side by side",
  but the resolution order still lists `.mojopkg` last as "legacy". Prefer
  `.mojoc`. Sources: <https://mojolang.org/releases/v1.0.0b2/>,
  <https://mojolang.org/releases/v1.0.0/>.
- **Confusing `precompile` with `build`.** `precompile` makes an importable
  package; `build` makes an executable or shared library. Source:
  <https://mojolang.org/docs/cli/build/>,
  <https://mojolang.org/docs/cli/precompile/>.
- **Using the old command name.** `mojo package` is gone as of v1.0.0b2; scripts
  copied from pre-1.0 material must be updated to `mojo precompile`. Source:
  <https://mojolang.org/releases/v1.0.0b2/>.

## See also

- [`index`](index.md) — the full command surface, including the `package` →
  `precompile` note.
- [`build`](build.md) — producing executables and shared libraries.
- [Structure](../project/structure.md) — `__init__.mojo`, modules, packages,
  import resolution.
- [Packaging and distribution](../project/packaging-and-distribution.md) —
  `.mojoc` inside a conda package.
- [Versions — Mojo 1.0.0](../versions/1.0.0.md) — the rename record.

## Sources

- `mojo precompile`: <https://mojolang.org/docs/cli/precompile/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Mojo CLI reference (single document): <https://mojolang.org/llms-cli.txt>
- Modules and packages (manual): <https://mojolang.org/docs/manual/packages/>
- Packaging: <https://mojolang.org/docs/tools/packaging/>
- Mojo v1.0.0b2 release notes (`mojo package` → `mojo precompile`, `.mojoc`):
  <https://mojolang.org/releases/v1.0.0b2/>
- Mojo v1.0.0 release notes (import resolution order, `.mojoc` preference):
  <https://mojolang.org/releases/v1.0.0/>
