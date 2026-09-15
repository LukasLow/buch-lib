# Comparison to Python

Mojo looks like Python and is not Python. The differences that matter are not
cosmetic: they change what assignment means, what a function argument is, what a
type is, how errors travel, and where performance comes from. This page is the
table plus the explanation, with the interop boundary stated honestly at the end.

The official framing should be read first, because it names the trap:

> "Mojo is designed with Python programmers in mind, but it isn't "just Python,
> only faster." Mojo introduces a type system, ownership-aware semantics, and
> low-level control that, as a Python developer, you may not have had to reason
> about to make your code work."

> "Mojo looks like Python but its execution model is closer to Rust, Swift, C++,
> and other systems languages."

Source: <https://mojolang.org/docs/manual/python-to-mojo/>. The manual is equally
direct that Mojo is **not** a Python superset: see
[Python interop](../interop/python-interop.md) and the
[FAQ](faq.md#is-mojo-a-python-superset).

## The differences that matter

| Dimension | Python | Mojo 1.x |
|-----------|--------|----------|
| Typing | Optional hints, ignored at runtime | **Static**: every value has a compile-time type |
| Execution | Interpreted | **Compiled AOT** to native machine code |
| Assignment of an object | Binds another name to the same object | **Copies or transfers** (value semantics) |
| Argument passing | Reference to the object | **Immutable reference by default**; `mut`/`var` opt in |
| Class vs struct | Dynamic `class`, inheritance | Static `struct`, **no inheritance**; traits instead |
| Polymorphism | Duck typing, runtime dispatch | **Traits**, checked at compile time, no runtime dispatch |
| Function blocks | `def` with arbitrary callables | Named functions and typed **closures** with capture lists |
| Errors | Exceptions, unwinding, any type, many per `try` | **Values** (alternate return values), `raises`, **one type per `try`** |
| `try`/`except` | `except TypeError as e:` | `except e:` — the type is inferred from the call |
| Memory | GC / reference counting | **Ownership**, ASAP destruction, no GC |
| Numbers | Arbitrary-precision `int`, one `float` | **Fixed-width** types; no default `Float` |
| Integer division | `7 / 2 == 3.5` | `7 / 2 == 3` (`/` returns the operand type) |
| Collections | Mixed types allowed | **One element type** (`Variant` for mixtures) |
| Negative indexing | `x[-1]` | Removed; `x[len(x) - 1]` |
| Iterating a string | Codepoints | **Grapheme clusters** by default |
| Imports | Flexible, implicit | Explicit; no implicit `std`; relative imports use `from` |
| Interop | — | Bidirectional with Python and C (see below) |

Sources: <https://mojolang.org/docs/manual/python-to-mojo/>,
<https://mojolang.org/docs/manual/basics/>,
<https://mojolang.org/docs/manual/structs/>,
<https://mojolang.org/docs/manual/errors/>,
<https://mojolang.org/docs/reference/types/>,
<https://mojolang.org/docs/faq/> and
<https://mojolang.org/releases/v1.0.0/>.

## Static typing

> "In Python, types are optional hints that the interpreter *mostly* ignores at
> runtime. In Mojo, types are first-class. The compiler uses them to generate
> fast, specialized machine code."

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

**Consequence:** a name has one type for its whole scope, so rebinding is an
error:

```mojo
var a = 1      # Int
a = "string"   # Error: can't implicitly convert String to Int
```

Source: <https://mojolang.org/docs/manual/python-to-mojo/>. If you need a value
that can be one of several types, make that explicit with `Variant[Int, String]`;
the variable stays statically typed as the `Variant`. Source:
<https://mojolang.org/docs/manual/python-to-mojo/>.

**Consequence:** there is no dynamic dispatch. Overloads are chosen at compile
time — "This is *static dispatch*: there's no runtime lookup. The choice is fixed
when the call is type-checked." Source:
<https://mojolang.org/docs/reference/function-declarations/>.

## Value semantics

This is the difference that breaks the most Python code.

> In Python, both `a` and `b` refer to the same list:
>
> ```python
> a = [1, 2, 3]
> b = a
> b.append(4)
> print(a)  # [1, 2, 3, 4]
> ```

> In Mojo, assignment gives you a copy.

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

```mojo
var a: List[Int] = [1, 2, 3]
var b = a.copy()      # explicit copy: List is not implicitly copyable
b.append(4)
print(a)              # [1, 2, 3]
print(b)              # [1, 2, 3, 4]
```

For `ImplicitlyCopyable` types such as `Int`, `Bool`, `String`, the copy happens
without `.copy()`:

```mojo
var s = "hello"
var t = s        # implicit copy
t = t + " world"
print(s)         # hello
```

Python's reference behavior is available deliberately, with `ref`:

```mojo
var a: List[Int] = [1, 2, 3]
ref b = a        # b is a reference to the same value
b.append(4)
print(a)         # [1, 2, 3, 4]
```

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

| Python mental model | Mojo spelling |
|---------------------|---------------|
| `b = a` shares | `ref b = a` shares; `b = a.copy()` copies |
| `b = a` copies (rare in Python) | Mojo's default for `ImplicitlyCopyable` |
| Moving to avoid a copy | `var b = a^` (transfer sigil) |

## `struct` vs `class`

| | Python `class` | Mojo `struct` |
|---|---|---|
| Definition | `class Point:` | `struct Point:` |
| Fields | Anywhere, dynamically | Declared with `var` and a type |
| Layout | Runtime | Compile time |
| Inheritance | Yes | **No** |
| Runtime modification | Monkey-patching allowed | Not allowed |
| Dispatch | Dynamic | Static |
| Equality/operators | Via dunders | Via dunders and traits |

> "Mojo structs are static: they are bound at compile-time (you cannot add
> methods at runtime). ... Mojo structs do not support inheritance
> ("sub-classing"), but a struct can implement traits."

