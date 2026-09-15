# Proposed structure — `mojov1.buch`

Decisions: language = Mojo. Book language = English. Buch id = `mojov1`; directory = `mojov1.buch/`. Scope = the Mojo **1.x series only**. Model = **one content tree that always documents the CURRENT 1.x release**, plus a `versions/` chapter that records what changed between releases. There is **no per-version content copy and no `v1.0.0/` wrapper folder**. All facts below are the verified researcher facts (sources: mojolang.org, modular.com, github.com/modular/modular; as of 2026-09-15) — see `facts.md`. Source rules are in `source-policy.md`.

## Why this model

A programming-language book has two jobs that pull in opposite directions:

1. An agent that is writing code needs **the current truth**, in one place, with no version maze to navigate.
2. A reader who believes they are on an older release needs to find out **what changed** since.

The chosen model gives job 1 the whole content tree and job 2 a small dedicated chapter. The trade-off is stated honestly:

- **The content tree holds only the current state. Old idioms are NOT preserved in the content pages.** When a spelling is replaced (for example `fn` → `def`, `read` → `imm`, `InlineArray` → `Array`), the content pages show the new spelling only. There is no "1.0 copy" of a keyword page that keeps the old teaching.
- **Old idioms survive in exactly two places:** (a) the `versions/` pages, which carry the old→new rename tables and migration notes, and (b) the **git history** of this repository, where the previous wording of any page can be recovered and diffed.
- This is a **deliberate choice for the agent use case.** An agent that reads `mojov1/keywords/def` must get one unambiguous answer for the current release. If the book kept parallel per-version copies, a single page read would no longer identify its own version and the two copies would drift. The cost — that historical teaching is not browsable in the content tree — is accepted and paid for by `versions/` plus git.

The previous model (one full content copy per minor version, `mojo/v1.0.0/…`) is **superseded** and rejected for that reason.

## Current version pointer

The current version is a **live value**, not text typed into pages:

- `.kdb/mojo/version.js` returns the current Mojo version string, e.g. `"1.0.0"`.
- `.kdb/mojo/verified.js` returns the date the content was last verified against the official docs, e.g. `"2026-09-15"`.

The buch main page (`.buch/mojov1.buch/+index.md`) states:

> This book is at the current Mojo version of `%%mojo.version%%`.

and surfaces a freshness signal using `%%mojo.verified%%`. Because both are `.kdb` keys, **bumping `.kdb/mojo/version.js` updates every mention** in the buch; there is no second place to edit. `.kdb/mojo/status.js` (stability statement) and `.kdb/mojo/links.js` (canonical upstream URLs) are kept alongside them.

## Tree

