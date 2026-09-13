# Dynamic values

A page can embed a value that lives in a JavaScript module instead of hardcoding
it. The mechanism is deliberately small: a `.kdb/**/*.js` module defines a
**key**, and a page references that key with the placeholder syntax
`%%key%%` (a key surrounded by doubled percent signs).

Dots in a key are **path separators**, not part of a filename. A key is written
in a page surrounded by doubled percent signs; the table shows just the key name:

| Key name            | Module that backs it              |
|---------------------|-----------------------------------|
| `format-version`    | `.kdb/format-version.js`          |
| `company.support`   | `.kdb/company/support.js`         |
| `cli.binary-name`   | `.kdb/cli/binary-name.js`         |

So a page mentions the key `company.support` as `%%company.support%%` to read
`.kdb/company/support.js`. This page demonstrates both outcomes: a live value
(the format version here renders as `%%format-version%%`) and a literal token
that is shown verbatim (`%%company.support%%`). The
[next section](#the-placeholder-syntax) explains why the second cannot simply be
typed into the page.

## The placeholder syntax

A reference in a page is a key wrapped in doubled percent signs: `%%key%%`.
The renderer replaces every such reference with the key's value before you read
the page. That has one consequence for documentation: the literal text
`%%key%%` **cannot be typed directly into a page**, because the renderer would
try to resolve `key` and fail.

The supported way to show a placeholder literally is to back it with a module
that returns the token text. Replacement output is never scanned again, so the
returned `%%key%%` survives in the rendered page. This buch does exactly that:
the token above is produced by `.kdb/key.js` returning `"%%key%%"`.

## A module is an expression

A `.kdb` module is a JavaScript file whose completion value is the value. It is
usually a single expression:

```js
// .kdb/format-version.js — a static value
1;
```

The value may be a string, number, boolean, `null`, a flat object or an array:

```js
// .kdb/company/support.js
{ team: "platform", channel: "#help" };
```

A module may instead return a **function**. The function is invoked when the
page is rendered and receives the opt-in input (see below):

```js
// .kdb/build-date.js
function (input) { return input && input.date; }
```

## Deterministic by default

Rendering is **deterministic by default**. The sandbox has no `Date` and no
`Math.random`, and no input is passed in. The same commit therefore renders the
same page, byte for byte, which makes caching, diffing and review meaningful.

- Use static values (`1`, `"buch"`, `[1, 2]`) for anything that should never
  change on its own.
- Use a **function** only when the value must depend on something supplied at
  render time.

Time, environment and CLI arguments are available only through an **explicit
opt-in**. A page that resolves such a value is marked `dynamic` in
`buch manifest` and is documented as not reproducible. Prefer not to use it for
the bulk of your content.

## Path separators and scope

- Keys use forward-slash-free, dotted paths. A key must match
  `^[a-z0-9.-]+$` and must not contain `/`, `..` or an empty segment.
- Resolution is **same-buch only**. A page in `buch-a` can never resolve a key
  that belongs to `buch-b`, even if both have a `.kdb/` folder. This keeps one
  buch self-contained and makes removal safe.
- Only files discovered under the buch's own `.kdb/` are candidates; the file
  path is re-checked against the buch root, so traversal and symlink escapes are
  rejected.

To share a value across buchs, duplicate the small module or put the shared
source in a dependency and read it from there — do not reach across buchs in a
page.

## Escaping and errors

Errors never take down a whole render. A missing, malformed or failing key is
replaced by an **inline marker**; the rest of the page still renders. This buch
shows the marker using a helper module, so the literal text survives rendering:

```text
%%error-example%%
```

Its general shape is `%%marker-form%%`. A real failure also carries the source
location, for example `at .kdb/<key>.js:<line>:<col>`. A whole-page render only
fails when the result exceeds the output cap, or when the library is an
untrusted git remote and rendering was requested (see below).

Common causes, all reported inline:

- The key has no matching file (`kdb.missing`).
- The key is malformed, for example contains uppercase or `/`.
- The module has a syntax error or throws at run time.
- The returned value is a function, or is not JSON-serialisable.
- The script exceeds the time or output limit.

Run `buch validate` to catch missing and malformed references *before* a reader
hits them; it resolves every reference against the buch's own keys.

## Rendering and raw source

`buch read` renders placeholders by default. `--raw` prints the unreplaced
source, which is the right tool for diffing, debugging or grepping:

```sh
buch read buch-authoring/dynamic-values          # rendered
buch read buch-authoring/dynamic-values --raw    # source, with %%key%% intact
buch read buch-authoring --json                  # content plus resolved keys
```

For an **external git library**, key execution is gated by trust. If a page
contains placeholders and the library is untrusted, `buch read` fails loudly
instead of silently rendering; `--raw` always works. Internal libraries (global,
local and path) are auto-trusted. Grant or revoke key trust with:

```sh
buch trust github.com/LukasLow/buch-lib --kdb
buch trust github.com/LukasLow/buch-lib --revoke
```

## Limits

Each execution runs in a fresh sandbox with the same limits as actions, but a
tighter wall-clock budget (on the order of 500 ms) because rendering is expected
to be fast and pure. See [actions.md](actions.md) for the full sandbox and limit
table.
