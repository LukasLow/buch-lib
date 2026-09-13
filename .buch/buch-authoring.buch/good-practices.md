# Good practices

The format is small, so quality comes from discipline, not tooling. These
practices are opinionated and based on the way buchs are actually read: by
humans in an editor and by agents loading targeted sections.

## One topic per buch

A buch should answer one coherent question. "Deploying the API" is a buch;
"everything about the company" is not — split it. A focused buch has a stable
id, a predictable set of pages and a clear boundary for readers and agents.

## Keep pages short

A page is a unit of context, not a chapter. Aim for a few screens of Markdown.
When a page grows past that, split it along a real seam and link the parts. Short
pages load faster into an agent's context and are easier to review.

## Give headings stable, meaningful names

Headings become anchors, and anchors become addresses:

```sh
buch read buch-authoring/structure#a-complete-example
```

- Use descriptive headings, not "Step 1", "Notes" or "Misc".
- Anchor normalization lowercases, turns whitespace into `-` and drops other
  punctuation, so "Required fields!" becomes `required-fields`.
- Treat a published anchor as API: renaming a heading breaks links. Add a new
  heading rather than silently changing a used one.

## Prefer deterministic KDB

Dynamic values are for facts that belong in one place and are reused across
pages — a version, a support channel, a canonical name. Prefer static values:

```js
// .kdb/format-version.js
1;
```

- Avoid the non-deterministic opt-in unless you truly need time or randomness;
  it marks the page `dynamic` and makes it non-reproducible.
- Remember resolution is **same-buch only**: do not expect a page to reach into
  another buch's `.kdb/`.
- Keep keys lowercase-hyphenated and nested only when the nesting aids discovery
  (`company.support`, not `cs`).
- Do not use `%%key%%` for prose that changes constantly; use it for stable
  facts.

## Document capabilities, not just content

A reader (human or agent) should know what a buch can do before using it. On the
main page, list the pages, call out dynamic values and mention any actions with
their arguments. `buch manifest` derives this for agents, but a short human
overview still pays off.

## Keep actions small and honest

- One action, one job. If it needs a paragraph of caveats, split it.
- Return a value; the host formats it deterministically.
- Never rely on the filesystem, network, environment or process state — the
  sandbox provides none of them.
- Describe the action and its arguments on the page that mentions it.
- Expect readers to review an action before enabling actions trust; keep it
  readable.

## Name ids lowercase-hyphenated

Ids are permanent addresses. Use `^[a-z0-9-]+$`:

```yaml
id: incident-response   # good
id: Incident_Response   # invalid
```

Match the directory slug to the id where practical (`incident-response.buch`),
so the folder and the address agree.

## Version with git commits

A buch has no version number; its version is the commit that contains it. That
means:

- Commit meaningful, reviewable changes.
- Let consumers pin a commit in `deps.lock.json`; use `buch update` to move a pin
  deliberately.
- Write commit messages that explain *why* a page changed — the diff shows what.

## Review with validate

Run validation before every commit and in CI:

```sh
buch validate
buch validate --json
```

It catches missing required fields, invalid and duplicate ids, malformed links,
dangling `%%key%%` references and action syntax errors without executing
anything. Errors exit `1`; warnings exit `0`.

## Avoid duplication with repository docs

A repository's README and `docs/` serve contributors to *that project*. A buch
serves readers of *a body of knowledge*. Do not copy a README into a buch or
vice versa. When content belongs to both, keep the canonical copy in one place
and link to it, so the two cannot drift.

## Write for both humans and agents

- Lead with a one-sentence definition, then details.
- Use tables and short lists for enumerable facts.
- Make each page self-contained enough that reading it alone is useful.
- Prefer explicit nouns over pronouns ("the sandbox", not "it").
- Provide the JSON/CLI forms of commands, not only prose.
- Keep a stable page order in the main page so agents can navigate.

## A quick checklist

- [ ] The buch has one clear topic and a valid id.
- [ ] The main page links every page and states what the buch is for.
- [ ] Pages are short, with descriptive, stable headings.
- [ ] Dynamic values are static where possible and same-buch only.
- [ ] Actions are small, pure, documented and reviewed before trust.
- [ ] `buch validate` passes and CI runs it.
- [ ] Nothing duplicates content that already lives in a repository README.
