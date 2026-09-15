# Operators

An operator is a symbol or word that acts on values. This page is the complete
operator reference for Mojo 1.x: the full precedence and associativity table,
every symbolic operator by category, the word operators, assignment operators,
and the syntax rules that are specific to Mojo. It is written to be the single
place you need for "which operator wins" and "which operator does what"; the
dunder methods that make operators work on your own types are on
[Operator support](../types/operator-support.md).

## What operators are

> Operators are symbols and keywords that act on values. They support
> addition, comparison, bitwise operations, and boolean logic using operator
> syntax instead of method calls.

Source: <https://mojolang.org/docs/manual/operators/>.

Mojo's operator syntax follows Python's, with a few deliberate differences:

> Mojo's operator syntax mirrors Python. Symbols, precedence, and
> associativity use Python conventions, so most behavior will feel familiar
> if you've used Python, C, Rust, or similar languages.
>
> That said, a few details are specific to Mojo. Boolean operators use words
> (`and`, `or`, `not`) instead of symbols like `&&` and `||`. The ternary
> expression places the condition in the middle. The caret (`^`) serves as
> both bitwise XOR and the transfer sigil for ownership and memory management.

Source: <https://mojolang.org/docs/manual/operators/>.

## Precedence and associativity

Higher precedence binds tighter. Unless a row says otherwise, operators
associate left to right.

| Precedence | Operators | Notes |
|------------|-----------|-------|
| 1 | `()` `[]` `.` | Call, subscript, attribute |
| 2 | `**` | Exponentiation, right-associative |
| 3 | `+x` `-x` `~x` | Unary prefix |
| 4 | `*` `@` `/` `//` `%` | Multiplicative |
| 5 | `+` `-` | Additive (addition, subtraction) |
| 6 | `<<` `>>` | Bitwise shift (left, right) |
| 7 | `&` | Bitwise AND |
| 8 | `^` | Bitwise XOR (not transfers) |
| 9 | `\|` | Bitwise OR |
| 10 | `==` `!=` `<` `<=` `>` `>=` | Comparisons, chainable |
| 10 | `in` `not in` | Membership, chainable |
| 10 | `is` `is not` | Identity, chainable |
| 11 | `not` | Boolean NOT, prefix |
| 12 | `and` | Boolean AND, short-circuits |
| 13 | `or` | Boolean OR, short-circuits |
| 14 | `if`-`else` | Ternary, right-associative |
| 15 | `:=` | Walrus operator |

Source: <https://mojolang.org/docs/reference/operators/>.

Reading rules that fall out of the table:

- **Calls, subscripts and attribute access bind tightest.** `a.b(c)[d]` groups
  as `((a.b)(c))[d]`.
- **Exponentiation binds tighter than unary minus.** The reference lists `**` at
  precedence 2 and unary `-x` at 3, so `-2 ** 2` is `-(2 ** 2)`.
- **Shifts sit between additive and bitwise.** `1 + 2 << 3` groups as
  `(1 + 2) << 3`; `a << b & c` groups as `(a << b) & c`.
- **Bitwise precedence is AND, then XOR, then OR** — the same as Python.
- **Comparison, membership and identity share precedence 10** and may be
  chained.
- **`not` is looser than comparisons but tighter than `and`/`or`.**
- **The ternary is looser than every boolean operator, and the walrus is the
  loosest.**

The manual's prose summary matches:

> From tightest to loosest, they are: calls and attribute access,
> exponentiation, unary prefix operators, arithmetic (multiply and divide
> before add and subtract), shifts, bitwise operators (AND before XOR before
> OR), comparisons, boolean logic (`not` before `and` before `or`),
> conditional expression, and the walrus operator.

Source: <https://mojolang.org/docs/manual/operators/>.

The manual's practical advice:

> When in doubt, use parentheses. They cost nothing at runtime and make your
> intent clear both when you write the code and when it is later read and
> maintained.

Source: <https://mojolang.org/docs/manual/operators/>.

### Right-associative operators

Two infix operators are right-associative:

> Most operators are left-associative. For example, `a - b + c` groups as
> `(a - b) + c`. Two infix operators are right-associative: exponentiation
> (`a ** b`) and Mojo's ternary `if`-`else`.

