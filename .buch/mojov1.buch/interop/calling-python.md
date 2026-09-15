# Calling Python from Mojo

Mojo can import and call Python modules directly. The official manual states the
contract precisely:

> "The Python ecosystem is full of useful libraries, so you shouldn't have to
> rewrite them in Mojo. Instead, you can simply import Python packages and call
> Python APIs from Mojo. The Python code runs in a standard Python interpreter
> (CPython), so your existing Python code doesn't need to change."
>
> — <https://mojolang.org/docs/manual/python/python-from-mojo/>

The interpreter is real and unmodified:

> "This is 100% compatible because we use the CPython runtime without
> modification for full compatibility with existing Python libraries."
>
> — <https://mojolang.org/docs/manual/python/>

Two consequences follow from "CPython, unmodified":

- The Python code you import behaves exactly as it does in Python, including its
  performance characteristics and its exceptions.
- `mojo build` does not embed Python or its packages. They are loaded at
  runtime from the environment, so they must be installed where the program
  runs. The manual warns explicitly:

  > "`mojo build` doesn't include the Python packages used by your Mojo project.
  > Instead, Mojo loads the Python interpreter and Python packages at runtime, so
  > they must be provided in the environment where you run the Mojo program (such
  > as inside the pixi environment where you built the executable)."
  > — <https://mojolang.org/docs/manual/python/python-from-mojo/>

## The prerequisite: Python 3.10–3.14

Interop needs a CPython interpreter, and Mojo does not ship one:

> "Mojo doesn't include a CPython interpreter—it uses the CPython interpreter
> provided by your environment's default Python version. So be sure you know
> which Python version you're using in each environment where your Mojo code will
> run."
>
> — <https://mojolang.org/docs/manual/python/python-from-mojo/>

The supported window is:

> "Mojo itself doesn't require Python. To use the Mojo ↔ Python interoperability
> features described in this section, you need Python 3.10–3.14."
>
> — <https://mojolang.org/docs/manual/python/>

The manual recommends pinning the interpreter with Pixi so that Mojo and Python
agree on it:

```sh
pixi add "python==3.11"
```

```sh
pixi run python --version
```

```output
Python 3.11.0
```

> "Now, even if your operating system's default Python version is something else,
> your Pixi project (and the Mojo code inside) always uses Python 3.11."
> — <https://mojolang.org/docs/manual/python/python-from-mojo/>

**Pitfall:** the interpreter is a property of the *runtime environment*, not of
the executable. A binary built inside a Pixi environment can fail at runtime if
it is run where a different (or no) Python is present. See
[packaging and distribution](../project/packaging-and-distribution.md) when that
matters.

## Importing a Python module

The entry point is `Python.import_module()`, imported from `std.python`:

```mojo
from std.python import Python

def main() raises:
    # This is equivalent to Python's `import numpy as np`
    var np = Python.import_module("numpy")

    # Now use numpy as if writing in Python
    var array = np.array(Python.list(1, 2, 3))
    print(array)  # [1 2 3]
```

Source: <https://mojolang.org/docs/manual/python/python-from-mojo/>.

Notes that the manual attaches to this pattern, verbatim:

- "The `import_module()` method returns a reference to the module in the form of
  a `PythonObject` wrapper. You must store the reference in a variable and then
  use it as shown in the example above to access functions, classes, and other
  objects defined by the module."
- "Currently, you cannot import individual members (such as a single Python
  class or function). You must import the whole Python module and then access
  members through the module name."
- "Mojo doesn't yet support top-level code, so the `import_module()` call must be
  inside another method. This means you may need to import a module multiple
  times or pass around a reference to the module. This works the same way as
  Python: importing the module multiple times won't run the initialization logic
  more than once, so you don't pay any performance penalty."
- "`import_module()` may raise an exception. Raising exceptions is much more
  common in Python code than in the Mojo standard library, which limits their use
  for performance reasons."
- "We recommend using a package manager such as pixi, uv, or conda to manage
  your environment."

The signature is `Python.import_module(var module: String) -> PythonObject` and
it raises on failure:

```mojo
from std.python import Python

def main() raises:
    var np = Python.import_module("numpy")
    print(np.__name__)  # numpy
```

Source: <https://mojolang.org/docs/std/python/python/Python/>.

### Importing Python builtins

Python's builtin functions live in the `builtins` module and must be imported by
name like any other module:

```mojo
from std.python import Python

def main() raises:
    var np = Python.import_module("numpy")
    var array = np.array(Python.list(1, 2, 3))

    var builtins = Python.import_module("builtins")
    print(builtins.type(array))  # <class 'numpy.ndarray'>
```

