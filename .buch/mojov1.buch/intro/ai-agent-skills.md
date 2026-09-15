# Mojo AI skills

Mojo ships an official set of **AI agent skills** — instructions packaged for
coding agents so they generate current, idiomatic Mojo. The official page is
<https://mojolang.org/docs/tools/skills/>. This page explains what the skills
are, how to install them, and how they relate to this buch.

## What it is

Mojo AI skills are Modular's official, maintained guidance for AI coding agents
working in Mojo and MAX. The official page frames the problem they solve:

> "Many AI models are trained on older versions of Mojo and MAX. They aren't
> updated as quickly as the language evolves, so they often generate code that
> doesn't compile or reflects outdated usage."
> — <https://mojolang.org/docs/tools/skills/>

The skills exist to supply "accurate, up-to-date context" that is "compact and
focused, providing only the most important guidance needed to avoid common code
generation issues. This keeps token usage low and leaves more room for relevant
context."

They are produced by Modular and hosted in the official
[`modular/skills`](https://github.com/modular/skills) repository, which
"provide[s] current guidance on Mojo syntax, development patterns, and
workflows so AI coding agents generate modern, working code that aligns with the
language today." They are licensed under Apache 2.0.

## It follows the Agent Skills Standard

> "Skills follow the [Agent Skills Standard](https://agentskills.io/specification).
> Each skill is self-contained, triggered by intent, and structured for reliable
> use by AI agents."
> — <https://mojolang.org/docs/tools/skills/>

At runtime the intended flow is:

1. The agent interprets your request.
2. It selects the right skill (for example, `mojo-syntax` or
   `mojo-gpu-fundamentals`).
3. The skill guides generation toward current Mojo and MAX patterns.

The page is emphatic that this is not prompting in the loose sense: "This isn't
prompting. It's controlled code generation."

## What the skills cover

The official page lists the outcomes the skills are designed for:

- Start new Mojo or MAX projects without manual setup.
- Generate modern Mojo syntax.
- Write GPU code using valid patterns.
- Use Python interoperability correctly.
- Port code from CUDA, Python, or C++.

Named skills mentioned on the official pages include `mojo-syntax`,
`mojo-gpu-fundamentals`, and `mojo-python-interop` (the last is also cited by
the [Python-to-Mojo guide](https://mojolang.org/docs/manual/python-to-mojo/) as
handling "the patterns that trip models up like `PythonObject` wrapping,
`import` conventions, and type conversions between the two languages").

## Installation

The official installation commands:

```text
npx skills add modular/skills          # install all skills
npx skills add modular/skills --skill mojo-syntax   # install one skill
npx skills update                      # update installed skills
```

Manual alternatives documented on the same page:

```text
git clone https://github.com/modular/skills.git
git clone git@github.com:modular/skills.git
gh repo clone modular/skills
```

For manual installation you "copy or symlink individual skill files into your
agent's configuration directory."

The official [Get started tutorial](https://mojolang.org/docs/manual/get-started/)
recommends installing the skills **before** working through Mojo material with
an AI assistant, precisely because model knowledge lags the language.

## Optional: the docs MCP server

The same page documents a **Model Context Protocol (MCP)** server that gives an
assistant live access to the documentation:

- URL: `https://mojo-mcp.modular.com/mcp/`
- It "indexes both the stable and nightly documentation", letting the assistant
  "search Mojo's manual, API references, and code examples while it plans,
  writes, and debugs your code, so its answers stay grounded in the current
  documentation instead of its training data."

Example client configuration from the official page (Claude Code):

```sh
claude mcp add --transport http mojo-docs https://mojo-mcp.modular.com/mcp/
```

Cursor, in `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mojo-docs": {
      "url": "https://mojo-mcp.modular.com/mcp/"
    }
  }
}
```

Both the skills and the MCP server require network access and live upstream
infrastructure.

## Known limitations (from the official FAQ)

The official page states the limits honestly:

- **Not always current:** "Skills are updated regularly to track changes in Mojo
  and MAX, but there will be lag between language changes and skill updates."
- **Not versioned per Mojo release:** "Skills aren't versioned by Mojo release,
  so there may be mismatches between the skill's guidance and your installed
  version. We recommend installing the latest version of Mojo to minimize this
  risk."
- **Optional:** "No. Install only what you need."

## How this buch relates to the skills

Both artifacts encode the same goal — keep an agent writing correct, current
Mojo — but they differ in where the truth lives and what they require:

| | Official Mojo AI skills | This buch (`mojov1`) |
|---|---|---|
| Publisher | Modular (`modular/skills`) | This repository |
| Form | Agent Skill packages, triggered by intent | Markdown pages read on demand |
| Format | Agent Skills Standard | buch format (`buch read`, selectors) |
| Network | Needed to install/update; MCP needs it live | None — works fully offline |
| Scope | Compact, focused guidance for generation | Thorough reference with sources, migration record |
| Versioning | Not versioned by Mojo release | States the current Mojo version explicitly |

The relationship in one sentence: **the official skills encode Mojo best
practices for coding agents in a compact, generation-oriented form; this buch is
the offline-readable companion that documents the same current language in
depth, with the official sources and the release migration record attached.**

### What an agent should use when both are available

Use the **official skills for generation** — they are Modular's maintained,
intent-triggered guidance and are the most direct way to bias code toward
current idioms. Use **this buch for reference and verification** — when you need
the reasoning behind a rule, a page that stands alone without network access, the
full version/migration record, or an official source URL to check a claim. When
the two appear to disagree, trust the **page's cited official source** and the
current stable release this buch names via `%%mojo.version%%`, then re-read the
upstream page if it is reachable.

The relevant official position is on the skills page itself: the skills reduce
the risk of stale model output but "there will be lag between language changes
and skill updates". A self-contained reference with dated verification is the
complement to that.

## Sources

- <https://mojolang.org/docs/tools/skills/>
- <https://mojolang.org/docs/manual/python-to-mojo/>
- <https://mojolang.org/docs/manual/get-started/>
- <https://github.com/modular/skills>