```mojo
2 ** 3 ** 4        # groups as 2 ** (3 ** 4)
```

> Equivalent to `pow(2, 81)`. In Mojo `pow(a, b)` and `a ** b` are
> interchangeable.

```mojo
"low" if value < 10 else "high" if value > 100 else "mid"
# groups as "low" if value < 10 else ("high" if value > 100 else "mid")
```

Source: <https://mojolang.org/docs/reference/operators/>.

### Chaining comparisons

> All comparison operators can be chained:

```mojo
a < b < c        # equivalent to: (a < b) and (b < c)
a == b == c      # equivalent to: (a == b) and (b == c)
a < b == c       # equivalent to: (a < b) and (b == c)
a < b <= c != d  # equivalent to: (a < b) and (b <= c) and (c != d)
```

> Each intermediate value is evaluated once.

Source: <https://mojolang.org/docs/reference/operators/>. Two rules govern
chaining:

- "Chaining only applies between operators at the same precedence. `2 ** 3 ==
  8` isn't a chain. It evaluates as `(2 ** 3) == 8`."
- "Comparison, membership, and identity operators share the same precedence and
  chain together. `5 != a < b in c` is valid and evaluates as `(5 != a) and
  (a < b) and (b in c)`."

Source: <https://mojolang.org/docs/reference/operators/>.

The once-only evaluation is observable when the middle operand is a call:

```mojo
var short_item_list = [1, 2, 3, 4, 5]
var ok = 0 < len(short_item_list) <= 10
print(ok)   # True
```

Source: <https://mojolang.org/docs/manual/operators/>.

## Arithmetic operators

```mojo
print(7 + 3)    # 10, add
print(7 - 3)    # 4, subtract
print(7 * 3)    # 21, multiply
print(2 ** 8)   # 256, exponentiation
```

> Exponentiation uses two stars (`**`) and not a caret (`^`). If you prefer a
> function form, call `pow(base, exponent)`.

Source: <https://mojolang.org/docs/manual/operators/>.

### Unary prefix operators

- `-x` negates.
- `+x` is a no-op identity.
- `~x` inverts bits: `var a: Int8 = -128; print(~a) # 127`.

Source: <https://mojolang.org/docs/manual/operators/>.

### Division and remainder

Mojo has two division operators, and they differ for negative numbers:

```mojo
var a = -7
var b = 4
print(a / b)   # -1 (truncates toward zero)
print(a // b)  # -2 (rounds toward negative infinity)
```

> - Use `/` when you want truncation toward zero.
> - Use `//` when you want floor division.
>
> For floating-point types, `/` performs standard division and `//` returns a
> float rounded down to the nearest whole number.

Source: <https://mojolang.org/docs/manual/operators/>.

The modulo operator `%` follows this identity:

```text
a == b * (a // b) + (a % b)
```

```mojo
print(7 % 3)    # 1
print(-7 % 4)   # 1
print(7 % -4)   # -1
```

Source: <https://mojolang.org/docs/manual/operators/>.

For 1.x, note the `Int` change: integer `/` is truncating integer division
returning `Int`, not floating-point division. Source:
<https://mojolang.org/releases/v1.0.0/>. The `SIMD`-level descriptions in the
operator reference add the operator set detail: `/` for integer types "round
towards zero" and `//` "round towards negative infinity". Source:
<https://mojolang.org/docs/reference/operators/>.

### Matrix multiplication

> The `@` operator performs matrix multiplication. If you've used NumPy, this
> will look familiar.
>
> Mojo doesn't include a built-in matrix type, but any type that implements
> `__matmul__()` can use it.

Source: <https://mojolang.org/docs/manual/operators/>.

## Comparison operators

Mojo has six comparison operators: `==`, `!=`, `<`, `<=`, `>` and `>=`. Each
returns a `Bool`. Source: <https://mojolang.org/docs/manual/operators/>.

```mojo
print(10 > 5)     # True
print(10 == 10)   # True
print(10 != 10)   # False
```

Source: <https://mojolang.org/docs/manual/operators/>.

### Floating-point comparison

> Don't compare floating-point values with the equality operator (`==`). Small
> rounding errors accumulate, and values that look equal often aren't:

