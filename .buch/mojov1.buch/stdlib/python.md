# python

`python` is the standard library's Python-interop package: import Python
modules, call Python code, and convert values across the boundary.

> Python interoperability: import packages and modules, call functions, type
> conversion.

> The `python` package enables interoperability between Mojo and Python code. It
> provides mechanisms for importing Python packages and modules, calling Python
> functions, and converting values between Mojo and Python types. This package
> allows Mojo programs to leverage the extensive Python ecosystem while
> maintaining Mojo's performance characteristics.

> Use this package when you need to call Python libraries, integrate existing
> Python code into Mojo applications, or leverage Python's ecosystem for
> functionality not yet available in native Mojo.

Source: <https://mojolang.org/docs/std/python/>.

**This page is the package-level reference.** The full narrative — prerequisite,
importing, `PythonObject`, conversions, NumPy helpers, performance caveats — is
in [Calling Python from Mojo](../interop/calling-python.md). Read that page
first; this one maps the package's modules and API surface and states the
stability situation.

## The prerequisite: Python 3.10–3.14

Interop uses the **unmodified CPython interpreter from your environment**; Mojo
does not ship one:

> Mojo doesn't include a CPython interpreter—it uses the CPython interpreter
> provided by your environment's default Python version.

> Mojo itself doesn't require Python. To use the Mojo ↔ Python interoperability
> features described in this section, you need Python 3.10–3.14.

Sources: <https://mojolang.org/docs/manual/python/python-from-mojo/>,
<https://mojolang.org/docs/manual/python/>. Pin the interpreter with Pixi when
Mojo and Python must agree (`pixi add "python==3.11"`); see
[Calling Python from Mojo](../interop/calling-python.md#the-prerequisite-python-310314).

## Modules

| Module | Contents |
|--------|----------|
| `python` | The `Python` struct — "Provides methods that help you use Python code in Mojo." |
| `python_object` | `PythonObject` — "A Python object." |
| `conversions` | `ConvertibleFromPython`, `ConvertibleToPython` — the two conversion traits. |
| `numpy` | `copy_to_numpy_array`, `from_numpy_array` — flat numeric data transfer. |
| `bindings` | Builders for exposing Mojo code to Python (`PythonModuleBuilder`, `PythonTypeBuilder`, `PyMojoObject`, `ExceptionType`, helpers). |

Source: <https://mojolang.org/docs/std/python/>.

The `bindings` module is the *other* direction — writing Python bindings in Mojo
— and is covered by [Calling Mojo from Python](../interop/mojo-from-python.md).

## `Python` — the entry point

The `Python` struct is `Copyable`, `Defaultable`, `Deinitable`,
`ImplicitlyCopyable`, `Movable`. Its most-used static methods:

| Method | Signature (documented) | Purpose |
|--------|------------------------|---------|
| `import_module` | `static def import_module(var module: String) -> PythonObject` | Import a whole module (raises). |
| `evaluate` | `static def evaluate(var expr: String, file: Bool = False, name: StringSpan = "__main__") -> PythonObject` | Evaluate an expression, or a whole module when `file=True` (raises). |
| `eval` | `def eval(self, var code: String) -> Bool` | Execute code, returning success (non-raising). |
| `add_to_path` | `static def add_to_path(dir_path: StringSpan)` | Add a directory to `sys.path` (raises). |
| `create_module` | `static def create_module(name: StringSpan[ImmStaticOrigin]) -> PythonObject` | Create a module object (raises). |
| `dict` | `static def dict(*, var **kwargs: PythonObject) -> PythonObject` / `static def dict(tuples: Span[Tuple[PythonObject, PythonObject]]) -> PythonObject` | Build a Python dict (raises). |
| `list` | `static def list(var *values: PythonObject) -> PythonObject` / `static def list(values: Span[PythonObject]) -> PythonObject` | Build a Python list (raises). |
| `tuple` | `static def tuple(var *values: PythonObject) -> PythonObject` | Build a Python tuple (raises). |
| `type` | `static def type(obj: PythonObject) -> PythonObject` | The Python `type()` builtin. |
| `str` / `int` / `float` | `static def str(obj: PythonObject) -> PythonObject` (etc.) | Python conversions (raise). |
| `is_true` | `static def is_true(obj: PythonObject) -> Bool` | Truthiness as a Mojo `Bool` (raises). |
| `none` | `static def none() -> PythonObject` | A `PythonObject` for `None`. |
| `cpython` | `def cpython(self) -> ref[ImmStaticOrigin] CPython` | Handle to the low-level CPython C API. |
| `add_object` / `add_functions` | `static def add_object(module, var name: String, value)` / `static def add_functions(module, var functions: List[PyMethodDef])` | Attach objects/functions to a module (raise). |

Sources: <https://mojolang.org/docs/std/python/python/Python/>,
<https://mojolang.org/docs/std/python/python/>.

`eval` versus `evaluate` is a real distinction: `eval` returns a `Bool` and does
not raise; `evaluate` returns a `PythonObject` and raises. Use `is_true()` when
you want a named truthiness check instead of leaning on `Boolable`. Source:
<https://mojolang.org/docs/std/python/python/Python/>.

### A runnable example

```mojo
from std.python import Python

def main() raises:
    var np = Python.import_module("numpy")          # like `import numpy as np`
    var array = np.array(Python.list(1, 2, 3))     # build a Python list first
    print(array)                                    # [1 2 3]

    var builtins = Python.import_module("builtins") # Python's own builtins
    print(builtins.type(array))                     # <class 'numpy.ndarray'>
```

Source: <https://mojolang.org/docs/manual/python/python-from-mojo/>.

Three constraints the manual states for `import_module`:

- "Currently, you cannot import individual members (such as a single Python
  class or function). You must import the whole Python module and then access
  members through the module name."
