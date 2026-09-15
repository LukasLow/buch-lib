# Page inventory — `mojov1.buch`

The concrete build plan: every page of `mojov1.buch`, grouped by folder exactly as in `structure.md`. No version wrapper folder — `mojov1.buch/` is the root, and the content tree always documents the current 1.x release. Build from this checklist; keep it consistent with `structure.md`, `keywords.md` and `stdlib.md`.

## Buch root — `mojov1.buch/`

| PATH | PURPOSE |
|------|---------|
| `+index.md` | Main page: "current Mojo version of `%%mojo.version%%`", freshness `%%mojo.verified%%`, read order, version table |
| `glossary.md` | Glossary of Mojo terms; points into pages where useful |

## `intro/` (13)

| PATH | PURPOSE |
|------|---------|
| `intro/what-is-mojo.md` | What Mojo is: design goals, lineage, audience |
| `intro/design-goals.md` | Design goals in depth |
| `intro/how-to-read-this-buch.md` | How to read this buch: current-state content tree plus `versions/` |
| `intro/reading-api-docs.md` | How to read Mojo API docs and signatures (declaration syntax, parameters, brackets, parentheses, slashes) — the official `/docs/api-docs/` page |
| `intro/install.md` | Install Mojo (`uv pip install mojo`, pixi/conda), `mojo` vs `mojo-compiler`, `max[all]` |
| `intro/supported-platforms.md` | Supported platforms: OS, CPU, RAM, GPU and Python requirements (official `/docs/requirements/`) |
| `intro/first-program.md` | First program, REPL, formatter, run/build loop |
| `intro/packages-and-modules.md` | Package/module layout, `__init__.mojo`, import resolution |
| `intro/packages-and-environments.md` | Environments, dependency management, Python 3.10–3.14 interop prerequisite |
| `intro/version-history.md` | The three version eras; channel-dependent version numbers (25.5 vs 0.25.5) |
| `intro/roadmap.md` | The official Mojo roadmap (`/docs/roadmap/`): current plans and priorities; how it differs from `design-goals.md` |
| `intro/stability.md` | Per-API stability model; source-only guarantees; no ABI stability; what 1.x guarantees |
| `intro/ai-agent-skills.md` | The official Mojo AI skills page (`/docs/tools/skills/`) and how this buch relates to it |

## `basics/` (6)

| PATH | PURPOSE |
|------|---------|
| `basics/syntax.md` | Source encoding, whitespace/indentation, identifiers (incl. escaped backticks), statements |
| `basics/literals.md` | Numeric/bool/string/collection literals; list expressions now build `Array` |
| `basics/operators.md` | Symbolic operators and precedence; word operators `and/or/not/in/is` |
| `basics/variables-and-mutability.md` | `var`, `ref`, explicit mutability, deprecation of implicit `var`-less declarations |
| `basics/control-flow.md` | `if`/`elif`/`else`, `for`, `while`, `break`/`continue`, `with`, `comptime` control flow |
| `basics/comments-and-docstrings.md` | Comments and docstrings conventions |

## `reference/` (13) — mirrors the official language reference in page form

| PATH | PURPOSE |
|------|---------|
| `reference/index.md` | Entry point for the reference chapter; what it mirrors and how it relates to `basics/` |
| `reference/expressions.md` | Expressions: parenthesized expressions, tuples, collection displays, member access, calls, subscripts, slices |
| `reference/simple-statements.md` | Simple statements: imports, expression statements, assignments and other simple statements |
| `reference/compound-statements.md` | Compound statements: `if`, loops, `try`/`except`, `with`, compile-time statements |
| `reference/literals.md` | Literal syntax: integer, float, string, t-string, boolean, `None`, `Self`, discard, ellipsis |
| `reference/numeric-types.md` | Numeric types: `SIMD`, `DType`, `Scalar`, `Int`, `UInt`, sized integers, floats, `Byte` |
| `reference/function-declarations.md` | Function declaration syntax: signatures, argument conventions, markers, variadics, effects, return types |
| `reference/struct-declarations.md` | Struct declarations: fields, methods, parameters, trait conformance, initializers, lifecycle methods |
| `reference/trait-declarations.md` | Trait declarations: required/provided methods, associated types, refinement, composition, conformance |
| `reference/closure-declarations.md` | Closure declarations: capture lists, capture conventions, move operator, parametric closures |
| `reference/docstrings.md` | Docstrings: placement, first-sentence rules, structured sections (`Parameters`, `Args`, `Returns`, …) |
| `reference/inline-mlir.md` | Inline MLIR built-ins: hardware intrinsics, atomics, GPU dialect operations |
| `reference/cheat-sheets.md` | Official cheat sheets: quick reference cards for Mojo essentials |