Source: <https://mojolang.org/docs/manual/structs/>. The manual notes "Mojo will
also support Python-style classes in the future", but they are not part of 1.x.
Source: <https://mojolang.org/docs/manual/basics/>.

```mojo
@fieldwise_init
struct Point(Copyable):
    var x: Int
    var y: Int

    def translate(mut self, dx: Int, dy: Int):
        self.x += dx
        self.y += dy
```

**Key mechanical difference:** fields must be declared with `var`, all fields
must be initialized in the constructor, and a method that mutates state declares
`mut self`:

> "You must mark `self` as mutable if updating a field value."

Source: <https://mojolang.org/docs/manual/structs/>.

## Blocks and closures

Both languages use indentation and a colon for blocks, so this part is familiar:
"Define code blocks such as functions, conditions, and loops with a colon
followed by indented lines." Source:
<https://mojolang.org/docs/manual/basics/>.

Where they differ is callables. Python accepts any callable, including a class
with `__call__`. Mojo 1.x requires closures to declare their capture list and
structs to declare closure-trait conformance explicitly:

```mojo
def outer():
    var count = 0

    def inner() {mut count}:    # explicit capture list
        count += 1

    inner()
    print(count)                # 1
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

```mojo
# Explicit closure-trait conformance; duck typing was removed in 1.0.
struct Double(def(Int) -> Int):
    def __call__(self, x: Int) capturing -> Int:
        return x * 2
```

Source: <https://mojolang.org/releases/v1.0.0/>.

## Error handling by return value

> "Mojo represents errors as values—specifically, as alternate return values from
> functions. Unlike stack-unwinding exceptions in languages like C++ or Java, Mojo
> errors don't require expensive call stack unwinding."

Source: <https://mojolang.org/docs/manual/errors/>.

```mojo
# Python
try:
    raise ValueError("bad input")
except ValueError as e:
    print(e)
```

```mojo
# Mojo
try:
    raise Error("bad input")
except e:
    print(e)