Source: <https://mojolang.org/docs/manual/python/python-from-mojo/>.

**Pitfall:** Mojo itself already provides `type()`, `len()`, `print()` and other
builtins. Importing the Python `builtins` module is only needed when you want
the *Python* function object — for example to introspect a `PythonObject`'s
Python type.

### Importing a local Python module

Add the directory to the Python path, then import:

```python title="mypython.py"
import numpy as np

def gen_random_values(size, base):
    # generate a size x size array of random numbers between base and base+1
    random_array = np.random.rand(size, size)
    return random_array + base
```

```mojo title="main.mojo"
from std.python import Python

def main() raises:
    Python.add_to_path("path/to/module")
    var mypython = Python.import_module("mypython")

    var values = mypython.gen_random_values(2, 3)
    print(values)
```

> "Both absolute and relative paths work with `add_to_path()`. For example, you
> can import from the local directory like this: `Python.add_to_path(".")`."
> — <https://mojolang.org/docs/manual/python/python-from-mojo/>

`Python.add_to_path()` takes a `StringSpan` and raises if the operation fails:
`Python.add_to_path(dir_path: StringSpan)`.
Source: <https://mojolang.org/docs/std/python/python/Python/>.

**Pitfall:** adding `.` is relative to the *current working directory at run
time*, not to the source file. Run the program from the directory that contains
the module, or pass an absolute path.

## `PythonObject`: the wrapper around every Python value

Any value that crosses from Python into Mojo is a `PythonObject`. The manual
describes it as a pass-through wrapper:

> "When you use Python objects in your Mojo code, Mojo adds the `PythonObject`
> wrapper around the Python object. This object exposes a number of common double
> underscore methods (dunder methods) like `__getitem__()` and `__getattr__()`,
> passing them through to the underlying Python object. Most of the time, you can
> treat the wrapped object just like you'd treat it in Python. You can use
> dot-notation to access attributes and call methods, and use the `[]` operator
> to access an item in a sequence."
>
> — <https://mojolang.org/docs/manual/python/types/>

