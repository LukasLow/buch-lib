# Literals

A *literal* is a value written directly in source: `42`, `"hello"`, `True`.
Literals produce values without reading variables or calling functions, and the
lexer enforces rules for each form. This page covers every documented literal:
integer, floating-point, string, t-string, boolean, `None`, `Self`, the discard
pattern, and the ellipsis.

## What a literal is

> A *literal* is a value written directly in source code: `42`, `"hello"`,
> `True`. Literals produce values without reading variables or calling
> functions. Each section below covers one literal type, its syntax, and
> any rules the lexer enforces.

Source: <https://mojolang.org/docs/reference/literals/>.

Literals are not the same as *displays*. Displays look similar but may contain
arbitrary expressions; literals contain fixed values only:

> Displays are similar to literals, but unlike literals, displays can contain
> expressions as well as fixed values. Literals cannot contain expressions.

```mojo
[1, 2, 3]        # list literal
[1, 1+1, 1+1+1]  # list display
```

Source: <https://mojolang.org/docs/reference/expressions/>.

Materialization is the bridge from compile-time literal to runtime value:

> Materialization makes a compile-time value available at runtime. Integer,
> floating-point, and string literals are implicitly materialized to their
> respective runtime types (Int, Float and String).

Source: <https://mojolang.org/docs/reference/literals/>. The two numeric
literal types are `IntLiteral` and `FloatLiteral`; they exist only during
compilation and default to `Int` and `Float64` respectively. The full model is
on [Integers and floats](../types/integers-and-floats.md).

## Integer literals

Four bases are supported:

```mojo
42        # Decimal
0xFF      # Hexadecimal (0x or 0X prefix)
0o52      # Octal (0o or 0O prefix)
0b101010  # Binary (0b or 0B prefix)
```

Source: <https://mojolang.org/docs/reference/literals/>. The official lexical
grammar:

```text
integer     → decinteger | bininteger | octinteger | hexinteger
decinteger  → nonzerodigit ("_" | digit)* | "0"+ ("_" | "0")*
bininteger  → "0" ("b" | "B") ("_" | bindigit)+
octinteger  → "0" ("o" | "O") ("_" | octdigit)+
hexinteger  → "0" ("x" | "X") ("_" | hexdigit)+
```

Source: <https://mojolang.org/docs/reference/literals/>.

The rules that catch people:

- **Literals are always non-negative.** "`-1024` is the unary negation operator
  `-` applied to the literal `1024`."
- **Underscores group digits and Mojo is lenient.** "Mojo is more permissive
  than Python here. Consecutive and trailing underscores are allowed":
  `1__000_` is valid.
- **No leading zeros in decimal.** `0123` is an error; use `0o123` for octal.
- **A base prefix needs at least one digit.** `0x`, `0b` and `0o` alone are all
  errors ("no digits specified").

Source: <https://mojolang.org/docs/reference/literals/>.

```mojo
1_000_000  # readable grouping
1__000_    # also valid
0123       # Error: leading zeros in decimal integer literals are not permitted
0o123      # OK: octal
```

Source: <https://mojolang.org/docs/reference/literals/>.

An integer literal materializes to the type its context requires, defaulting to
`Int`:

```mojo
var a: Int = 42            # becomes Int
var b: Int8 = 42           # becomes Int8
var c: Float32 = 42        # becomes Float32
var d: UInt64 = 1_000_000  # becomes UInt64
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

## Floating-point literals

```mojo
1.0
3.14159
.5       # Fraction only (no integer part)
2.       # Integer part with decimal point
2.5e-3   # With exponent
1E10     # Capital E works too
```

Source: <https://mojolang.org/docs/reference/literals/>. The grammar:

```text
floatnumber   → pointfloat | exponentfloat
pointfloat    → digitpart? fraction | digitpart "."
exponentfloat → (digitpart | pointfloat) exponent
fraction      → "." digitpart
exponent      → ("e" | "E") ("+" | "-")? digitpart
digitpart     → digit ("_" | digit)*
```

Source: <https://mojolang.org/docs/reference/literals/>.

Rules:

- **Non-negative.** "`-3.14` is the unary negation operator `-` applied to the
  literal `3.14`."
- **An exponent marker must be followed by at least one digit.**
  `2.5e`, `2.5e-` are errors; `2.5e-3` is fine.
- **Underscores work as in integers:** `1_000.000_5`.

Source: <https://mojolang.org/docs/reference/literals/>. A decimal point is
what makes it a float — a numeric literal "must include the decimal point to be
interpreted as floating-point". Source:
<https://mojolang.org/docs/manual/types/>.

A float literal materializes to the target float type, defaulting to `Float64`:

```mojo
var float1 = 3.3           # Float64
var float2: Float32 = 7.5  # Float32
var float3: BFloat16 = 0.5 # BFloat16
```

Sources: <https://mojolang.org/docs/manual/types/> and
<https://mojolang.org/docs/reference/numeric-types/>.

## String literals

Mojo supports single quotes, double quotes, and a triple-quoted multi-line
form:

```mojo
"Hello"
'world'
"""Multi-line
string
"""                # includes the final newline
'''Also
    multi-line'''  # includes 4 spaces at the start of the second line