```

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

| Python | Mojo |
|--------|------|
| A function may raise with no declaration | **Non-raising by default**; `raises` must be declared |
| `except TypeError as e:` names the type | `except e:` — the type is inferred from the call |
| One `try` catches many exception types | **One error type per `try`** |
| Exceptions are classes in a hierarchy | Errors are values; at most one error type per function |
| Stack traces are automatic | Opt-in via `MODULAR_DEBUG=stack-trace-on-error` (built-in `Error` only) |
| `assert` raises `AssertionError` | `assert`/`debug_assert` **abort**, gated by `-D ASSERT` |

Sources: <https://mojolang.org/docs/manual/errors/>,
<https://mojolang.org/docs/reference/keywords/>,
<https://mojolang.org/docs/tools/feature-toggles/>.

The one-type-per-`try` rule has a practical consequence: when two calls raise
different error types, use separate `try` blocks. Source:
<https://mojolang.org/docs/manual/errors/>.

## No dynamic dispatch

Python resolves attribute and method lookups at runtime; Mojo resolves everything
at compile time. Two places make this visible:

1. **Overloads.** "The compiler picks one of them at each call site. This is
   *static dispatch*: there's no runtime lookup." Source:
   <https://mojolang.org/docs/reference/function-declarations/>.
2. **Traits vs duck typing.** A conforming type must declare the trait; matching
   a method name is not enough. "Mojo checks declared conformance, not just
   matching method names." Source:
   <https://mojolang.org/docs/manual/traits/>.

```mojo
# Python duck typing
def sketch(shape):
    shape.draw()

# Mojo: the compiler guarantees draw() exists
def sketch[T: Drawable](shape: T):
    shape.draw()
