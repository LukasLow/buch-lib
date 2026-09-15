# stat

`stat` decodes the file-type bits of a POSIX `stat` mode value.

> File type constants and detection from stat system calls.

> The `stat` package provides constants and utility functions for working with
> file metadata from POSIX stat system calls. It defines standard file type bit
> masks and predicates for determining file types from mode values. This package
> enables portable file type checking across Unix-like systems.

> Use this package when working with file system metadata, implementing portable
> file type detection, or interfacing with POSIX file operations.

Source: <https://mojolang.org/docs/std/stat/>.

It has one module, `stat`, which "defines file type constants and functions for
testing file modes, similar to Python's `stat` module." Source:
<https://mojolang.org/docs/std/stat/stat/>.

## Where the mode value comes from

`stat` does not stat anything. It interprets a mode that another API produced —
in Mojo, that is the `fstat` module of [`os`](os.md):

- `os.fstat.stat(path)` — "Get the status of a file or a file descriptor."
- `os.fstat.lstat(path)` — the same but without following symlinks.
- `os.fstat.stat_result` — "Object whose fields correspond to the members of the
  stat structure."

Source: <https://mojolang.org/docs/std/os/fstat/>. The [`os`](os.md) page says the
same: "The file-**type decoding** of those mode bits belongs to the [`stat`]
package."

For the higher-level object-oriented route, [`pathlib`](pathlib.md)'s
`Path.stat()` returns the same `stat_result`.

## The `comptime` masks

| Constant | Value | Meaning |
|----------|-------|---------|
| `S_IFMT` | 61440 | "Bits that determine the file type." |
| `S_IFREG` | 32768 | "Bits that determine the regular file." |
| `S_IFDIR` | 16384 | "Bits that determine the directory." |
| `S_IFLNK` | 40960 | "Bits that determine the symlink." |
| `S_IFCHR` | 8192 | "Bits that determine the char device." |
| `S_IFBLK` | 24576 | "Bits that determine the block device." |
| `S_IFIFO` | 4096 | "Bits that determine the fifo." |
| `S_IFSOCK` | 49152 | "Bits that determine the socket." |

Source: <https://mojolang.org/docs/std/stat/stat/>.

These are the standard POSIX octal values written in decimal
(`0o170000 = 61440`, `0o100000 = 32768`, and so on). To isolate the type bits,
mask with `S_IFMT`; to test a type, prefer the predicates below.

## The predicates

| Function | Returns true when the mode is a… |
|----------|----------------------------------|
| `S_ISREG(mode)` | "regular file" |
| `S_ISDIR(mode)` | "directory" |
| `S_ISLNK(mode)` | "symlink" |
| `S_ISCHR(mode)` | "character device" |
| `S_ISBLK(mode)` | "block device" |
| `S_ISFIFO(mode)` | "fifo" |
| `S_ISSOCK(mode)` | "socket" |

Source: <https://mojolang.org/docs/std/stat/stat/>.

Each is generic over `Intable`:

```text
def S_ISREG[intable: Intable](mode: intable) -> Bool
```

> **Parameters:** `intable` — A type conforming to Intable.
>
> **Args:** `mode` — The file mode.
>
> **Returns:** `Bool` — True if the mode is a regular file and False otherwise.

Source: <https://mojolang.org/docs/std/stat/stat/S_ISREG/>. The other predicates
have the same shape.

## A runnable example

```mojo
from std.os.fstat import stat
from std.stat import (
    S_ISBLK,
    S_ISCHR,
    S_ISDIR,
    S_ISFIFO,
    S_ISLNK,
    S_ISREG,
    S_ISSOCK,
)

def classify(path: String) raises -> String:
    var result = stat(path)
    var mode = result.st_mode
    if S_ISREG(mode):
        return "regular file"
    elif S_ISDIR(mode):
        return "directory"
    elif S_ISLNK(mode):
        return "symlink"
    elif S_ISCHR(mode):
        return "character device"
    elif S_ISBLK(mode):
        return "block device"
    elif S_ISFIFO(mode):
        return "fifo"
    elif S_ISSOCK(mode):
        return "socket"
    return "unknown"

def main() raises:
    print(classify("/etc/hosts"))   # regular file
    print(classify("/tmp"))         # directory
```

Sources: <https://mojolang.org/docs/std/os/fstat/>,
<https://mojolang.org/docs/std/stat/stat/>.

If you only need "regular file or directory", [`pathlib`](pathlib.md) or
`os.path` is simpler — `Path.is_file()` and `Path.is_dir()` already do the
mode decoding for you. Use `stat` when you need the full set (devices, FIFOs,
sockets) or when you are interfacing with POSIX metadata directly.

## Idioms

- **Use the predicates, not the masks.** `S_ISREG(mode)` is clearer and less
  error-prone than `(mode & S_IFMT) == S_IFREG`.
- **Mask with `S_IFMT` first if you must compare constants yourself** — the mode
  bits share a word with permission bits.
- **Remember `lstat` versus `stat`.** `S_ISLNK` only ever fires for a mode
  obtained without following the link (that is `lstat`, or `Path.lstat()`).
- **Prefer `Path.is_file()`/`is_dir()`** for the common cases; drop to `stat`
  for the device/FIFO/socket cases.
- **Let the predicate's `Intable` parameter do the conversion.** Pass the mode
  field directly; there is no need to cast to `Int` first.

## Pitfalls

- **Testing a symlink with `stat()`.** `stat` follows the link, so the mode
  describes the target; use `lstat()` to see `S_ISLNK`. Sources:
  <https://mojolang.org/docs/std/os/fstat/>.
- **Comparing `mode` to `S_IFREG` without masking.** Permission and other bits
  make an exact comparison fail; use the predicates.
- **Assuming the masks are octal literals.** The docs list decimal values; the
  POSIX constants are octal-derived but the numbers shown are decimal.
- **Expecting `stat` to open or read a file.** It only interprets a mode; the
  call that produces the mode is in [`os`](os.md)/[`pathlib`](pathlib.md).
- **Forgetting that `stat()` and `lstat()` raise.** They are filesystem calls;
  call them from a `raises` function.
- **Portability.** These are POSIX bits. On a non-POSIX target the constants may
  not describe the platform's file types the way they do on Linux/macOS — the
  package description scopes itself to "Unix-like systems."
- **Assuming a stable API.** See below.

## Stability

The `stat` package page, the `stat` module page and the predicate pages show
**no `@stable(since=...)` marker** and no stability badges. Under the
standard-library rule — "We consider standard library APIs unstable unless
specifically marked stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/stat/>,
<https://mojolang.org/docs/std/stat/stat/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `stat` package: <https://mojolang.org/docs/std/stat/>
- Mojo `stat.stat` module: <https://mojolang.org/docs/std/stat/stat/>
- Mojo `S_ISREG` function: <https://mojolang.org/docs/std/stat/stat/S_ISREG/>
- Mojo `os.fstat` module: <https://mojolang.org/docs/std/os/fstat/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