## `keywords/` (36: 34 true keywords + index + deprecated `fn`)

| PATH | PURPOSE |
|------|---------|
| `keywords/index.md` | Index of the 34 true keywords; one row each; states they are reserved |
| `keywords/if.md` | `if` — conditional execution |
| `keywords/elif.md` | `elif` — additional condition in an `if` chain |
| `keywords/else.md` | `else` — default branch in conditionals or loops |
| `keywords/for.md` | `for` — iteration loop |
| `keywords/while.md` | `while` — conditional loop |
| `keywords/break.md` | `break` — exits the innermost loop |
| `keywords/continue.md` | `continue` — skips to the next loop iteration |
| `keywords/pass.md` | `pass` — no-op placeholder statement |
| `keywords/return.md` | `return` — returns from a function |
| `keywords/with.md` | `with` — context manager statement |
| `keywords/try.md` | `try` — begins an error-handling block |
| `keywords/except.md` | `except` — error handler clause |
| `keywords/finally.md` | `finally` — always-execute clause in a `try` block |
| `keywords/raise.md` | `raise` — raises an error |
| `keywords/assert.md` | `assert` — aborts if a condition is false (gated by `-D ASSERT`) |
| `keywords/def.md` | `def` — function declaration (the unified replacement for `fn`) |
| `keywords/lambda.md` | `lambda` — anonymous single-expression function |
| `keywords/struct.md` | `struct` — struct type declaration |
| `keywords/trait.md` | `trait` — trait declaration |
| `keywords/var.md` | `var` — scoped variable binding |
| `keywords/ref.md` | `ref` — scoped reference binding |
| `keywords/and.md` | `and` — logical AND |
| `keywords/or.md` | `or` — logical OR |
| `keywords/not.md` | `not` — logical NOT |
| `keywords/in.md` | `in` — membership test |
| `keywords/is.md` | `is` — identity test |
| `keywords/import.md` | `import` — imports a module |
| `keywords/from.md` | `from` — selective import from a module |
| `keywords/as.md` | `as` — aliasing in imports and `except` clauses |
| `keywords/comptime.md` | `comptime` — forces compile-time evaluation |
| `keywords/true.md` | `True` — boolean true literal keyword |
| `keywords/false.md` | `False` — boolean false literal keyword |
| `keywords/none.md` | `None` — absence of a value (`NoneType`) |
| `keywords/self.md` | `Self` — the enclosing type |
| `keywords/fn.md` | Deprecated stub: `fn` unified into `def` in 1.0; points to `keywords/def.md` and `versions/1.0.0` |

## `keyword-conventions/` (9, not reserved)

| PATH | PURPOSE |
|------|---------|
| `keyword-conventions/index.md` | Index; states these have fixed meaning but are NOT reserved words |
| `keyword-conventions/imm.md` | `imm` — immutable reference argument (default); replaced `read` |
| `keyword-conventions/mut.md` | `mut` — mutable reference argument |
| `keyword-conventions/out.md` | `out` — argument returns a value without a return arrow |
| `keyword-conventions/deinit.md` | `deinit` — destructive transfer; end of a value's lifecycle |
| `keyword-conventions/raises.md` | `raises` — function can raise errors |
| `keyword-conventions/where.md` | `where` — constraint clause at the end of a declaration |
| `keyword-conventions/alias.md` | `alias` — compile-time binding; documentation gap (not on the keyword list) |
| `keyword-conventions/async-await.md` | `async`/`await` — UNSTABLE and missing from the keyword reference; flagged |

