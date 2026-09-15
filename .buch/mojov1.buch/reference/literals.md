# Literals

This page is the **complete formal reference** for Mojo literals, mirroring
`/docs/reference/literals/`. It gives the full lexical grammar, every accepted
form, and the exact materialization rules. The guided tour of the same topic,
with worked examples, is on [Literals](../basics/literals.md); read that page to
learn, this one to look up the exact rule.

## What a literal is

> A *literal* is a value written directly in source code: `42`, `"hello"`,
> `True`. Literals produce values without reading variables or calling
> functions. Each section below covers one literal type, its syntax, and any
> rules the lexer enforces.

Source: <https://mojolang.org/docs/reference/literals/>.

> Materialization makes a compile-time value available at runtime. Integer,
> floating-point, and string literals are implicitly materialized to their
> respective runtime types (Int, Float and String).

Source: <https://mojolang.org/docs/reference/literals/>.

Displays are related but distinct: they may contain expressions, literals may
not. See [Expressions](expressions.md).

## Literal kinds at a glance

| Literal | Example | Compile-time type | Default runtime type |
|---------|---------|-------------------|----------------------|
| Decimal integer | `42` | `IntLiteral` | `Int` |
| Hexadecimal integer | `0xFF` | `IntLiteral` | `Int` |
| Octal integer | `0o52` | `IntLiteral` | `Int` |
| Binary integer | `0b101010` | `IntLiteral` | `Int` |
| Floating point | `3.14159`, `.5`, `2.`, `1E10` | `FloatLiteral` | `Float64` |
| String | `"Hello"`, `'world'`, `"""..."""` | `StringLiteral` | `String` (or `StringSpan` as a view) |
| Raw string | `r"C:\path"` | `StringLiteral` | `String` |
| T-string | `t"Hello, {name}!"` | `TString` | `String(t)` materializes it |
| Boolean | `True`, `False` | `Bool` | `Bool` |
| None | `None` | `NoneType` | `NoneType` |
| `Self` | `Self` | — (a type, not a value) | — |
| Discard | `_` | — (an identifier) | — |
| Ellipsis | `...` | — (a trait requirement marker) | — |

Sources: <https://mojolang.org/docs/reference/literals/>,
<https://mojolang.org/docs/reference/numeric-types/> and
<https://mojolang.org/docs/reference/types/>.

## Integer literals

> *Integer literals* represent whole numbers in four bases:

```mojo
42        # Decimal
0xFF      # Hexadecimal (0x or 0X prefix)
0o52      # Octal (0o or 0O prefix)
0b101010  # Binary (0b or 0B prefix)
```

### Lexical grammar

```text
integer     → decinteger | bininteger | octinteger | hexinteger
decinteger  → nonzerodigit ("_" | digit)* | "0"+ ("_" | "0")*
bininteger  → "0" ("b" | "B") ("_" | bindigit)+
octinteger  → "0" ("o" | "O") ("_" | octdigit)+
hexinteger  → "0" ("x" | "X") ("_" | hexdigit)+
```

Source: <https://mojolang.org/docs/reference/literals/>.

### Rules

| Rule | Statement | Example |
|------|-----------|---------|
| Non-negative | "Integer literals are always non-negative. `-1024` is the unary negation operator `-` applied to the literal `1024`." | `-1024` = `-(1024)` |
| Underscores | "Mojo is more permissive than Python here. Consecutive and trailing underscores are allowed." | `1__000_` is valid |
| No leading zeros | "Leading zeros in decimal literals are not allowed. Use the `0o` prefix for octal." | `0123` is an error |
| Digit required after a base prefix | A base prefix must be followed by at least one digit. | `0x`, `0b`, `0o` are errors |

Source: <https://mojolang.org/docs/reference/literals/>.

```mojo
1_000_000  # Readable grouping
1__000_    # Also valid (consecutive and trailing underscores OK)
0123       # Error: leading zeros in decimal integer literals are not permitted
0o123      # OK: octal
0x         # Error: no digits specified for hex literal
0b         # Error: no digits specified for binary literal
0o         # Error: no digits specified for octal literal
```

Source: <https://mojolang.org/docs/reference/literals/>.

