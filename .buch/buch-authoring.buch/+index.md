---
id: buch-authoring
title: Authoring a buch
description: The practical guide to the buch on-disk format — structure, frontmatter, dynamic values, actions, distribution and good practices.
language: en
tags: [meta, authoring, format, reference]
---

# Authoring a buch

A **buch** is a directory `TITLE.buch` inside a library (`.buch`). It holds
Markdown pages, optional dynamic values and optional actions. This buch is
itself a buch, so every rule below is demonstrated by the files you are reading.

## Read order

1. [Structure](structure.md) — the exact directory layout.
2. [Frontmatter](frontmatter.md) — metadata fields and id rules.
3. [Dynamic values](dynamic-values.md) — how `%%key%%` and `.kdb/` work.
4. [Actions](actions.md) — how `actions/` work, and the sandbox.
5. [Distribution](distribution.md) — git libraries, modes and commit pinning.
6. [Good practices](good-practices.md) — how to write one that stays useful.

## Live examples

This buch uses the format it teaches:

- The CLI is called `%%cli.binary-name%%` (backed by
  `.kdb/cli/binary-name.js`; the dot in the key is a path separator).
- The on-disk format version is `%%format-version%%` (backed by
  `.kdb/format-version.js`).
- A safe action lives in `actions/word-count.js`:

  ```sh
  buch exec buch-authoring word-count -- a buch is a knowledge format
  ```

## Raw source

Pages are rendered by default, so `%%cli.binary-name%%` above is replaced with
its value. To see the unreplaced Markdown, read with `--raw`:

```sh
buch read buch-authoring --raw
```
