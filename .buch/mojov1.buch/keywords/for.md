# for

`for` iterates over a sequence, executing a body once per element. It is the
iteration loop of Mojo, and the preferred way to walk collections, ranges, and
any user type that implements the iteration protocol.

## Purpose

The official keywords reference defines `for` in one line:

> `for` — Iteration loop

Source: <https://mojolang.org/docs/reference/keywords/>.

The compound-statements reference gives the shape:

> The `for` statement iterates over a sequence: `for item in items:`. To support
> iteration, a sequence must implement `__iter__()` and `__next__()`. A `for`
> loop desugars to a `while` loop that uses these methods.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

```mojo
def main():
    for i in range(5):
        print(i, end=", ")
```

```output
0, 1, 2, 3, 4,
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

## Syntax

```text
for target in iterable:
    body
for target in iterable:
    body
else:
    body
```

The header ends with `:`, the body is indented, and an optional `else` clause
runs when the loop terminates normally. Source:
<https://mojolang.org/docs/reference/compound-statements/>.

## What can be iterated

The manual states the requirement precisely:

> The Mojo `for` loop can iterate over any type that implements an `__iter__()`
> method that returns a type that defines `__next__()` and `__len__()` methods.

Source: <https://mojolang.org/docs/manual/control-flow/>.

In practice that means:

- All collection types in the `collections` module. "All of the collection
  types in the `collections` module support `for` loop iteration." Source:
  <https://mojolang.org/docs/manual/control-flow/>.
- `range()` objects, which are generators: "it's implemented as a generator,
  producing each value as needed rather than materializing the entire sequence
  in memory." Source: <https://mojolang.org/docs/manual/control-flow/>.
- Python collection types, where each item comes back as a `PythonObject`
  wrapper. Source: <https://mojolang.org/docs/manual/control-flow/>.
- User-defined structs, by implementing the iteration protocol.

Iterating each collection has its own shape. A `Dict` iterates keys by default,
while `items()` yields entries with `.key` and `.value` fields:

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

## Loop variable bindings — `var` and `ref`

By default the loop variable is an **immutable reference** to each element
(`imm`). The compound-statements reference spells out the three options:

> Use `var` and `ref` conventions to control ownership, copying, and mutability
> behavior in loop variables. By default, loop variables are immutable
> references to the iterated items (`imm`). To create a mutable copy, use `var`.
> To maintain value mutability, use `ref`.

```mojo
var list: List[String] = ["a", "b", "c", "d"]

for var item in list:
    item = item + "x"   # works: item is a mutable copy of the element
    print(item)         # "ax", then "bx", "cx", "dx"
print(list)             # unchanged

for ref item in list:
    item = item + "x"   # mutability picked up in reference to the element
    print(item)         # "ax", then "bx", "cx", "dx"
print(list)             # changed to ["ax", "bx", "cx", "dx"]
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

The manual shows the mutation idiom directly, including the fact that the
iteration itself returns references:

> The Mojo collection iterators all return references, which are captured
> immutably into the loop variable. If you'd like to get a reference to a
> mutable element, add the `ref` keyword in front of the loop variable.

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

Without `ref` or `var`, the loop variable cannot be mutated:

```mojo
var list = [2, 3, 4]
for item in list:
    item = 0    # Error: `item` is an immutable reference
```

Use `var` when the copy is what you want, and `ref` when the element itself
must change.

## Destructuring in the loop target

The loop target may unpack a tuple, so pairs can be taken apart without an
intermediate variable:

```mojo
for key, value in pairs:   # For example, [("a", 1), ("b", 2), ...]
    print(key, value)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## Loop control and `else`

`break` and `continue` behave as in any loop, and `for` may carry an `else`
clause:

```mojo
for x in range(10):
    if x == 5:
        break        # Stop at 5
    if x % 2 == 0:
        continue     # Skip even numbers
    print(x)         # Prints 1, 3
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

The `else` clause runs when the loop exits normally, runs for an empty
iterable, and is suppressed by `break` or `return`. It is not suppressed by
`continue` (which does not exit the loop). The full rules and examples live in
[`else`](else.md).

