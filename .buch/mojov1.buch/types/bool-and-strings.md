# Bool and strings

Mojo's `Bool` is a real type, not a numeric alias, and any type can opt into
boolean contexts by conforming to `Boolable`. Its string family is a stack of
owned and non-owning text types, with three different and deliberately
disagreeing length measurements. This page covers both.

## `Bool`

> Mojo's `Bool` type represents a boolean value. It can take one of two values,
> `True` or `False`. You can negate a boolean value using the `not` operator.

```mojo
def main():
    var conditionA = False
    var conditionB: Bool
    conditionB = not conditionA
    print(conditionA, conditionB)
```

Output:

```output
False True
```

Source: <https://mojolang.org/docs/manual/types/>.

`Bool` is not a `SIMD` alias:

> A `Bool` struct is backed by a 1-bit value, not a `SIMD` alias. Its literals
> are `True` and `False`.

Source: <https://mojolang.org/docs/reference/types/>. In the `SIMD`
`DType` table, `DType.bool` is described as "Boolean (1-bit)". Source:
<https://mojolang.org/docs/reference/numeric-types/>.

### Boolean contexts and `Boolable`

> Many types have a boolean representation. Any type that implements the
> `Boolable` trait has a boolean representation. As a general principle,
> collections evaluate as True if they contain any elements, False if they are
> empty; strings evaluate as True if they have a non-zero length.

Source: <https://mojolang.org/docs/manual/types/>.

The operators page states the same rules as a short list:

> Types that conform to `Boolable` have a truth value, so they can be used
> directly in boolean expressions and `if` conditions. The rules are
> predictable: zero, empty strings, empty collections, and `None` are falsy.
> Everything else is truthy.

Source: <https://mojolang.org/docs/manual/operators/>.

```mojo
from std.collections import List

def main():
    var name = "Mojo"
    if name:                       # non-empty String is truthy
        print("Name is set")

    var empty: List[Int] = []
    print(Bool(empty))             # False

    var nums = [1, 2, 3]
    print(Bool(nums))              # True
```

Sources: <https://mojolang.org/docs/manual/operators/> and
<https://mojolang.org/docs/manual/types/>.

`Bool` is also constructible from a value in a boolean context, which the
operator-support walkthrough shows as `Bool(c)` — the expression form of the
same check. Source:
<https://mojolang.org/docs/manual/structs/operator-support/>.

```mojo
from std.collections import List

def main():
    var items = [0, 1, 2]
    if Bool(items):
        print("non-empty")   # prints
```

> **Open question:** the manual says "everything else is truthy", but the
> authoritative per-type answer is the `Implemented traits` list on each type's
> API page (does it list `Boolable`?). For a type you did not write, read that
> list rather than inferring truthiness from a prose rule. Sources:
> <https://mojolang.org/docs/manual/operators/> and
> <https://mojolang.org/docs/reference/types/>.

## The string family

All string types hold UTF-8 encoded text, and validity is enforced at
construction:

> All string types hold UTF-8 encoded text. Their bytes are guaranteed to be
> valid UTF-8. Construction enforces this. `String(from_utf8_lossy=...)`
> replaces invalid bytes, and `String(unsafe_from_utf8=...)` requires the
> caller to guarantee validity.

Source: <https://mojolang.org/docs/reference/types/>.

| Type | What it is |
|------|------------|
| `String` | Owned, mutable, heap-allocated UTF-8 string. |
| `StringSpan` | Non-owning view into existing UTF-8 data. |
| `StaticString` | A `StringSpan` over static, read-only data. |
| `StringLiteral` | Compile-time string constant from source. |
| `Codepoint` | A single Unicode codepoint. |

Source: <https://mojolang.org/docs/reference/types/>.

### `String`

Strings are Mojo's primary text type and `String` is the mutable, owning one:

> Strings are Mojo's primary text type. They store UTF-8 encoded text and
> provide a safe, ergonomic interface for string manipulation.
>
> Mojo's `String` type is a mutable string.

```mojo
def main():
    var s: String = "Testing"
    s += " Mojo strings"
    print(s)   # Testing Mojo strings
```

Source: <https://mojolang.org/docs/manual/types/>.

Many standard-library types conform to `Writable`, which means they convert to
a `String`, and `print()` accepts them. There are two construction forms:

```mojo
def main():
    var s = "Items in list: " + String(5)
    print(s)                          # Items in list: 5

    var t = String("Items in list: ", 5)   # variadic, no per-value String()
    print(t)                          # Items in list: 5
```

Source: <https://mojolang.org/docs/manual/types/>. The operators manual notes
the efficiency point: "When building a string from multiple values, the
multi-argument `String()` constructor is more efficient than chaining `+`."
Source: <https://mojolang.org/docs/manual/operators/>.

