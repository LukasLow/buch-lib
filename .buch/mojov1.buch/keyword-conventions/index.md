# Conventions: words that look like keywords but are not

`imm`, `mut`, `out`, `deinit`, `raises`, `where`, `alias` and `async`/`await`
appear all over Mojo code, and new readers routinely mistake them for reserved
keywords. They are **not reserved words**. Each of them has meaning in Mojo
*only in a particular syntactic position* — an argument declaration, a
function-declaration effect, a constraint clause, or a binding. Everywhere
else they are ordinary identifiers.

This chapter documents exactly that class of word. For the words that *are*
reserved, see [`keywords/index`](../keywords/index.md).

## The official distinction

The official reference defines a keyword and a convention and keeps them
strictly apart:

> *Keywords* are reserved words with fixed meaning. They cannot be used as
> ordinary identifiers (use an escaped identifier if you need to).

> *Conventions* tell the compiler how values are passed and how bindings are
> created.

Source: <https://mojolang.org/docs/reference/keywords/>.

The reference groups its own content into three sections — *Identifiers*,
*Keywords* and *Conventions* — and `imm`, `mut`, `out`, `deinit`, `var` and
`ref` live in the *Conventions* section, not in the keyword tables. `raises`
and `where` are described at the end of that same *Conventions* section.

| Term | Reserved? | Where it has fixed meaning | Examples |
|------|-----------|----------------------------|----------|
| Keyword | Yes | Everywhere — it cannot be an ordinary identifier | `def`, `if`, `var`, `struct` |
| Convention | **No** | Only in a signature or a binding | `imm`, `mut`, `out`, `deinit`, `var`, `ref` |
| Declaration word | **No** | Only inside a declaration | `raises`, `where` |
| Stdlib/builtin name | No | Never — it is just a name | `List`, `SIMD`, `Int` |

## Why Python code using these names still works

This is the sentence that resolves the whole confusion. The official reference
states it plainly:

> Convention names aren't reserved, so existing Python code that uses these
> names won't break, but in Mojo signatures they have fixed meaning.

Source: <https://mojolang.org/docs/reference/keywords/>.

The practical consequence: a Python module that happens to use `out`, `imm`,
`deinit` or `where` as a variable name translates without renaming. Mojo does
not reserve the word, so the name remains available for ordinary use:

```mojo
def main():
    var imm = 1        # `imm` as an ordinary variable name
    var mut = 2        # ... as are `mut` and `out`
    var out = 3
    print(imm + mut + out)  # 6
```

The word only changes meaning when the parser is looking for a convention — at
the start of an argument declaration, in a capture list, or where a declaration
clause is expected.

> **Open question:** the official sentence guarantees that "existing Python code
> that uses these names won't break", which implies these words stay valid
> identifiers in ordinary positions, but the reference does not spell out every
> position individually. If a future release reserves one of them, this chapter
> and the `versions/` page for that release change with it.

## The official argument-convention table

The reference lists six argument conventions. `imm` is written in parentheses
in the official table because it is the convention applied when no convention
is written at all:

| Convention | Role | Meaning |
|------------|------|---------|
| (`imm`) | Argument | Immutable reference to an existing value (default behavior) |
| `mut` | Argument | Mutable reference to an existing value |
| `out` | Argument | Returns a value without a return arrow |
| `deinit` | Argument | Destructive transfer; end of a value's lifecycle |
| `var` | Argument or variable | Independent mutable owned copy of the value |
| `ref` | Argument or variable | Reference that doesn't own the value |

Source: <https://mojolang.org/docs/reference/keywords/>.

An argument convention "appears before the argument name" and controls how the
argument value passes to the function. Source:
<https://mojolang.org/docs/reference/function-declarations/>.

## `var` and `ref` also appear in variable declarations

Two words on that table do double duty. The official reference says so
directly:

> `var` and `ref` also appear in **variable declarations**, where `var`
> creates a scoped mutable variable and `ref` creates a scoped reference
> binding:

```mojo
var count = 0          # var creates a scoped mutable variable
var data = [1, 2, 3]
ref view = data        # ref binds a reference, no copying
```

Source: <https://mojolang.org/docs/reference/keywords/>.

So `var` and `ref` are special in one more way: they are *also* reserved
keywords in the keyword tables ([`keywords/index`](../keywords/index.md)), while
`imm`, `mut`, `out` and `deinit` are not. When `var` or `ref` binds a variable
they behave as keywords; when they annotate a function argument they behave as
conventions. The keyword pages [`keywords/var`](../keywords/var.md) and
[`keywords/ref`](../keywords/ref.md) cover one side; the planned convention pages
`keyword-conventions/var.md` / `keyword-conventions/ref.md` are not written yet.

## `raises` and `where` have fixed meaning in declarations

The same *Conventions* section ends with two words that are not argument
conventions:

> `raises` and `where` also have fixed meaning in declarations. `raises`
> declares that a function can raise errors. `where` introduces a constraint
> clause at the end of a declaration:

Source: <https://mojolang.org/docs/reference/keywords/>.

Neither word appears in the keyword tables. [`raises`](raises.md) is an effect
that sits between the argument list and the return type of a function
declaration; [`where`](where.md) is a trailing constraint clause.

## The pages in this chapter

| Word | Fixed meaning | Page |
|------|---------------|------|
| `imm` | Immutable-reference argument convention (the default); replaced the older `read` spelling | [`imm`](imm.md) |
| `mut` | Mutable-reference argument convention | [`mut`](mut.md) |
| `out` | Argument that returns a value without a return arrow (named result) | [`out`](out.md) |
| `deinit` | Destructive-transfer argument convention; end of a value's lifecycle | [`deinit`](deinit.md) |
| `raises` | Declares that a function can raise errors | [`raises`](raises.md) |
| `where` | Introduces a constraint clause at the end of a declaration | [`where`](where.md) |
| `alias` | Documented gap: used pervasively, absent from the official keyword list | [`alias`](alias.md) |
| `async` / `await` | Documented gap: called keywords on the stability page, absent from the keywords reference, marked unstable | [`async-await`](async-await.md) |

## The two documented documentation gaps

The last two rows are not ordinary convention pages. Upstream documentation is
internally inconsistent about them:

- **`alias`** is used pervasively in Mojo code and appears in official release
  notes, yet it is **not on the official keyword list** and the compiler warns
  on it in favour of `comptime`. See [`alias`](alias.md).
- **`async` / `await`** are called "keywords" on the official stability page but
  are **absent from the keywords reference entirely**, and the same page marks
  them unstable. See [`async-await`](async-await.md).

Both pages lead with an open-question marker rather than inventing a
classification. That is the rule for this chapter: a documented gap is recorded
as a gap, never smoothed over.

## Do not confuse conventions with builtins

`parallelize`, `vectorize`, `unroll`, `SIMD`, `Int`, `List` and `Dict` are also
frequently mistaken for language words. They are ordinary names from the
standard library or the prelude, with no syntactic status at all; a variable
may legally shadow them. See [`keywords/index`](../keywords/index.md) for that
third category.

## Sources

- Mojo identifiers, keywords, and conventions reference (the authoritative
  keyword and convention split): <https://mojolang.org/docs/reference/keywords/>
- Mojo function declarations reference (argument conventions, effects,
  markers): <https://mojolang.org/docs/reference/function-declarations/>
- Mojo stability guarantees (unstable decorators and `async`/`await`):
  <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes (`read` → `imm`, closure changes):
  <https://mojolang.org/releases/v1.0.0/>
- Mojo v0.26.1 release notes (the compiler warns on `alias`):
  <https://mojolang.org/releases/v0.26.1/>
