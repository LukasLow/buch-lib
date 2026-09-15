# Calling Mojo from Python

The other direction of Python interop lets a Python program import and use Mojo
code. The manual frames the use case as incremental migration:

> "If you have an existing Python project that would benefit from Mojo's
> high-performance computing, you shouldn't have to rewrite the whole thing in
> Mojo. Instead, you can write just the performance-critical parts your code in
> Mojo and then call it from Python."
>
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

This direction is a **beta feature**, and the official page says so at the top:

> "Calling Mojo code from Python is in early development. You should expect a lot
> of changes to the API and ergonomics. Likewise, this documentation is still a
> work in progress."
>
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

Read this page with that caveat in mind: the mechanics below are the documented
1.x behaviour, but the API is explicitly allowed to move.

## Why there is a build step (and why it is invisible)

Mojo is compiled, so Python cannot evaluate a `.mojo` file the way it evaluates
a `.py` file. The official framing:

> "Because Mojo is a compiled language, we can't directly "evaluate" Mojo code
> from Python. Instead, you must declare which Mojo functions and types are
> available to be called from Python (declare the "bindings"), and then you can
> import them in your Python code … just like any other module—there's no extra
> compilation step."
>
> — <https://mojolang.org/docs/manual/python/>

"There's no extra compilation step" means *no step you write*. The compilation
still happens; Python's import machinery triggers it through the `mojo.importer`
import hook. This is CPython's standard **extension module** mechanism:

> "Python supports a standard mechanism called Python extension modules that
> enables compiled languages (like Mojo, C, C++, or Rust) to make themselves
> callable from Python in an intuitive way. Concretely, a Python extension module
> is simply a dynamic library that defines a suitable `PyInit_*()` function."
>
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

### The project layout

```text
project
├── 🐍 main.py
└── 🔥 mojo_module.mojo
```

> "The main entrypoint is a Python program called `main.py`, and the Mojo code
> includes functions to call from Python."
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

### A complete minimal example

```mojo title="mojo_module.mojo"
from std.python import PythonObject
from std.python.bindings import PythonModuleBuilder
from std import math
from std.os import abort

@export
def PyInit_mojo_module() abi("C") -> PythonObject:
    try:
        var m = PythonModuleBuilder("mojo_module")
        m.def_function[factorial]("factorial", docstring="Compute n!")
        return m.finalize()
    except e:
        abort(String("error creating Python Mojo module:", e))

def factorial(py_obj: PythonObject) raises -> PythonObject:
    # Raises an exception if `py_obj` is not convertible to a Mojo `Int`.
    var n = Int(py=py_obj)

    return math.factorial(n)
```

```python title="main.py"
import mojo.importer
import mojo_module

print(mojo_module.factorial(5))
```

```sh
python main.py
```

```output
120
```

Source: <https://mojolang.org/docs/manual/python/mojo-from-python/>.

Three things in that file carry the whole mechanism:

1. **The name `PyInit_mojo_module`.** Python looks for a `PyInit_<module>()
   function` matching the module it is importing. "If our file was called
   `foo.mojo`, the function Python looked for would be `PyInit_foo()`."
   (<https://mojolang.org/docs/manual/python/mojo-from-python/>)
2. **`@export` plus `abi("C")`.** The entry point is called directly by the
   CPython runtime across the C boundary.
3. **`PythonModuleBuilder`.** All functions and types callable from Python must
   be declared with it, then `finalize()`d into a module object.

On the Python side, `import mojo.importer` installs the import hook; the
subsequent `import mojo_module` is what actually loads and compiles the `.mojo`
file.

## How the import hook works

> "If we have a look at the filesystem after Python imports the Mojo code, we'll
> notice there's a new `__mojocache__` directory, with a dynamic library (`.so`)
> file inside:
>
> ```text
> project
> ├── main.py
> ├── mojo_module.mojo
> └── __mojocache__
>     └── mojo_module.hash-ABC123.so
> ```
>
> Loading `mojo.importer` loads our Python Mojo import hook, which behind the
> scenes looks for a `.mojo` file that matches the imported module name, and if
> found, compiles it using `mojo build --emit shared-lib` to generate a dynamic
> library. The resulting file is stored in `__mojocache__`, and is rebuilt only
> when it becomes stale (typically, when the Mojo source file changes)."
>
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

The official note on cleanup:

> "The `__mojocache__` directory should contain only derived artifacts. It is
> always safe to delete the contents of a `__mojocache__` directory. Needed
> artifacts will simply be rebuilt the next time the Mojo module is imported."
>
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

**Pitfall:** `__mojocache__` contains derived `.so` files. Do not commit it; add
it to `.gitignore` alongside `__pycache__`.

## The `abi` of exported functions

> "An `@export` function must declare which calling convention it uses with an
> explicit `abi` effect. In a Python extension module, the only function you need
> to export is the `PyInit_<module>` entry point, and it must use `abi("C")`."
>
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

```mojo
@export
def PyInit_mojo_module() abi("C") -> PythonObject:
    ...
```

Two rules the manual states about `abi("C")`:

- "This is because the CPython runtime locates and calls `PyInit_<module>`
  directly across the C boundary, so it must expose the C calling convention."
- "A `abi("C")` function can't be marked `raises`, which is why the examples
  above catch any error inside the body and `abort` instead of propagating it."

The reference confirms the general rule: "Don't combine non-Mojo `abi()` effects
with raising functions … the Mojo compiler rejects `def (String) abi("C") raises`."
(<https://mojolang.org/docs/reference/function-declarations/#abi-c>)

The registered functions themselves are different: "The functions, methods, and
initializers you register with the module builder (`def_function`, `def_method`,
`def_py_init`, and so on) don't need `@export` at all; you pass them by
reference, and Mojo generates the C wrapper that CPython actually calls. That
wrapper invokes your function using the Mojo calling convention and translates
any raised error into a Python exception, so a registered function such as
`factorial` above can freely be marked `raises`."
(<https://mojolang.org/docs/manual/python/mojo-from-python/>)

**Pitfall:** putting `raises` on the `PyInit_` entry point is a compile error.
Put the `try`/`except` + `abort` inside instead.

## Building the module: `PythonModuleBuilder`

The builder is the core API. From the reference
(<https://mojolang.org/docs/std/python/bindings/PythonModuleBuilder/>):

> "The builder follows a declarative pattern where you:
> 1. Create a builder instance with a module name
> 2. Add function bindings using `def_function()`, `def_py_function()`,
>    `def_py_c_function()`
> 3. Add type bindings using `add_type[T]()` and configure them
> 4. Call `finalize()` to finish building the Python module."

| Method | Binds |
|---|---|
| `def_function[T](name, docstring=)` | a module-level Mojo function with `PythonObject` arguments (up to 8), optional `PythonObject` return, optional `raises`, optional `var **kwargs` |
| `def_py_function[T](name, docstring=)` | a lower-level function of type `def(mut PythonObject, mut PythonObject) raises thin -> PythonObject` (self, positional args tuple) or with a third keyword-dict argument |
| `def_py_c_function(func, name, docstring=)` | a raw `PyCFunction` / `PyCFunctionWithKeywords` / `PyCFunctionFast` (`METH_FASTCALL`) callback |
| `add_type[T](type_name)` | a Mojo type, returning a `PythonTypeBuilder` |
| `finalize()` | builds the module and returns it |

`def_function()` accepts these shapes, quoted from the reference:

```mojo
from std.python import PythonObject

def func(arg1: PythonObject) -> PythonObject: ...
def func(arg1: PythonObject, arg2: PythonObject) raises: ...
def func(var **kwargs: PythonObject) -> PythonObject: ...
def func(arg1: PythonObject, var **kwargs: PythonObject) raises: ...
```

> **Pitfall:** after `finalize()`, "the builder's internal state is cleared and
> it should not be reused for creating additional modules."

## Binding Mojo types

> "You can bind any Mojo type for use in Python using `PythonModuleBuilder`."
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

```mojo
@fieldwise_init
struct Person(Movable, Writable):
    var name: String
    var age: Int

@export
def PyInit_person_module() abi("C") -> PythonObject:
    try:
        var mb = PythonModuleBuilder("person_module")
        var person_type = mb.add_type[Person]("Person")
    except e:
        abort("error creating Mojo module")
```

The manual lists two capabilities that follow from registering a type:

> "Any Mojo type bound using a `PythonTypeBuilder` has the resulting Python
> 'type' object globally registered, enabling two features:
>
> - Constructing Python objects that wrap Mojo values for use from Python using
>   `PythonObject(alloc=Person(..))`.
> - Downcasting using `python_obj.downcast_value_ptr[Person]()`."

Trait requirements, quoted:

> "Mojo types must implement `Writable` to be bound for use in Python. Additional
> traits are required for specific binding features: `Movable` for custom
> initializers (`def_py_init`), and both `Defaultable` and `Movable` for default
> initializers (`def_init_defaultable`)."
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

### Constructing Mojo objects in Python

Register an initializer with `def_py_init()`:

```mojo
@export
def PyInit_person_module() abi("C") -> PythonObject:
    try:
        var mb = PythonModuleBuilder("person_module")
        _ = mb.add_type[Person]("Person").def_py_init[Person.py_init]()
        return mb.finalize()
    except e:
        abort(String("error creating Python Mojo module:", e))

@fieldwise_init
struct Person(Movable, Writable):
    var name: String
    var age: Int

    @staticmethod
    def py_init(
        out self: Person, args: PythonObject, kwargs: PythonObject
    ) raises:
        # Validate argument count
        if len(args) != 2:
            raise Error("Person() takes exactly 2 arguments")

        # Convert Python arguments to Mojo types
        var name = String(args[0])
        var age = Int(args[1])

        self = Self(name, age)
```

```python
person = person_module.Person("Sarah", 32)
print(person)
```

```output
Person(name=Sarah, age=32)
```

Source: <https://mojolang.org/docs/manual/python/mojo-from-python/>.

For types that support default construction, use
`def_init_defaultable[Counter]()`, which "enables Python code to create
instances without arguments":

```mojo
var counter_type = m.add_type[Counter]("Counter")
counter_type.def_init_defaultable[Counter]()
```

```python
counter = counter_module.Counter()  # Creates Counter()
```

### Returning Mojo objects to Python

> "Mojo functions called from Python don't just need to be able to accept
> `PythonObject` values as arguments, they also need to be able to return new
> values. And sometimes, they even need to be able to return Mojo native values
> back to Python. This is possible by using the `PythonObject(alloc=<value>)`
> constructor."

```mojo
def create_person() -> PythonObject:
    var person = Person("Sarah", 32)
    return PythonObject(alloc=person^)
```

> "`PythonObject(alloc=...)` will raise an exception if the provided Mojo object
> type had not previously been registered using
> `PythonModuleBuilder.add_type()`."
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

### `PythonObject` → Mojo values inside bindings

Two mechanisms, quoted:

> "There are two ways in which a `PythonObject` can be turned into a native Mojo
> value:
>
> - **Converting** a Python object into a newly constructed Mojo value that has
>   the same logical value as the original Python object. This is handled by the
>   `ConvertibleFromPython` trait.
> - **Downcasting** a Python object that holds a native Mojo value to a pointer
>   to that inner value. This is handled by `PythonObject.downcast_value_ptr()`."

Converting:

```mojo
# Given a person, clone them and give them a different name.
def create_person(
    name_obj: PythonObject,
    age_obj: PythonObject
) raises -> PythonObject:
    # These conversions will raise an exception if they fail
    var name = String(name_obj)
    var age = Int(age_obj)

    return PythonObject(alloc=Person(name, age))
```

Downcasting:

```mojo
def print_age(person_obj: PythonObject) raises:
    # Raises if `obj` does not contain an instance of the Mojo `Person` type.
    var person = person_obj.downcast_value_ptr[Person]()

    print("Person is", person[].age, "years old")
```

Unsafe mutation and unchecked downcasting:

```mojo
def birthday(person_obj: PythonObject):
    var person = person_obj.downcast_value_ptr[Person]()

    person[].age += 1
```

```mojo
def get_person(person_obj: PythonObject):
    var person = person_obj.unchecked_downcast_value_ptr[Person]()
```

> "It is up to the user to ensure that this mutable pointer does not alias any
> other pointers to the same object within Mojo."
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

> "Unchecked downcasting can be used to eliminate overhead when optimizing a
> tight inner loop with Mojo, and you've benchmarked and measured that type
> checking downcasts is a significant bottleneck."

**Pitfall:** `unchecked_downcast_value_ptr()` does no type checking. The manual
documents its safety requirement directly: "The user must be certain that this
Python object type matches the bound Python type object for `T`."
(<https://mojolang.org/docs/std/python/python_object/PythonObject/>)

### Methods

> "When binding Mojo objects for use from Python, you can expose chosen methods
> to Python as well, using `PythonTypeBuilder.def_method()`.
>
> Currently, Mojo methods being exposed to Python must be written with a
> modification compared to normal Mojo methods: they must be a `@staticmethod`
> that takes either `py_self: PythonObject` or `self_ptr: Pointer[Self]`."

```mojo
@export
def PyInit_mojo_module() abi("C") -> PythonObject:
    try:
        var mb = PythonModuleBuilder("mojo_module")
        _ = mb.add_type[Person]("Person")
            .def_method[Person.get_name]("get_name")
            .def_method[Person.set_age]("set_age")
        return mb.finalize()
    except e:
        abort("error creating Mojo module")

struct Person(Writable):
    var name: String
    var age: Int

    @staticmethod
    def get_name(py_self: PythonObject) raises -> PythonObject:
        var self_ptr = py_self.downcast_value_ptr[Self]()
        return self_ptr[].name

    @staticmethod
    def set_age(
        self_ptr: Pointer[mut=True, Self],
        new_age: PythonObject,
    ) raises:
        self_ptr[].age = Int(new_age)

    def write_to(self, mut writer: Some[Writer]):
        t"Person({self.name}, {self.age})".write_to(writer)
```

> "Taking `py_self: PythonObject` allows access to the full `PythonObject`
> allocation that a Mojo object instance is stored inside of. Typically though,
> taking `self_ptr: Pointer[Self]` will minimize boilerplate in the common case
> that a method merely needs to access the fields of an object.
>
> Mojo methods called from Python are currently required to take non-standard
> self types due to limitations that will be lifted in future versions of Python
> Mojo bindings."
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

**Pitfall:** a bound method is not an ordinary Mojo method. It is a
`@staticmethod` whose first parameter is `py_self: PythonObject` or
`self_ptr: Pointer[Self]`. 1.0.0 changed the `self` parameter spelling to a
safe `Pointer`:

> "typed-self methods registered through `PythonTypeBuilder.def_method()`
> declare their self parameter as a `Pointer[Self]` (for example,
> `self_ptr: Pointer[mut=True, Self]`) … The pointer types share the same layout,
> so the C ABI and behavior are unchanged; update the spellings in signatures and
> read borrowed arguments with `args[unsafe_offset=i]`."
> — <https://mojolang.org/releases/v1.0.0/>

### Static methods

`def_staticmethod()` exposes a Python `@staticmethod`:

```mojo
mb.add_type[Person]("Person")
    .def_staticmethod[Person.is_valid_age]("is_valid_age")
```

```mojo
@staticmethod
def is_valid_age(age_obj: PythonObject) raises -> PythonObject:
    var age = Int(age_obj)
    return 0 <= age <= 130
```

```python title="main.py"
from mojo_module import Person

print(Person.is_valid_age(45)) # Prints 'True'
print(Person.is_valid_age(-1)) # Prints 'False'
```

Source: <https://mojolang.org/docs/manual/python/mojo-from-python/>.

### Keyword arguments

Two forms exist in Mojo, and only one is supported today:

> "1. Keyword-only arguments: `def foo(*, x: Int)` — This is not currently
> supported in Python Mojo bindings.
> 2. Variadic keyword arguments: `def foo(var **kwargs: Int)` — This is supported
> in Python Mojo bindings when used in the unsugared form: `def foo(kwargs:
> StringDict)`. (The `**kwargs` syntax limitation will be removed in the
> future.)"
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

```python
import mojo_module

result = mojo_module.sum_kwargs_ints(a=10, b=20, c=30)  # returns 60
```

```mojo
from std.collections import StringDict

def sum_kwargs_ints(kwargs: StringDict[PythonObject]) raises -> PythonObject:
    var total = 0
    for entry in kwargs.items():
        total += Int(entry.value)
    return PythonObject(total)
```

Keyword arguments can follow positional arguments, and are read as dictionary
lookups:

```mojo
from std.collections import StringDict

def duration_in_seconds(
    hours_obj: PythonObject,
    minutes_obj: PythonObject,
    kwargs: StringDict[PythonObject]
) raises -> PythonObject:
    var hours = Int(hours_obj)
    var minutes = Int(minutes_obj)

    var seconds = Int(kwargs["seconds"])

    return hours * 3600 + minutes * 60 + seconds
```

A missing keyword raises (a `KeyError`) at run time.

> **Note:** the container behind variadic `**kwargs` was renamed from
> `OwnedKwargsDict` to `StringDict` in 1.0.0.
> (<https://mojolang.org/releases/v1.0.0/>)

### Variadic positional arguments

Not supported through `def_function()`:

> "Python and Mojo variadic arguments are normally written using the following
> syntax: `def foo(*args: Int): ...` However, this syntax is not yet supported in
> Python/Mojo bindings, because functions bound using `def_function()` support
> only fixed-arity functions.
>
> As a workaround, you can expose Mojo functions that accept a variadic number of
> arguments to Python using the lower-level `def_py_function()` interface, which
> leaves it to the user to validate the number of arguments provided."
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

The documented workaround:

```mojo
@export
def PyInit_mojo_module() abi("C") -> PythonObject:
    try:
        var b = PythonModuleBuilder("mojo_module")
        b.def_py_function[count_args]("count_args")
        b.def_py_function[sum_args]("sum_args")
        b.def_py_function[lookup]("lookup")

def count_args(py_self: PythonObject, args_tuple: PythonObject) raises:
    return len(args_tuple)

def sum_args(py_self: PythonObject, args_tuple: PythonObject) raises:
    var total = args_tuple[0]
    for i in range(1, len(args_tuple)):
        total += args_tuple[i]
    return total
```

(Source: <https://mojolang.org/docs/manual/python/mojo-from-python/>. The
`def_py_function()` binding requires the exact
`def(mut PythonObject, mut PythonObject) raises thin -> PythonObject` signature,
per the reference:
<https://mojolang.org/docs/std/python/bindings/PythonModuleBuilder/>.)

## The `mojo_module` question

There is **no** documented macro, decorator or keyword named `mojo_module` that
marks arbitrary Mojo code as exportable in one step. In 1.x the export surface is
explicit and manual:

1. A Mojo extension module is identified by its file name.
2. Its entry point is `PyInit_<file_stem>()`, decorated with `@export`, using
   `abi("C")`.
3. Every callable is registered inside that entry point with
   `PythonModuleBuilder`.
4. Python imports the file by its stem after `import mojo.importer`.

> **Open question:** the official docs use `mojo_module` only as a *naming
> convention* in examples (the file `mojo_module.mojo` and the module
> `mojo_module`). No official page documents a `mojo_module` declaration, macro,
> or marker. If a future 1.x release introduces one, this section should be
> rewritten from that page.

## Distributing a Mojo extension module

Two documented routes:

> "You can create and distribute your Mojo modules for Python in the following
> ways:
>
> - As source files, compiled on demand using the Python Mojo importer hook.
>   The advantage of this approach is that it's easy to get started with, and
>   keeps your project structure simple, while ensuring that your imported Mojo
>   code is always up to date after you make an edit.
> - As pre-built Python extension module `.so` dynamic libraries, compiled using:
>   `mojo build mojo_module.mojo --emit shared-lib -o mojo_module.so`
>   This has the advantage that you can specify any other necessary build options
>   manually (optimization or debug flags, import paths, etc.), providing an
>   "escape hatch" from the Mojo import hook abstraction for advanced users."
>
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

Use the pre-built route when you need import paths for Mojo package
dependencies — see the limitation below.

## Strategies for porting Python to Mojo

The manual offers one style of port that leans on `PythonObject` flexibility:

> "In this approach to bindings, we embrace the flexibility of Python, and eschew
> trying to convert `PythonObject` arguments into the narrowly constrained,
> strongly-typed space of the Mojo type system, in favor of just writing some code
> and letting it raise an exception at runtime if we got something wrong."
>
> — <https://mojolang.org/docs/manual/python/mojo-from-python/>

```python
def foo(x, y, z):
    x[y] = int(z)
    x = y + z
```

> "Rule of thumb: Any Python builtin function should be accessible in Mojo using
> `Python.<builtin>()`."

```mojo
def foo(x: PythonObject, y: PythonObject, z: PythonObject) -> PythonObject:
    x[y] = Python.int(z)
    x = y + z
```

**Trade-off:** this style ports quickly but keeps runtime type errors and the
Python interpreter's speed. It is a migration stepping stone, not the end state
for a hot path.

## Known limitations

The official list, quoted in full
(<https://mojolang.org/docs/manual/python/mojo-from-python/>):

- **Functions taking more than 6 arguments.** "Currently `PyTypeBuilder.add_function()`
  and related function bindings only support Mojo functions that take up to 6
  `PythonObject` arguments." (The `def_function()` reference says up to 8; the
  two numbers disagree upstream.)
- **Keyword arguments syntax.** "Currently, Mojo functions called from Python
  only accept keyword arguments when using a trailing `kwargs:
  StringDict[PythonObject]` argument. Support for native `**kwargs` syntax will
  be added in the future."
- **Mojo package dependencies.** "Mojo code that has dependencies on packages
  other than the Mojo stdlib … are currently only supported when building Mojo
  extension modules manually, as the Mojo import hook does not currently support
  a way to specify import paths for Mojo package dependencies."
- **Properties.** "Computed properties getter and setters are not currently
  supported."
- **Expected type conversions.** "A handful of Mojo standard library types can be
  constructed directly from equivalent Python builtin object types, by
  implementing the `ConvertibleFromPython` trait. However, many Mojo standard
  library types do not yet implement this trait, so may require manual conversion
  logic if needed."

> **Open question:** the manual says function bindings "only support Mojo
> functions that take up to 6 `PythonObject` arguments", while the
> `PythonModuleBuilder.def_function()` reference says "Accepts functions with
> `PythonObject` arguments (up to 8)". Both are official 1.x pages. Treat 6 as
> the safe documented bound until upstream reconciles them, and check the
> compiler if the exact limit matters.

> **Open question:** the beta banner says "expect a lot of changes to the API and
> ergonomics", but there is no stability marker for the bindings API. The
> stability page's rule applies — stdlib APIs are unstable unless marked — but
> the bindings are documented as beta on top of that. Verify signatures against
> the installed version before relying on them across upgrades.

## Pitfalls

- **Forgetting `import mojo.importer`.** Without it, `import mojo_module` does
  not know how to compile the `.mojo` file.
- **Mismatched entry-point name.** Python looks for `PyInit_<stem>()`. Rename
  the file and the entry point must be renamed too.
- **`raises` on the entry point.** `abi("C")` functions cannot raise; catch and
  `abort` inside.
- **Registering a function without the right signature.** `def_function()`
  accepts only supported shapes (see above); anything else must go through
  `def_py_function()`.
- **Committing `__mojocache__`.** It is derived; delete and let it rebuild.
- **Assuming keyword-only arguments work.** `def foo(*, x: Int)` is not supported
  in bindings; use an unsugared `StringDict` trailing argument.
- **Assuming arbitrary Mojo dependencies work under the import hook.** They need
  the manual `mojo build --emit shared-lib` route with explicit import paths.
- **Expecting full type coverage in both directions.** `ConvertibleFromPython`
  is implemented only by a subset of stdlib types.

## Sources

- <https://mojolang.org/docs/manual/python/mojo-from-python/>
- <https://mojolang.org/docs/manual/python/>
- <https://mojolang.org/docs/manual/python/types/>
- <https://mojolang.org/docs/std/python/>
- <https://mojolang.org/docs/std/python/bindings/>
- <https://mojolang.org/docs/std/python/bindings/PythonModuleBuilder/>
- <https://mojolang.org/docs/std/python/conversions/>
- <https://mojolang.org/docs/std/python/python_object/PythonObject/>
- <https://mojolang.org/docs/reference/function-declarations/#abi-c>
- <https://mojolang.org/docs/reference/decorators/export/>
- <https://mojolang.org/docs/cli/build/>
- <https://mojolang.org/releases/v1.0.0/>
