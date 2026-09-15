# Safety and undefined behaviour

Mojo's safety story has a sharp boundary: a large, checked core, and an explicit
unsafe layer where the compiler trusts you. This page maps that boundary: what
the checker guarantees, what is undefined behaviour, what "safety" assertions
mean in 1.x, and the stability caveat that language internals cannot be marked.

The error *model* is on [the error model](error-model.md); the mechanics of
`try`/`except` are on [raising and propagation](raising-and-propagation.md).

## What the compiler checks

The lifetime checker and the ownership rules are the core of the static
guarantees. The documented properties:

- **Unique ownership.** "Mojo helps avoid these errors by ensuring there is only
  one variable that owns each value at a time, while still allowing you to share
  references with other functions."
- **Prompt destruction.** "When the life span of the owner ends, Mojo destroys
  the value. ... Mojo's ownership system ensures that destructors are called
  promptly."
- **No use after transfer.** "transferring a value leaves the original variable
  uninitialized. You can't use the variable after the transfer until you assign it
  a new value of the original type."
- **Argument exclusivity.** "a mutable reference can't have any other references
  that *alias* it."
- **Lifetime extension.** "If there are existing references to a value, Mojo
  extends the lifetime of the owner."

Sources: <https://mojolang.org/docs/manual/values/ownership/>.

The compiler's own framing of the goal:

> In this way, Mojo helps ensure memory is freed, but it does so in a way that's
> deterministic and safe from errors such as use-after-free, double-free and
> memory leaks.

Source: <https://mojolang.org/docs/manual/values/>.

The lifetime checker is what makes the checked core work:

> The Mojo compiler includes a lifetime checker, a compiler pass that analyzes
> dataflow through your program. It identifies when variables are valid and
> inserts destructor calls when a variable's lifetime ends.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

## What is *not* enforced

Two important non-guarantees, both official.

**Value semantics is a default, not an enforcement.**

> Mojo doesn't enforce value semantics or reference semantics. It supports them
> both and allows each type to define how it is created, copied, and moved (if at
> all).

> However, the Mojo compiler doesn't enforce this, so it's the type author's
> responsibility to implement copy constructor with value semantics.

Sources: <https://mojolang.org/docs/manual/values/value-semantics/>,
<https://mojolang.org/docs/manual/lifecycle/life/>.

**The pointer API has a safe and an unsafe half.** The safe half is tracked; the
unsafe half is your responsibility:

> Some of these uses are safe, but others — particularly those involving
> dynamically-allocated memory — are *unsafe*: your code, not the compiler, is
> responsible for using the memory correctly.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## `unsafe_*` marks the boundary

The rule is mechanical and visible in the spelling:

> Unsafe operations are prefixed with `unsafe_` or use a keyword argument prefixed
> with `unsafe_`.

> Using any APIs prefixed with `unsafe_` (or that have keyword arguments prefixed
> with `unsafe_`) results in a potentially unsafe operation.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

The official list of what you take on when you cross the line:

> - allocating and deallocating memory
> - knowing whether a given memory location is initialized or uninitialized
> - manually calling deinitializers when a pointee is no longer being used

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

The corresponding safety obligations:

- **If you allocate, you must deallocate.** "If you use the `unsafe_leak()` method
  to obtain a pointer from an allocation, the Mojo lifetime checker can't track
  the memory and won't error on possible leaks."
- **Track initialization.** "Accessing uninitialized memory results in undefined
  behavior."
- **Track bounds when you offset.** "When accessing more than one value through a
  pointer (for example, using `unsafe_offset()` or `unsafe_load()`), you're always
  in unsafe territory. You must track the size of the allocation ... and which
  values are initialized."

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Undefined behaviour: the catalogue

The docs name these cases explicitly as undefined behaviour.