```text
.buch/
├── +index.md                       library index (add `mojov1` to the buch table)
└── mojov1.buch/                    ONE content tree; always the current 1.x release
    │                               (the official docs map is saved as
    │                                `.agents/tasks/mojov1/plan/official-docs-map.md` and is the master navigation)
    ├── +index.md                   main page; "current version of %%mojo.version%%"; freshness via %%mojo.verified%%; read order; version table
    ├── .kdb/mojo/
    │   ├── version.js              current version string, e.g. "1.0.0"  (bump this; every mention follows)
    │   ├── verified.js             date content was last verified against official docs, e.g. "2026-09-15"
    │   ├── status.js               stability statement, e.g. "1.0.0 stable; source-only stability, no ABI stability"
    │   └── links.js                canonical upstream URLs (docs, repo, releases)
    ├── .assets/                    diagrams, sample outputs
    ├── glossary.md
    ├── intro/
    │   ├── what-is-mojo.md
    │   ├── design-goals.md
    │   ├── how-to-read-this-buch.md
    │   ├── reading-api-docs.md             (how to read Mojo API docs and signatures; official /docs/api-docs/)
    │   ├── install.md                      (toolchain: uv/pixi/conda, mojo vs mojo-compiler, max[all])
    │   ├── supported-platforms.md          (OS, CPU, RAM, GPU and Python requirements; official /docs/requirements/)
    │   ├── first-program.md                (first program, REPL, formatter, run/build loop)
    │   ├── packages-and-modules.md         (`__init__.mojo`, module/package layout, import resolution)
    │   ├── packages-and-environments.md    (environments, dependencies, Python 3.10–3.14 prerequisite)
    │   ├── version-history.md              (the three version eras; channel-dependent version numbers)
    │   ├── roadmap.md                      (the official Mojo roadmap; official /docs/roadmap/)
    │   ├── stability.md                    (per-API stability model; source-only; no ABI stability)
    │   └── ai-agent-skills.md              (the official Mojo AI skills page and how this buch relates to it)
    ├── basics/
    │   ├── syntax.md
    │   ├── literals.md
    │   ├── operators.md
    │   ├── variables-and-mutability.md
    │   ├── control-flow.md
    │   └── comments-and-docstrings.md
    ├── reference/                  mirrors the official language reference in page form
    │   ├── index.md                 entry point; describes the reference chapter and links to the official reference
    │   ├── expressions.md
    │   ├── simple-statements.md
    │   ├── compound-statements.md
    │   ├── literals.md
    │   ├── numeric-types.md
    │   ├── function-declarations.md
    │   ├── struct-declarations.md
    │   ├── trait-declarations.md
    │   ├── closure-declarations.md
    │   ├── docstrings.md
    │   ├── inline-mlir.md
    │   └── cheat-sheets.md
    ├── keywords/                    the 34 TRUE keywords, one page each
    │   ├── index.md                 normal page (only +index.md is the buch main page); one row per keyword
    │   ├── def.md
    │   ├── fn.md                    deprecated stub; points to def and to versions/1.0.0
    │   └── ...                      if, elif, else, for, while, break, continue, pass, return, with,
    │                                try, except, finally, raise, assert, lambda, struct, trait, var,
    │                                ref, and, or, not, in, is, import, from, as, comptime, True,
    │                                False, None, Self
    ├── keyword-conventions/         NOT keywords: fixed meaning only in declarations/signatures
    │   ├── index.md
    │   ├── imm.md
    │   ├── mut.md
    │   ├── out.md
    │   ├── deinit.md
    │   ├── raises.md
    │   ├── where.md
    │   ├── alias.md                 documented gap: used pervasively, absent from the keyword list
    │   └── async-await.md           documented gap: called keywords on the stability page, UNSTABLE
    ├── types/
    │   ├── overview.md
    │   ├── integers-and-floats.md
    │   ├── bool-and-strings.md
    │   ├── structs.md
    │   ├── operator-support.md             (implementing dunder operators for custom types)
    │   ├── self-referential-structs.md     (linked lists, trees and recursive structs via pointers)
    │   ├── traits.md
    │   ├── collections.md
    │   ├── pointers-and-references.md
    │   └── optionals-and-nullability.md
    ├── functions/
    │   ├── parameters-and-generics.md
    │   ├── overloads.md
    │   ├── closures-and-lambdas.md
    │   └── decorators-and-metaprogramming.md
    ├── decorators/                 one page per official built-in decorator
    │   ├── index.md                 index; states these are the official built-in decorators
    │   ├── align.md
    │   ├── always-inline.md
    │   ├── deprecated.md
    │   ├── doc-hidden.md
    │   ├── explicit-destroy.md
    │   ├── export.md
    │   ├── fieldwise-init.md
    │   ├── implicit.md
    │   ├── no-inline.md
    │   ├── staticmethod.md
    │   ├── copy-capture.md          deprecated
    │   └── parameter.md             deprecated (legacy closure)
    ├── memory/
    │   ├── value-semantics.md
    │   ├── ownership-and-lifetimes.md
    │   ├── origin-and-borrowing.md
    │   └── allocators.md
    ├── lifecycle/                  the value lifecycle made explicit (official manual chapters)
    │   ├── index.md                chapter intro to the value lifecycle (life → initialization → death)
    │   ├── life.md                  value creation — when and how Mojo creates values
    │   ├── initialization.md        logical vs. fieldwise instance initialization
    │   └── death.md                 value destruction — when and how Mojo destroys values
    ├── errors/
    │   ├── error-model.md
    │   ├── raising-and-propagation.md
    │   └── safety-and-undefined-behaviour.md
    ├── interop/
    │   ├── python-interop.md        (Mojo is NOT a Python superset)
    │   ├── calling-python.md
    │   ├── mojo-from-python.md      (import and use Mojo modules in Python code)
    │   ├── calling-c.md
    │   └── migration-from-python.md
    ├── concurrency/
    │   ├── async-and-parallelism.md
    │   ├── gpu-and-accelerators.md
    │   └── vectorization-and-simd.md
    ├── stdlib/
    │   ├── overview.md
    │   └── <package>.md             one page per package; 37 packages in the current 1.x release (see stdlib.md)
    ├── idioms/
    │   ├── style-guide.md
    │   ├── patterns.md
    │   ├── anti-patterns.md
    │   └── performance-idioms.md
    ├── tooling/
    │   ├── compiler-and-flags.md
    │   ├── feature-toggles.md       (compile-time feature toggles)
    │   ├── formatter-and-linter.md
    │   ├── testing.md
    │   ├── notebooks.md             (Mojo in local and Colab Jupyter notebooks)
    │   ├── debugging-and-profiling.md
    │   ├── editor-and-lsp.md
    │   └── pixi.md                  (Pixi basics; prefix.dev CLI for environments)
    ├── cli/                        tooling chapter for the command line; one page per official CLI page
    │   ├── index.md                 the `mojo` command-line interface; command overview
    │   ├── build.md
    │   ├── run.md
    │   ├── format.md
    │   ├── repl.md
    │   ├── doc.md
    │   ├── precompile.md
    │   ├── debug.md
    │   └── demangle.md
    ├── project/
    │   ├── structure.md
    │   ├── packaging-and-distribution.md
    │   └── ci.md
    ├── versions/                    one page per release: migration notes, what is new, what is now idiomatic
    │   ├── index.md                 table: version, date, headline, link
    │   └── 1.0.0.md                 what 1.0.0 means versus 0.x; breaking changes; old→new rename table; what is now idiomatic
    └── appendix/
        ├── cheat-sheet.md
        ├── comparison-to-python.md
        ├── faq.md                    (Mojo FAQ; official /docs/faq/)
        ├── exercises.md
        └── further-reading.md
```

