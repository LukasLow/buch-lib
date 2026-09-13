# Actions

An **action** is a small JavaScript program stored in `TITLE.buch/actions/` and
run explicitly by a reader. Actions are how a buch does something — validate a
project, transform a list, print a report — without turning into a general
script collection.

Actions are **never** run during `buch read`, `buch list` or `buch search`. They
only run through `buch exec`, and only after the actions trust gate is open.

## The shape

An action is a file `actions/NAME.js`. The action name is the file name without
`.js`. Like a `.kdb` module, it is a single expression, and it may be a value or
a function:

```js
// actions/word-count.js
// Count the arguments passed after `--`.
function (input) {
  var args = (input && input.args) || [];
  return args.length;
}
```

The **first leading comment** (`// ...` or a leading `/* ... */`) becomes the
action's one-line description in `buch manifest`, so write it as a short,
imperative sentence.

Run it:

```sh
buch exec buch-authoring word-count -- a buch is a knowledge format
```

The `--` separates the action's own arguments from the CLI's. A function-valued
action receives a JSON object:

```json
{ "action": "word-count", "buch": "buch-authoring", "args": ["a", "buch", "is", "a", "knowledge", "format"] }
```

A static (non-function) action ignores the input and returns its value. The
result is rendered exactly like a `.kdb` value: strings verbatim, numbers without
a trailing `.0`, and objects/arrays as compact JSON with sorted keys.

## The sandbox

Actions and dynamic values share one hardened sandbox, rebuilt from scratch for
every execution. Nothing survives between runs.

**Absent by design** — none of these exist inside a script:

- `require`, `module`, `exports` — no module loading.
- `process`, environment variables, CLI/process arguments.
- Filesystem and shell access.
- Network access.
- `eval` and the `Function` constructor (the `.constructor` escape is closed,
  including async and generator prototypes).
- `Date` and `Math.random` in deterministic mode.
- `global`, `globalThis` — the global is a fresh, frozen object.

**Present** — only an allowlist:

- `JSON`
- `Math` (without `Math.random` in deterministic mode)
- String and array primitives (`"x".toUpperCase()`, `[1].map(...)`, …)
- The constants `undefined`, `NaN`, `Infinity`

## The JSON boundary

The Go host and the script never share objects. Input is marshalled to JSON and
parsed inside the script; output is `JSON.stringify`-ed and decoded by the host.
A returned value must be a string, number, boolean, `null`, or a flat
JSON-serialisable object/array. **Functions are rejected**, including nested
ones.

## Limits

| Limit                    | Dynamic values (`.kdb`) | Actions   |
|--------------------------|-------------------------|-----------|
| Wall clock               | ~500 ms                 | ~2 s      |
| Script source            | ~64 KB                  | ~64 KB    |
| Rendered/returned output | ~256 KB                 | ~256 KB   |

Exceeding a limit is a classified error, not a crash. There is **no JavaScript
heap limit** in the embedded engine: memory safety is enforced on the CLI side
(bounded input, bounded output, one fresh runtime per execution). Run untrusted
content only behind an outer process memory limit (container/cgroup, `ulimit`,
or a soft `GOMEMLIMIT`).

## Trust model: internal vs. external

Actions are gated by a trust right **separate** from key rendering. A library may
be allowed to render keys but forbidden to run actions, or vice versa.

- **Internal — auto-trusted**: the global library (`~/.buch`), a project-local
  library, and every `path` library (referenced by an absolute filesystem path).
- **External — untrusted until granted**: every `git` remote.

Trust is keyed by the canonical repository and lives only in the global
`config.json`. It is **never adopted from a remote library** — a library cannot
grant itself trust.

```sh
buch trust                                       # list entries
buch trust github.com/LukasLow/buch-lib          # grant keys + actions
buch trust github.com/LukasLow/buch-lib --actions # grant only actions
buch trust github.com/LukasLow/buch-lib --revoke  # revoke both
```

When actions trust is missing, `buch exec` refuses to compile or run anything. On
a terminal it offers a minimal yes/no prompt; in a non-interactive context it
fails. This means a public library can ship actions that readers may inspect
first and enable deliberately.

## Writing good actions

- Keep each action small and single-purpose; a buch is documentation, not an
  application.
- Return a value rather than printing; the host formats it deterministically.
- Handle missing or malformed arguments defensively, as `word-count` does.
- Document the action's arguments and expected output in the page that mentions
  it.
- Prefer a static value only when the action has no arguments; use a function
  when you need `input.args`.
- Never rely on wall-clock time, randomness or the environment; treat the
  sandbox as pure.

## Validating actions

`buch validate` checks the action files it discovers: duplicate names, missing
files and JavaScript syntax errors are reported without executing anything. Add
it to CI so a broken action is caught at review time rather than by a reader.

```sh
buch validate buch-authoring
buch manifest buch-authoring     # lists each action with its description
```