- "Mojo doesn't yet support top-level code, so the `import_module()` call must
  be inside another method."
- "`import_module()` may raise an exception."

Source: <https://mojolang.org/docs/manual/python/python-from-mojo/>.

## `PythonObject` — every Python value

Anything crossing from Python into Mojo is a `PythonObject`. It conforms to
`Boolable`, `Copyable`, `Defaultable`, `Deinitable`, `Identifiable`,
`ImplicitlyCopyable`, `Movable`, `RegisterPassable`, `SizedRaising` and
`Writable`. Source:
<https://mojolang.org/docs/std/python/python_object/PythonObject/>.

It forwards the common Python dunders. The ones an agent reaches for:

| Mojo usage | Underlying Python protocol |
|---|---|
| `obj[key]`, `obj[k1, k2]` | `__getitem__` |
| `obj[key] = value` | `__setitem__` |
| `obj.attr` / `obj.attr = value` | `__getattr__` / `__setattr__` |
| `f(*args, **kwargs)` | `__call__` |
| `len(obj)` / `hash(obj)` | `__len__` / `__hash__` (both raise) |
| `x in obj` | `__contains__` (falls back to iteration) |
| `bool(obj)` | `__bool__` |
| `x is y` | `__is__` |
| `str(obj)`, `int(obj)`, `float(obj)` | `__str__`, `__int__`, `__float__` |
| `+ - * / // % ** << >> & \| ^` and reflected forms | the matching dunders |

Source: <https://mojolang.org/docs/std/python/python_object/PythonObject/>.

Printing works directly: "`PythonObject` implements the `Writable` trait. This
allows you to print Python values using the built-in `print()` function." Source:
<https://mojolang.org/docs/manual/python/types/>.

```mojo
from std.python import Python

def main() raises:
    var py_dict = Python.dict()
    py_dict["item_name"] = "whizbang"
    py_dict["price"] = 11.75
    print(py_dict)   # {'item_name': 'whizbang', 'price': 11.75}
```

Source: <https://mojolang.org/docs/manual/python/types/>.

## Conversions

Implicit conversion *into* Python exists for Mojo primitives:

> Mojo primitive types implicitly convert into Python objects. Today we support
> integers, floats, booleans, and strings.

Source: <https://mojolang.org/docs/manual/python/types/>. The `@implicit`
`PythonObject` initializers cover `Bool`, any `Scalar[dtype]`, `String`,
`StringLiteral`, `Slice` and `None`. Source:
<https://mojolang.org/docs/std/python/python_object/PythonObject/>.

Conversion *out* of Python is explicit, using the `py=` keyword on the target
type's constructor:

```mojo
from std.python import PythonObject

def main():
    var py_int = PythonObject(123)
    var mojo_int = Int(py=py_int)
```

Source: <https://mojolang.org/docs/manual/python/types/>. The mechanism is the
`ConvertibleFromPython` trait — "Denotes a type that can attempt construction
from a read-only Python object" — while `ConvertibleToPython` "indicates a type
can be converted to a `PythonObject`, and that specifies the behavior with a
`to_python_object` method." Source:
<https://mojolang.org/docs/std/python/conversions/>.

Both traits are exported from the package root; the [Calling Python from
Mojo](../interop/calling-python.md) page explains the `py=` idiom and the
open question about which stdlib types implement the trait.

