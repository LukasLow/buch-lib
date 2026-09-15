# os

`os` is Mojo's portable operating-system interface.

> OS interface layer: environment, filesystem, process control.

> The `os` package provides platform-independent access to operating system
> functionality including filesystem operations, environment variables, and
> process control. It offers portable interfaces to OS-dependent features,
> abstracting platform differences while exposing system-level capabilities. This
> package serves as the foundation for system programming in Mojo.

> Use this package for system-level operations, filesystem management,
> environment configuration, or platform abstraction. **For file I/O operations,
> use the built-in `open()` function. For path manipulation, see the `os.path`
> package for path functions or the `pathlib` package for the object-oriented
> `Path` type.**

Source: <https://mojolang.org/docs/std/os/>.

Those pointers matter: `os` is *not* where you open files or build paths. It is
environment, filesystem metadata, and processes.

## Subpackage and modules

| Unit | Contents |
|------|----------|
| `path` subpackage | OS-independent path functions |
| `env` | `getenv`, `setenv`, `unsetenv` |
| `fstat` | `stat`, `lstat`, `stat_result` |
| `os` | Directory and file-system operations, `abort`, `getuid`, `isatty`, seek constants |
| `pathlike` | The `PathLike` trait |
| `process` | `Process`, `ProcessStatus`, `Pipe` |

Source: <https://mojolang.org/docs/std/os/>.

## Environment variables

```mojo
from std.os import getenv, setenv, unsetenv

def main():
    # getenv returns the value of the given environment variable.
    var home = getenv("HOME", "/tmp")
    print(home)

    setenv("MY_APP_MODE", "debug")
    print(getenv("MY_APP_MODE", "unset"))   # debug

    unsetenv("MY_APP_MODE")
```

Source: <https://mojolang.org/docs/std/os/env/>.

`getenv` "Returns the value of the given environment variable", `setenv`
"Changes or adds an environment variable", `unsetenv` "Unsets an environment
variable". This is also how the [`logger`](logger.md) package's
`LOGGING_LEVEL` convention is read.

## Filesystem operations

The `os.os` module lists these functions:

| Function | What it does |
|----------|--------------|
| `mkdir(path)` | "Creates a directory at the specified path." |
| `makedirs(path)` | "Creates a specified leaf directory along with any necessary intermediate directories." |
| `rmdir(path)` | "Removes the specified directory." |
| `removedirs(path)` | "Removes a leaf directory and all empty intermediate ones." |
| `listdir(path)` | "Gets the list of entries contained in the path provided." |
| `remove(path)` | "Removes the specified file." |
| `unlink(path)` | "Removes the specified file." |
| `link(src, dst)` | "Creates a new hard-link to an existing file." |
| `symlink(src, dst)` | "Creates a symlink." |
| `chdir(path)` | "Changes the current working directory." |
| `getuid()` | "Retrieve the user ID of the calling process." |
| `isatty(fd)` | "Checks whether a file descriptor refers to a terminal." |
| `abort()` | "Terminates execution, using a target dependent trap instruction if available." |

Source: <https://mojolang.org/docs/std/os/os/>.

```mojo
from std.os import mkdir, listdir, remove, rmdir

def main() raises:
    mkdir("scratch")
    for name in listdir("scratch"):
        print(name)
    remove("scratch")
    rmdir("scratch")   # or rmdir for the empty directory
```

### Seek constants

`os.os` exports `SEEK_SET` (0), `SEEK_CUR` (1) and `SEEK_END` (2) for file
positioning, plus `sep`, "The path separator for the current platform". Source:
<https://mojolang.org/docs/std/os/os/>.

## Paths: `os.path` versus `pathlib`

Two APIs, two styles:

- **`os.path`** — a functional API, mirroring Python's `os.path`:
  `basename`, `dirname`, `exists`, `expanduser`, `expandvars`, `getsize`,
  `is_absolute`, `isdir`, `isfile`, `islink`, `join`, `lexists`, `realpath`,
  `split`, `split_extension`, `splitroot`.
