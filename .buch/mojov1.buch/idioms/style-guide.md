# Style guide

This page is the house style for Mojo 1.x code: how to name things, how to format,
how to write docstrings, how to lay out files and modules, and which spelling of
each construct is current. It exists because an agent writing Mojo needs one
unambiguous answer per decision.

## What the official docs actually specify

The official 1.x documentation does **not** publish a single consolidated style
page on `mojolang.org`. The conventions are stated in four places instead, and
this page collects them:

| Topic | Official page that states it |
|-------|------------------------------|
| Identifier rules (regular and escaped) | the identifiers reference <https://mojolang.org/docs/reference/keywords/> |
| Field naming conventions | structs manual, "Field conventions" <https://mojolang.org/docs/manual/structs/> |
| Type/value parameter naming | parameterized-declarations manual <https://mojolang.org/docs/manual/generics/> |
| Docstring style and sections | docstring reference <https://mojolang.org/docs/reference/docstrings/> |
| Formatting | `mojo format` CLI reference <https://mojolang.org/docs/cli/format/> |
| File and module layout | modules and packages manual <https://mojolang.org/docs/manual/packages/> |

> **Open question:** the official docs are inconsistent about formatting beyond
> the formatter's default. The manual says only "we prefer 4 spaces" for
> indentation and gives no line-length rule, while `mojo format` documents a
> default max line length of 80. This page treats the formatter's defaults as the
> rule and recommends running `mojo format` rather than hand-formatting. Verify
> against the next upstream release if the formatter's defaults change. Sources:
> <https://mojolang.org/docs/manual/basics/> and
> <https://mojolang.org/docs/cli/format/>.

Two rules override everything below:

1. **Write the current spelling.** Every construct has exactly one 1.x name; the
   old names appear only in [`versions/1.0.0`](../versions/1.0.0.md).
2. **Let the formatter decide whitespace.** Run `mojo format`; do not spend
   reasoning on alignment.

## Identifiers

The official rule for a regular identifier is a regular expression:

> A regular identifier starts with a letter or underscore, followed by any
> combination of letters, digits, and underscores:
>
> ```text
> identifier → [a-zA-Z_][a-zA-Z0-9_]*
> ```

Identifiers are case-sensitive: "`MyStruct` and `mystruct` are different names."

Source: <https://mojolang.org/docs/reference/keywords/>.

An **escaped identifier** is enclosed in backticks and may contain almost
anything:

```mojo
`struct`        # Use a keyword as a name
`日本語の変数`    # Non-ASCII identifier
`my value`      # Spaces in a name
```

> Escaped identifiers are useful when calling into external code that uses a Mojo
> keyword as a name, or when writing identifiers in natural language. Empty
> backtick identifiers are not allowed.

Source: <https://mojolang.org/docs/reference/keywords/>.

**Idiom: use an escaped identifier only at a real boundary.** The documented uses
are calling into external code that already uses the name, or writing names in a
natural language. For a name you choose yourself, pick a normal identifier.

```mojo
# Idiomatic: interoperating with a foreign symbol named like a keyword.
def `match`() -> Int:
    return 0

# Wrong: using backticks to avoid thinking of a name.
def `process`():
    pass
```

**Why:** backticks are documented as a workaround, not a style; the keyword
reference calls them "useful when calling into external code", and the
function-declarations reference frames them the same way — a way to name a
function after a keyword, not a general naming tool. Sources:
<https://mojolang.org/docs/reference/keywords/> and
<https://mojolang.org/docs/reference/function-declarations/>.

## Naming conventions

### Fields

The structs manual states the field conventions directly:

> You should use conventional naming for field members:
>
> - Prefer lowercase snake_case for field names (for example, `user_count`,
>   `max_capacity`).
> - Use descriptive names that indicate purpose, and not their type (for example,
>   `error_msg` not `msg_string`).
> - For members meant for internal use or to maintain invariants, add an
>   underscore prefix (for example, `_private_field`).
> - For boolean fields, use `is_` or `has_` prefixes (for example, `is_valid`,
>   `has_data`).
> - Avoid single-letter names except for common mathematical conventions (such as
>   `x`, `y`, `z` for coordinates).

