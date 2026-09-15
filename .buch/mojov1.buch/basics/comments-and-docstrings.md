# Comments and docstrings

Mojo has one comment form, `#`, and one documentation form, the docstring — a
string literal placed at a declaration. Docstrings are not comments: they are a
special use of multi-line string syntax, and the compiler checks them. This page
covers both, with the official placement table, the summary-line rules, the
labelled sections and what the compiler validates.

## Comments

Mojo has a single comment form: the line comment introduced by `#`.

> You can create a one-line comment using the hash `#` symbol:

```mojo
# This is a comment. The Mojo compiler ignores this line.
```

Comments may also follow code on the same line:

```mojo
var message = "Hello, World!"  # This is also a valid comment
```

Source: <https://mojolang.org/docs/manual/basics/>.

There is **no block-comment syntax documented** in the official 1.x manual or
language reference:

> **Open question:** Mojo is commonly assumed to be Python-like, and Python has
> no block comments either — but this book found **no official 1.x statement**
> that block comments are absent, and no `/* ... */` form anywhere in the
> official manual or reference. The documented comment form is `#` only. Verify
> with the compiler before asserting that a block-comment syntax exists or that
> it is impossible.

Source: <https://mojolang.org/docs/manual/basics/>. When you need to disable
several lines, comment each line with `#`: comment out the whole line, or place
a `#` before the code on each line, whichever keeps the indentation valid. The
comment and whitespace rules of the file as a whole are collected on
[Syntax](syntax.md).

## What a docstring is

> Mojo uses docstring literals to generate API reference documentation data,
> which can be processed to produce page content or read directly from source.
> Place docstrings immediately after declarations.

Source: <https://mojolang.org/docs/reference/docstrings/>.

The manual is precise about the construct:

> Technically, docstrings aren't _comments_, they're a special use of Mojo's
> syntax for multi-line string literals.

Source: <https://mojolang.org/docs/manual/basics/>. So a docstring is a real
string value at that point in the program, not something the lexer strips. The
string literal forms (including triple quotes and the raw prefix) are on
[Literals](literals.md).

A complete example, which the reference uses to open the page:

```mojo
def greet(name: String) -> String:
    """Returns a greeting string for the given name.

    Produces a simple `"Hello, name!"` string suitable for
    display or logging.

    Args:
        name: The name to include in the greeting.

    Returns:
        A greeting of the form `"Hello, name!"`.
    """
    return "Hello, " + name + "!"
```

Source: <https://mojolang.org/docs/reference/docstrings/>.

Docstrings support "Markdown, freeform text, labeled sections, and instructive
code examples", and follow the conventions of Python docstrings (PEP 257) and
the Google docstring style guide. Source:
<https://mojolang.org/docs/reference/docstrings/>.

## Placement

> Docstrings let you document declarations at the point they appear in the
> source file.

| Declaration | Position |
|-------------|----------|
| Function or method | After the signature, before the body |
| Struct or trait | After the opening line, before members |
| Field or `comptime` | After the declaration, not before it |
| Module or Package | First string in the file, after imports |

Source: <https://mojolang.org/docs/reference/docstrings/>.

And the indentation rule:

> Type, trait, and function docstrings use the same indentation level as the
> declaration. Field and `comptime` docstrings use the same indentation level
> as the field or `comptime` name.

Source: <https://mojolang.org/docs/reference/docstrings/>. The reference's
single example demonstrates all four kinds at once:

```mojo
struct Color:
    """Represents an RGB color."""  # Struct docstring

    var r: UInt8
    """The red channel, in [0, 255]."""  # Field docstring

    comptime MAX: UInt8 = 255
    """The maximum value for any channel."""  # `comptime` docstring

    def to_hex(self) -> String:
        """Converts the color to a hex string."""  # Method docstring
        ...
```

Source: <https://mojolang.org/docs/reference/docstrings/>. The manual shows the
same shape, and both pages agree on the two "after" cases that are easy to get
wrong: a **field** docstring comes after the field, and a **`comptime`**
docstring after the `comptime` member. Source:
<https://mojolang.org/docs/manual/basics/>.

### Module and package docstrings

> Place module docstrings as the first string in the file. They describe the
> module's purpose, summarize its contents, and help documentation tools
> generate module-level reference pages.
>
> Place package docstrings in `__init__.mojo` files. They describe the
> package's purpose, summarize its exported modules, and provide
> package-level documentation.

Source: <https://mojolang.org/docs/reference/docstrings/>. The placement table
adds the detail that a module docstring comes "after imports". Source:
<https://mojolang.org/docs/reference/docstrings/>.

## The summary line

> A docstring's first sentence is its summary. Summaries appear in index views
> and search results.