## `types/` (10)

| PATH | PURPOSE |
|------|---------|
| `types/overview.md` | Type-system overview: value semantics, traits, `Movable` by default |
| `types/integers-and-floats.md` | Numeric types; `Int` = `Scalar[DType.int]`; `SIMD`, fixed-width types |
| `types/bool-and-strings.md` | `Bool`, `String`, `StringSpan`, grapheme-cluster iteration |
| `types/structs.md` | `struct` declaration, fields, `__init__`/`__deinit__`, conditional conformance |
| `types/operator-support.md` | Operator support for custom types: implementing dunder methods (`__add__`, `__eq__`, …) for structs |
| `types/self-referential-structs.md` | Self-referential structs: linked lists, trees and other recursive data structures via pointers |
| `types/traits.md` | `trait` declarations, conformance, `Deinitable`/`Movable`/`Copyable` |
| `types/collections.md` | `Array`, `List`, `Dict`, `Set`, `Optional`, `Span`; interior origins |
| `types/pointers-and-references.md` | Unified `Pointer`, `unsafe_*` operations, references and origins |
| `types/optionals-and-nullability.md` | `Optional`, `None`, `Iterable` of 0/1, linear element support |

## `functions/` (4)

| PATH | PURPOSE |
|------|---------|
| `functions/parameters-and-generics.md` | Parameters, argument conventions, generics, variadics, `where` clauses |
| `functions/overloads.md` | Function overloading rules; no overloading by argument convention |
| `functions/closures-and-lambdas.md` | Captures, closures, and `lambda` expressions |
| `functions/decorators-and-metaprogramming.md` | Decorators, `comptime`, compile-time evaluation, reflection |

## `decorators/` (13) — one page per official built-in decorator

| PATH | PURPOSE |
|------|---------|
| `decorators/index.md` | Index of Mojo's built-in decorators; states they are the official set |
| `decorators/align.md` | `@align` — specifies a minimum alignment for a struct |
| `decorators/always-inline.md` | `@always_inline` — copies the function body into the caller |
| `decorators/deprecated.md` | `@deprecated` — marks outdated APIs and schedules removal; `use` parameter for migration |
| `decorators/doc-hidden.md` | `@doc_hidden` — hides declarations from generated documentation |
| `decorators/explicit-destroy.md` | `@explicit_destroy` — prevents automatic destruction; requires named destructor methods |
| `decorators/export.md` | `@export` — marks a function for export |
| `decorators/fieldwise-init.md` | `@fieldwise_init` — generates the fieldwise constructor for a struct |
| `decorators/implicit.md` | `@implicit` — marks a constructor eligible for implicit conversion |
| `decorators/no-inline.md` | `@no_inline` — prevents a function from being inlined |
| `decorators/staticmethod.md` | `@staticmethod` — declares a struct method as static |
| `decorators/copy-capture.md` | `@__copy_capture` — captures register-passable typed values by copy (deprecated) |
| `decorators/parameter.md` | `@parameter` — declares a legacy closure (deprecated) |

## `memory/` (4)

| PATH | PURPOSE |
|------|---------|
| `memory/value-semantics.md` | Value semantics, copies versus moves, `Copyable`/`Movable` |
| `memory/ownership-and-lifetimes.md` | Ownership, ASAP destruction, `Deinitable`, `__deinit__` |
| `memory/origin-and-borrowing.md` | Origins, interior origins, borrow checking, exclusivity |
| `memory/allocators.md` | Allocators, `Allocation`, `memory.alloc`, unsafe memory APIs |

## `lifecycle/` (4) — the value lifecycle made explicit

| PATH | PURPOSE |
|------|---------|
| `lifecycle/index.md` | Chapter intro to the value lifecycle: the life → initialization → death arc and why it matters |
| `lifecycle/life.md` | Value creation — when and how Mojo creates values |
| `lifecycle/initialization.md` | Logical vs. fieldwise instance initialization |
| `lifecycle/death.md` | Value destruction — when and how Mojo destroys values |

## `errors/` (3)