Source: <https://mojolang.org/docs/manual/structs/>.

```mojo
# Idiomatic
@fieldwise_init
struct Job:
    var name: String
    var retry_count: Int
    var is_complete: Bool
    var _cache: List[Int]      # internal, invariant-maintaining

# Wrong
@fieldwise_init
struct job:                 # type names are PascalCase
    var Name: String        # fields are snake_case
    var retryCnt: Int       # abbreviate less; say what it is
    var complete_flag: Bool # boolean fields use is_/has_
```

### Types, traits, methods, values

| Kind | Convention | Evidence |
|------|-----------|----------|
| Struct, trait, type alias | `PascalCase` (`MyPair`, `Copyable`, `PathLike`) | traits reference names capabilities in PascalCase; structs are named types |
| Function, method, field, variable | `lower_snake_case` | fields convention above; manual examples (`get_sum`, `user_count`) |
| Compile-time *type* parameter | `PascalCase`, short (`T`, `E`) or descriptive (`ErrorType`, `Element`) | parameterized-declarations manual |
| Compile-time *value* parameter | `lower_snake_case`, descriptive (`capacity`, `hasher`, `tile_x`) | parameterized-declarations manual |
| Module file | `lower_snake_case.mojo` (`mymodule.mojo`) | modules manual |
| Package directory | lowercase, matches the id it is imported as (`mypackage/`) | modules manual |

The parameter-naming rule is quoted, because it is the one agents get wrong most
often:

> Type parameter names use PascalCase, short (`T`, `E`) or descriptive
> (`ErrorType`, `Element`). By convention, `T`, `U`, `V` are general types;
> `K`/`V` for key-value pairs; `E` for errors; `H` for hashers. Value parameter
> names use lower_snake_case and should be descriptive (`capacity`, `hasher`,
> `tile_x`).

Source: <https://mojolang.org/docs/manual/generics/>.

Trait names describe a capability, which is why they read as adjectives or agent
nouns: "Capabilities gained by conformance: `Equatable`, `Copyable`,
`PathLike`." Source: <https://mojolang.org/docs/reference/trait-declarations/>.

```mojo
# Idiomatic: value parameter is snake_case, type parameter is PascalCase.
def make_filled[T: Copyable & Deinitable, size: Int](splat_value: T) -> List[T]:
    ...

# Wrong: a value parameter in PascalCase, a type parameter in snake_case.
def make_filled[t: Copyable & Deinitable, Size: Int](splat_value: t) -> List[t]:
    ...
```

### Dunder methods are lowercase with underscores

Lifecycle and operator methods are fixed names, and the current spelling uses
`__deinit__` (not the pre-1.0 `__del__`) and `__init__` with the named arguments
`copy` and `move`:

```mojo
struct Resource:
    var handle: Int

    def __init__(out self, handle: Int):
        self.handle = handle

    def __deinit__(deinit self):       # current name
        close(self.handle)
```

Sources: <https://mojolang.org/docs/reference/function-declarations/> and
<https://mojolang.org/releases/v1.0.0/>.

## Formatting

### Run the formatter

> Formats the given set of Mojo sources using a Mojo-specific lint tool.

```sh
mojo format mymodule.mojo
mojo format -l 100 src/          # max line length 100 (default 80)
```

> `--line-length <INTEGER>`, `-l <INTEGER>` — Sets the max character line length.
> Default is 80.

Source: <https://mojolang.org/docs/cli/format/>.

**Idiom:** write code, then run `mojo format`; commit the formatted result.

### Indentation and line breaks

> You can use any number of spaces or tabs for your indentation (we prefer 4
> spaces).

> All code statements in Mojo end with a newline. The Mojo compiler is fairly
> lenient in allowing extra line breaks. As a rule of thumb, you can always break
> statements between a pair of parentheses (`()`), square brackets (`[]`), or
> curly braces (`{}`):

Source: <https://mojolang.org/docs/manual/basics/>.

Two 1.x rules constrain line breaks further: the compiler "rejects newlines in
the middle of certain statements" — between `def`/`struct`/`trait`/`comptime`
and the identifier, between `async` and `def`, and anywhere inside an `import`
statement except a parenthesized import list. Source:
<https://mojolang.org/releases/v1.0.0/>.