| Declaration | Pattern | Examples |
|-------------|---------|----------|
| Function or method | Present-tense verb | `Clamps a value to the range [low, high].` |
| | | `Converts a list of integers to a JSON array string.` |
| Struct or trait | Noun phrase or present-tense verb | `A fixed-capacity circular buffer.` |
| | | `Supports hashing to a fixed-size integer digest.` |
| Field or `comptime` | Noun phrase | `The red channel, in [0, 255].` |

> Separate the summary from additional body text with a blank line. Start
> the summary with a capital letter and avoid repeating the declaration
> name. Prefer ending the summary with a period; the compiler also accepts
> `!`, `?`, or a closing backtick.

Source: <https://mojolang.org/docs/reference/docstrings/>.

The manual gives the practical reason for the summary rule:

> The first sentence of a docstring is its summary and appears in index views.
> You can generate an API reference from docstrings with the `mojo doc` command.

Source: <https://mojolang.org/docs/manual/basics/>.

## Labelled sections

> Structured sections include a labeled header followed by indented
> `name: Description.` entries.
>
> The doc generator automatically includes type information, so you don't need
> to repeat it in the description.

Source: <https://mojolang.org/docs/reference/docstrings/>. The four sections the
compiler validates:

| Label | Documents |
|-------|-----------|
| `Parameters:` | Compile-time parameters |
| `Args:` | Runtime arguments |
| `Returns:` | Return values |
| `Raises:` | Error conditions |

Source: <https://mojolang.org/docs/reference/docstrings/>.

```mojo
def resize[dtype: DType](
    data: List[Scalar[dtype]],
    size: Int,
    fill: Scalar[dtype] = 0,
) raises -> List[Scalar[dtype]]:
    """Resizes a list by truncating it or padding it with a fill value.

    Parameters:
        dtype: The element type of the list.

    Args:
        data: The source list to resize.
        size: The target length.
        fill: The value used to pad the list when growing it.

    Returns:
        A new list with length `size`.

    Raises:
        An error if `size` is less than or equal to zero.
    """
    ...
```

Source: <https://mojolang.org/docs/reference/docstrings/>.

Two naming points worth stating explicitly, both from the reference:

- Mojo uses **`Args`**, not `Arguments`: "Mojo uses `Args` instead of
  `Arguments`."
- **Any** `Label:` starts a section: "Mojo doesn't define a canonical set of
  section labels. Any `Label:` starts a new section."

Source: <https://mojolang.org/docs/reference/docstrings/>.

### `Parameters` and `Constraints`

> Use `Parameters:` to document compile-time parameters when their role,
> behavior, or requirements are not obvious from the declaration.
>
> Use inline `Constraints:` clauses for simple parameter requirements:

```mojo
Parameters:
    size: The static capacity. Constraints: Must be a power of two.
    dtype: The element type. Constraints: Must be a floating-point type.
```

> Use a standalone `Constraints:` section for requirements that span multiple
> parameters, depend on the target architecture, or are not self-evident to
> most users:

```mojo
def dot[size: Int](
    a: SIMD[DType.float32, size],
    b: SIMD[DType.float32, size],
) -> Float32:
    """Computes the dot product of two SIMD vectors.

    Constraints:
        - `size` must be a power of two.
        - The target must support AVX2 or NEON.
    """
    ...
```

Source: <https://mojolang.org/docs/reference/docstrings/>.

### `Args`

> Document each argument with its name and role... Indent continuation lines
> relative to the argument name:

```mojo
Args:
    stride: The step between sampled indices. A stride of 1 returns
        all elements; a stride of 2 returns every other element.
```

Source: <https://mojolang.org/docs/reference/docstrings/>.

### `Examples`

> `Examples:` is not compiler-checked, but it is widely used in Mojo
> documentation. Use `Examples:` to show how to use an API in practice.
>
> It's normally the last section in a docstring. Example code is usually
> left-aligned with the label. Use fenced code blocks with the `mojo` language
> tag for syntax highlighting.

Source: <https://mojolang.org/docs/reference/docstrings/>.

### Custom labels

> Mojo supports custom section labels. The following are recommended
> conventions:

| Label | Documents |
|-------|-----------|
| `Preconditions:` | Runtime conditions the caller must satisfy |
| `Performance:` | Performance characteristics and tradeoffs |
| `Safety:` | Safety requirements and undefined behavior |
| `See:` | Related APIs, concepts, and references |

Source: <https://mojolang.org/docs/reference/docstrings/>.

The reference gives a decision rule for the three enforcement-related labels,
which is the useful part:

> - `Preconditions:` for a runtime condition on the caller that aborts
>   execution when violated and can't be caught.
> - `Constraints:` for a compile-time requirement that fails compilation when
>   violated.
> - `Raises:` for a runtime condition that raises a catchable error.

Source: <https://mojolang.org/docs/reference/docstrings/>. And on the other two:

> Use `Performance:` for complexity and for runtime behavior that is not obvious
> from complexity alone, such as allocation behavior, vectorization, scheduling,
> latency, I/O costs, or architecture-specific performance characteristics.
>
> Use `Safety:` for requirements, invariants, and operations that can lead to
> undefined behavior, memory safety issues, invalid references, or other unsafe
> states when used incorrectly.

Source: <https://mojolang.org/docs/reference/docstrings/>. On `Notes:`, the
reference has a preference: "prefer putting that information in the docstring
body rather than in a separate `Notes:` section."

### Section order

> Mojo doesn't enforce an order among sections, but a consistent order helps
> readers scan. Recommended order:
>
> `Parameters:` → `Args:` → `Returns:` → `Raises:` → `Preconditions:` →
> `Constraints:` → `Safety:` → `Performance:` → `See:` → `Examples:`
>
> Include only the sections that apply, and put `Examples:` last.

Source: <https://mojolang.org/docs/reference/docstrings/>.

## Hiding things

### `@doc_hidden`

> The `@doc_hidden` decorator excludes a declaration from generated
> documentation. The declaration still compiles normally but produces no
> documentation output.

```mojo
@doc_hidden
def _internal_helper(data: UnsafePointer[UInt8]) -> Int:
    pass
```

Source: <https://mojolang.org/docs/reference/docstrings/>. Its common uses:
"lifecycle and dunder methods not intended for direct use", "implementation
details such as private methods and helpers", and "deprecated internals kept for
backward compatibility." Source:
<https://mojolang.org/docs/reference/docstrings/>. The decorator's own page is
[@doc_hidden](../decorators/doc-hidden.md).

> **Open question:** the official `@doc_hidden` example still spells the
> pointer type `UnsafePointer`, which 1.0 unified into `Pointer`. The decorator
> itself is current; only the example's type spelling is documentation lag.
> Sources: <https://mojolang.org/docs/reference/docstrings/> and
> <https://mojolang.org/releases/v1.0.0/>. See
> [`versions/1.0.0`](../versions/1.0.0.md).

### Hidden example lines

> Prefix a line in a docstring example with `%#` to hide it from generated
> documentation. The line remains visible in the source file.
>
> `mojo doc` removes `%#` lines from generated output:

```mojo
"""
...

%# var result = format_result(0.857)
print(result)  # 85.7%

...
"""
```

Source: <https://mojolang.org/docs/reference/docstrings/>. The documented uses:
"hiding setup code such as imports, helper functions, and temporary variables",
and "showing expected output in source examples without rendering it in
generated documentation."

## Inline formatting

> Docstrings support Markdown, inline code formatting, escape sequences, KaTeX
> syntax, and HTML tags.

| Content | Syntax |
|---------|--------|
| API names (types, functions, fields, arguments) | `` `Int` ``, `` `append()` ``, `` `pop(index)` `` |
| Literal backslash in a code block | `\\\\` (renders as `\\`) |
| Inline math | `$$x^y$$` |
| Block math | `$$` on its own line, formula, `$$` |
| Literal `$$` in text | `<span>$$</span>` |

Source: <https://mojolang.org/docs/reference/docstrings/>.

Two escape facts that have surprised people:

> String escape sequences are honored everywhere, including inside code blocks.
> For example, `\n` produces a newline, while `\\t` produces the two-character
> sequence `\t` in a code example.

Source: <https://mojolang.org/docs/reference/docstrings/>. KaTeX notes: "Double
KaTeX backslashes: `\\frac`, `\\|`, `\\cdot`", and "`$$` is ignored inside
backticks and fenced code blocks."

## What the compiler checks

> Mojo validates docstrings during compilation and reports common issues.

A concrete diagnostic, quoted from the reference:

```sh
$ mojo optionalref.mojo
optionalref.mojo:5:8: warning: doc string summary should begin with a capital
letter or non-alpha character, but this begins with 'a'
    """an error type for when an empty `OptionalRef` is accessed"""
       ^
optionalref.mojo:5:8: warning: doc string summary should end with a period
'.', exclamation mark '!', question mark '?', or backtick '`', but this ends
with 'd'
    """an error type for when an empty `OptionalRef` is accessed"""
       ^
