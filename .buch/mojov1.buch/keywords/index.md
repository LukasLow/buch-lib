# Mojo 1.x keywords

A complete map of Mojo's reserved words, plus the near-misses that are *not*
reserved words. It separates three things that look alike but behave
differently: **keywords** (reserved), **conventions** (fixed meaning, *not*
reserved) and **stdlib/builtin names** (ordinary names from the standard
library).

**Pages written so far:** all 34 true keyword pages exist — the 33 documented
here plus [`def`](def.md) — along with the deprecated [`fn`](fn.md) stub. The
convention pages also exist for [`imm`](../keyword-conventions/imm.md),
[`mut`](../keyword-conventions/mut.md), [`out`](../keyword-conventions/out.md),
[`deinit`](../keyword-conventions/deinit.md),
[`raises`](../keyword-conventions/raises.md),
[`where`](../keyword-conventions/where.md),
[`alias`](../keyword-conventions/alias.md) and
[`async`/`await`](../keyword-conventions/async-await.md). Only
`keyword-conventions/var.md` and `keyword-conventions/ref.md` remain unwritten
and stay plain code spans below. Every row in the tables below is linked when its
page exists.

## What a keyword is

The official definition, quoted:

> *Keywords* are reserved words with fixed meaning. They cannot be used as
> ordinary identifiers (use an escaped identifier if you need to).

Source: <https://mojolang.org/docs/reference/keywords/>.

Three terms matter here and must not be conflated:

| Term | Reserved? | What it is | Example |
|------|-----------|------------|---------|
| Keyword | Yes | A word the language reserves with fixed meaning. | `def`, `if`, `var` |
| Convention | **No** | A word with fixed meaning *only in signatures/bindings*. | `imm`, `mut`, `out` |
| Stdlib/builtin name | No | An ordinary name from the standard library or prelude. | `List`, `SIMD`, `Int` |

The distinction is stated plainly by the official reference:

> Convention names aren't reserved, so existing Python code that uses these
> names won't break, but in Mojo signatures they have fixed meaning.

Source: <https://mojolang.org/docs/reference/keywords/>.

So `imm`, `mut`, `out`, `deinit`, `raises` and `where` are **not keywords**.
They are context-sensitive tokens. `var` and `ref` are special: they appear in
**both** tables — as reserved keywords in a declaration, and as argument
conventions in a signature.

Keywords are also **case-sensitive**:

> All keywords are case-sensitive: `True` is a keyword; `true` is not. `None`
> is a keyword; `none` is not. `Self` is a keyword; `self` is a conventional
> argument name, not a keyword.

Source: <https://mojolang.org/docs/reference/keywords/>.

## The 34 true keywords

The official reference groups its keyword tables into seven sections. The
tables below mirror that grouping exactly. **The page itself does not state a
number** — the count of 34 is derived by enumerating every row on the page
(10 + 5 + 6 + 5 + 3 + 1 + 4 = 34). Treat it as "the words in this page's
tables", not as a claim about every word Mojo reserves.

### Control flow (10)

These keywords control which code runs and in what order.

| KEYWORD | PURPOSE | PAGE |
|---------|---------|------|
| `if` | Conditional execution | [`if`](if.md) |
| `elif` | Additional condition in an `if` chain | [`elif`](elif.md) |
| `else` | Default branch in conditionals or loops | [`else`](else.md) |
| `for` | Iteration loop | [`for`](for.md) |
| `while` | Conditional loop | [`while`](while.md) |
| `break` | Exits the innermost loop | [`break`](break.md) |
| `continue` | Skips to the next loop iteration | [`continue`](continue.md) |
| `pass` | No-op placeholder statement | [`pass`](pass.md) |
| `return` | Returns from a function | [`return`](return.md) |
| `with` | Context manager statement | [`with`](with.md) |

### Error handling (5)

These keywords structure error propagation and recovery.

| KEYWORD | PURPOSE | PAGE |
|---------|---------|------|
| `try` | Begins an error-handling block | [`try`](try.md) |
| `except` | Error handler clause | [`except`](except.md) |
| `finally` | Always-execute clause in a `try` block | [`finally`](finally.md) |
| `raise` | Raises an error | [`raise`](raise.md) |
| `assert` | Aborts if a condition is false (gated by `-D ASSERT`) | [`assert`](assert.md) |

### Declarations (6)

These keywords introduce functions, types, and bindings.

| KEYWORD | PURPOSE | PAGE |
|---------|---------|------|
| `def` | Function declaration | [`def`](def.md) |
| `lambda` | Anonymous single-expression function | [`lambda`](lambda.md) |
| `struct` | Struct type declaration | [`struct`](struct.md) |
| `trait` | Trait declaration | [`trait`](trait.md) |
| `var` | Scoped variable binding | [`var`](var.md) |
| `ref` | Scoped reference binding | [`ref`](ref.md) |

### Keyword operators (5)

Five operators are spelled as words rather than symbols. Symbolic operators
(`+`, `-`, `*`, `^`, `//`, etc.) are punctuation, not keywords.

| KEYWORD | PURPOSE | PAGE |
|---------|---------|------|
| `and` | Logical AND | [`and`](and.md) |
| `or` | Logical OR | [`or`](or.md) |
| `not` | Logical NOT | [`not`](not.md) |
| `in` | Membership test | [`in`](in.md) |
| `is` | Identity test | [`is`](is.md) |

### Imports (3)

These keywords control module imports.