```mojo
# Idiomatic: break the long argument list at a bracket boundary.
matrix_multiply(
    matrix_a,
    matrix_b,
    result_matrix,
)

# Wrong: split the declaration header itself.
# def
#     greet(name: String):
```

### One statement per line

A single short statement may share the header line of an `if`, but the
compound-statements reference discourages it:

> When the body is a single simple statement, you can write it on a single line,
> although many style guides discourage this.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

```mojo
# Idiomatic for anything non-trivial:
if temp > 30:
    print("hot")

# Tolerated but discouraged:
if temp > 30: print("hot")
```

## Docstring style

Docstrings are the one place the official documentation is prescriptive about
text. The rules:

### Summary line

> A docstring's first sentence is its summary. Summaries appear in index views
> and search results.

| Declaration | Pattern | Example |
|-------------|---------|---------|
| Function or method | Present-tense verb | `Clamps a value to the range [low, high].` |
| Struct or trait | Noun phrase or present-tense verb | `A fixed-capacity circular buffer.` |
| Field or `comptime` | Noun phrase | `The red channel, in [0, 255].` |

> Start the summary with a capital letter and avoid repeating the declaration
> name. Prefer ending the summary with a period; the compiler also accepts `!`,
> `?`, or a closing backtick.

Source: <https://mojolang.org/docs/reference/docstrings/>.

The compiler enforces this in strict mode (public declarations): the summary
"must begin with a capital letter or non-alpha character" and "must end with `.`,
`!`, `?`, or `` ` ``". Source: <https://mojolang.org/docs/reference/docstrings/>.

### Sections

The four compiler-checked labels are `Parameters:` (compile-time parameters),
`Args:` (runtime arguments), `Returns:`, and `Raises:`. Mojo uses `Args`, not
`Arguments`. Custom labels such as `Preconditions:`, `Constraints:`, `Safety:`,
`Performance:` and `See:` are conventions, not checked. The recommended order is:

> `Parameters:` → `Args:` → `Returns:` → `Raises:` → `Preconditions:` →
> `Constraints:` → `Safety:` → `Performance:` → `See:` → `Examples:`
>
> Include only the sections that apply, and put `Examples:` last.

Source: <https://mojolang.org/docs/reference/docstrings/>.

### Placement

| Declaration | Position |
|-------------|----------|
| Function or method | After the signature, before the body |
| Struct or trait | After the opening line, before members |
| Field or `comptime` | After the declaration, not before it |
| Module or Package | First string in the file, after imports |

Source: <https://mojolang.org/docs/reference/docstrings/>.

A complete, stylistically-correct example:

```mojo
def clamp[T: Comparable & ImplicitlyCopyable](val: T, lo: T, hi: T) -> T:
    """Clamps a value to the range [lo, hi].

    Returns the value unchanged when it already lies within the range.

    Parameters:
        T: The type of the value and bounds. Must be comparable and
            implicitly copyable.

    Args:
        val: The value to clamp.
        lo: The inclusive lower bound.
        hi: The inclusive upper bound.

    Returns:
        `lo` if `val < lo`, `hi` if `val > hi`, otherwise `val`.

    Examples:

    ```mojo
    print(clamp(5, 1, 10))   # 5
    print(clamp(-3, 1, 10))  # 1
    ```
    """
    if val < lo:
        return lo
    if val > hi:
        return hi
    return val
```

Sources for the section semantics: docstring reference
<https://mojolang.org/docs/reference/docstrings/> and the function example in the
function-declarations reference
<https://mojolang.org/docs/reference/function-declarations/>.

### Hide internals, do not omit them

Use `@doc_hidden` for lifecycle and helper declarations that are not part of the
public API:

```mojo
@doc_hidden
def _internal_helper(data: Pointer[UInt8]) -> Int:
    pass