- **`pathlib.Path`** — an object-oriented `Path` type with `/` joining,
  `exists()`, `is_dir()`, `is_file()`, `read_text()`, `write_text()`,
  `listdir()`, `suffix()`, `name()`, `parts()`, `joinpath()`.

Sources: <https://mojolang.org/docs/std/os/path/>,
<https://mojolang.org/docs/std/os/path/path/>,
<https://mojolang.org/docs/std/pathlib/path/Path/>.

For new code, prefer `Path`; see [`pathlib`](pathlib.md) for the full page.

```mojo
from std.os.path import join, exists

def main():
    var p = join("data", "input.csv")
    print(p, exists(p))
```

## `stat` and file metadata

The `fstat` module provides:

- `stat(path)` — "Get the status of a file or a file descriptor."
- `lstat(path)` — the same but without following symlinks.
- `stat_result` — "Object whose fields correspond to the members of the stat
  structure."

Source: <https://mojolang.org/docs/std/os/fstat/>.

The file-**type decoding** of those mode bits belongs to the [`stat`](stat.md)
package.

## Processes

The `process` module provides `Process` ("Create and manage child processes from
file executables"), `ProcessStatus` ("Represents the termination status of a
process") and `Pipe` ("Create a pipe for interprocess communication"). Source:
<https://mojolang.org/docs/std/os/process/>.

For the common case of "run a command and capture its output", the
[`subprocess`](subprocess.md) package's `run()` is the simpler entry point.

## `PathLike`

> A trait representing file system paths.

Source: <https://mojolang.org/docs/std/os/pathlike/PathLike/>. Both `String` and
`Path` conform to it, which is why a function accepting `PathLike` works with
either.

## Idioms

- **Use `os` for environment and process state, `open()`/`Path` for files.**
  The package description says so explicitly.
- **Use `pathlib.Path` for constructing and querying paths**; fall back to
  `os.path` for one-off string operations.
- **Handle the raising operations.** `mkdir`, `remove`, `chdir` and friends act
  on the real filesystem and can fail; call them from a `raises` function.
- **Prefer `makedirs` to `mkdir`** when intermediate directories may not exist.
- **Use `getenv(name, default)` with an explicit default** rather than assuming a
  variable is set.
- **Check `isatty` before writing colored or interactive output.**

## Pitfalls

- **Expecting `os` to open files.** Use the built-in `open()` (see [`io`](io.md))
  or `Path.read_text()`.
- **Using `os` for path manipulation.** Use `os.path` or `Path`.
- **Ignoring failure.** Filesystem calls raise; a non-raising caller will not
  compile when it calls them.
- **Assuming `listdir` order.** Directory order is not specified; sort if you
  need determinism.
- **Confusing `remove` and `rmdir`.** The first removes a file, the second a
  directory.
- **Using `abort()` for normal error handling.** It terminates the process with a
  trap instruction; prefer raising an `Error` or exiting.
- **Assuming a stable API.** See below.

## Stability

The `os` package page and its module pages (`env`, `fstat`, `os`, `pathlike`,
`process`, `path`) show **no `@stable(since=...)` markers** and no stability
badges. Under the standard-library rule — "We consider standard library APIs
unstable unless specifically marked stable" — these APIs are **unstable by
default**. Sources: <https://mojolang.org/docs/std/os/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `os` package: <https://mojolang.org/docs/std/os/>
- Mojo `os.os` module: <https://mojolang.org/docs/std/os/os/>
- Mojo `env` module: <https://mojolang.org/docs/std/os/env/>
- Mojo `fstat` module: <https://mojolang.org/docs/std/os/fstat/>
- Mojo `path` subpackage: <https://mojolang.org/docs/std/os/path/>
- Mojo `path` module functions: <https://mojolang.org/docs/std/os/path/path/>
- Mojo `pathlike` module: <https://mojolang.org/docs/std/os/pathlike/>
- Mojo `process` module: <https://mojolang.org/docs/std/os/process/>
- Mojo `Path` struct: <https://mojolang.org/docs/std/pathlib/path/Path/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