| PATH | PURPOSE |
|------|---------|
| `errors/error-model.md` | `Error`, `raises`, error as an implicit result, `deinit`/linear interactions |
| `errors/raising-and-propagation.md` | Raising, propagation, `try`/`except`/`finally`, `raise e` vs `raise e^` |
| `errors/safety-and-undefined-behaviour.md` | Safety boundaries, `unsafe_*`, assertions, abort semantics |

## `interop/` (5)

| PATH | PURPOSE |
|------|---------|
| `interop/python-interop.md` | Python interop overview; explains Mojo is NOT a Python superset |
| `interop/calling-python.md` | Call Python from Mojo (`PythonObject`, `PythonModuleBuilder`, NumPy helpers) |
| `interop/mojo-from-python.md` | Call Mojo from Python: import and use Mojo modules in Python code (official `/docs/manual/python/mojo-from-python/`) |
| `interop/calling-c.md` | Call C code from Mojo; C ABI, library loading, `ffi` |
| `interop/migration-from-python.md` | Orientation for Python developers: what changes and why (not a superset) |

## `concurrency/` (3)

| PATH | PURPOSE |
|------|---------|
| `concurrency/async-and-parallelism.md` | Async execution, threads, `parallelize`, synchronization |
| `concurrency/gpu-and-accelerators.md` | GPU programming; stdlib `gpu` plus pointers to MAX for moved APIs |
| `concurrency/vectorization-and-simd.md` | `vectorize`, `SIMD`, `SIMDLength`, `algorithm` performance primitives |

## `stdlib/` (38: 37 packages + overview)

| PATH | PURPOSE |
|------|---------|
| `stdlib/overview.md` | How the stdlib is organized; the 37 top-level packages; MAX/tensor split |
| `stdlib/algorithm.md` | Vectorization, functional map, tiling |
| `stdlib/atomic.md` | Atomic operations and memory orderings |
| `stdlib/base64.md` | base64/base16 encode and decode |
| `stdlib/benchmark.md` | Benchmarking: statistics and reports |
| `stdlib/bit.md` | Bitwise manipulation, counting, rotation, power-of-two utilities |
| `stdlib/builtin.md` | Built-in types (`Int`, `SIMD`, `Bool`, `Tuple`, `Error`, …) and core traits |
| `stdlib/collections.md` | `List`, `Dict`, `Set`, `Optional`, `String`, `Array`, `Span`, etc. |
| `stdlib/compile.md` | Runtime compilation and introspection: assembly, IR, linkage, metadata |
| `stdlib/complex.md` | Complex numbers: SIMD and scalar types |
| `stdlib/documentation.md` | Doc built-ins: decorators and utilities for doc generation |
| `stdlib/ffi.md` | Calling C code and loading libraries |
| `stdlib/format.md` | Formatting traits for converting types to text |
| `stdlib/gpu.md` | GPU programming primitives remaining in stdlib |
| `stdlib/hashlib.md` | Cryptographic and non-cryptographic hashing |
| `stdlib/io.md` | Console I/O, file handling, writing traits |
| `stdlib/iter.md` | `Iterable`, `IterableOwned`, `Iterator`, `enumerate`, `zip`, `map` |
| `stdlib/itertools.md` | Lazy sequence generation and transformation |
| `stdlib/logger.md` | Logging with configurable severity levels |
| `stdlib/math.md` | Trig, exponential, logarithmic and special functions and constants |
| `stdlib/memory.md` | Pointers, allocations, address spaces |
| `stdlib/origin.md` | Mojo's origin types |
| `stdlib/os.md` | Environment, filesystem, process control |
| `stdlib/pathlib.md` | Filesystem path manipulation and navigation |
| `stdlib/prelude.md` | Fundamental types, traits and operations auto-imported |
| `stdlib/pwd.md` | Password database lookups for user account information |
| `stdlib/python.md` | Python interop: imports, calls, type conversion |
| `stdlib/random.md` | Pseudorandom numbers: uniform and normal distributions |
| `stdlib/reflection.md` | Compile-time reflection over types and functions |
| `stdlib/runtime.md` | Runtime services: async execution and program tracing |
| `stdlib/stat.md` | File type constants and detection from stat system calls |
| `stdlib/subprocess.md` | Execute external processes and commands |
| `stdlib/sys.md` | I/O, hardware info, intrinsics, compile-time utilities |
| `stdlib/tempfile.md` | Create, locate and clean up temporary files and directories |
| `stdlib/testing.md` | Assertions (equal, true, raises) and test suites |
| `stdlib/time.md` | Monotonic clocks, performance counters, sleep, `time_function` |
| `stdlib/traits.md` | Core object-lifetime and value-semantics traits |
| `stdlib/utils.md` | Indexing, variants, static tuples, thread synchronization |

