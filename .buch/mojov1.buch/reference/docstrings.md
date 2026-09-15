# Docstrings

This page is the **complete formal reference** for Mojo docstrings, mirroring
`/docs/reference/docstrings/`. It covers placement, the first-sentence rule,
every structured section, inline formatting, hidden elements and the compiler
checks. The guided introduction is on
[Comments and docstrings](../basics/comments-and-docstrings.md); this page is the
exhaustive form.

## What a docstring is

> Mojo uses docstring literals to generate API reference documentation data,
> which can be processed to produce page content or read directly from source.
> Place docstrings immediately after declarations.
>
> Docstrings support Markdown, freeform text, labeled sections, and instructive
> code examples:

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

> Mojo docstrings follow conventions used by Python docstrings and the Google
> docstring style guide.

Source: <https://mojolang.org/docs/reference/docstrings/>.

## Placement

> Docstrings let you document declarations at the point they appear in the source
> file.

| Declaration | Position |
|-------------|----------|
| Function or method | After the signature, before the body |
| Struct or trait | After the opening line, before members |
| Field or `comptime` | After the declaration, not before it |
| Module or Package | First string in the file, after imports |

> Type, trait, and function docstrings use the same indentation level as the
> declaration. Field and `comptime` docstrings use the same indentation level as
> the field or `comptime` name.

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

> Place module docstrings as the first string in the file. They describe the
> module's purpose, summarize its contents, and help documentation tools generate
> module-level reference pages.
>
> Place package docstrings in `__init__.mojo` files. They describe the package's
> purpose, summarize its exported modules, and provide package-level
> documentation.

Source: <https://mojolang.org/docs/reference/docstrings/>.

## Summary line

> A docstring's first sentence is its summary. Summaries appear in index views and
> search results.

| Declaration | Pattern | Examples |
|-------------|---------|----------|
| Function or method | Present-tense verb | `Clamps a value to the range [low, high].` / `Converts a list of integers to a JSON array string.` |
| Struct or trait | Noun phrase or present-tense verb | `A fixed-capacity circular buffer.` / `Supports hashing to a fixed-size integer digest.` |
| Field or `comptime` | Noun phrase | `The red channel, in [0, 255].` |

> Separate the summary from additional body text with a blank line. Start the
> summary with a capital letter and avoid repeating the declaration name. Prefer
> ending the summary with a period; the compiler also accepts `!`, `?`, or a
> closing backtick.

Source: <https://mojolang.org/docs/reference/docstrings/>.

## Labeled content

> Structured sections include a labeled header followed by indented
> `name: Description.` entries.
>
> The doc generator automatically includes type information, so you don't need to
> repeat it in the description.
>
> The compiler validates some common structured sections against the declaration
> and warns about mismatches and missing entries:

| Label | Documents |
|-------|-----------|
| `Parameters:` | Compile-time parameters |
| `Args:` | Runtime arguments |
| `Returns:` | Return values |
| `Raises:` | Error conditions |

```mojo
def resize[dtype: DType](data: List[Scalar[dtype]],
    size: Int,
    fill: Scalar[dtype] = 0,) raises -> List[Scalar[dtype]]:
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

> Mojo doesn't define a canonical set of section labels. Any `Label:` starts a new
> section.

Source: <https://mojolang.org/docs/reference/docstrings/>.

### `Parameters` and `Constraints`

> Use `Parameters:` to document compile-time parameters when their role, behavior,
> or requirements are not obvious from the declaration.
>
> Use inline `Constraints:` clauses for simple parameter requirements:

```mojo
Parameters:
    size: The static capacity. Constraints: Must be a power of two.
    dtype: The element type. Constraints: Must be a floating-point type.
```

> Use a standalone `Constraints:` section for requirements that span multiple
> parameters, depend on the target architecture, or are not self-evident to most
> users:

```mojo
def dot[size: Int](a: SIMD[DType.float32, size],
    b: SIMD[DType.float32, size],) -> Float32:
    """Computes the dot product of two SIMD vectors.

    Constraints:
        - `size` must be a power of two.
        - The target must support AVX2 or NEON.
    """
    ...
```

### `Args`

> Document each argument with its name and role. Mojo uses `Args` instead of
> `Arguments`.
>
> Indent continuation lines relative to the argument name:

```mojo
Args:
    stride: The step between sampled indices. A stride of 1 returns
        all elements; a stride of 2 returns every other element.
