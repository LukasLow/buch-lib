# Roadmap

> **Note — the roadmap changes.** The official roadmap is "directional guidance
> (not an engineering plan)" and is "subject to change", and its status markers
> may be out of date. This page mirrors the official roadmap at
> <https://mojolang.org/docs/roadmap/> as of **2026-09-15**, the date the
> content in this buch was last verified. When the upstream page changes,
> re-read it and update this page.

This page records where the language is going and, just as important, **where it
is right now**. [Design goals](design-goals.md) explains the principles behind
the plan; [What Mojo is](what-is-mojo.md) describes the current language;
[Versions](../versions/index.md) records what has already shipped.

## What the roadmap is — and is not

The roadmap opens by bounding itself:

> "This page provides a high-level roadmap of how we expect the Mojo programming
> language to evolve over a series of phases. It offers **directional guidance**
> (not an engineering plan) and is **subject to change**. As we build, learn,
> and expand Mojo's use cases, we'll iterate, adapt, and invest wherever
> necessary to unblock priorities."
> — <https://mojolang.org/docs/roadmap/>

Two structural notes from the same page:

- The "phases" are "conceptual groups of work—not version numbers—and they have
  no timeline for completion. Mojo now has versioned releases, but these phases
  remain roadmap categories rather than release commitments."
- Status markers: "An empty box ⬜ indicates work that's **not started**, a
  barricade 🚧 is for work **in progress**, and a checked box ✅ means it's
  **done**." The roadmap warns this is "isn't an exhaustive list of work, and
  the status might be out of date", that items are not ordered by priority, and
  that some are "nice to have" rather than required.

Read it as **intent and current status**, never as a release schedule.

## The north star: a general-purpose language

The roadmap restates the goal from the [vision](design-goals.md) and makes the
scope explicit:

> "Our approach is to keep short-term development focused and anchored on
> measurable outcomes, while building for generality so Mojo can eventually
> become a general-purpose language spanning CPUs, GPUs, and other hardware,
> addressing a myriad of applications."
> — <https://mojolang.org/docs/roadmap/>

The FAQ says the same in user terms: "Mojo's initial focus was to solve AI
programmability challenges. However, our goal is to grow Mojo into a
general-purpose programming language." (<https://mojolang.org/docs/faq/>)

There is an explicit anti-goal attached to that ambition, repeated here because
it shapes every prioritization decision:

> "we are not aiming to match Rust or C++ feature-for-feature. Our goal is to
> keep Mojo a relatively small and teachable language—one that solves specific
> problems while maintaining a focus on composability and simplicity."
> — <https://mojolang.org/docs/roadmap/>

## The phases at a glance

The roadmap lists four phases plus continuous investments. The table summarizes
the official structure; the sections below add the detail an agent needs.

| Phase | Name | Status / theme |
|-------|------|----------------|
| Phase 0 | Initial bring-up | Done. Parser, memory types, functions, structs, initializers, argument conventions. |
| Phase 1 | High-performance CPU + accelerator coding | Done; ended with open-sourcing the Mojo compiler. Kernel development, metaprogramming, Python interop, ergonomics. |
| Phase 2 | Systems application programming | Current phase. Application-level programming: language features, memory-safety model, ecosystem. |
| Phase 3 | Dynamic object-oriented programming | Not started. Untyped variables, classes, inheritance. |
| — | Continuous investments | Ongoing: error messages, compile times, standard library cleanup, hardware support. |

### Phase 0: Initial bring-up

Foundational work: "implementing the core parser, defining memory types,
functions, structs, initializers, argument conventions, and more." The roadmap
also records a lesson that explains 1.0's consolidation work: "As development
accelerated, multiple libraries emerged to fill immediate needs, often
overlapping in functionality (for example, multiple pointer types). As the
language stabilized, we consolidated these libraries into a coherent and
consistent foundation."

That consolidation is exactly what you see in the 1.0.0 release notes (one name
per concept, `Pointer` unification, `size` → `length`). See
[Versions: 1.0.0](../versions/index.md).

### Phase 1: High-performance CPU + accelerator coding

Phase 1 "took Mojo from a 'prototype kernel DSL' to a viable foundation for
systems programming and accelerated compute workloads", making it "a powerful
and expressive language for writing high-performance kernels on CPUs, GPUs, and
ASICs". The roadmap adds the three secondary goals quoted in
[Design goals](design-goals.md): expressiveness, good error messages, fast
compile times.

The completed checklists are the origin of many language features now considered
core:

- **Parameterized types and metaprogramming** — the parameter system, the
  compile-time interpreter, `comptime if`/`for` loops, traits, trait
  compositions, default trait methods, parametric `raises`, closure refinement,
  `where` clauses, conditional conformance. All ✅.
