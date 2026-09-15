# Verified facts — Mojo, as of 2026-09-15

Every line is a verified fact with its source URL. Use verbatim where quoted; do not invent or speculate. Primary sources: mojolang.org, modular.com, github.com/modular/modular.

## Version scheme and history
- Mojo 1.0.0 was released 2026-08-11 (shipped in Modular 26.5). https://mojolang.org/releases/v1.0.0/ ; https://www.modular.com/
- From 1.0, Mojo follows semantic versioning for the core language and the stable portions of the standard library. https://mojolang.org/releases/v1.0.0/ ; https://mojolang.org/docs/api-docs/stability/
- Latest stable is 1.0.0; latest nightly is 1.1.0.dev2026091005 (2026-09-10). https://mojolang.org/releases/ ; https://mojolang.org/releases/nightly/
- Stable releases ship every six weeks; nightlies ship almost nightly. https://mojolang.org/releases/
- Guarantees are **source-only**: source compatibility is managed; there is **no ABI stability**. Stability is marked per API with `@stable(since=...)`. https://mojolang.org/docs/api-docs/stability/
- Version scheme history, three eras:
  - (a) 2023: plain `0.x` (v0.2.1 … v0.7.0). https://mojolang.org/releases/archive/
  - (b) from v24.1 (2024-02-29): Mojo was bundled with MAX and used `YY.MAJOR.MINOR` CalVer (24.1…24.6, 25.1…25.5). https://mojolang.org/releases/archive/ ; https://mojolang.org/releases/v0.25.5/
  - (c) 2025-09-22: a `0.` prefix was added back because PyPI forbade a version > 1.0 before 1.0 (0.25.6, 0.25.7, 0.26.1, 0.26.2). https://mojolang.org/releases/archive/ ; https://mojolang.org/releases/v0.25.6/
  - (d) 1.0.0 on 2026-08-11, with semver. https://mojolang.org/releases/v1.0.0/
- Consequence: "the version number" is channel-dependent — the same release can appear as conda `25.5` and as PyPI `0.25.5`. https://mojolang.org/releases/v0.25.5/
- During the 1.x timeframe, changes "should mostly be additive". Breaking changes may still happen but are managed with care. https://mojolang.org/releases/v1.0.0/
- Release archive (all versions): https://mojolang.org/releases/archive/

## 1.0 breaking changes
- `fn` is unified into `def`; `fn` is deprecated. https://mojolang.org/releases/v1.0.0/ ; https://mojolang.org/docs/reference/
- `let` was removed. https://mojolang.org/releases/v1.0.0/
- `lambda` expressions were added: anonymous, single-expression closures that desugar to a nested `def` (arguments parenthesized and typed; capture list may be elided). https://mojolang.org/releases/v1.0.0/ ; https://mojolang.org/docs/reference/lambda-expressions/
- `Pointer` and `UnsafePointer` are unified into a single `Pointer` type; unsafety is marked per operation (`unsafe_*` spellings) instead of on the type. https://mojolang.org/releases/v1.0.0/
- Renames: `InlineArray` → `Array`; `StringSlice` → `StringSpan`; `size` → `length`; `read` → `imm`; `ImplicitlyDestructible` → `Deinitable`; `__del__` → `__deinit__`. https://mojolang.org/releases/v1.0.0/
- Implicit `var`-less variable declarations are deprecated. https://mojolang.org/releases/v1.0.0/
- The import system was overhauled to make name resolution explicit and consistent. https://mojolang.org/releases/v1.0.0/
- `Int` is now an alias for `Scalar[DType.int]`. https://mojolang.org/releases/v1.0.0/
- Nearly every breaking change ships with a deprecated alias and a compiler fix-it, so migration is mechanical. https://mojolang.org/releases/v1.0.0/

## Keywords vs. non-keywords
- The 34 TRUE keywords, authoritative list: `if, elif, else, for, while, break, continue, pass, return, with, try, except, finally, raise, assert, def, lambda, struct, trait, var, ref, and, or, not, in, is, import, from, as, comptime, True, False, None, Self`. https://mojolang.org/docs/reference/keywords/
- Keywords are reserved words with fixed meaning and cannot be used as ordinary identifiers; escaped backtick identifiers are the workaround. https://mojolang.org/docs/reference/keywords/
- NOT keywords, but with fixed meaning in declarations/signatures (explicitly "not reserved"): `imm`, `mut`, `out`, `deinit`, `raises`, `where`. https://mojolang.org/docs/reference/keywords/
- `owned`/`borrowed`/`inout` are LEGACY deprecated conventions, replaced by `var`/`read`(→`imm`)/`mut`/`out`/`deinit`. https://mojolang.org/docs/reference/keywords/ ; https://mojolang.org/releases/v1.0.0/
- `alias` is used pervasively yet is NOT on the official keyword list — a documentation gap to flag. https://mojolang.org/docs/reference/keywords/
- `async`/`await` are called keywords on the stability page but are omitted from the keywords reference and are marked **UNSTABLE** — flag it, do not present as stable. https://mojolang.org/docs/api-docs/stability/ ; https://mojolang.org/docs/reference/keywords/
- Library/builtin names often mistaken for keywords: `parallelize`, `vectorize`, `unroll`, `SIMD`, `Int`, `List`, `Dict` — these are stdlib/builtin, not keywords. https://mojolang.org/docs/std/
- Note: the verified brief says `ref` is both a true keyword (declarations) and a convention; the reference lists `var` and `ref` under both declarations and conventions. https://mojolang.org/docs/reference/keywords/