Folder shape is exactly as agreed previously (`intro/`, `basics/`, `keywords/`, `keyword-conventions/`, `types/`, `functions/`, `memory/`, `errors/`, `interop/`, `concurrency/`, `stdlib/`, `idioms/`, `tooling/`, `project/`, `appendix/`) plus the new `versions/`, `reference/`, `decorators/`, `lifecycle/` and `cli/` chapters. The former `install/` and former chapter-root pages (`overview.md`, `changes.md`) are folded in: installation material now lives in `intro/` (with `intro/ai-agent-skills.md` added), the read order moved to `+index.md`, and the former `changes.md` became `versions/1.0.0.md`.

The tree is the master page list; `keywords/` and `stdlib/` are abbreviated (`…`, `<package>.md`) and expand to 36 and 38 pages respectively. **Total: 194 pages** — identical to the count in `page-inventory.md`.

**Official docs map:** the master navigation for all of this is the official `llms.txt`, saved verbatim as `.agents/tasks/mojov1/plan/official-docs-map.md`. The `reference/`, `decorators/`, `lifecycle/`, `cli/` and `tools/` chapters above are the book's page-per-page mirror of that map (see `source-policy.md` for how to read each page as Markdown).

## `versions/` — the change record

`versions/` exists for exactly one reader: an agent that believes it is on, say, 1.2 while the project is on 1.5, and needs to become current by reading precisely what changed.

