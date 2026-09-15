# Source policy — where Mojo knowledge in this buch may come from

Scope: `mojov1.buch` (Mojo 1.x). This file is binding for every author and every agent that writes or edits a page. It exists because of one specific failure mode.

## The hard rule

**Every statement about Mojo in this buch must come from the official Mojo 1.x documentation at `mojolang.org`.** No exceptions without the open-question marker below.

## How to read the official docs

**Append `.md` to any official doc URL to get the official Markdown of that page.** This is the MANDATORY way to read the official docs for this book:

1. Take the canonical page URL, e.g. `https://mojolang.org/docs/reference/keywords/`.
2. Append `.md` and fetch that, e.g. `https://mojolang.org/docs/reference/keywords.md` — this returns the complete official Markdown of that page (verified 2026-09-15: the keywords page came back complete, including the identifiers, keywords and conventions sections).
3. **Cite the URL** — either the canonical page (without `.md`) or the Markdown URL (with `.md`), but **be consistent** within a page.
4. **Never scrape or parse HTML when the Markdown is available.** HTML is layout for humans; the `.md` form is the same content, authoritative and machine-readable.
5. **`llms.txt` is the map of all official pages.** It is now saved verbatim as `official-docs-map.md` in this plan directory; use it for navigation, then cite the page you actually read.

## Why

The failure mode we are avoiding is **stale knowledge presented as current fact**.

Mojo is young and moved fast before 1.0. Large parts of what models and the wider internet "know" about Mojo describe pre-1.0 versions: `fn` as the normal function keyword, `let`, `InlineArray`, `StringSlice`, `read`, `__del__`, `owned`/`borrowed`/`inout`, `Pointer` vs `UnsafePointer`. Every one of those is deprecated, renamed or removed in 1.0. A page that repeats them is not merely outdated — it actively teaches an agent to write code that the 1.0 compiler rejects or warns about.

Pre-1.0 sources also disagree about the **version number itself**, because the same release shipped as conda `25.5` and PyPI `0.25.5`. The official 1.x docs are the only channel that is unambiguous about the current state.

The rule therefore is: **if it is not in the official 1.x docs, it does not go into the book as fact** — it goes into an open question.

## Allowed sources

Official `mojolang.org` documentation only:

| What | URL |
|------|-----|
| Docs root | https://mojolang.org/docs/ |
| Manual | https://mojolang.org/docs/manual/ |
| Language reference | https://mojolang.org/docs/reference/ |
| Keywords reference | https://mojolang.org/docs/reference/keywords/ |
| Standard library index | https://mojolang.org/docs/std/ |
| Release notes for 1.0.0 | https://mojolang.org/releases/v1.0.0/ |
| Releases archive (all versions) | https://mojolang.org/releases/archive/ |
| Releases (current channel) | https://mojolang.org/releases/ |
| Requirements / install | https://mojolang.org/docs/requirements/ ; https://mojolang.org/install/ |
| Community packages index | https://mojolang.org/packages/ |
| Stability guarantees | https://mojolang.org/docs/api-docs/stability/ |
| LLM index — site overview | https://mojolang.org/llms.txt |
| LLM index — manual | https://mojolang.org/llms-manual.txt |
| LLM index — language reference | https://mojolang.org/llms-reference.txt |
| LLM index — standard library | https://mojolang.org/llms-stdlib.txt |
| CLI reference | https://mojolang.org/docs/cli/ |
| Decorators reference | https://mojolang.org/docs/reference/decorators/ |
| Cheat sheets | https://mojolang.org/docs/reference/cheat-sheets/ |
| Tools — testing | https://mojolang.org/docs/tools/testing/ |
| Tools — packaging | https://mojolang.org/docs/tools/packaging/ |
| Tools — debugging | https://mojolang.org/docs/tools/debugging/ |
| Tools — compilation | https://mojolang.org/docs/tools/compilation/ |
| Tools — notebooks | https://mojolang.org/docs/tools/notebooks/ |
| Tools — feature toggles | https://mojolang.org/docs/tools/feature-toggles/ |
| C FFI | https://mojolang.org/docs/manual/c-ffi/ |
| Mojo AI skills | https://mojolang.org/docs/tools/skills/ |
| Roadmap | https://mojolang.org/docs/roadmap/ |
| Vision | https://mojolang.org/docs/vision/ |

The four `llms*.txt` indexes are allowed as **navigation aids** — use them to find the right official page and URL, then cite the page, not the index. The source repository `https://github.com/modular/modular` is allowed only for facts about licensing, open-sourcing and contribution process (it is the upstream of the docs), not as a substitute for the language documentation.

## Forbidden sources

- **Blogs** — including vendor blog posts, unless the page is only being cited as a pointer to a release announcement and the technical claim is confirmed in the official docs.
- **StackOverflow** and any Q&A site.
- **Community wikis** and fan-maintained language guides.
- **YouTube** and talks/slides, except as navigation toward an official page.
- **Other LLMs' recollection**, including any model's memory of Mojo and generated tutorials.
- **Any pre-1.0 documentation page used as a description of current behaviour.** Pre-1.0 release notes may be cited only as **version history** (e.g. "Mojo 0.25.5 was released as conda 25.5"), never as current syntax or APIs.

## Workflow rule for authors and agents

1. **Fetch the official page** for the claim you are about to write. Open it; do not work from memory or from this buch's own earlier wording.
2. **Quote it.** Put the official phrasing (or a close paraphrase that keeps the exact technical nouns) into the page.
3. **Cite the URL next to the claim**, in the same paragraph or the page's source line, so a reviewer can check it without searching.
4. **When the official docs are silent or contradictory, mark an explicit open question instead of filling the gap.** Use a short, visible marker, for example:

   > **Open question:** the official keywords reference does not list `alias`; it is unclear whether it is reserved. Verify against the next upstream release before documenting it as a keyword.

   Never resolve an ambiguity with intuition. A marked gap is correct output; a plausible invention is a defect.
5. **Re-verify on every release.** When a new 1.x release lands, check the pages touched by that release against the upstream docs and update `.kdb/mojo/verified.js` to the new verification date.

## Known documentation gaps (already found — use as examples of "mark it, do not invent it")

- **`alias`** — used pervasively throughout Mojo code and documentation, yet it **does not appear on the official keyword list**. **Confirmed by reading the page's own Markdown** (`https://mojolang.org/docs/reference/keywords.md`, fetched 2026-09-15): the page has an *Identifiers* section, a *Keywords* section (control flow, error handling, declarations, keyword operators, imports, compile-time, literal keywords, case sensitivity) and a *Conventions* section — there is **no `alias` section anywhere**. Do not present it as a reserved keyword. It is documented under `keyword-conventions/alias.md` with the gap noted. Source: https://mojolang.org/docs/reference/keywords/
- **`async` / `await`** — the stability page refers to them as keywords, but they are **omitted from the keywords reference** and are marked **UNSTABLE**. **Confirmed by reading the page's own Markdown** (`https://mojolang.org/docs/reference/keywords.md`, fetched 2026-09-15): the Markdown contains **no `async`/`await` section at all** — not under *Keywords* and not under *Conventions*. Do not present them as stable language features. They are documented under `keyword-conventions/async-await.md` with the inconsistency flagged. Sources: https://mojolang.org/docs/api-docs/stability/ ; https://mojolang.org/docs/reference/keywords/

Both cases follow the same rule: the book mirrors the gap rather than resolving it. If upstream later adds `alias` to the keyword list or stabilises `async`/`await`, the corresponding page is moved and the change is recorded in the relevant `versions/` page.
