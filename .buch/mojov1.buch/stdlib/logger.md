# logger

`logger` is Mojo's severity-based logging package.

> Logging with configurable severity levels.

> The `logger` package provides a flexible logging system with multiple severity
> levels for debugging and monitoring applications. It supports configurable log
> levels (`TRACE`, `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`), colored
> output, customizable formatting, and environment-based configuration. The
> logging level can be set via the LOGGING_LEVEL environment variable to control
> message verbosity.

> Use this package for debugging, monitoring application behavior, error
> reporting, or adding instrumentation to track program execution.

Source: <https://mojolang.org/docs/std/logger/>.

## `Level`

`Level` is a struct of severity constants, ordered ascending:

| Constant | Value | Meaning (from the docs) |
|----------|-------|-------------------------|
| `Level.NOTSET` | 0 | "Lowest level, used when no level is set." |
| `Level.TRACE` | 10 | "Repetitive trace information ... typically only of interest when diagnosing hangs." |
| `Level.DEBUG` | 20 | "Detailed information, typically of interest only when diagnosing problems." |
| `Level.INFO` | 30 | "Confirmation that things are working as expected." |
| `Level.WARNING` | 40 | "Indication that something unexpected happened, or may happen in the near future." |
| `Level.ERROR` | 50 | "Due to a more serious problem, the software has not been able to perform some function." |
| `Level.CRITICAL` | 60 | "A serious error indicating that the program itself may be unable to continue running." |

Source: <https://mojolang.org/docs/std/logger/logger/Level/>.

`Level` is `Comparable` and `Writable` and provides `color()`, which "Returns the
ANSI color of the level".

## `Logger`

```text
struct Logger[level: Level = DEFAULT_LEVEL]
```

> A logger that outputs messages at or above a specified severity level.

Source: <https://mojolang.org/docs/std/logger/logger/Logger/>.

The level is a **compile-time parameter**, so it is fixed per logger type. The
constructor takes a destination and formatting options:

```text
def __init__(out self, fd: FileDescriptor = stdout, *, prefix: String = "", source_location: Bool = False)
```

So the logger writes to a `FileDescriptor` (default `stdout`), can carry a prefix,
and can optionally include the source location in each message. Source:
<https://mojolang.org/docs/std/logger/logger/Logger/>.

The six methods mirror the six levels:

| Method | Level |
|--------|-------|
| `trace(...)` | TRACE |
| `debug(...)` | DEBUG |
| `info(...)` | INFO |
| `warning(...)` | WARNING |
| `error(...)` | ERROR |
| `critical(...)` | CRITICAL |

All six share the same shape:

```text
def info[*Ts: Writable](self, *values: *Ts.values, *, sep: StringSpan = " ", end: StringSpan = "\n", location: Optional[SourceLocation] = None)
```

They accept variadic `Writable` values plus `sep`, `end` and an optional
`location` (defaulting to `call_location`). Source:
<https://mojolang.org/docs/std/logger/logger/Logger/>.

`critical` is different in one important way: it "Logs a critical message **and
aborts execution**."

## A runnable example

```mojo
from std.logger import Logger, Level

def main():
    # Only messages at or above WARNING are emitted.
    var log = Logger[Level.WARNING](prefix="app: ")

    log.trace("very noisy")        # suppressed
    log.debug("still noisy")       # suppressed
    log.info("starting up")        # suppressed
    log.warning("disk almost full")
    log.error("request failed:", 500)
    # log.critical("fatal")        # logs, then aborts the program
```

The variadic form means you never need to format the message manually: pass the
values and a separator, exactly like `print`.

With source locations:

```mojo
from std.logger import Logger, Level

def main():
    var log = Logger[Level.DEBUG](source_location=True)
    log.debug("this line reports where it was called")
```

## Environment configuration

The package description states that the logging level can be set through the
`LOGGING_LEVEL` environment variable. Source:
<https://mojolang.org/docs/std/logger/>. Combined with
[`os`](os.md)'s `getenv`, that is how a program lets the deployment decide
verbosity without a rebuild:

```mojo
from std.logger import Logger, Level
from std.os import getenv

def main():
    var level = getenv("LOGGING_LEVEL", "INFO")
    if level == "DEBUG":
        var log = Logger[Level.DEBUG]()
        log.debug("debug logging enabled")
    else:
        var log = Logger[Level.INFO]()
        log.info("running at INFO")
```

## Idioms

- **Pick the level at the type.** `Logger[Level.INFO]` is not a runtime setting
  on an instance; it is a parameter.
- **Pass values, not pre-formatted strings.** The methods are variadic
  `Writable`, like `print`.
- **Use `warning`/`error` for things an operator should see**, `debug`/`trace`
  for diagnosis, and reserve `critical` for a non-recoverable state because it
  aborts.
- **Set `source_location=True` during development** and turn it off in production
  output.
- **Let the environment choose the level** via `LOGGING_LEVEL`, so verbosity is a
  deployment concern.

## Pitfalls

- **Using `critical` casually.** It aborts the process. Verified from
  <https://mojolang.org/docs/std/logger/logger/Logger/>.
- **Expecting a `level` passed at run time to take effect.** `level` is a struct
  parameter; a different level means a different logger type.
- **Forgetting that `fd` defaults to `stdout`.** Route to a file explicitly by
  passing a `FileDescriptor`.
- **Logging inside a hot loop at `TRACE`.** Even when filtered, the call site
  remains; measure with [`benchmark`](benchmark.md) if it matters.
- **Assuming a stable API.** See below.

> **Open question:** the package description mentions "customizable formatting"
> and an environment-based configuration via `LOGGING_LEVEL`, but the `Logger`
> documentation shows only `fd`, `prefix` and `source_location` as construction
> options. The exact interaction between `LOGGING_LEVEL` and the compile-time
> `level` parameter is not spelled out on the package or struct page. Confirm it
> against <https://mojolang.org/docs/std/logger/logger/Logger/> before relying on
> the environment variable to override a compiled level.

## Stability

The `logger` package page, the `logger` module page, and the `Logger` and `Level`
pages show **no `@stable(since=...)` markers** and no stability badges. Under the
standard-library rule — "We consider standard library APIs unstable unless
specifically marked stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/logger/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `logger` package: <https://mojolang.org/docs/std/logger/>
- Mojo `logger` module: <https://mojolang.org/docs/std/logger/logger/>
- Mojo `Logger` struct: <https://mojolang.org/docs/std/logger/logger/Logger/>
- Mojo `Level` struct: <https://mojolang.org/docs/std/logger/logger/Level/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
