# tempfile

`tempfile` creates and cleans up temporary files and directories.

> Manage temporary files and directories: create, locate, and cleanup.

> The `tempfile` package provides utilities for creating and managing temporary
> files and directories. It handles platform-specific temporary storage locations
> and ensures proper cleanup of temporary resources. Temporary files are useful
> for intermediate data, testing, and operations that need scratch space without
> polluting permanent storage.

> Use this package when you need scratch space for intermediate computations,
> temporary storage during testing, or any operation requiring files that
> shouldn't persist after program execution.

Source: <https://mojolang.org/docs/std/tempfile/>.

It has one module, `tempfile`:

> This module provides a safe API for creating temporary files and directories.
> It includes helpers for creating temporary directories (`mkdtemp`), temporary
> files (`NamedTemporaryFile`), querying the default temporary directory
> (`gettempdir`), and a context manager for managing the lifetime of temporary
> directories (`TemporaryDirectory`).

Source: <https://mojolang.org/docs/std/tempfile/tempfile/>.

## The API at a glance

| Member | Kind | Job |
|--------|------|-----|
| `gettempdir()` | function | "Return the default directory to use for temporary files." |
| `mkdtemp(suffix, prefix, dir)` | function | "Create a temporary directory" (caller cleans up). |
| `NamedTemporaryFile(...)` | struct | "Temporary file with automatic cleanup." |
| `TemporaryDirectory(...)` | struct | "Temporary directory that cleans up automatically." |
| `TMP_MAX` | `comptime` | `10000` — "Maximum number of attempts when generating unique temporary file names." |

Source: <https://mojolang.org/docs/std/tempfile/tempfile/>.

This is the complete documented surface. There is no `mkstemp`, no `mktemp`,
and no `TempFile` — the four items above are the package.

## `gettempdir()` and `mkdtemp()`

```text
def gettempdir() -> Optional[String]
def mkdtemp(suffix: String = "", prefix: String = "tmp", dir: Optional[String] = None) -> String
```

Source: <https://mojolang.org/docs/std/tempfile/tempfile/gettempdir/>,
<https://mojolang.org/docs/std/tempfile/tempfile/mkdtemp/>.

`gettempdir` returns an `Optional` because the platform's temporary directory may
not be resolvable. `mkdtemp` returns the name of the directory it created and
**leaves cleanup to you**: "Caller is responsible for deleting the directory when
done with it."

```mojo
from std.tempfile import gettempdir, mkdtemp
from std.os import rmdir

def main() raises:
    print(gettempdir())          # e.g. Optional('/tmp')

    var temp_dir = mkdtemp()
    print(temp_dir)
    rmdir(temp_dir)              # caller cleans up
```

Source: <https://mojolang.org/docs/std/tempfile/tempfile/mkdtemp/>.

`mkdtemp` raises "[i]f the directory can not be created". Source:
<https://mojolang.org/docs/std/tempfile/tempfile/mkdtemp/>.

## `NamedTemporaryFile`

```text
struct NamedTemporaryFile
    def __init__(
        out self,
        mode: String = "w",
        name: Optional[String] = None,
        suffix: String = "",
        prefix: String = "tmp",
        dir: Optional[String] = None,
        delete: Bool = True,
    )
    def close(mut self)
    def read(self, size: Int = Int(-1)) -> String
    def read_bytes(self, size: Int = Int(-1)) -> List[UInt8]
    def seek(self, offset: Int, whence: UInt8 = UInt8(0)) -> UInt64
    def write[*Ts: Writable](mut self, *args: *Ts.values)
    def write_bytes(mut self, bytes: Span[UInt8])
    def __enter__(var self) -> Self
    def __deinit__(deinit self)
```

Source: <https://mojolang.org/docs/std/tempfile/tempfile/NamedTemporaryFile/>.

It has one field, `name: String` ("Name of the file") and conforms to `AnyType`,
`Deinitable` and `Movable`. The struct "is a wrapper around a `FileHandle`" and
calls `os.remove()` in `close()` when `delete` is True. Source:
<https://mojolang.org/docs/std/tempfile/tempfile/NamedTemporaryFile/>.

