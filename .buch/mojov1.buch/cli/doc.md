# `mojo doc`

Compiles docstrings from a Mojo file.

## Synopsis

```
mojo doc [options] <path>
```

## Purpose and current status

> This is an early version of a documentation tool that generates an API
> reference from Mojo code comments. Currently, it generates a structured output
> of all docstrings into a JSON file, and it does not generate HTML. This output
> format is subject to change.
>
> The input may be a single file or a directory. If you specify a directory, it
> will generate a single JSON output with documentation for all modules found in
> that path, recursively.

Source: <https://mojolang.org/docs/cli/doc/>.

Three facts matter before you plan anything around this command:

1. **The output is JSON, not HTML.** There is no site generator in the tool.
2. **The output format is explicitly unstable** — "subject to change". Do not
   build tooling that parses it as a stable schema.
3. **Directory input is recursive.** A directory produces one JSON document
   covering every module under it.

The `mojo doc` command is a **compiler** for docstrings in the narrow sense: it
reads docstrings and emits their structured form. The docstring conventions
themselves (placement, first sentence, sections) are the language reference's
[docstrings](../reference/docstrings.md) topic; this page is about the command.

## Options

### Output options

| Option | Meaning |
|--------|---------|
| `-o <PATH>` | Sets the path and filename for the JSON output. If not provided, output is written to **stdout**. |

### Compilation options

| Option | Meaning |
|--------|---------|
| `-I <PATH>` | Appends the given path to the list of directories Mojo searches for package/module dependencies. Use it when the file you pass to `mojo doc` imports packages that are not local and not part of the standard library. |

Unlike `run`/`build`, `mojo doc` documents **no** `-D`, `-O`, `-g`, target or
linker options. Its option set is smaller on purpose. Source:
<https://mojolang.org/docs/cli/doc/>.

### Validation options

These control how strict the tool is about docstring structure:

| Option | Meaning |
|--------|---------|
| `--diagnose-missing-doc-strings` | Emits diagnostic warnings for missing or partial doc strings. |
| `--docs-base-path <PATH>` | Sets the path prefix for generated documentation links. |

The page's framing of the validation options, quoted:

> The following validation options help ensure that your docstrings use valid
> structure and meet other style criteria. By default, warnings are emitted only
> if the docstrings contain errors that prevent translation to the output
> format. (More options coming later.)

Source: <https://mojolang.org/docs/cli/doc/>.

So two levels exist:

- **Default:** only docstrings that cannot be translated produce warnings.
- **`--diagnose-missing-doc-strings`:** additionally warn on missing or partial
  docstrings.

### Compilation diagnostic options

| Option | Meaning |
|--------|---------|
| `--max-notes-per-diagnostic <INTEGER>` | Upper threshold on the number of notes printed with a diagnostic. Default 10. |
| `--Werror` | Treat warnings as errors. |
| `--Wno-error` | Do not treat warnings as errors (overrides `-Werror`). |
| `--ignore-deprecated <NAME>` | Suppress the deprecation warning for the given declaration. |

Note that `mojo doc`'s diagnostic option list is a **subset** of the build/run
list: it has no `--experimental-fixit`, no `--warn-on-unstable-apis`, and no
`--disable-warnings` on the 1.x page. Source:
<https://mojolang.org/docs/cli/doc/>.

### Common options

| Option | Meaning |
|--------|---------|
| `--diagnostic-format <FORMAT>` | `text` (default) or `json`. |
| `--help`, `-h` | Displays help information. |
| `--help-hidden` | Displays help for hidden options. |

## Realistic invocations

**Emit docs for one file to stdout.**

```bash
mojo doc mypackage/mymodule.mojo
```

**Emit docs for a whole package into a file.**

```bash
mojo doc mypackage -o docs.json
```

**Warn on every missing docstring, and fail if any warning occurs.** Use the
validation option together with `--Werror`:

```bash
mojo doc mypackage --diagnose-missing-doc-strings --Werror -o docs.json
```

Both options are documented on the page; combining them is the documented way
to turn the docstring check into a build gate. Sources:
<https://mojolang.org/docs/cli/doc/>.

