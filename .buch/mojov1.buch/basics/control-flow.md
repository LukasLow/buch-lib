# Control flow

Control flow decides which statements run. Mojo has the traditional forms —
`if`/`elif`/`else`, `for`, `while`, `break`, `continue` — plus loop `else`
clauses, `with` for context managers, and `comptime if`/`comptime for` for
compile-time execution. This page covers all of them, and how loops interact
with ranges and collections.

## `if` statements

> Mojo supports the `if` statement for conditional code execution. With it you
> can conditionally execute an indented code block if a given boolean
> expression evaluates to `True`.

```mojo
var temp_celsius = Float64(25)
if temp_celsius > 20:
    print("It is warm.")
    print("The temperature is", temp_celsius * 9 / 5 + 32, "Fahrenheit." )
```

Official output:

```output
It is warm.
The temperature is 77.0 Fahrenheit.
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

A single short statement can share the header line:

```mojo
var temp_celsius = 22
if temp_celsius < 15: print("It is cool.")   # skipped
if temp_celsius > 20: print("It is warm.")   # prints
```

Source: <https://mojolang.org/docs/manual/control-flow/>. The compound-statements
reference adds the style note: "When the body is a single simple statement, you
can write it on a single line, although many style guides discourage this."
Source: <https://mojolang.org/docs/reference/compound-statements/>.

### `elif` and `else`

> Optionally, an `if` statement can include any number of additional `elif`
> clauses, each specifying a boolean condition and associated code block to
> execute if `True`. The conditions are tested in the order given. When a
> condition evaluates to `True`, the associated code block is executed and no
> further conditions are tested.
>
> Additionally, an `if` statement can include an optional `else` clause
> providing a code block to execute if all conditions evaluate to `False`.

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

Source: <https://mojolang.org/docs/manual/control-flow/>. The reference states
the same selection semantics and the block rule:

> Conditions are evaluated in order. Add as many as needed. The first true
> condition runs its block, and the statement exits. The `else` block runs if
> no condition is true.
>
> The body must be indented more than the header. The first body statement sets
> the indentation for the rest of the body.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### No `match` or `switch`

> Mojo currently does not support the equivalent of a Python `match` or C
> `switch` statement for pattern matching and conditional execution.

Source: <https://mojolang.org/docs/manual/control-flow/>.

> **Open question:** the control-flow manual labels the missing `match`/`switch`
> as "TODO", which suggests it may arrive in a future release. Treat it as
> absent in the current 1.x release and do not write code that assumes it.
> Source: <https://mojolang.org/docs/manual/control-flow/>.

### Shortcuts from other languages do not work

```mojo
x > 0 and print("positive")  # Error because 'None' isn't truthy

print("positive") if x > 0 else pass
    # Error because 'pass' isn't an expression
```

Source: <https://mojolang.org/docs/reference/compound-statements/>. `if` needs
an indented body (or a single statement after the colon); the ternary form needs
expressions on both sides.

### Short-circuit evaluation

`and` and `or` stop as soon as the result is known, which the control-flow page
demonstrates with side effects:

```mojo
def true_func() -> Bool:
    print("Executing true_func")
    return True

def false_func() -> Bool:
    print("Executing false_func")
    return False

print('Short-circuit "or" evaluation')
if true_func() or false_func():
    print("True result")
```

Official output:

```output
Short-circuit "or" evaluation
Executing true_func
True result
```

Source: <https://mojolang.org/docs/manual/control-flow/>. The `and` case:

```mojo
print('Short-circuit "and" evaluation')
if false_func() and true_func():
    print("True result")
```

```output
Short-circuit "and" evaluation
Executing false_func
```

Source: <https://mojolang.org/docs/manual/control-flow/>. The operator details
are on [Operators](operators.md).

### Conditional expressions

> Mojo also supports conditional expressions (or what is sometimes called a
> *ternary conditional operator*) using the syntax `true_result if
> boolean_expression else false_result`, just as in Python.

```mojo
var temp_celsius = 15
var forecast = "warm" if temp_celsius > 20 else "cool"
print("The forecast for today is", forecast)
```

```output
The forecast for today is cool
```

Source: <https://mojolang.org/docs/manual/control-flow/>. The multi-line `if`
statement is the verbose alternative:

```mojo
var forecast: String
if temp_celsius > 20:
    forecast = "warm"