```

Source: <https://mojolang.org/docs/reference/docstrings/>.

`mojo doc --diagnose-missing-doc-strings` performs further integrity checks:

```sh
$ mojo doc --diagnose-missing-doc-strings optionalref.mojo
optionalref.mojo:1:1: warning: public module 'OptionalRef' is missing a
doc string
@fieldwise_init
^
optionalref.mojo:2:8: warning: struct takes parameters, but has no
'Parameters' in doc string
struct EmptyOptionalRefError[T: Movable](
       ^
```

Source: <https://mojolang.org/docs/reference/docstrings/>.

### Two validation modes

> Mojo uses two validation modes:
>
> - _Strict_ for public APIs
> - _Normal_ for private and internal declarations
>
> A declaration is public when it:
>
> - Doesn't start with `_`
> - Is not marked `@doc_hidden`
> - Is not synthesized
> - Is at module scope or a member of a public `struct` or `trait`

Source: <https://mojolang.org/docs/reference/docstrings/>.

### Universal checks

These run during compilation with `mojo /path/to/file.mojo`:

**Section structure** — "Overindented section label", "Duplicate section",
"Empty section".

**`Args:` and `Parameters:` entries** — "Entry names a missing argument or
parameter", "Duplicate entry", "Entry out of declaration order", "Missing entry
description", "Missing documented argument or parameter".

**`Returns:` and `Raises:` consistency** — "`Returns:` on a function without a
return value", "`Raises:` on a function that is not `raises`".

Source: <https://mojolang.org/docs/reference/docstrings/>.

### Strict-mode checks

Strict mode applies to public declarations. "Summary sentences, descriptions,
and section body text" must "begin with a capital letter or non-alpha character"
and "end with `.`, `!`, `?`, or `` ` ``". This includes text in sections such as
`Constraints:`, `Returns:`, and `Raises:`. Source:
<https://mojolang.org/docs/reference/docstrings/>.

With `--diagnose-missing-doc-strings`, the strict mode additionally flags:

**Missing docstrings** — "Public functions and methods", "Public structs and
traits", "Public fields and `comptime` declarations", "Public modules".

**Missing required sections on functions** — `Args:` for functions with
arguments, `Parameters:` for declarations with required parameters, `Returns:`
for functions with return values, `Raises:` for `raises` functions.

**Missing required sections on non-functions** — `Parameters:` for declarations
with required parameters.

**Not checked** — `Constraints:` and "Custom labels such as `Notes:`,
`Performance:`, and `Safety:`".

Source: <https://mojolang.org/docs/reference/docstrings/>.

### The CI recipe

> ```sh
> mojo doc --diagnose-missing-doc-strings -Werror -o /dev/null stdlib/std/
> ```
>
> Reports public declarations without docstrings. `-Werror` converts warnings
> into errors.

Source: <https://mojolang.org/docs/reference/docstrings/>.

## Docstrings and the toolchain

You can turn docstrings into a reference without leaving the toolchain:

> Enclose API documentation comments in triple quotes...
>
> Documenting your code with these kinds of comments (known as "docstrings") is
> a topic we've yet to fully specify, but you can generate an API reference from
> docstrings using the `mojo doc` command.

Source: <https://mojolang.org/docs/manual/basics/>. The `mojo doc` command has
its own page, [`cli/doc.md`](../cli/doc.md).

## Pitfalls

- **Treating a docstring as a comment.** It is a string literal with real
  runtime semantics at that point; the compiler uses it for documentation and
  validates it. Verified above.
- **Putting a field or `comptime` docstring before the declaration.** It goes
  *after*, at the same indentation as the name. Verified above.
- **Documenting a parameter under `Args:`.** Compile-time parameters go under
  `Parameters:`; runtime arguments under `Args:`. Verified above.
- **Writing `Arguments:`.** The label is `Args:`. Verified above.
- **Leaving a section empty or duplicating it.** Both are universal check
  failures. Verified above.
- **Putting entries out of declaration order.** Also a universal check failure.
  Verified above.
- **Writing `Returns:` on a `None`-returning function.** The compiler flags it.
  Verified above.
- **Writing `Raises:` on a non-`raises` function.** The compiler flags it.
  Verified above.
- **Starting a public summary with a lowercase letter or ending without
  punctuation.** Strict-mode warnings; the reference shows the exact wording.
  Verified above.
- **Assuming custom labels are validated.** Only `Parameters:`, `Args:`,
  `Returns:` and `Raises:` are compiler-checked; `Safety:`, `Performance:` and
  friends are conventions. Verified above.
- **Using `%#` expecting the line to disappear from the source.** It is removed
  only from generated output. Verified above.
- **Writing `$$` in prose.** Use `<span>$$</span>`; `$$` starts math mode.
  Verified above.
- **Ignoring escapes inside code blocks.** They are honored there too, so a
  literal `\t` in an example needs `\\t`. Verified above.
- **Assuming a block comment exists.** The documented comment form is `#` only;
  see the open question above.

## Sources

- Mojo docstring reference: <https://mojolang.org/docs/reference/docstrings/>
- Mojo language basics (manual): <https://mojolang.org/docs/manual/basics/>
- Mojo `mojo doc` CLI: <https://mojolang.org/docs/cli/doc/>
- Mojo literals reference: <https://mojolang.org/docs/reference/literals/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