The documented usage:

```mojo
from std.tempfile import NamedTemporaryFile

def main() raises:
    with NamedTemporaryFile(mode="rw") as f:
        f.write("Hello world!")
        _ = f.seek(0)
        print(f.read())     # Hello world!
        print(f.name)       # path is available while open
    # file deleted automatically
```

Source: <https://mojolang.org/docs/std/tempfile/tempfile/NamedTemporaryFile/>.

### `delete=False` keeps the file

```mojo
from std.tempfile import NamedTemporaryFile
import std.os

def main() raises:
    var temp_file = NamedTemporaryFile()      # delete=True by default
    temp_file.write("Temporary data")
    temp_file.close()                          # file is deleted
    print(std.os.path.exists(temp_file.name))  # False

    temp_file = NamedTemporaryFile(delete=False)
    temp_file.write("Temporary data")
    temp_file.close()                          # file is kept
    print(std.os.path.exists(temp_file.name))  # True
    std.os.remove(temp_file.name)              # clean up manually
```

Source: <https://mojolang.org/docs/std/tempfile/tempfile/NamedTemporaryFile/>.

### `seek` and the `whence` constants

```text
def seek(self, offset: Int, whence: UInt8 = UInt8(0)) -> UInt64
```

The documented reference points come from [`os`](os.md):

> `whence`: The reference point for the offset: `os.SEEK_SET = 0` (start of file,
> default), `os.SEEK_CUR = 1` (current position), `os.SEEK_END = 2` (end of file).

Source: <https://mojolang.org/docs/std/tempfile/tempfile/NamedTemporaryFile/>.
`seek` returns the resulting byte offset from the start of the file and raises
"if this file handle is invalid, or if file seek returned a failure."

### Reading and writing bytes

```mojo
from std.tempfile import NamedTemporaryFile
from std.pathlib import Path

def main() raises:
    var p: Path
    var bytes = [Byte(0x48), 0x65, 0x6C, 0x6C, 0x6F]   # "Hello"
    with NamedTemporaryFile(mode="rw") as f:
        p = f.name.copy()
        f.write_bytes(bytes[:])
        _ = f.seek(0)
        var b = f.read_bytes()
        print(b == bytes)                          # True
        print(String(from_utf8_lossy=b))           # Hello
    print(p.exists())                              # False
```

Source: <https://mojolang.org/docs/std/tempfile/tempfile/NamedTemporaryFile/>.

Note the pattern `p = f.name.copy()`: `name` is copied out of the file object
before the context exits, because the object (and its `name`) is gone afterwards.

## `TemporaryDirectory`

```text
struct TemporaryDirectory
    def __init__(
        out self,
        suffix: String = "",
        prefix: String = "tmp",
        dir: Optional[String] = None,
        ignore_cleanup_errors: Bool = False,
    )
    def __enter__(self) -> String
    def __exit__(self)
    def __exit__(self, err: Error) -> Bool
```

Source: <https://mojolang.org/docs/std/tempfile/tempfile/TemporaryDirectory/>.

It has one field, `name: String` ("The name of the temporary directory"), and
conforms to `AnyType`, `Deinitable` and `Movable`. `__enter__` returns the
directory name as a `String`, which is the key ergonomic difference from
`NamedTemporaryFile.__enter__` (which returns `Self`).

```mojo
from std.tempfile import TemporaryDirectory
import std.os

def main() raises:
    var temp_path: String
    with TemporaryDirectory() as tmpdir:
        temp_path = tmpdir
        print(std.os.path.exists(tmpdir))   # True
        # ... use tmpdir for temporary work ...

    print(std.os.path.exists(temp_path))    # False — cleaned up
```

Source: <https://mojolang.org/docs/std/tempfile/tempfile/TemporaryDirectory/>.

