# async / await

> **Open question:** the official stability page calls `async` and `await`
> keywords, but they are **omitted from the keywords reference entirely** —
> they appear in neither the *Keywords* tables nor the *Conventions* section
> (<https://mojolang.org/docs/reference/keywords/>, fetched 2026-09-15). The
> same stability page then says to "consider them unstable":
> "Mojo's async system isn't fully built out. So although the `async` and
> `await` keywords aren't prefixed, consider them unstable as well. Any async
> behavior may be subject to change."
> (<https://mojolang.org/docs/api-docs/stability/>). The v1.0.0 release notes
> also refer to syntax "between the `async` and `def` keywords", and the
> official roadmap lists "First-class `async` support" as **not started**
> (<https://mojolang.org/docs/roadmap/>). Because the keyword list is silent
> and the feature is explicitly unstable, this page does **not** present
> `async`/`await` as ordinary reserved keywords. A future release that adds
> them to the keyword list (or removes the word "keyword") resolves this
> inconsistency.

## What the official pages actually say

Three official pages are relevant, and they do not agree:

| Page | What it says about `async`/`await` |
|------|-------------------------------------|
| Stability guarantees | "the `async` and `await` keywords aren't prefixed, consider them unstable as well" |
| Keywords reference | nothing — no `async`/`await` section at all |
| Roadmap | "First-class `async` support: Fully integrated with Mojo's type and memory models." marked ⬜ (not started) |

Sources: <https://mojolang.org/docs/api-docs/stability/>,
<https://mojolang.org/docs/reference/keywords/>,
<https://mojolang.org/docs/roadmap/>.

The instability statement in full:

> Mojo's async system isn't fully built out. So although the `async` and
> `await` keywords aren't prefixed, consider them unstable as well. Any async
> behavior may be subject to change.

Source: <https://mojolang.org/docs/api-docs/stability/>.

## Async is listed as a non-goal today

The closures documentation states the current limitation twice, once in prose
and once in the reference:

> Mojo doesn't yet support async execution or escaping closures (closures that
> outlive their enclosing scope).

Source: <https://mojolang.org/docs/manual/functions/closures/>.

> A closure is created when its enclosing `def` runs and exists only for the
> lifetime of that enclosing scope. Mojo doesn't support escaping closures or
> async execution.

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

And the roadmap places full async support in a future phase:

> ⬜ **First-class `async` support**: Fully integrated with Mojo's type and
> memory models.

Source: <https://mojolang.org/docs/roadmap/>.

The roadmap also warns that its status markers "might be out of date" — which is
itself a reason to re-check this page on every release.

## The `async def` syntax the release notes mention

The 1.0.0 release notes list, among the newline rejections, this one:

> - Between the `async` and `def` keywords on function definitions.

Source: <https://mojolang.org/releases/v1.0.0/>.

That is the strongest official hint that `async` precedes `def` in some
grammar. It is a statement about the *parser*, not a stability promise, and the
same release notes do not document an `async`/`await` language feature.

## The double-underscore rule does not apply

The stability page draws a clear line between `__`-prefixed internals and
`async`/`await`:

> unlike standard library APIs, these language features *can't be marked* as
> stable or unstable and the compiler won't warn when you use them
> (`--warn-on-unstable-apis`).

For `async`/`await`, the page instead says explicitly that they *are* unstable.
The practical consequence: `--warn-on-unstable-apis` does not flag them (they
aren't stdlib APIs), and there is no compiler warning to catch misuse.

## What this book does

Because the official documentation does not currently describe `async`/`await`
as a usable, stable language feature, this book:

- files them under `keyword-conventions/` rather than `keywords/`, because they
  are absent from the official keyword tables;
- teaches **no** `async`/`await` syntax, since there is no stable official
  syntax to teach;
- records the inconsistency here and re-checks it on every release.

For the current asynchronous-execution surface, see
[async and parallelism](../concurrency/async-and-parallelism.md). For the related
"async" work on the roadmap, see [`intro/roadmap`](../intro/roadmap.md), which
links the official roadmap page.

## Pitfalls

- **Assuming `async`/`await` are stable keywords.** The stability page says the
  opposite. Source: <https://mojolang.org/docs/api-docs/stability/>.
- **Looking them up in the keyword reference.** They are not there, so the
  reserved-word list cannot be used to reason about them. Source:
  <https://mojolang.org/docs/reference/keywords/>.
- **Expecting `--warn-on-unstable-apis` to flag them.** It covers unstable
  stdlib APIs, not language features. Source:
  <https://mojolang.org/docs/api-docs/stability/>.
- **Building on async closures.** Mojo "doesn't support escaping closures or
  async execution" today. Sources:
  <https://mojolang.org/docs/manual/functions/closures/>,
  <https://mojolang.org/docs/reference/closure-declarations/>.
- **Trusting the roadmap markers as current.** The roadmap itself says its
  status "might be out of date". Source:
  <https://mojolang.org/docs/roadmap/>.

## Sources

- Mojo stability guarantees (the `async`/`await` instability statement):
  <https://mojolang.org/docs/api-docs/stability/>
- Mojo identifiers, keywords, and conventions reference (`async`/`await` are
  absent): <https://mojolang.org/docs/reference/keywords/>
- Mojo roadmap (first-class async support is not started):
  <https://mojolang.org/docs/roadmap/>
- Mojo v1.0.0 release notes (`async`/`def` newline rule):
  <https://mojolang.org/releases/v1.0.0/>
- Closures (manual): <https://mojolang.org/docs/manual/functions/closures/>
- Mojo closure declarations reference:
  <https://mojolang.org/docs/reference/closure-declarations/>
