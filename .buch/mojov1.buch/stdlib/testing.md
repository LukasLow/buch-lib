# testing

`testing` is the standard library's unit-testing package: assertion functions and
the `TestSuite` runner.

> Unit testing: Assertions (equal, true, raises) and test suites.

> The `testing` package provides a unit testing framework for Mojo code. It
> includes assertion functions for validating conditions and values, plus
> infrastructure for organizing and running test suites. The framework follows
> familiar patterns from other testing libraries, making it straightforward to
> write and maintain tests.

> Use this package to write unit tests for your Mojo code, validate correctness,
> and catch regressions during development.

Source: <https://mojolang.org/docs/std/testing/>.

**This page is the package/API reference.** The workflow — how to structure a
test file, what counts as a test, how to run it, how to filter tests, and how to
wire it into CI — is in [Testing (tooling)](../tooling/testing.md). Read that page
for the procedure; read this one for signatures, the `TestSuite` fields, and the
stability situation. Together they are sufficient to set up a suite offline.

## Structure

| Unit | Contents |
|------|----------|
| `testing` module | The assertion functions and the `assert_raises` context manager. |
| `suite` module | `TestSuite`, `TestReport`, `TestResult`, `TestSuiteReport`. |
| `prop` (subpackage) | A property-testing package: `strategy`, `random`, `runner`. |

Source: <https://mojolang.org/docs/std/testing/>.

## The minimal working test file

```mojo
from std.testing import assert_equal, TestSuite

def inc(n: Int) -> Int:
    return n + 1

def test_inc_one() raises:
    assert_equal(inc(1), 2)

def main() raises:
    TestSuite.discover_tests[__functions_in_module()]().run()
```

Run it with `mojo run test_inc.mojo`. A test is a no-argument, module-scope
function whose name starts with `test_` and that declares `raises`; it fails by
raising. The full rule set and the exact output format are in
[Testing (tooling)](../tooling/testing.md).

## The assertion functions

> The Mojo standard library includes a [`testing`](/docs/std/testing/testing/)
> module that defines several assertion functions for implementing tests. Each
> assertion returns `None` if its condition is met or raises an error if it
> isn't.

Source: <https://mojolang.org/docs/tools/testing/>.

| Function | Signature (documented) | Asserts |
|----------|------------------------|---------|
| `assert_true` | generic over a `Boolable`-style input | the value is `True`. |
| `assert_false` | generic | the value is `False`. |
| `assert_equal[T: Equatable & Writable]` | `assert_equal(lhs: T, rhs: T, msg: String = "", *, location: Optional[SourceLocation] = None)` | `lhs == rhs`. |
| `assert_not_equal` | generic | `lhs != rhs`. |
| `assert_almost_equal[dtype, size]` | `assert_almost_equal(lhs: SIMD[dtype, size], rhs: SIMD[dtype, size], msg="", *, atol=1e-8, rtol=1e-5, equal_nan=False, location=None)` | numeric closeness within a tolerance. |
| `assert_is[T: Identifiable & Writable]` | `assert_is(lhs: T, rhs: T, msg="", *, location=None)` | same identity (`is`). |
| `assert_is_not` | generic | different identity. |
| `assert_equal_pyobj` | two `PythonObject`s | Python-object equality. |

Sources: <https://mojolang.org/docs/std/testing/testing/>,
<https://mojolang.org/docs/std/testing/testing/assert_equal/>,
<https://mojolang.org/docs/std/testing/testing/assert_almost_equal/>,
<https://mojolang.org/docs/std/testing/testing/assert_is/>.

Every function accepts an optional `msg` and an explicit `location` override
(defaulting to `call_location`, which points at the assertion).

### Floating-point comparison

`assert_almost_equal` is specifically for floats. It uses the formula
`abs(lhs - rhs) <= max(rtol * max(abs(lhs), abs(rhs)), atol)`:

> When the type is boolean or integral, then equality is checked. When the type
> is floating-point, then this checks if the two input values are numerically the
> close using the $abs(lhs - rhs) <= max(rtol * max(abs(lhs), abs(rhs)), atol)$
> formula.

Source: <https://mojolang.org/docs/std/testing/testing/assert_almost_equal/>.

```mojo
from std.testing import assert_almost_equal

def test_division() raises:
    var result = 10.0 / 3.0
    assert_almost_equal(result, 3.33, atol=0.01)
    assert_almost_equal(result, 3.333333, rtol=1e-5)
```

Source: <https://mojolang.org/docs/tools/testing/>. Both `atol` and `rtol` are
documented parameters; `equal_nan` controls whether NaNs compare equal.

### `assert_raises` — the context manager

```text
struct assert_raises
    def __init__(out self, *, location: Optional[SourceLocation] = None)
    def __init__(out self, *, contains: String, location: Optional[SourceLocation] = None)
    def __enter__(self)
    def __exit__(self)
    def __exit__[E: AnyType](self, error: E) -> Bool
```