- **Python interoperability** — build integration and Python export. ✅.
- **Core language usability** — functions, structs, control flow, literals and
  comprehensions, collections (`List`, `Dict`, `Iterator`, `SIMD`, `String`),
  pointers, variadic args, lambda syntax, explicitly destroyed (linear) types,
  stabilization markers. ✅.
- **Syntax and surface polish** — argument conventions refined ✅, literal
  refinements ✅, attribute macros 🚧. The attribute-macro item explains the
  deprecations in 1.0: "Replaced ad-hoc constructs like `@parameter`, `@value`,
  etc., using traits and other existing language features (shrinking the
  language), but there's still more work to do here."
- **Toolchain** 🚧 — LSP, VS Code extension, testing/benchmarking
  infrastructure, LLDB debugger exist, "but there's much more to do in phase 2."

Phase 1 had three explicit **non-goals**, worth knowing because they explain
what Mojo deliberately lacks:

> - "**Syntax sugar**: We deferred most sugar until the core language was stable
>   and composable."
> - "**Untyped Python-style code**: For now, Mojo requires explicit
>   `PythonObject` type annotations."
> - "**Python library parity**: We've focused on getting our core language and
>   library abstractions right, rather than expanding coverage."
> — <https://mojolang.org/docs/roadmap/>

### Phase 2: Systems application programming (current)

> "Now that the core parameterized type system and systems programming features
> have converged and stabilized, we'll begin expanding Mojo to support
> application-level programming—the kinds of problems that languages like Rust
> and C++ typically address."
> — <https://mojolang.org/docs/roadmap/>

The theme is "*deepening* our core investment in systems programming and
heterogeneous hardware, while *broadening* our ecosystem by supporting new use
cases, from servers and networking code to microcontrollers and robotics."

The Phase 2 work items are grouped as follows (all still open unless noted).
**Language features** ⬜: first-class `async` support "fully integrated with
Mojo's type and memory models", existentials/dynamic traits, richer metatypes,
struct extensions, algebraic data types and pattern matching, dynamic
reflection, initial distributed programming support, and access-control
features such as `private` modifiers.

