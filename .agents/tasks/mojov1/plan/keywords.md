# Keywords and non-keyword conventions — Mojo 1.0.0

Source: https://mojolang.org/docs/reference/keywords/ (verified 2026-09-15). The authoritative page explicitly separates **Keywords** (reserved) from **Conventions** (not reserved). This file mirrors that split so the book never files a convention as a reserved word.

## (a) The 34 true keywords

Reserved words with fixed meaning; cannot be used as ordinary identifiers (use an escaped backtick identifier if needed). Source: https://mojolang.org/docs/reference/keywords/

| Keyword | Purpose (one line) | Page |
|---------|--------------------|------|
| `if` | Conditional execution | `keywords/if.md` |
| `elif` | Additional condition in an `if` chain | `keywords/elif.md` |
| `else` | Default branch in conditionals or loops | `keywords/else.md` |
| `for` | Iteration loop | `keywords/for.md` |
| `while` | Conditional loop | `keywords/while.md` |
| `break` | Exits the innermost loop | `keywords/break.md` |
| `continue` | Skips to the next loop iteration | `keywords/continue.md` |
| `pass` | No-op placeholder statement | `keywords/pass.md` |
| `return` | Returns from a function | `keywords/return.md` |
| `with` | Context manager statement | `keywords/with.md` |
| `try` | Begins an error-handling block | `keywords/try.md` |
| `except` | Error handler clause | `keywords/except.md` |
| `finally` | Always-execute clause in a `try` block | `keywords/finally.md` |
| `raise` | Raises an error | `keywords/raise.md` |
| `assert` | Aborts if a condition is false (gated by `-D ASSERT`) | `keywords/assert.md` |
| `def` | Function declaration | `keywords/def.md` |
| `lambda` | Anonymous single-expression function | `keywords/lambda.md` |
| `struct` | Struct type declaration | `keywords/struct.md` |
| `trait` | Trait declaration | `keywords/trait.md` |
| `var` | Scoped variable binding | `keywords/var.md` |
| `ref` | Scoped reference binding | `keywords/ref.md` |
| `and` | Logical AND | `keywords/and.md` |
| `or` | Logical OR | `keywords/or.md` |
| `not` | Logical NOT | `keywords/not.md` |
| `in` | Membership test | `keywords/in.md` |
| `is` | Identity test | `keywords/is.md` |
| `import` | Imports a module | `keywords/import.md` |
| `from` | Selective import from a module | `keywords/from.md` |
| `as` | Aliasing in imports and `except` clauses | `keywords/as.md` |
| `comptime` | Forces compile-time evaluation | `keywords/comptime.md` |
| `True` | Boolean true | `keywords/true.md` |
| `False` | Boolean false | `keywords/false.md` |
| `None` | Absence of a value (`NoneType`) | `keywords/none.md` |
| `Self` | The enclosing type | `keywords/self.md` |

Deprecated keyword page: `fn` — unified into `def` in 1.0 and deprecated. `keywords/fn.md` exists only as a stub pointing to `keywords/def.md` and `changes.md`; `fn` is NOT one of the 34 current keywords. Source: https://mojolang.org/releases/v1.0.0/

## (b) Non-keyword conventions (fixed meaning, not reserved)

Source: https://mojolang.org/docs/reference/keywords/ (Conventions section) unless noted. The reference states convention names are **not reserved**, so Python code using these names does not break; in Mojo signatures they nevertheless have fixed meaning.

| Convention | What it means | Page | Why it is not a keyword |
|------------|---------------|------|-------------------------|
| `imm` | Immutable reference to an existing value (the default argument behavior); replaced the older `read` spelling | `keyword-conventions/imm.md` | Not on the keyword list; fixed meaning in signatures only |
| `mut` | Mutable reference to an existing value | `keyword-conventions/mut.md` | Not on the keyword list; fixed meaning in signatures only |
| `out` | Argument that returns a value without a return arrow (cannot combine with `->`) | `keyword-conventions/out.md` | Not on the keyword list; only meaningful as an argument convention |
| `deinit` | Destructive transfer; marks the end of a value's lifecycle | `keyword-conventions/deinit.md` | Not on the keyword list; only meaningful as an argument convention |
| `raises` | Declares that a function can raise errors | `keyword-conventions/raises.md` | Not on the keyword list; fixed meaning in declarations |
| `where` | Introduces a constraint clause at the end of a declaration | `keyword-conventions/where.md` | Not on the keyword list; fixed meaning in declarations |
| `alias` | Compile-time name binding used pervasively in Mojo code | `keyword-conventions/alias.md` | Not on the official keyword list despite wide use — documentation gap, see below |
| `async` / `await` | Asynchronous execution spellings referenced on the stability page | `keyword-conventions/async-await.md` | Omitted from the keywords reference and marked UNSTABLE — see below |

Also non-keyword but frequently mistaken for keywords (stdlib/builtin, not language): `parallelize`, `vectorize`, `unroll`, `SIMD`, `Int`, `List`, `Dict`. Source: https://mojolang.org/docs/std/

## (c) Flagged documentation gaps

- **`alias`** — used pervasively throughout Mojo code and documentation, yet it does **not** appear on the official keyword list. The book must not present it as a reserved keyword; file it under `keyword-conventions/` and note the upstream gap. Source: https://mojolang.org/docs/reference/keywords/
- **`async` / `await`** — the stability page refers to them as keywords, but they are omitted from the keywords reference and are marked **UNSTABLE**. Do not present them as stable language features; document them as unstable conventions and flag the inconsistency. Source: https://mojolang.org/docs/api-docs/stability/ ; https://mojolang.org/docs/reference/keywords/

## (d) Legacy convention names and their replacements

| Legacy (deprecated) | Replacement |
|---------------------|-------------|
| `owned` | `var` |
| `borrowed` | `imm` (formerly `read`) |
| `inout` | `mut` |
| `read` | `imm` (1.0 preferred spelling; `read` still works, soon deprecated) |
| `fn` | `def` |
| `__del__` | `__deinit__` |

Sources: https://mojolang.org/docs/reference/keywords/ ; https://mojolang.org/releases/v1.0.0/
