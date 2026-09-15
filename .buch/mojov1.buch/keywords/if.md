# if

`if` executes a block of code conditionally. It is Mojo's conditional-execution
keyword, and it also supplies the `if`-`else` conditional *expression* (Mojo's
ternary operator).

## Purpose

The official keywords reference defines `if` in one line:

> `if` — Conditional execution

Source: <https://mojolang.org/docs/reference/keywords/>.

The compound-statements reference describes the shape of every `if` statement:

> A *compound statement* has a header and a body. The header ends with `:` and
> is followed by an indented block with the body.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

```mojo
def main():
    var temp_celsius = Float64(25)
    if temp_celsius > 20:
        print("It is warm.")
        print("The temperature is", temp_celsius * 9 / 5 + 32, "Fahrenheit.")
```

```output
It is warm.
The temperature is 77.0 Fahrenheit.
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

## Syntax

A complete `if` chain has one `if`, zero or more `elif` clauses, and an
optional `else` clause:

```text
if condition:
    body
elif condition:
    body
else:
    body
```

Only the `if` is required; `elif` and `else` are optional. The body must be
indented more than the header, and the first body statement sets the
indentation for the rest of the body:

```mojo
if condition:
    do_something()
      do_more()    # Error because statement has excess indentation
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

When the body is a single simple statement, it can share the header's line:

```mojo
if x > 0: print("positive")
```

The official reference notes this form is legal but "many style guides
discourage this". Source:
<https://mojolang.org/docs/reference/compound-statements/>.

The manual's full chain example:

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

## How the chain evaluates

> Conditions are evaluated in order. Add as many as needed. The first true
> condition runs its block, and the statement exits. The `else` block runs if no
> condition is true.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

This is the property that separates an `if`/`elif` chain from a series of
independent `if` statements: as soon as one condition is true, the whole
statement is finished and no later condition is tested. In the temperature
example above, `25` matches `temp_celsius < 30` and `elif`/`else` after it are
never evaluated.

## What a condition must be

A condition must be a value that has a boolean interpretation. Types that
conform to the `Boolable` trait have one, and the rule is stated in the
operators manual:

> Types that conform to `Boolable` have a truth value, so they can be used
> directly in boolean expressions and `if` conditions. The rules are
> predictable: zero, empty strings, empty collections, and `None` are falsy.
> Everything else is truthy.

Source: <https://mojolang.org/docs/manual/operators/>.

```mojo
from std.collections import List, Optional

def main():
    var name = "Mojo"
    if name:                       # non-empty String is truthy
        print("Name is set")

    var items: List[Int] = []
    if items:                      # empty collection is falsy
        print("has items")
    else:
        print("empty")

    var maybe: Optional[Int] = None
    if maybe is None:              # Optional + identity test
        print("no value")
```

`Optional` also evaluates as a boolean directly: "An `Optional` evaluates as
`True` when it holds a value, `False` otherwise." Source:
<https://mojolang.org/docs/manual/types/>.

## `if` as an expression: the conditional (ternary) operator

Mojo has no `? :` operator. The conditional expression puts the condition in
the middle:

```mojo
var temp_celsius = 15
var forecast = "warm" if temp_celsius > 20 else "cool"
print("The forecast for today is", forecast)
```

```output
The forecast for today is cool
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

The expression reference gives the general form:

> The `if`-`else` expression selects between two values based on a condition.
> ... The condition follows `if`, and the alternate value follows `else`. If the
> condition is true, the expression evaluates to the first value. If false, the
> alternate.

Source: <https://mojolang.org/docs/reference/expressions/>.

Conditional expressions are **right-associative** and can be chained:

```mojo
var n = 50
var size = (
    "small" if n < 10
        else "large" if n > 100
        else "medium"
)
print(size)   # medium
```

This groups as `"small" if n < 10 else ("large" if n > 100 else "medium")`.
Sources: <https://mojolang.org/docs/reference/expressions/>,
<https://mojolang.org/docs/reference/operators/>.

Because it is an expression, the conditional form can be used anywhere a value
is expected, including as a function argument:

```mojo
def greet(name: String):
    print("Hello,", name)

