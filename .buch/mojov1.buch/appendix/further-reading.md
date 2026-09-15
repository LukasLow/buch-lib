# Further reading

**This page is optional.** It is the one page in this buch that points at the
internet. Nothing else in `mojov1.buch` requires a network connection: every
topic is taught in the buch itself, and a reader with no internet can use the
whole book. Come back here only when you *do* have a connection and want the
canonical source, the very latest release notes, or the machine-readable indexes.

All links below are official `mojolang.org` pages. They were verified against the
official docs map (`https://mojolang.org/llms.txt`) on the date recorded in
[`intro/version-history`](../intro/version-history.md).

## How to read a page offline anyway

The single most useful trick: **append `.md` to any official doc URL** to get the
official Markdown of that page, which is authoritative and machine-readable:

```sh
# Canonical page:      https://mojolang.org/docs/reference/keywords/
# Official Markdown:   https://mojolang.org/docs/reference/keywords.md
```

Source: every official `.md` page carries the note "Markdown versions of all
pages are available by appending .md to any URL". This buch is built from that
form.

## The map of everything

| Purpose | URL | What is there |
|---------|-----|---------------|
| Site overview for LLMs | <https://mojolang.org/llms.txt> | The complete list of official pages; the master navigation. |
| Manual, full text | <https://mojolang.org/llms-manual.txt> | The whole manual in one text file. |
| Language reference, full text | <https://mojolang.org/llms-reference.txt> | The whole language reference in one text file. |
| Standard library index | <https://mojolang.org/llms-stdlib.txt> | The package and API index. |
| CLI reference, full text | <https://mojolang.org/llms-cli.txt> | Every `mojo` subcommand. |

## Start here

| Purpose | URL | What is there |
|---------|-----|---------------|
| Docs home | <https://mojolang.org/docs/> | Entry point to everything. |
| Manual | <https://mojolang.org/docs/manual/> | The guided language guide. |
| Language reference | <https://mojolang.org/docs/reference/> | The normative syntax reference. |
| Standard library | <https://mojolang.org/docs/std/> | All 37 packages and their APIs. |
| FAQ | <https://mojolang.org/docs/faq/> | Purpose of Mojo, SDK contents, licensing, versioning. |
| Vision | <https://mojolang.org/docs/vision/> | Why Mojo exists and its design bets. |
| Roadmap | <https://mojolang.org/docs/roadmap/> | What is planned and what is not yet done. |

## Learn the language

| Purpose | URL | What is there |
|---------|-----|---------------|
| Get started tutorial | <https://mojolang.org/docs/manual/get-started/> | Build a complete program step by step. |
| Quickstart | <https://mojolang.org/docs/manual/quickstart/> | Get running fast. |
| Language basics | <https://mojolang.org/docs/manual/basics/> | Essential syntax in one page. |
| Tips for Python devs | <https://mojolang.org/docs/manual/python-to-mojo/> | The migration-oriented difference guide. |
| Variables | <https://mojolang.org/docs/manual/variables/> | `var`, scoping, copy and move. |
| Control flow | <https://mojolang.org/docs/manual/control-flow/> | Loops, conditionals, context managers. |
| Operators | <https://mojolang.org/docs/manual/operators/> | Operators with precedence and examples. |
| Functions | <https://mojolang.org/docs/manual/functions/> | Arguments, parameters, named results, effects. |
| Parameterization | <https://mojolang.org/docs/manual/parameters/> | Compile-time values and inference. |
| Parameterized declarations | <https://mojolang.org/docs/manual/generics/> | Traits, `where`, conditional conformance. |
| Structs | <https://mojolang.org/docs/manual/structs/> | Fields, methods, lifecycle, operator support. |
| Traits | <https://mojolang.org/docs/manual/traits/> | Contracts, conformance, refinement. |

## Memory, ownership and the lifecycle