| KEYWORD | PURPOSE | PAGE |
|---------|---------|------|
| `import` | Imports a module | [`import`](import.md) |
| `from` | Selective import from a module | [`from`](from.md) |
| `as` | Aliasing in imports and `except` clauses | [`as`](as.md) |

### Compile-time (1)

| KEYWORD | PURPOSE | PAGE |
|---------|---------|------|
| `comptime` | Forces compile-time evaluation | [`comptime`](comptime.md) |

### Literal keywords (4)

These keywords are also literals. They produce a value directly.

| KEYWORD | PURPOSE | PAGE |
|---------|---------|------|
| `True` | Boolean true | [`True`](true.md) |
| `False` | Boolean false | [`False`](false.md) |
| `None` | Absence of a value (`NoneType`) | [`None`](none.md) |
| `Self` | The enclosing type | [`Self`](self.md) |

## Non-keywords: conventions

These words have **fixed meaning in Mojo code but are not reserved**. The
official reference lists them in its *Conventions* section, separate from the
keyword tables:

| CONVENTION | ROLE | MEANING | PAGE |
|------------|------|---------|------|
| `imm` | Argument | Immutable reference to an existing value (default behavior) | [`imm`](../keyword-conventions/imm.md) |
| `mut` | Argument | Mutable reference to an existing value | [`mut`](../keyword-conventions/mut.md) |
| `out` | Argument | Returns a value without a return arrow | [`out`](../keyword-conventions/out.md) |
| `deinit` | Argument | Destructive transfer; end of a value's lifecycle | [`deinit`](../keyword-conventions/deinit.md) |
| `var` | Argument or variable | Independent mutable owned copy of the value | `keyword-conventions/var.md` *(planned)* |
| `ref` | Argument or variable | Reference that doesn't own the value | `keyword-conventions/ref.md` *(planned)* |

Two declaration words are also **not keywords** but have fixed meaning in
declarations: `raises` ("declares that a function can raise errors") and
`where` ("introduces a constraint clause at the end of a declaration"), both
documented in [`raises`](../keyword-conventions/raises.md) and
[`where`](../keyword-conventions/where.md).

`var` and `ref` are the two words that live on both sides of the line: they are
reserved keywords in a *declaration* and conventions in a *signature*. Use the
[`def`](def.md) page for the signature behaviour and `keyword-conventions/var.md`
(planned) / `keyword-conventions/ref.md` (planned) for the convention
behaviour.

## Non-keywords: stdlib and builtin names

These are **ordinary names from the standard library or the prelude**, not
language keywords. They are never reserved and can be shadowed:

| NAME | WHAT IT IS |
|------|------------|
| `parallelize` | Standard-library parallel execution helper. |
| `vectorize` | Standard-library SIMD/vectorization helper. |
| `unroll` | Standard-library loop-unrolling helper. |
| `SIMD` | The built-in vector type; numeric types alias it. |
| `Int` | The general signed integer type (an alias for `Scalar[DType.int]`). |
| `List` | The dynamically sized collection type. |
| `Dict` | The key-value collection type. |

Source: <https://mojolang.org/docs/std/>.

Do not file any of these under "reserved words". A variable or function may
legally be named `SIMD`, `Int` or `List`; doing so shadows the standard-library
name and is almost always a mistake, but the compiler does not reserve it.

## Escaped identifiers: using a keyword as a name

Because keywords cannot be ordinary identifiers, Mojo provides *escaped
identifiers*. The official definition:

> An *escaped identifier* is enclosed in backticks. Backticks allow any
> characters except vertical whitespace and backticks themselves:

```mojo
`struct`        # Use a keyword as a name
`日本語の変数`    # Non-ASCII identifier
`my value`      # Spaces in a name
```

> Escaped identifiers are useful when calling into external code that uses a
> Mojo keyword as a name, or when writing identifiers in natural language.
> Empty backtick identifiers are not allowed.

Source: <https://mojolang.org/docs/reference/keywords/>.

Function declarations accept an escaped identifier as the function name:

```mojo
def `import`():
    print("In `import`")

def main():
    `import`()
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

This is a workaround, not a style. Prefer a normal name whenever the language
lets you choose one.

## Open questions

> **Open question:** `alias` is used pervasively in Mojo code and documentation,
> yet it does **not** appear anywhere on the official keywords reference — the
> page has *Identifiers*, *Keywords* and *Conventions* sections, and no `alias`
> section. Mojo's own current vocabulary for a compile-time constant is
> `comptime`, so `alias` is documented here under
> [`keyword-conventions/alias.md`](../keyword-conventions/alias.md) and **not**
> presented as a reserved keyword. Verify against the next upstream release
> before treating `alias` as reserved.

> **Open question:** the official stability page calls `async` and `await`
> "keywords", but they are **omitted from the keywords reference entirely**
> (they appear in neither the *Keywords* nor the *Conventions* section), and the
> same stability page says to "consider them unstable". Do not treat them as
> stable language features. They are documented under
> [`keyword-conventions/async-await.md`](../keyword-conventions/async-await.md),
> with the inconsistency recorded. A future release that adds them to the
> keyword list (or removes the word "keyword") resolves this.

## Sources

- Mojo identifiers, keywords, and conventions reference (the authoritative
  keyword and convention tables): <https://mojolang.org/docs/reference/keywords/>
- Mojo function declarations reference (escaped identifiers, signature
  clauses): <https://mojolang.org/docs/reference/function-declarations/>
- Mojo standard library: <https://mojolang.org/docs/std/>
- Mojo stability guarantees (`async`/`await` unstable): <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