## `comptime for`

Prefixing `for` with `comptime` unrolls the loop at compile time, replacing the
loop with one copy of the body per iteration:

```mojo
comptime for i in range(3):
    print(i)   # Compiled as: print(0); print(1); print(2)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

The metaprogramming manual explains the consequences and the requirement:

> The loop sequence must be a valid compile-time expression ... The compiler
> fully unrolls the loop by replacing the `for` loop with `LIMIT` copies of the
> loop body.

It also warns that this "can greatly expand both the code size and the
compilation time", so it should be used "only for loops with small loop bodies
and low iteration counts". Source:
<https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

`comptime for` is the standard way to walk a heterogeneous `VariadicPack`,
because the compiler must know each element's type:

```mojo
def count_many_things[*ArgTypes: Intable](*args: *ArgTypes) -> Int:
    var total = 0
    comptime for i in range(args.__len__()):
        total += Int(args[i])
    return total

def main():
    print(count_many_things(5, 11.7, 12))   # 28
```

Source: <https://mojolang.org/docs/manual/functions/>.

A nested ordinary `for` inside a parameter context is different: `for` loops
over runtime values, while `comptime for` requires the sequence to be known at
compile time.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `in` | Separates the loop target from the iterable; also the membership operator, at a different precedence. |
| `while` | The other loop form; `for` desugars to `while` over `__iter__()`/`__next__()`. |
| `break`, `continue` | Exit early / skip to the next element. |
| `else` | Optional clause run on normal termination, suppressed by `break`. |
| `var`, `ref` | Bind the loop variable as a mutable copy / mutable reference. |
| `comptime` | `comptime for` unrolls at compile time. |
| `return` | Inside a loop body, returns from the enclosing function and suppresses the loop `else`. |

## Signature vs. body

`for` never appears in a signature. It is a statement used in function and
method bodies (as `comptime for`, also at module scope and in compile-time
contexts). Each `for` body creates a new scope; the loop target itself is
scoped to the loop.

## Pitfalls

- **Mutating the loop variable without `ref`.** The default loop variable is an
  immutable reference, so assignment to it is a compile error. Use
  `for ref item in …` to change elements in place, or `for var item in …` for a
  private mutable copy. Verified above.
- **Assuming the loop variable is an owned value.** It is a reference; a copy
  only happens when you ask for one. Copying a non-`Copyable` element will not
  work.
- **`for i in range(len(x))` when you mean the elements.** Iterating directly
  (`for item in x`) is idiomatic and avoids indexing.
- **Off-by-one on `range`.** `range(n)` is `[0, n)` — the upper bound is
  excluded.
- **`comptime for` with runtime bounds.** The sequence must be a compile-time
  expression; a runtime value in `range(...)` fails to compile.
- **`len(args)` in a variadic pack.** `len(args)` is a dynamic expression and
  cannot drive a `comptime for`; use `args.__len__()`. Source:
  <https://mojolang.org/docs/manual/functions/>.
- **Negative indices are gone.** Mojo collections no longer support negative
  indexing; `x[-1]` is a compile-time error. Source:
  <https://mojolang.org/releases/v1.0.0b1/>.
- **Hold on to references carefully.** Element references from `List` and
  similar carry interior origins; a mutation such as `append()` invalidates
  them. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Expecting Python's `enumerate`/`zip` as keywords.** They are standard
  library functions, not syntax.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`while`](while.md), [`in`](in.md), [`break`](break.md),
[`continue`](continue.md), [`else`](else.md), [`ref`](ref.md), [`var`](var.md),
[`comptime`](comptime.md), [`control-flow`](../basics/control-flow.md),
[`compound-statements`](../reference/compound-statements.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Functions (manual): <https://mojolang.org/docs/manual/functions/>
- Compile-time evaluation (manual):
  <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>
- Mojo v1.0.0b1 release notes: <https://mojolang.org/releases/v1.0.0b1/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
