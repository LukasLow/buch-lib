# Standard library packages — Mojo 1.0.0

Source: https://mojolang.org/docs/std/ (verified 2026-09-15). One line per package: what its book page should document.

**Count correction:** the official page lists **37** packages. The verified brief said 36, but its own name list contains 37 entries — `pwd` was omitted from the stated count. This file documents all **37**.

| Package | What to document (one line) |
|---------|------------------------------|
| `algorithm` | High-performance data operations: vectorization, functional map, tiling |
| `atomic` | Atomic operations and memory orderings |
| `base64` | Binary data encoding: base64 and base16 encode/decode |
| `benchmark` | Performance benchmarking: statistical analysis and reports |
| `bit` | Bitwise operations: manipulation, counting, rotation, power-of-two utilities |
| `builtin` | Language foundation: built-in types (`Int`, `SIMD`, `Bool`, `Tuple`, `Error`, …), traits and fundamental operations |
| `collections` | Core data types: `List`, `Dict`, `Set`, `Optional`, `String`, `Array`, `Span`, and other collections |
| `compile` | Runtime function compilation and introspection: assembly, IR, linkage, metadata |
| `complex` | Complex numbers: SIMD and scalar types, and operations |
| `documentation` | Documentation built-ins: decorators and utilities for doc generation |
| `ffi` | Foreign function interface for calling C code and loading libraries |
| `format` | Formatting traits for converting types to text |
| `gpu` | GPU programming primitives |
| `hashlib` | Cryptographic and non-cryptographic hashing with customizable algorithms |
| `io` | Core I/O: console input/output, file handling, writing traits |
| `iter` | Iteration traits and utilities: `Iterable`, `IterableOwned`, `Iterator`, `enumerate`, `zip`, `map` |
| `itertools` | Iterator tools for lazy sequence generation and transformation |
| `logger` | Logging with configurable severity levels |
| `math` | Math functions and constants: trig, exponential, logarithmic, special functions |
| `memory` | Low-level memory management: pointers, allocations, address spaces |
| `origin` | Mojo's origin types |
| `os` | OS interface layer: environment, filesystem, process control |
| `pathlib` | Filesystem path manipulation and navigation |
| `prelude` | Standard library prelude: fundamental types, traits and operations auto-imported |
| `pwd` | Password database lookups for user account information |
| `python` | Python interoperability: import packages/modules, call functions, type conversion |
| `random` | Pseudorandom number generation with uniform and normal distributions |
| `reflection` | Compile-time reflection utilities for introspecting types and functions |
| `runtime` | Runtime services: async execution and program tracing |
| `stat` | File type constants and detection from stat system calls |
| `subprocess` | Execute external processes and commands |
| `sys` | System runtime: I/O, hardware info, intrinsics, compile-time utilities |
| `tempfile` | Manage temporary files and directories: create, locate, cleanup |
| `testing` | Unit testing: assertions (equal, true, raises) and test suites |
| `time` | Timing operations: monotonic clocks, performance counters, sleep, `time_function` |
| `traits` | Core object-lifetime and value-semantics traits |
| `utils` | General utilities: indexing, variants, static tuples, thread synchronization |

## MAX / tensor split

- There is **no `tensor` and no `nn` package at the standard-library top level**; those moved to the separate **MAX** package. Source: https://mojolang.org/releases/v1.0.0/ ; https://max.modular.com/releases/v26.5/
- `layout` is now bundled with MAX instead of Mojo, and some accelerator-related standard-library APIs moved to the `max` Mojo package. The GPU page in the book (`concurrency/gpu-and-accelerators.md`) must point to MAX docs for those APIs. Source: https://mojolang.org/releases/v1.0.0/
- Consequence for the tour: `stdlib/gpu.md` documents only what remains in `std.gpu`; anything accelerator-related that moved is referenced as MAX, not presented as stdlib. Source: https://mojolang.org/releases/v1.0.0/ ; https://mojolang.org/docs/std/