```mojo
from std.math import isclose

var total: Float64 = 0.0
for _ in range(10):
    total += 0.1
print(total == 1.0)        # False
print(isclose(total, 1.0)) # True
```

Source: <https://mojolang.org/docs/manual/operators/>.

## Bitwise operators

> Bitwise operators work on integer types at the bit level. They let you inspect
> and manipulate individual bits directly.
>
> AND (`&`) keeps bits that are set in both operands, OR (`|`) keeps bits set
> in either, and XOR (`^`) keeps bits that differ:

```mojo
var flags: UInt8 = 0b0000_0101
var mask: UInt8 = 0b0000_0011
print(flags & mask)   # 1 (only bit 0 set in both)
print(flags | mask)   # 7 (bits 0, 1, and 2)
print(flags ^ mask)   # 6 (bits 1 and 2 differ)
```

```mojo
print(1 << 4)    # 16
print(16 >> 2)   # 4
print(-16 >> 2)  # -4
```

> Left shift by *n* is equivalent to multiplying by 2^n, right shift to dividing
> by 2^n.

Source: <https://mojolang.org/docs/manual/operators/>. Among bitwise operators,
"precedence runs: NOT (`~`) is tightest, then shift operators, then AND, then
XOR, then OR." Source: <https://mojolang.org/docs/manual/operators/>.

### The `^` ambiguity

> Mojo uses the caret (`^`) for both bitwise XOR and the transfer operator. In
> expressions where the meaning could be ambiguous, Mojo treats it as XOR. For
> example, `x^+1` is `(x ^ (+1))`, not `((x^) + 1)`.

Source: <https://mojolang.org/docs/manual/operators/>. The reference's shorter
statement: "`^` means XOR when followed by a value, and transfer when used
directly after a variable name." Source:
<https://mojolang.org/docs/reference/operators/>.

```mojo
a ^ b   # XOR
a^      # transfer
```

Source: <https://mojolang.org/docs/reference/operators/>. The transfer sigil is
"one postfix unary operator" and is "compiler implementation only" — you cannot
implement it yourself. Source:
<https://mojolang.org/docs/reference/operators/>.

## Boolean logic

> Mojo uses words for boolean operators instead of symbols like `&&` or `||`.
> The operators read like plain language:

```mojo
print(True and False)   # False
print(True or False)    # True
print(not True)         # False
```

Source: <https://mojolang.org/docs/manual/operators/>.

### Short-circuit evaluation

> The `and` and `or` operators stop as soon as the result is known. With `and`,
> if the left side is falsy, the right side isn't evaluated. With `or`, if the
> left side is truthy, the right side is skipped.

```mojo
def always_true() -> Bool:
    print("called")
    return True

print(False and always_true())  # False; "called" never prints
```

Source: <https://mojolang.org/docs/manual/operators/>. The control-flow manual
shows both directions:

```mojo
if true_func() or false_func():   # false_func is not called
    print("True result")

if false_func() and true_func():  # true_func is not called
    print("True result")
```

Source: <https://mojolang.org/docs/manual/control-flow/>.

### Truthiness

> Types that conform to `Boolable` have a truth value, so they can be used
> directly in boolean expressions and `if` conditions. The rules are
> predictable: zero, empty strings, empty collections, and `None` are falsy.
> Everything else is truthy.

```mojo
var name = "Mojo"
if name:
    print("Name is set")
```

Source: <https://mojolang.org/docs/manual/operators/>. `Boolable` is covered on
[Bool and strings](../types/bool-and-strings.md).

## Membership and identity

### `in` and `not in`

> The `in` operator checks whether a collection contains a value:

```mojo
var colors = ["red", "green", "blue"]
print("red" in colors)         # True
print("yellow" not in colors)  # True
```

> It also works with strings to check for substrings:

```mojo
var food = "peanut butter"
if "nut" in food:
    print("Contains a nut")   # prints
```

Source: <https://mojolang.org/docs/manual/operators/>. The reference states the
dispatch direction: "`x in collection` calls `collection.__contains__(x)`. The
method is on the **container**, not the element. `not in` calls the same method
and negates the result." Source:
<https://mojolang.org/docs/reference/operators/>.