## `idioms/` (4)

| PATH | PURPOSE |
|------|---------|
| `idioms/style-guide.md` | Official style guide and formatting; naming conventions |
| `idioms/patterns.md` | Idiomatic patterns: resource cleanup, iteration, error paths, null handling |
| `idioms/anti-patterns.md` | Compiles-but-wrong cases and beginner traps (e.g. dangling interior references) |
| `idioms/performance-idioms.md` | Performance idioms; when not to optimize |

## `tooling/` (8)

| PATH | PURPOSE |
|------|---------|
| `tooling/compiler-and-flags.md` | `mojo` compiler, flags, build profiles, `-D ASSERT` |
| `tooling/feature-toggles.md` | Compilation feature toggles: conditionally enabling/disabling behavior at compile time |
| `tooling/formatter-and-linter.md` | Formatter and static analysis |
| `tooling/testing.md` | `testing` package, unit-test workflow, benchmarking/fuzzing hooks |
| `tooling/notebooks.md` | Using Mojo in local and Colab Jupyter notebooks |
| `tooling/debugging-and-profiling.md` | LLDB debugger, profilers, profiling and memory tools |
| `tooling/editor-and-lsp.md` | LSP, editor setup, REPL/playground |
| `tooling/pixi.md` | Pixi basics: the prefix.dev CLI for environments, and how it relates to `mojo`/`max` installs |

## `cli/` (9) — tooling chapter for the command line

| PATH | PURPOSE |
|------|---------|
| `cli/index.md` | The `mojo` command-line interface; command overview |
| `cli/build.md` | `mojo build` — builds an executable from a Mojo file |
| `cli/run.md` | `mojo run` — builds and executes a Mojo file |
| `cli/format.md` | `mojo format` — formats Mojo source files |
| `cli/repl.md` | `mojo repl` — launches the Mojo REPL |
| `cli/doc.md` | `mojo doc` — compiles docstrings from a Mojo file |
| `cli/precompile.md` | `mojo precompile` — precompiles a Mojo package |
| `cli/debug.md` | `mojo debug` — launches the Mojo debugger (CLI or external editor) |
| `cli/demangle.md` | `mojo demangle` — demangles the given name |

## `project/` (3)

| PATH | PURPOSE |
|------|---------|
| `project/structure.md` | Project structure and layering; configuration and secrets |
| `project/packaging-and-distribution.md` | Packaging, `.mojoc`/`.mojopkg`, distributing your own code |
| `project/ci.md` | CI, cross-platform notes, release automation |

## `versions/` (2 for now; one page per release)

| PATH | PURPOSE |
|------|---------|
| `versions/index.md` | Table: version, date, headline, link to the release page |
| `versions/1.0.0.md` | What 1.0.0 means versus 0.x; all breaking changes; old→new rename table; what is now idiomatic |

Future 1.x releases add exactly one page under `versions/` and bump `.kdb/mojo/version.js` — no content copy, no version folder.

## `appendix/` (5)

| PATH | PURPOSE |
|------|---------|
| `appendix/cheat-sheet.md` | Condensed cheat sheet (keywords, conventions, core types) |
| `appendix/comparison-to-python.md` | Mojo versus Python, honestly: not a superset |
| `appendix/faq.md` | Mojo FAQ: answers to frequently asked questions (official `/docs/faq/`) |
| `appendix/exercises.md` | Exercises |
| `appendix/further-reading.md` | Canonical links, community packages, llms.txt |