## Stdlib packages
- Top-level standard-library packages, from https://mojolang.org/docs/std/ : algorithm, atomic, base64, benchmark, bit, builtin, collections, compile, complex, documentation, ffi, format, gpu, hashlib, io, iter, itertools, logger, math, memory, origin, os, pathlib, prelude, pwd, python, random, reflection, runtime, stat, subprocess, sys, tempfile, testing, time, traits, utils.
- Count correction: the official page lists **37** packages. The brief said "36" but its own name list contains 37 items (`pwd` is the one omitted from the stated count). Verified against https://mojolang.org/docs/std/ on 2026-09-15.
- No `tensor`/`nn` at the std top level — those moved to the separate MAX package. https://mojolang.org/releases/v1.0.0/ ; https://max.modular.com/releases/v26.5/
- `layout` is now bundled with MAX instead of Mojo, and some accelerator-related stdlib APIs moved to the `max` Mojo package. https://mojolang.org/releases/v1.0.0/

## Install and platforms
- Install via `uv pip install mojo`, or pixi/conda (`pixi add mojo`). https://mojolang.org/install/
- Packages: `mojo` (full SDK including CLI, stdlib, LSP, LLDB debugger, formatter, REPL) and `mojo-compiler`; `max[all]` for GPU. https://mojolang.org/install/
- Platforms: macOS 15+ Apple silicon (M1–M5); Linux glibc ≥ 2.34 (Ubuntu 22.04+); Windows only via WSL. https://mojolang.org/docs/requirements/
- CPU: x86-64-v3 or ARM64 Neoverse N1+; 8 GiB RAM. https://mojolang.org/docs/requirements/
- GPUs optional: NVIDIA driver 580+, AMD ROCm 6.3.3+, Apple Metal. https://mojolang.org/docs/requirements/
- Python interop requires Python 3.10–3.14. https://mojolang.org/docs/requirements/
- Crash and LSP telemetry is collected. https://mojolang.org/install/ ; https://mojolang.org/docs/

## Open source and license
- Mojo became open source on 2026-08-18. https://github.com/modular/modular ; https://www.modular.com/blog/mojo-open-source
- Compiler, tooling and stdlib are under Apache 2.0 with LLVM Exceptions. https://github.com/modular/modular
- Compiler/tooling PRs are not yet accepted; target for accepting them is end of 2026. https://github.com/modular/modular

## Stability model
- Stability policy is defined per API and marked with `@stable(since=...)` in the API reference. https://mojolang.org/docs/api-docs/stability/
- The guarantees are source compatibility only; there is no ABI stability. https://mojolang.org/docs/api-docs/stability/
- At 1.0, most core language features are stable; stdlib stabilization began with a deliberately small set and will grow each release. https://mojolang.org/releases/v1.0.0/
- APIs stable in their entirety in 1.0.0: the `Deinitable`, `Movable`, `Copyable`, and `ImplicitlyCopyable` traits. https://mojolang.org/releases/v1.0.0/
- Types with one or more stable APIs in 1.0.0: `Array` (formerly `InlineArray`), `List`, `Span`, `String`, `Bool`, `Optional`. https://mojolang.org/releases/v1.0.0/
- 1.x intent: changes "should mostly be additive"; breaking changes remain possible but managed with care. https://mojolang.org/releases/v1.0.0/

## Canonical URLs
- Docs home: https://mojolang.org/docs/ (old docs.modular.com/mojo redirects here).
- Manual: https://mojolang.org/docs/manual/
- Language reference: https://mojolang.org/docs/reference/
- Keywords: https://mojolang.org/docs/reference/keywords/
- Stdlib: https://mojolang.org/docs/std/
- Releases: https://mojolang.org/releases/ ; archive https://mojolang.org/releases/archive/ ; v1.0.0 https://mojolang.org/releases/v1.0.0/
- Repo: https://github.com/modular/modular
- Install: https://mojolang.org/install/
- Requirements: https://mojolang.org/docs/requirements/
- Community packages: https://mojolang.org/packages/
- LLM index: https://mojolang.org/llms.txt
- Stability guarantees: https://mojolang.org/docs/api-docs/stability/

## Not-a-Python-superset
- Mojo is NOT a Python superset in practice. It is statically typed and compiled, has value semantics, explicit mutability, ownership with ASAP destruction, and no GC or reference counting. https://mojolang.org/docs/ ; https://mojolang.org/releases/v1.0.0/
- Python interop is bidirectional and first-class: call Python from Mojo, and bind Mojo for Python. https://mojolang.org/docs/std/python/ ; https://mojolang.org/releases/v1.0.0/
- 1.0 made `PythonObject` operators dispatch through CPython abstract protocols (~12x faster on the interop hot path). https://mojolang.org/releases/v1.0.0/