| Situation | Official wording |
|-----------|------------------|
| Dereferencing a pointer to uninitialized memory | "Trying to dereference a pointer to uninitialized memory results in undefined behavior." |
| Assigning through a pointer on uninitialized memory | "You cannot safely use the dereference operator on uninitialized memory, even to *initialize* a pointee." |
| Dereferencing a dangling pointer | "Trying to dereference the pointer, or calling any method that would access the memory location, results in undefined behavior." |
| `unsafe_take_pointee` / `unsafe_deinit_pointee` on bad state | "require that the pointer is non-null, and the memory location contains a valid, initialized value of the pointee's type; otherwise the function results in undefined behavior." |
| Freeing memory you do not own | "Freeing memory allocated elsewhere can result in undefined behavior." |
| Writing to a raw address | "the caller must ensure the address is valid before writing to it, and that the memory is initialized before reading from it." |

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

The reference to the raw-address case adds a subtlety about visibility:

> Writing to a raw memory address may require a volatile load/store as the
> operation may have side effects not visible to the compiler. You can specify this
> using the `volatile` parameter.

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>.

## Wildcard origins weaken the checker

Wildcard origins are the documented way to weaken the analysis, and the docs
discourage them:

> Using a pointer with a wildcard origin into a scope effectively disables Mojo's
> ASAP destruction for any values in that scope, as long as the pointer is live.
> It also prevents Mojo from enforcing argument exclusivity and hides unused
> variable warnings. Accordingly, the use of wildcard origins is discouraged, and
> should be used as a last resort.

Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

## Aborts: things that are checked but not recoverable

Some conditions are *not* errors you can catch. They terminate the program:

- **Invalid slices.** In 1.0, "invalid slicing ... now exits the program on an
  invalid slice instead of silently clamping it." Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Negative indexing.** Using a negative `IntLiteral` for indexing is a
  compile-time error (`constraint failed: negative indexing is not supported`).
  Source: <https://mojolang.org/releases/v1.0.0b1/>.
- **Allocation failure.** "Allocation failure terminates the program; you can't
  catch this failure with a `try/except` block." Source:
  <https://mojolang.org/docs/manual/pointers/using-pointers/>.
- **Unhandled errors.** "If an error isn't caught by any handler, your program
  terminates with a non-zero exit code and prints the error message." Source:
  <https://mojolang.org/docs/manual/errors/>.
- **`panic()`-style functions.** A function with `raises -> Never` never returns;
  it raises on every path. Source: <https://mojolang.org/docs/manual/errors/>.

## Assertions: `assert`, `debug_assert()`, and `-D ASSERT`

`assert` is a true keyword in the error-handling group, and its official purpose
line states the gate:

> `assert` — Aborts if a condition is false (gated by `-D ASSERT`)

Source: <https://mojolang.org/docs/reference/keywords/>.

The feature-toggles page gives the precise semantics of `-D ASSERT`, which
`debug_assert()` reads directly:

| `-D ASSERT=` value | Behaviour |
|--------------------|-----------|
| `none` | disable all assertions |
| `safe` (default in non-debug builds) | only run assertions tagged `assert_mode="safe"` |
| `all` | run every `debug_assert()` call |
| `warn` | run every assertion, but emit warnings instead of aborting |

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

Three rules about that gate:

- **`-g` and `-O` do not affect it.** "Other debug-related settings such as `-g`
  and `-O` don't affect `debug_assert()` behavior." Pass `-D ASSERT=...`
  explicitly; a typical debug invocation is `mojo -g -O0 -D ASSERT=all app.mojo`.
- **The plain `Bool` form always evaluates the condition**, even when assertions
  are disabled.
- **`debug_assert()` is silently disabled on Apple GPU targets.**

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

The official tagging convention:

> - Tag constant-time checks such as bounds tests and integer comparisons with
>   `assert_mode="safe"`
> - Leave traversals, allocations, and more expensive invariant checks untagged