| Purpose | URL | What is there |
|---------|-----|---------------|
| Intro to value ownership | <https://mojolang.org/docs/manual/values/> | The ownership model. |
| Ownership | <https://mojolang.org/docs/manual/values/ownership/> | Argument conventions and transfer. |
| Lifetimes, origins, references | <https://mojolang.org/docs/manual/values/lifetimes/> | Origins, `ref`, borrows. |
| Value semantics | <https://mojolang.org/docs/manual/values/value-semantics/> | What the default means. |
| Value lifecycle | <https://mojolang.org/docs/manual/lifecycle/> | Life, initialization, death. |
| Value creation | <https://mojolang.org/docs/manual/lifecycle/life/> | Constructors, copies, moves. |
| Instance initialization | <https://mojolang.org/docs/manual/lifecycle/initialization/> | Logical versus fieldwise. |
| Value destruction | <https://mojolang.org/docs/manual/lifecycle/death/> | ASAP destruction and explicit teardown. |
| Pointers intro | <https://mojolang.org/docs/manual/pointers/> | Pointer types compared. |
| Using pointers | <https://mojolang.org/docs/manual/pointers/using-pointers/> | Allocation, dereference, SIMD loads. |

## Errors

| Purpose | URL | What is there |
|---------|-----|---------------|
| Errors and context managers | <https://mojolang.org/docs/manual/errors/> | The value-based error model in full. |

## Interop

| Purpose | URL | What is there |
|---------|-----|---------------|
| Python interop | <https://mojolang.org/docs/manual/python/> | Using Python and Mojo together. |
| Calling Python from Mojo | <https://mojolang.org/docs/manual/python/python-from-mojo/> | `PythonObject` and module imports. |
| Calling Mojo from Python | <https://mojolang.org/docs/manual/python/mojo-from-python/> | Bind and import Mojo modules. |
| Python types | <https://mojolang.org/docs/manual/python/types/> | Conversion both ways. |
| C FFI | <https://mojolang.org/docs/manual/c-ffi/> | Calling C libraries, pointers, strings, structs. |

## Metaprogramming

| Purpose | URL | What is there |
|---------|-----|---------------|
| Intro to metaprogramming | <https://mojolang.org/docs/manual/metaprogramming/> | The overview. |
| Compile-time evaluation | <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/> | `comptime`, `comptime if`/`for`. |
| Comptime constraints | <https://mojolang.org/docs/manual/metaprogramming/constraints/> | Expressing program guarantees. |
| Materialization | <https://mojolang.org/docs/manual/metaprogramming/materialization/> | Using compile-time values at runtime. |
| Reflection | <https://mojolang.org/docs/manual/metaprogramming/reflection/> | Introspecting types and functions. |
| Closures | <https://mojolang.org/docs/manual/functions/closures/> | Capture lists and conventions. |
| Lambda expressions | <https://mojolang.org/docs/manual/functions/lambda/> | Anonymous single-expression functions. |

## Reference (normative)

| Purpose | URL | What is there |
|---------|-----|---------------|
| Keywords and conventions | <https://mojolang.org/docs/reference/keywords/> | Identifiers, the 34 keywords, conventions. |
| Function declarations | <https://mojolang.org/docs/reference/function-declarations/> | Full signature grammar and overloads. |
| Struct declarations | <https://mojolang.org/docs/reference/struct-declarations/> | Fields, methods, conformance, lifecycle. |
| Trait declarations | <https://mojolang.org/docs/reference/trait-declarations/> | Requirements, associated types, refinement. |
| Closure declarations | <https://mojolang.org/docs/reference/closure-declarations/> | Capture lists and parametric closures. |
| Expressions | <https://mojolang.org/docs/reference/expressions/> | Displays, calls, subscripts, slices. |
| Simple statements | <https://mojolang.org/docs/reference/simple-statements/> | Imports, assignments. |
| Compound statements | <https://mojolang.org/docs/reference/compound-statements/> | `if`, loops, `try`, `with`, `comptime`. |
| Literals | <https://mojolang.org/docs/reference/literals/> | Every literal form. |
| Numeric types | <https://mojolang.org/docs/reference/numeric-types/> | `SIMD`, `DType`, `Scalar`, numeric types. |
| Types | <https://mojolang.org/docs/reference/types/> | The built-in types. |
| Operators | <https://mojolang.org/docs/reference/operators/> | Precedence and associativity. |
| Docstrings | <https://mojolang.org/docs/reference/docstrings/> | Placement, summary, sections. |
| Decorators | <https://mojolang.org/docs/reference/decorators/> | Every built-in decorator. |
| Inline MLIR | <https://mojolang.org/docs/reference/inline-mlir/> | Hardware intrinsics and atomics. |
| Cheat sheets | <https://mojolang.org/docs/reference/cheat-sheets/> | Downloadable quick-reference cards (image/PDF). |

## Tools and CLI