else:
    forecast = "cool"
```

Source: <https://mojolang.org/docs/manual/control-flow/>. Ternary expressions
are right-associative; see [Operators](operators.md).

### Conditions must be boolean

A condition is a `Bool`-typed expression, or a value of a type that conforms to
`Boolable`. The rules: "zero, empty strings, empty collections, and `None` are
falsy. Everything else is truthy." Source:
<https://mojolang.org/docs/manual/operators/>. Truthiness details are on
[Bool and strings](../types/bool-and-strings.md).

## `while` loops

> The `while` loop repeatedly executes a code block while a given boolean
> expression evaluates to `True`.

```mojo
var fib_prev = 0
var fib_curr = 1

print(fib_prev, end="")
while fib_curr < 50:
    print(",", fib_curr, end="")
    fib_prev, fib_curr = fib_curr, fib_prev + fib_curr
```

Official output:

```output
0, 1, 1, 2, 3, 5, 8, 13, 21, 34
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

### `continue`

> A `continue` statement skips execution of the rest of the code block and
> resumes with the loop test expression.

```mojo
var n = 0
while n < 5:
    n += 1
    if n == 3:
        continue
    print(n, end=", ")
```

```output
1, 2, 4, 5,
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

### `break`

> A `break` statement terminates execution of the loop.

```mojo
var n = 0
while n < 5:
    n += 1
    if n == 3:
        break
    print(n, end=", ")
```

```output
1, 2,
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

### `while ... else`

> Optionally, a `while` loop can include an `else` clause. The body of the
> `else` clause executes when the loop's boolean condition evaluates to `False`,
> even if it occurs the first time tested.

```mojo
var n = 5

while n < 4:
    print(n)
    n += 1
else:
    print("Loop completed")
```

```output
Loop completed
```

> The `else` clause does *not* execute if a `break` or `return` statement exits
> the `while` loop.

```mojo
var n = 0
while n < 5:
    n += 1
    if n == 3:
        break
    print(n)
else:
    print("Executing else clause")
```

```output
1
2
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

## `for` loops

> The `for` loop iterates over a sequence, executing a code block for each
> element in the sequence. The Mojo `for` loop can iterate over any type that
> implements an `__iter__()` method that returns a type that defines
> `__next__()` and `__len__()` methods.

Source: <https://mojolang.org/docs/manual/control-flow/>. The reference phrases
the desugaring: "A `for` loop desugars to a `while` loop that uses these
methods." Source: <https://mojolang.org/docs/reference/compound-statements/>.

### Iterating collections

All collection types in the `collections` package support `for` iteration:

```mojo
var states = ["California", "Hawaii", "Oregon"]
for state in states:
    print(state)
```

```output
California
Hawaii
Oregon
```

Source: <https://mojolang.org/docs/manual/control-flow/>. `Set` needs its import:

```mojo
from std.collections import Set

var values = {42, 0}
for item in values:
    print(item)
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

`Dict` has two documented iteration styles. Iterating the `Dict` directly
produces keys; iterating `.items()` produces entries with `key` and `value`
fields:

```mojo
var capitals: Dict[String, String] = {
    "California": "Sacramento",
    "Hawaii": "Honolulu",
    "Oregon": "Salem"
}

for var state in capitals:
    print(t"{capitals[state]}, {state}")

for item in capitals.items():
    print(t"{item.value}, {item.key}")
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

### Iterating with references

> The Mojo collection iterators all return references, which are captured
> immutably into the loop variable. If you'd like to get a reference to a
> mutable element, add the `ref` keyword in front of the loop variable to
> create a reference binding that matches the element reference.

```mojo
var values = [1, 4, 7, 3, 6, 11]
for ref value in values:
    if value % 2 != 0:
        value -= 1