```mojo
debug_assert[assert_mode="safe"](n >= 0, "nth: n must be non-negative")
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

### `comptime assert` is a different mechanism

Do not confuse the run-time gate with the compile-time assertion. `comptime assert`
halts compilation when its condition is false and produces a compiler error with
your message:

> Use `comptime assert` to declare compile-time preconditions on parameters or
> compilation targets.

```mojo
comptime assert is_gpu(), "this function requires a GPU target"
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>. The constraint system
around it is on
[decorators and metaprogramming](../functions/decorators-and-metaprogramming.md).
The 1.0.0 rename table records that the old `constrained[cond, msg]()` form was
removed in favour of `comptime assert`. Source:
<https://mojolang.org/releases/v1.0.0b2/>.

## Platform and target facts

`sys.info` provides parameter-evaluable target checks that are safe to branch on
at compile time, for example `CompilationTarget.is_linux()`,
`CompilationTarget.is_macos()`, `CompilationTarget.is_x86()`,
`CompilationTarget.is_apple_silicon()`, `CompilationTarget.has_avx512f()`,
`CompilationTarget.has_neon()`, and the accelerator predicates `is_gpu()`,
`is_nvidia_gpu()`, `has_accelerator()`. Source:
<https://mojolang.org/docs/tools/feature-toggles/>.

These are the supported way to gate unsafe, target-specific code. The constraint
system cannot use target facts as proof, however: "What it can't do is evaluate
target facts like `is_64bit()` or `is_nvidia_gpu()` ... as constraints. ... For
those cases, use `comptime if` instead." Source:
<https://mojolang.org/docs/manual/generics/>.

## The stability caveat: internals cannot be marked

This is the part of safety that is easy to miss: a set of language features
exists for the compiler, the standard library, or advanced metaprogramming, and
those features are **not** covered by the stability model — and, unlike stdlib
APIs, they cannot even be labelled.

> A small set of language features exists to support the compiler, the standard
> library, or advanced metaprogramming. Treat these as implementation details, not
> public-facing language items. They may change or disappear without notice and
> don't have stability guarantees.

> Unlike standard library APIs, these language features *can't be marked* as
> stable or unstable and the compiler won't warn when you use them
> (`--warn-on-unstable-apis`).

Source: <https://mojolang.org/docs/api-docs/stability/>.

The documented consequences for safety:

- **Avoid any feature with a leading double underscore** unless the manual
  documents it as stable. Examples: `__mlir_type`, `__mlir_op`, `__mlir_attr`,
  `__generator_type`. Rarely used dunders that are "not yet stabilized" include
  `__merge_with__()`, `__list_literal__`, and `__literal_size__`.
- **Avoid internal-use decorators**: `@parameter`, `@__copy_capture` (legacy
  closure support), `@__allow_legacy_custom_self_types`, `@__name`,
  `@__llvm_arg_metadata`, `@__unsafe_nested_origins_read_only`. Generalize with
  the rule: "Consider any decorators beginning with `@__` as internal and
  unstable, unless the manual explicitly documents them as public."
- **`async`/`await` is unstable.** "Mojo's async system isn't fully built out. So
  although the `async` and `await` keywords aren't prefixed, consider them
  unstable as well."

Source: <https://mojolang.org/docs/api-docs/stability/>.

The point for safety decisions: when you build on an unmarked internal, you are
outside the contract, and **the compiler will not even warn you**.

## The `--sanitize` and debug flags

The compiler's own runtime-checking controls are separate from assertions:

| Goal | Flag | Effect |
|------|------|--------|
| Emit full debug info (LLDB symbols) | `-g` / `--debug-level=full` | Sets `__DEBUG_LEVEL="full"` |
| Emit line tables only | `-g1` / `--debug-level=line-tables` | Sets `__DEBUG_LEVEL="line-tables"` |
| Disable optimization | `-O0` / `--no-optimization` | Sets `__OPTIMIZATION_LEVEL=0` |
| Enable AddressSanitizer | `--sanitize=address` | Sets `__SANITIZE_ADDRESS=1` |
| Enable all `debug_assert()` checks | `-D ASSERT=all` | Independent of `-g` and `-O` |