An integer literal materializes to the type the context requires, defaulting to
`Int`:

```mojo
var a: Int = 42            # Becomes Int
var b: Int8 = 42           # Becomes Int8
var c: Float32 = 42        # Becomes Float32
var d: UInt64 = 1_000_000  # Becomes UInt64
```

Source: <https://mojolang.org/docs/reference/numeric-types/>. `IntLiteral` is
arbitrary-precision at compile time, so compile-time arithmetic does not
overflow. The full numeric model is on
[Numeric types](numeric-types.md).

## Floating-point literals

> *Floating-point literals* represent numbers with a fractional or exponent part:

```mojo
1.0
3.14159
.5       # Fraction only (no integer part)
2.       # Integer part with decimal point
2.5e-3   # With exponent
1E10     # Capital E works too
```

### Lexical grammar

```text
floatnumber   → pointfloat | exponentfloat
pointfloat    → digitpart? fraction | digitpart "."
exponentfloat → (digitpart | pointfloat) exponent
fraction      → "." digitpart
exponent      → ("e" | "E") ("+" | "-")? digitpart
digitpart     → digit ("_" | digit)*
```

Source: <https://mojolang.org/docs/reference/literals/>.

### Rules

| Rule | Statement | Example |
|------|-----------|---------|
| Non-negative | "Floating-point literals are always non-negative. `-3.14` is the unary negation operator `-` applied to the literal `3.14`." | `-3.14` = `-(3.14)` |
| Exponent needs a digit | "When included, an exponent marker (`e` or `E`) must be followed by at least one digit." | `2.5e`, `2.5e-` are errors |
| Underscores | Underscores work as in integers. | `1_000.000_5` |

Source: <https://mojolang.org/docs/reference/literals/>. A decimal point is what
makes a numeric literal floating-point; see the types manual at
<https://mojolang.org/docs/manual/types/>.

A float literal materializes to the target float type, defaulting to `Float64`:

```mojo
var x: Float32 = 3.14     # Becomes Float32
var y: Float64 = 3.14     # Becomes Float64
var z: BFloat16 = 0.5     # Becomes BFloat16
```

Source: <https://mojolang.org/docs/reference/numeric-types/>.

## String literals

> *String literals* represent text values. Mojo supports single and double
> quotes, and a triple-quote form for multi-line strings:

```mojo
"Hello"
'world'
"""Multi-line
string
"""                # Includes final newline
'''Also
    multi-line'''  # Includes 4 spaces at the start of the second line
```

Source: <https://mojolang.org/docs/reference/literals/>.

| Form | Delimiters | Notes |
|------|------------|-------|
| Single-quoted | `'...'` | One line |
| Double-quoted | `"..."` | One line |
| Triple-quoted | `"""..."""`, `'''...'''` | Newlines included literally |
| Raw | `r"..."`, `R"..."` | Escapes disabled |
| Adjacent | `"a" "b"` | Joined into one string, including across an indented line |

Source: <https://mojolang.org/docs/reference/literals/>.

> Triple-quoted strings include any newlines literally. A backslash at the end of
> a line suppresses the newline, joining the next line directly:

```mojo
"""\
This string has no leading newline."""
```

> String literals on adjacent lines are joined into a single string. This works
> on one line or across lines when the continuation is indented:

```mojo
var x = "Hello, " "World"  # "Hello, World"

var y = "line one "
    "line two"             # "line one line two" (indented continuation)
```

> Prefix with `r` or `R` to create a *raw string* that disables escape
> processing:

```mojo
r"C:\path\to\file"  # Backslashes treated literally
```

Source: <https://mojolang.org/docs/reference/literals/>. Mojo source files are
UTF-8, so string literals may contain non-ASCII characters directly
(`var wave = "👋"`). Source:
<https://mojolang.org/docs/reference/literals/>.

### Escape sequences

> Mojo recognizes these escape sequences in non-raw string literals:

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

> - `\uHHHH` accepts code points from U+0000 to U+FFFF
> - `\UHHHHHHHH` accepts the full Unicode range, U+0000 to U+10FFFF
>
> Both forms reject surrogate code points (U+D800 to U+DFFF), which are reserved
> for UTF-16 encoding. Code points above U+FFFF require `\U`, not a UTF-16
> surrogate pair.