**Memory safety model** ⬜: "Mojo code should be memory-safe by default, while
still being fast, expressive, and gradually more complex for beginners." Phase 2
is expected to require finalizing internal origins ("Providing memory-safe
references to values held in collections") and supporting mutable aliasing.
Note the roadmap's own framing that in phase 1 "some situations still aren't
safe by default" — do not assume 1.x is fully memory-safe by default.

**Broadening the ecosystem** ⬜/🚧: expand platform support, keep improving
interop, packaging and package management, and a stable and robust toolchain.
The toolchain sub-items are LSP/VS Code extension 🚧, testing framework 🚧,
benchmarking framework 🚧, debugger 🚧, profiler ⬜.

### Phase 3: Dynamic object-oriented programming

> "Eventually, we want Mojo to support the core dynamic features that make
> Python great, including untyped variables, classes, inheritance, etc. We have
> some thoughts about how these features will compose with the language's other
> features, but defer detailed planning and scoping until the earlier phases are
> done."
> — <https://mojolang.org/docs/roadmap/>

This is where the Python-superset question is answered, and the answer is
deliberately open: "Mojo may or may not evolve into a full superset of Python,
and it's okay if it doesn't."

### Continuous investments

Four topics "remain in progress throughout Mojo's lifetime and aren't tied to
any specific phase":

- **Error messages and diagnostics** — "parameter inference and elaborator
  errors need particular attention."
- **Compile times** — "continue pushing for faster developer iteration cycles."
- **Standard library cleanup** — "API consolidation, regularization, and new
  capabilities."
- **Hardware support** — "Extending Mojo's backend to support new architectures."

## Where Mojo is right now (honest status)

A reader without internet access needs the current state, not just the plan.

### Release status

- **Current stable release: 1.0.0**, released **2026-08-11** (package version
  `mojo==1.0.0`). (<https://mojolang.org/releases/>)
- **Nightly channel** exists and is ahead of stable. At the time this buch was
  verified, the nightly was `mojo==1.1.0.dev2026091005` (2026-09-10).
- **Cadence:** "We aim to produce stable releases every six weeks, and nightly
  builds almost every night." (<https://mojolang.org/docs/faq/>)
- **Older versions are no longer available to install.**
  (<https://mojolang.org/releases/>) This is why the buch's
  [versions chapter](../versions/index.md) exists instead of per-version
  installs.

### What 1.x means for change

1.0 began the stability policy, so the roadmap's "subject to change" is bounded
by the release commitment:

> "With Mojo 1.0 we're beginning to define the stability policies for the Mojo
> language and standard library. During the 1.x timeframe, changes should mostly
> be additive. We may still make breaking changes, but they'll be managed with
> care."
> — <https://mojolang.org/releases/v1.0.0/>

> "Starting with Mojo 1.0, Mojo follows semantic versioning for the core
> language and stable portions of the standard library."
> — <https://mojolang.org/docs/faq/>

In practice, for code written against 1.x: **expect additions, not removals.**
Breaking changes are possible but "managed with care", and — as the 1.0 notes
state — "nearly every breaking change ships with a deprecated alias and a
compiler fix-it, so migration is mechanical." Language features are stable by
default; standard library APIs are unstable unless explicitly marked stable, and
the initial stable set is deliberately small. See
[Stability](stability.md) and [Versions: 1.0.0](../versions/index.md) for the
full model and the complete change list.

### Open-source status

Mojo is open source under the Apache License v2.0 with LLVM Exceptions:

> "Mojo is open source under the Apache License v2.0 with LLVM Exceptions."
> — <https://mojolang.org/docs/faq/>

The official announcement that the compiler and toolchain were open-sourced is
"Mojo🔥 is now open source!" (Modular, 2026-08-18):

> "We are happy to announce that the Mojo🔥 language is now fully open source
> under [the Apache 2.0 license (with LLVM exceptions)]! The source code for the
> Mojo compiler, tooling, and everything else you need to build the language are
> now available in [our] [`modular` GitHub repository]."
> — <https://www.modular.com/blog/mojo-open-source>

The repository README summarizes what is now public: "Mojo compiler:
[/Mojo]", "Mojo standard library: [/Mojo/stdlib]", plus MAX components.
(<https://github.com/modular/modular>)

### Contribution status: compiler contributions are not accepted yet

The repository and contributor guides are explicit that the compiler is public
but **not yet accepting outside contributions**:

> "We accept contributions to the Mojo standard library, MAX accelerator
> library, MAX model architectures, code examples, Mojo docs, and more. We
> aren't accepting contributions to the Mojo compiler yet."
> — <https://github.com/modular/modular>

The compiler contributor guide repeats it with a date:

> "As of September, 2026, we're not accepting contributions to the Mojo
> compiler, but for the latest status, see contribution areas."
> — <https://github.com/modular/modular/blob/main/Mojo/docs/contributing/compiler/README.md>

The open-source announcement states the intended timeline:

> "We aim to accept contributions to the compiler and tooling by the end of this
> year, and we'll share more details when we can."
> — <https://www.modular.com/blog/mojo-open-source>

> **Open question:** the "by the end of this year" target for accepting compiler
> contributions comes from the open-source announcement linked above. The
> mojolang.org documentation and the contributor guides confirm only the
> *current* state ("we aren't accepting contributions to the Mojo compiler
> yet", dated "As of September, 2026") and do not repeat a target date. Treat
> the end-of-2026 target as an announcement, not a documentation commitment, and
> re-check the [contribution areas page](https://github.com/modular/modular/blob/main/Mojo/docs/contributing/contribution-areas.md)
> before relying on it.

The official roadmap's own "Contributing to Mojo" section adds: "Mojo is fully
open source on GitHub, and we're accepting contributions in several areas,
including the standard library and docs. We aren't yet accepting contributions
to the Mojo compiler, but we're working on putting the appropriate tools and
workflows in place."

So the honest status is: **source is public, compiler PRs are not accepted at
the time of writing, and the announced target for opening them is the end of
2026.** For standard-library and docs contributions, the formal process —
issue first, then PR — is documented in the Mojo contributor guide.
(<https://github.com/modular/modular/blob/main/Mojo/docs/contributing/README.md>)

## How to use this page

- To decide whether a feature exists **today**, read the current chapter for its
  topic, not the roadmap. The roadmap marks the *direction*; a ✅ on the roadmap
  means the work landed, but the authoritative syntax is always the content
  pages of this buch.
- To decide whether an unimplemented feature is worth waiting for, check its
  phase and status marker here.
- To find out what changed in a release you are coming from, read
  [Versions](../versions/index.md).

## Sources

- <https://mojolang.org/docs/roadmap/>
- <https://mojolang.org/docs/vision/>
- <https://mojolang.org/docs/faq/>
- <https://mojolang.org/releases/v1.0.0/>
- <https://mojolang.org/releases/>
- <https://mojolang.org/docs/api-docs/stability/>
- <https://github.com/modular/modular>
- <https://github.com/modular/modular/blob/main/Mojo/docs/contributing/README.md>
- <https://github.com/modular/modular/blob/main/Mojo/docs/contributing/compiler/README.md>
- <https://github.com/modular/modular/blob/main/Mojo/docs/contributing/contribution-areas.md>
- <https://www.modular.com/blog/mojo-open-source>