## NumPy helpers

The `numpy` module provides exactly two functions:

- `copy_to_numpy_array` — "Builds a 1-D NumPy array from a Mojo `Span` of
  scalars" (copies into a new, independent array).
- `from_numpy_array` — "Borrows a 1-D C-contiguous NumPy array as a Mojo `Span`"
  (zero-copy).

Source: <https://mojolang.org/docs/std/python/numpy/>. The documented limit:

> Only 1-D, C-contiguous arrays of the fixed-width numeric dtypes (`int8` through
> `int64`, `uint8` through `uint64`, `float16`, `float32`, `float64`) are
> supported.

Source: <https://mojolang.org/docs/std/python/numpy/>.

```mojo
from std.python import Python
from std.python.numpy import copy_to_numpy_array

def main() raises:
    var data = [1.0, 2.0, 3.0]          # an Array[Float64, 3]
    var np = Python.import_module("numpy")
    var arr = copy_to_numpy_array(data[:])   # Span -> independent NumPy array
    print(arr)
```

Both functions were added in 1.0.0. Source:
<https://mojolang.org/releases/v1.0.0/>.

## Idioms

- **Cross the boundary once.** Import the module, convert the data, make one
  call, convert the result back, and keep the loop in Mojo. Every attribute
  lookup, item access and call crosses into CPython.
- **`from_numpy_array` for reading, `copy_to_numpy_array` for handing data to a
  library.** The former borrows zero-copy; the latter gives the library an array
  it owns.
- **Keep `import_module` inside a function.** Top-level code is not supported.
- **Declare `raises`** on every function that imports, evaluates, converts or
  calls Python.
- **Print `PythonObject` directly.** It is `Writable`; there is no need to
  convert to `String` first.
- **Prefer a named import path.** `from std.python import Python` and
  `from std.python import PythonObject` are the documented spellings.

## Pitfalls

- **Assuming Mojo carries Python.** `mojo build` does not embed the interpreter
  or its packages; they come from the runtime environment.
- **Using a Python outside 3.10–3.14.** That is the supported window.
- **Forgetting `raises`.** `import_module`, `add_to_path`, `evaluate` and all
  conversions raise.
- **Passing a `PythonObject` where Mojo expects a native value.** Most APIs
  reject it; convert first with `Int(py=...)`, `String(py=...)`, and so on.
- **Relying on a zero-copy `from_numpy_array` span outliving its array.** The
  array must stay alive and unmodified.
- **Expecting `==` on mismatched Python types to raise.** In 1.x it returns
  `False` (identity fallback). Source:
  <https://mojolang.org/docs/std/python/python_object/PythonObject/>.
- **Treating `PythonObject` as free.** Each one is a refcounted CPython object;
  construction and destruction are not no-ops.
- **Using `Python.evaluate()` in a hot path.** It compiles and runs a string.
- **Assuming a stable API.** See below.

## Stability

The `python` package page and its module pages show **no `@stable(since=...)`
marker** and no stability badges. Under the standard-library rule — "We consider
standard library APIs unstable unless specifically marked stable" — these APIs
are **unstable by default**. Sources: <https://mojolang.org/docs/std/python/>,
<https://mojolang.org/docs/api-docs/stability/>.

The interop *behaviour* is nonetheless pinned by the implementation: the manual
states that Mojo uses "the CPython runtime without modification for full
compatibility with existing Python libraries." Source:
<https://mojolang.org/docs/manual/python/>.

## Sources

- Mojo `python` package: <https://mojolang.org/docs/std/python/>
- Mojo `python.python` module: <https://mojolang.org/docs/std/python/python/>
- Mojo `Python` struct: <https://mojolang.org/docs/std/python/python/Python/>
- Mojo `python_object` module: <https://mojolang.org/docs/std/python/python_object/>
- Mojo `PythonObject` struct: <https://mojolang.org/docs/std/python/python_object/PythonObject/>
- Mojo `conversions` module: <https://mojolang.org/docs/std/python/conversions/>
- Mojo `numpy` module: <https://mojolang.org/docs/std/python/numpy/>
- Mojo `bindings` module: <https://mojolang.org/docs/std/python/bindings/>
- Mojo manual — Python interoperability: <https://mojolang.org/docs/manual/python/>
- Mojo manual — Python from Mojo: <https://mojolang.org/docs/manual/python/python-from-mojo/>
- Mojo manual — Python types: <https://mojolang.org/docs/manual/python/types/>
- Mojo manual — Mojo from Python: <https://mojolang.org/docs/manual/python/mojo-from-python/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
