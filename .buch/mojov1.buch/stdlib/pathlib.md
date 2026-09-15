# pathlib

`pathlib` is the object-oriented filesystem path API: the `Path` type.

> Filesystem path manipulation and navigation.

> The `pathlib` package provides object-oriented filesystem path handling with
> platform-independent path operations. It offers the `Path` type for representing
> and manipulating filesystem paths, along with utilities for path joining,
> expansion, and directory operations. This package makes working with file paths
> safer and more intuitive than manual string manipulation.

> Use this package for any filesystem path operations including constructing
> paths, navigating directories, checking file existence, or performing
> path-related queries in a platform-independent way.

Source: <https://mojolang.org/docs/std/pathlib/>.

The package has one module, `path`, which exports `Path`, the `DIR_SEPARATOR`
comptime value, and the `cwd()` function.

## The documented example

```mojo
from std.pathlib import Path
var p = Path("a") / "b" / "c.txt"
print(p)  # a/b/c.txt
```

Source: <https://mojolang.org/docs/std/pathlib/path/>.

The `/` operator is `__truediv__`: "Joins two paths using the system-defined path
separator." Source: <https://mojolang.org/docs/std/pathlib/path/Path/>.

## Fields and construction

`Path` has one field, `path: String` — "The underlying path string
representation". Constructors:

| Form | Meaning |
|------|---------|
| `Path()` | "Initializes a path with the current directory." (raises) |
| `Path(StringSpan)` | From a string view. |
| `Path(String)` | From an owned string (`@implicit`). |
| `Path(StringLiteral)` | From a literal (`@implicit`). |
| `cwd()` | "Gets the current directory." |

Sources: <https://mojolang.org/docs/std/pathlib/path/Path/>,
<https://mojolang.org/docs/std/pathlib/path/>.

`Path` is `ImplicitlyCopyable`, `Comparable`, `Equatable`, `Hashable`,
`PathLike` and `Writable`.

## A runnable example

```mojo
from std.pathlib import Path

def main() raises:
    var p = Path("/tmp") / "demo" / "file.txt"
    print(p)                     # /tmp/demo/file.txt
    print(p.name())              # file.txt
    print(p.suffix())            # .txt
    print(p.parts())             # ['/', 'tmp', 'demo', 'file.txt']

    # joinpath is the method form of `/`.
    print(Path("/tmp").joinpath("demo", "file.txt"))

    # Home directory and `~` expansion.
    print(Path.home())                   # $HOME
    print(Path("~").expanduser())        # $HOME

    # Whole-file I/O.
    p.write_text("Hello Mojo")
    print(p.read_text())                 # Hello Mojo

    # Existence and type checks.
    print(p.exists())            # True
    print(p.is_file())           # True
    print(p.is_dir())            # False

    # Directory listing.
    for child in Path("/tmp").listdir():
        print(child)
```

Sources: <https://mojolang.org/docs/std/pathlib/path/Path/>,
<https://mojolang.org/docs/std/pathlib/path/>.

## The full method set

| Method | What it does |
|--------|--------------|
| `__truediv__` / `__itruediv__` | Join with the platform separator. |
| `joinpath(*segments)` | Join several segments; handles trailing separators. |
| `name()` | The final component (`"foo.txt"`). |
| `suffix()` | The extension including the period (`".txt"`), or `""`. |
| `parts()` | The path split on `DIR_SEPARATOR`. |
| `exists()` | True if the path exists on disk. |
| `is_file()` / `is_dir()` | Type checks (following symlinks). |
| `stat()` / `lstat()` | `stat_result` for the path / for the link itself. |
| `read_text()` / `read_bytes()` | Read the whole file. |
| `write_text(value)` / `write_bytes(Span[UInt8])` | Write the whole file. |
| `listdir()` | The entries in the directory. |
| `expanduser()` | Expand a leading `~` via `$HOME`. |
| `home()` (static) | `$HOME`, or `~` if unset. |
| `__fspath__()` | The `String` representation. |
| `__bool__()` | True if the path is non-empty. |

Source: <https://mojolang.org/docs/std/pathlib/path/Path/>.

## `suffix()` behaviour

The docs pin down the edge case that trips people up:

```mojo
var p = Path("testfile.txt")
print(p.suffix())      # .txt

p = Path(".hiddenfile")
print(p.suffix())      # "" (no suffix)
```

Source: <https://mojolang.org/docs/std/pathlib/path/Path/>. A dotfile is treated
as a name without an extension, matching Python.

## `joinpath` and separators

```mojo
var p = Path("/tmp")
p = p.joinpath("testdir")     # no trailing slash
p = p.joinpath("testfile.txt")
print(p == Path("/tmp/testdir/testfile.txt"))   # True

p = Path("/tmp/")
p = p.joinpath("testdir/")    # trailing slash
p = p.joinpath("testfile.txt")
print(p == Path("/tmp/testdir/testfile.txt"))   # True
```

Source: <https://mojolang.org/docs/std/pathlib/path/Path/>. `joinpath` normalizes
the separators, which is why it is preferred over string concatenation.

## Idioms

- **Use `/` for joining.** `Path("a") / "b"` reads as a path and stays portable.
- **Use `joinpath` when the segments are dynamic** or may carry separators.
- **Use `read_text`/`write_text` for whole files** and `open()` from [`io`](io.md)
  when you need a streaming handle.
- **Use `Path.home()` and `expanduser()`** instead of reading `$HOME` yourself.
- **Compare `Path` values, not strings.** `Path` is `Comparable` and `Equatable`,
  and comparison uses the underlying path strings.
- **Use `PathLike` in function signatures** to accept both `Path` and `String`.

## Pitfalls

- **Assuming `suffix()` splits at the last dot of a dotfile.** `.hiddenfile` has
  no suffix. Source: <https://mojolang.org/docs/std/pathlib/path/Path/>.
- **Concatenating path strings by hand.** Use `/` or `joinpath` so separators
  normalize.
- **Forgetting that most operations raise.** `Path()` (current directory),
  `read_text`, `write_text`, `stat`, `listdir` and `expanduser` are documented as
  raising; call them from a `raises` function.
- **Assuming `is_file()`/`is_dir()` do not follow symlinks.** They do — the docs
  for `os.path` note both can be true for the same path with a link.
- **Expecting `listdir()` to return full paths.** It returns the entries; join
  them to the parent if you need absolute paths.
- **Reading `p.path` when a method exists.** Use `name()`, `suffix()`,
  `parts()`, `__fspath__()`.
- **Assuming a stable API.** See below.

> **Open question:** the `path` module page shows the `Path` field as `path:
> String` and exposes `DIR_SEPARATOR`, but the docs do not state whether `Path`
> normalizes (`..`, `.`, duplicate separators) at construction or only in
> `expanduser`-style operations. The `joinpath` examples show normalization at
> join time; verify the general rule on the `Path` page before relying on
> constructed input being pre-normalized.

## Stability

The `pathlib` package page, the `path` module page and the `Path` page show **no
`@stable(since=...)` marker** and no stability badge. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/pathlib/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `pathlib` package: <https://mojolang.org/docs/std/pathlib/>
- Mojo `path` module: <https://mojolang.org/docs/std/pathlib/path/>
- Mojo `Path` struct: <https://mojolang.org/docs/std/pathlib/path/Path/>
- Mojo `cwd` function: <https://mojolang.org/docs/std/pathlib/path/cwd/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