## Total page count

| Folder | Pages |
|--------|-------|
| root (`+index.md`, `glossary.md`) | 2 |
| `intro/` | 13 |
| `basics/` | 6 |
| `reference/` | 13 |
| `keywords/` | 36 |
| `keyword-conventions/` | 9 |
| `types/` | 10 |
| `functions/` | 4 |
| `decorators/` | 13 |
| `memory/` | 4 |
| `lifecycle/` | 4 |
| `errors/` | 3 |
| `interop/` | 5 |
| `concurrency/` | 3 |
| `stdlib/` | 38 |
| `idioms/` | 4 |
| `tooling/` | 8 |
| `cli/` | 9 |
| `project/` | 3 |
| `versions/` | 2 |
| `appendix/` | 5 |
| **TOTAL** | **194** |

**Total: 194 pages** in `mojov1.buch` (plus 4 `.kdb` modules under `.kdb/mojo/`, which are not pages).

**Note on the stdlib count:** the official stdlib page lists 37 packages (`pwd` was dropped from the previously stated "36"). This inventory has 37 stdlib package pages, not 36.

## Coverage check — every official manual/reference/CLI/tools page mapped

Completeness proof for the requirement that an agent needs no internet: every page in the official docs map (`official-docs-map.md`, verbatim `https://mojolang.org/llms.txt`, Version 1.0.0) is mapped to the book page that covers it. Every row now names a destination; the resolved gaps are listed under *Official pages resolved in this pass* below.

### Official manual → book

| Official page | Book page |
|---------------|-----------|
| `/docs/manual/` | `+index.md` / `intro/how-to-read-this-buch.md` |
| `/docs/manual/get-started/` | `intro/first-program.md` |
| `/docs/manual/quickstart/` | `intro/first-program.md` |
| `/docs/manual/basics/` | `basics/syntax.md` |
| `/docs/manual/variables/` | `basics/variables-and-mutability.md` |
| `/docs/manual/control-flow/` | `basics/control-flow.md` |
| `/docs/manual/operators/` | `basics/operators.md` |
| `/docs/manual/functions/` | `functions/parameters-and-generics.md` |
| `/docs/manual/functions/closures/` | `functions/closures-and-lambdas.md` |
| `/docs/manual/functions/lambda/` | `functions/closures-and-lambdas.md` |
| `/docs/manual/generics/` | `functions/parameters-and-generics.md` |
| `/docs/manual/parameters/` | `functions/parameters-and-generics.md` |
| `/docs/manual/structs/` | `types/structs.md` |
| `/docs/manual/structs/operator-support/` | `types/operator-support.md` |
| `/docs/manual/structs/reference/` | `types/self-referential-structs.md` |
| `/docs/manual/traits/` | `types/traits.md` |
| `/docs/manual/types/` | `types/overview.md` |
| `/docs/manual/packages/` | `intro/packages-and-modules.md` |
| `/docs/manual/pointers/` | `types/pointers-and-references.md` |
| `/docs/manual/pointers/using-pointers/` | `types/pointers-and-references.md` |
| `/docs/manual/values/` | `memory/ownership-and-lifetimes.md` |
| `/docs/manual/values/ownership/` | `memory/ownership-and-lifetimes.md` |
| `/docs/manual/values/lifetimes/` | `memory/origin-and-borrowing.md` |
| `/docs/manual/values/value-semantics/` | `memory/value-semantics.md` |
| `/docs/manual/lifecycle/` | `lifecycle/index.md` |
| `/docs/manual/lifecycle/life/` | `lifecycle/life.md` |
| `/docs/manual/lifecycle/initialization/` | `lifecycle/initialization.md` |
| `/docs/manual/lifecycle/death/` | `lifecycle/death.md` |
| `/docs/manual/errors/` | `errors/error-model.md` |
| `/docs/manual/metaprogramming/` | `functions/decorators-and-metaprogramming.md` |
| `/docs/manual/metaprogramming/comptime-evaluation/` | `functions/decorators-and-metaprogramming.md` |
| `/docs/manual/metaprogramming/constraints/` | `functions/decorators-and-metaprogramming.md` |
| `/docs/manual/metaprogramming/materialization/` | `functions/decorators-and-metaprogramming.md` |
| `/docs/manual/metaprogramming/reflection/` | `stdlib/reflection.md` |
| `/docs/manual/python/` | `interop/python-interop.md` |
| `/docs/manual/python/python-from-mojo/` | `interop/calling-python.md` |
| `/docs/manual/python/mojo-from-python/` | `interop/mojo-from-python.md` |
| `/docs/manual/python/types/` | `interop/python-interop.md` |
| `/docs/manual/python-to-mojo/` | `interop/migration-from-python.md` |
| `/docs/manual/c-ffi/` | `interop/calling-c.md` |