### `is` and `is not`

> Identity operators check whether two values refer to the same object, not just
> whether they are equal. The most common use is checking `Optional` values
> against `None`:

```mojo
var opt: Optional[Int] = None
if opt is None:
    print("No value")        # prints

opt = 42
if opt is not None:
    print("Has a value")     # prints
```

Source: <https://mojolang.org/docs/manual/operators/>. "`is` tests object
identity, not equality. Stdlib types that implement it include `ArcPointer`,
`PythonObject`, and `Optional` (for `is None` checks)." Source:
<https://mojolang.org/docs/reference/operators/>.

## String operators

> Strings support concatenation with `+` and repetition with `*`:

```mojo
var greeting = "Hello" + " " + "Mojo"
print(greeting)   # Hello Mojo
print("ha" * 3)   # hahaha
print("=" * 40)   # a line of 40 equals signs
```

> Strings compare lexicographically. Uppercase letters sort before lowercase:

```mojo
print("Zebra" < "ant")   # True
print("bird" == "bird")  # True
```

Source: <https://mojolang.org/docs/manual/operators/>.

## Conditional expression

> Mojo uses `if`-`else` for conditional expressions instead of `? :`. The
> condition sits in the middle:

```mojo
var score = 80
var result = "pass" if score > 65 else "fail"
print(result)   # pass
```

> You can use this form anywhere an expression is valid, including function
> arguments:

```mojo
greet("Sami" if True else "Cass")   # Hello, Sami
```

Source: <https://mojolang.org/docs/manual/operators/>. It is right-associative
and chains from the right, "which can be hard to read":

```mojo
var value = 50
var label = (
    "low" if value < 10
    else "high" if value > 100
    else "mid"
)
print(label)   # mid
```

Source: <https://mojolang.org/docs/manual/operators/>. Control-flow coverage is
on [Control flow](control-flow.md).

## Assignment operators

### `=` and compound assignment

Assignment (`=`) is a **statement**, not an expression:

> Assignment operators (`=` `+=` `-=` `*=` `/=` `//=` `%=` `**=` `@=` `&=`
> `\|=` `^=` `<<=` `>>=`) are statements, not expressions. They are not part of
> expression precedence.

Source: <https://mojolang.org/docs/reference/operators/>. The complete compound
set is `+=`, `-=`, `*=`, `/=`, `//=`, `%=`, `**=`, `@=`, `&=`, `|=`, `^=`,
`<<=`, `>>=`.

> These update the left-hand value instead of creating a new one:

```mojo
var count = 0
count += 1
count += 1
print(count)   # 2

var flags: UInt8 = 0b0000_0001
flags |= 0b0000_0100
print(flags)   # 5 (bits 0 and 2 set)
```

Source: <https://mojolang.org/docs/manual/operators/>. Two facts worth
repeating:

- "For types that store data on the heap, in-place operators can avoid
  allocating intermediate values."
- "A type must implement its in-place methods explicitly, so not every type that
  supports `+` also supports `+=`."

Source: <https://mojolang.org/docs/manual/operators/>. The full operator-to-dunder
mapping is on [Operator support](../types/operator-support.md).

Every compound form has the obvious expansion:

```text
x += y    x = x + y        x &= y    x = x & y
x -= y    x = x - y        x |= y    x = x | y
x *= y    x = x * y        x ^= y    x = x ^ y
x /= y    x = x / y        x <<= y   x = x << y
x //= y   x = x // y       x >>= y   x = x >> y
x %= y    x = x % y
x **= y   x = x ** y
x @= y    x = x @ y
```

Sources: <https://mojolang.org/docs/reference/operators/> (arithmetic and
bitwise compound sets) and <https://mojolang.org/docs/manual/operators/>
(complete list).

### Walrus operator `:=`

> The walrus operator (`:=`, officially an *assignment expression*) assigns a
> value inside an expression. The assigned value becomes the result of that
> expression:

```mojo
while (name := input("Name or 'quit': ")) != "quit":
    print("Hello,", name)
```

Source: <https://mojolang.org/docs/manual/operators/>. It is the expression form
of assignment, and the reference notes it is the loosest operator:

> The walrus operator has the lowest precedence of any expression operator. Use
> parentheses when needed to make your intent clear:

```mojo
if item := list[idx] < 50:        # binds the comparison result
    print(t"{item} is under 50")  # "True is under 50"

if (item := list[idx]) < 50:      # binds the list item
    print(t"{item} is under 50")  # "(actual number) is under 50"
```

Source: <https://mojolang.org/docs/reference/expressions/>.

The name may be declared beforehand or introduced by the walrus, and "the
binding remains available for the rest of its scope." The value need not exist
in memory: "it might be a computed value that exists only in registers. The
walrus operator doesn't imply anything about ownership or reference semantics."
Source: <https://mojolang.org/docs/reference/expressions/>.

> **Open question:** the two official pages disagree slightly on the walrus's
> exact precedence position. The operator reference places it after `if`-`else`
> (precedence 15, loosest); the expressions reference calls it "the lowest
> precedence of any expression operator" and its example shows that an unparenthesized
> `item := list[idx] < 50` binds the comparison. Both agree it is loosest; when
> mixing it with `and`/`or`, parenthesize. Sources:
> <https://mojolang.org/docs/reference/operators/> and
> <https://mojolang.org/docs/reference/expressions/>.

## Operator categories at a glance

| Category | Operators | Result |
|----------|-----------|--------|
| Call / index / access | `()` `[]` `.` | value or reference |
| Power | `**` | numeric |
| Unary prefix | `-x` `+x` `~x` | same numeric type |
| Multiplicative | `*` `@` `/` `//` `%` | numeric |
| Additive | `+` `-` | numeric or (for `+`) concatenation |
| Shift | `<<` `>>` | integer |
| Bitwise | `&` `^` `\|` `~` | integer |
| Comparison | `==` `!=` `<` `<=` `>` `>=` | `Bool` |
| Membership | `in` `not in` | `Bool` |
| Identity | `is` `is not` | `Bool` |
| Boolean | `not` `and` `or` | `Bool` |
| Conditional | `a if cond else b` | either branch's type |
| Transfer | `x^` | moves the value |
| Assignment | `=` and the compound set | statement; no value |
| Walrus | `:=` | the assigned value |

Sources: <https://mojolang.org/docs/reference/operators/> and
<https://mojolang.org/docs/manual/operators/>.

## Pitfalls

- **Using `^` for exponentiation.** `**` is power; `^` is XOR (and transfer
  postfix). Verified above.
- **Assuming `and`/`or` are symbols.** Mojo uses the words; `&&` and `||` are
  not operators. Verified above.
- **Expecting `/` on integers to produce a float.** In 1.x it is truncating
  integer division. Use an explicit `Float64` cast. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Mixing `/` and `//` on negatives.** `/` truncates toward zero, `//` floors
  toward negative infinity. Verified above.
- **Comparing floats with `==`.** Use `isclose()` for a tolerance comparison.
  Verified above.
- **Assuming an unparenthesized `x^+1` transfers.** It parses as XOR with `+1`.
  Verified above.
- **Relying on chaining across precedence levels.** `a < b in c` chains because
  they share precedence 10; `2 ** 3 == 8` does not, because `**` binds tighter.
  Verified above.
- **Putting assignment in an expression.** `=` is a statement and cannot appear
  inside an expression; use the walrus `:=` when you need a value. Verified
  above.
- **Assuming `+=` exists because `+` does.** In-place methods are opt-in per
  type. Verified above.
- **Forgetting short-circuiting when the right side has side effects.**
  `and`/`or` may skip evaluation entirely. Verified above.
- **Chaining ternaries without parentheses.** It is right-associative and
  "can be hard to read"; parenthesize. Verified above.
- **Treating `not in` / `is not` as one operator.** They are negated forms of
  `in` / `is`, at the same precedence. Verified above.

## Sources

- Mojo operator reference: <https://mojolang.org/docs/reference/operators/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Mojo expressions reference: <https://mojolang.org/docs/reference/expressions/>
- Control flow (manual): <https://mojolang.org/docs/manual/control-flow/>
- Mojo simple statements reference: <https://mojolang.org/docs/reference/simple-statements/>
- Add operator support to custom types (manual): <https://mojolang.org/docs/manual/structs/operator-support/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
