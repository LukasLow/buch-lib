# What Mojo is

Mojo is a **compiled, statically typed systems programming language** that uses
Python-like syntax, adds modern ownership-based memory management, and is
designed to target CPUs and accelerators. This page gives you the mental model;
[Design goals](design-goals.md) explains why the language was built this way and
[Roadmap](roadmap.md) records where it is heading.

## Mojo is compiled

Mojo is a compiled language. Both `mojo build`
([`cli/build`](../cli/build.md)) and `mojo run` ([`cli/run`](../cli/run.md))
compile the program; there is no interpreter in the execution path. The official
FAQ states it plainly:

> "Mojo is a compiled language. `mojo build` and `mojo run` both perform
> ahead-of-time (AOT) compilation."
> — <https://mojolang.org/docs/faq/>

`mojo run` compiles the file and then immediately executes it; `mojo build`
produces a native executable. A minimal program is:

```mojo
def main():
    print("Hello, world!")
```

Every Mojo program must include a function named `main()` as its entry point;
running the program invokes `main()` and the program exits when it returns.
([Manual: Basics](https://mojolang.org/docs/manual/basics/))

Two practical consequences:

- **Compile errors are the normal feedback loop.** The compiler rejects
  type errors, ownership errors and many API misuse errors before the program
  ever runs. Agents should treat a clean compile as the first correctness gate.
- **Startup and runtime are predictable.** There is no interpreter overhead on
  each operation; the official Python-to-Mojo guide contrasts "Mojo compiles
  directly to native machine code. This gives you fast and predictable
  performance, with no interpreter overhead."
  (<https://mojolang.org/docs/manual/python-to-mojo/>)

## Mojo looks like Python, but is not Python

The syntax is deliberately Python-family: indentation blocks, `def`, `if`,
`for`, `while`, `try`/`except`, `struct` for data types, and collection literals.
But the execution model is not Python's:

> "Mojo looks like Python but its execution model is closer to Rust, Swift, C++,
> and other systems languages."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

The same page is explicit that Python familiarity is not enough:

> "Mojo is designed with Python programmers in mind, but it isn't 'just Python,
> only faster.' Mojo introduces a type system, ownership-aware semantics, and
> low-level control that, as a Python developer, you may not have had to reason
> about to make your code work."

An agent that writes Python and calls it Mojo will fail: there is no dynamic
rebinding, no implicit deep-copy semantics for heap types, and no garbage
collector. Each of the sections below names one of those differences.

## Static typing: the compiler uses types

> "Mojo is statically typed. In Python, types are optional hints that the
> interpreter _mostly_ ignores at runtime. In Mojo, types are first-class. The
> compiler uses them to generate fast, specialized machine code."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

Variables are typed at compile time and the type never changes at runtime:

> "Mojo variables are statically typed: that is, Mojo sets a variable's type at
> compile time, and the type doesn't change at runtime."
> — <https://mojolang.org/docs/manual/basics/>

```mojo
def main():
    var x = 10      # Mojo infers Int
    x = "Foo"       # error: cannot implicitly convert 'StringLiteral' to 'Int'
```

`var` is the declaration keyword; an explicit annotation is optional when the
first assignment determines the type:

```mojo
def main():
    var count: Int = 10
    var sum: Int
    sum = count + count
```

Why the compiler needs types, in one sentence: types let it lay out memory,
choose the right machine instruction, and resolve overloads **before** the
program runs. `Int` itself is a machine-word-sized integer; the official guide
notes "The general `Int` type maps to your machine's native word size."
(<https://mojolang.org/docs/manual/python-to-mojo/>). Numeric types are explicit
and fixed-width (`Int32`, `Float32`, …) rather than Python's unbounded `int`;
there is no default float type, so write `Float32` or `Float64` explicitly.

## Value semantics and explicit mutability

Mojo's default is **value semantics**: assigning or passing a value creates an
independent owner rather than a shared reference.

> "Mojo prefers _value semantics_ and explicit mutability. In Python, most
> objects are mutable references … In Mojo, assigning or passing a value
> typically creates an independent copy. Changes to one value don't affect
> others unless you make sharing explicit."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

```mojo
def main():
    var a = "hello"     # String is implicitly copyable
    var b = a           # a copy
    b = b + " world"
    print(a)            # hello
    print(b)            # hello world

    var c: List[Int] = [1, 2, 3]
    var d = c.copy()    # List is only *explicitly* copyable
    d.append(4)
    print(c)            # [1, 2, 3]
```

This is a **default**, not a mandate. The official value-semantics page says:

> "Mojo doesn't enforce value semantics or reference semantics. It supports
> them both and allows each type to define how it is created, copied, and moved
> (if at all). … That said, Mojo is designed with argument behaviors that
> default to value semantics."
> — <https://mojolang.org/docs/manual/values/value-semantics/>

Pitfalls an agent must internalize:

- Assigning a non-implicitly-copyable type (for example `List`) without
  `.copy()` or the `^` transfer sigil is a **compile error**. The official
  variables page shows the diagnostic: `'List[Int]' is not implicitly copyable
  because it doesn't conform to 'ImplicitlyCopyable'`.
  (<https://mojolang.org/docs/manual/variables/>)
- Function arguments are **immutable references by default**; a function cannot
  mutate its argument unless the parameter is declared `mut` or takes ownership
  with `var`:

  ```mojo
  def add(mut x: Int, y: Int):
      x += y             # mut: changes visible at the call site

  def main():
      var a = 1
      var b = 2
      add(a, b)
      print(a)           # 3
  ```

  Omitting `mut` makes `x += y` a compile error; the official Python-to-Mojo
  page calls that out as a surprise for Python developers.
- Variables themselves are mutable by default: "All variables in Mojo are
  mutable by default. Their value can change."
  (<https://mojolang.org/docs/manual/variables/>)

## Ownership, lifetimes and ASAP destruction

Mojo tracks which variable owns a value and destroys the value when its lifetime
ends — without a garbage collector and without reference counting:

> "Mojo supports modern ownership, but it doesn't trap you in 'safe-only'
> abstractions. With ownership, the compiler tracks which variables and fields
> control a value's lifetime. That lets Mojo manage memory effectively, without
> a garbage collector or reference counting."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

The ownership rules are short and complete:

> - "Every value has only one owner at a time."
> - "When the lifetime of the owner ends, Mojo destroys the value."
> - "If there are existing references to a value, Mojo extends the lifetime of
>   the owner."
> — <https://mojolang.org/docs/manual/values/ownership/>

Destruction is **ASAP** ("as soon as possible"): the compiler finds each value's
last use and ends its lifetime there, rather than waiting for the end of the
enclosing scope.

> "Mojo uses ownership semantics with ASAP ('as soon as possible') destruction.
> The compiler knows exactly when a value is used for the last time and its
> lifetime ends. Memory is freed at that point, without waiting for a garbage
> collector to run."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

The manual makes the timing visible with a destructor:

```mojo
@fieldwise_init
struct Balloon(Writable):
    var color: String

    def write_to(self, mut writer: Some[Writer]):
        writer.write(String("a ", self.color, " balloon"))

    def __deinit__(deinit self):
        print("Destroyed", String(self))

def main():
    var a = Balloon("red")
    var b = Balloon("blue")
    print(a)              # a red balloon
                          # Destroyed a red balloon   <- a's last use
    a = Balloon("green")  # Destroyed a green balloon  <- never used after this
    print(b)              # a blue balloon
                          # Destroyed a blue balloon  <- b's last use
```

Ownership can be transferred explicitly with the postfix **transfer sigil `^`**.
After the transfer the original variable is uninitialized and cannot be used
until it is assigned a new value:

```mojo
def take_text(var text: String):
    text += "!"
    print(text)

def main():
    var message = "Hello"
    take_text(message^)     # transfer ownership into the function
    # print(message)        # error: use of uninitialized value 'message'
```

Pitfalls:

- A `var` argument does **not** guarantee a move. Without `^` the compiler copies
  the value (and requires the type to be `Copyable`); with `^` ownership is
  transferred and the source is invalidated. See
  [ownership and lifetimes](../memory/ownership-and-lifetimes.md).
- `__deinit__()` is the destructor spelling in 1.x (not `__del__`). If you
  remember the older spelling, read
  [Versions: 1.0.0](../versions/1.0.0.md).
- Do not call destructors manually; Mojo's lifetime analysis decides when they
  run, and `_ = value` is the documented way to force an explicit last use.

## structs are static and stack-allocated

Mojo's user-defined value types are `struct`s, not Python classes:

> "Mojo structs are completely static—the compiler binds them at compile time,
> so they don't allow dynamic dispatch or any runtime changes to the structure.
> (Mojo will also support Python-style classes in the future.)"
> — <https://mojolang.org/docs/manual/basics/>

They are also stack-allocated:

> "Mojo structs are stack-allocated. The value lives in a fast, fixed-size
> region of memory rather than on the heap, where a garbage collector must track
> and clean it up."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

All fields must be declared, with types, at definition time; no field is added
at runtime:

```mojo
@fieldwise_init
struct Point(Copyable):
    var x: Int
    var y: Int

def main():
    var point = Point(5, 3)
    print(point.x, point.y)   # 5 3
```

Structs do not support inheritance. Behavior is shared through **traits**
(`trait` + conformance), and the compiler checks at the definition or call site
that a type supplies the required methods — the static replacement for Python's
runtime duck typing.

## Python interop exists, but it is optional

Mojo can import and call Python, and Python can call Mojo:

> "Mojo supports the ability to import Python modules as-is, so you can leverage
> existing Python code right away."
> — <https://mojolang.org/docs/manual/basics/>

```mojo
from std.python import Python

def main() raises:
    var np = Python.import_module("numpy")
    var ar = np.arange(15).reshape(3, 5)
    print(ar.shape)
```

Interop is a **component you opt into**, not the language's execution model:

- Mojo itself does not require Python. The system requirements state that Python
  3.10–3.14 is needed only for the interoperability features.
  (<https://mojolang.org/docs/requirements/>)
- `mojo build` executables do not embed Python libraries; those must exist in
  the runtime environment. (<https://mojolang.org/docs/cli/build/>)
- Python interop is bidirectional: call Python from Mojo, and bind Mojo modules
  for use from Python
  ([Python interop](../interop/python-interop.md)).

## Who Mojo is for

The official FAQ describes both the primary audience and the longer-term
ambition:

> "We use Mojo at Modular to develop AI algorithms and GPU kernels, but you can
> use it for other things like HPC, data transformations, writing pre/post
> processing operations, libraries, and much more."
> — <https://mojolang.org/docs/faq/>

> "Mojo's initial focus was to solve AI programmability challenges. However, our
> goal is to grow Mojo into a general-purpose programming language."
> — <https://mojolang.org/docs/faq/>

So the current sweet spot is performance-sensitive, compute-heavy code — AI
kernels, HPC, data transforms, pre/post-processing, and library code — and the
stated direction is general-purpose.

The official docs are equally clear that 1.x is **not** a beginner's language:

> "Mojo is a young language that's still evolving. As such, Mojo is currently
> **not** meant for beginners. Even this basics section assumes some programming
> experience."
> — <https://mojolang.org/docs/manual/basics/>

An agent should therefore assume a competent reader who knows Python or a
systems language, and should not simplify away types, conventions, or ownership
to make examples look friendly.

## What Mojo is not

### Not "just Python, only faster"

The official phrasing rules this out directly (quoted above): Mojo adds a type
system, ownership-aware semantics, and low-level control. A faster Python would
not require you to reason about `mut`, `^`, `Copyable`, or destructors. If a
description of Mojo is "Python that runs faster", it is wrong.

### Not a Python superset in practice

Mojo **looks** like Python and adopts Python's syntax, but it does not currently
accept all Python semantics, and it may never be a full superset:

> "Mojo may or may not evolve into a full superset of Python, and it's okay if
> it doesn't."
> — <https://mojolang.org/docs/roadmap/>

> "Mojo will support more Python features over time, but our primary focus is on
> building features that unlock high-performance, portable compute—not on
> quickly achieving surface-level Python compatibility."
> — <https://mojolang.org/docs/vision/>

Concretely: Mojo requires explicit `PythonObject` type annotations for untyped
Python-style code, has no classes/inheritance yet, does not allow mixing types
in a `List`, and does not have Python's arbitrary-precision integers. Do not
assume any given Python program runs unchanged.

### Not a scripting language

Mojo is AOT-compiled, statically typed, and ownership-checked. It is not a
glue/automation language whose errors surface at runtime: a mismatched type, a
missing `mut`, a use-after-transfer, or an uninitialized field is a compile-time
failure by design. Use it where performance and predictability matter; use
Python where dynamism and library breadth matter, optionally calling one from
the other.

## Sources

- <https://mojolang.org/docs/faq/>
- <https://mojolang.org/docs/manual/python-to-mojo/>
- <https://mojolang.org/docs/manual/basics/>
- <https://mojolang.org/docs/manual/variables/>
- <https://mojolang.org/docs/manual/values/ownership/>
- <https://mojolang.org/docs/manual/values/value-semantics/>
- <https://mojolang.org/docs/manual/lifecycle/death/>
- <https://mojolang.org/docs/roadmap/>
- <https://mojolang.org/docs/vision/>
- <https://mojolang.org/docs/requirements/>
- <https://mojolang.org/docs/cli/build/>
- <https://mojolang.org/docs/cli/run/>
