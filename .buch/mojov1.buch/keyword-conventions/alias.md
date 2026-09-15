# alias

> **Open question:** `alias` is used pervasively throughout Mojo code and
> documentation, yet it does **not** appear anywhere on the official keywords
> reference. The page has an *Identifiers* section, a *Keywords* section
> (control flow, error handling, declarations, keyword operators, imports,
> compile-time, literal keywords, case sensitivity) and a *Conventions*
> section — there is **no `alias` section anywhere**
> (<https://mojolang.org/docs/reference/keywords/>, fetched 2026-09-15). In the
> same documentation, `comptime` is the spelling recommended for compile-time
> constants, and the 1.0.0 migration table lists `alias` → `comptime` with
> status `DEPRECATED`, while the v0.26.1 notes say the compiler warns on `alias`
> and suggests `comptime`. Because the official keyword list is silent, this
> page does **not** present `alias` as a reserved keyword. Treat it as a legacy
> spelling of `comptime` that still compiles; verify against the next upstream
> release before relying on it.

## What `alias` is

`alias` names a compile-time value or type. It is the older spelling of the
current `comptime` keyword:

> Mojo now supports the `comptime` keyword as a synonym for `alias`. The
> `comptime` keyword can be used interchangeably with `alias` for compile-time
> declarations. Both keywords are fully supported and produce identical
> behavior.

```mojo
comptime x = 5      # New preferred syntax
alias y = 10        # Still fully supported
comptime MyType[T: AnyType] = T  # Works with parametric declarations
```

Source: <https://mojolang.org/releases/v0.25.7/>.

So an `alias` binding and a `comptime` binding mean the same thing; they differ
only in spelling.

## Status in 1.x: deprecated in favour of `comptime`

The 1.0.0 release notes list the rename:

| OLD (pre-1.0) | NEW (1.x) | STATUS |
|---------------|-----------|--------|
| `alias` | `comptime` | `DEPRECATED` |

> The compiler warns on `alias` and suggests `comptime`.

Source: <https://mojolang.org/releases/v0.26.1/>. The full rename table is in
[`versions/1.0.0`](../versions/1.0.0.md).

Write `comptime` in new code. The official docs use `comptime` throughout
(the keyword page, the variables page, the reference pages), which is why this
book teaches `comptime` and files `alias` here.

## Why the classification is genuinely ambiguous

Two official statements point in opposite directions, which is why this page
carries an open question rather than a verdict:

- The release notes treat `alias` as a language keyword: v0.25.7 calls it a
  keyword and says `comptime` is a *synonym*; v0.26.1 says the compiler emits a
  warning on "the use of `alias` keyword"; the 1.0.0 notes accept `where`
  clause messages on `alias`/`comptime` declarations.
- The keywords reference — the page whose entire job is to list the reserved
  words — never mentions `alias` at all.

The book mirrors the gap instead of resolving it. If upstream later adds
`alias` to the keyword list (or removes it entirely), this page moves and the
change is recorded in the relevant `versions/` page.

## What to write instead

Use `comptime` for every compile-time name:

```mojo
comptime rows = 512
comptime SIZE = 1024 // 32
comptime Vec3 = List[Float64]

def main():
    var position: Vec3 = [0.0, 0.0, 0.0]
    print(SIZE)     # 32
```

The rules for compile-time values — evaluation timing, parameterization,
reflection — are the `comptime` rules, not a separate `alias` feature. See
[`keywords/index`](../keywords/index.md) for how `comptime` is filed as a true
keyword.

## Pitfalls

- **Assuming `alias` is a current, documented keyword.** The official keyword
  reference does not list it. Source:
  <https://mojolang.org/docs/reference/keywords/>.
- **Ignoring the deprecation warning.** `alias` still compiles in 1.0.0 but is
  slated for removal; migrate to `comptime`. Sources:
  <https://mojolang.org/releases/v0.26.1/>,
  <https://mojolang.org/releases/v1.0.0/>.
- **Mixing the two spellings for the same concept in one codebase.** They are
  synonyms today, but the idiomatic form is `comptime`; using both invites
  churn when `alias` is removed.
- **Treating `alias` as reserved.** Because it is absent from the keyword list,
  there is no official statement that it cannot be an identifier. Marked as an
  open question above rather than asserted.

## Sources

- Mojo identifiers, keywords, and conventions reference (the official keyword
  list — `alias` is absent): <https://mojolang.org/docs/reference/keywords/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo v0.25.7 release notes (`comptime` introduced as a synonym for `alias`):
  <https://mojolang.org/releases/v0.25.7/>
- Mojo v0.26.1 release notes (compiler warns on `alias`):
  <https://mojolang.org/releases/v0.26.1/>
- Mojo v1.0.0 release notes (`alias` → `comptime`, `DEPRECATED`):
  <https://mojolang.org/releases/v1.0.0/>
