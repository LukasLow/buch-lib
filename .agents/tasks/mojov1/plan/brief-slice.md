# Sourced raw material — Mojo 1.x book, slice 1 (Task-ID: plang-buch)

Source rules applied: only official mojolang.org pages (manual, language reference,
keywords reference, stdlib index, release notes, install, requirements, llms*.txt
indexes). No blogs, no StackOverflow, no wikis, no recollection. Mojo 1.0.0 was
released 2026-08-11. Pre-1.0 documentation is used **only** for version history and
migration tables, never to describe current behaviour. All pages fetched 2026-09-15.

Navigation indexes (all self-describe as "Version: 1.0.0"):
- https://mojolang.org/llms.txt
- https://mojolang.org/llms-manual.txt
- https://mojolang.org/llms-reference.txt

---

## intro/what-is-mojo.md

- Mojo is a **compiled** language: "Mojo is a compiled language. [`mojo build`](/docs/cli/build/) and [`mojo run`](/docs/cli/run/) both perform ahead-of-time (AOT) compilation." (https://mojolang.org/docs/faq/)
- It is **not** "just Python, only faster" — exact official phrasing: "Mojo is designed with Python programmers in mind, but it isn't \"just Python, only faster.\" Mojo introduces a type system, ownership-aware semantics, and low-level control that, as a Python developer, you may not have had to reason about to make your code work." (https://mojolang.org/docs/manual/python-to-mojo/)
- "Mojo looks like Python but its execution model is closer to Rust, Swift, C++, and other systems languages." (https://mojolang.org/docs/manual/python-to-mojo/)
- **Statically typed**: "Mojo is statically typed. In Python, types are optional hints that the interpreter _mostly_ ignores at runtime. In Mojo, types are first-class. The compiler uses them to generate fast, specialized machine code." Also: "Mojo variables are statically typed: that is, Mojo sets a variable's type at compile time, and the type doesn't change at runtime." (https://mojolang.org/docs/manual/python-to-mojo/ , https://mojolang.org/docs/manual/basics/)
- **Compiled to machine code**: "Mojo compiles to machine code. Python runs through an interpreter ... Mojo compiles directly to native machine code. This gives you fast and predictable performance, with no interpreter overhead." (https://mojolang.org/docs/manual/python-to-mojo/)
- **Value semantics + explicit mutability**: "Mojo prefers _value semantics_ and explicit mutability. In Python, most objects are mutable references ... In Mojo, assigning or passing a value typically creates an independent copy. Changes to one value don't affect others unless you make sharing explicit." And: "All variables in Mojo are mutable by default. Their value can change." (https://mojolang.org/docs/manual/python-to-mojo/ , https://mojolang.org/docs/manual/variables/)
- Value semantics is a *default*, not a mandate: "Mojo doesn't enforce value semantics or reference semantics. It supports them both and allows each type to define how it is created, copied, and moved (if at all). ... That said, Mojo is designed with argument behaviors that default to value semantics." (https://mojolang.org/docs/manual/values/value-semantics/)
- **Ownership without GC/refcounting**: "Mojo supports modern ownership, but it doesn't trap you in \"safe-only\" abstractions. With ownership, the compiler tracks which variables and fields control a value's lifetime. That lets Mojo manage memory effectively, without a garbage collector or reference counting." (https://mojolang.org/docs/manual/python-to-mojo/)
- Ownership rules: "Every value has only one owner at a time." / "When the lifetime of the owner ends, Mojo destroys the value." / "If there are existing references to a value, Mojo extends the lifetime of the owner." (https://mojolang.org/docs/manual/values/ownership/)
- **ASAP destruction**: "Mojo uses ownership semantics with ASAP (\"as soon as possible\") destruction. The compiler knows exactly when a value is used for the last time and its lifetime ends. Memory is freed at that point, without waiting for a garbage collector to run." Also: "It destroys values using an \"as soon as possible\" (ASAP) destruction policy that runs after every sub-expression. Even within an expression like `a+b+c+d`, Mojo destroys the intermediate values as soon as they're no longer needed." (https://mojolang.org/docs/manual/python-to-mojo/ , https://mojolang.org/docs/manual/lifecycle/death/)
- **Who it is for**: "We use Mojo at Modular to develop AI algorithms and GPU kernels, but you can use it for other things like HPC, data transformations, writing pre/post processing operations, libraries, and much more." And: "our goal is to grow Mojo into a general-purpose programming language." (https://mojolang.org/docs/faq/)
- **Not for beginners (yet), by the docs' own statement**: "Mojo is a young language that's still [evolving](/docs/roadmap/). As such, Mojo is currently **not** meant for beginners. Even this basics section assumes some programming experience." (https://mojolang.org/docs/manual/basics/)
- **Not a Python superset in practice**: "Mojo may or may not evolve into a full superset of Python, and it's okay if it doesn't." And on Python parity focus: "our primary focus is on building features that unlock high-performance, portable compute—not on quickly achieving surface-level Python compatibility." (https://mojolang.org/docs/roadmap/ , https://mojolang.org/docs/vision/)
- Structs are static, not Python classes: "Mojo structs are completely static—the compiler binds them at compile time, so they don't allow dynamic dispatch or any runtime changes to the structure. (Mojo will also support Python-style classes in the future.)" Also: "Mojo structs are stack-allocated." (https://mojolang.org/docs/manual/basics/ , https://mojolang.org/docs/manual/python-to-mojo/)
- Python interop exists but is optional: "Mojo supports the ability to import Python modules as-is, so you can leverage existing Python code right away." (https://mojolang.org/docs/manual/basics/)

---

## intro/design-goals.md

- Vision statement: "Our vision is to unify this fragmented software stack with the one programming language developers can use to target all the diverse hardware—CPUs, GPUs, custom accelerators, ASICs, and more." Also: "Mojo is already able to target CPUs and GPUs from different vendors, making it the first language built for the AI era, but to be the one systems programming language for all hardware, there's a lot of work left to do." (https://mojolang.org/docs/vision/)
- The **performance/programmability trade-off**, official phrasing: "It should be easy to start using Mojo, and then incrementally adopt features that deliver more performance and scale beyond CPUs into other hardware." (https://mojolang.org/docs/vision/)
- Rationale for building from scratch: "We ruled out the first two options because they're insufficient for achieving the full scope of our vision." (Extending C++/Rust/Julia/Swift, or an embedded DSL.) (https://mojolang.org/docs/vision/)
- Four stated design principles: "Member of the Python family", "Scalable AI kernel development", "A modern systems programming language", "Managing language complexity". (https://mojolang.org/docs/vision/)
- Python family, but not at the cost of performance: "Mojo adopts Python's syntax and should feel familiar to Python developers ... Mojo will support more Python features over time, but our primary focus is on building features that unlock high-performance, portable compute—not on quickly achieving surface-level Python compatibility." (https://mojolang.org/docs/vision/)
- Kernel scalability goal: Mojo should "overcome the fundamental scalability limitations that plague traditional kernel libraries and ML compilers, and become a unified language for kernel development." Includes "zero-cost abstractions, knobs that can be tuned for optimal hardware performance, a library-first design, and metaprogramming to allow specialization for particular hardware." (https://mojolang.org/docs/vision/)
- Systems-language requirement: "Mojo includes systems programming constructs such as static typing, memory management control, and predictable performance semantics. It draws on lessons from languages like Swift, C++, Rust, and Zig." (https://mojolang.org/docs/vision/)
- Complexity control: "We aim to control complexity through a few specific strategies" — including "Align with Python wherever possible" and "Innovate only when necessary". (https://mojolang.org/docs/vision/)
- Stated roadmap goal, explicit anti-goal: "we are not aiming to match Rust or C++ feature-for-feature. Our goal is to keep Mojo a relatively small and teachable language—one that solves specific problems while maintaining a focus on composability and simplicity." (https://mojolang.org/docs/roadmap/)
- The non-negotiable performance bar: "Mojo must deliver the full performance potential of any given accelerator." (https://mojolang.org/docs/vision/)
- Secondary goals alongside performance: "We're equally focused on: Expressiveness for building robust libraries / Good error messages for developer productivity / Fast compile times to support iteration speed." (https://mojolang.org/docs/roadmap/)
- Mission framing: Mojo "plays a key role in Modular's mission to democratize AI compute"; goals are to "Unite developers" and "Unify hardware". (https://mojolang.org/docs/vision/)
- FAQ statement of scope ambition: "Mojo's initial focus was to solve AI programmability challenges. However, our goal is to grow Mojo into a general-purpose programming language." (https://mojolang.org/docs/faq/)

---

## intro/install.md

- Official one-liner: "Mojo installs exactly like a Python or Conda package on macOS and Linux (see the [system requirements](/docs/requirements/))." (https://mojolang.org/install/)
- **uv path**: `uv pip install mojo`; or `uv init hello-world` / `cd hello-world` / `uv add mojo`. (https://mojolang.org/install/)
- **pixi/conda path**: `pixi init hello-world \ -c https://conda.modular.com/max/ -c conda-forge` / `cd hello-world` / `pixi add mojo`. (https://mojolang.org/install/)
- **Nightly channel** (stable docs point to it): pixi `-c https://conda.modular.com/max-nightly/`; uv index `https://whl.modular.com/nightly/simple/` with `--prerelease allow`. (https://mojolang.org/nightly/install/)
- Package manager statement (FAQ): "You can get Mojo and all the developer tools by installing `mojo` with any Python or Conda package manager." (https://mojolang.org/docs/faq/)
- **Two packages** — exact contents, FAQ: "We actually offer two Mojo packages: `mojo` and `mojo-compiler`."
  - `mojo` includes: "mojo CLI (includes the Mojo compiler)"; "Mojo standard library"; "mojo Python package"; "Mojo language server (LSP) for IDE/editor integration"; "Mojo debugger (includes LLDB)"; "Mojo code formatter"; "Mojo REPL". (https://mojolang.org/docs/faq/)
  - `mojo-compiler` "is smaller and is useful for environments where you only need to call or build existing Mojo code ... situations where you don't need the LSP and debugger tools." It includes: "mojo CLI (includes the Mojo compiler)"; "Mojo standard library"; "mojo Python package". (https://mojolang.org/docs/faq/)
- **GPU install**: "If you're interested in GPU programming, install the `max` package, which includes the MAX framework and Mojo." (https://mojolang.org/docs/faq/)
- Notebook/Colab install repeats plain `pip install max` (stable) or `pip install --pre max --extra-index-url https://whl.modular.com/nightly/simple/` (nightly), and notes "the `mojo` package is all you need" for most notebook work. (https://mojolang.org/docs/tools/notebooks/)
- **`max[all]` is NOT documented on mojolang.org**: the 1.0.0 install page, FAQ and notebooks page never show an extras form. Do not teach `max[all]` from these sources — see Gaps.
- **`modular` package retirement — only partially documented**:
  - Historical statement (v25.5, 2025-08-05): "To use Python to Mojo interoperability in v25.5, you must install the `modular` package. This will move to the `mojo` package in a future release." (https://mojolang.org/releases/v0.25.5/)
  - Current 1.0.0 FAQ names only `mojo` and `mojo-compiler`; the `modular` package is no longer listed as a Mojo install (https://mojolang.org/docs/faq/).
  - But a current 1.0.0 manual page still says: "install the `mojo` package—or, if you're developing for the MAX framework, install the `modular` package, which includes the `mojo` package." (https://mojolang.org/docs/tools/debugging/, in llms-manual.txt; https://mojolang.org/docs/tools/debugging/). See Gaps.
- License: "The Mojo SDK is licensed under the Apache License v2.0 with LLVM Exceptions." / "Mojo is open source under the Apache License v2.0 with LLVM Exceptions." (https://mojolang.org/docs/faq/)
- Post-install tooling: VS Code extension (Marketplace / Open VSX) and agent skills via `npx skills add modular/skills`. (https://mojolang.org/install/)
- Packaging of third-party packages: "You can install and distribute Mojo packages as conda packages," via the `modular-community` conda channel; community packages declare a `mojo-compiler=1.0.0`-style requirement. (https://mojolang.org/packages/)

---

## intro/stability.md

- Versioning model: "The Mojo language and standard library follow semantic versioning for language features and standard library APIs identified as stable." Major/minor/patch rules: "Major versions (1.0, 2.0) can contain breaking changes that aren't backward-compatible." / "Minor versions (1.1, 1.2) can add new functionality in a backward-compatible way." / "Patch versions (1.0.1, 1.2.1) can contain bug fixes that are backward-compatible." (https://mojolang.org/docs/api-docs/stability/)
- **Source-only stability, no ABI stability**: "Stability guarantees apply to source code only; the Mojo ABI is currently not stable." (https://mojolang.org/docs/api-docs/stability/)
- "Unstable features can change at any point." / "We may make exceptions to the stability policy if we discover a critical issue with a stabilized API." (https://mojolang.org/docs/api-docs/stability/)
- **Stdlib default is unstable**: "We consider standard library APIs unstable unless specifically marked stable. In source code, the `@stable(since="<version>")` decorator marks these APIs." (https://mojolang.org/docs/api-docs/stability/)
- **Struct stability is signature-only**: "Marking a struct stable means that the struct's *signature* is stable. It **doesn't** guarantee that any member APIs are stable. We stabilize member APIs on a case-by-case basis." (https://mojolang.org/docs/api-docs/stability/)
- Two documented exceptions where stable APIs may change: overload sets ("The exact overload set may evolve, but it will continue to support the same inputs.") and adding new optional parameters with backward-compatible defaults (can break code that unbinds with `...`). (https://mojolang.org/docs/api-docs/stability/)
- **Language default is stable**: "We consider language features stable unless we explicitly identify them as experimental or unstable." / "A wide part of the Mojo language is stable. Most language constructs, including control flow, types, and ownership, are stable. As a rule, Mojo's lifetime and operator dunders such as `__add__()`, `__init__()`, and `__deinit__()` are stable." (https://mojolang.org/docs/faq/ , https://mojolang.org/docs/api-docs/stability/)
- Language internals can't be marked: "Unlike standard library APIs, these language features *can't be marked* as stable or unstable and the compiler won't warn when you use them (`--warn-on-unstable-apis`)." Examples of unsafe prefixed keywords: `__mlir_type`, `__mlir_op`, `__mlir_attr`, `__generator_type`. (https://mojolang.org/docs/api-docs/stability/)
- **`--warn-on-unstable-apis` current state**: "When you invoke Mojo with the `--warn-on-unstable-apis` flag, it issues a warning for each unstable API you use. We don't currently recommend this because the stable API set is small." (https://mojolang.org/docs/api-docs/stability/)
- **1.x promise**: "During the 1.x timeframe, changes should mostly be additive. We may still make breaking changes, but they'll be managed with care." Also: "we've *started* marking standard library APIs as stable, beginning with a deliberately small set that we'll grow in subsequent releases." (https://mojolang.org/releases/v1.0.0/)
- Page self-caveat (quote it when writing the chapter): "This is an early and preliminary version of our stability discussion. We'll update this page as we finalize the Mojo 1.x stability model." (https://mojolang.org/docs/api-docs/stability/)
- **`async`/`await` is unstable**: "Mojo's async system isn't fully built out. So although the `async` and `await` keywords aren't prefixed, consider them unstable as well. Any async behavior may be subject to change." (https://mojolang.org/docs/api-docs/stability/)
- First stable set (1.0.0): "The `Deinitable`, `Movable`, `Copyable`, and `ImplicitlyCopyable` traits, which are stable in their entirety"; plus `Array` (formerly `InlineArray`), `List`, `Span`, `String`, `Bool`, `Optional` (one or more stable APIs each). (https://mojolang.org/releases/v1.0.0/)
- Internal-use decorators to avoid: `@parameter`, `@__copy_capture`, `@__allow_legacy_custom_self_types`, `@__name`, `@__llvm_arg_metadata`, `@__unsafe_nested_origins_read_only`; "Consider any decorators beginning with `@__` as internal and unstable, unless the manual explicitly documents them as public." (https://mojolang.org/docs/api-docs/stability/)

---

## intro/version-history.md

Release index (canonical list of versions, dates and package versions):
https://mojolang.org/releases/ and https://mojolang.org/releases/archive/

Era 1 — 2023: pre-1.0 0.x line.
- Archive lists 2023 releases as `Mojo v0.6.1`, `v0.6.0`, `v0.5.0`, `v0.4.0 for Mac`, `v0.4.0`, `v0.3.1`, `v0.3.0`, `v0.2.1`, plus monthly pages `Mojo August 2023` … `Mojo January 2023`, and 2022 monthly pages back to September 2022. Example date: "Mojo v0.6.1 — December 18, 2023". (https://mojolang.org/releases/archive/ , https://mojolang.org/releases/v0.6.1/)
- The `0.7.0` release is dated "January 25, 2024" and is listed under **2024** in the archive (the last `0.x` before the scheme switch). (https://mojolang.org/releases/v0.7.0/ , https://mojolang.org/releases/archive/)

Era 2 — 2024-02-29: `24.1`, bundled with MAX, CalVer.
- "Mojo v24.1 — February 29, 2024". Official wording: "Mojo is now bundled with [the MAX platform]! As such, the Mojo package version now matches the MAX version, which follows a `YY.MAJOR.MINOR` version scheme. Because this is our first release in 2024, that makes this version `24.1`." (https://mojolang.org/releases/v0.24.1/)
- Archive URL slugs for this era keep the `v0.` prefix while the displayed name has none: `Mojo v24.6` (2024), `Mojo v25.5`, `Mojo v25.4` … `Mojo v25.1` (2025). (https://mojolang.org/releases/archive/)
- Example 2024→2025 transition: `Mojo v0.25.5` is displayed as "Mojo v25.5 — August 5, 2025". (https://mojolang.org/releases/v0.25.5/)

Era 3 — 2025-09-22: the `0.` prefix returns on PyPI.
- "Mojo v0.25.6 — September 22, 2025" with the heading "Version scheme change!": "This release is technically a version *downgrade* because we've added a `0.` at the beginning: `0.25.6`. This is necessary because we started publishing `mojo` packages on pypi.org and it's important that we don't publish a package greater than 1.0 yet." (https://mojolang.org/releases/v0.25.6/)
- **Channel ambiguity, exact official wording**: "Shortly after the 0.25.6 release, we \"yanked\" all Conda packages that are greater than 1.0 so they won't be installed unless you explicitly specify the version. So you'll still get the latest version like this: `pixi add mojo`. And if you want an older version, just specify the version like this: `pixi add \"mojo==25.5\"`. However, if you're installing `mojo` as a Python package with `pip` or `uv`, the oldest version available is `0.25.6`." (https://mojolang.org/releases/v0.25.6/)
- Also from v0.25.6 tooling notes: "In preparation for a future Mojo 1.0, the `mojo` and `mojo-compiler` packages have a `0.` prefixed to the version." (https://mojolang.org/releases/v0.25.6/)
- Subsequent 0.x releases with dates and package versions (from the releases index): `mojo==0.25.6.0` (Sep 22, 2025), `mojo==0.25.7.0` (Nov 20, 2025), `mojo==0.26.1.0` (Jan 29, 2026), `mojo==0.26.2.0` (Mar 19, 2026). (https://mojolang.org/releases/)

Era 4 — 2026: 1.0.0 and semantic versioning.
- Betas: `Mojo v1.0.0b1` (May 7, 2026, `mojo==1.0.0b1`), `Mojo v1.0.0b2` (Jun 18, 2026, `mojo==1.0.0b2`). (https://mojolang.org/releases/ , https://mojolang.org/releases/v1.0.0b1/ , https://mojolang.org/releases/v1.0.0b2/)
- **Mojo v1.0.0 — August 11, 2026**, package version `mojo==1.0.0`. (https://mojolang.org/releases/v1.0.0/ , https://mojolang.org/releases/)
- Semver era statement: "Starting with Mojo 1.0, Mojo follows semantic versioning for the core language and stable portions of the standard library." (https://mojolang.org/docs/faq/)
- Stability framing for 1.0: "With Mojo 1.0 we're beginning to define the stability policies for the Mojo language and standard library. During the 1.x timeframe, changes should mostly be additive." (https://mojolang.org/releases/v1.0.0/)
- Current nightly at time of fetch: "Mojo nightly — Sep 10, 2026 — `mojo==1.1.0.dev2026091005`". (https://mojolang.org/releases/)
- Note: "Older versions are no longer available to install." (https://mojolang.org/releases/)

**Six-week stable cadence** (release cadence statement, official wording):
"Mojo development is moving fast and we are regularly releasing updates. We aim to produce stable releases every six weeks, and nightly builds almost every night." (https://mojolang.org/docs/faq/)

Dates that corroborate the cadence (all from https://mojolang.org/releases/):
- 2025: v25.4 → v25.5 (Aug 5) → v0.25.6 (Sep 22) → v0.25.7 (Nov 20)
- 2026: v0.26.1 (Jan 29) → v0.26.2 (Mar 19) → v1.0.0b1 (May 7) → v1.0.0b2 (Jun 18) → v1.0.0 (Aug 11)

---

## intro/supported-platforms.md

Source: https://mojolang.org/docs/requirements/ (all bullets below unless noted).

- Summary line: "Mojo runs on Mac, Linux, and Windows (with WSL). You don't need a GPU to program with Mojo—GPU support is optional."
- **Operating system**
  - Linux: "glibc 2.34 or later (for example, Ubuntu 22.04 LTS or later)." Note box: "Modular tests Mojo on Ubuntu 22.04 LTS or later. Other Linux distributions that meet the glibc 2.34+ requirement are expected to work but aren't continuously tested."
  - macOS: "macOS Sequoia (15) or later." + "Apple silicon (M1–M5 processor)."
  - Windows: "Mojo doesn't natively support Windows. You can use Mojo on Windows with WSL using a compatible version of Ubuntu (see the Linux requirements)."
- **CPU**: "x86-64-v3 (Haswell-class or newer; CPUs from approximately 2013 onward) or ARM64 Neoverse N1 or newer (for example, AWS Graviton2 and later) on Linux; Apple silicon on macOS."
  - Detail box: "The x86-64-v3 microarchitecture level requires AVX, AVX2, BMI1, BMI2, F16C, FMA, LZCNT, MOVBE, and XSAVE instructions. To verify your x86-64 CPU on Linux, run `cat /proc/cpuinfo ...` and confirm those flags are present. This requirement doesn't apply to ARM64 or Apple silicon hosts."
- **RAM**: "8 GiB minimum for Mojo development. MAX inference and model serving require significantly more memory, with the exact amount varying by model."
- **Software**: "A C compiler (such as `cc`, `gcc`, or `clang`) on Linux—used as a linker." / "Xcode or Xcode Command Line Tools 16 or later on macOS."
- **GPU compatibility model (two levels)**: "Continuously tested: Run in Modular's CI on every release." / "Known compatible: Confirmed to work by Modular or community members, but not continuously tested. These GPUs share an architecture with a tested GPU and should work without issues."
- **NVIDIA**: driver "580 or later" (check with `nvidia-smi`). Older drivers: set `MODULAR_NVPTX_COMPILER_PATH` to a system `ptxas`. Continuously tested: B200 (`sm_100`). Known compatible includes B300 (`sm_103`), B100, DGX Spark (`sm_121`), H200/H100 (`sm_90`), L4/L40 (`sm_89`), RTX 50XX (`sm_120`), RTX 40XX, A100 (`sm_80`), A10/A1000/RTX 30XX (`sm_86`), Jetson Orin (`sm_87`), Jetson Thor (`sm_110`), T4/RTX 20XX (`sm_75`). Pre-Turing GPUs "are not supported out of the box."
- **AMD**: "AMD GPU driver 6.3.3 or later (MI355X requires ROCm 7.0 or later)". Continuously tested: MI355X (`gfx950`), MI300X (`gfx942`). Known compatible: MI325X, MI250X (`gfx90a`), Radeon RX 9070/9060 (`gfx1201`/`gfx1200`), 880M/890M (`gfx1150`), 860M (`gfx1152`), 8060S (`gfx1151`), RX 7900/7800/7700/7600, 780M, RX 6900 (`gfx1030`), Van Gogh / Steam Deck (`gfx1033`).
- **Apple silicon GPUs**: "macOS Sequoia (15) or later" + "Xcode 16 or later" + possibly `xcodebuild -downloadComponent MetalToolchain`. Hardware support level for M5, M4, M3, M2, M1 is "Known compatible" (none listed as continuously tested).
- GPU runtime detection order: NVIDIA loads `libcuda.so.1` and `libnvidia-ml.so.1`; AMD loads `libamdhip64.so`; Apple uses the Metal framework. "If Mojo can't load any of these libraries, it falls back to CPU execution."
- Verify path: `mojo build --target-accelerator=sm_90 my_kernel.mojo` and a `DeviceContext` check program.
- **Python requirement (interop only)**: "Mojo itself doesn't require Python. To use the Mojo ↔ Python interoperability features described in this section, you need Python 3.10–3.14." (https://mojolang.org/docs/manual/python/)
- Historical/interop note still relevant for Python 3.12: earlier docs mention `python>=3.10,<3.12` for one third-party package only — not a Mojo requirement. (https://mojolang.org/packages/)

---

## versions/1.0.0.md (MIGRATION PAGE — most important)

Primary source for everything in this section: **https://mojolang.org/releases/v1.0.0/** ("Mojo v1.0.0, August 11, 2026"), plus **https://mojolang.org/releases/v0.26.2/**, **https://mojolang.org/releases/v1.0.0b1/**, **https://mojolang.org/releases/v1.0.0b2/** for changes that landed in the betas feeding 1.0.

### (a) What 1.0.0 means versus 0.x

Official wording (https://mojolang.org/releases/v1.0.0/):
- "With Mojo 1.0 we're beginning to define the stability policies for the Mojo language and standard library. During the 1.x timeframe, changes should mostly be additive. We may still make breaking changes, but they'll be managed with care."
- "At this point, most core language features are stable, meaning they won't be removed or changed in ways that breaks source compatibility. And we've *started* marking standard library APIs as stable, beginning with a deliberately small set that we'll grow in subsequent releases."
- About the size of this migration: "We worked hard on getting names, defaults, and safety boundaries right for 1.0. That *does* mean you'll find more breaking changes than usual in this release. But nearly every breaking change ships with a deprecated alias and a compiler fix-it, so migration is mechanical."
- FAQ framing: "Starting with Mojo 1.0, Mojo follows semantic versioning for the core language and stable portions of the standard library." (https://mojolang.org/docs/faq/)

### (b) COMPLETE breaking-change / rename list (old → new)

Verbatim official wording for the headline list (https://mojolang.org/releases/v1.0.0/):
> "**One name, and one type, per concept**: this release consolidates vocabulary that had drifted. `size` becomes `length` throughout, `InlineArray` becomes `Array`, `StringSlice` becomes `StringSpan`, `ImplicitlyDestructible` becomes `Deinitable` with the destructor spelled `__deinit__()`, and `read` becomes `imm`. Duplicated *types* are consolidated too: `Int` is now an alias for `Scalar[DType.int]`, and the `Int`-based and `Scalar`-based `range()` types are unified into a single `dtype`-parameterized family."

> "**Explicit over implicit**: a number of inference rules and silent defaults now have to be written down. Declaring a variable without `var` is deprecated, a method's `self` must have type `Self`, and a bare `**kwargs` must be spelled `var **kwargs`. The import system has been overhauled to make name resolution explicit and consistent."

> "**Memory safety and pointer unification**: `Pointer` and `UnsafePointer` are unified into a single `Pointer` type, with unsafety now marked on the individual operation instead of on the type as a whole."

Strict old → new list (each line names its source URL):

1. `fn` → `def` — "`def` is now Mojo's standard function declaration keyword … `fn` is now deprecated and will be removed in a future release." Then: "The `fn` keyword for function declarations is deprecated. Mojo now emits a compiler warning on uses of `fn`; this will become a compilation error in the next release." (https://mojolang.org/releases/v0.26.2/ , https://mojolang.org/releases/v1.0.0b1/) Final state: "The legacy `fn` keyword now produces an error instead of a warning. Please move to `def`." (https://mojolang.org/releases/v1.0.0b2/)
1b. Semantics change that came with it: "`def` functions no longer implicitly raise and now have the same semantics as `fn`: non-raising by default, with explicit `raises` for functions that can throw." (https://mojolang.org/releases/v0.26.2/)
2. `read` → `imm` — "`imm` is now the preferred spelling for the `read` argument and closure-capture convention. `read` still works but will soon be deprecated." (https://mojolang.org/releases/v1.0.0/)
3. `InlineArray` → `Array` (and its parameters renamed) — "`InlineArray` has been renamed to `Array`, its first parameter from `ElementType` to `T`, and its second parameter from `size` to `length`. A temporary `InlineArray` comptime alias exists for adoption, and `.size` remains as a deprecated alias for `.length`. Update explicit `InlineArray[ElementType=..., size=N]` usages to `Array[T=..., length=N]`." (https://mojolang.org/releases/v1.0.0/)
4. `StringSlice` → `StringSpan` — "`StringSlice` has been renamed to `StringSpan`, matching other non-owning view types such as `Span`. `StringSlice` remains available as a `comptime` alias for the time being to ease transition to the new name." Also `MutStringSlice`/`ImmStringSlice` → `MutStringSpan`/`ImmStringSpan`. (https://mojolang.org/releases/v1.0.0/)
5. `size` → `length` (vocabulary-wide) — explicit pairs from the notes: `ComplexSIMD[..., size=N]` → `ComplexSIMD[..., length=N]`; `TypeList.size` → `TypeList.length`; `DeviceContextList[size=N]` → `DeviceContextArray[length=N]`; `List.resize(new_size=, value=)` → `List.resize(new_length=, fill=)`; `List.shrink(new_size=)` → `List.shrink(new_length=)`. Also `SIMD`'s second parameter, `SIMD[dtype, size=4]` (keyword form) → `length=`. (https://mojolang.org/releases/v1.0.0/)
6. `ImplicitlyDestructible` → `Deinitable` — "`ImplicitlyDestructible` has been renamed to `Deinitable`, for consistency with the `deinit` argument convention and the `__deinit__()` spelling of the destructor. Both `ImplicitlyDestructible` and the intermediate `ImplicitlyDeletable` spelling remain available as deprecated aliases." (https://mojolang.org/releases/v1.0.0/)
7. `__del__` → `__deinit__` — "The destructor dunder method should now be spelled `__deinit__()`, for naming parity with `__init__()`. The old `__del__()` spelling still works but now emits a deprecation warning with a fix-it to rename it." (https://mojolang.org/releases/v1.0.0/)
8. `Pointer` / `UnsafePointer` unification — "The `Pointer` and `UnsafePointer` types have been unified. The new unified `Pointer` type includes the functionality of `UnsafePointer`, with the unsafe operations prefixed with `unsafe_` or requiring an `unsafe_`-prefixed keyword argument. The `UnsafePointer` name and the unprefixed unsafe operations are deprecated." Alias renames: `UnsafePointer` → `Pointer`; `MutUnsafePointer` → `MutPointer`; `ImmUnsafePointer`, `ImmutUnsafePointer` → `ImmPointer`; `OptionalUnsafePointer` → `OptionalPointer`; `Pointer`'s `type` parameter → `T`. (https://mojolang.org/releases/v1.0.0/)
8b. Operation renames (same page): `[i]` → `[unsafe_offset=i]`; `ptr + i` → `unsafe_offset(i)`; `load()` → `unsafe_load()`; `store()` → `unsafe_store()`; `strided_load()` → `unsafe_strided_load()`; `strided_store()` → `unsafe_strided_store()`; `gather()` → `unsafe_gather()`; `scatter()` → `unsafe_scatter()`; `as_noalias()` → `unsafe_as_noalias()`; `address_space_cast()` → `unsafe_address_space_cast()`; `mut_cast()` → `unsafe_mut_cast()`; `take_pointee()` → `unsafe_take_pointee()`; `init_pointee_move()` → `unsafe_write(value^)`; `init_pointee_copy()` → `unsafe_write(copy=value)`; `destroy_pointee()` → `unsafe_deinit_pointee()`; `destroy_pointee_with()` → `unsafe_deinit_pointee(closure)`; `init_pointee_move_from()` → `unsafe_write_move_from(src)`; `free()` → `unsafe_free()` (with the note "Allocation should migrate to the layout-aware `memory.alloc` package"). (https://mojolang.org/releases/v1.0.0/)
8c. Further pointer renames: `as_immutable()`, `get_immutable()` → `as_imm()`; `OwnedPointer.take()` → `OwnedPointer.into_inner()`; `StaticConstantOrigin` → `ImmStaticOrigin`; `AddressSpace` moved from `std.memory.pointer` to `std.memory.address_space`; `OwnedPointer.steal_data()` / `ArcPointer.steal_data()` / `List.steal_data()` → `unsafe_take_allocation()`; `is_trivially_destructible()` → `is_trivially_deletable()`. (https://mojolang.org/releases/v1.0.0/)
9. Implicit var-less declaration deprecated — "All variable declarations should use `var`. Implicit variable declarations are deprecated, and now warn with a fix-it that inserts `var`: `x = 0  # implicit declaration of 'x' is deprecated; add 'var' before the name`". (https://mojolang.org/releases/v1.0.0/)
10. Import system overhaul — "The import system has been overhauled to make name resolution explicit and consistent", with these sub-changes: resolution order "source packages, then precompiled `.mojoc` files, then source modules, then legacy precompiled `.mojopkg` files"; "Relative imports must use `from` (`from . import foo`); the `import .foo` form no longer works."; "Absolute imports `import a.b.c` now bind all of `a`, `a.b`, and `a.b.c` into the scope"; "An imported package's submodules are now only accessible when the package's `__init__.mojo` re-exports them"; "Intra-package accesses without explicit `import`s are deprecated"; a standalone module "can no longer import its own name"; importing same-named functions from different modules into one overload set "is now deprecated and emits a warning"; "Wildcard imports now resolve latest first, textually". (https://mojolang.org/releases/v1.0.0/) Follow-up in b2: "Implicit `std` imports are now an error, following a period of deprecation. Imports from the standard library must now be fully qualified." (https://mojolang.org/releases/v1.0.0b2/)
11. `Int` = `Scalar[DType.int]` — "`Int` is now an alias for `Scalar[DType.int]` and integer literals materialize to this `Scalar` type. Because of this, some conversions have become stricter." (https://mojolang.org/releases/v1.0.0/) Predecessor: "The `UInt` struct has been replaced by a type alias to `Scalar[DType.uint]`" (https://mojolang.org/releases/v0.26.1/).
12. Keyword variadics `**kwargs` → `var **kwargs` — "A bare `**kwargs` is now an error; write `var **kwargs` (a fix-it inserts it) in function declarations and function types alike. `var` was already the only supported convention—the sole exception to arguments defaulting to `imm`, applied silently before—so semantics are unchanged." (https://mojolang.org/releases/v1.0.0/)
13. `Copyable` vs `ImplicitlyCopyable` (the split landed in 0.25.6 and is now fundamental) — "The way copying is modeled in Mojo has been overhauled. The `Copyable` trait has been updated to represent a type that can be *explicitly* copied (using a `copy()` method), and a new `ImplicitlyCopyable` \"marker\" trait can be used to *opt-in* to making a type implicitly copyable as well. **This swaps the default behavior from being implicitly copyable to being only explicitly copyable.**" (https://mojolang.org/releases/v0.25.6/) 1.0 addition: "`Array` no longer conforms to `ImplicitlyCopyable`, since it is not inherently cheap to copy. It continues to conform to `Copyable`." (https://mojolang.org/releases/v1.0.0/)
14. Interior origins (new experimental feature) — "a new experimental feature known as *interior origins* lets `List`, `Dict`, `String`, and several other types return element references bound to an interior origin, so code that holds an element reference across a mutation is rejected instead of silently dangling after a reallocation." Adopters listed: `List`, `Deque`, `Variant`, `String`, `Dict`, `LinkedList`, `OwnedPointer`, `HostBuffer`. (https://mojolang.org/releases/v1.0.0/)
15. Negative indexing removal — "Support for negative indexes was removed in v1.0.0b1. The common \"all but the last element\" idiom must now spell the end index explicitly." Beta wording: "Negative indexing has been removed from all stdlib collections … Using a negative `IntLiteral` for indexing now triggers a compile-time error: `constraint failed: negative indexing is not supported, use e.g. \`x[len(x) - 1]\` instead`". Also `List.insert()` and `LinkedList.insert()` "no longer normalize negative indices … the valid index range is now `[0, len(self)]`". (https://mojolang.org/releases/v1.0.0/ , https://mojolang.org/releases/v1.0.0b1/)
16. `Optional` is no longer an `Iterator` — "`Optional` no longer conforms to `Iterator`; it is now an `Iterable` collection of 0 or 1 elements. `for value in opt` and `for value in opt^` are unchanged, but code that used an `Optional` directly as an iterator (for example, calling `next()` on it) no longer compiles and should iterate the `Optional` instead." (https://mojolang.org/releases/v1.0.0/)
17. Method `self` typing — "Method `self` parameters must now have type `Self`; switch a custom `self` type to a `where` clause." (https://mojolang.org/releases/v1.0.0/)
18. Overloads on convention alone rejected — "Mojo now rejects function overloads that differ only in argument convention (`imm` vs `mut`), as the compiler doesn't allow resolving overloads based on this." (https://mojolang.org/releases/v1.0.0/)
19. Reserved words as function names — "You can no longer use predefined and reserved words (for example, `class`, `del`, `match`, `yield`) as the name of a free function. Doing so now errors at the declaration instead of silently producing a function that could never be called." (https://mojolang.org/releases/v1.0.0/)
20. `@explicit_destroy` semantics — "The `@explicit_destroy` decorator no longer opts a struct out of `Deinitable` conformance. Use `Deinitable where False` instead … Using `@explicit_destroy` without an error-string argument is now an error." (https://mojolang.org/releases/v1.0.0/)
21. Legacy closures deprecated — "Legacy closures, and the `@parameter` and `@__copy_constructor` decorators used to declare them, are deprecated and should not be used in new code. Use the newer closure syntax with capture lists, instead. Using these decorators **doesn't** currently generate a warning." (https://mojolang.org/releases/v1.0.0/)
22. Struct closure-trait conformance must be explicit — "User-written structs must now explicitly declare closure-trait conformance in their inheritance list … Previously, Mojo accepted a struct with a compatible `__call__()` implicitly (duck typing)." (https://mojolang.org/releases/v1.0.0/)
23. `where` inside parameter lists removed — "`where` clauses inside a parameter list (for example, `[x: Int where x > 0]`) are no longer supported, following a period of deprecation. Use a trailing `where` clause after the signature instead." (https://mojolang.org/releases/v1.0.0/)
24. Struct fields can't hide `UnsafeAnyOrigin` — "a field such as `var ptr: Pointer[Int, MutUnsafeAnyOrigin]` now errors." (https://mojolang.org/releases/v1.0.0/)
25. Newline rejection in statements — the compiler "now rejects newlines in the middle of certain statements", specifically between `def`/`struct`/`trait`/`comptime` and the identifier, between `async` and `def`, and anywhere inside an `import` statement. (https://mojolang.org/releases/v1.0.0/)
26. `size_of()` semantics changed — "`size_of()` now returns the allocation size: the store size rounded up to the type's alignment, which is the stride between adjacent elements of an array of that type." (https://mojolang.org/releases/v1.0.0/)
27. Slicing is now hard-failing instead of clamping — "`List`, `Span`, `String`, and `StringSpan` (formerly `StringSlice`) indexing with a contiguous (non-strided) slice now exits the program on an invalid slice instead of silently clamping it." (https://mojolang.org/releases/v1.0.0/)
28. String iteration yields graphemes — "Iterating over a `String`, `StringSpan`, or `StringLiteral` now yields grapheme clusters by default." (https://mojolang.org/releases/v1.0.0/)
29. `range()` reworked — non-numeric element types rejected at construction; one- and two-argument float ranges "are compile errors instead of infinite loops"; the `Int`-based and `Scalar`-based range types unified. (https://mojolang.org/releases/v1.0.0/)
30. Package moves Mojo → MAX — "Most standard library APIs related to accelerator programming have moved to a new `max` Mojo package", listing `std.benchmark.Bench.bench_multicontext` → `max.benchmark.bench_multicontext`; `std.benchmark.Bencher.iter_custom(DeviceContext)` → `max.benchmark.bencher_iter_custom`; `std.gpu.compute` → `max.gpu.compute`; `std.gpu.host` → `max.gpu.host`; `std.gpu.memory` → `max.gpu.memory`; `std.gpu.sync` → `max.gpu.sync`. Plus: "The `layout` package is now bundled with MAX instead of Mojo." (https://mojolang.org/releases/v1.0.0/)
31. `Int`/`UInt` no longer GPU-passable — "`Int` and `UInt` no longer conform to `DevicePassable` and can no longer be passed to GPU kernels … Use a fixed-width type such as `Int32` instead." (https://mojolang.org/releases/v1.0.0/)
32. Other 1.0 renames worth a line each: `OwnedKwargsDict` → `StringDict`; `Variant.take[T]()`/`unsafe_take[T]()` → `Variant.unwrap[T]()`/`unsafe_unwrap[T]()`; `Reflected.field_type[name]` → `Reflected.field[name]`; `List.capacity` (field) → `List.capacity()` (method); `Span`'s constructor arg `ptr=` → `unsafe_ptr=`; `Span` moved from `std.memory.span` to `std.collections.span`. (https://mojolang.org/releases/v1.0.0/)
33. Removals in 1.0: `DType.invalid`; positional indexing on `StringLiteral` (`literal[i]`); static `String.write()` methods; `trait_downcast_var()`. (https://mojolang.org/releases/v1.0.0/)
34. Changes that reached stable 1.0 only via the betas and must appear in the migration table: `__moveinit__()`/`__copyinit__()` → `__init__(out self, *, take: Self)` / `__init__(out self, *, copy: Self)` (with `take` later renamed to `move` in b2); `@register_passable` / `@register_passable("trivial")` → `RegisterPassable` / `TrivialRegisterPassable` traits; `@doc_private` → `@doc_hidden`; `owned` keyword removed (use `var` or `deinit`); `escaping` effect removed (use an explicit capture list); `constrained[cond, msg]()` → `comptime assert cond, msg`; `mojo package` → `mojo precompile`, `.mojopkg` → `.mojoc`; `Consistency` → `Ordering` (with `MONOTONIC` → `RELAXED`); `ExternalOrigin` → `UntrackedOrigin` and `AnyOrigin` → `UnsafeAnyOrigin`; `as_any_origin()` → `as_unsafe_any_origin()`. (https://mojolang.org/releases/v0.26.2/ , https://mojolang.org/releases/v1.0.0b1/ , https://mojolang.org/releases/v1.0.0b2/)

### (c) Which changes shipped with deprecated aliases and compiler fix-its

- General statement: "nearly every breaking change ships with a deprecated alias and a compiler fix-it, so migration is mechanical." (https://mojolang.org/releases/v1.0.0/)
- **Compiler fix-it** explicitly documented for:
  - `fn` → `def` (warning with fix-it in b1; error in b2). (https://mojolang.org/releases/v1.0.0b1/)
  - `__del__()` → `__deinit__()`: "now emits a deprecation warning with a fix-it to rename it." (https://mojolang.org/releases/v1.0.0/)
  - implicit var-less declaration: "warn with a fix-it that inserts `var`". (https://mojolang.org/releases/v1.0.0/)
  - bare `**kwargs` → `var **kwargs`: "a fix-it inserts it". (https://mojolang.org/releases/v1.0.0/)
  - `@__unavailable(use=symbol)` emits "a fix-it that renames the call to `symbol`". (https://mojolang.org/releases/v1.0.0b2/)
  - Fix-it infrastructure: `--experimental-fixit` applies parser fix-its automatically; `--experimental-export-fixit` exports them as YAML for `clang-apply-replacements`. (https://mojolang.org/releases/v0.26.1/ , https://mojolang.org/releases/v0.25.7/)
- **Deprecated aliases that keep old code compiling** (documented names):
  - `InlineArray` comptime alias; `.size` as deprecated alias for `.length`. (https://mojolang.org/releases/v1.0.0/)
  - `StringSlice` remains a `comptime` alias; `MutStringSlice`/`ImmStringSlice` remain compatibility aliases. (https://mojolang.org/releases/v1.0.0/)
  - `ImplicitlyDestructible` and `ImplicitlyDeletable` remain deprecated aliases. (https://mojolang.org/releases/v1.0.0/)
  - Unprefixed pointer operations "still work, but are now hidden from the generated docs and issue a deprecation warning when called." (https://mojolang.org/releases/v1.0.0/)
  - `Variant.take`/`unsafe_take` remain `@deprecated`; `List.steal_data()` and `OwnedPointer.steal_data()` remain `@deprecated` (`ArcPointer.steal_data()` was removed outright). (https://mojolang.org/releases/v1.0.0/)
  - `as_immutable()`, `get_immutable()`, `OwnedPointer.take()`, `StaticConstantOrigin` remain as deprecated aliases. (https://mojolang.org/releases/v1.0.0/)
  - `read` still works but will soon be deprecated. (https://mojolang.org/releases/v1.0.0/)
  - `SIMDSize` remains a deprecated alias for `SIMDLength`. (https://mojolang.org/releases/v1.0.0/)
  - Legacy `__moveinit__`/`__copyinit__` names accepted "for now", with arguments renamed to `take`/`copy`. (https://mojolang.org/releases/v0.26.2/)
- **Breaking changes with NO alias or fix-it** (migration must be manual): implicit `std` imports error (b2); negative indexing is a compile-time error (b1); method `self` must be `Self`; overloads on convention alone rejected; struct fields hiding `UnsafeAnyOrigin`; reserved words as free-function names; newline rejections; `DType.invalid` removed; `StringLiteral` positional indexing removed; static `String.write()` removed; `trait_downcast_var()` removed. (https://mojolang.org/releases/v1.0.0/ , https://mojolang.org/releases/v1.0.0b1/ , https://mojolang.org/releases/v1.0.0b2/)

### (d) What is now considered idiomatic

All from https://mojolang.org/releases/v1.0.0/ unless noted.
- Use `def` for every function declaration; treat `fn` as a historical spelling only.
- Always declare variables with `var`: "All variable declarations should use `var`."
- Spell out mutability and ownership instead of relying on silent defaults ("Explicit over implicit").
- Prefer `imm` over `read`.
- Prefer `length` over `size` vocabulary; prefer `Array` (list literals now construct `Array` by default: "Mojo now picks `Array` (instead of `List`) as the default type to construct from a list expression, eliminating implicit heap allocations").
- Prefer the unified safe `Pointer` with `unsafe_`-prefixed operations at the point of unsafety, rather than an unsafe pointer *type*.
- Prefer explicit `.copy()` or the `^` transfer; don't rely on implicit copies (only `ImplicitlyCopyable` types copy implicitly).
- Prefer closure capture lists (`def f() {imm x}:`) over legacy `@parameter`/`@__copy_capture` closures.
- Prefer fixed-width types (`Int32`) at the GPU boundary; `Int`/`UInt` are "platform-sized index types".
- Prefer `@explicit_destroy` with a message and `Deinitable where False` for linear types.
- Prefer the `max` Mojo package for accelerator APIs now that GPU stdlib APIs moved there.
- Prefer `Optional[Pointer[...]]` over nullable raw pointers (b1/b2: the default null `UnsafePointer()` constructor was removed). (https://mojolang.org/releases/v1.0.0b1/ , https://mojolang.org/releases/v1.0.0b2/)

### Old spellings that may ONLY appear in migration tables

Editorial rule for the book (derived from the sources above). These must never appear as
teaching examples, only inside an "old → new" table:
`fn`, `read`, `InlineArray`, `StringSlice`, `MutStringSlice`, `ImmStringSlice`, `size=`
(keyword parameter), `ImplicitlyDestructible`, `ImplicitlyDeletable`, `__del__()`,
`UnsafePointer` (as a preferred name), `MutUnsafePointer`, `ImmUnsafePointer`,
`ImmutUnsafePointer`, `OptionalUnsafePointer`, `[i]` for raw pointer offsets, `load()`,
`store()`, `free()`, `init_pointee_*`, `destroy_pointee*`, `take_pointee()`,
`mut_cast()`, `as_noalias()`, `address_space_cast()`, `as_immutable()`,
`get_immutable()`, `OwnedPointer.take()`, `StaticConstantOrigin`, `steal_data()`,
`capacity` as a field, `Size`/`size` in `SIMD`/`TypeList`, `OwnedKwargsDict`,
`Variant.take`, `@register_passable`, `@doc_private`, `@value`, `owned`,
`escaping`, `constrained[]`, `alias` (docs now prefer `comptime`),
`mojo package`, `.mojopkg`, `AnyOrigin`/`ExternalOrigin`, `as_any_origin()`,
`Consistency`/`MONOTONIC`, `__moveinit__`/`__copyinit__`, `Int.__truediv__` as
float division, `DType.invalid`, `String.write()`, `trait_downcast*`,
`x[-1]` negative indexing.
Note the two "deprecation-window" spellings that still compile today but are not
idiomatic: `StringSlice`, `InlineArray`, `read`, `__del__()`, and the unprefixed
pointer operations.

---

## keywords/def.md

Sources: https://mojolang.org/docs/reference/function-declarations/ , https://mojolang.org/docs/reference/keywords/ , https://mojolang.org/docs/manual/functions/

- Official keywords-reference entry: `def` — "Function declaration". (https://mojolang.org/docs/reference/keywords/)
- Official reference opening: "A *function declaration* introduces a named, callable unit of code. Every function in Mojo starts with the `def` keyword". Example: `def greet(name: String) -> String: return "Hello, " + name`. (https://mojolang.org/docs/reference/function-declarations/)
- Official manual opening: "Mojo uses the `def` keyword to define functions. Functions declared inside a `struct` are called \"methods,\" but they have all the same qualities as \"functions\" described here." With a caution box: "The `fn` keyword is deprecated as of Mojo v26.2. Use `def` for all function declarations. The `fn` keyword will be removed in a future release." (https://mojolang.org/docs/manual/functions/)
- How it replaced `fn`: "`def` is now Mojo's standard function declaration keyword. `def` functions no longer implicitly raise and now have the same semantics as `fn`: they are non-raising by default, accept a `raises` specifier, and support typed errors. `fn` is now deprecated and will be removed in a future release." (https://mojolang.org/releases/v0.26.2/)
- Signatures (grammar block): `def name(argument-list) -> ReturnType:` ; `def name[parameter-list](argument-list) -> ReturnType:` ; `def name(argument-list) raises -> ReturnType:` ; plus `where constraint` forms. "Only the parentheses and the colon are required." (https://mojolang.org/docs/reference/function-declarations/)
- Anatomy (manual): `def function_name[ parameters ... ]( arguments ... ) -> return_value_type: function_body`. "If a function takes no parameters, you can omit the square brackets, but the parentheses are always required." "If a function doesn't return a value, you can either omit the return type or declare `None` as the return type." (https://mojolang.org/docs/manual/functions/)
- **Return type annotation**: "`->` introduces the return type. It appears after any effects: ... Without `->`, the function returns `None`." Alternative: a named result via `out` ("A function can declare only one return value, whether it's declared using an `out` argument or using the standard `->` type syntax."). (https://mojolang.org/docs/reference/function-declarations/ , https://mojolang.org/docs/manual/functions/)
- Minimal function: `def do_nothing(): pass`. (https://mojolang.org/docs/reference/function-declarations/)
- Name rules: "Function names must be valid identifiers. Backtick-escaped identifiers allow keywords as function names" — e.g. `def \`import\`():`. But note the 1.0 restriction on predefined/reserved words for free functions (`class`, `del`, `match`, `yield`). (https://mojolang.org/docs/reference/function-declarations/ , https://mojolang.org/releases/v1.0.0/)
- **Parameter conventions overview — with a pointer that they are documented separately** (they are *not* keywords; see keywords/index.md):
  - Marker order and meaning (reference): "`//` Infer-only (parameters only)"; "`/` Positional-only"; "`*` Keyword-only". "Markers must appear in this order: `//`, then `/`, then `*`. Each can appear once. `/` can't be first in the list, and `*` can't be last." (https://mojolang.org/docs/reference/function-declarations/)
  - Effects: `raises` ("Declares that the function can raise an error. An optional error type can follow `raises`."), `thin` ("Used only in function types ... Don't use `thin` in function declarations."), `abi("C")` ("Declares that a function uses the C calling convention"). (https://mojolang.org/docs/reference/function-declarations/)
  - Special methods with enforced signatures: `__init__` ("must have an `out self` result"); copy constructor (`__init__` with a single keyword-only argument named `copy`); move constructor (single keyword-only argument named `move`); `__deinit__()` ("The destructor takes `deinit self`"). (https://mojolang.org/docs/reference/function-declarations/)
  - **Pointer for the book**: argument conventions (`imm`, `mut`, `var`, `out`, `deinit`, `ref`) are documented on their own reference page (https://mojolang.org/docs/reference/keywords/#conventions) and in the manual on ownership (https://mojolang.org/docs/manual/values/ownership/), not as keywords — the keywords page states plainly that "Convention names aren't reserved".

---

## keywords/index.md

Source: **https://mojolang.org/docs/reference/keywords/** ("Mojo identifiers, keywords, and conventions reference", Version 1.0.0).

- Definitions: "An *escaped identifier* is enclosed in backticks." / "*Keywords* are reserved words with fixed meaning. They cannot be used as ordinary identifiers (use an escaped identifier if you need to)." (https://mojolang.org/docs/reference/keywords/)
- **Exact count from the page: 34 keywords** (count derived by enumerating every keyword row in the six tables on that page; see list below). The page itself does not state a number — only the list. **A count of 34 is confirmed against the 1.0.0 page; no discrepancy found.**
- The 34, by the page's own grouping:
  - Control flow (10): `if`, `elif`, `else`, `for`, `while`, `break`, `continue`, `pass`, `return`, `with`
  - Error handling (5): `try`, `except`, `finally`, `raise`, `assert`
  - Declarations (6): `def`, `lambda`, `struct`, `trait`, `var`, `ref`
  - Keyword operators (5): `and`, `or`, `not`, `in`, `is`
  - Imports (3): `import`, `from`, `as`
  - Compile-time (1): `comptime`
  - Literal keywords (4): `True`, `False`, `None`, `Self`
  (10 + 5 + 6 + 5 + 3 + 1 + 4 = 34) (https://mojolang.org/docs/reference/keywords/)
- **Explicit statement that certain words are "not reserved"** — verbatim: "Convention names aren't reserved, so existing Python code that uses these names won't break, but in Mojo signatures they have fixed meaning." The page then lists argument conventions (`(imm)`, `mut`, `out`, `deinit`, `var`, `ref`) and adds: "`raises` and `where` also have fixed meaning in declarations." (https://mojolang.org/docs/reference/keywords/)
- Important nuance to teach: `var` and `ref` appear in **both** tables — as keywords (Declarations: "Scoped variable binding" / "Scoped reference binding") and as conventions. (https://mojolang.org/docs/reference/keywords/)
- Case sensitivity: "All keywords are case-sensitive: `True` is a keyword; `true` is not. `None` is a keyword; `none` is not. `Self` is a keyword; `self` is a conventional argument name, not a keyword." (https://mojolang.org/docs/reference/keywords/)
- Note also: the operator table says only five operators are spelled as words: "Five operators are spelled as words rather than symbols. Symbolic operators (`+`, `-`, `*`, `^`, `//`, etc.) are punctuation, not keywords." (https://mojolang.org/docs/reference/keywords/)
- Cross-check against the language reference TOC (the keywords page is the only page that enumerates reserved words; the reference index lists it as "Identifiers and keywords"): https://mojolang.org/docs/reference/

---

## Gaps and contradictions

Each item states what the official docs do, and where they are silent or in conflict.

1. **`alias` is not on the keyword list, but the release notes treat it as a keyword.**
   - The keywords page's Declarations table lists `comptime` (under Compile-time) but **no `alias`**; `alias` appears nowhere on that page. (https://mojolang.org/docs/reference/keywords/)
   - Yet the release notes say: "Mojo now supports the `comptime` keyword as a synonym for `alias`. ... Both keywords are fully supported and produce identical behavior." And later: "The compiler will now warn on the use of `alias` keyword and suggest `comptime` instead." (https://mojolang.org/releases/v0.25.7/ , https://mojolang.org/releases/v0.26.1/)
   - Contradiction: a name the release notes call a keyword is absent from the authoritative keyword list, so the "34 keywords" count is arguably 35 in practice.

2. **`async`/`await` are called keywords on the stability page but are absent from the keyword list and are unstable.**
   - Stability page: "So although the `async` and `await` keywords aren't prefixed, consider them unstable as well." (https://mojolang.org/docs/api-docs/stability/)
   - The keywords page does not list `async` or `await` at all. (https://mojolang.org/docs/reference/keywords/)
   - The 1.0.0 release notes nevertheless mention them as syntax: "Between the `async` and `def` keywords on function definitions." (https://mojolang.org/releases/v1.0.0/)
   - The roadmap lists "First-class `async` support" as an unstarted Phase-2 item, i.e. not delivered. (https://mojolang.org/docs/roadmap/)

3. **`max[all]` is not documented on mojolang.org.** Neither the install page, the FAQ, the nightly install page, the packages page nor the notebooks page uses an extras/`max[all]` install form; the documented GPU install is plain "install the `max` package". (https://mojolang.org/install/ , https://mojolang.org/docs/faq/ , https://mojolang.org/nightly/install/ , https://mojolang.org/docs/tools/notebooks/) The `[all]` form is used only for MAX documentation on the *other* domain (`max.modular.com`) and appears as `pin_compatible('mojo-compiler')` guidance in a packaging page — never as `max[all]` on mojolang.org. Do not assert `max[all]` from official Mojo sources.

4. **The `modular` package is documented inconsistently for 1.0.**
   - v25.5: "To use Python to Mojo interoperability in v25.5, you must install the `modular` package. This will move to the `mojo` package in a future release." (https://mojolang.org/releases/v0.25.5/)
   - 1.0.0 FAQ lists only `mojo` and `mojo-compiler` as "the two Mojo packages". (https://mojolang.org/docs/faq/)
   - But a current 1.0.0 manual page still instructs: "install the `mojo` package ... or, if you're developing for the MAX framework, install the `modular` package, which includes the `mojo` package." (https://mojolang.org/docs/tools/debugging/, quoted from llms-manual.txt)
   - No 1.0.0 release note states the `modular` package's retirement. Treat any "retired" claim as unverified.

5. **Keyword count depends on definition.** The keywords page yields 34 if only the six tables are counted, but `alias` (release notes: keyword), `async`/`await` (stability page: keywords), and the conventions `imm`/`mut`/`out`/`deinit`/`raises`/`where` (page: "aren't reserved") all sit adjacent. The page never states a number, so the count in the book must be attributed to "the words in this page's tables", not to "all Mojo keywords".

6. **`UInt` documentation is stale relative to release notes.** Manual pages still describe `Int`/`UInt` in older terms in places, while the release notes state `UInt` was replaced by an alias to `Scalar[DType.uint]` in v0.26.1 and `Int` became an alias for `Scalar[DType.int]` in v1.0.0. (https://mojolang.org/docs/manual/python-to-mojo/ , https://mojolang.org/releases/v0.26.1/ , https://mojolang.org/releases/v1.0.0/)

7. **`fn` still appears in current 1.0.0 prose and examples** even though it is an error in 1.0.0b2+: the FAQ and other pages reference "an `fn` function" and the Python-to-Mojo page shows no `fn`, but llms-reference.txt still carries `fn`-era diagnostics text. Any occurrence of `fn` outside a migration table is a documentation lag, not current syntax. (https://mojolang.org/releases/v1.0.0b2/ , llms-reference.txt)

8. **Deprecated-but-live spellings mean the migration table cannot be read as "removed".** `StringSlice`, `InlineArray`, `read`, `__del__()` and the unprefixed pointer operations still compile in 1.0.0 (some with warnings, some silently). The book must distinguish "deprecated alias" from "removed", because the release notes do not give a single consolidated removal schedule. (https://mojolang.org/releases/v1.0.0/)

9. **`--warn-on-unstable-apis` exists but is officially not recommended**, so a reader following the book cannot use it as a "stay stable" check today: "We don't currently recommend this because the stable API set is small." (https://mojolang.org/docs/api-docs/stability/)

10. **Two stability regimes in one release, stated in different places.** The FAQ: language stable by default, stdlib unstable by default. The 1.0.0 notes: "most core language features are stable" and stdlib stabilization "deliberately small". The stability page itself is prefaced as "an early and preliminary version". Readers must be told that 1.0.0's stdlib stability is the exception, not the rule. (https://mojolang.org/docs/faq/ , https://mojolang.org/releases/v1.0.0/ , https://mojolang.org/docs/api-docs/stability/)

11. **Version-scheme ambiguity is real in URLs vs. displayed names.** Archive links are `/releases/v0.25.5/` while the page title is "Mojo v25.5"; PyPI package versions are `0.25.6.0`-style while conda used `25.5`. Any table that lists a version must state which channel it came from. (https://mojolang.org/releases/ , https://mojolang.org/releases/v0.25.6/)

12. **Release dates on the releases index vs. individual pages agree**, but the index carries an extra "package version" field (`mojo==1.0.0`, `mojo==0.26.2.0`) that the individual pages do not repeat — quote dates from the individual release pages and package versions from the index to avoid mixing them. (https://mojolang.org/releases/ , https://mojolang.org/releases/v1.0.0/)

13. **`UnsafePointer` appears as both an old and a new name across releases.** v0.25.7 introduced a new `UnsafePointer` and renamed the old one `LegacyUnsafePointer`; v1.0.0 then unified `Pointer` with `UnsafePointer` and deprecated the `UnsafePointer` name. A "rename table" with a single `UnsafePointer → Pointer` line is a simplification that hides one intermediate step and should link both release pages. (https://mojolang.org/releases/v0.25.7/ , https://mojolang.org/releases/v1.0.0/)

14. **Not verified from official sources (do not assert):** an explicit `modular`-package retirement date or note; a documented `max[all]` install path; an official numeric keyword count; an official statement that `fn` is fully removed (b2 says "produces an error", not removed); the exact ABI-stability roadmap beyond "currently not stable".