```

> The `@doc_hidden` decorator excludes a declaration from generated
> documentation. The declaration still compiles normally but produces no
> documentation output.

Source: <https://mojolang.org/docs/reference/docstrings/> (its example still
spells the pointer `UnsafePointer`, which 1.0 unified into `Pointer`; use
`Pointer`). See [@doc_hidden](../decorators/doc-hidden.md).

## File and module organisation

A **module** is one source file; a **package** is a directory that contains an
`__init__.mojo`:

> A Mojo package is just a collection of Mojo modules in a directory that
> includes an `__init__.mojo` file.

> The `__init__.mojo` file is essential. If you don't have it, Mojo won't
> recognize the directory as a package and you can't import `mymodule`.

Source: <https://mojolang.org/docs/manual/packages/>.

The idiomatic layout, from the modules manual's own example:

```text
main.mojo
mypackage/
    __init__.mojo
    mymodule.mojo
```

```mojo
# mypackage/mymodule.mojo — defines APIs, has no main().
struct MyPair:
    var first: Int
    var second: Int
```

```mojo
# mypackage/__init__.mojo — re-export, so callers import from the package name.
from .mymodule import MyPair
```

```mojo
# main.mojo — the executable entry point.
from mypackage import MyPair

def main():
    var mine = MyPair(2, 4)
```

Source: <https://mojolang.org/docs/manual/packages/>.

The rules that make this work:

- **A library module has no `main()`.** "Notice that this code has no `main()`
  function, so you can't execute `mymodule.mojo`." Source:
  <https://mojolang.org/docs/manual/packages/>.
- **Relative imports use `from`.** In 1.0 the `import .foo` form was removed:
  "Relative imports must use `from` (`from . import foo`)". Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Re-export from `__init__.mojo`** so callers can write
  `from mypackage import MyPair` instead of
  `from mypackage.mymodule import MyPair`. Source:
  <https://mojolang.org/docs/manual/packages/>.
- **Top-level code in `__init__.mojo` does not run.** "Currently, top-level code
  is not supported in `.mojo` files, so unlike Python, you can't write code in
  `__init__.mojo` that executes upon import." Source:
  <https://mojolang.org/docs/manual/packages/>.
- **A module may not import its own name.** Source:
  <https://mojolang.org/releases/v1.0.0/>.

For distribution, `mojo precompile mypackage -o mypack.mojoc` produces a
precompiled package whose file name is the import name. Source:
<https://mojolang.org/docs/manual/packages/>. The packaging details live in
[packaging and distribution](../project/packaging-and-distribution.md).

## How to spell the current constructs

This is the stylistic core of 1.x: one name per concept. The table lists the
decision to make and the current spelling; the pre-1.0 spellings exist only in
[`versions/1.0.0`](../versions/1.0.0.md).

| Decision | Current 1.x spelling | Pre-1.0 spelling to avoid |
|----------|----------------------|---------------------------|
| Function declaration | `def` | `fn` |
| Variable declaration | `var x = 0` | implicit `x = 0` |
| Read-only argument/capture convention | `imm` | `read` |
| Owned argument | `var` | `owned` |
| Destructive argument / destructor receiver | `deinit` | `owned` in `__deinit__` |
| Fixed-size array | `Array[T, length]` | `InlineArray` |
| String view | `StringSpan` | `StringSlice` |
| Length of a collection or vector | `length` (or `len(x)`) | `.size` |
| Destructible trait | `Deinitable` | `ImplicitlyDestructible` |
| Destructor | `__deinit__` | `__del__` |
| Move constructor | `__init__(out self, *, move: Self)` | `__moveinit__` |
| Copy constructor | `__init__(out self, *, copy: Self)` | `__copyinit__` |
| Pointer | `Pointer`, with `unsafe_*` operations | `UnsafePointer` + bare ops |
| Explicit copy | `.copy()` or `^` | bare assignment of a copyable |
| Compile-time binding | `comptime` | `alias` |
| Package file | `.mojoc` | `.mojopkg` |
| Package command | `mojo precompile` | `mojo package` |

Sources: <https://mojolang.org/releases/v1.0.0/>,
<https://mojolang.org/releases/v1.0.0b2/> and
<https://mojolang.org/docs/reference/keywords/>. The `alias` → `comptime`
migration and its documentation gap are recorded in
[`keyword-conventions/alias`](../keyword-conventions/alias.md).

```mojo
# Idiomatic 1.x
comptime BUFFER = 256