Source: <https://mojolang.org/docs/tools/feature-toggles/>. `--sanitize` also
accepts `thread` (ThreadSanitizer), but only `--sanitize=address` injects a
compile-time define.

Separately, Mojo generates a stack trace when the program hits a segmentation
fault; for raised errors, stack-trace collection must be enabled with
`MODULAR_DEBUG=stack-trace-on-error` and applies to the built-in `Error` only.
Source: <https://mojolang.org/docs/manual/errors/>.

## Pitfalls

- **Believing the checker enforces value semantics.** It does not; that is the
  type author's responsibility. Source:
  <https://mojolang.org/docs/manual/values/value-semantics/>.
- **Treating every pointer as safe.** Safe only until you call an `unsafe_*` API
  or pass an `unsafe_` keyword argument. Source:
  <https://mojolang.org/docs/manual/pointers/using-pointers/>.
- **Using a pointer's pointee after `dealloc()`.** The pointer is dangling; any
  access is undefined behaviour. Source:
  <https://mojolang.org/docs/manual/pointers/using-pointers/>.
- **Assuming `assert` gives you a catchable failure.** It aborts; the gate is
  `-D ASSERT`, not `try`/`except`. Source:
  <https://mojolang.org/docs/reference/keywords/>.
- **Expecting `-O0`/`-g` to turn on assertions.** They do not. Source:
  <https://mojolang.org/docs/tools/feature-toggles/>.
- **Relying on `debug_assert()` on Apple GPU.** It is silently disabled there.
  Source: <https://mojolang.org/docs/tools/feature-toggles/>.
- **Catching allocation failure.** `alloc()` termination is not catchable. Source:
  <https://mojolang.org/docs/manual/pointers/using-pointers/>.
- **Reaching for `__`-prefixed features.** They are outside the stability model
  and produce no warning. Source:
  <https://mojolang.org/docs/api-docs/stability/>.
- **Assuming you can assert a target fact in a `where` clause.** Use `comptime if`
  for target predicates. Source: <https://mojolang.org/docs/manual/generics/>.

## Open questions

> **Open question:** the keyword reference says `assert` is "gated by
> `-D ASSERT`", while the feature-toggles page documents `-D ASSERT` as
> controlling `debug_assert()`. Whether the bare `assert` statement and
> `debug_assert()` share identical level semantics is not stated one-to-one;
> prefer `debug_assert()` with an explicit `assert_mode` when the distinction
> matters.

> **Open question:** the stability page says language internals "can't be marked"
> and the compiler won't warn when you use them, but it does not enumerate which
> `unsafe_*` pointer operations are considered unstable. Treat the `unsafe_*`
> surface as documented API (see the memory pages), and the `__`-prefixed surface
> as internal.

## Sources

- Mojo stability guarantees (internals cannot be marked): <https://mojolang.org/docs/api-docs/stability/>
- Mojo reference — Identifiers, keywords, and conventions (`assert`): <https://mojolang.org/docs/reference/keywords/>
- Mojo tools — Feature toggles (`-D ASSERT`, `debug_assert`, `--sanitize`): <https://mojolang.org/docs/tools/feature-toggles/>
- Mojo manual — Using pointers (unsafe boundary and undefined behaviour): <https://mojolang.org/docs/manual/pointers/using-pointers/>
- Mojo manual — Ownership (exclusivity, transfer): <https://mojolang.org/docs/manual/values/ownership/>
- Mojo manual — Lifetimes, origins, and references (wildcard origins): <https://mojolang.org/docs/manual/values/lifetimes/>
- Mojo manual — Value semantics (not enforced): <https://mojolang.org/docs/manual/values/value-semantics/>
- Mojo manual — Errors (unhandled termination, stack traces): <https://mojolang.org/docs/manual/errors/>
- Mojo manual — Parameterized declarations (`where` and target facts): <https://mojolang.org/docs/manual/generics/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
- Mojo v1.0.0b1 release notes (negative indexing): <https://mojolang.org/releases/v1.0.0b1/>
