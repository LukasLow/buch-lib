# Formatter and linter

Mojo's formatting tool is `mojo format`. Its static-analysis story is the
compiler's warning flags. This page covers both, and is honest about how far the
documented linter surface actually goes.

## `mojo format`

> Formats the given set of Mojo sources using a Mojo-specific lint tool.

Source: <https://mojolang.org/docs/cli/format/>.

### Synopsis

```
mojo format [options] <sources...>
```

### Options

| Option | Meaning |
|--------|---------|
| `--line-length <INTEGER>`, `-l <INTEGER>` | Sets the max character line length. Default 80. |
| `--quiet`, `-q` | Disables non-error messages. |
| `--help`, `-h` | Displays help information. |
| `--help-hidden` | Displays help for hidden options. |

That is the complete documented surface. Source:
<https://mojolang.org/docs/cli/format/>. See
[`mojo format`](../cli/format.md) for the command page, including the open
questions about configuration and check mode.

### The style it enforces

The language reference publishes the style materials the formatter backs. The
v1.0.0b2 release notes list the additions:

> Also added a [Mojo basics cheat sheet](/docs/reference/cheat-sheets/), a
> downloadable quick-reference card for Mojo's core syntax.

Source: <https://mojolang.org/releases/v1.0.0b2/>.

The manual's tutorial fixes the indentation convention: "You can use any number
of spaces or tabs for indentation as long as you use the same indentation for the
entire code block. We'll follow the [Python style
guide](https://peps.python.org/pep-0008/) and use 4 spaces." Source:
<https://mojolang.org/docs/manual/get-started/>.

> **Open question — no dedicated Mojo style guide page in the 1.x docs map.**
> The page inventory plans an [`idioms/style-guide`](../idioms/style-guide.md)
> page, but the official 1.0.0 docs map
> (<https://mojolang.org/llms.txt>) contains no "style guide" entry; the closest
> official pages are the cheat sheets
> (<https://mojolang.org/docs/reference/cheat-sheets/>) and the docstring
> reference (<https://mojolang.org/docs/reference/docstrings/>). Treat Mojo style
> as "what `mojo format` does" plus the naming rules in the API-docs guide
> (<https://mojolang.org/docs/api-docs/>), not as a separate spec.

### Formatting is a documented requirement for closures

One concrete formatter rule is documented because the formatter tracks new
syntax:

> `mojo format` now accepts the bare move-capture form `{name^}` in closure
> capture lists. Previously only the equivalent `{var name^}` form round-tripped
> through the formatter.

Source: <https://mojolang.org/releases/v1.0.0b2/>.

## Linting: what the docs actually support

There is **no standalone `mojo lint` command** in 1.x. The complete command list
is `run`, `build`, `repl`, `debug`, `precompile`, `format`, `doc`, `demangle`
(<https://mojolang.org/docs/cli/>).

What exists instead is a set of **compiler diagnostics**. These are available on
`run`, `build`, `debug` and `precompile` (and partially on `doc`):

| Diagnostic flag | What it catches | Where |
|-----------------|-----------------|-------|
| `--warn-on-unstable-apis` | uses of unstable standard-library APIs | `run`, `build`, `debug`, `precompile` |
| `--diagnose-missing-doc-strings` | missing or partial doc strings | `run`, `build`, `debug`, `precompile`, `doc` |
| `--Werror` / `--Wno-error` | promote / demote warnings to errors | `run`, `build`, `debug`, `precompile`, `doc` |
| `--ignore-deprecated <NAME>` | suppress one declaration's deprecation warning | `run`, `build`, `debug`, `precompile`, `doc` |
| `--experimental-fixit` | apply compiler fix-its automatically | `run`, `build`, `precompile` |
| `--experimental-export-fixit <YAML_FILE>` | export fix-its as clang-tidy YAML | `run`, `build`, `precompile` |
| `--diagnostic-format json` | machine-readable diagnostics | most commands |

Sources: <https://mojolang.org/docs/cli/build/>,
<https://mojolang.org/docs/cli/doc/>,
<https://mojolang.org/docs/cli/format/>.

### Be honest about `--warn-on-unstable-apis`

The stability page states the current state of the stable-API warning set
plainly:

> We consider standard library APIs unstable unless specifically marked stable.
> … When you invoke Mojo with the `--warn-on-unstable-apis` flag, it issues a
> warning for each unstable API you use. We don't currently recommend this
> because the stable API set is small.

Source: <https://mojolang.org/docs/api-docs/stability/>.

And the 1.0.0 release notes explain why:

> We're being careful to stabilize only APIs that we can commit to, so the
> initial set of stable APIs is small, but we'll be adding to it in subsequent
> releases.

At the current release (`%%mojo.version%%`) the stable types are `Deinitable`,
`Movable`, `Copyable`, `ImplicitlyCopyable`, `Array`, `List`, `Span`, `String`,
`Bool` and `Optional`, plus per-member stability decided case by case. Source:
<https://mojolang.org/releases/v1.0.0/>.

**Consequence:** `--warn-on-unstable-apis` will warn about very nearly everything
at this release. Using it with `--Werror` as a blanket CI gate would fail almost
every program. Use it selectively, or do not use it yet.

## The full "lint" recipe from documented flags

A pragmatic quality gate composed only of documented flags, run before
committing or in CI:

```bash
# 1. Formatting.
mojo format src/ tests/

# 2. Compile with warnings as errors and docstring checks.
mojo build --Werror --diagnose-missing-doc-strings src/main.mojo -o /dev/null
```

> **Open question — passing `/dev/null` as `-o`.** The build page says `-o`
> "[s]ets the path and filename for the executable output" and does not discuss
> special destinations. To compile without keeping the artifact, prefer a
> temporary path or `mojo run` on a no-op entry point; the `/dev/null` form is
> illustrative, not documented. Source:
> <https://mojolang.org/docs/cli/build/>.

Because no `mojo format --check` is documented, a CI "is the tree formatted?"
gate must format and then inspect the diff. See
[`mojo format`](../cli/format.md) and [CI](../project/ci.md).

## Naming conventions

The one official page that gives naming rules is the API-docs guide:

> Mojo follows naming conventions used in languages like Rust and C++. Type
> parameter names use PascalCase, short (`T`, `E`) or descriptive
> (`ErrorType`, `Element`). By convention, `T`, `U`, `V` are general types;
> `K`/`V` for key-value pairs; `E` for errors; `H` for hashers. Value parameter
> names use lower_snake_case and should be descriptive (`capacity`, `hasher`,
> `tile_x`).

Source: <https://mojolang.org/docs/api-docs/>.

Identifier rules themselves (including escaped backtick identifiers) are on the
keywords reference (<https://mojolang.org/docs/reference/keywords/>) and in
[basics — syntax](../basics/syntax.md).

## Formatter versus compiler: division of labour

| Concern | Tool | Documented evidence |
|---------|------|---------------------|
| Whitespace, line breaks, line length | `mojo format` | line-length option, closure-capture fix |
| Syntax errors | `mojo run` / `build` | compiler diagnostics |
| Deprecations and unstable APIs | compiler flags | `--ignore-deprecated`, `--warn-on-unstable-apis` |
| Missing docstrings | compiler flags | `--diagnose-missing-doc-strings` |
| Mechanical migrations | compiler fix-its | `--experimental-fixit`, `--experimental-export-fixit` |
| API-reference extraction | `mojo doc` | JSON output |

## Pitfalls

- **No linter binary.** Do not look for `mojo lint`; the documented static
  analysis is the compiler's warning flags. Source:
  <https://mojolang.org/docs/cli/>.
- **`mojo format` edits in place.** No dry-run/check flag is documented. Format
  on a clean tree. Source: <https://mojolang.org/docs/cli/format/>.
- **`--warn-on-unstable-apis` is not a quality gate at this release.** The stable
  set is "deliberately small" and the docs do not recommend the flag. The current
  version is `%%mojo.version%%`. Source:
  <https://mojolang.org/docs/api-docs/stability/>.
- **`--experimental-fixit` can lose data.** Use
  `--experimental-export-fixit` for reviewable changes. Source:
  <https://mojolang.org/docs/cli/build/>.
- **`-q` is not a failure switch.** It disables non-error messages; it does not
  make the formatter fail on anything. Source:
  <https://mojolang.org/docs/cli/format/>.
- **No config file is documented.** Only `--line-length` is configurable on the
  1.x page; do not teach a config file without an official source. Source:
  <https://mojolang.org/docs/cli/format/>.
- **The formatter lags new syntax.** The `{name^}` capture form needed a
  formatter fix; re-run the formatter after upgrading the toolchain. Source:
  <https://mojolang.org/releases/v1.0.0b2/>.

## See also

- [`mojo format`](../cli/format.md) — the command reference.
- [Compiler and flags](compiler-and-flags.md) — every diagnostic and
  severity flag in context.
- [Testing](testing.md) — the correctness half of the quality loop.
- [CI](../project/ci.md) — turning these commands into a pipeline.
- [Syntax](../basics/syntax.md) — identifiers and indentation.

## Sources

- `mojo format`: <https://mojolang.org/docs/cli/format/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Mojo CLI reference (single document): <https://mojolang.org/llms-cli.txt>
- `mojo build` diagnostics: <https://mojolang.org/docs/cli/build/>
- `mojo doc` validation options: <https://mojolang.org/docs/cli/doc/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes (stable API set):
  <https://mojolang.org/releases/v1.0.0/>
- Mojo v1.0.0b2 release notes (closure capture formatting, cheat sheet):
  <https://mojolang.org/releases/v1.0.0b2/>
- How to read the standard library API documentation (naming):
  <https://mojolang.org/docs/api-docs/>
- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo cheat sheets: <https://mojolang.org/docs/reference/cheat-sheets/>
