# Design goals

[What Mojo is](what-is-mojo.md) describes the language you get. This page
explains the principles that produced it. Everything here is drawn from the two
official documents that state the goals: the [Mojo vision](https://mojolang.org/docs/vision/)
and the [Mojo roadmap](https://mojolang.org/docs/roadmap/). For the work plan
that follows from these goals, see [Roadmap](roadmap.md).

## The vision, in one paragraph

Mojo exists to make heterogenous hardware programmable through one language:

> "Our vision is to unify this fragmented software stack with the one
> programming language developers can use to target all the diverse hardware—
> CPUs, GPUs, custom accelerators, ASICs, and more. Mojo is already able to
> target CPUs and GPUs from different vendors, making it the first language
> built for the AI era, but to be the one systems programming language for all
> hardware, there's a lot of work left to do."
> — <https://mojolang.org/docs/vision/>

The vision document calls itself "a 'directional' vision, not an engineering
plan", and the roadmap calls itself "**directional guidance** (not an
engineering plan)" and "**subject to change**". Treat these pages as the binding
statement of intent, not as a schedule.

Mojo's role inside Modular's mission ("democratize AI compute") is expressed as
two goals:

> - "**Unite developers** across domains, skill levels, and backgrounds by
>   solving the complexity of juggling Python, C++, Rust, CUDA, and more (the
>   'N language problem')."
> - "**Unify hardware** by giving developers a consistent set of tools to access
>   the capabilities of any hardware—CPUs, GPUs, custom accelerators, ASICs, and
>   more."
> — <https://mojolang.org/docs/vision/>

## The performance / programmability trade-off

The single sentence that defines how Mojo is meant to be adopted:

> "It should be easy to start using Mojo, and then incrementally adopt features
> that deliver more performance and scale beyond CPUs into other hardware."
> — <https://mojolang.org/docs/vision/>

Two claims are packed into that sentence, and both matter for how you should
write Mojo:

1. **Easy to start.** Simple code should compile and run without requiring the
   full systems-programming machinery. You do not need to hand-write ownership,
   manual allocation, or accelerator code to write a working program.
2. **Incremental adoption.** The higher-performance features are additive on top
   of the simple form. You opt into them where they pay off, rather than paying
   for them everywhere.

The same idea appears on the roadmap as an architectural principle: "Mojo should
'just work' for core programming tasks, while offering the control systems
programmers expect" (<https://mojolang.org/docs/roadmap/>). The practical
reading for an author or agent is that a Mojo page should show the simple form
first, then the performance form — not the other way around.

## The non-negotiable performance bar

Unlike the "easy to start" goal, this one is absolute:

> "Achieving our mission to unify hardware development means Mojo must deliver
> the full performance potential of any given accelerator."
> — <https://mojolang.org/docs/vision/>

The vision explains why that requires a language rather than a library: modern
accelerators "have features like Tensor Cores, systolic arrays, dedicated
convolutional units, explicit memory hierarchies, memory transfer accelerators,
and a variety of exotic and rapidly evolving data types like float6." These are
not expressible as an afterthought on top of a CPU language.

The roadmap records that the initial performance target — high-performance CPU
and accelerator coding — is the content of **Phase 1**, which was wrapped up,
and that "performance alone isn't enough". So performance is the bar, not the
whole design.

## Why build a new language instead of extending C++ or Rust

The vision document evaluates exactly three options and rejects the first two:

1. **Extend an existing language like C++, Rust, Julia, Swift.** Pro: an
   existing implementation and community. Con: "None of these languages support
   the hardware features we need—they were designed for CPUs. They are also all
   10+ years old, don't provide the modern metaprogramming features we need, and
   weren't designed to support hardware features required for AI (such as
   float6)."
2. **Create an embedded DSL for a language like Python or C++.** Pro:
   "This is comparatively easy to implement." Con: "The tooling, UX, and
   predictability of these systems are very problematic and they are limited by
   the base language syntax. This is particularly problematic if you're trying
   to introduce fundamental new concepts because you can't change the grammar of
   Python or C++."
3. **Build an entirely new programming language from scratch.** Pro: "You get
   full control to create the best quality result." Con: "This is extremely
   expensive and difficult to do."

The verdict:

> "We ruled out the first two options because they're insufficient for achieving
> the full scope of our vision."
> — <https://mojolang.org/docs/vision/>

Pitfall for readers: "Mojo is a Python/C++ extension" is a common but wrong
framing. Mojo is a **new language** that interoperates with Python and C; it is
not a dialect of either. The Python and C++ interoperability features are
bridges, not the foundation.

## The four stated design principles

The vision calls these "the high-level design principles that guide Mojo's
development" (<https://mojolang.org/docs/vision/>). Each one has a concrete
consequence you can observe in the language.

### 1. Member of the Python family

Mojo "adopts Python's syntax and should feel familiar to Python developers."
The rationale: Python is the dominant AI language, with a clean and readable
syntax, a small core, powerful metaprogramming, and a role as "universal
superglue" across language boundaries. Mojo therefore "supports the core
features Python programmers instinctively reach for—`if`/`for` statements, lists,
dictionaries, etc.—so it's easy to migrate code."

But the limit is stated in the same paragraph:

> "Mojo will support more Python features over time, but our primary focus is on
> building features that unlock high-performance, portable compute—not on
> quickly achieving surface-level Python compatibility."
> — <https://mojolang.org/docs/vision/>

Consequence: Python-family syntax is a deliberate ergonomics choice, not a
commitment to accept arbitrary Python. See "What Mojo is not" in
[What Mojo is](what-is-mojo.md).

### 2. Scalable AI kernel development

Mojo should "overcome the fundamental scalability limitations that plague
traditional kernel libraries and ML compilers, and become a unified language for
kernel development." The vision lists what that requires: "zero-cost
abstractions, knobs that can be tuned for optimal hardware performance, a
library-first design, and metaprogramming to allow specialization for particular
hardware."

The stated failure modes being answered are: kernel libraries that "become hard
to manage as systems grow", and ML compilers that "lack the generality needed
for diverse tasks like data loading, preprocessing, dynamic shapes, and
sparsity".

Consequence: metaprogramming (compile-time parameters, `comptime`, traits) is
not an advanced appendix in Mojo — it is the mechanism that makes one kernel
work across shapes, dtypes and targets. It is core to the design.

### 3. A modern systems programming language

> "Mojo includes systems programming constructs such as static typing, memory
> management control, and predictable performance semantics. It draws on lessons
> from languages like Swift, C++, Rust, and Zig—and goes beyond them by embracing
> new techniques that allow Mojo to support the wide range of hardware that AI
> developers must face today and in the future."
> — <https://mojolang.org/docs/vision/>

The reason given is that accelerators "are essentially high-performance embedded
systems": "you don't want to upload megabytes of code just to run a matrix
multiplication, and you can't afford implicit performance overhead in inner
loops." Hence static typing, explicit mutability, ownership with ASAP
destruction, and no garbage collector.

### 4. Managing language complexity

Every growing language faces scope-creep pressure. The vision names the failure
mode — C++'s complexity spiral, a "tragedy of the commons" where each feature is
justified by a use case but all users suffer the aggregate — and the model to
emulate: "Other languages like Go pride themselves on maintaining simplicity and
saying 'no' to proposals that don't benefit long-term goals."

The six stated strategies:

1. **Use Mojo heavily** — Modular is Mojo's largest user and maintains "the
   world's largest Mojo codebase (which is open source)", so priorities are
   guided by real-world usability and performance.
2. **Align with Python wherever possible** — "If Python already supports a
   feature, we adopt its design rather than inventing something new. Any
   deviation from Python requires a strong, mission-driven justification."
3. **Adopt proven ideas from modern languages** — for static types, traits,
   metaprogramming, "we draw from languages like Rust, Swift, and Zig rather
   than create novel and untested solutions."
4. **Innovate only when necessary** — "Where existing designs fall short—such as
   ergonomics in Rust or compile-time error messages in Zig—we aim beyond them
   to meet Mojo's goals."
5. **Emphasize composability and simplicity** — "Every Mojo feature must work
   reliably in all situations and combine seamlessly with other features
   (compose orthogonally). We're not satisfied with features that work 80% of
   the time but fail in some cases."
6. **Defer syntactic sugar** — "we prioritize core 'big rocks' first. Only once
   the fundamentals are solid do we revisit syntactic enhancements."

The vision adds a caveat that also applies to this whole page: "These are
guiding principles, not a rigid recipe."

## The explicit anti-goal: not feature-for-feature with Rust or C++

The roadmap's Phase 2 introduces application-level programming "the kinds of
problems that languages like Rust and C++ typically address" — and immediately
bounds it:

> "we are not aiming to match Rust or C++ feature-for-feature. Our goal is to
> keep Mojo a relatively small and teachable language—one that solves specific
> problems while maintaining a focus on composability and simplicity."
> — <https://mojolang.org/docs/roadmap/>

This is a design **anti-goal**, and it changes how you should evaluate a Mojo
feature: the right question is not "does Rust/C++ have it?" but "does this solve
a specific problem while staying composable and simple?" The roadmap reinforces
the same restraint throughout — the Phase 1 non-goals were "syntax sugar",
"untyped Python-style code" and "Python library parity", and the Phase 2
language work is a short, named list rather than a wish list.

## Secondary goals: expressiveness, error messages, compile times

Performance is the bar, but the roadmap says performance alone is not enough:

> "We're equally focused on:
> - **Expressiveness** for building robust libraries
> - **Good error messages** for developer productivity
> - **Fast compile times** to support iteration speed."
> — <https://mojolang.org/docs/roadmap/>

These are not slogans; they are recurring themes across both documents:

- **Expressiveness** is why Mojo has traits, parameterized types, and a
  metaprogramming system instead of raw codegen.
- **Good error messages** motivated the parameter system: the vision promises
  "better error messages, faster compile times, more expressiveness, and a
  smoother developer experience" than C++ templates. The roadmap lists "Error
  messages and diagnostics" and specifically "parameter inference and elaborator
  errors" as continuous investments.
- **Fast compile times** motivated the architecture: Mojo is built on MLIR Core,
  and its compiler framework (historically code-named **KGEN**, "kernel
  generator") represents parametric code "before instantiation", which the
  vision says "enables a host of benefits: faster compile times, clearer error
  messages, and support for compiling the same source code to multiple target
  devices."

## Architectural bets behind the goals

The vision describes three technologies Mojo's architecture is built on, after
"nearly a year prototyping and validating this approach through deep compiler
research and development":

1. **Powerful parametric metaprogramming** — the bet that accelerator stacks
   share enough macro-architecture that the work to support a new chip should be
   proportional to *how different* it is. Mojo took "the ideas behind C++
   templates (compile-time polymorphism and specialization) and built something
   dramatically more usable".
2. **MLIR Core** — Mojo is "built purely on top of MLIR Core" (not the
   higher-level `linalg`/`affine`/`scf` dialects), and "acts as syntactic sugar
   for MLIR", so Mojo code can express dialect operations without modifying the
   Mojo compiler.
3. **MAX framework integration** — Mojo builds an MLIR representation of kernel
   code before instantiation, so the MAX graph compiler "can reflect over the
   kernel to understand the inputs and outputs, and transform the kernel's IR
   directly", enabling graph-level optimizations such as kernel fusion.

A reader does not need these details to write Mojo, but they explain why the
language has the features it has — for example, why compile-time parameters are
central rather than an add-on.

## Sources

- <https://mojolang.org/docs/vision/>
- <https://mojolang.org/docs/roadmap/>