- `versions/index.md` — a table with one row per release: **version, date, headline, link** to that release's page.
- `versions/<version>.md` — one page per release, each holding:
  1. **Migration notes** — what must be changed in code, with old→new code pairs.
  2. **What is new** — features added in that release.
  3. **What is now idiomatic** — what the language's recommended style changed to, even where the old form still compiles.
- The first page is `versions/1.0.0.md`: what 1.0.0 means versus 0.x, **all** breaking changes, the **old→new rename table** (`fn`→`def`, `read`→`imm`, `InlineArray`→`Array`, `StringSlice`→`StringSpan`, `size`→`length`, `ImplicitlyDestructible`→`Deinitable`, `__del__`→`__deinit__`, `Pointer`/`UnsafePointer`→`Pointer`, …), and what is now idiomatic in 1.x.

**Rule for future releases (short and complete):** when a new 1.x release lands, **add ONE page** under `versions/` and **bump `.kdb/mojo/version.js`** — nothing else. No content copy, no new folder, no per-version wrapper. If a content page's teaching changes with the release, edit that page in place; the `versions/` page records the old→new mapping.

## Scope rule

This buch covers the Mojo **1.x series only**. The content tree is the current 1.x truth, and `versions/` records movement within 1.x.

**When Mojo 2.0 lands, that is a new buch — `mojov2` — not a new chapter here.** `mojov1` then freezes as the complete 1.x record: its content tree stays at the last 1.x release and its `versions/` pages remain the migration trail. The two buchs are separate ids so an agent can depend on the exact scope it needs.

## Keywords: true keywords vs. declaration conventions

- `keywords/` — the **34 true reserved keywords** from https://mojolang.org/docs/reference/keywords/. One page each. They cannot be used as ordinary identifiers (escaped backtick identifiers are the workaround).
- `keyword-conventions/` — `imm`, `mut`, `out`, `deinit`, `raises`, `where`, plus the flagged `alias` and `async`/`await`. These are **not reserved**; in Mojo signatures they have fixed meaning only. The index page states this explicitly.
- `keywords/fn.md` is a deprecated stub pointing to `keywords/def.md` and `versions/1.0.0`; `fn` is not one of the 34 current keywords.
- Do not file `parallelize`, `vectorize`, `unroll`, `SIMD`, `Int`, `List`, `Dict` as keywords — they are stdlib/builtins.

## Nesting

The deepest logical path is `mojov1/<folder>/<page>` — for example `mojov1/keyword-conventions/async-await` or `mojov1/stdlib/collections`, i.e. **two page segments**, because the removed version wrapper no longer adds a level. The format places no limit on page nesting (see `nesting-test.md` for the empirical result), so deeper subtrees (e.g. `keywords/operators/as`, three segments) remain possible later.

## Naming rules used

- Page paths lowercase-hyphenated, forward slashes only.
- Headings descriptive and stable, because they become anchors and therefore addresses.
- Exactly one `+index.md`, at the buch root.
- Buch id and directory name agree: id `mojov1`, directory `mojov1.buch/`.

## Open points for the user

1. Do we add a `keywords/operators/<op>.md` subtree for symbolic operators, or keep operators in `basics/operators.md`?
2. `alias` and `async`/`await` may be reclassified upstream (alias is a documentation gap; async/await is unstable) — decide how aggressively to mirror each upstream release (see `source-policy.md`).
3. Does `versions/` also carry **patch** releases (1.0.1, …) as rows in the index, or only minor/major releases? The current plan can take either; a patch row would be short and would keep the index a complete timeline.
4. Does `reference/` **duplicate pages already in `basics/` and `types/`** (e.g. `reference/literals.md` vs `basics/literals.md`, `reference/numeric-types.md` vs `types/integers-and-floats.md`)? Decide between two options: **(a)** treat the `reference/` pages as the canonical detail and keep `basics/`/`types/` as the guided tour that links into them, or **(b)** merge them, keeping one page per topic and letting the reference chapter hold only what the tour does not cover. This must be settled before the duplicate pairs are written.