Source: <https://mojolang.org/docs/reference/literals/>.

```mojo
var wave = "\U0001F44B"   # 8-digit hex escape, 👋
var euro = "\u20AC"       # 4-digit hex escape, €
```

### `StringLiteral` and materialization

A source string literal has compile-time type `StringLiteral`; the type reference
states it "materializes to a `String` at runtime, or to a `StringSpan` when the
context requires a view." Source:
<https://mojolang.org/docs/reference/types/>. Positional indexing on
`StringLiteral` was removed in 1.0; use `[byte=]`, `[codepoint=]` or
`[grapheme=]`. Source: <https://mojolang.org/releases/v1.0.0/>. The string types
are documented on [Bool and strings](../types/bool-and-strings.md).

## T-string literals

> *T-string literals* support expression interpolation using `{}`:

```mojo
var name = "World"
var greeting_template = t"Hello, {name}!"   # "Hello, World!"
var result_template = t"1 + 1 = {1 + 1}"    # "1 + 1 = 2"
```

> Expressions inside `{}` are evaluated at runtime. Adjacent t-string literals
> are joined, just like regular string literals. To use them as strings except in
> print statements, cast them to `String`:

```mojo
var name = "Alice"
var greeting = t"Hello, {name}!"    # Type is T-string
print(greeting)                     # Prints "Hello, Alice!"
var greeting_str = String(greeting) # Convert to regular String
```

> T-strings can be triple-quoted and combined with the raw prefix (any case
> combination of `r`/`R` and `t`/`T`, in either order):

```mojo
t"""
Hello, {name}!
"""

rt"Path: {base}\subdir"  # Raw t-string: backslashes are literal
```

> Use `{{` and `}}` to include literal braces in a t-string:

```mojo
t"Use {{braces}} in t-strings"  # "Use {braces} in t-strings"
```

> T-strings can be nested. An interpolation expression can itself contain
> t-strings, up to 20 levels deep.

```mojo
var name = "world"
var greeting = t"Hello, {t"dear {name}"}!"
print(greeting) # "Hello, dear world!"
```

Source: <https://mojolang.org/docs/reference/literals/>.

| Feature | Rule |
|---------|------|
| Interpolation | `{expr}` evaluated at runtime |
| Literal braces | Double them: `{{` and `}}` |
| Prefixes | Any case combination of `r`/`R` and `t`/`T`, in either order |
| Triple-quoted | Supported |
| Adjacent joining | Supported, as for strings |
| Nesting | Up to 20 levels deep |
| Runtime type | `TString`, lazy; `String(t)` converts |

## Boolean literals

> `True` and `False` represent boolean truth values.

```mojo
var x = True
var y = False
```

Source: <https://mojolang.org/docs/reference/literals/>. `True` and `False` are
reserved keywords; the `Bool` type is covered on
[Bool and strings](../types/bool-and-strings.md).

## None literal

> `None` represents the absence of a value. It's the only value of type
> `NoneType`.

```mojo
var x: NoneType = None
```

> A function without an explicit return type returns `None`. These two
> declarations are equivalent:

```mojo
def greet():
    print("hello")

def greet() -> None:
    print("hello")
```

Source: <https://mojolang.org/docs/reference/literals/>. `None` is also the empty
value for `Optional`; see
[Optionals and nullability](../types/optionals-and-nullability.md).

## Self literal

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

> `Self` (capital S) is a keyword that refers to the type. `self` (lowercase) is
> a conventional argument name for the instance.

Source: <https://mojolang.org/docs/reference/literals/>. `Self` is one of the 34
reserved keywords ([Keywords](../keywords/index.md)); structs use `Self.T` to
name a parameter inside the body — see
[Struct declarations](struct-declarations.md).

## Discard pattern

> The underscore `_` discards a value in an assignment:

```mojo
_, var y = get_pair()  # Ignore the first element
```

Source: <https://mojolang.org/docs/reference/literals/>. `_` is an identifier, not
a keyword. It has two further documented uses: silencing an unused-result
warning (`_ = update()`; see [Simple statements](simple-statements.md)) and
marking a value's last use to control destruction. Source:
<https://mojolang.org/docs/reference/simple-statements/>.

