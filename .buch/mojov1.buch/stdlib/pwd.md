# pwd

`pwd` resolves user accounts from the Unix password database.

> Password database lookups for user account information.

> The `pwd` package provides access to the Unix password database for retrieving
> user account information. It offers a portable interface to query user records
> by username or user ID on Unix-like systems. This package enables programs to
> look up user details such as home directories, shells, and group memberships.

> Use this package when you need to resolve user IDs to usernames, retrieve user
> home directories, validate user existence, or access other user account
> metadata on Unix-like systems.

Source: <https://mojolang.org/docs/std/pwd/>.

It is the Mojo counterpart of Python's `pwd` module. The module page states the
platform constraint plainly:

> Provides access to the user password database on Unix-like systems.
>
> Constraints: Available on Linux and macOS only.

Source: <https://mojolang.org/docs/std/pwd/pwd/>.

So on Windows there is no `pwd` to call. Guard with a `comptime if` on
[`sys`](sys.md)'s target predicates (`CompilationTarget.is_linux()` /
`is_macos()`) if the code must build cross-platform.

## What an agent actually uses

The package has exactly three members — one struct and two functions. There is
no curation needed here; this is the complete API.

| Member | Kind | Purpose |
|--------|------|---------|
| `Passwd` | struct | "Represents user account information retrieved from the user password database related to a user ID." |
| `getpwnam(name)` | function | "Retrieves the user ID in the password database for the given user name." |
| `getpwuid(uid)` | function | "Retrieve the password database entry for a given user ID." |

Source: <https://mojolang.org/docs/std/pwd/pwd/>.

Both functions are constrained to Linux or macOS:

> **Constraints:** This function is constrained to run on Linux or macOS
> operating systems only.

Source: <https://mojolang.org/docs/std/pwd/pwd/getpwnam/> (and identically on
<https://mojolang.org/docs/std/pwd/pwd/getpwuid/>).

### `Passwd`

The struct exposes the seven fields of the underlying `struct passwd`:

| Field | Type | Meaning |
|-------|------|---------|
| `pw_name` | `String` | "User name." |
| `pw_passwd` | `String` | "User password." |
| `pw_uid` | `Int` | "User ID." |
| `pw_gid` | `Int` | "Group ID." |
| `pw_gecos` | `String` | "Real name or comment field." |
| `pw_dir` | `String` | "Home directory." |
| `pw_shell` | `String` | "Shell program." |

Source: <https://mojolang.org/docs/std/pwd/pwd/Passwd/>. `Passwd` conforms to
`AnyType`, `Copyable`, `Deinitable`, `Movable` and `Writable`, so it can be
printed directly.

### `getpwnam` and `getpwuid`

```text
def getpwnam(var name: String) -> Passwd
def getpwuid(uid: Int) -> Passwd
```

Source: <https://mojolang.org/docs/std/pwd/pwd/getpwnam/>,
<https://mojolang.org/docs/std/pwd/pwd/getpwuid/>.

Both take their input by value (`var`) and **raise** if the user does not exist:

> Raises: If the user name does not exist or there is an error retrieving the
> information.

Source: <https://mojolang.org/docs/std/pwd/pwd/getpwnam/>. The same wording
applies to `getpwuid`.

### A runnable example

```mojo
from std.pwd import getpwnam, getpwuid

def main() raises:
    var entry = getpwnam("root")
    print(entry.pw_name)     # root
    print(entry.pw_uid)      # 0 on most systems
    print(entry.pw_gid)      # 0 on most systems
    print(entry.pw_dir)      # /root on Linux, /var/root on macOS
    print(entry.pw_shell)    # e.g. /bin/bash; empty if not set
    print(entry.pw_gecos)    # real name / comment field

    # The reverse direction: user ID -> account.
    var by_id = getpwuid(entry.pw_uid)
    print(by_id.pw_name)     # root
```

`Passwd` is `Writable`, so `print(entry)` also works and renders the struct.
Source: <https://mojolang.org/docs/std/pwd/pwd/Passwd/>.

### Resolving the current user

[`os`](os.md) provides `getuid()`, which pairs with `getpwuid` to answer "who am
I?":

```mojo
from std.os import getuid
from std.pwd import getpwuid

def main() raises:
    var me = getpwuid(getuid())
    print("user:", me.pw_name)
    print("home:", me.pw_dir)
```

Source: <https://mojolang.org/docs/std/os/os/> (`getuid`, "Retrieve the user ID
of the calling process") and <https://mojolang.org/docs/std/pwd/pwd/getpwuid/>.

## Idioms

- **Use `getpwuid(getuid())` to find the current user's name and home
  directory** rather than reading `$HOME` (which can be stale or unset).
- **Treat every lookup as fallible.** `getpwnam`/`getpwuid` raise; a
  non-raising caller will not compile when it calls them.
- **Prefer `pw_dir` to hand-built paths** when you need a user's home
  directory; it reflects the account database, not an environment variable.
- **Use `Path(me.pw_dir)` from [`pathlib`](pathlib.md)** once you have the
  directory string, rather than string concatenation.
- **Gate on platform at compile time.** The functions are Linux/macOS-only; a
  `comptime if` over the [`sys`](sys.md) target predicates keeps
  cross-platform builds compiling.
- **Never treat `pw_passwd` as a password.** On modern systems it is a
  placeholder such as `x` or `*`; the real hash lives in a shadow database.

## Pitfalls

- **Calling `pwd` on Windows.** It is not available there. Source:
  <https://mojolang.org/docs/std/pwd/pwd/>.
- **Assuming the user exists.** A missing name or a dangling UID raises; use
  `try`/`except` around a best-effort lookup.
- **Reading `pw_uid` as unsigned.** It is an `Int` in Mojo, but the underlying
  POSIX type is unsigned; do not assume a negative value is meaningful.
- **Passing an `Int` from a `UInt` without checking.** `getpwuid(uid: Int)`
  takes a signed `Int`; a large `UInt` does not fit silently.
- **Treating the field set as stable across platforms.** The struct mirrors
  `struct passwd`; the values (particularly `pw_shell`, `pw_passwd` and
  `pw_gecos`) vary by OS and are frequently empty.
- **Caching a `Passwd` indefinitely.** It is a snapshot of the database at call
  time; account data can change.
- **Assuming a stable API.** See below.

## Stability

The `pwd` package page and its module and member pages show **no
`@stable(since=...)` marker** and no stability badges. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/pwd/>,
<https://mojolang.org/docs/std/pwd/pwd/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `pwd` package: <https://mojolang.org/docs/std/pwd/>
- Mojo `pwd.pwd` module: <https://mojolang.org/docs/std/pwd/pwd/>
- Mojo `Passwd` struct: <https://mojolang.org/docs/std/pwd/pwd/Passwd/>
- Mojo `getpwnam` function: <https://mojolang.org/docs/std/pwd/pwd/getpwnam/>
- Mojo `getpwuid` function: <https://mojolang.org/docs/std/pwd/pwd/getpwuid/>
- Mojo `os.os` module (`getuid`): <https://mojolang.org/docs/std/os/os/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