**Resolve imports from a vendor directory.**

```bash
mojo doc -I ./vendor mypackage -o docs.json
```

**Set a link prefix for generated documentation links.**

```bash
mojo doc --docs-base-path https://example.com/api/ mypackage -o docs.json
```

**Machine-readable diagnostics.**

```bash
mojo doc --diagnostic-format json mypackage
```

## What the output is

- **JSON.** "a structured output of all docstrings into a JSON file". The
  schema is not part of the documented contract.
- **One document for a directory.** "If you specify a directory, it will
  generate a single JSON output with documentation for all modules found in
  that path, recursively."
- **stdout by default.** Without `-o`, "output is written to stdout", which
  makes the command pipeable (for example into `jq`).

Source: <https://mojolang.org/docs/cli/doc/>.

> **Open question — the JSON schema.** The 1.x page deliberately does not
> specify the JSON structure — it only says the format is "subject to change"
> and that it is "an early version". There is therefore no documented schema to
> parse against. If you need to consume `mojo doc` output, treat the schema as
> volatile and plan for it to change. Source:
> <https://mojolang.org/docs/cli/doc/>.

## Exit behaviour

- Success: JSON is written (to `-o` or stdout); the command exits 0.
- Docstrings that cannot be translated produce warnings (not errors) by
  default; combining `--Werror` promotes them to a failure and a non-zero exit.
- Undocumented/undeclared imports under `-I` produce diagnostics.

> **Open question:** the CLI reference documents no exit-code table for
> `mojo doc`. The only documented severity control is
> `--Werror`/`--Wno-error`.

## Docstring conventions

`mojo doc` compiles whatever docstrings the sources contain; the *content*
conventions live on the docstrings reference page
([`reference/docstrings`](../reference/docstrings.md)). The v1.0.0b2 release
notes list the docstring reference as a new page, and the language reference
documents "placement, first-sentence rules, structured sections (Parameters,
Args, Returns, Raises, Constraints…)". Source:
<https://mojolang.org/releases/v1.0.0b2/>,
<https://mojolang.org/docs/reference/docstrings/>.

## Pitfalls

- **Do not parse the JSON as a stable API.** The page says the format is
  "subject to change". Source: <https://mojolang.org/docs/cli/doc/>.
- **It does not produce HTML.** "it does not generate HTML"; you must render the
  JSON yourself. Source: <https://mojolang.org/docs/cli/doc/>.
- **Warnings are lenient by default.** Missing docstrings warn only with
  `--diagnose-missing-doc-strings`; otherwise only untranslatable docstrings
  warn. Source: <https://mojolang.org/docs/cli/doc/>.
- **`-I` uses the same import search semantics as the compiler.** If a package
  import fails, `mojo doc` fails like a compile would; point `-I` at the package
  root. Source: <https://mojolang.org/docs/cli/doc/>.
- **`--docs-base-path` only sets a link prefix.** It does not host or generate
  anything. Source: <https://mojolang.org/docs/cli/doc/>.
- **A `mojo doc` crash on synthetic declarations was fixed in v1.0.0b2.** If you
  are on an older 1.x build, `mojo doc` "could crash when emitting diagnostics
  for declarations without valid source locations (for example, from bytecode
  packages)". Source: <https://mojolang.org/releases/v1.0.0b2/>.

## See also

- [`index`](index.md) — the full command surface.
- [`build`](build.md) — the compiling command whose diagnostic block `doc`
  partially reuses.
- [`doc-hidden`](../decorators/doc-hidden.md) — hiding declarations from
  generated documentation.

## Sources

- `mojo doc`: <https://mojolang.org/docs/cli/doc/>
- Mojo CLI reference: <https://mojolang.org/docs/cli/>
- Mojo CLI reference (single document): <https://mojolang.org/llms-cli.txt>
- Mojo docstring reference: <https://mojolang.org/docs/reference/docstrings/>
- Mojo v1.0.0b2 release notes (docstring reference, `mojo doc` crash fix):
  <https://mojolang.org/releases/v1.0.0b2/>