greet("Sami" if True else "Cass")   # Hello, Sami
```

Source: <https://mojolang.org/docs/manual/operators/>.

## `comptime if`

Prefixing `if` with `comptime` selects a branch at compile time and prunes the
branch that is not taken:

```mojo
from std.sys import size_of

comptime if size_of[Int]() == 8:
    print("64-bit")
else:
    print("Probably 32-bit")
```

`comptime if` "supports `elif` and `else` like the regular `if` statement", and
its condition must be a compile-time expression — a runtime value in the
condition is a compilation error. Source:
<https://mojolang.org/docs/reference/compound-statements/>.

Unlike a runtime `if`, `comptime if` may also appear at module scope; the
official example above is written outside any function. The metaprogramming
manual adds that only the live branch is compiled into the program. Source:
<https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

See [`comptime`](comptime.md) for the compile-time keyword in full.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `elif` | Adds another condition to the same chain; tested only if all earlier conditions were false. |
| `else` | Default branch of the chain; also the second half of the ternary expression and the loop/try clause. |
| `and`, `or`, `not` | Build compound conditions; `and`/`or` short-circuit. |
| `True`, `False` | The two boolean literal values a condition can produce. |
| `comptime` | `comptime if` makes the branch choice a compile-time decision. |

Short-circuiting matters for conditions: "If the first argument to an `or`
operator evaluates to `True`, the second argument is not evaluated", and the
same holds for `and` with a false left operand. Source:
<https://mojolang.org/docs/manual/control-flow/>.

## Signature vs. body

`if` never appears in a signature. It is a **statement** used inside function
and method bodies (and, as `comptime if`, at module scope and in struct/trait
bodies as a compile-time construct). The conditional **expression** form is not
a statement at all and can appear wherever an expression is allowed.

Each `if` body creates a new scope; variables declared inside it are not visible
after it:

```mojo
if condition:
    var x = 10
print(x)   # Error: x is not in scope
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Pitfalls

- **C-style shortcuts do not work.** The reference names both directly:
  `x > 0 and print("positive")` is an error "because `None` isn't truthy", and
  `print("positive") if x > 0 else pass` is an error "because `pass` isn't an
  expression". Source: <https://mojolang.org/docs/reference/compound-statements/>.
- **`if` is not a loop and there is no `switch`/`match`.** The manual carries a
  TODO note: "Mojo currently does not support the equivalent of a Python `match`
  or C `switch` statement". Source:
  <https://mojolang.org/docs/manual/control-flow/>.
- **`else if` is not a spelling.** Mojo uses `elif`.
- **Every `if` and `elif` needs a body.** An empty branch is a syntax error;
  use `pass` when a branch intentionally does nothing.
- **Comparing floats with `==` inside a condition is usually wrong.** The
  operators manual warns: "Don't compare floating-point values with the equality
  operator (`==`)", and recommends `isclose()`. Source:
  <https://mojolang.org/docs/manual/operators/>.
- **Precedence of the conditional expression is low.** It is just above the
  walrus operator and below `or`, so wrap compound conditionals in parentheses;
  chained ternaries are right-associative and can be hard to read. Source:
  <https://mojolang.org/docs/reference/operators/>.
- **`comptime if` is not a runtime branch.** A condition that depends on a
  runtime value fails to compile, and the untaken branch is removed from the
  program.

## See also

[`def`](def.md) for where bodies come from, [`fn`](fn.md) for the deprecated
function keyword, and [`index`](index.md) for the keyword map. Related pages:
[`elif`](elif.md), [`else`](else.md), [`and`](and.md), [`or`](or.md),
[`not`](not.md), [`comptime`](comptime.md),
[`control-flow`](../basics/control-flow.md),
[`compound-statements`](../reference/compound-statements.md),
[`expressions`](../reference/expressions.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Mojo expression reference:
  <https://mojolang.org/docs/reference/expressions/>
- Mojo operator reference:
  <https://mojolang.org/docs/reference/operators/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Types (manual): <https://mojolang.org/docs/manual/types/>
- Compile-time evaluation (manual):
  <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>
