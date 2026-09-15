# How to read this buch

This page is the reading contract for `mojov1`. It states what the pages
contain, which Mojo version they describe, where old idioms live, and how to
load exactly the part you need.

## The one rule: this buch documents the current 1.x release only

This buch covers the **Mojo 1.x series only**, and its content tree always
documents the **current** 1.x release — the one named by
`%%mojo.version%%` (backed by `.kdb/mojo/version.js`; the value is resolved when
the page is rendered). The content was last verified against the official
documentation on `%%mojo.verified%%`.

There is **no per-version copy** of the content and no `v1.0.0/` folder. Every
content page teaches the current state, with one unambiguous answer. When a
spelling changes inside 1.x, the content page shows the **new** spelling only;
the old spelling is recorded in [`versions/`](../versions/index.md).

**Consequence for an agent:** if you read a content page, you are reading the
current release's truth. You never have to guess which version a page belongs
to; the version is a single value in the buch (`%%mojo.version%%`), not a
property of each page.

## Where the old idioms are — and where they are not

Old idioms are **not** in the content tree. If you remember a spelling from an
older Mojo version, do not use it in new code, and expect content pages to
disagree with your memory.

- **The `versions/` chapter is where migration lives.** It records, per release,
  what changed, what is new, and what is now idiomatic.
  [`versions/1.0.0`](../versions/1.0.0.md) carries the full old → new rename
  table and the migration notes for the 1.0.0 cleanup.
- **If you believe you are on an older 1.x release**, read
  [`versions/`](../versions/index.md) first: it is the page that tells you
  exactly what moved between your release and the current one. That is its whole
  purpose.
- **Git history is the second record.** The repository history of this buch
  holds the previous wording of any page, should you need to diff it.

For orientation, the 1.0.0 consolidation replaced, among others: `fn` → `def`,
`read` → `imm`, `InlineArray` → `Array`, `StringSlice` → `StringSpan`,
`size` → `length`, `ImplicitlyDestructible` → `Deinitable`, `__del__` →
`__deinit__`, and unified `Pointer`/`UnsafePointer`. Treat any of these old
spellings as **migration context only**, never as current syntax.

## The no-v0 rule

Pre-1.0 spellings may appear in this buch **only** in version-history or
migration context — typically as an old → new table row in `versions/`. They
must never appear as taught syntax on a content page.

This is deliberate. Before 1.0, Mojo changed quickly, and a large part of what
models and the wider internet "know" about Mojo is out of date: `fn` as the
normal function keyword, `let`, `InlineArray`, `StringSlice`, `read`,
`__del__`, `owned`/`borrowed`/`inout`, `Pointer` versus `UnsafePointer`. In 1.x
these are deprecated, renamed or removed. A page that repeated them would teach
you to write code the current compiler rejects or warns about.

Therefore: **if it is not in the official 1.x documentation, it does not appear
here as fact.** Some deprecated spellings still compile today (for example
`StringSlice`, `InlineArray`, `read`, `__del__()`), but "still compiles" is not
"idiomatic"; the content pages show the recommended form, and `versions/` tells
you what the recommendation used to be.

## Open-question markers

Every statement in this buch is meant to come from the official Mojo 1.x
documentation. Where the official docs are **silent or contradictory**, the page
does not guess. Instead it carries a visible marker:

> **Open question:** the official documentation does not state X; verify against
> the next upstream release before relying on it.

When you hit one:

1. Do **not** treat the surrounding claim as settled fact.
2. Prefer the version that is backed by a source URL on that page.
3. If you have internet access, read the cited official page before deciding.
4. If you do not, treat the open question as an unresolved gap — a marked gap is
   correct output, an invention is a defect.

The marker is also used for documentation lag inside the official docs (for
example, a page that still shows an older spelling). The marker tells you which
of two conflicting claims the buch refuses to resolve by intuition.

## Reading a page with the `buch` CLI

Pages are addressed by **logical paths**: forward slashes, no `.md` suffix. A
selector has the form `buch[/page][#section]`.

```sh
buch read mojov1                         # the buch main page (+index.md)
buch read mojov1/intro/what-is-mojo      # a page
buch read mojov1/intro/design-goals      # another page
```

A **section anchor** loads only that heading and its body, which is the cheapest
way to give an agent focused context. Anchors are derived from the heading text:
trim and lowercase, whitespace becomes `-`, other punctuation is dropped.

```sh
buch read mojov1/intro/what-is-mojo#value-semantics-and-explicit-mutability
buch read mojov1/intro/design-goals#the-four-stated-design-principles
```

Anchor addresses are treated as API: headings are named descriptively and kept
stable, and a renamed heading breaks links. If a link fails, read the whole page
and locate the section by its visible title rather than guessing a new anchor.

### `buch manifest` — discover pages and anchors without opening them

`buch manifest` lists the buch's pages with their paths and headings, so an
agent can plan reads before spending context:

```sh
buch manifest mojov1            # every page, path and anchor
buch manifest mojov1 --json     # machine-readable
```

Use it to find the right page and anchor, then read only that selector.

### Rendered vs. raw

`buch read` renders `%%key%%` dynamic values by default; `--raw` prints the
unreplaced source. For this buch the difference matters for the version and
freshness values:

```sh
buch read mojov1 --raw           # shows %%mojo.version%% literally
buch read mojov1                 # shows the resolved version
```

If a page is read from an **untrusted external git library**, key rendering is
gated: `read` fails loudly rather than rendering silently, and `--raw` always
works. Grant key rendering only after reviewing the library. This library is
usually consumed locally or via a trust grant:

```sh
buch trust github.com/LukasLow/buch-lib --kdb
```

## What is in scope here

This buch is a self-sufficient Mojo 1.x reference: an agent that reads it can
write Mojo without internet access. It deliberately mirrors the official
documentation page by page — the manual, the language reference, the keywords
reference, the standard library index and the release notes — so no documented
topic is missing.

Its boundary is the **1.x series**. When Mojo 2.0 lands, that becomes a new buch
(`mojov2`), not a chapter here; `mojov1` then freezes as the complete 1.x
record.

## Sources

- <https://mojolang.org/docs/manual/basics/>
- <https://mojolang.org/docs/reference/keywords/>
- <https://mojolang.org/releases/v1.0.0/>
- <https://mojolang.org/docs/api-docs/stability/>
