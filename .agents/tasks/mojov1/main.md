# Task: author `mojov1.buch`

Shared task file for the `mojov1` buch. Read this first; the detailed plan lives
next to it in `plan/`.

## Goal

Author `mojov1.buch` in this library: a buch about **Mojo 1.x**, written so that
an agent can write effective, excellent Mojo **without internet access**. The
buch must be self-sufficient — every page it needs is in the library, and every
fact is sourced from the official 1.x documentation.

## Hard requirements

1. **No v0 knowledge on content pages.** Content pages teach only the current
   1.x state. Pre-1.0 spellings (`fn` as the normal keyword, `let`,
   `InlineArray`, `StringSlice`, `read`, `__del__`, `owned`/`borrowed`/`inout`,
   `Pointer`/`UnsafePointer`) appear **only** inside `versions/` migration
   tables and rename notes — never as teaching on a content page.
2. **Completeness — every official doc page has a destination.** The buch must
   stand alone: every page in the official docs map (`plan/official-docs-map.md`,
   verbatim `https://mojolang.org/llms.txt`) is mapped to a book page, so an
   agent that reads the buch can write good Mojo with no access to the internet.
   Gaps are marked as open questions, not filled with invented facts.

## Model

**One current content tree plus a change record.**

- The content tree (`intro/`, `basics/`, `keywords/`, …) always documents the
  **current** 1.x release. It holds no per-version copies and no old spelling as
  teaching.
- `versions/` records movement within 1.x: one page per release with migration
  notes, what is new and what is now idiomatic. Old→new rename tables live here.
- The current version is a live value: `.kdb/mojo/version.js` is the single place
  to bump, and every mention in the buch follows. Freshness is surfaced through
  `.kdb/mojo/verified.js`.
- When a new 1.x release lands: add **one** page under `versions/` and bump
  `.kdb/mojo/version.js`. Nothing else. When Mojo 2.0 lands, that is a new buch
  (`mojov2`), not a chapter here.
- Source rule: every Mojo statement comes from the official 1.x documentation at
  `mojolang.org` (see `plan/source-policy.md`).

## Status

- slice 1: scaffold — done
- slice 1: intro+versions+keywords/def — in progress
- full 193-page build — pending

## Who does what

- **coder** — scaffold, `intro/`, `versions/`, `keywords/`, `basics/` and the
  rest of the content tree; owns the repo changes.
- **researcher** — verifies facts against the official 1.x docs and delivers the
  sourced briefs (see `plan/brief-slice.md`); supplies the raw material the coder
  writes from.

## Plan files

`plan/` holds the frozen plan: `topics.md`, `structure.md`, `facts.md`,
`keywords.md`, `stdlib.md`, `page-inventory.md`, `source-policy.md`,
`nesting-test.md`, `official-docs-map.md`, `brief-slice.md`.