### Official language reference → book

| Official page | Book page |
|---------------|-----------|
| `/docs/reference/` | `reference/index.md` |
| `/docs/reference/keywords/` | `keywords/index.md` + `keyword-conventions/index.md` |
| `/docs/reference/decorators/` | `decorators/index.md` |
| `/docs/reference/decorators/align/` | `decorators/align.md` |
| `/docs/reference/decorators/always-inline/` | `decorators/always-inline.md` |
| `/docs/reference/decorators/copy-capture/` | `decorators/copy-capture.md` |
| `/docs/reference/decorators/deprecated/` | `decorators/deprecated.md` |
| `/docs/reference/decorators/doc-hidden/` | `decorators/doc-hidden.md` |
| `/docs/reference/decorators/explicit-destroy/` | `decorators/explicit-destroy.md` |
| `/docs/reference/decorators/export/` | `decorators/export.md` |
| `/docs/reference/decorators/fieldwise-init/` | `decorators/fieldwise-init.md` |
| `/docs/reference/decorators/implicit/` | `decorators/implicit.md` |
| `/docs/reference/decorators/no-inline/` | `decorators/no-inline.md` |
| `/docs/reference/decorators/parameter/` | `decorators/parameter.md` |
| `/docs/reference/decorators/staticmethod/` | `decorators/staticmethod.md` |
| `/docs/reference/expressions/` | `reference/expressions.md` |
| `/docs/reference/simple-statements/` | `reference/simple-statements.md` |
| `/docs/reference/compound-statements/` | `reference/compound-statements.md` |
| `/docs/reference/literals/` | `reference/literals.md` |
| `/docs/reference/numeric-types/` | `reference/numeric-types.md` |
| `/docs/reference/types/` | `types/overview.md` + the `types/` reference pages (`integers-and-floats.md`, `bool-and-strings.md`, `collections.md`, `pointers-and-references.md`, `optionals-and-nullability.md`); the built-in-types reference is the union of these pages, so one tour page plus the type pages covers both |
| `/docs/reference/operators/` | `basics/operators.md` (no `reference/operators.md` page: the page already carries the full precedence/associativity/symbol reference) |
| `/docs/reference/function-declarations/` | `reference/function-declarations.md` |
| `/docs/reference/struct-declarations/` | `reference/struct-declarations.md` |
| `/docs/reference/trait-declarations/` | `reference/trait-declarations.md` |
| `/docs/reference/closure-declarations/` | `reference/closure-declarations.md` |
| `/docs/reference/lambda-expressions/` | `functions/closures-and-lambdas.md` (no `reference/lambda-expressions.md` page: same topic — lambda signature grammar, captures and thin-vs-closure lambdas are all taught there) |
| `/docs/reference/docstrings/` | `reference/docstrings.md` |
| `/docs/reference/inline-mlir/` | `reference/inline-mlir.md` |
| `/docs/reference/cheat-sheets/` | `reference/cheat-sheets.md` |

### Official CLI reference → book (all covered)

| Official page | Book page |
|---------------|-----------|
| `/docs/cli/` | `cli/index.md` |
| `/docs/cli/build/` | `cli/build.md` |
| `/docs/cli/run/` | `cli/run.md` |
| `/docs/cli/format/` | `cli/format.md` |
| `/docs/cli/repl/` | `cli/repl.md` |
| `/docs/cli/doc/` | `cli/doc.md` |
| `/docs/cli/precompile/` | `cli/precompile.md` |
| `/docs/cli/debug/` | `cli/debug.md` |
| `/docs/cli/demangle/` | `cli/demangle.md` |