`PythonObject` conforms to `Writable`, `Boolable`, `Copyable`,
`ImplicitlyCopyable`, `Movable`, `Deinitable`, `SizedRaising`, `Identifiable`
and `RegisterPassable` (API reference:
<https://mojolang.org/docs/std/python/python_object/PythonObject/>). The
important practical consequence is printing: "`PythonObject` implements the
`Writable` trait. This allows you to print Python values using the built-in
`print()` function." (<https://mojolang.org/docs/manual/python/types/>)

```mojo
from std.python import Python

def main() raises:
    var py_dict = Python.dict()
    py_dict["item_name"] = "whizbang"
    py_dict["price"] = 11.75
    py_dict["inventory"] = 100
    print(py_dict)
```

```output
{'item_name': 'whizbang', 'price': 11.75, 'inventory': 100}
```

Source: <https://mojolang.org/docs/manual/python/types/>.

### Constructing Python values from Mojo

Mojo integer, float, bool and string values convert into Python objects
implicitly:

> "Mojo primitive types implicitly convert into Python objects. Today we support
> integers, floats, booleans, and strings."
> — <https://mojolang.org/docs/manual/python/types/>

The `PythonObject` constructor overload set includes `@implicit` initializers
from `Bool`, any `Scalar[dtype]`, `String`, `StringLiteral`, `Slice`, and
`None`. Source: <https://mojolang.org/docs/std/python/python_object/PythonObject/>.

The `Python` struct also provides the collection constructors
`Python.dict()`, `Python.list()` and `Python.tuple()`:

```mojo
from std.python import Python

def main() raises:
    var py_list = Python.list("cat", 2, 3.14159, 4)
    var n = py_list[2]
    print("n =", n)
    py_list.append(5)
    py_list[0] = "aardvark"
    print(py_list)
```

```output
n = 3.14159
['aardvark', 2, 3.14159, 4, 5]
```

Source: <https://mojolang.org/docs/manual/python/types/>.

`Python.dict()` accepts keyword arguments or a `Span` of key/value tuples;
`Python.list()` accepts variadic values or a `Span`; `Python.tuple()` accepts
variadic values. Source: <https://mojolang.org/docs/std/python/python/Python/>.

For a Python type with no literal Mojo equivalent, evaluate an expression:

```mojo
from std.python import Python

def main() raises:
    var py_set = Python.evaluate('{2, 3, 2, 7, 11, 3}')
    var num_items = len(py_set)
    print(num_items, "items in the set.")
    var contained = 7 in py_set
    print("Is 7 in the set:", contained)
```

```output
4 items in the set.
Is 7 in the set: True
```

Source: <https://mojolang.org/docs/manual/python/types/>.

`Python.evaluate()` also takes `file=True` to evaluate a whole module and return
the module object, plus a `name:` parameter for the module name. That is how the
manual builds an in-memory module:

```mojo
from std.python import Python

def main() raises:
    var py_module = """
def type_printer(value):
    print(type(value))
"""
    var py_utils = Python.evaluate(py_module, file=True, name="py_utils")

    py_utils.type_printer(4)
    py_utils.type_printer(3.14)
    py_utils.type_printer(True)
    py_utils.type_printer("Mojo")
```

```output
<class 'int'>
<class 'float'>
<class 'bool'>
<class 'str'>
```

Source: <https://mojolang.org/docs/manual/python/types/>. Signature:
`Python.evaluate(var expr: String, file: Bool = False, name: StringSpan = "__main__") -> PythonObject`,
and it raises (<https://mojolang.org/docs/std/python/python/Python/>).

> **Pitfall:** `Python.evaluate()` compiles and runs a Python string. It is the
> right tool for a literal with no Mojo equivalent and for tests; it is the
> wrong tool for hot paths or for anything that could be written as a Mojo
> constructor.

## Python types in Mojo

### Conversion: Python value → Mojo value

Most Mojo APIs do not accept a `PythonObject`; the value must become a native
Mojo value first. The manual says:

> "However, most other Mojo APIs don't accept `PythonObject` values directly. In
> these cases you'll need to explicitly convert a Python value into a native Mojo
> value."
> — <https://mojolang.org/docs/manual/python/types/>

Conversion uses the `py=` keyword on the target type's constructor:

```mojo
from std.python import Python
from std.python import PythonObject

def main() raises:
    var py_string = PythonObject("Hello, Mojo!")
    var py_bool = PythonObject(True)
    var py_int = PythonObject(123)
    var py_float = PythonObject(3.14)

    var mojo_string = String(py=py_string)
    var mojo_bool = Bool(py=py_bool)
    var mojo_int = Int(py=py_int)
    var mojo_float = Float64(py=py_float)
```

Source: <https://mojolang.org/docs/manual/python/types/>. The underlying
mechanism is the `ConvertibleFromPython` trait:

> "Many Mojo types support conversion directly from equivalent Python types, via
> the `ConvertibleFromPython` trait … These conversions will raise an exception
> if they fail."
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

### Comparing and inspecting Python values

Python objects support Mojo comparison operators, and Mojo's `is` operator maps
to Python identity:

```mojo
from std.python import Python

def main() raises:
    var value1 = PythonObject(3.7)
    var value2 = Python.evaluate("10/3")

    # Compare values
    print("Is value1 greater than 3:", value1 > 3)
    print("Is value1 greater than value2:", value1 > value2)

    # Compare identities
    var value3 = value2
    print("value1 is value2:", value1 is value2)
    print("value2 is value3:", value2 is value3)

    # Compare types
    var py_float_type = Python.evaluate("float")
    print("Python float type:", py_float_type)
    print("value1 type:", Python.type(value1))
    print("Is value1 a Python float:", Python.type(value1) is py_float_type)
```

```output
Is value1 greater than 3: True
Is value1 greater than value2: True
value1 is value2: False
value2 is value3: True
Python float type: <class 'float'>
value1 type: <class 'float'>
Is value1 a Python float: True
```

Source: <https://mojolang.org/docs/manual/python/types/>.

> "Python values like `False` and `None` evaluate as false in Mojo boolean
> expressions as well."
> — <https://mojolang.org/docs/manual/python/types/>

The comparison methods (`__lt__`, `__eq__`, and so on) return a `PythonObject`,
"not necessarily a boolean", because Python rich comparison can return an
arbitrary object. Comparing mismatched types with `==` "fall[s] back to an
identity check and compare unequal, rather than raising". Source:
<https://mojolang.org/docs/std/python/python_object/PythonObject/>.

### The `PythonObject` API surface

The wrapper forwards the common Python dunders. From the API reference
(<https://mojolang.org/docs/std/python/python_object/PythonObject/>):

| Mojo usage | Underlying Python protocol |
|---|---|
| `obj[key]`, `obj[k1, k2]` | `__getitem__` |
| `obj[key] = value` | `__setitem__` |
| `obj.attr` | `__getattr__` |
| `obj.attr = value` | `__setattr__` |
| `f(*args, **kwargs)` | `__call__` |
| `len(obj)` | `__len__` (raises) |
| `hash(obj)` | `__hash__` (raises) |
| `x in obj` | `__contains__` (falls back to iteration) |
| `bool(obj)` | `__bool__` |
| `x is y` | `__is__` |
| `str(obj)`, `int(obj)`, `float(obj)` | `__str__`, `__int__`, `__float__` |
| `+, -, *, /, //, %, **, <<, >>, &, \|, ^` | matching `__*__`, with reflected fallback (`__radd__`, …) |

1.0.0 changed the arithmetic path for the better:

> "`PythonObject` arithmetic, comparison, and membership operators now dispatch
> through CPython's abstract number, object, and sequence protocols (for example,
> `PyNumber_Add`, `PyObject_RichCompare`, and `PySequence_Contains`) instead of a
> Python-level attribute lookup followed by a bound-method call. Together with
> the non-mutating operators now borrowing their operand rather than taking it by
> value, this is roughly 12x faster on the interop hot path (a tight `a + b` or
> `a < b` loop). It also follows standard Python operator semantics more closely,
> including reflected-operand fallback (`__radd__`, `__rmul__`, and so on) and
> the standard error messages for unsupported operations. An operation that no
> operand supports now raises `TypeError`, where previously it could yield the
> `NotImplemented` object as a value, and comparing mismatched types with `==`
> now returns `False` rather than a truthy `NotImplemented`."
> — <https://mojolang.org/releases/v1.0.0/>

### `Python` module helpers

Beyond `import_module()` and `evaluate()`, the `Python` struct (API reference:
<https://mojolang.org/docs/std/python/python/Python/>) provides:

| Method | Purpose |
|---|---|
| `Python.add_to_path(path)` | add a directory to `sys.path` (raises) |
| `Python.import_module(name)` | import a module (raises) |
| `Python.create_module(name)` | create a new module object (raises) |
| `Python.evaluate(expr, file=, name=)` | evaluate an expression or module (raises) |
| `Python.eval(code) -> Bool` | execute code, returning success (non-raising) |
| `Python.dict(...)`, `Python.list(...)`, `Python.tuple(...)` | build Python collections (raise) |
| `Python.type(obj)` | the Python `type()` builtin |
| `Python.str(obj)`, `Python.int(obj)`, `Python.float(obj)` | the Python conversions (raise) |
| `Python.is_true(obj) -> Bool` | truthiness as a Mojo `Bool` |
| `Python.none()` | a `PythonObject` for `None` |
| `Python.cpython()` | handle to the low-level CPython C API |
| `Python.add_object(module, name, value)` | attach an object to a module |
| `Python.add_functions(module, funcs)` | attach `PyMethodDef`s to a module |

`Python.is_true()` is worth singling out: it returns a Mojo `Bool` directly,
whereas `bool(py_obj)` goes through the `Boolable` conformance. Use
`is_true()` when you want a clear, named truthiness check.

## NumPy interop helpers

`std.python.numpy` provides two functions for moving flat numeric data between
Mojo and NumPy without hand-written `ctypes` plumbing
(<https://mojolang.org/docs/std/python/numpy/>):

- `copy_to_numpy_array` — "builds a NumPy array from a Mojo `Span` by copying the
  data into a new, independent array."
- `from_numpy_array` — "borrows a NumPy array's buffer as a Mojo `Span`
  (zero-copy)."

Both were added in 1.0.0:

> "Added `copy_to_numpy_array()` and `from_numpy_array()` to the new
> `std.python.numpy` module for moving flat numeric data between Mojo
> `Span`/`List` and NumPy arrays without hand-written `ctypes` plumbing. Both
> support the fixed-width numeric dtypes. `copy_to_numpy_array()` copies its
> input into a new, independent array; `from_numpy_array()` borrows the array's
> buffer zero-copy."
> — <https://mojolang.org/releases/v1.0.0/>

Limits, quoted: "Only 1-D, C-contiguous arrays of the fixed-width numeric dtypes
(`int8` through `int64`, `uint8` through `uint64`, `float16`, `float32`,
`float64`) are supported." (<https://mojolang.org/docs/std/python/numpy/>)

**Pitfall:** `from_numpy_array()` is zero-copy and *borrows*. The returned
`Span` must not outlive the NumPy array that owns the buffer, and mutating the
array while the span is live is a data race waiting to happen. Copy
(`copy_to_numpy_array`) when ownership is unclear.

## The bridge API, for writing bindings in Mojo

`std.python.conversions` exposes the two traits that govern conversion in both
directions (<https://mojolang.org/docs/std/python/conversions/>):

- `ConvertibleFromPython` — "Denotes a type that can attempt construction from a
  read-only Python object."
- `ConvertibleToPython` — "A type that indicates a type can be converted to a
  `PythonObject`, and that specifies the behavior with a `to_python_object`
  method."

`std.python.bindings` holds the builders used by the *Mojo-from-Python*
direction: `PythonModuleBuilder`, `PythonTypeBuilder`, `PyMojoObject`,
`ExceptionType`, plus helpers `check_and_get_arg`,
`check_and_get_or_convert_arg`, `check_arguments_arity`,
`lookup_py_type_object` and `raise_python_exception`
(<https://mojolang.org/docs/std/python/bindings/>). See
[calling Mojo from Python](mojo-from-python.md).

> **Open question:** `ConvertibleFromPython` is named in the manual but no
> official page enumerates *which* stdlib types implement it. The manual says
> "many Mojo standard library types do not yet implement this trait, so may
> require manual conversion logic if needed"
> (<https://mojolang.org/docs/manual/python/mojo-from-python/>). Check the
> trait's "Implemented traits" section on the specific type you need, because
> the set is not listed centrally.

## Performance caveats

The official material is careful not to promise that Python becomes fast:

- **The interpreter runs unchanged.** "The Python code runs in a standard Python
  interpreter (CPython), so your existing Python code doesn't need to change."
  (<https://mojolang.org/docs/manual/python/python-from-mojo/>) Nothing about
  Mojo's compiler changes Python's execution speed.
- **Every crossing is a CPython call.** Attribute lookup, item access, calls and
  arithmetic all cross the boundary. 1.0.0 made the arithmetic path roughly 12×
  faster, but it is still a Python operation.
- **Conversions allocate Python objects.** Constructing a `PythonObject` from a
  Mojo value creates a CPython object with refcount management; converting back
  raises on type mismatch.
- **`PythonObject` is reference-counted; Mojo values are not.** The destructor
  "decrements the underlying refcount of the pointed-to object. Safe to call
  from any thread; the GIL is acquired if not already held."
  (<https://mojolang.org/docs/std/python/python_object/PythonObject/>)
- **Exceptions are normal on the Python side.** "Raising exceptions is much more
  common in Python code than in the Mojo standard library."
  (<https://mojolang.org/docs/manual/python/python-from-mojo/>) A Mojo function
  that calls `import_module()` must be `raises`.

The practical rule: **cross once, not per element.** Import the module, convert
your data to a form the Python library accepts (`from_numpy_array` helps), call
the library, convert the result back, and keep the loop in Mojo.

## Pitfalls

- **Assuming `import_module()` works at module scope.** "Mojo doesn't yet
  support top-level code, so the `import_module()` call must be inside another
  method." (<https://mojolang.org/docs/manual/python/python-from-mojo/>)
- **Assuming the executable carries Python.** It does not; the runtime
  environment supplies the interpreter and the packages.
- **Forgetting `raises`.** `import_module()`, `add_to_path()`,
  `Python.evaluate()` and conversions all raise. A non-raising function cannot
  call them.
- **Importing individual members.** "You cannot import individual members (such
  as a single Python class or function). You must import the whole Python module
  and then access members through the module name."
  (<https://mojolang.org/docs/manual/python/python-from-mojo/>)
- **Passing a `PythonObject` where Mojo expects a native value.** Most APIs
  reject it; convert first. Conversely, `print()` accepts it directly.
- **Treating `==` on mixed types as an error.** In 1.x it returns `False` for
  unsupported operands rather than raising or returning `NotImplemented`.
- **Relying on `from_numpy_array()` staying valid.** It is a zero-copy borrow;
  the array must outlive the span.
- **Expecting a Python `int` to become a Mojo `Int` silently.** Arbitrary
  precision does not fit; conversion raises if it does not fit. `Int(py=...)` is
  explicit for that reason.

## Sources

- <https://mojolang.org/docs/manual/python/>
- <https://mojolang.org/docs/manual/python/python-from-mojo/>
- <https://mojolang.org/docs/manual/python/types/>
- <https://mojolang.org/docs/manual/python/mojo-from-python/>
- <https://mojolang.org/docs/std/python/>
- <https://mojolang.org/docs/std/python/python/Python/>
- <https://mojolang.org/docs/std/python/python_object/PythonObject/>
- <https://mojolang.org/docs/std/python/conversions/>
- <https://mojolang.org/docs/std/python/numpy/>
- <https://mojolang.org/docs/std/python/bindings/>
- <https://mojolang.org/docs/requirements/>
- <https://mojolang.org/releases/v1.0.0/>