```

### `Examples`

> `Examples:` is not compiler-checked, but it is widely used in Mojo
> documentation. Use `Examples:` to show how to use an API in practice.
>
> It's normally the last section in a docstring. Example code is usually
> left-aligned with the label. Use fenced code blocks with the `mojo` language tag
> for syntax highlighting.

````text
Examples for a hypothetical `find()` API:

```mojo
var names = ["alice", "bob", "carol"]
print(names.find("bob").value())  # 1
print(names.find("dave") is None) # True

var numbers = [1, 2, 3, 4, 3, 9, 3]
while idx := numbers.find(3):
    _ = numbers.pop(idx.value())
print(numbers)  # [1, 2, 4, 9]
```
````

### Custom labels

> Mojo supports custom section labels. The following are recommended conventions:

| Label | Documents |
|-------|-----------|
| `Preconditions:` | Runtime conditions the caller must satisfy |
| `Performance:` | Performance characteristics and tradeoffs |
| `Safety:` | Safety requirements and undefined behavior |
| `See:` | Related APIs, concepts, and references |

> Use `Preconditions:` for runtime conditions the caller must satisfy before
> calling, where a violation aborts the program (for example, a runtime
> assertion) rather than raising a catchable error.
>
> Choose among `Preconditions:`, `Constraints:`, and `Raises:` by how the
> condition is enforced:
>
> - `Preconditions:` for a runtime condition on the caller that aborts execution
>   when violated and can't be caught.
> - `Constraints:` for a compile-time requirement that fails compilation when
>   violated.
> - `Raises:` for a runtime condition that raises a catchable error.
>
> Use `Performance:` for complexity and for runtime behavior that is not obvious
> from complexity alone, such as allocation behavior, vectorization, scheduling,
> latency, I/O costs, or architecture-specific performance characteristics.
>
> Use `Safety:` for requirements, invariants, and operations that can lead to
> undefined behavior, memory safety issues, invalid references, or other unsafe
> states when used incorrectly.
>
> Use `See:` to link to related APIs, standards documents, algorithms, and
> external references.
>
> Mojo also accepts other labels, such as `Notes:`, but prefer putting that
> information in the docstring body rather than in a separate `Notes:` section.

### Section order

> Mojo doesn't enforce an order among sections, but a consistent order helps
> readers scan. Recommended order:
>
> `Parameters:` → `Args:` → `Returns:` → `Raises:` → `Preconditions:` →
> `Constraints:` → `Safety:` → `Performance:` → `See:` → `Examples:`
>
> Include only the sections that apply, and put `Examples:` last.

Source: <https://mojolang.org/docs/reference/docstrings/>.

## Hidden elements

### `@doc_hidden`

> The `@doc_hidden` decorator excludes a declaration from generated
> documentation. The declaration still compiles normally but produces no
> documentation output.

```mojo
@doc_hidden
def _internal_helper(data: Pointer[UInt8]) -> Int:
    pass
```

> Common uses include:
>
> - Hiding lifecycle and dunder methods not intended for direct use
> - Hiding implementation details such as private methods and helpers
> - Hiding deprecated internals kept for backward compatibility.

Source: <https://mojolang.org/docs/reference/docstrings/>. See also
[doc-hidden](../decorators/doc-hidden.md) and
[deprecated](../decorators/deprecated.md).

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

> Common uses include:
>
> - Hiding setup code such as imports, helper functions, and temporary variables
> - Showing expected output in source examples without rendering it in generated
>   documentation

Source: <https://mojolang.org/docs/reference/docstrings/>.

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

> String escape sequences are honored everywhere, including inside code blocks.
> For example, `\n` produces a newline, while `\\t` produces the two-character
> sequence `\t` in a code example.
>
> KaTeX syntax supports mathematical notation in docstrings, including
> algorithms, formulas, and complexity annotations:
>
> - Double KaTeX backslashes: `\\frac`, `\\|`, `\\cdot`
> - Block formulas render centered; inline formulas render in text flow
> - `$$` is ignored inside backticks and fenced code blocks

Source: <https://mojolang.org/docs/reference/docstrings/>.

## Compiler checks

> Mojo validates docstrings during compilation and reports common issues.

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

> `mojo doc` performs additional integrity checks. Use
> `--diagnose-missing-doc-strings` to report missing docstrings:

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

### Validation modes

> Mojo uses two validation modes:
>
> - *Strict* for public APIs
> - *Normal* for private and internal declarations
>
> A declaration is public when it:
>
> - Doesn't start with `_`
> - Is not marked `@doc_hidden`
> - Is not synthesized
> - Is at module scope or a member of a public `struct` or `trait`
>
> These modes apply to both `mojo` and `mojo doc`.

### Missing docstrings

```sh
mojo doc --diagnose-missing-doc-strings -Werror -o /dev/null stdlib/std/
```

> Reports public declarations without docstrings. `-Werror` converts warnings
> into errors.

### Universal checks

> These checks apply during compilation: `mojo /path/to/file.mojo`.
>
> **Section structure:** overindented section label; duplicate section; empty
> section.
>
> **`Args:` and `Parameters:` entries:** entry names a missing argument or
> parameter; duplicate entry; entry out of declaration order; missing entry
> description; missing documented argument or parameter.
>
> **`Returns:` and `Raises:` consistency:** `Returns:` on a function without a
> return value; `Raises:` on a function that is not `raises`.

### Strict mode checks

> Strict mode applies to public declarations.
>
> **Summary sentences, descriptions, and section body text:** must begin with a
> capital letter or non-alpha character; must end with `.`, `!`, `?`, or `` ` ``.
> This includes text in sections such as `Constraints:`, `Returns:`, and
> `Raises:`.

