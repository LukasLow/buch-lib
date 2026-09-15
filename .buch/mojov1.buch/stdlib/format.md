# format

`format` defines how Mojo types turn themselves into text.

> Provides formatting traits for converting types to text.

> The `format` package provides traits that control how types format themselves
> as text and where that text gets written. The `Writable` trait describes how a
> type converts itself to UTF-8 text, while the `Writer` trait accepts formatted
> output from writable types. Together, they enable efficient formatting without
> unnecessary allocations by writing directly to destinations like files, strings,
> or network sockets.

> Use this package to implement custom text formatting for your types, control
> output representation, or write formatted data directly to various destinations.

Source: <https://mojolang.org/docs/std/format/>.

## `Writable`

> A trait for types that can format themselves as text.

Source: <https://mojolang.org/docs/std/format/Writable/>.

Its best feature for everyday code: **the default implementation is
reflection-based**, so a simple struct needs no method bodies.

```mojo
@fieldwise_init
struct Point(Writable):
    var x: Float64
    var y: Float64

var p = Point(1.5, 2.7)
print(p)       # Point(x=1.5, y=2.7)
print(repr(p)) # Point(x=Float64(1.5), y=Float64(2.7))
```

Source: <https://mojolang.org/docs/std/format/>.

The two methods:

| Method | Called by | Default output |
|--------|-----------|----------------|
| `write_to(self, mut writer)` | `print()`, `String()`, format strings | `TypeName(field1=value1, ...)` |
| `write_repr_to(self, mut writer)` | `repr(value)`, the `{!r}` specifier | Same shape, using each field's `write_repr_to` |

Sources: <https://mojolang.org/docs/std/format/Writable/>,
<https://mojolang.org/docs/std/format/>.

Override either one for custom output:

```mojo
@fieldwise_init
struct Point(Writable):
    var x: Float64
    var y: Float64

    def write_to(self, mut writer: Some[Writer]):
        writer.write("(", self.x, ", ", self.y, ")")

    def write_repr_to(self, mut writer: Some[Writer]):
        writer.write("Point: x=", self.x, ", y=", self.y)

var p = Point(1.5, 2.7)
print(p)       # (1.5, 2.7)
print(repr(p)) # Point: x=1.5, y=2.7
```

Source: <https://mojolang.org/docs/std/format/>.

## `Writer`

> A destination for formatted text output.

Source: <https://mojolang.org/docs/std/format/Writer/>.

`Writer` has exactly one **required** method and one provided convenience
method:

```text
def write_string(mut self, string: StringSpan)      # required
def write[*Ts: Writable](mut self, *args: *Ts.values) # provided
```

The core method "accepts a `StringSlice` for efficient, allocation-free output";
`write()` accepts multiple `Writable` arguments at once. In current Mojo the
parameter type is `StringSpan`. Source:
<https://mojolang.org/docs/std/format/Writer/>.