| Purpose | URL | What is there |
|---------|-----|---------------|
| CLI overview | <https://mojolang.org/docs/cli/> | The `mojo` command. |
| `mojo build` | <https://mojolang.org/docs/cli/build/> | Build an executable. |
| `mojo run` | <https://mojolang.org/docs/cli/run/> | Compile and execute; flags. |
| `mojo format` | <https://mojolang.org/docs/cli/format/> | The formatter. |
| `mojo repl` | <https://mojolang.org/docs/cli/repl/> | The REPL. |
| `mojo doc` | <https://mojolang.org/docs/cli/doc/> | Compile docstrings. |
| `mojo precompile` | <https://mojolang.org/docs/cli/precompile/> | Precompile a package. |
| `mojo debug` | <https://mojolang.org/docs/cli/debug/> | The debugger. |
| `mojo demangle` | <https://mojolang.org/docs/cli/demangle/> | Demangle a name. |
| Testing | <https://mojolang.org/docs/tools/testing/> | `TestSuite` and assertions. |
| Debugging | <https://mojolang.org/docs/tools/debugging/> | LLDB and profiling. |
| Compilation targets | <https://mojolang.org/docs/tools/compilation/> | Cross-compilation and targets. |
| Feature toggles | <https://mojolang.org/docs/tools/feature-toggles/> | `-D` toggles and `debug_assert`. |
| Notebooks | <https://mojolang.org/docs/tools/notebooks/> | Jupyter and Colab. |
| Packaging | <https://mojolang.org/docs/tools/packaging/> | Distributing a project. |
| AI skills | <https://mojolang.org/docs/tools/skills/> | Official agent skills for Mojo. |
| Pixi | <https://mojolang.org/docs/pixi/> | The Prefix.dev environment CLI. |

## Install, stability and versions

| Purpose | URL | What is there |
|---------|-----|---------------|
| Install | <https://mojolang.org/install/> | `uv`, pixi, conda, pip. |
| System requirements | <https://mojolang.org/docs/requirements/> | OS, CPU, RAM, GPU, Python versions. |
| API doc reading guide | <https://mojolang.org/docs/api-docs/> | How to read signatures. |
| Stability guarantees | <https://mojolang.org/docs/api-docs/stability/> | What is stable and what is not. |
| Current releases | <https://mojolang.org/releases/> | The current channel. |
| Release archive | <https://mojolang.org/releases/archive/> | Every past release. |
| Mojo 1.0.0 | <https://mojolang.org/releases/v1.0.0/> | The 1.0 release notes. |
| Nightly | <https://mojolang.org/releases/nightly/> | Unstable builds. |

## Source and community (for facts about licensing and contribution)

| Purpose | URL | What is there |
|---------|-----|---------------|
| Source repository | <https://github.com/modular/modular> | The compiler, tooling and stdlib under Apache 2.0 with LLVM Exceptions. |
| License | <https://github.com/modular/modular/blob/main/LICENSE> | The license text. |
| Community packages | <https://mojolang.org/packages/> | Community package index. |
| Vision and motivation | <https://mojolang.org/docs/vision/> | The history and design bets. |

The source repository is listed here only for facts about licensing, open
sourcing and the contribution process. It is **not** a substitute for the
language documentation. Source:
<https://github.com/modular/modular>.

## A note on currency

Mojo moves every six weeks on the stable channel, with nightlies in between:

> "We aim to produce stable releases every six weeks, and nightly builds almost
> every night."

Source: <https://mojolang.org/docs/faq/>. When you return to these pages after a
release, re-read the release notes first
(<https://mojolang.org/releases/>), then the language reference page for anything
the release changed. The rule this buch follows for its own content is recorded
in [`versions/index`](../versions/index.md).

> **Open question:** the cheat sheets are published as image, SVG, PNG and PDF
> downloads rather than as text, so their exact contents cannot be quoted offline
> or diffed across releases. The text cheat sheet in
> [`appendix/cheat-sheet`](cheat-sheet.md) is this buch's own, built from the
> reference pages. Source:
> <https://mojolang.org/docs/reference/cheat-sheets/>.

## Sources

- Mojo documentation index (`llms.txt`): <https://mojolang.org/llms.txt>
- Mojo FAQ (release cadence): <https://mojolang.org/docs/faq/>
- Mojo cheat sheets (download-only note): <https://mojolang.org/docs/reference/cheat-sheets/>
- Mojo source repository: <https://github.com/modular/modular>