def read_all(buf: Pointer[UInt8], length: Int) -> Int:
    var total = 0
    for i in range(length):
        total += Int(buf[unsafe_offset=i])
    return total

# Wrong: three pre-1.0 spellings in four lines.
# alias BUFFER = 256
# fn read_all(buf: UnsafePointer[UInt8], size: Int) -> Int:
#     ...
```

**Why:** the 1.0.0 release notes state the "one name, and one type, per concept"
principle explicitly, and nearly every old spelling still compiles through a
deprecated alias with a warning. Writing the old spelling compiles today and
breaks at an unannounced future release. Source:
<https://mojolang.org/releases/v1.0.0/>.

## A complete stylistically-correct file

```mojo
"""Demonstrates the house style for a Mojo 1.x module."""

from std.math import sqrt


comptime DEFAULT_TOLERANCE: Float64 = 0.001


@fieldwise_init
struct Vector(Copyable):
    """A two-dimensional vector of `Float64` values."""

    var x: Float64
    """The x component."""

    var y: Float64
    """The y component."""

    def length(self) -> Float64:
        """Returns the Euclidean length of the vector.

        Returns:
            The square root of `x * x + y * y`.
        """
        return sqrt(self.x * self.x + self.y * self.y)

    def is_zero(self) -> Bool:
        """Returns `True` when both components are zero.

        Returns:
            `True` if the vector is within `DEFAULT_TOLERANCE` of zero.
        """
        return self.length() < DEFAULT_TOLERANCE


def main():
    var v = Vector(3.0, 4.0)
    print(v.length())   # 5.0
    print(v.is_zero())  # False
```

## Pitfalls

- **Writing `fn`.** It is an error in 1.x, not a warning. Verified above.
- **Using `.size`.** Renamed to `length`; `.size` remains only as a deprecated
  alias. Verified above.
- **Writing `read`/`owned`/`Inherited`.** `imm` and `var`/`deinit` are current.
  Verified above.
- **Naming a boolean field `complete` instead of `is_complete`.** The official
  field convention is the `is_`/`has_` prefix. Verified above.
- **Using PascalCase for a compile-time value parameter.** It is
  `lower_snake_case` by convention; reserve PascalCase for type parameters.
  Verified above.
- **Writing `Arguments:` in a docstring.** The label is `Args:`. Verified above.
- **Starting a public summary with a lowercase letter or ending without
  punctuation.** Strict mode warns. Verified above.
- **Putting a field docstring before the field.** Field and `comptime` docstrings
  go *after* the declaration. Verified above.
- **Splitting a `def`/`struct`/`trait`/`comptime` header across lines.** 1.x
  rejects it. Verified above.
- **Using `import .foo`.** Removed; write `from . import foo`. Verified above.
- **Putting executable code in `__init__.mojo`.** Top-level code does not run;
  only declarations and re-exports belong there. Verified above.
- **Formatting by hand.** Run `mojo format`; the default line length is 80.
  Verified above.
- **Treating backtick identifiers as normal names.** They are an interop
  workaround. Verified above.

## Sources

- Mojo identifiers, keywords, and conventions reference: <https://mojolang.org/docs/reference/keywords/>
- Mojo structs (manual) — field conventions: <https://mojolang.org/docs/manual/structs/>
- Mojo parameterized declarations (manual) — naming conventions: <https://mojolang.org/docs/manual/generics/>
- Mojo docstring reference — summary and section rules: <https://mojolang.org/docs/reference/docstrings/>
- Mojo modules and packages (manual): <https://mojolang.org/docs/manual/packages/>
- Mojo language basics (manual) — indentation and line breaks: <https://mojolang.org/docs/manual/basics/>
- Mojo compound statements reference — single-line bodies: <https://mojolang.org/docs/reference/compound-statements/>
- Mojo function declarations reference — escaped identifiers and lifecycle methods: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo trait declarations reference — capability naming: <https://mojolang.org/docs/reference/trait-declarations/>
- `mojo format`: <https://mojolang.org/docs/cli/format/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
- Mojo v1.0.0b2 release notes: <https://mojolang.org/releases/v1.0.0b2/>
