# io

`io` is Mojo's core input/output package: console I/O, file handling, and the
writing interfaces.

> Core I/O: console input/output, file handling, writing traits.

> The `io` package provides fundamental input/output functionality for reading
> from and writing to various sources including the console, files, and custom
> streams. It defines the core traits for the I/O system (`Writer` and
> `Writable`) that enable formatted output across different backends, along with
> concrete implementations for file operations and standard streams.

> Use this package for console interaction, file operations, implementing custom
> output formatting for your types, or building I/O abstractions.

Source: <https://mojolang.org/docs/std/io/>.

## Console: `print()` and `input()`

The `io.io` module is explicitly a built-in:

> Provides utilities for working with input/output.

> These are Mojo built-ins, so you don't need to import them.

Source: <https://mojolang.org/docs/std/io/io/>.

| Function | Signature (documented) |
|----------|------------------------|
| `print` | "Prints elements to the text stream. Each element is separated by `sep` and followed by `end`." |
| `input` | "Reads a line of input from the user." |

Source: <https://mojolang.org/docs/std/io/io/>.

```mojo
def main():
    print("Hello, Mojo!")                  # newline by default
    print("a", "b", sep="-", end="!\n")    # a-b!
    var name = input("Name: ")             # reads one line
    print("Hello,", name)
```

Because `print` accepts any `Writable`, it never needs a `String` conversion:
"it accepts any type that conforms to the `Writable` trait". Source:
<https://mojolang.org/docs/std/collections/string/string/String/>.

## Files: `open()` and `FileHandle`

The `io.file` module is also a built-in:

> Provides APIs to read and write files.

> These are Mojo built-ins, so you don't need to import them.

Source: <https://mojolang.org/docs/std/io/file/>.

The documented example is the direct form:

```mojo
var f = open("my_file.txt", "r")
print(f.read())
f.close()
```

And the safer `with` form, which closes automatically:

```mojo
with open("my_file.txt", "r") as f:
    print(f.read())
```

Source: <https://mojolang.org/docs/std/io/file/>.

`open` is documented as "Opens the file specified by path using the mode
provided, returning a `FileHandle`." Source:
<https://mojolang.org/docs/std/io/file/open/>. `FileHandle` is "File handle to an
opened file."

The module also exports the `O_*` open flags as `comptime` values:
`O_RDONLY` (0), `O_WRONLY` (1), `O_RDWR` (2), `O_APPEND`, `O_CLOEXEC`, `O_CREAT`
and `O_TRUNC`. Source: <https://mojolang.org/docs/std/io/file/>.

### Path-based alternative

For whole-file reads and writes, `Path` from [`pathlib`](pathlib.md) is the
higher-level route:

```mojo
from std.pathlib import Path

var p = Path("testfile.txt")
p.write_text("Hello Mojo")
print(p.read_text())        # Hello Mojo
```

Source: <https://mojolang.org/docs/std/pathlib/path/Path/>.

## `FileDescriptor`

The `io.file_descriptor` module is "Higher level abstraction for file stream"
and exports `FileDescriptor`, "File descriptor of a file". Source:
<https://mojolang.org/docs/std/io/file_descriptor/>. It is the type behind the
standard streams; the [`logger`](logger.md) API, for example, takes a
`FileDescriptor` defaulting to `stdout`.

## The writing traits

`io.write` "Implements I/O write interfaces", and the package description names
`Writer` and `Writable` as the core traits. Sources:
<https://mojolang.org/docs/std/io/write/>,
<https://mojolang.org/docs/std/io/>. Their full treatment lives in
[`format`](format.md):

- `Writable` — a type that formats itself as text.
- `Writer` — a destination that accepts text; one required method,
  `write_string(mut self, string: StringSpan)`.

```mojo
@fieldwise_init
struct StringBuilder(Writer):
    var s: String

    def write_string(mut self, string: StringSpan):
        self.s += string

def main():
    var b = StringBuilder("")
    b.write("Count: ", 42)
    print(b.s)     # Count: 42
```

Source: <https://mojolang.org/docs/std/format/Writer/>.

## Idioms

- **Use `with open(...) as f` for files.** It closes the handle on every exit
  path.
- **Pass `Writable` values straight to `print()`.** Converting to `String` first
  is an unnecessary allocation.
- **Use `Path.read_text()`/`write_text()` for whole-file operations**, and
  `open()` when you need a streaming handle.
- **Implement `Writer` to route formatted output** into a buffer, a socket or
  another destination, instead of building intermediate strings.
- **Prefer `read_bytes()` for binary data.** Text conversion must be explicit;
  `String(from_utf8_lossy=...)` handles invalid UTF-8 deliberately.

## Pitfalls

- **Forgetting to close a file.** Use `with`; the non-context form requires an
  explicit `f.close()`. Verified from
  <https://mojolang.org/docs/std/io/file/>.
- **Expecting `open()` not to fail.** It raises on a missing file or a bad mode;
  call it from a `raises` function.
- **Assuming text mode and bytes mode are interchangeable.** Choose `read()` for
  text and `read_bytes()` for binary, and convert deliberately.
- **Reaching for `io` for path manipulation.** That is [`pathlib`](pathlib.md)
  (`Path`) or `os.path` in [`os`](os.md).
- **Reading a line with `input()` in non-interactive code.** It blocks on stdin.

> **Open question:** the `io.io` package-level Markdown documents `print` and
> `input` by one-line descriptions and does not reproduce their full signatures
> (in particular `print`'s `sep`/`end` parameter defaults). Read
> <https://mojolang.org/docs/std/io/io/print/> for the exact signature before
> depending on a specific default.

## Stability

The `io` package page and its module pages show **no `@stable(since=...)`
marker** and no stability badges. Under the standard-library rule — "We consider
standard library APIs unstable unless specifically marked stable" — these APIs
are **unstable by default**. Sources: <https://mojolang.org/docs/std/io/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `io` package: <https://mojolang.org/docs/std/io/>
- Mojo `io.io` module: <https://mojolang.org/docs/std/io/io/>
- Mojo `print`: <https://mojolang.org/docs/std/io/io/print/>
- Mojo `input`: <https://mojolang.org/docs/std/io/io/input/>
- Mojo `io.file` module: <https://mojolang.org/docs/std/io/file/>
- Mojo `open`: <https://mojolang.org/docs/std/io/file/open/>
- Mojo `FileHandle`: <https://mojolang.org/docs/std/io/file/FileHandle/>
- Mojo `file_descriptor` module: <https://mojolang.org/docs/std/io/file_descriptor/>
- Mojo `write` module: <https://mojolang.org/docs/std/io/write/>
- Mojo `Path` struct: <https://mojolang.org/docs/std/pathlib/path/Path/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