print(values)
```

```output
[0, 4, 6, 2, 6, 10]
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

The reference's rule for the three conventions is the one to memorize:

> Use `var` and `ref` conventions to control ownership, copying, and
> mutability behavior in loop variables. By default, loop variables are
> immutable references to the iterated items (`imm`). To create a mutable
> copy, use `var`. To maintain value mutability, use `ref`.

```mojo
var list: List[String] = ["a", "b", "c", "d"]

for var item in list:
    item = item + "x"    # works: item is a mutable copy
print(list)              # unchanged

for ref item in list:
    item = item + "x"    # mutability picked up in the reference
print(list)              # changed to ["ax", "bx", "cx", "dx"]
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

Owned iteration consumes the container and yields each element by value:

```mojo
var names = ["alice", "bob"]
for x in names^:
    print(x^)
# `names` is consumed and can no longer be used here
```

Source: <https://mojolang.org/docs/std/collections/list/List/>.

### Destructuring in the loop target

> Destructuring works directly in the loop target. This lets you unpack tuple
> elements as you iterate. In this example, each item in `pairs` is unpacked
> into `key` and `value` for every iteration:

```mojo
for key, value in pairs:   # for example, [("a", 1), ("b", 2), ...]
    print(key, value)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### Iterating ranges

> Another type of iterable provided by the Mojo standard library is a *range*,
> which is a sequence of integers generated by the `range()` function. It
> differs from the collection types shown above in that it's implemented as a
> generator, producing each value as needed rather than materializing the
> entire sequence in memory.

```mojo
for i in range(5):
    print(i, end=", ")
```

```output
0, 1, 2, 3, 4,
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

`range` is a `[start,] stop[, step]` family. The `stop` bound is exclusive, as
the reference shows with `for i in range(10):  # [0, 10)`. Source:
<https://mojolang.org/docs/reference/compound-statements/>.

In 1.0 `range()` was reworked. The details that affect loops:

- "The `Int`-based and `Scalar`-based range types are unified into a single
  `dtype`-parameterized family... `range()` with `Int` arguments behaves exactly
  as before."
- "Floating-point iteration is now drift-free and reversible, so forward and
  reverse iteration produce identical sequences across repeated calls."
- "`reversed()` now works on typed ranges such as
  `reversed(range(Int16(1), 10, 2))`."
- "Non-numeric element types (`Bool` and the narrow MX float formats) are now
  rejected at construction, and the one- and two-argument float ranges
  (`range(Float64(4.5))` and `range(Float64(0.5), Float64(3.0))`) are compile
  errors instead of infinite loops; use the three-argument stepped form."

Source: <https://mojolang.org/releases/v1.0.0/>. That last point is a real
migration trap: a float `range` with fewer than three arguments used to loop
forever, and is now a compile-time error.

```mojo
for i in range(1, 10, 2):
    print(i, end=" ")   # 1 3 5 7 9

for i in reversed(range(3)):
    print(i, end=" ")   # 2 1 0
```

Sources: <https://mojolang.org/docs/manual/control-flow/> and
<https://mojolang.org/releases/v1.0.0/>.

### `for` control statements and `else`

`continue` and `break` work as in `while`, with `for`-specific wording:

> A `continue` statement skips execution of the rest of the code block and
> resumes the loop with the next element of the collection.
>
> A `break` statement terminates execution of the loop.

Source: <https://mojolang.org/docs/manual/control-flow/>.

```mojo
for i in range(5):
    if i == 3:
        continue
    print(i, end=", ")
# 0, 1, 2, 4,

for i in range(5):
    if i == 3:
        break
    print(i, end=", ")
# 0, 1, 2,
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

The loop `else` clause runs when the loop finishes normally, and — the
important part — "executes even if the collection is empty":

```mojo
for i in range(5):
    print(i, end=", ")
else:
    print("\nFinished executing 'for' loop")

var empty: List[Int] = []
for i in empty:
    print(i)