```

Source: <https://mojolang.org/docs/reference/literals/>.

Three behaviours to know:

- **Triple-quoted strings include newlines literally.** "A backslash at the end
  of a line suppresses the newline, joining the next line directly":
  `"""\` followed by text gives no leading newline.
- **Adjacent string literals are joined.** `"Hello, " "World"` is
  `"Hello, World"`, and this works across lines when the continuation is
  indented.
- **The `r`/`R` prefix makes a raw string** that disables escape processing:
  `r"C:\path\to\file"`.

Source: <https://mojolang.org/docs/reference/literals/>.

```mojo
var x = "Hello, " "World"    # "Hello, World"
var y = "line one "
    "line two"               # "line one line two" (indented continuation)
print(r"Hello\nWorld")       # Hello\nWorld — literal backslash and n
```

Source: <https://mojolang.org/docs/reference/literals/>. A source file is UTF-8,
so string literals may contain non-ASCII text directly (`var wave = "👋"`).
Source: <https://mojolang.org/docs/reference/literals/>.

### Escape sequences

The complete documented set:

| Sequence | Meaning | Sequence | Meaning |
|----------|---------|----------|---------|
| `\\` | Backslash | `\a` | Bell |
| `\"` | Double quote | `\b` | Backspace |
| `\'` | Single quote | `\f` | Form feed |
| `\n` | Newline | `\v` | Vertical tab |
| `\r` | Carriage return | `\xHH` | Hex value (exactly 2 hex digits) |
| `\t` | Tab | `\0`–`\377` | Octal value (1–3 octal digits) |
| `\uHHHH` | Unicode code point (4 hex digits) | `\UHHHHHHHH` | Unicode code point (8 hex digits) |

Source: <https://mojolang.org/docs/reference/literals/>.

```mojo
var wave = "\U0001F44B"   # 8-digit hex escape, 👋
var euro = "\u20AC"       # 4-digit hex escape, €
```

Source: <https://mojolang.org/docs/reference/literals/>. The bounds and the
surrogate rule:

> - `\uHHHH` accepts code points from U+0000 to U+FFFF
> - `\UHHHHHHHH` accepts the full Unicode range, U+0000 to U+10FFFF
>
> Both forms reject surrogate code points (U+D800 to U+DFFF), which are
> reserved for UTF-16 encoding. Code points above U+FFFF require `\U`, not a
> UTF-16 surrogate pair.

Source: <https://mojolang.org/docs/reference/literals/>. `chr()` is the
function equivalent and covers the full range. Source:
<https://mojolang.org/docs/manual/types/>.

### `StringLiteral` versus `String`

The type of a source string literal is `StringLiteral`, a compile-time
constant; it "materializes to a `String` at runtime, or to a `StringSpan` when
the context requires a view." Sources:
<https://mojolang.org/docs/reference/types/> and
<https://mojolang.org/docs/manual/types/>. In 1.0, positional indexing on a
`StringLiteral` was removed; use the `[byte=]`, `[codepoint=]` or `[grapheme=]`
keyword accessors. Source: <https://mojolang.org/releases/v1.0.0/>. The string
types and their length measurements are on
[Bool and strings](../types/bool-and-strings.md).

## T-string literals

A *t-string* supports expression interpolation with `{}`:

```mojo
var name = "World"
var greeting_template = t"Hello, {name}!"   # "Hello, World!"
var result_template = t"1 + 1 = {1 + 1}"    # "1 + 1 = 2"
```

> Expressions inside `{}` are evaluated at runtime. Adjacent t-string literals
> are joined, just like regular string literals. To use them as strings
> except in print statements, cast them to `String`:

```mojo
var greeting = t"Hello, {name}!"    # type is TString
print(greeting)                     # prints "Hello, World!"
var greeting_str = String(greeting) # convert to a regular String
```

Source: <https://mojolang.org/docs/reference/literals/>.

T-strings can be triple-quoted and combined with the raw prefix in either order:

```mojo
t"""
Hello, {name}!
"""

rt"Path: {base}\subdir"  # raw t-string: backslashes are literal
```

Source: <https://mojolang.org/docs/reference/literals/>. Literal braces are
doubled, and nesting is allowed:

```mojo
t"Use {{braces}} in t-strings"   # "Use {braces} in t-strings"
```

> T-strings can be nested. An interpolation expression can itself contain
> t-strings, up to 20 levels deep.

Source: <https://mojolang.org/docs/reference/literals/>.

`TString` is lazy — it allocates only when you build a `String` from it — which
is why it is preferred over the older `format()` method. Source:
<https://mojolang.org/docs/manual/types/>.

## Boolean literals

> `True` and `False` represent boolean truth values.

```mojo
var x = True
var y = False
```

Source: <https://mojolang.org/docs/reference/literals/>. Both are reserved
keywords; `Bool` and its truthiness rules are on
[Bool and strings](../types/bool-and-strings.md).

## The `None` literal

> `None` represents the absence of a value. It's the only value of type
> `NoneType`.

```mojo
var x: NoneType = None
```

Source: <https://mojolang.org/docs/reference/literals/>. A function with no
declared return type returns `None`, so these two declarations are equivalent:

```mojo
def greet():
    print("hello")

def greet() -> None:
    print("hello")
```

Source: <https://mojolang.org/docs/reference/literals/>. `None` is also the
empty value for `Optional`; see
[Optionals and nullability](../types/optionals-and-nullability.md).

## The `Self` literal

> `Self` refers to the enclosing type inside a struct or trait definition:

```mojo
from std.math import sqrt

@fieldwise_init
struct Point:
    var x: Float64
    var y: Float64

    @staticmethod
    def create() -> Self:          # Self refers to Point
        return Self(0.0, 0.0)

    def distance(self) -> Float64: # self is an argument name, not Self
        return sqrt(self.x ** 2 + self.y ** 2)
```

Source: <https://mojolang.org/docs/reference/literals/>. The case difference is
crucial and is stated in the same listing:

> `Self` (capital S) is a keyword that refers to the type. `self` (lowercase)
> is a conventional argument name for the instance.

Source: <https://mojolang.org/docs/reference/literals/>. `Self` is one of the
34 true keywords. Source: <https://mojolang.org/docs/reference/keywords/>.

## The discard pattern

> The underscore `_` discards a value in an assignment:

```mojo
_, var y = get_pair()  # Ignore the first element
```

Source: <https://mojolang.org/docs/reference/literals/>.

`_` is an **identifier**, not a keyword — the keyword reference is explicit that
it should not be documented as one. Sources:
<https://mojolang.org/docs/reference/literals/> and
<https://mojolang.org/docs/reference/keywords/>. It has two more documented
uses:

- **Silencing an unused-result warning.** Assigning an expression statement to
  `_` marks it intentionally discarded: `_ = update()`. Source:
  <https://mojolang.org/docs/reference/simple-statements/>.
- **Extending a value's lifetime.** Assigning a value to `_` marks its last use,
  which is how you control exactly when its destructor runs. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.

```mojo
for _ in range(3):
    print("tick")
```

Source: <https://mojolang.org/docs/reference/literals/> and
[Syntax](syntax.md).

## The ellipsis literal

> `...` marks a trait method as required. Conforming types must provide their
> own implementation. It's only valid inside trait definitions:

```mojo
trait Drawable:
    def draw(self) -> None: ...   # required: conforming types must implement
```

> `...` and `pass` aren't interchangeable. `pass` is a no-op statement that
> provides an empty body. `...` is a requirement marker that means "you must
> implement this."

Source: <https://mojolang.org/docs/reference/literals/>. The trait-declarations
reference gives the sharper rule: `pass` counts as a provided implementation and
is "only valid when the method returns `None`", while `...` marks a required
method stub. Source:
<https://mojolang.org/docs/reference/trait-declarations/>.

## Literal materialization summary

| Literal | Compile-time type | Default runtime type | Notes |
|---------|-------------------|----------------------|-------|
| Integer | `IntLiteral` | `Int` | Arbitrary precision at compile time; no overflow |
| Floating point | `FloatLiteral` | `Float64` | Arbitrary precision at compile time |
| String | `StringLiteral` | `String` (or `StringSpan` in a view context) | |
| T-string | `TString` | lazy; `String(t)` to materialize | Interpolates expressions |
| Bool | `True` / `False` | `Bool` | |
| `None` | `None` | `NoneType` | |
| `Self` | — | — | Refers to the enclosing type; not a value |
| `_` | — | — | Discard pattern; an identifier, not a keyword |
| `...` | — | — | Required-method marker; traits only |

Sources: <https://mojolang.org/docs/reference/literals/>,
<https://mojolang.org/docs/reference/numeric-types/>,
<https://mojolang.org/docs/reference/types/> and
<https://mojolang.org/docs/manual/types/>.

## Pitfalls

- **Writing `0123` for octal.** Leading zeros in a decimal literal are an error;
  use `0o123`. Verified above.
- **Leaving out the digits after a base prefix.** `0x`, `0b`, `0o` alone are
  errors. Verified above.
- **Ending a float with an incomplete exponent.** `2.5e` and `2.5e-` are
  errors; the exponent needs at least one digit. Verified above.
- **Expecting a negative literal to be one token.** `-1024` is unary negation
  applied to `1024`. That matters for negative indexing, which is a compile-time
  error in 1.x. Sources:
  <https://mojolang.org/docs/reference/literals/> and
  <https://mojolang.org/releases/v1.0.0/>.
- **Using a UTF-16 surrogate pair for an astral character.** Surrogates are
  rejected; write the full code point with `\U`. Verified above.
- **Using a t-string where a `String` is needed.** A `TString` is lazy and has
  its own type; cast with `String(t)` outside `print()`. Verified above.
- **Forgetting to double literal braces in a t-string.** `{` starts an
  interpolation; write `{{` and `}}` for literal braces. Verified above.
- **Conflating `Self` and `self`.** `Self` is the type, `self` is the instance
  argument name. Verified above.
- **Treating `_` as a keyword.** It is an identifier that discards. Verified
  above.
- **Using `...` as a no-op statement.** `pass` is the no-op; `...` is a
  requirement marker and is only valid in a trait. Verified above.
- **Assuming adjacent string literals need an operator.** They are joined
  implicitly, including across an indented continuation. Verified above.

## Sources

- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Mojo expressions reference: <https://mojolang.org/docs/reference/expressions/>
- Types (manual): <https://mojolang.org/docs/manual/types/>
- Mojo numeric types reference: <https://mojolang.org/docs/reference/numeric-types/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Mojo trait declarations reference: <https://mojolang.org/docs/reference/trait-declarations/>
- Mojo simple statements reference: <https://mojolang.org/docs/reference/simple-statements/>
- Mojo identifiers, keywords, and conventions reference: <https://mojolang.org/docs/reference/keywords/>
- Value destruction (manual): <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