> **Open question:** the official `Writer` page still writes `StringSlice` in
> that sentence, but 1.0 renamed `StringSlice` to `StringSpan` (see
> <https://mojolang.org/releases/v1.0.0/>). The signature and example above use
> the current `StringSpan`; read the quoted `StringSlice` as documentation lag.

Implementing a custom destination is small:

```mojo
@fieldwise_init
struct StringBuilder(Writer):
    var s: String

    def write_string(mut self, string: StringSpan):
        self.s += string

var builder = StringBuilder("")
builder.write("Count: ", 42)
print(builder.s)   # Count: 42
```

Source: <https://mojolang.org/docs/std/format/Writer/>.

## `repr`

> Implements the `repr()` function for producing string representations of
> values.

Source: <https://mojolang.org/docs/std/format/repr/>.

```mojo
def repr[...](...) -> String
```

> Returns the string representation of the given value.

Source: <https://mojolang.org/docs/std/format/repr/repr/>.

`repr()` calls `write_repr_to()`. One documented convention to remember:
"Mojo's repr always prints single quotes (`'`) at the start and end of the repr.
Any single quote inside a string should be escaped (`\'`)." Source:
<https://mojolang.org/docs/std/format/Writable/>.

## `TString`

> A template string that captures interpolated values at compile-time.

Source: <https://mojolang.org/docs/std/format/tstring/>.

The `t"..."` form is the idiomatic way to interpolate values into a string:

```mojo
def main():
    var name = "Mojo"
    var version = 1
    print(t"{name} v{version}")   # Mojo v1
```

`String` has a constructor from `TString` (`def __init__(out self, tstring:
TString)`), which makes conversion explicit. Source:
<https://mojolang.org/docs/std/collections/string/string/String/>.

## Idioms

- **Conform to `Writable`, do not hand-roll `to_string`.** The default
  implementation gives you both `print` and `repr` for free.
- **Override `write_to` for the user-facing form and `write_repr_to` for the
  debug form.** The default `repr` shows each field's own repr, which is useful
  for debugging but verbose.
- **Write directly to the `Writer`** (`writer.write(a, b, c)`) rather than
  building intermediate strings — that is the allocation-free path.
- **Use `t"..."` for interpolation** and `String.format()` for template-style
  formatting. Both are documented; `format()` supports manual indexing
  (`"{0} {1} {0}"`) and automatic indexing (`"{} {}"`). Source:
  <https://mojolang.org/docs/std/collections/string/string/String/>.
- **Print a `Writable` directly.** The `String` docs note it is more efficient to
  pass a `Writable` straight to `print()` than to convert it to a `String` first.

## Pitfalls

- **Mutually recursive types can hang the compiler.** The reflection-based
  defaults "iterate over all fields at compile time. For mutually recursive types
  (e.g., struct `A` has a field of type `List[B]` and struct `B` has a field of
  type `A`), this creates an infinite monomorphization cycle that causes the
  compiler to hang. To fix this, provide explicit `write_to()` and
  `write_repr_to()` implementations for at least one type in the cycle." Source:
  <https://mojolang.org/docs/std/format/Writable/>.
- **Implementing only `write_string` and expecting `Writable`.** These are two
  different traits: `Writer` is a destination, `Writable` is a formatter. A type
  can be one, the other, or both (`String` is both).
- **Forgetting `mut writer`.** The writer is mutated in place; the convention is
  required by the trait.
- **Expecting the default `repr` to be short.** It calls each field's
  `write_repr_to`, so a nested struct produces nested output.
- **Assuming `print()` requires a `String`.** It accepts any `Writable`.
- **Using the old trait name.** The trait that accepts output is `Writer` and the
  formatter is `Writable`; the `io` package description also refers to the
  `Writable`/`Writer` pair. Source: <https://mojolang.org/docs/std/io/>.

## Stability

The `format` package page and the `Writable`, `Writer`, `repr` and `tstring`
pages show **no `@stable(since=...)` marker** and no stability badges. Under the
standard-library rule — "We consider standard library APIs unstable unless
specifically marked stable" — these traits are **unstable by default**. Note that
the trait *concept* is a core part of typing a type as printable; use the
conformance regardless, and read the package page for current member signatures.
Sources: <https://mojolang.org/docs/std/format/>,
<https://mojolang.org/docs/std/format/Writable/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `format` package: <https://mojolang.org/docs/std/format/>
- Mojo `Writable` trait: <https://mojolang.org/docs/std/format/Writable/>
- Mojo `Writer` trait: <https://mojolang.org/docs/std/format/Writer/>
- Mojo `repr` module: <https://mojolang.org/docs/std/format/repr/>
- Mojo `repr` function: <https://mojolang.org/docs/std/format/repr/repr/>
- Mojo `tstring` module: <https://mojolang.org/docs/std/format/tstring/>
- Mojo `TString` struct: <https://mojolang.org/docs/std/format/tstring/TString/>
- Mojo `String` struct: <https://mojolang.org/docs/std/collections/string/string/String/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
