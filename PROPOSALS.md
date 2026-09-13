# Proposals — buch ideas for `buch-lib`

Ten concrete buchs that would be broadly useful across developers, teams and
AI agents. Each proposal lists a proposed id (lowercase-hyphen, per the id
rules), a one-line purpose, and the pages/topics it would contain. They are
chosen to be non-overlapping and to cover agent workflows, software engineering,
tooling, team process and non-technical knowledge.

---

## 1. `working-with-ai-agents`

**Purpose:** How to brief, supervise and get reliable results from coding agents
and LLM tools in day-to-day engineering work.

- Task framing: turning a vague request into goal, constraints and an acceptance
  check the agent can verify.
- Context engineering: what to put in a rules file, what to leave out, and how to
  keep prompts short.
- Verification loop: requiring tests, diffs and evidence instead of trusting a
  confident summary.
- Failure modes: hallucinated APIs, scope creep, sycophancy and how to spot each.
- Handover: recording decisions in-repo so the next agent (or human) starts warm.

## 2. `code-review-practice`

**Purpose:** A shared, teachable standard for reviewing code — what to look for
and how to give feedback that lands.

- A review checklist by dimension: correctness, security, performance, tests,
  readability and operability.
- Sizing changes: why small pull requests get better reviews, and how to split
  large ones.
- Writing comments: separating blocking issues from nits, and phrasing requests
  as questions where appropriate.
- Author responsibilities: self-review, PR description, and responding to
  feedback without churn.
- Reviewing asynchronously across time zones and review SLAs for a team.

## 3. `git-workflow`

**Purpose:** The practical git and branching conventions a team needs to work in
parallel without fear.

- Commit hygiene: atomic commits, message style and why the "why" beats the
  "what".
- Branching models: trunk-based vs. short-lived feature branches, and when each
  fits.
- Rebase vs. merge: choosing deliberately and handling conflicts without losing
  work.
- Recovering from mistakes: reflog, reverting a bad merge, undoing a pushed
  commit safely.
- Worktrees for parallel agent/human work in one repository.

## 4. `debugging-method`

**Purpose:** A disciplined process for finding root causes quickly instead of
guess-and-check.

- Reproduce first: shrinking a failure into the smallest reliable case.
- Read the evidence: stack traces, logs, exit codes and the actual error text
  before changing anything.
- Bisect and isolate: binary search over commits, inputs and configuration.
- Hypothesis tracking: writing down what you believe and what would falsify it.
- Blameless postmortems: turning a fix into a regression test and a follow-up.

## 5. `api-design`

**Purpose:** Stable, boring interfaces that clients can depend on for years.

- Contract-first thinking: consumers, error model and backwards compatibility.
- Naming and shape: resources, verbs, pagination, filtering and idempotency.
- Versioning and evolution: additive change, deprecation windows and migration.
- Errors and observability: structured errors, status codes and correlation ids.
- Reviewing an interface before implementation, with an explicit compatibility
  checklist.

## 6. `terminal-toolkit`

**Purpose:** The CLI tools and shell habits that make everyday operations fast
and safe.

- Finding things: `rg`, `fd`, `fzf` and shell history search.
- Reading structured data: `jq`, `yq`, `column` and diffing JSON.
- Process and system inspection: `ps`, `lsof`, `ss`, `htop` and `strace`.
- Safe shell: `set -euo pipefail`, quoting, traps and avoiding destructive
  globs.
- Remote work: `ssh` config, port forwarding, `rsync` and long-running sessions
  with `tmux`.

## 7. `incident-response`

**Purpose:** How a team detects, coordinates and closes out production
incidents calmly.

- Severity levels: definitions, who declares, and when to page a human.
- Roles during an incident: incident commander, comms lead and scribe.
- Communication: status page updates, customer language and internal cadence.
- Mitigation before diagnosis: roll back, feature-flag off, drain, then
  investigate.
- Postmortem: timeline, contributing factors, action items with owners and a
  review of whether detection was fast enough.

## 8. `onboarding-new-engineers`

**Purpose:** Get a new team member to a first meaningful contribution quickly,
without a senior engineer narrating everything.

- Environment setup: accounts, access, local build and a "hello world" change on
  day one.
- Codebase orientation: the five files that matter, the glossary, and where data
  lives.
- First tasks: a curated list of small, real, low-risk changes.
- People and process: who owns what, meeting rhythm and where decisions are
  recorded.
- The 30/60/90-day arc: expectations and checkpoints for the new joiner and the
  mentor.

## 9. `meetings-that-work`

**Purpose:** Make recurring meetings worth their cost, and cancel the ones that
are not.

- Deciding whether a meeting is needed at all, and replacing status meetings
  with written updates.
- Agendas that lead with decisions, not announcements.
- Facilitation: timeboxing, parking-lot, and getting quiet participants heard.
- Decisions and follow-up: capturing the decision, the owner and the deadline in
  one place.
- A short catalog of meeting formats: standup, planning, retro, 1:1 and design
  review.

## 10. `personal-finance-basics`

**Purpose:** Non-technical, broadly useful money knowledge for people early in
their careers.

- Budgeting: a simple framework, fixed vs. variable costs and building an
  emergency fund.
- Debt: interest, minimum payments and when to prioritize repayment over
  investing.
- Investing basics: diversification, index funds, fees and time in the market.
- Insurance and risk: what to cover, what to skip, and why the cheapest policy
  is not always the answer.
- Taxes and paperwork at a high level: keeping records, deadlines and when to
  ask a professional.

---

## How to pick one up

A proposal becomes a buch when someone creates `TITLE.buch/` with a valid
`+index.md`, writes short pages with stable headings, and runs `buch validate`.
See the [`buch-authoring`](.buch/buch-authoring.buch/+index.md) buch for the
format and the practices. One proposal per pull request keeps reviews focused.
