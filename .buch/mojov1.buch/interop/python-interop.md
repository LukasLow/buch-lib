# Python interoperability

Python interoperability in Mojo is a **boundary you cross deliberately**, in
either direction, with a Python interpreter that is already running in your
process. It is not the language's execution model and it is not a promise that
Python code merely runs. This page gives the big picture; the other pages in this
chapter cover each direction and each mechanism in detail.

The two directions are official and both are named in the manual:

> "There are two types of compatibility (or interoperability) that we support:
>
> - *Calling Python from Mojo*: You can import existing Python modules and use
>   them in a Mojo program. This is 100% compatible because we use the CPython
>   runtime without modification for full compatibility with existing Python
>   libraries. You can construct Python objects and call Python functions
>   directly from Mojo, using the CPython interpreter as a dynamic library …
> - *Calling Mojo from Python*: You can extend your Python code with
>   high-performance Mojo code (or incrementally migrate Python code to Mojo).
>   Because Mojo is a compiled language, we can't directly "evaluate" Mojo code
>   from Python. Instead, you must declare which Mojo functions and types are
>   available to be called from Python (declare the "bindings"), and then you can
>   import them in your Python code … just like any other module—there's no extra
>   compilation step."
>
> — <https://mojolang.org/docs/manual/python/>

And the design intent behind both:

> "By embracing both directions of language interoperability, you can choose how
> to use Mojo with Python in a way that works best for your use case."
>
> — <https://mojolang.org/docs/manual/python/>

## Mojo is not a Python superset in practice

This is the single most important framing on this page, and it is stated by the
official documentation in three separate places.

The Python-to-Mojo guide opens by refusing the "faster Python" story:

> "Mojo is designed with Python programmers in mind, but it isn't "just Python,
> only faster." Mojo introduces a type system, ownership-aware semantics, and
> low-level control that, as a Python developer, you may not have had to reason
> about to make your code work."
>
> — <https://mojolang.org/docs/manual/python-to-mojo/>

The roadmap is explicit that full superset status is not promised at all:

> "Mojo may or may not evolve into a full superset of Python, and it's okay if it
> doesn't."
>
> — <https://mojolang.org/docs/roadmap/>

And the vision page prioritises performance work over surface compatibility:

> "Mojo will support more Python features over time, but our primary focus is on
> building features that unlock high-performance, portable compute—not on
> quickly achieving surface-level Python compatibility."
>
> — <https://mojolang.org/docs/vision/>

So "Mojo is a Python superset" is false as a description of 1.x. A superset
would accept an arbitrary Python program unchanged. Mojo 1.x does not:

- **Untyped Python-style code is a non-goal.** The roadmap lists it under
  *Non-goals* for phase 1: "Untyped Python-style code: For now, Mojo requires
  explicit `PythonObject` type annotations."
  (<https://mojolang.org/docs/roadmap/>)
- **There are no classes or inheritance.** "Mojo structs are similar to classes.
  However, Mojo structs do *not* support inheritance. Mojo doesn't support
  classes at this time." (<https://mojolang.org/docs/manual/get-started/>)
- **Collections are homogeneous and statically typed** — a `List` holds one
  element type, unlike a Python `list`.
- **Integers are fixed width.** `Int` is a machine-word type, not Python's
  arbitrary-precision `int`.

What Mojo *does* share with Python is syntax and ergonomics. The manual says:
"Mojo looks like Python but its execution model is closer to Rust, Swift, C++,
and other systems languages."
(<https://mojolang.org/docs/manual/python-to-mojo/>) Treat the similarity as a
convenience, not a compatibility guarantee. See
[what Mojo is](../intro/what-is-mojo.md) for the execution-model differences at
length.

## Interop is bidirectional and first-class

"Bidirectional" is a roadmap commitment that is already checked off for phase 1:

> "We want Mojo to be an approachable way to extend and speed up existing Python
> code. We've used the key features of popular libraries like "nanobind" as a
> guideline:
>
> - ✅ Build integration: Added seamless connection between Mojo's build system
>   and Python packaging.
> - ✅ Python export: Supported exposing functions and initializers to Python."
>
> — <https://mojolang.org/docs/roadmap/>

"First-class" shows up in two concrete properties:

1. **No translation layer on the Python side.** Mojo uses "the CPython runtime
   without modification", so an imported Python module behaves as it always did
   (<https://mojolang.org/docs/manual/python/>).
2. **No separate build step for the Python side.** With the Mojo import hook,
   Python imports a `.mojo` file "just like any other module—there's no extra
   compilation step" — the hook compiles it behind the scenes
   (<https://mojolang.org/docs/manual/python/>).

The 1.0.0 release notes add that the hot path was made materially faster:

> "`PythonObject` arithmetic, comparison, and membership operators now dispatch
> through CPython's abstract protocols instead of a Python-level attribute lookup
> followed by a bound-method call. This is roughly 12x faster on the interop hot
> path and follows standard Python operator semantics more closely."
>
> — <https://mojolang.org/releases/v1.0.0/>

Faster is not free. Calling Python still enters CPython, allocates Python
objects, and pays Python-level dispatch; it is a bridge, not JIT compilation of
Python. Use it to *reuse* Python code, not to make arbitrary Python fast.

## The Python requirement

Interop is optional and has its own prerequisite:

> "Mojo itself doesn't require Python. To use the Mojo ↔ Python interoperability
> features described in this section, you need Python 3.10–3.14."
>
> — <https://mojolang.org/docs/manual/python/>

A pure-Mojo program needs no Python. The moment you call Python from Mojo or
bind Mojo for Python, a CPython 3.10–3.14 interpreter must exist in the runtime
environment. Mojo does not ship one: "Mojo doesn't include a CPython
interpreter—it uses the CPython interpreter provided by your environment's
default Python version." (<https://mojolang.org/docs/manual/python/python-from-mojo/>)
The requirements page repeats the window:
<https://mojolang.org/docs/requirements/>.

Because the interpreter is the environment's, the manual recommends pinning it:

> "To ensure you get consistent results, we recommend you use Pixi to manage your
> package dependency and virtual environment."
>
> — <https://mojolang.org/docs/manual/python/python-from-mojo/>

## What this means for structuring a project

Because interop is bidirectional, the same Python-plus-Mojo project can be
organised three ways. The right choice follows from *which side owns the
program*.

| Shape | Who owns the entry point | Mojo's role | When to choose it |
|-------|--------------------------|-------------|-------------------|
| **Pure Mojo** | Mojo `main()` | The whole program | No Python dependency is needed; interop is not required at all |
| **Mojo drives Python** | Mojo `main()` | Imports Python modules as libraries | You need a Python library (NumPy, a plotting/IO stack) but the control flow and hot code are Mojo |
| **Python drives Mojo** | Python `main.py` | Supplies a bound extension module for the hot part | You have a working Python application and want to move one hotspot to Mojo |

Practical rules that follow from the official material:

1. **Do not plan on "run our Python unchanged".** A Python entry point that
   should call Mojo must be paired with a Mojo module that declares bindings
   (`PyInit_<module>` + `PythonModuleBuilder`). Conversely, Python code called
   from Mojo must accept `PythonObject`-typed values, because "Mojo requires
   explicit `PythonObject` type annotations"
   (<https://mojolang.org/docs/roadmap/>).
2. **Choose the direction before writing code.** Mojo-drives-Python is
   documented as 100% compatible and needs no build work; Python-drives-Mojo is
   explicitly a beta feature and carries limitations. Read
   [calling Mojo from Python](mojo-from-python.md) for that list before
   committing.
3. **Keep the boundary small.** Every crossing is a CPython call. Put the
   performance-critical loop in Mojo and cross once for input and once for
   output, rather than crossing per element.
4. **Pin the Python interpreter and the Mojo version.** The interpreter comes
   from the environment, and Mojo's stdlib is unstable by default outside marked
   APIs. See [stability](../intro/stability.md) and
   [supported platforms](../intro/supported-platforms.md).
5. **Migrate incrementally if you start from Python.** The manual frames the
   Python-drives-Mojo shape exactly that way: "you can write just the
   performance-critical parts your code in Mojo and then call it from Python."
   (<https://mojolang.org/docs/manual/python/mojo-from-python/>)
6. **`mojo build` does not bundle Python.** "`mojo build` doesn't include the
   Python packages used by your Mojo project. Instead, Mojo loads the Python
   interpreter and Python packages at runtime, so they must be provided in the
   environment where you run the Mojo program."
   (<https://mojolang.org/docs/manual/python/python-from-mojo/>) The same is true
   for Mojo extension modules and the Mojo runtime: a C or Python host must be
   able to find the shared libraries.

## What interop does not give you

- **No Python semantics for Mojo code.** `struct` is not `class`; values have
  value semantics; arguments default to immutable references; errors are return
  values, not exceptions; there is no garbage collector.
- **No silent type mixing.** Mojo primitives convert to Python objects (int,
  float, bool, string), but a Python value that needs to become a Mojo value
  requires an explicit conversion — `Int(py=...)`, `String(py=...)`, and so on.
- **No guarantee that arbitrary Python is fast inside Mojo.** The interpreter
  runs unchanged; speed comes from keeping work on the Mojo side of the line.
- **No stability guarantee on the interop APIs themselves.** The stdlib is
  unstable unless marked, and the Mojo-from-Python bindings are documented as a
  beta feature with known limitations.

## The pages in this chapter

- [Calling Python from Mojo](calling-python.md) — the CPython runtime,
  `PythonObject`, the `Python` module, conversions and performance caveats.
- [Calling Mojo from Python](mojo-from-python.md) — the build step, bindings,
  the import hook, and what is not supported.
- [Calling C from Mojo](calling-c.md) — the C FFI, for the boundaries that are
  not Python.
- [Migration from Python](migration-from-python.md) — the concrete habits a
  Python developer must unlearn, each with a before/after pair.

## Open questions

> **Open question:** the official Python-interop manual page does not document a
> supported Python *version range* narrower or wider than 3.10–3.14, and it does
> not state what happens when the environment's `python` is outside that window.
> The requirement is repeated on the requirements page; the failure mode is not
> documented. Verify against the next upstream release before relying on an
> out-of-window interpreter.

> **Open question:** the roadmap lists "Keep improving interop" as an unstarted
> (⬜) phase-2 item (<https://mojolang.org/docs/roadmap/>), while the manual
> describes Python interop as already first-class. The roadmap item refers to
> interop *with languages in general*, but the two framings are easy to conflate.
> Treat the language docs as the current state and the roadmap as direction.

## Sources

- <https://mojolang.org/docs/manual/python/>
- <https://mojolang.org/docs/manual/python-to-mojo/>
- <https://mojolang.org/docs/manual/python/python-from-mojo/>
- <https://mojolang.org/docs/manual/python/mojo-from-python/>
- <https://mojolang.org/docs/manual/get-started/>
- <https://mojolang.org/docs/roadmap/>
- <https://mojolang.org/docs/vision/>
- <https://mojolang.org/docs/requirements/>
- <https://mojolang.org/releases/v1.0.0/>