## Ellipsis literal

> `...` marks a trait method as required. Conforming types must provide their own
> implementation. It's only valid inside trait definitions:

```mojo
trait Drawable:
    def draw(self) -> None: ...   # Required: conforming types must implement
```

> `...` and `pass` aren't interchangeable. `pass` is a no-op statement that
> provides an empty body. `...` is a requirement marker that means "you must
> implement this."

Source: <https://mojolang.org/docs/reference/literals/>. The trait reference adds
that `pass` counts as a provided implementation and is "only valid when the
method returns `None`", while `...` marks a required method stub. Source:
<https://mojolang.org/docs/reference/trait-declarations/>. See
[Trait declarations](trait-declarations.md).

## Literal grammar (consolidated)

```text
literal        → integer | floatnumber | stringliteral | tstringliteral
               | "True" | "False" | "None" | "Self" | "_" | "..."

integer        → decinteger | bininteger | octinteger | hexinteger
decinteger     → nonzerodigit ("_" | digit)* | "0"+ ("_" | "0")*
bininteger     → "0" ("b" | "B") ("_" | bindigit)+
octinteger     → "0" ("o" | "O") ("_" | octdigit)+
hexinteger     → "0" ("x" | "X") ("_" | hexdigit)+

floatnumber    → pointfloat | exponentfloat
pointfloat     → digitpart? fraction | digitpart "."
exponentfloat  → (digitpart | pointfloat) exponent
fraction       → "." digitpart
exponent       → ("e" | "E") ("+" | "-")? digitpart
digitpart      → digit ("_" | digit)*

stringliteral  → [stringprefix] (shortstring | longstring)
stringprefix   → "r" | "R"                         # raw
shortstring    → "'" shortstringitem* "'" | '"' shortstringitem* '"'
longstring     → "'''" longstringitem* "'''" | '"""' longstringitem* '"""'

tstringliteral → [tstringprefix] (shortstring | longstring)
tstringprefix  → (r|R)(t|T) | (t|T)(r|R) | t | T  # raw/t in any order
```

Sources: <https://mojolang.org/docs/reference/literals/> and
<https://mojolang.org/docs/reference/expressions/>.

## Pitfalls

- **Writing `0123` for octal.** Leading zeros in a decimal literal are an error;
  use `0o123`. Verified above.
- **Leaving out digits after a base prefix.** `0x`, `0b` and `0o` alone are
  errors. Verified above.
- **Ending a float with an incomplete exponent.** `2.5e` and `2.5e-` are errors.
  Verified above.
- **Expecting a minus sign to be part of the literal.** `-1024` is unary negation
  applied to `1024`, which matters for negative indexing (a compile-time error in
  1.x). Verified above.
- **Using a UTF-16 surrogate pair for an astral character.** Surrogates are
  rejected; write the full code point with `\U`. Verified above.
- **Using a `TString` where a `String` is needed.** A `TString` is lazy and has
  its own type; cast with `String(t)` outside `print()`. Verified above.
- **Forgetting to double literal braces in a t-string.** `{` starts an
  interpolation; write `{{` and `}}`. Verified above.
- **Conflating `Self` and `self`.** `Self` is the type, `self` is the instance
  argument name. Verified above.
- **Treating `_` as a keyword.** It is an ordinary identifier that discards.
  Verified above.
- **Using `...` as a no-op statement.** `pass` is the no-op; `...` is a
  required-method marker valid only in a trait. Verified above.
- **Indexing a string literal positionally.** Removed for `StringLiteral` in 1.0;
  use `[byte=]`, `[codepoint=]` or `[grapheme=]`. Source:
  <https://mojolang.org/releases/v1.0.0/>.

## Sources

- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Mojo numeric types reference: <https://mojolang.org/docs/reference/numeric-types/>
- Mojo types reference: <https://mojolang.org/docs/reference/types/>
- Mojo expression reference: <https://mojolang.org/docs/reference/expressions/>
- Mojo simple statements reference: <https://mojolang.org/docs/reference/simple-statements/>
- Mojo trait declarations reference: <https://mojolang.org/docs/reference/trait-declarations/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
