# Frontmatter

Every `+index.md` — both the library's and each buch's — starts with a YAML
frontmatter block delimited by `---`. It is the only place where metadata lives;
there is no separate manifest file to keep in sync.

## Shape

```yaml
---
id: dreego
title: Dreego
description: How the Dreego service works — architecture, routing and data.
language: en
tags: [go, backend, service]
---
```

The block must be the **first** content of the file and is closed by a line
containing exactly `---` (or `...`). A blank line or a Markdown heading before it
means there is no frontmatter.

## Fields

| Field         | Required | Rules |
|---------------|----------|-------|
| `id`          | yes      | `^[a-z0-9-]+$`: lowercase ASCII letters, digits and hyphens only. |
| `title`       | yes      | Human-readable name, any text. |
| `description` | yes      | One sentence; this is what `buch list` and search show. |
| `language`    | no       | Language tag such as `en` or `de`. |
| `tags`        | no       | Inline list (`[a, b]`) or block list. Used for search and filtering. |

The same shape applies to the library's `.buch/+index.md`. Its `id` names the
library, for example `buch-lib`.

## Id rules

Ids are the stable identity of a buch or library, so they have a deliberately
narrow shape.

- Allowed: `[a-z0-9-]` — lowercase letters, digits and hyphens.
- Not allowed: uppercase, spaces, underscores, dots, slashes, umlauts or other
  punctuation.
- Start and end with a letter or digit; avoid leading, trailing or doubled
  hyphens (`my--buch` is legal by the pattern but poor style).

```yaml
id: buch-authoring     # good
id: Buch-Authoring     # invalid — uppercase
id: buch_authoring     # invalid — underscore
id: buch authoring     # invalid — space
```

An uppercase id is reported as a distinct error with a suggested lowercase
form, so `Buch-Authoring` is flagged as `id.lowercase` rather than a generic
invalid id. Two buchs with the same id in one library are a hard error listing
both paths.

## Library vs. buch vs. directory name

- The **directory** is named `TITLE.buch` (for example `buch-authoring.buch`).
- The **id** is the lowercase, hyphenated identity (for example
  `buch-authoring`).
- Readers address a buch by its **id**, not its directory name:

  ```sh
  buch read buch-authoring/structure
  ```

Keep the id and a slug of the directory title aligned to avoid confusion, but
remember that only the id is authoritative.

## YAML subset

Frontmatter is parsed with a small, strict subset, not a full YAML engine:

- Scalar `key: value` pairs; values may be single- or double-quoted.
- Inline lists (`tags: [a, b]`) and block lists (`tags:` then `- a` lines).
- Comments starting with `#` are ignored.
- Unknown keys are discarded for forward compatibility.

Keeping to this subset guarantees that every buch parses identically in the CLI,
in an editor and in a future tool.

## Checking your work

```sh
buch validate buch-authoring
buch validate --json
```

`validate` reports missing required fields, invalid and duplicate ids, and
frontmatter parse errors as errors; warnings do not fail the exit code. Wire it
into CI with a plain `buch validate`.
