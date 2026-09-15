---
id: mojov1
title: Mojo 1.x
description: Mojo 1.x — the current language, its keywords and conventions, types, memory, errors, interop, stdlib, tooling and the release change record.
language: en
tags: [mojo, language, reference, mojo-1x]
---

# Mojo 1.x

**Scope.** This buch covers the **Mojo 1.x series only**. Its content tree always
documents the **current** 1.x release; the [version change
record](versions/index.md) records what moved between releases. There are no
per-version copies of pages — the tree is the current state, and the change
record is the history. When Mojo 2.0 lands, that is a new buch (`mojov2`), not a
chapter here.

## Current version

This book is at the current Mojo version of %%mojo.version%%. The content was
last verified against the official documentation on %%mojo.verified%%.

## What this buch is for

This buch is a self-sufficient Mojo 1.x reference: a human or an agent that reads
it can write effective, excellent Mojo without internet access. Every statement
comes from the official 1.x documentation, and the content tree holds only the
current state, so a reader gets one unambiguous answer for each topic. The
[version change record](versions/index.md) is separate from the teaching, so an
agent that is already on an older 1.x release can migrate without guessing.

## Old spellings appear only in the change record

Pre-1.0 and pre-1.x spellings — `fn` as the normal function keyword, `let`,
`InlineArray`, `StringSlice`, `read`, `__del__`, `owned`/`borrowed`/`inout`,
the pre-unification `Pointer`/`UnsafePointer` split — appear **only** in the
`versions/` migration tables, never as teaching on a content page. A content
page always shows the current idiom; the change record is where you look up what
an older spelling maps to.

## Live values

The current version, freshness date, stability statement and canonical upstream
URLs are dynamic values, each backed by one `.kdb` module:

- Current Mojo version: `%%mojo.version%%` (bump `.kdb/mojo/version.js` and every
  mention follows)
- Last verified against the official docs: `%%mojo.verified%%`
- Stability: `%%mojo.status%%`
- Canonical upstream URLs: `%%mojo.links%%`

## Read order

The buch is complete: the tree below is the whole book, organised by chapter in
reading order. Every link target exists in the tree.

**Start with the intro block**, in this order:

1. [What is Mojo](intro/what-is-mojo.md) — what Mojo is, its design goals, lineage and audience.
2. [Design goals](intro/design-goals.md) — the design goals in depth.
3. [Roadmap](intro/roadmap.md) — the official roadmap: plans and priorities.
4. [Mojo AI agent skills](intro/ai-agent-skills.md) — the official AI skills page and how this buch relates to it.
5. [How to read this buch](intro/how-to-read-this-buch.md) — the reading contract: current-state content tree plus `versions/`.
6. [Install](intro/install.md) — install Mojo, `mojo` vs `mojo-compiler`, GPU install.
7. [Supported platforms](intro/supported-platforms.md) — OS, CPU, RAM, GPU and Python requirements.
8. [Your first program](intro/first-program.md) — the smallest program, run/build/REPL/format, and the edit → run loop.
9. [Packages and modules](intro/packages-and-modules.md) — modules, packages, `__init__.mojo` and import resolution.
10. [Packages and environments](intro/packages-and-environments.md) — pixi/uv, channels and indexes, version pinning, the Python 3.10–3.14 prerequisite.
11. [Stability](intro/stability.md) — the per-API stability model; source-only guarantees.
12. [Version history](intro/version-history.md) — the version-scheme eras and channel-dependent numbers.
13. [Reading API docs](intro/reading-api-docs.md) — how to read Mojo API docs and signatures.

**Then the topic chapters**, each with its own entry point and its own internal
reading order:

- [Basics](basics/syntax.md) — syntax, literals, operators, variables and mutability, control flow, comments and docstrings.
- [Language reference](reference/index.md) — expressions, statements, literals, numeric types, function/struct/trait/closure declarations, docstrings, inline MLIR, cheat sheets.
- [Keywords](keywords/index.md) — the 34 true reserved keywords, plus the deprecated `fn` stub.
- [Keyword conventions](keyword-conventions/index.md) — `imm`, `mut`, `out`, `deinit`, `raises`, `where`, `alias`, `async`/`await`.
- [Types](types/overview.md) — value semantics, numbers, strings, structs, traits, collections, pointers, optionals.
- [Functions](functions/parameters-and-generics.md) — parameters and generics, overloads, closures and lambdas, decorators and metaprogramming.
- [Decorators](decorators/index.md) — one page per official built-in decorator.
- [Memory](memory/value-semantics.md) — value semantics, ownership and lifetimes, origins and borrowing, allocators.
- [Lifecycle](lifecycle/index.md) — value creation, initialization and destruction.
- [Errors](errors/error-model.md) — the error model, raising and propagation, safety and undefined behaviour.
- [Interop](interop/python-interop.md) — Python both ways, C FFI, and migration from Python.
- [Concurrency](concurrency/async-and-parallelism.md) — async and parallelism, GPUs and accelerators, vectorization and SIMD.
- [Standard library](stdlib/overview.md) — how the stdlib is organised, plus one page per top-level package.
- [Idioms](idioms/style-guide.md) — style, patterns, anti-patterns, performance idioms.
- [Tooling](tooling/compiler-and-flags.md) — compiler flags, feature toggles, formatter and linter, testing, notebooks, debugging and profiling, editor and LSP, Pixi.
- [CLI](cli/index.md) — the complete `mojo` command surface.
- [Project](project/structure.md) — structure, packaging and distribution, CI.
- [Versions](versions/index.md) — the release record within 1.x; see [Mojo 1.0.0](versions/1.0.0.md).
- [Appendix](appendix/cheat-sheet.md) — cheat sheet, comparison to Python, FAQ, exercises, further reading.
- [Glossary](glossary.md) — Mojo terms, pointing into the pages above.

The page-by-page plan that produced this tree is in
`.agents/tasks/mojov1/plan/page-inventory.md`.

## Versions

[`versions/`](versions/index.md) is the **change record** for the 1.x series: one
page per release, each holding migration notes (what must change in code),
what is new, and what is now idiomatic. Old→new rename tables live here and
nowhere else.

The rule for a future release is deliberately small: when a new 1.x release
lands, **add one page** under `versions/` and **bump
`.kdb/mojo/version.js`**. Nothing else changes — no content copy, no new folder,
no per-version wrapper. If a content page's teaching changed, edit that page in
place; the new `versions/` page records the old→new mapping.
