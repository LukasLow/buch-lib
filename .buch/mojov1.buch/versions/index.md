# Mojo versions

The **release record** for the Mojo 1.x series. The rest of this buch always
documents the **current** release; this chapter records what moved *between*
releases, so an agent that believes it is on an older 1.x release can become
current by reading exactly what changed.

This book currently documents Mojo `%%mojo.version%%`. Every page below was
verified against the official documentation at <https://mojolang.org/> on
`%%mojo.verified%%`.

## What this chapter is for

An agent may be running against an older 1.x release and hold code that was
correct *then*. The content tree in the rest of this buch will not match that
release. This chapter closes the gap:

- Find your release in the table below.
- Read **every page after your version**, oldest first.
- Apply the **old → new** tables on each page to your code.
- Then open the current content page for the topic and follow the idiomatic
  form it teaches — the migration table only tells you what to rename, not the
  full current way to write the code.

Pre-1.0 spellings appear **only** inside the migration tables of this chapter
(and only in `versions/1.0.0.md`), always marked `REMOVED` or `DEPRECATED`.
Everywhere else the buch teaches 1.x syntax only. Never copy a "before" block
from a migration page into new code.

## Releases

| VERSION | DATE | HEADLINE | PAGE |
|---------|------|----------|------|
| 1.0.0 | 2026-08-11 | First stable release; semantic versioning begins; a large breaking cleanup — most 1.0 work is **migration**, not new features | [`versions/1.0.0`](1.0.0.md) |

Dates are taken from the official release pages (`https://mojolang.org/releases/v1.0.0/`).
The matching package version on the releases index is `mojo==1.0.0`.

## How to use this chapter

1. **Find your version.** Locate the release you are on in the table.
2. **Read forward.** Read each release page newer than yours, in order.
3. **Apply the old → new tables.** Every entry is marked `REMOVED` (the old
   spelling no longer compiles or no longer resolves) or `DEPRECATED` (it still
   compiles in 1.0.0 but is not idiomatic and may warn).
4. **Check the current content page.** After migrating, read the content page
   for the topic — for example [`keywords/def.md`](../keywords/def.md),
   [`types/pointers-and-references.md`](../types/pointers-and-references.md) or
   [`types/collections.md`](../types/collections.md) — to see the idiomatic 1.x
   form.
5. **Re-check the safety net.** Some old spellings still compile through
   deprecated aliases and compiler fix-its. Treat that as a migration aid, never
   as a reason to keep the old spelling.

## Adding a release

When a new **1.x** release lands, the rule is deliberately small: **add exactly
one page** under `versions/` and **bump `.kdb/mojo/version.js`**. Nothing else
changes — no content copy, no new folder, no per-version wrapper. If a content
page's teaching changed, edit that page in place; the new `versions/` page
records the old → new mapping.

**Patch releases** (`1.0.1`, `1.2.1`, …) get a row in the table above plus a
short page of their own. Patch releases are meant to contain only
backward-compatible bug fixes, so their page is usually a few lines.

The first page is [`versions/1.0.0`](1.0.0.md): what 1.0.0 means versus 0.x,
the complete breaking-change list, the old → new rename tables, before/after
code, and what is now idiomatic in 1.x.

## Sources

- Releases index (versions, dates, package versions): <https://mojolang.org/releases/>
- Release archive (all earlier versions): <https://mojolang.org/releases/archive/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
- Stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