### `StringSpan` and `StaticString`

`StringSpan` is the non-owning view, and `StaticString` is the statically
backed special case. A string literal in source is a `StringLiteral`, and:

> A string literal in source is a `StringLiteral`. It materializes to a
> `String` at runtime, or to a `StringSpan` when the context requires a view.
> `StringSlice` remains available as a compatibility alias for `StringSpan`.

Source: <https://mojolang.org/docs/reference/types/>.

The 1.0 rename is the one to know: `StringSlice` → `StringSpan`, with the old
name kept as a `comptime` alias "for the time being". Source:
<https://mojolang.org/releases/v1.0.0/>.

```mojo
def measure(label: StaticString, s: StringSpan):
    print(label, s.count_graphemes())

def main():
    var owned = String("Mojo")
    measure("owned:", owned)        # String coerces to a view
    measure("literal:", "literal")  # a StringLiteral also fits
```

Sources: <https://mojolang.org/docs/reference/types/> and
<https://mojolang.org/docs/manual/types/>.

> **Open question:** the types reference states that a `StringLiteral`
> "materializes to a `String` at runtime, or to a `StringSpan` when the context
> requires a view", but does not enumerate the rules that decide which one a
> given context requires. Treat the target type of the expression as the
> deciding factor, and make it explicit (`String(literal)` /
> `StringSpan(literal)`) when the choice matters. Source:
> <https://mojolang.org/docs/reference/types/>.

## Three length measurements

The length question has three answers, and they disagree for non-ASCII text.
This is one of the sharp edges 1.0 deliberately kept sharp.