> Context manager that asserts that the block raises an exception. You can use
> this to test expected error cases, and to test that the correct errors are
> raised. Works with `Error` and any custom `Writable` error type.

Source: <https://mojolang.org/docs/std/testing/testing/assert_raises/>.

```mojo
from std.testing import assert_raises

def test_error_path() raises:
    # Passes: an error was raised.
    with assert_raises():
        raise Error("SomeError")

    # Passes: the message contains the required substring.
    with assert_raises(contains="Some"):
        raise Error("SomeError")

    # Fails: no error was raised.
    # with assert_raises():
    #     pass
```

Source: <https://mojolang.org/docs/std/testing/testing/assert_raises/>. If
`contains` is set and the error message does not include the string, the
assertion raises; other errors propagate and fail the test. Note the struct's
name is lowercase — `assert_raises` is a **struct**, not a function.

The tools page adds the discard-pattern detail: assign an unused return value to
`_` inside the block (`_ = inc(Int.MAX)`) to avoid the compiler's unused-value
warning. Source: <https://mojolang.org/docs/tools/testing/>.

## `TestSuite` — the runner

```text
struct TestSuite
    def __init__(out self, *, location: Optional[SourceLocation] = None, var cli_args: Optional[List[StringSpan[ImmStaticOrigin]]] = None)
    static def discover_tests[test_funcs](*, location=None, var cli_args=None) -> Self
    def test[f: def() raises thin -> None](mut self)
    def skip[f: def() raises thin -> None](mut self)
    def generate_report(mut self, skip_all: Bool = False) -> TestSuiteReport
    def run(deinit self, *, quiet: Bool = False, skip_all: Bool = False)
    def abandon(deinit self)
```

Source: <https://mojolang.org/docs/std/testing/suite/TestSuite/>.

Fields:

| Field | Type | Meaning |
|-------|------|---------|
| `tests` | `List[_Test]` | "The list of tests registered in this suite." |
| `location` | `SourceLocation` | Where the suite was created. |
| `skip_list` | `Set[String]` | Tests to skip. |
| `allow_list` | `Optional[Set[String]]` | Tests to allow (the `--only` list). |
| `cli_args` | `List[StringSpan[ImmStaticOrigin]]` | The raw command-line arguments. |

Source: <https://mojolang.org/docs/std/testing/suite/TestSuite/>.

Important details:

- **`discover_tests`** is a **static** method: "In most cases, callers should
  pass `__functions_in_module()`." It raises "[i]f test discovery fails (e.g.
  because of a nonconforming test function signature)."
- **`test`** registers a test explicitly, for manual suites.
- **`skip`** registers a test to skip; skipping an unregistered test "will be
  raised when the suite is run."
- **`run`** takes `deinit self`, so the call site transfers ownership: `suite^.run()`.
  `run(quiet=True)` "Suppresses printing the report when the suite does not fail."
- **`generate_report`** returns a `TestSuiteReport` for programmatic use.
- **`abandon`** destroys a suite without running it.

### Manual registration

```mojo
from std.testing import assert_equal, TestSuite

def some_test() raises:
    assert_equal(1 + 1, 2)

def main() raises:
    var suite = TestSuite()
    suite.test[some_test]()
    suite^.run()
```

Source: <https://mojolang.org/docs/std/testing/suite/TestSuite/>.

### Programmatic skipping

```mojo
def main() raises:
    var suite = TestSuite.discover_tests[__functions_in_module()]()
    suite.skip[test_flaky]()
    suite^.run()
```

Source: <https://mojolang.org/docs/tools/testing/>. The tools page states the
precedence rule: "A programmatic skip always takes effect, even when you use
`--only` to allow a test that's also skipped in the code."

### CI-friendly form

```mojo
def main() raises:
    TestSuite.discover_tests[__functions_in_module()]().run(quiet=True)
```

`quiet=True` is silent on success and prints only on failure. Source:
<https://mojolang.org/docs/std/testing/suite/TestSuite/>.

## Command-line filtering

A test file that uses `TestSuite` accepts:

| Flag | Meaning |
|------|---------|
| `--skip <names>` | Run everything except the named tests. |
| `--only <names>` | Run only the named tests. |
| `--skip-all` | Collect and list tests without running them. |

Source: <https://mojolang.org/docs/tools/testing/>. Names are separate
space-separated arguments, must match exactly, and `--skip`/`--only` are mutually
exclusive. The suite takes these from `sys.argv()` by default — which it reads
through [`sys`](sys.md)'s `argv()`.

```sh
mojo run -I src test/my_math/test_inc.mojo --skip test_inc_max
```

Source: <https://mojolang.org/docs/tools/testing/>.

## Assertions versus the `assert` keyword

They are not interchangeable:

| Mechanism | Import | On failure | Catchable |
|-----------|--------|------------|-----------|
| `assert_equal()` etc. | `from std.testing import …` | raises `AssertionError` | yes — this is what makes a test "fail" |
| `assert cond, "msg"` | built-in keyword | aborts the program | no |
| `comptime assert cond` | built-in keyword | compile error | n/a |

Source: <https://mojolang.org/docs/tools/testing/>. Use the `testing` helpers in
test code; the keyword is for invariants. See
[`assert`](../keywords/assert.md) and [safety and undefined
behaviour](../errors/safety-and-undefined-behaviour.md).

## Property testing (`prop`)

The `testing` package also ships a property-testing subpackage:

> [`prop`](/docs/std/testing/prop/): A property testing package. … [`strategy`]:
> Implements the `Strategy` trait and exports built-in strategies for
> property-based testing. … [`random`]: Implements random number generation for
> property-based testing. … [`runner`]: Implements the property test runner and
> configuration.

Source: <https://mojolang.org/docs/std/testing/prop/>. Its members are `Rng`,
`PropTest`, `PropTestConfig`, `Strategy`, and the `list_strategy`,
`simd_strategy`, `string_strategy` helpers. Source:
<https://mojolang.org/docs/std/testing/prop/>.

> **Open question — property testing is listed, not taught.** The `prop` package
> exists in the standard library with `strategy`, `random` and `runner` modules,
> but the official *Testing* tools page does not document property-based tests at
> all — no workflow, no example, no import. Treat property testing as
> API-reference-only until the tools page teaches it. Sources:
> <https://mojolang.org/docs/tools/testing/>,
> <https://mojolang.org/docs/std/testing/prop/>.

## Idioms

- **One test file per target module**, under `test/`, with source in `src/` and
  `-I src` on the command line. See [Testing (tooling)](../tooling/testing.md).
- **Name tests `test_*`, no arguments, module scope, `raises`.**
- **Use `assert_equal`/`assert_almost_equal` rather than manual comparisons**, so
  failures print a useful diff.
- **Use `assert_raises` for error paths** instead of a manual try/except.
- **Use `quiet=True` in CI** so a passing suite is silent.
- **Call `skip()` for a test that must stay disabled**, because it overrides
  `--only`.
- **Prefer `discover_tests[__functions_in_module()]()`** over manual
  registration unless you need to construct the suite dynamically.

## Pitfalls

- **Forgetting `raises` on a test.** A test signals failure by raising; a
  non-raising test cannot propagate an assertion error.
- **Naming a test something other than `test_*`.** Discovery filters by prefix,
  so it is silently not run.
- **Defining a test inside a struct.** Tests must be at module scope.
- **Comparing floats with `assert_equal`.** Use `assert_almost_equal` with a
  tolerance.
- **Forgetting `^` on `suite.run()`.** `run` takes `deinit self`.
- **Combining `--skip` and `--only`**, or passing names as one quoted argument.
- **Expecting a `mojo test` command.** Tests run through `mojo run`.
- **Assuming `assert_raises` is a function.** It is a struct used as a context
  manager.
- **Assuming a stable API.** See below.

> **Open question:** the official pages document `assert_raises()` as the
> idiomatic spelling and list `assert_raises` as a struct, but the 1.x test
> output examples show `AssertionError` as the raised type. The relationship
> between the documented `Error`/assertion types and the displayed
> `AssertionError` is not stated on the package page. Verify before catching a
> specific assertion error type. Sources:
> <https://mojolang.org/docs/std/testing/testing/assert_raises/>,
> <https://mojolang.org/docs/tools/testing/>.

## Stability

The `testing` package page, the `testing` and `suite` module pages, and the
`TestSuite` and assertion pages show **no `@stable(since=...)` marker** and no
stability badges. Under the standard-library rule — "We consider standard library
APIs unstable unless specifically marked stable" — these APIs are **unstable by
default**. Sources: <https://mojolang.org/docs/std/testing/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `testing` package: <https://mojolang.org/docs/std/testing/>
- Mojo `testing.testing` module: <https://mojolang.org/docs/std/testing/testing/>
- Mojo `assert_equal`: <https://mojolang.org/docs/std/testing/testing/assert_equal/>
- Mojo `assert_almost_equal`: <https://mojolang.org/docs/std/testing/testing/assert_almost_equal/>
- Mojo `assert_is`: <https://mojolang.org/docs/std/testing/testing/assert_is/>
- Mojo `assert_raises`: <https://mojolang.org/docs/std/testing/testing/assert_raises/>
- Mojo `testing.suite` module: <https://mojolang.org/docs/std/testing/suite/>
- Mojo `TestSuite` struct: <https://mojolang.org/docs/std/testing/suite/TestSuite/>
- Mojo `testing.prop` subpackage: <https://mojolang.org/docs/std/testing/prop/>
- Mojo tools — Testing: <https://mojolang.org/docs/tools/testing/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
