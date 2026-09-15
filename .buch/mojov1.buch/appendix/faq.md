# FAQ

Plain question-and-answer form, for an offline reader. Every answer comes from
the official Mojo FAQ (<https://mojolang.org/docs/faq/>) unless another official
source is cited. Where the official FAQ is silent, that is marked as an open
question instead of guessed.

## What is Mojo for?

**Why was Mojo built?** To solve an internal challenge when building the Modular
Platform — programming across the whole stack was too complicated. The goal was
"a flexible and scalable programming model that could target CPUs, GPUs, AI
accelerators, and other heterogeneous systems that are pervasive in the AI
field", with "powerful compile-time metaprogramming, integration of adaptive
compilation techniques, caching throughout the compilation flow". The current
focus is "to unify CPU and GPU programming with blazing-fast execution for the
Modular Platform", and "the north star is for Mojo to support the whole gamut of
general-purpose programming over time."

Source: <https://mojolang.org/docs/faq/>.

**Is Mojo only for AI, or can I use it for other things?** Mojo's initial focus
was AI programmability, but the goal "is to grow Mojo into a general-purpose
programming language." The FAQ lists "HPC, data transformations, writing
pre/post processing operations, libraries, and much more."

Source: <https://mojolang.org/docs/faq/>.

**Why is it called Mojo?** "Mojo means 'a magical charm' or 'magical powers.'"

Source: <https://mojolang.org/docs/faq/>.

**Who are the docs aimed at?** Not beginners. The basics page states plainly:

> "Mojo is a young language that's still evolving. As such, Mojo is currently
> **not** meant for beginners. Even this basics section assumes some programming
> experience. However, throughout the Mojo Manual, we try not to assume
> experience with any particular language."

Source: <https://mojolang.org/docs/manual/basics/>.

## Is Mojo interpreted or compiled?

**Compiled, ahead of time.** "Mojo is a compiled language. `mojo build` and
`mojo run` both perform ahead-of-time (AOT) compilation."

Source: <https://mojolang.org/docs/faq/>. There is no general-purpose JIT for
ordinary Mojo programs; the documented runtime-compilation surface is the
`compile` standard-library package. Source:
<https://mojolang.org/docs/std/compile/>.

## Is Mojo a Python superset?

**No.** Mojo adopts Python's syntax and aims to feel familiar, but it is not a
superset in practice. The vision page calls Mojo a "Member of the Python family"
and is careful about the boundary: "Mojo adopts Python's syntax and should feel
familiar to Python developers", but "our primary focus is on building features
that unlock high-performance, portable compute—not on quickly achieving
surface-level Python compatibility."

Source: <https://mojolang.org/docs/vision/>.

The Python-to-Mojo guide is explicit: "Mojo is designed with Python programmers
in mind, but it isn't 'just Python, only faster.' Mojo introduces a type system,
ownership-aware semantics, and low-level control." It is "statically typed",
"compiles to machine code", "prefers value semantics and explicit mutability",
and has "ownership ... without a garbage collector or reference counting."

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

See [comparison to Python](comparison-to-python.md) for the full table.

## Is Mojo open source?

**Yes.** "Mojo is open source under the Apache License v2.0 with LLVM
Exceptions." The compiler, tooling and standard library are in the upstream
repository at <https://github.com/modular/modular>.

Source: <https://mojolang.org/docs/faq/>.

**Why wasn't it developed in the open from the beginning?** The FAQ says the
intent was always to open source it, but it began privately: "Mojo is a big
project and has several architectural differences from previous languages. We
believe a tight-knit group of engineers with a common vision can move faster than
a community effort."

Source: <https://mojolang.org/docs/faq/>.

> **Open question:** the official FAQ does not state a date for accepting
> compiler/tooling contributions. The upstream repository is the authority on
> current contribution policy; do not assume an open contribution process.

## How does Mojo install?

**Through any Python or Conda package manager.** "You can get Mojo and all the
developer tools by installing `mojo` with any Python or Conda package manager."
The install page names `uv pip install mojo` and `pixi add mojo` (and conda).

Sources: <https://mojolang.org/docs/faq/> and <https://mojolang.org/install/>.

**What is included?** Two packages:

| Package | Contains |
|---------|----------|
| `mojo` | The `mojo` CLI (compiler), standard library, the `mojo` Python package, the LSP, the debugger (LLDB), the formatter, and the REPL. |
| `mojo-compiler` | A smaller package: the `mojo` CLI, standard library, and the `mojo` Python package — for production or when Python calls existing Mojo code. |

For GPU programming, "install the `max` package, which includes the MAX
framework and Mojo."

Source: <https://mojolang.org/docs/faq/>.

**Which platforms are supported?** "Mojo supports Mac and Linux natively and
supports Windows via WSL." The requirements page gives the specifics: macOS 15+
on Apple silicon, Linux glibc ≥ 2.34, Windows via WSL, an x86-64-v3 or ARM64
Neoverse N1+ CPU, 8 GiB RAM, and optional GPUs (NVIDIA driver 580+, AMD ROCm
6.3.3+, Apple Metal). Python interop requires Python 3.10–3.14.

Sources: <https://mojolang.org/docs/faq/> and
<https://mojolang.org/docs/requirements/>.

**Is there IDE integration?** Yes — an official Mojo extension for VS Code and
compatible editors, "including syntax highlighting, code completion, formatting,
hover, etc.", available from the VS Code Marketplace and Open VSX.

Source: <https://mojolang.org/docs/faq/>.

**Does the SDK collect telemetry?** Yes, limited to crash reports and LSP
performance metrics. "We never collect or transmit any user information, such as
source code, keystrokes, or any other user data." The FAQ notes that v25.6 and
earlier also collected compiler/runtime events, since removed.

Source: <https://mojolang.org/docs/faq/>.

## What are the license terms?

"The Mojo SDK is licensed under the Apache License v2.0 with LLVM Exceptions."
The repository is at <https://github.com/modular/modular>, with the license at
<https://github.com/modular/modular/blob/main/LICENSE>.

Source: <https://mojolang.org/docs/faq/>.

## How does versioning work?

**Semantic versioning, starting with 1.0.** "Starting with Mojo 1.0, Mojo follows
semantic versioning for the core language and stable portions of the standard
library."

Two asymmetry rules matter:

- "We consider language features stable unless we explicitly identify them as
  experimental or unstable."
- "We consider standard library APIs **unstable** unless we explicitly identify
  them as stable. The API documentation identifies the stable APIs."

Sources: <https://mojolang.org/docs/faq/> and
<https://mojolang.org/docs/api-docs/stability/>.

**How often are releases?** "We aim to produce stable releases every six weeks,
and nightly builds almost every night."

Source: <https://mojolang.org/docs/faq/>.

**Is there ABI stability?** No. Stability guarantees are source-only, and the
stability page states it directly: "Stability guarantees apply to source code
only; the Mojo ABI is currently not stable."

Source: <https://mojolang.org/docs/api-docs/stability/>.

## How do I convert Python to Mojo?

Use the official tips page: "See Tips for Python devs for a quick primer on
important differences between Python and Mojo." The FAQ also points at the Mojo
AI skills to help an AI assistant translate, and at building Mojo bindings for
Python to migrate parts of a project.

Source: <https://mojolang.org/docs/faq/>. In this buch, see
[migration from Python](../interop/migration-from-python.md) and the
[comparison table](comparison-to-python.md).

## Interop with other languages?

**C and C++.** "Mojo code is interoperable with C code." The FAQ points at the
`ffi` module, the `@export` decorator, and the `abi("C")` function effect. "Mojo
code is also interoperable with C++ code that uses `extern \"C\"`."

Source: <https://mojolang.org/docs/faq/>. See
[calling C from Mojo](../interop/calling-c.md).

**Python, both directions.** Call Python from Mojo, and bind Mojo for Python.
Sources: <https://mojolang.org/docs/faq/> and
<https://mojolang.org/docs/manual/python/>.

## Distributed execution?

**Not alone.** "Mojo is one component of the Modular Platform ... but you'll also
need a runtime (or 'OS') that supports graph-level transformations and
heterogeneous compute, which the MAX framework provides."

Source: <https://mojolang.org/docs/faq/>.

## Performance benchmarks?

**No language-level benchmark numbers are published.** The FAQ says: "Remember
that we designed Mojo as a general-purpose programming language, and any
AI-related benchmarks rely heavily upon other framework components." The FAQ
links vendor blog posts for framework performance, not for the language itself.

Source: <https://mojolang.org/docs/faq/>. For what actually makes Mojo code fast
(and when it is not), see [performance idioms](../idioms/performance-idioms.md).

## Where can I ask questions or give feedback?

The FAQ says to read the roadmap first "which provides important information
about our current priorities", then use the community page
(<https://mojolang.org/community/>). It names a Discord channel and a newsletter
for release notifications.

Source: <https://mojolang.org/docs/faq/>.

## How does hardware lowering work?

"Mojo leverages LLVM-level dialects for the hardware targets it supports, and it
uses other MLIR-based code-generation backends where applicable. This also means
that Mojo is easily extensible to any hardware backend." The FAQ expects
"hardware vendors and community members to contribute additional hardware
support in the future."

Source: <https://mojolang.org/docs/faq/>.

## Quick answer table

| Question | Short answer |
|----------|--------------|
| What is it for? | AI/accelerator programming now; general purpose over time |
| Interpreted or compiled? | Compiled, AOT |
| Python superset? | No |
| Open source? | Yes, Apache 2.0 with LLVM Exceptions |
| How to install? | `uv pip install mojo`, pixi, conda, pip |
| What's in the SDK? | `mojo` (full) or `mojo-compiler` (minimal); `max` for GPU |
| Platforms? | macOS 15+ (Apple silicon), Linux glibc ≥ 2.34, Windows via WSL |
| Versioning? | SemVer since 1.0; language stable by default, stdlib unstable by default |
| ABI stable? | No; source-only guarantees |
| Aimed at beginners? | No; assumes programming experience |

Sources: <https://mojolang.org/docs/faq/>,
<https://mojolang.org/docs/manual/basics/>,
<https://mojolang.org/docs/api-docs/stability/> and
<https://mojolang.org/install/>.

## Open questions

> **Open question:** the FAQ does not commit to when Mojo will fully support
> general-purpose programming, when Python-style classes will arrive, or when
> the compiler/tooling contribution process opens. The roadmap is the place to
> check current priorities: <https://mojolang.org/docs/roadmap/>.

> **Open question:** the FAQ's `@export`/`abi("C")` guidance predates the 1.0
> form where `@export` should carry an explicit `abi("C")` effect; the 1.0.0
> notes record the missing-`abi` warning. Treat `abi("C")` as current. Sources:
> <https://mojolang.org/docs/faq/> and
> <https://mojolang.org/releases/v1.0.0/>.

## Sources

- Mojo FAQ: <https://mojolang.org/docs/faq/>
- Mojo language basics (audience): <https://mojolang.org/docs/manual/basics/>
- Mojo vision (Python family): <https://mojolang.org/docs/vision/>
- Mojo roadmap: <https://mojolang.org/docs/roadmap/>
- Mojo installation guide: <https://mojolang.org/install/>
- Mojo system requirements: <https://mojolang.org/docs/requirements/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo standard library `compile` package: <https://mojolang.org/docs/std/compile/>
- Mojo Python interop: <https://mojolang.org/docs/manual/python/>
- Mojo tips for Python devs: <https://mojolang.org/docs/manual/python-to-mojo/>
- Mojo source repository: <https://github.com/modular/modular>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