```

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

The roadmap records existentials / fully dynamic traits as a *future* item, not a
1.x feature. Source: <https://mojolang.org/docs/roadmap/>.

## Imports

Python's import system is dynamic and permissive; Mojo's is explicit and
resolved at compile time. The 1.0 release overhauled it "to make name resolution
explicit and consistent." Source:
<https://mojolang.org/releases/v1.0.0/>. The differences:

| Python | Mojo |
|--------|------|
| `import os` works from the stdlib path | **No implicit `std` imports**; write `from std.os import ...` |
| `from . import foo` and `import .foo` both work | Relative imports must use `from` (`from . import foo`) |
| A module may import itself | A module cannot import its own name |
| `__init__.py` may run code on import | `__init__.mojo` cannot run top-level code; it re-exports |
| A directory is a package if it has `__init__.py` | A directory is a package only if it has `__init__.mojo` |

Sources: <https://mojolang.org/docs/manual/packages/>,
<https://mojolang.org/releases/v1.0.0/>.

## What interop does and does not give you

Interop is bidirectional and first-class, but it is a boundary — not a merge.

**What you get:**

- **Call Python from Mojo.** Import a Python module as-is and use it:
  "Mojo supports the ability to import Python modules as-is, so you can leverage
  existing Python code right away." Source:
  <https://mojolang.org/docs/manual/basics/>.

  ```mojo
  from std.python import Python

  def main() raises:
      var np = Python.import_module("numpy")
      var ar = np.arange(15).reshape(3, 5)
      print(ar)
  ```

  Values crossing the boundary are `PythonObject`s, and the module must be
  installed in the environment. Source:
  <https://mojolang.org/docs/manual/basics/>.

- **Call Mojo from Python.** Build Mojo bindings and import them into Python:
  "You can also migrate parts of a Python project to Mojo by building Mojo
  bindings for Python." Source: <https://mojolang.org/docs/faq/>.

- **A faster interop hot path since 1.0.** "`PythonObject` operators dispatch
  through CPython abstract protocols (~12x faster on the interop hot path)."
  Source: <https://mojolang.org/releases/v1.0.0/>.

**What you do not get:**

- **It is not a superset.** Mojo is statically typed with value semantics and
  ownership; Python is dynamically typed with reference semantics. Source:
  <https://mojolang.org/docs/manual/python-to-mojo/>.
- **You must have the Python module installed.** "You must have the Python
  module (such as `numpy`) installed in the environment where you're using Mojo."
  Source: <https://mojolang.org/docs/manual/basics/>.
- **Python objects are not Mojo values.** They are wrapped in `PythonObject`, so
  every crossing is a boundary; keeping hot loops on Mojo types matters. Source:
  <https://mojolang.org/docs/manual/types/> and
  <https://mojolang.org/releases/v1.0.0/>.
- **A built executable does not bundle Python.** "A built executable does not
  bundle Python libraries used by the project; they must be provided by the
  environment where the executable runs." Source:
  <https://mojolang.org/docs/cli/build/>.
- **Python interop needs Python 3.10–3.14.** Source:
  <https://mojolang.org/docs/requirements/>.

Also in scope: **C interop**, through the `ffi` module, the `@export` decorator,
and the `abi("C")` effect. "Mojo code is interoperable with C code ... Mojo code
is also interoperable with C++ code that uses `extern "C"`." Source:
<https://mojolang.org/docs/faq/>.

## The mindset shift

The official guide ends with Python instincts that mislead, and they are a good
closing summary:

| Instinct | Reality in Mojo |
|----------|-----------------|
| "I don't need types." | Types are how the compiler generates fast code. |
| "Everything is mutable." | Variables are mutable; **arguments are not** by default. |
| "I can mix types in a list." | Collections are statically typed; use `Variant`. |
| "Threads are how I parallelize." | Mojo has SIMD, threads and GPU parallelism. |
| "Classes are the natural way to structure things." | `struct` + traits fit performance-sensitive code. |

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

The guide's own summary is the takeaway:

> "Mojo gives you Pythonic ergonomics with systems-level control. That control
> comes when you embrace types, ownership, and value semantics. You don't have to
> use all of it at once, but it's there for when you need it."

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

For the porting checklist, see
[migration from Python](../interop/migration-from-python.md).

## Pitfalls

- **Assuming Mojo is a Python superset.** It is not; it is a different execution
  model with Python-like syntax. Verified above.
- **Assuming assignment aliases.** It copies or transfers; use `ref` to share.
  Verified above.
- **Rebinding a name to a different type.** The type is fixed; use `Variant` if
  the value must vary. Verified above.
- **Relying on `except ErrorType as e:`.** The type is inferred; write `except e:`.
  Verified above.
- **Catching multiple error types in one `try`.** Not allowed. Verified above.
- **Treating `assert` as a catchable error.** It aborts. Verified above.
- **Expecting dynamic dispatch or duck typing.** Conformance is explicit and
  dispatch is static. Verified above.
- **Importing from `std` implicitly.** Implicit `std` imports are an error.
  Verified above.
- **Running code in `__init__.mojo`.** It does not execute. Verified above.
- **Assuming an executable bundles Python.** It does not. Verified above.
- **Forgetting Python 3.10–3.14 is required for interop.** Verified above.
- **Assuming `7 / 2` is `3.5`.** It is `3`. Verified above.

## Sources

- Mojo manual — Mojo tips for Python devs: <https://mojolang.org/docs/manual/python-to-mojo/>
- Mojo manual — Language basics: <https://mojolang.org/docs/manual/basics/>
- Mojo manual — Variables: <https://mojolang.org/docs/manual/variables/>
- Mojo manual — Structs: <https://mojolang.org/docs/manual/structs/>
- Mojo manual — Traits: <https://mojolang.org/docs/manual/traits/>
- Mojo manual — Errors: <https://mojolang.org/docs/manual/errors/>
- Mojo manual — Modules and packages: <https://mojolang.org/docs/manual/packages/>
- Mojo reference — Function declarations: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo reference — Compound statements: <https://mojolang.org/docs/reference/compound-statements/>
- Mojo reference — Types: <https://mojolang.org/docs/reference/types/>
- Mojo reference — Keywords and conventions: <https://mojolang.org/docs/reference/keywords/>
- Mojo FAQ: <https://mojolang.org/docs/faq/>
- Mojo system requirements (Python 3.10–3.14): <https://mojolang.org/docs/requirements/>
- Mojo roadmap (existentials): <https://mojolang.org/docs/roadmap/>
- `mojo build` (no bundled Python): <https://mojolang.org/docs/cli/build/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