else:
    print("Finished executing 'for' loop")   # prints
```

> The `else` clause does *not* execute if a `break` or `return` statement
> terminates the `for` loop.

```mojo
var animals = ["cat", "aardvark", "hippopotamus", "dog"]
for animal in animals:
    if animal == "dog":
        print("Found a dog")
        break
else:
    print("No dog found")
```

```output
Found a dog
```

Source: <https://mojolang.org/docs/manual/control-flow/>. The
compound-statements reference frames the `else` semantics as a search idiom:

```mojo
var found = False
for item in items:
    if item == target:
        found = True
        break
else:
    print("not found")   # only runs if break was never hit
```

> Both `for` and `while` loops support `else`.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### Iterating Python collections

A `for` loop also iterates Python collection types; each item is a
`PythonObject`:

```mojo
from std.python import Python

def main() raises:
    var py_list = Python.list(42, "cat", 3.14159)
    for py_obj in py_list:   # each element is a PythonObject
        print(py_obj)
```

```output
42
cat
3.14159
```

Source: <https://mojolang.org/docs/manual/control-flow/>. Python interop is the
subject of [Python interop](../interop/python-interop.md).

## Context managers: `with`

> A `with` statement manages resources using context managers. *Context
> managers* define setup (`__enter__`) and cleanup (`__exit__`) operations.
> The cleanup always runs when the block exits, even if an error occurs:

```mojo
with open("file.txt") as f:
    var content = f.read()
# File is closed here, even if an error occurred
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

Multiple managers share one `with`, which is equivalent to nesting:

```mojo
with open("input.txt") as f_in, open("output.txt", "w") as f_out:
    f_out.write(f_in.read())
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### How a context manager works

> When a `with` block is entered, `__enter__()` is called on the context
> manager expression. The result is bound to the `as` target if present. A
> context manager that defines only `__enter__()` is valid; `__exit__()` is
> optional. When the block exits, `__exit__()` is called if it exists, even
> if an error occurs.

Source: <https://mojolang.org/docs/reference/compound-statements/>. The
reference's minimal implementation:

```mojo
struct Scope(ImplicitlyCopyable):
    var label: String

    def __init__(out self, label: String):
        self.label = label

    def __enter__(self) -> Self:
        print("entering", self.label)
        return self

    def __exit__(self):
        print("exiting", self.label)

def main():
    with Scope("setup") as s:
        print("inside", s.label)
    # entering setup
    # inside setup
    # exiting setup
```

Source: <https://mojolang.org/docs/reference/compound-statements/>. The two
implementation notes from that example: "`__enter__` returns `self` so the `as`
target binds to the manager", and the `ImplicitlyCopyable` conformance "lets the
compiler return `self` by value."

The `as` target is scoped to the `with` block:

```mojo
with open("file.txt") as f:
    var data = f.read()
# f is not accessible here
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Compile-time control flow

`comptime if` and `comptime for` run during compilation. They are not in the
`basics/` scope for runtime behavior, but they are part of the control-flow
vocabulary, so here is the summary.

### `comptime if`

> `comptime if` selects a branch at compile time, pruning the unselected
> branches. Only the selected branch appears in the compiled program.

```mojo
from std.sys import size_of

comptime if size_of[Int]() == 8:
    print("64-bit")
else:
    print("Probably 32-bit")
```

> The condition must be a compile-time expression.

```mojo
comptime if runtime_value > 0:   # Error: requires compile-time evaluation
    pass
```

> `comptime if` supports `elif` and `else` like the regular `if` statement.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### `comptime for`

> `comptime for` unrolls a loop at compile time. Each iteration is compiled as
> separate code. This creates a bigger binary but improves runtime performance
> by eliminating loop overhead and enabling further optimizations.

