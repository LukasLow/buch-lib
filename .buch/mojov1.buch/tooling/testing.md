# Testing

Mojo ships a unit-testing framework built into the standard library. An agent
that reads this page alone can set up a test suite, write tests, run them, skip
or filter them, and wire them into CI. Every statement here comes from the
official tools page (<https://mojolang.org/docs/tools/testing/>) and the
standard-library `testing` reference
(<https://mojolang.org/docs/std/testing/>).

## What the framework is

> Mojo includes a framework for developing and executing unit tests. The Mojo
> testing framework consists of a set of assertions defined as part of the [Mojo
> standard library](/docs/std) and the
> [`TestSuite`](/docs/std/testing/suite/TestSuite/) struct for automatic test
> discovery and execution.

Source: <https://mojolang.org/docs/tools/testing/>.

Two pieces, therefore:

| Piece | What it is | Import |
|-------|------------|--------|
| **Assertion functions** | Library functions that raise an error when a condition fails. | `from std.testing import …` |
| **`TestSuite`** | A struct that discovers, filters and runs test functions, then reports. | `from std.testing import TestSuite` |

The `std.testing` package itself says:

> The `testing` package provides a unit testing framework for Mojo code. It
> includes assertion functions for validating conditions and values, plus
> infrastructure for organizing and running test suites. The framework follows
> familiar patterns from other testing libraries, making it straightforward to
> write and maintain tests.

Source: <https://mojolang.org/docs/std/testing/>.

It has two modules (`suite`, `testing`) and one subpackage (`prop`, a property
testing package) (<https://mojolang.org/docs/std/testing/>).

## Quickstart: a complete test file

The official page's first example, reproduced exactly. Create
`test_quickstart.mojo`:

```mojo
# Content of test_quickstart.mojo
from std.testing import assert_equal, TestSuite

def inc(n: Int) -> Int:
    return n + 1

def test_inc_zero() raises:
    # This test contains an intentional logical error to show an example of
    # what a test failure looks like at runtime.
    assert_equal(inc(0), 0)

def test_inc_one() raises:
    assert_equal(inc(1), 2)

def main() raises:
    TestSuite.discover_tests[__functions_in_module()]().run()
```

Source: <https://mojolang.org/docs/tools/testing/>.

Three things to notice:

- `inc()` is the **test target**; the functions starting with `test_` are the
  **tests**.
- "Usually you should define the target in a separate source file from its
  tests, but you can define them in the same file for this simple example."
- "A test function *fails* if it raises an error when executed, otherwise it
  *passes*."

Run it:

```bash
mojo run test_quickstart.mojo
```

Expected output shape (the page elides full paths):

```output
Unhandled exception caught during execution:
Running 2 tests for ROOT_DIR/test_quickstart.mojo
    FAIL [ 0.009 ] test_inc_zero
      At ROOT_DIR/test_quickstart.mojo:40:5: AssertionError: `left == right` comparison failed:
         left: 1
        right: 0
    PASS [ 0.001 ] test_inc_one
--------
Summary [ 0.009 ] 2 tests run: 1 passed , 1 failed , 0 skipped
Test suite 'ROOT_DIR/test_quickstart.mojo' failed!

mojo: error: execution exited with a non-zero result: 1
```

Source: <https://mojolang.org/docs/tools/testing/>.

The report format is fixed: each test prints `PASS`/`FAIL`/`SKIP` plus its
execution time; failures print their error inline; the summary reports "tests
run, passed, failed, and skipped". A failing suite makes `mojo run` exit
non-zero.

## The assertion functions

> The Mojo standard library includes a [`testing`](/docs/std/testing/testing/)
> module that defines several assertion functions for implementing tests. Each
> assertion returns `None` if its condition is met or raises an error if it
> isn't.

Source: <https://mojolang.org/docs/tools/testing/>.

| Function | Asserts | Source |
|----------|---------|--------|
| `assert_true()` | the input value is `True` | <https://mojolang.org/docs/std/testing/testing/> |
| `assert_false()` | the input value is `False` | <https://mojolang.org/docs/std/testing/testing/> |
| `assert_equal()` | the two values are equal | <https://mojolang.org/docs/std/testing/testing/> |
| `assert_not_equal()` | the two values are not equal | <https://mojolang.org/docs/std/testing/testing/> |
| `assert_almost_equal()` | the values are equal up to a tolerance | <https://mojolang.org/docs/std/testing/testing/> |
| `assert_is()` | the two values have the same identity | <https://mojolang.org/docs/std/testing/testing/> |
| `assert_is_not()` | the two values have different identities | <https://mojolang.org/docs/std/testing/testing/> |
| `assert_equal_pyobj()` | two `PythonObject`s are equal | <https://mojolang.org/docs/std/testing/testing/> |

The tools page describes the first five explicitly; the last three are listed in
the `std.testing.testing` module reference.

### Boolean assertions

```mojo
from std.testing import *
assert_true(False)
```

```output
Unhandled exception caught during execution

Error: At Expression [1] wrapper:14:16: AssertionError: condition was unexpectedly False
```

Source: <https://mojolang.org/docs/tools/testing/>.

### A custom message

Every function accepts an optional `msg` keyword argument:

```mojo
assert_true(False, msg="paradoxes are not allowed")
```

```output
Unhandled exception caught during execution

Error: At Expression [2] wrapper:14:16: AssertionError: paradoxes are not allowed
```

Source: <https://mojolang.org/docs/tools/testing/>.

### Floating-point comparison

> For comparing floating-point values, you should use `assert_almost_equal()`,
> which allows you to specify either an absolute or relative tolerance.

```mojo
var result = 10 / 3
assert_almost_equal(result, 3.33, atol=0.001, msg="close but no cigar")
```

```output
Unhandled exception caught during execution

Error: At Expression [3] wrapper:15:24: AssertionError: 3.3333333333333335 is not close to 3.3300000000000001 with a diff of 0.0033333333333334103 (close but no cigar)
```

Source: <https://mojolang.org/docs/tools/testing/>.

The tolerance parameter is `atol` (absolute). The page also says a **relative**
tolerance is available; the `std` reference's one-line description confirms the
function "Asserts that the input values are equal up to a tolerance"
(<https://mojolang.org/docs/std/testing/testing/>). For the exact relative
parameter name, follow the API reference link; the tools page shows only `atol`.

### `assert_raises()` — the context manager

> The testing module also defines a context manager,
> [`assert_raises()`](/docs/std/testing/testing/assert_raises/), to assert that a
> given code block correctly raises an expected error.

```mojo
def inc(n: Int) raises -> Int:
    if n == Int.MAX:
         raise Error("inc overflow")
    return n + 1

print("Test passes because the error is raised")
with assert_raises():
    _ = inc(Int.MAX)

print("Test fails because the error isn't raised")
with assert_raises():
    _ = inc(Int.MIN)
```

```output
Unhandled exception caught during execution

Test passes because the error is raised
Test fails because the error isn't raised
Error: AssertionError: Didn't raise at Expression [4] wrapper:18:23
```

Source: <https://mojolang.org/docs/tools/testing/>.

Two details the page calls out:

- **The discard pattern.** "The example above assigns the return value from
  `inc()` to a discard pattern. Without it, the Mojo compiler reports a warning
  that the return value is unused."
- **`contains=`.** "You can also provide an optional `contains` argument to
  `assert_raises()` to indicate that the test passes only if the error message
  contains the substring specified. Other errors are propagated, failing the
  test."

```mojo
print("Test passes because the error contains the substring")
with assert_raises(contains="required"):
    raise Error("missing required argument")

print("Test fails because the error doesn't contain the substring")
with assert_raises(contains="required"):
    raise Error("invalid value")
```

Source: <https://mojolang.org/docs/tools/testing/>.

`assert_raises` is a **struct**, not a function: the reference lists it under
"Structs" as a "Context manager that asserts that the block raises an exception"
(<https://mojolang.org/docs/std/testing/testing/>).

## What counts as a unit test

The official rules, verbatim:

> A Mojo unit test is simply a function that fulfills all of these requirements:
>
> - Has a name that starts with `test_` for automatic discovery.
> - Accepts no arguments.
> - Returns `None`.
> - Raises an error to indicate test failure.
> - Is defined at the module scope, not as a Mojo struct method.

Source: <https://mojolang.org/docs/tools/testing/>.

Plus the practical guidance:

> Generally, you should use the assertion utilities from the Mojo standard
> library `testing` module to implement your tests. You can include multiple
> related assertions in the same test function. However, if an assertion raises
> an error during execution, then the test function returns immediately, skipping
> any subsequent assertions.

Source: <https://mojolang.org/docs/tools/testing/>.

The `raises` effect is what makes the test work: an assertion raises, the test
function declares `raises`, and the suite catches that error as the failure
signal.

**Checklist for a test function:**

- [ ] Name begins with `test_`.
- [ ] No arguments.
- [ ] Declared `raises` (so it can propagate assertion failures).
- [ ] Returns `None`.
- [ ] Module scope, not inside a struct.
- [ ] Uses `assert_*` helpers rather than manual `Error` construction where
      possible.

## Running tests with `TestSuite`

> To run your tests, each test file must include a `main()` function that uses
> [`TestSuite.discover_tests()`](/docs/std/testing/suite/TestSuite/#discover_tests)
> to automatically discover and execute all test functions in the module. The
> `__functions_in_module()` compiler intrinsic provides a list of all functions
> defined in the current module, which `discover_tests()` filters to find those
> with the `test_` prefix.

Source: <https://mojolang.org/docs/tools/testing/>.

The canonical `main()`:

```mojo
def main() raises:
    TestSuite.discover_tests[__functions_in_module()]().run()
```

The `TestSuite` reference confirms the mechanism: `discover_tests` is a static
method taking a pack of functions (`test_funcs`), and "In most cases, callers
should pass `__functions_in_module()`" (<https://mojolang.org/docs/std/testing/suite/TestSuite/>).

### A realistic test file for a separate module

```mojo
# File: test_my_target_module.mojo

from my_target_module import convert_input, validate_input
from std.testing import assert_equal, assert_false, assert_raises, assert_true, TestSuite

def test_validate_input() raises:
    assert_true(validate_input("good"), msg="'good' should be valid input")
    assert_false(validate_input("bad"), msg="'bad' should be invalid input")

def test_convert_input() raises:
    assert_equal(convert_input("input1"), "output1")
    assert_equal(convert_input("input2"), "output2")

def test_convert_input_error() raises:
    with assert_raises():
        _ = convert_input("garbage")

def main() raises:
    TestSuite.discover_tests[__functions_in_module()]().run()
```

Run it:

```bash
mojo run test_my_target_module.mojo
```

Source: <https://mojolang.org/docs/tools/testing/>.

### Manual registration (no discovery)

`TestSuite` also supports registering tests explicitly with the `test` method:

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

Note the `^` transfer sigil on `suite^.run()`: `run` takes `deinit self`, so it
consumes the suite. This is the same rule the tools page states for programmatic
skipping ("the method consumes the suite, so you must transfer ownership of the
suite to it").

## Filtering tests from the command line

> A test file that uses `TestSuite` accepts the following command line flags:
>
> - `--skip <names>`: Run all tests *except* the named ones (a skip-list).
> - `--only <names>`: Run *only* the named tests (an allow-list).
> - `--skip-all`: Skip every test, collecting and listing the tests without
>   running any of them.

Source: <https://mojolang.org/docs/tools/testing/>.

The examples use a project with `test/my_math/test_inc.mojo` defining
`test_inc_valid()` and `test_inc_max()`.

**Skip a test:**

```bash
mojo run -I src test/my_math/test_inc.mojo --skip test_inc_max
```

```output
Running 2 tests for test/my_math/test_inc.mojo
    PASS [ 0.001 ] test_inc_valid
    SKIP [ 0.001 ] test_inc_max
--------
Summary [ 0.001 ] 2 tests run: 1 passed , 0 failed , 1 skipped
```

**Run only one test:**

```bash
mojo run -I src test/my_math/test_inc.mojo --only test_inc_valid
```

**List tests without running them:**

```bash
mojo run -I src test/my_math/test_inc.mojo --skip-all
```

Source: <https://mojolang.org/docs/tools/testing/>.

The rules, verbatim:

> - The `--skip` and `--only` flags each accept multiple test names as separate,
>   space-separated arguments. For example, `--skip test_inc_valid test_inc_max`
>   skips both tests. Don't combine the names into a single quoted argument.
> - Test names must match exactly. If you pass a name that doesn't correspond to
>   a discovered test, the suite raises an error and exits with a non-zero
>   status.
> - You can use only one of these flags per command. The `--skip-all` flag takes
>   no test names.

Source: <https://mojolang.org/docs/tools/testing/>.

Notice the `-I src` in every command: the test file imports the target module,
so the compiler needs the source directory on the import path. The `-I` flag is
documented on [`mojo run`](../cli/run.md#options).

## Skipping tests programmatically

> Instead of, or in addition to, filtering from the command line, you can skip
> specific tests in the test file itself. Capture the suite returned by
> `discover_tests()` in a variable and call `skip()` before running the suite.

```mojo
def main() raises:
    var suite = TestSuite.discover_tests[__functions_in_module()]()
    suite.skip[test_inc_max]()
    suite^.run()
```

Source: <https://mojolang.org/docs/tools/testing/>.

Skip several tests by calling `skip()` once per test:

```mojo
def main() raises:
    var suite = TestSuite.discover_tests[__functions_in_module()]()
    suite.skip[test_broken]()
    suite.skip[test_flaky]()
    suite^.run()
```

The precedence rule:

> A programmatic skip always takes effect, even when you use `--only` to allow a
> test that's also skipped in the code. This makes `skip()` a good fit for tests
> that you want to keep disabled regardless of the command line filters, such as
> a test that's broken, flaky, or that depends on an unavailable environment.

Source: <https://mojolang.org/docs/tools/testing/>.

The `TestSuite` API reference adds that skipping an unregistered test "will be
raised when the suite is run" and that `discover_tests` itself raises "[i]f test
discovery fails (e.g. because of a nonconforming test function signature)"
(<https://mojolang.org/docs/std/testing/suite/TestSuite/>).

## The `TestSuite` API

The full documented surface, from the reference
(<https://mojolang.org/docs/std/testing/suite/TestSuite/>):

**Fields:**

| Field | Type | Meaning |
|-------|------|---------|
| `tests` | `List[_Test]` | The list of tests registered in this suite. |
| `location` | `SourceLocation` | Where the test suite was created. |
| `skip_list` | `Set[String]` | The tests to skip. |
| `allow_list` | `Optional[Set[String]]` | The tests to allow (the `--only` list). |
| `cli_args` | `List[StringSpan[ImmStaticOrigin]]` | The raw CLI arguments passed to the suite. |

**Methods:**

| Method | Signature (as documented) | Purpose |
|--------|---------------------------|---------|
| `__init__` | `def __init__(out self, *, location: Optional[SourceLocation] = None, var cli_args: Optional[...] = None)` | Create a suite; defaults to `call_location` and `sys.argv()`. |
| `discover_tests` | `static def discover_tests[test_funcs: Tuple[...], /](*, location=None, var cli_args=None) -> Self` | Discover and register tests from a pack of functions (pass `__functions_in_module()`). |
| `test` | `def test[f: def() raises thin -> None](mut self)` | Register a test to run. |
| `skip` | `def skip[f: def() raises thin -> None](mut self)` | Register a test to skip. |
| `generate_report` | `def generate_report(mut self, skip_all: Bool = False) -> TestSuiteReport` | Run the suite and return a report. |
| `run` | `def run(deinit self, *, quiet: Bool = False, skip_all: Bool = False)` | Run the suite and print the results. |
| `abandon` | `def abandon(deinit self)` | Destroy a suite without running any tests. |

Two API details worth knowing:

- **`run(quiet=True)`** "Suppresses printing the report when the suite does not
  fail". So `suite^.run(quiet=True)` is the CI-friendly form that is silent on
  success and prints on failure.
- **`generate_report()`** gives programmatic access to results
  (`TestSuiteReport`) instead of printing. The reference documents it as "Runs
  the test suite and generates a report" with a `skip_all` argument.

Source: <https://mojolang.org/docs/std/testing/suite/TestSuite/>.

## Where tests live in a project

The tools page's command examples put tests under `test/` with one file per
target module and use `-I src` to reach the code:

```bash
mojo run -I src test/my_math/test_inc.mojo
```

The referenced official example project uses the same convention: tests live in
`test/my_math/` and the source in `src/`
(<https://github.com/modular/modular/tree/mojo/v1.0.0/mojo/examples/testing>).

A workable layout, consistent with the documented commands:

```text
project/
├── src/
│   └── my_math/
│       ├── __init__.mojo
│       └── inc.mojo
└── test/
    └── my_math/
        └── test_inc.mojo
```

See [structure](../project/structure.md) for packages and import resolution and
[CI](../project/ci.md) for running the whole suite in a pipeline.

## Running a whole suite

Each test file is a program with its own `main()`, so a suite is run file by
file. The documented commands are always `mojo run <one test file>`. To run
everything, invoke each file; the simplest shell form is:

```bash
for f in test/**/test_*.mojo; do
  mojo run -I src "$f" || exit 1
done
```

> **Open question:** the official pages show `mojo run <one test file>` only.
> There is no documented `mojo test` command and no documented recursive test
> runner in the 1.x CLI. The loop above composes documented facts (each test
> file is a program; a failed suite exits non-zero) but is not itself an official
> recipe. Sources: <https://mojolang.org/docs/tools/testing/>,
> <https://mojolang.org/docs/cli/>.

## Related testing infrastructure

The `std.testing` package also exposes a **property testing** subpackage:

> [`prop`](/docs/std/testing/prop/): A property testing package. … [`strategy`]:
> Implements the `Strategy` trait and exports built-in strategies for
> property-based testing. … [`random`]: Implements random number generation for
> property-based testing. … [`runner`]: Implements the property test runner and
> configuration.

Source: <https://mojolang.org/docs/std/testing/prop/>.

> **Open question — property testing is listed, not taught.** The `prop` package
> exists in the standard library with `strategy`, `random` and `runner` modules,
> but the official *Testing* tools page does not document property-based tests at
> all — no workflow, no example, no import. Treat property testing as
> API-reference-only until the tools page teaches it. Sources:
> <https://mojolang.org/docs/tools/testing/>,
> <https://mojolang.org/docs/std/testing/prop/>.

Benchmarking is adjacent but separate: the `std.benchmark` package provides
`run()` and a `Report` with mean/total/min/max statistics, which is the
documented way to measure performance rather than correctness. See
[debugging and profiling](debugging-and-profiling.md) for the profiling story.
Source: <https://mojolang.org/docs/std/benchmark/>.

Assertion helpers also interact with the debugger: the debugging page notes that
"[t]he `testing` module includes a number of ways to specify assertions.
Assertions also trigger an error, so can open the debugger in the same way that
a `breakpoint()` call will." Source:
<https://mojolang.org/docs/tools/debugging/>.

## Assertions versus `assert`

`assert_*` are library functions that **raise**; the `assert` keyword **aborts**.
They are not interchangeable:

| Mechanism | Import | On failure | Catchable |
|-----------|--------|------------|-----------|
| `assert_equal()` etc. | `from std.testing import …` | raises `AssertionError` | yes — this is what makes a test "fail" |
| `assert cond, "msg"` | built-in keyword | aborts the program | no |
| `comptime assert cond` | built-in keyword | compile error | n/a |

See [`assert`](../keywords/assert.md) for the keyword and its `-D ASSERT` gating.
Test code should use the `std.testing` helpers, not the `assert` keyword, when
the failure needs to be reported as a test failure.

## Pitfalls

- **Forgetting `raises` on a test.** Tests signal failure by raising; a
  non-raising test cannot propagate an assertion error. Declare `raises`.
  Source: <https://mojolang.org/docs/tools/testing/>.
- **Naming a test something other than `test_*`.** Discovery filters by prefix,
  so it silently is not run. Source: <https://mojolang.org/docs/tools/testing/>.
- **Defining tests inside a struct.** "Is defined at the module scope, not as a
  Mojo struct method." Source: <https://mojolang.org/docs/tools/testing/>.
- **Giving a test arguments.** "Accepts no arguments." Source:
  <https://mojolang.org/docs/tools/testing/>.
- **Passing `--skip` names as one quoted argument.** The names are separate
  space-separated arguments; combining them breaks matching. Source:
  <https://mojolang.org/docs/tools/testing/>.
- **Using `--skip` and `--only` together.** "You can use only one of these flags
  per command." Source: <https://mojolang.org/docs/tools/testing/>.
- **A typo in `--skip`/`--only`.** Names "must match exactly"; an unknown name
  makes the suite raise and exit non-zero. Source:
  <https://mojolang.org/docs/tools/testing/>.
- **Forgetting `-I <src>`.** A test that imports the target fails to compile if
  the source directory is not on the import path. Source:
  <https://mojolang.org/docs/tools/testing/>.
- **Expecting a dedicated test command.** There is no documented `mojo test`;
  tests run through `mojo run`. Source: <https://mojolang.org/docs/cli/>.
- **Comparing floats with `assert_equal`.** Use `assert_almost_equal()` with a
  tolerance. Source: <https://mojolang.org/docs/tools/testing/>.
- **Forgetting `^` on `suite.run()`.** `run` takes `deinit self`; transfer
  ownership with the sigil. Sources:
  <https://mojolang.org/docs/std/testing/suite/TestSuite/>,
  <https://mojolang.org/docs/tools/testing/>.
- **Unused return values.** Assigning a raising call's result to `_` avoids the
  compiler's unused-value warning inside `assert_raises()` blocks. Source:
  <https://mojolang.org/docs/tools/testing/>.

## See also

- [`assert`](../keywords/assert.md) — the aborting keyword, distinct from the
  test helpers.
- [Debugging and profiling](debugging-and-profiling.md) — running a failing test
  under the debugger, and `std.benchmark`.
- [Compiler and flags](compiler-and-flags.md) — `-I`, `-D ASSERT` and the rest.
- [Structure](../project/structure.md) — `src/` packages and imports.
- [CI](../project/ci.md) — running the suite in a pipeline.

## Sources

- Testing (tools): <https://mojolang.org/docs/tools/testing/>
- `std.testing` package: <https://mojolang.org/docs/std/testing/>
- `std.testing.testing` module: <https://mojolang.org/docs/std/testing/testing/>
- `TestSuite` reference: <https://mojolang.org/docs/std/testing/suite/TestSuite/>
- `std.testing.prop` package: <https://mojolang.org/docs/std/testing/prop/>
- `std.benchmark` package: <https://mojolang.org/docs/std/benchmark/>
- `mojo run` (for `-I` and exit behaviour): <https://mojolang.org/docs/cli/run/>
- Debugging (assertions open the debugger):
  <https://mojolang.org/docs/tools/debugging/>