> The directory and all its contents are removed on exit, even if an error
> occurs. Set `ignore_cleanup_errors=True` to suppress cleanup failures.

Source: <https://mojolang.org/docs/std/tempfile/tempfile/TemporaryDirectory/>.

That "even if an error occurs" is what the two `__exit__` overloads implement:
the no-error form and the error form, the latter returning `Bool` — "True if the
temporary directory was removed successfully."

## Idioms

- **Use `with` for both types.** It guarantees cleanup on the normal and the
  error path, which is the entire point of the package.
- **Copy `f.name` out before the `with` block ends** if you need the path
  afterwards; the object owns it.
- **Use `delete=False` deliberately** when another process or a later step needs
  the file; you then own the cleanup.
- **Use `seek(0)` after writing before reading** on a `mode="rw"` file — the
  file position is at the end after writes.
- **Use `read_bytes()` for binary data and `read()` for text.** `String(from_utf8_lossy=...)`
  makes the text conversion explicit when the bytes may not be valid UTF-8.
- **Use `mkdtemp()` only when the lifetime spans a scope you control**; otherwise
  `TemporaryDirectory` is safer.
- **Use `dir=…` to place the temp resource on a specific filesystem** (for
  example, next to an output file that will be renamed into place).
- **Let `os.path.exists` verify cleanup in tests.**

## Pitfalls

- **Reading before `seek(0)`.** After writes the position is at the end; `read()`
  returns empty. Every documented read-after-write example calls `seek(0)`.
- **Assuming `NamedTemporaryFile` exposes `__exit__` in the reference.** The
  context-manager protocol is documented through `__enter__` and the "used as a
  context manager" wording; when the context exits, `close()` is called. Source:
  <https://mojolang.org/docs/std/tempfile/tempfile/NamedTemporaryFile/>.
- **Using the `name` after the block.** The file is deleted and the object
  destroyed; copy the string first.
- **Trusting `delete=True` if the process is killed.** Cleanup runs on `close()`
  and on destruction; a hard kill can leave the file behind.
- **Forgetting that both constructors raise.** Creating the file or directory can
  fail; call from a `raises` function.
- **Mixing text and bytes.** `read()`/`write()` are text; `read_bytes()`/
  `write_bytes()` are binary. `write_bytes` takes a `Span[UInt8]`.
- **Assuming `gettempdir()` always has a value.** It returns
  `Optional[String]`.
- **Depending on the generated name.** Names are random and unique, not
  predictable; never construct one by hand.
- **Assuming a stable API.** See below.

> **Open question:** the `NamedTemporaryFile` documentation says the `mode`
> argument "can be 'r' or 'w'", but every code example uses `mode="rw"` and the
> prose elsewhere says "Use `mode="r"` for reading, `mode="w"` for writing,
> `mode="rw"` for both." The accepted mode strings are therefore documented
> inconsistently in the same page. Verify which spellings the current compiler
> accepts before relying on a specific one. Source:
> <https://mojolang.org/docs/std/tempfile/tempfile/NamedTemporaryFile/>.

## Stability

The `tempfile` package page, the module page and the member pages show **no
`@stable(since=...)` marker** and no stability badges. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/tempfile/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `tempfile` package: <https://mojolang.org/docs/std/tempfile/>
- Mojo `tempfile.tempfile` module: <https://mojolang.org/docs/std/tempfile/tempfile/>
- Mojo `NamedTemporaryFile` struct: <https://mojolang.org/docs/std/tempfile/tempfile/NamedTemporaryFile/>
- Mojo `TemporaryDirectory` struct: <https://mojolang.org/docs/std/tempfile/tempfile/TemporaryDirectory/>
- Mojo `mkdtemp` function: <https://mojolang.org/docs/std/tempfile/tempfile/mkdtemp/>
- Mojo `gettempdir` function: <https://mojolang.org/docs/std/tempfile/tempfile/gettempdir/>
- Mojo `os.os` module (seek constants, `remove`): <https://mojolang.org/docs/std/os/os/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