```mojo
comptime for i in range(3):
    print(i)   # compiled as: print(0); print(1); print(2)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

> **Open question:** `comptime` control flow is documented in
> [compound statements](../reference/compound-statements.md) and used throughout
> the manual, but its full interaction with runtime control flow (for example a
> `break` inside a `comptime for`) is not spelled out on one page.
> [Decorators and metaprogramming](../functions/decorators-and-metaprogramming.md)
> owns the surrounding detail. Source:
> <https://mojolang.org/docs/reference/compound-statements/>.

## Scopes

> Each compound statement body creates a new scope. Variables declared inside a
> body are not visible outside it:

```mojo
if condition:
    var x = 10
print(x)   # Error: x is not in scope
```

Source: <https://mojolang.org/docs/reference/compound-statements/>. The
variables manual states the same rule as block-level scoping and adds that
nested code can read and modify outer variables, but not the reverse. Source:
<https://mojolang.org/docs/manual/variables/>.

Loop targets are a binding form and are exempt from the 1.0 implicit-declaration
deprecation: "Binding forms that already spell out how they bind are unaffected:
`for` targets, `with ... as`, `except ... as`, comprehension targets, and the `_`
discard." Source: <https://mojolang.org/releases/v1.0.0/>. So
`for i in range(3)` needs no `var`, while `var item = ...` inside the body does.

Nested functions create their own scope and capture explicitly:

```mojo
def outer():
    var count = 0

    def inner() {mut count}:   # capture count by mutable reference
        count += 1

    inner()
    print(count)    # 1
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Choosing a loop

| Situation | Form |
|-----------|------|
| Iterate a collection | `for item in collection` |
| Mutate elements in place | `for ref item in collection` |
| Iterate a copy you may change | `for var item in collection` |
| Consume the collection | `for item in collection^` |
| Iterate a numeric sequence | `for i in range(...)` |
| Iterate a numeric sequence backwards | `for i in reversed(range(...))` |
| Repeat while a condition holds | `while condition:` |
| Loop with early exit | `while True:` plus `break` |
| Search with a "not found" case | `for ... else:` |
| Manage a resource | `with manager as name:` |
| Run at compile time | `comptime if` / `comptime for` |

Sources: <https://mojolang.org/docs/manual/control-flow/>,
<https://mojolang.org/docs/reference/compound-statements/> and
<https://mojolang.org/docs/std/collections/list/List/>.

## Pitfalls

- **Expecting `match`/`switch`.** Not supported in the current release; express
  the branches with `if`/`elif`. Verified above.
- **Forgetting that `else` is skipped by `break`.** It runs on normal
  completion only, for both `for` and `while`. Verified above.
- **Assuming `else` is skipped for an empty collection.** It executes even then.
  Verified above.
- **Mutating a collection through a default loop variable.** The default is an
  immutable reference; use `ref` to mutate elements. Verified above.
- **Confusing `var` and `ref` loop targets.** `var` gives a mutable copy (the
  container is unchanged); `ref` binds the element (the container changes).
  Verified above.
- **Using a float `range` with one or two arguments.** Now a compile error
  instead of an infinite loop; use the three-argument stepped form. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Using a non-numeric `range` element type.** `Bool` and the narrow MX float
  formats are rejected at construction. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Reaching for a variable declared in a block.** Every compound body is a new
  scope. Verified above.
- **Assuming `with` `as` variables live on.** They are scoped to the block.
  Verified above.
- **Writing `x > 0 and print(...)` for a conditional.** `print` returns `None`,
  which isn't truthy; use `if`. Verified above.
- **Using a `comptime` statement with a runtime value.** `comptime if` requires a
  compile-time condition. Verified above.
- **Letting `continue` skip loop-variable updates in a `while`.** `continue`
  resumes at the *test*, so an update placed after the skipped code never runs
  — a classic infinite loop. (Documented behavior: "resumes with the loop test
  expression".) Source:
  <https://mojolang.org/docs/manual/control-flow/>.

## Sources

- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Mojo compound statements reference: <https://mojolang.org/docs/reference/compound-statements/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Variables (manual): <https://mojolang.org/docs/manual/variables/>
- Mojo `List` API: <https://mojolang.org/docs/std/collections/list/List/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
