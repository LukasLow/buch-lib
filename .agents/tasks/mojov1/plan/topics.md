# Topic inventory — programming-language buch
Status: draft for review. Each bullet is one potential page (or one page per item where noted).
## A. Frame
- How to read this buch — version model and conventions
- What the language is: design goals, lineage, audience
- Where it stands today: release cadence, stability, pre-1.0/1.x status
- Install and first program; project layout; build system; package manager
- Coming from another language: orientation — explicitly *not* a "Python superset" framing (Mojo is statically typed, compiled, value-semantic with explicit mutability and ownership; see `interop/python-interop.md`)
## B. Language core
- Source encoding, comments, whitespace, identifiers, literals
- True keywords — one index page plus one page per keyword (34 in 1.0.0, taken from the official keyword reference, not invented)
- Declaration conventions that are *not* keywords — one page each in a separate folder (imm, mut, out, deinit, raises, where, alias, async/await), because they have fixed meaning in signatures but are not reserved
- Operators and precedence; expression vs. statement
- Types: primitives; composites (struct/array/slice/map/tuple); pointers; optionals; function types; generics
- Variables: declaration, mutability, scope, shadowing, lifetime
- Control flow: if; loops; switch/match; break/continue/labels; scope-exit constructs
- Functions: parameters; default/named/variadic arguments; multiple returns; closures; recursion
- Error handling: idiomatic model, propagation, wrapping, panics
- Modules, imports, visibility, name resolution
- Memory model: stack/heap, allocators, ownership/GC/RAII, lifetimes, value vs. reference semantics
- Concurrency: threads, async, message passing, shared state, cancellation
- Metaprogramming: macros, compile-time evaluation, reflection, code generation
- FFI/interop: C ABI, calling out, embedding
- Safety and contracts: undefined behaviour, invariants, assertions, type-safety holes
## C. Idioms
- Official style guide and formatting; naming conventions
- Idiomatic patterns per task (resource cleanup, iteration, error paths, null handling)
- Anti-patterns: compiles but wrong; beginner traps
- Performance idioms; when not to optimize
## D. Standard library tour
- One page per module/area: I/O, strings, collections, time, math, crypto, net, concurrency, OS
## E. Tooling
- Compiler and flags; build profiles
- Package manager and dependency management
- Formatter; linter; static analysis
- Testing; benchmarking; fuzzing; property tests
- Debugger; profiler; sanitizers; memory tools
- REPL/playground; LSP and editor setup
## F. Project practice
- Project structure and layering; configuration and secrets
- Logging, errors, observability in production
- CI; cross-compilation; release and distribution; versioning your own code
- Documentation conventions
## G. Ecosystem and community
- Libraries and frameworks by domain (web, CLI, data, embedded)
- Where decisions happen (RFC process), where to ask, how to contribute
- Interop with the wider tooling world
## H. Version change record (`versions/`, one page per release)
- One page per release: migration steps; what is new; what is now idiomatic in that release; what is deprecated or removed; tooling changes; old→new code pairs
- `versions/index.md`: table of version, date, headline, link
- Rule for a new 1.x release: add ONE `versions/` page and bump `.kdb/mojo/version.js` — no content copy; the content tree always holds the current state only
- Cross-version: decision table "which idiom wins in the current version"
## I. Appendices
- Glossary; cheat sheet; comparison to other languages; learning path; exercises; further reading