> The standard library counts emoji three different ways, and the answers
> usually disagree:
>
> - `byte_length()` returns the number of UTF-8 bytes.
> - `count_codepoints()` counts the Unicode code points.
> - `count_graphemes()` returns the number of user-perceived characters
>   (grapheme clusters), following [UAX #29](https://www.unicode.org/reports/tr29/).

Source: <https://mojolang.org/docs/manual/types/>.

The manual's runnable example, with its official output:

```mojo
def show(label: StaticString, s: StringSpan):
    print(
        label,
        "bytes=", s.byte_length(),
        "codepoints=", s.count_codepoints(),
        "graphemes=", s.count_graphemes(),
    )

def main():
    show("family    ", "👨‍👩‍👧‍👦")
    show("flag      ", "🇺🇸")
    show("wave      ", "👋🏽")
    show("namaste   ", "नमस्ते")
```

```output
family     bytes=25  codepoints=7  graphemes=1
flag       bytes=8   codepoints=2  graphemes=1
wave       bytes=8   codepoints=2  graphemes=1
namaste    bytes=18  codepoints=6  graphemes=3
```

Source: <https://mojolang.org/docs/manual/types/>. The manual's example spells the
parameter `StringSlice`; the code above uses the current 1.x name `StringSpan`
(`StringSlice` remains a deprecated compatibility alias). See
[`versions/1.0.0`](../versions/1.0.0.md).

The reference states the practical rule:

> The grapheme count is what matches what a human would tell you if you asked
> them to "count characters."

And the summary:

> `byte_length()` counts UTF-8 bytes, `count_codepoints()` counts Unicode
> codepoints, and `count_graphemes()` counts user-perceived characters. Pick
> the count that matches the question being asked.

Source: <https://mojolang.org/docs/reference/types/>.

### Iteration yields grapheme clusters

This is a 1.0 semantics change and a common source of surprise:

> Iterating over a `String`, `StringSpan`, or `StringLiteral` now yields
> grapheme clusters by default. Their `__iter__()` and `__reversed__()` methods
> return a `GraphemeSliceIter`, so `for c in my_string:` produces what a user
> perceives as a single "character" on screen. The lower-level views remain
> available when you want them: `codepoints()` or `codepoint_slices()` for
> Unicode scalars, and `bytes()` for raw UTF-8 bytes.

Source: <https://mojolang.org/releases/v1.0.0/>.

```mojo
def main():
    var wave = "👋🏽"        # one grapheme, two codepoints, eight bytes
    for c in wave:
        print("grapheme:", c)   # prints once

    for cp in wave.codepoints():
        print("codepoint")      # prints twice
```

Source: <https://mojolang.org/releases/v1.0.0/>.

There is a second 1.0 consequence: `String.__len__()` was deprecated in favour
of an explicit measurement, so write the measurement you mean rather than
`len(s)`:

> `String.__len__()` as the string length → `String.byte_length()` or
> `String.count_codepoints()`.

Source: <https://mojolang.org/releases/v1.0.0/>.

## Writing non-ASCII without non-ASCII source

Source files are UTF-8, so emoji can be written directly. When a codebase is
ASCII-only, spell the codepoint instead:

```mojo
var wave = "\U0001F44B"   # 8-digit hex escape, 👋
var wave2 = chr(0x1F44B)  # chr() function
var copy   = "\u00A9"     # 4-digit hex escape, ©
var euro   = "\u20AC"     # 4-digit hex escape, €
```

Source: <https://mojolang.org/docs/manual/types/>. The rules: `\uHHHH` covers
U+0000 to U+FFFF; `\UHHHHHHHH` covers the full range up to U+10FFFF; both reject
UTF-16 surrogate code points (U+D800 to U+DFFF). Sources:
<https://mojolang.org/docs/reference/literals/> and
<https://mojolang.org/docs/manual/types/>. Escapes are listed in full on
[Literals](../basics/literals.md).

## Raw strings and t-strings

A raw string disables escape processing; `t"..."` is a template string that
interpolates expressions.

```mojo
def main():
    print(r"Hello\nWorld")   # Hello\nWorld — backslash and n, on one line

    var count = 3
    var items = "apples"
    print(t"Give me {count} {items}.")   # Give me 3 apples.
```

Source: <https://mojolang.org/docs/manual/types/>. Raw prefixes apply to every
string form, including triple-quoted strings and t-strings:

```mojo
print(rt"Hello,\t{name}.")   # Hello,\tNate. — interpolation, no escape
```

Source: <https://mojolang.org/docs/manual/types/>.

`TString` is **lazy**: it does not allocate until you explicitly build a
`String` from it. That is why it is preferred over the older `format()` method:

```mojo
var x = 41
print(t"The answer is {x + 1}")   # The answer is 42 (no allocation)

var name = "Nate"
var template = t"Hello, {name}!"  # template creation
print(template)                   # Hello, Nate! (no allocation)
var s = String(template)          # explicitly construct a String
```

Source: <https://mojolang.org/docs/manual/types/>. Full literal syntax is on
[Literals](../basics/literals.md).

### `format()` still exists

```mojo
print("{0} {1} {0}".format("Mojo", 1.125))  # Mojo 1.125 Mojo
print("{} {}".format(True, "hello world"))  # True hello world
```

> Mojo's `TString` (template string) replaces the functionality of the
> `format()` method with direct expressions and better performance
> characteristics.

Source: <https://mojolang.org/docs/manual/types/>.

## String operations

Strings support `+` for concatenation, `*` for repetition, comparison, and
membership:

```mojo
from std.math import isclose

def main():
    print("Hello" + " " + "Mojo")   # Hello Mojo
    print("ha" * 3)                 # hahaha
    print("=" * 40)                 # 40 equals signs

    print("Zebra" < "ant")          # True: lexicographic, uppercase sorts first
    print("bird" == "bird")         # True

    var food = "peanut butter"
    print("nut" in food)            # True: substring membership
```

Sources: <https://mojolang.org/docs/manual/operators/> (all of the above).

## Pitfalls

- **Using `len(s)` as the string length.** In 1.x `String.__len__()` is
  deprecated; choose `byte_length()`, `count_codepoints()` or
  `count_graphemes()` explicitly. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Assuming one iteration is one byte.** Iteration yields grapheme clusters
  since 1.0. Use `bytes()` or `codepoints()` for lower-level views. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Assuming all three length functions agree.** They disagree for any
  non-ASCII text, and the manual's own emoji table shows how far apart. Verified
  above.
- **Writing `StringSlice` in new code.** It still compiles as a compatibility
  alias, but the 1.x name is `StringSpan`; `MutStringSlice`/`ImmStringSlice`
  map to `MutStringSpan`/`ImmStringSpan`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Forgetting that a raw string still needs a quote that terminates it.**
  Use a different quote form when the content contains one:
  `r'She said, "Hello, World!"'`. Source:
  <https://mojolang.org/docs/manual/types/>.
- **Assuming `Bool` is `SIMD[DType.bool, 1]`.** `Bool` is its own struct backed
  by a 1-bit value. `DType.bool` exists in the SIMD DType table, but the
  language-level `Bool` is separate. Verified above.
- **Treating `Int`-like truthiness as Python's.** `Boolable` is a trait you can
  conform to, and truthiness is defined per type, not inherited from a numeric
  base. Verified above.
- **Expecting `+` to accept a non-`String` without conversion.** Concatenation
  needs a string operand; use `String(value)` or the variadic `String(...)`
  constructor. Verified above.

## Sources

- Types (manual): <https://mojolang.org/docs/manual/types/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Mojo numeric types reference: <https://mojolang.org/docs/reference/numeric-types/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Add operator support to custom types (manual): <https://mojolang.org/docs/manual/structs/operator-support/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