### Official tools pages → book

| Official page | Book page |
|---------------|-----------|
| `/docs/tools/compilation/` | `tooling/compiler-and-flags.md` |
| `/docs/tools/debugging/` | `tooling/debugging-and-profiling.md` |
| `/docs/tools/feature-toggles/` | `tooling/feature-toggles.md` |
| `/docs/tools/notebooks/` | `tooling/notebooks.md` |
| `/docs/tools/packaging/` | `project/packaging-and-distribution.md` |
| `/docs/tools/skills/` | `intro/ai-agent-skills.md` |
| `/docs/tools/testing/` | `tooling/testing.md` |

### Official front-matter / other docs → book

| Official page | Book page |
|---------------|-----------|
| `/docs/` | `+index.md` / `intro/how-to-read-this-buch.md` |
| `/install/` | `intro/install.md` |
| `/docs/requirements/` | `intro/supported-platforms.md` |
| `/docs/api-docs/` | `intro/reading-api-docs.md` |
| `/docs/api-docs/stability/` | `intro/stability.md` |
| `/docs/faq/` | `appendix/faq.md` |
| `/docs/pixi/` | `tooling/pixi.md` |
| `/docs/roadmap/` | `intro/roadmap.md` |
| `/docs/vision/` | `intro/design-goals.md` |
| `/docs/std/` | `stdlib/overview.md` + 37 package pages |

## Official pages resolved in this pass

The 14 previously uncovered official pages are now closed. Eleven got a new book page; three were mapped to an existing page because that page already covers the topic in full, so a second page would duplicate it.

| Official page | Resolution |
|---------------|------------|
| `/docs/manual/structs/operator-support/` | NEW `types/operator-support.md` — implementing dunder operators for custom types |
| `/docs/manual/structs/reference/` | NEW `types/self-referential-structs.md` — recursive structs via pointers |
| `/docs/manual/lifecycle/` | NEW `lifecycle/index.md` — chapter intro (only its three children existed) |
| `/docs/manual/python/mojo-from-python/` | NEW `interop/mojo-from-python.md` — the export direction was missing |
| `/docs/reference/decorators/doc-hidden/` | NEW `decorators/doc-hidden.md` — the one missing official decorator |
| `/docs/reference/types/` | MAPPED to `types/overview.md` + the `types/` pages — the built-in-types reference is the union of the type pages |
| `/docs/reference/operators/` | MAPPED to `basics/operators.md` — that page already carries precedence, associativity and symbols |
| `/docs/reference/lambda-expressions/` | MAPPED to `functions/closures-and-lambdas.md` — signature grammar, captures and thin-vs-closure lambdas are the same topic |
| `/docs/tools/feature-toggles/` | NEW `tooling/feature-toggles.md` |
| `/docs/tools/notebooks/` | NEW `tooling/notebooks.md` |
| `/docs/api-docs/` | NEW `intro/reading-api-docs.md` — essential for an offline agent |
| `/docs/faq/` | NEW `appendix/faq.md` |
| `/docs/pixi/` | NEW `tooling/pixi.md` — install only mentioned pixi |
| `/docs/roadmap/` | NEW `intro/roadmap.md` — vision was covered, roadmap was not |

**Coverage summary:** the official map lists **96 pages** — 40 manual, 30 language reference, 9 CLI, 7 tools and 10 front-matter/other (`/docs/`, `/install/`, `requirements`, `api-docs`, `api-docs/stability`, `faq`, `pixi`, `roadmap`, `vision`, `std`). **All 96 are covered; 0 are uncovered.**

**Uncovered official pages: none**

## Self-sufficiency statement

Completeness proof: every page of the official Mojo 1.0.0 documentation map (`official-docs-map.md`, verbatim `https://mojolang.org/llms.txt`, captured 2026-09-15) has a destination page in this book. An agent can therefore read `mojov1.buch` alone — with no internet access — and still reach every documented topic of the language.

