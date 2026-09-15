# elif

`elif` adds another condition to an `if` chain. It is only meaningful as part of
an `if` statement (or a `comptime if`), where it forms one link between the
initial `if` and the final `else`.

## Purpose

The official keywords reference defines `elif` in one line:

> `elif` — Additional condition in an `if` chain

Source: <https://mojolang.org/docs/reference/keywords/>.

## Syntax

```text
if condition:
    body
elif condition:
    body
elif condition:
    body
else:
    body
```

Any number of `elif` clauses may follow the `if`. Each `elif` has the same
shape as the `if`: a condition, a colon, and an indented body. The chain ends
with an optional `else`. Source:
<https://mojolang.org/docs/reference/compound-statements/>.

```mojo
var temp_celsius = 25
if temp_celsius <= 0:
    print("It is freezing.")
elif temp_celsius < 20:
    print("It is cool.")
elif temp_celsius < 30:
    print("It is warm.")
else:
    print("It is hot.")
```

```output
It is warm.
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

## Evaluation order

`elif` clauses are tested strictly top to bottom:

> Conditions are evaluated in order. Add as many as needed. The first true
> condition runs its block, and the statement exits. The `else` block runs if no
> condition is true.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

The manual repeats the same rule for `elif` specifically:

> The conditions are tested in the order given. When a condition evaluates to
> `True`, the associated code block is executed and no further conditions are
> tested.

Source: <https://mojolang.org/docs/manual/control-flow/>.

This matters for correctness when conditions overlap. `temp_celsius < 30` would
also be true for `-5`, so ordering the more specific conditions first is what
makes the chain behave as intended.

## `elif` inside `comptime if`

`comptime if` "supports `elif` and `else` like the regular `if` statement".
Source: <https://mojolang.org/docs/reference/compound-statements/>.

```mojo
from std.sys import CompilationTarget

def compute():
    comptime if CompilationTarget.has_avx512f():
        print("AVX-512 path")
    elif CompilationTarget.is_apple_silicon():
        print("Apple Silicon path")
    else:
        print("generic path")
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

Here each `elif` condition is evaluated at compile time, and the branches that
are not selected are not compiled.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `if` | Starts the chain; at least one `if` is required before any `elif`. |
| `else` | Optional final clause; runs only when the `if` and every `elif` were false. |
| `comptime` | `comptime if … elif …` makes each link a compile-time decision. |
| `and`, `or`, `not` | Compose each `elif` condition. |

`elif` must be attached to an `if`. A chain cannot begin with `elif`, and
`elif` cannot follow an `else`.

## Signature vs. body

Like `if`, `elif` never appears in a signature. It is a statement clause inside
a function or method body (or a compile-time branch at module scope, as shown
above). Each `elif` body creates its own scope, so variables declared inside one
branch do not leak into the next.

## Pitfalls

- **`elif` without an `if` is a syntax error.** The first branch of a chain is
  always `if`.
- **Reversed `elif`/`else` order is a syntax error.** `else` is last; nothing may
  follow it in the chain.
- **Overlapping conditions hide later branches.** Because the first true
  condition wins and the statement exits, an overly broad early `elif` can make
  a later one permanently unreachable. Order conditions from most specific to
  most general.
- **`else if` is not Mojo.** The spelling is the single token `elif`; `else if`
  is parsed as an `else` with a nested `if` and changes the semantics (the inner
  `if` becomes its own statement inside the `else` body).
- **Each `elif` needs a body.** Use `pass` for an intentionally empty branch.
- **An `elif` condition must be `Boolable`.** A value without a boolean
  interpretation cannot be a condition; see [`if`](if.md) for truthiness rules.
- **Indentation must match.** The first body statement of each branch fixes the
  indentation for that branch; mixing indentation between branches produces a
  syntax error.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md) stub, and [`index`](index.md).
Related pages: [`if`](if.md), [`else`](else.md), [`comptime`](comptime.md),
[`control-flow`](../basics/control-flow.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Compilation feature toggles (tools):
  <https://mojolang.org/docs/tools/feature-toggles/>
