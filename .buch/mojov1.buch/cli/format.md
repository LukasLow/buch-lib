# `mojo format`

Formats Mojo source files.

## Synopsis

```
mojo format [options] <sources...>
```

## Purpose

> Formats the given set of Mojo sources using a Mojo-specific lint tool.

Source: <https://mojolang.org/docs/cli/format/>.

`mojo format` is a formatter: it rewrites the given files in place according to
Mojo's canonical style. It ships with the full `mojo` package, not with
`mojo-compiler` (<https://mojolang.org/docs/faq/>).

Unlike `run`, `build`, `doc` and `precompile`, `format` takes a **list** of
sources (`<sources...>`) and has no compilation or target options.

## Options

`mojo format` documents exactly three option groups.

### Format options

| Option | Meaning |
|--------|---------|
| `--line-length <INTEGER>`, `-l <INTEGER>` | Sets the max character line length. Default is 80. |

This is the whole configuration surface documented on the 1.x page. There is no
documented config file, no `--check`/dry-run flag, no include/exclude pattern
flag, and no per-directory override on the CLI page. Source:
<https://mojolang.org/docs/cli/format/>.

### Diagnostic options

| Option | Meaning |
|--------|---------|
| `--quiet`, `-q` | Disables non-error messages. |

### Common options

| Option | Meaning |
|--------|---------|
| `--help`, `-h` | Displays help information. |
| `--help-hidden` | Displays help for hidden options. |

> **Open question — configuration.** The CLI page names no configuration file
> for the formatter. The style guide (official
> <https://mojolang.org/docs/reference/cheat-sheets/> and the manual's style
> material) recommends the formatter, but the 1.x CLI reference documents only
> `--line-length`. Whether a project-level formatter config (a `pyproject.toml`
> table or similar) is supported is not stated on the official 1.x pages.
> Verify before teaching one. Sources:
> <https://mojolang.org/docs/cli/format/>,
> <https://mojolang.org/docs/api-docs/stability/>.

## Realistic invocations

**Format one file.**

```bash
mojo format app.mojo
```

**Format several sources at once.**

```bash
mojo format app.mojo lib/util.mojo tests/test_app.mojo
```

**Format a directory.** The synopsis accepts multiple paths; passing the package
directory formats all sources under it.

```bash
mojo format mypackage
```

> **Open question:** the page's synopsis says `<sources...>` and does not state
> whether a *directory* argument is expanded recursively. The `mojo doc` page
> explicitly says a directory input is processed "recursively", but the `format`
> page has no such sentence. Verify recursive directory expansion before relying
> on it. Source: <https://mojolang.org/docs/cli/format/>.

**Use a wider line length for a codebase that already uses 100 columns.**

```bash
mojo format --line-length 100 mypackage
```

or with the short flag:

```bash
mojo format -l 100 mypackage
```

**Quietly, in a script.**

```bash
mojo format -q src/
```

## Exit behaviour

- Success: the files are rewritten and the command exits 0.
- Errors: malformed source that cannot be parsed produces an error diagnostic
  and a non-zero exit (the `--quiet` flag only suppresses *non-error* messages).

> **Open question:** the CLI reference does not state `mojo format`'s exit codes
> or whether it returns non-zero when files were changed. Since no
> `--check`/`--dry-run` is documented, a CI "is the tree formatted?" gate is not
> expressible with the documented flags alone; one would have to format and then
> inspect `git diff`. Verify whether an undocumented check mode exists before
> building a CI gate on it. Source: <https://mojolang.org/docs/cli/format/>.

## The formatter and closures

One documented formatter behaviour is worth recording because it shows the
formatter tracks the language:

> `mojo format` now accepts the bare move-capture form `{name^}` in closure
> capture lists. Previously only the equivalent `{var name^}` form round-tripped
> through the formatter.

Source: <https://mojolang.org/releases/v1.0.0b2/>.

## Linting and `--warn-on-unstable-apis`

The format page describes the tool as "a Mojo-specific lint tool", but the only
*documented* static-analysis surface in 1.x is a compiler flag, not a standalone
linter:

- **No standalone `mojo lint` command exists** in the 1.x command list. The
  command list is `run`, `build`, `repl`, `debug`, `precompile`, `format`,
  `doc`, `demangle` (<https://mojolang.org/docs/cli/>).
- The closest thing is `--warn-on-unstable-apis`, a compilation diagnostic
  option available on `run`, `build`, `debug`, and `precompile`. It "Warn[s]
  when using unstable APIs from the standard library."
- The official stability page is honest about its current value:

  > When you invoke Mojo with the `--warn-on-unstable-apis` flag, it issues a
  > warning for each unstable API you use. We don't currently recommend this
  > because the stable API set is small.

  Source: <https://mojolang.org/docs/api-docs/stability/>.

So: the documented linting story is **the compiler's warning set** —
`--diagnose-missing-doc-strings`, `--warn-on-unstable-apis`, `--Werror` and the
fix-it machinery (`--experimental-fixit`,
`--experimental-export-fixit`). There is no separate linter binary, and the
stable-API warning set is deliberately small. Do not present
`--warn-on-unstable-apis` as a general-purpose quality gate.

| Mechanism | Command | What it catches |
|-----------|---------|-----------------|
| `--diagnose-missing-doc-strings` | `run`, `build`, `debug`, `precompile`, `doc` | Missing or partial doc strings. |
| `--warn-on-unstable-apis` | `run`, `build`, `debug`, `precompile` | Uses of unstable stdlib APIs (set is small). |
| `--Werror` / `--Wno-error` | all compiling commands + `doc` | Promotion of warnings to errors. |
| `--experimental-fixit` / `--experimental-export-fixit` | `run`, `build`, `precompile` | Applies/exports compiler fix-its. |
| `--ignore-deprecated <NAME>` | all compiling commands + `doc` | Suppresses a specific deprecation warning. |
| `mojo format --line-length` | `format` | Formatting only; no semantic checks. |

Sources: <https://mojolang.org/docs/cli/build/>,
<https://mojolang.org/docs/cli/doc/>,
<https://mojolang.org/docs/cli/format/>,
<https://mojolang.org/docs/api-docs/stability/>.

> **Open question — "lint tool" wording.** The format page calls the formatter
> "a Mojo-specific lint tool", but no linting behaviour (semantic rules, style
> warnings) is documented for `mojo format` beyond `--line-length` formatting.
> The 1.x pages do not describe lint rules for the formatter. Treat "lint tool"
> as the page's name for the formatting engine, not as a claim that `mojo
> format` performs semantic linting. Sources:
> <https://mojolang.org/docs/cli/format/>,
> <https://mojolang.org/llms-cli.txt>.

## Pitfalls

- **It edits files in place.** There is no documented dry-run/check flag. Run it
  on a clean working tree so the diff is reviewable. Source:
  <https://mojolang.org/docs/cli/format/>.
- **Only `--line-length` is configurable.** Do not invent other formatter
  options or a config file; the page documents none. Source:
  <https://mojolang.org/docs/cli/format/>.
- **`--quiet` is not `--Werror`.** `-q` suppresses non-error messages; it does
  not make the formatter fail on anything. Source:
  <https://mojolang.org/docs/cli/format/>.
- **Do not expect a separate linter.** The documented static analysis is the
  compiler's warning flags, and `--warn-on-unstable-apis` is explicitly not
  recommended as a general gate because the stable set is small. Source:
  <https://mojolang.org/docs/api-docs/stability/>.
- **The formatter and the compiler can disagree about new syntax.** The move
  capture form `{name^}` needed an explicit formatter fix in v1.0.0b2; pin the
  toolchain and re-run the formatter after upgrading. Source:
  <https://mojolang.org/releases/v1.0.0b2/>.

## See also

- [`index`](index.md) — the full command surface.
- [Formatter and linter](../tooling/formatter-and-linter.md) — the topic page
  for this command and for the warning flags.
- [Compiler and flags](../tooling/compiler-and-flags.md) — `--Werror`,
  `--warn-on-unstable-apis` and friends in context.

## Sources

- `mojo format`: <https://mojolang.org/docs/cli/format/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Mojo CLI reference (single document): <https://mojolang.org/llms-cli.txt>
- `mojo build` diagnostic options: <https://mojolang.org/docs/cli/build/>
- `mojo doc` validation options: <https://mojolang.org/docs/cli/doc/>
- Mojo FAQ (package contents): <https://mojolang.org/docs/faq/>
- Mojo stability guarantees:
  <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0b2 release notes (closure capture formatting):
  <https://mojolang.org/releases/v1.0.0b2/>