### Strict mode with `--diagnose-missing-doc-strings`

> This mode enables the strictest validation, such as in CI. Mojo will flag the
> following issues.
>
> **Missing docstrings:** public functions and methods; public structs and
> traits; public fields and `comptime` declarations; public modules.
>
> **Missing required sections on functions:** `Args:` for functions with
> arguments; `Parameters:` for declarations with required parameters; `Returns:`
> for functions with return values; `Raises:` for `raises` functions.
>
> **Missing required sections on non-functions:** `Parameters:` for declarations
> with required parameters.
>
> **Not checked:** `Constraints:`; custom labels such as `Notes:`,
> `Performance:`, and `Safety:`.

Source: <https://mojolang.org/docs/reference/docstrings/>.

## Section reference table

| Section | Checked against | Required when |
|---------|-----------------|---------------|
| `Parameters:` | Compile-time parameters | Declaration has required parameters (strict) |
| `Args:` | Runtime arguments | Function has arguments (strict) |
| `Returns:` | Return value | Function has a return value (strict) |
| `Raises:` | `raises` effect | Function is `raises` (strict) |
| `Constraints:` | Not checked | — |
| `Preconditions:` | Not checked | — |
| `Performance:` | Not checked | — |
| `Safety:` | Not checked | — |
| `See:` | Not checked | — |
| `Examples:` | Not checked | — |
| Any `Label:` | Starts a new section | — |

Source: <https://mojolang.org/docs/reference/docstrings/>.

## Pitfalls

- **Putting a field docstring before the field.** Field and `comptime`
  docstrings go *after* the declaration. Verified above.
- **Lowercasing the summary's first letter.** Strict mode warns: the summary must
  begin with a capital letter or a non-alpha character. Verified above.
- **Ending the summary without punctuation.** It must end with `.`, `!`, `?`, or
  a backtick. Verified above.
- **Using `Arguments:`.** Mojo uses `Args:`. Verified above.
- **Documenting an argument that doesn't exist, or omitting one.** Both produce
  warnings, as does an entry out of declaration order. Verified above.
- **Adding `Returns:` to a function with no return value, or `Raises:` to a
  non-raising function.** Both are consistency errors. Verified above.
- **Marking a section but leaving it empty, duplicating it, or over-indenting its
  label.** Each is flagged. Verified above.
- **Hiding documentation members with `@doc_hidden` in a trait.** The trait
  reference advises against it; required members can disappear from user docs.
  Source: <https://mojolang.org/docs/reference/trait-declarations/>.
- **Using a general-purpose constant trait member.** Put `PI`-style constants at
  module scope or on a related struct. Verified above.
- **Expecting `Constraints:` or custom labels to be validated.** They are not
  checked. Verified above.
- **Assuming an order of sections is enforced.** It is a convention; only the
  presence checks are enforced. Verified above.

## Sources

- Mojo docstring reference: <https://mojolang.org/docs/reference/docstrings/>
- Mojo doc: <https://mojolang.org/docs/cli/doc/>
- Mojo trait declarations reference: <https://mojolang.org/docs/reference/trait-declarations/>
- Mojo language basics (manual): <https://mojolang.org/docs/manual/basics/>
