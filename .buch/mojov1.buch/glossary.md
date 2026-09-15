# Glossary

Every term a reader meets in `mojov1.buch`, defined tightly and pointed at the
page that teaches it. Terms are alphabetical within groups; the group headings
are for orientation only.

A term defined here is defined in the **current 1.x sense**. Pre-1.0 spellings
(`fn`, `read`, `InlineArray`, `__del__`, `UnsafePointer`, …) are not defined
here; they are recorded only in [`versions/1.0.0`](versions/1.0.0.md).

## Core model

**Value semantics** — The property that assigning or passing a value produces an
independent value rather than a second reference to shared data. Mojo's argument
behavior defaults to value semantics, but the language does not *enforce* value
semantics for a type: "Mojo doesn't enforce value semantics or reference
semantics. It supports them both and allows each type to define how it is
created, copied, and moved." Taught in
[value semantics](memory/value-semantics.md).

**Ownership** — The rule set that gives every value exactly one owner at a time
and destroys the value when the owner's lifetime ends. Mojo has no garbage
collector and no reference counting. The three rules: every value has only one
owner at a time; when the owner's lifetime ends, Mojo destroys the value; if
references to a value exist, Mojo extends the owner's lifetime. Taught in
[ownership and lifetimes](memory/ownership-and-lifetimes.md).

**Lifetime** — "The span of time during program execution in which the variable
is considered valid." It begins when the value is initialized and ends when it is
destroyed or consumed. Taught in
[ownership and lifetimes](memory/ownership-and-lifetimes.md) and
[the lifecycle chapter](lifecycle/index.md).

**Origin** — A compile-time value that lets the lifetime checker answer two
questions: "What variable 'owns' this value?" and "Can the value be mutated using
this reference?" Origins are derived from existing values with `origin_of()`,
never created from nothing. Taught in
[origin and borrowing](memory/origin-and-borrowing.md).

**Borrow** — Plain-language name in this book for a lifetime-checked reference:
an `imm`, `mut` or `ref` argument, or a `ref` binding, that gives access to a
value owned elsewhere without owning it. The official docs describe the
mechanism through origins and references rather than using "borrow checking" as a
formal feature name. Taught in
[origin and borrowing](memory/origin-and-borrowing.md).

**Argument convention** — The word before an argument name that says how the
value passes: default/`imm`, `mut`, `var`, `out`, `deinit`, or `ref`. Convention
names are **not reserved**: they have fixed meaning only in a signature. Taught
in [keywords and conventions](keyword-conventions/index.md) and
[ownership and lifetimes](memory/ownership-and-lifetimes.md).

**Convention** — See argument convention. A word with fixed meaning in a
declaration or signature but not a reserved keyword. The conventions are `imm`,
`mut`, `out`, `deinit`, and (in signatures) `raises` and `where`; `var` and `ref`
appear in both the keyword and convention tables. Taught in
[keywords and conventions](keyword-conventions/index.md).

**ASAP destruction** — Mojo's "as soon as possible" destruction policy: a value
is destroyed after its last use, not at the end of the block and not even at the
end of the expression; destruction runs "after every sub-expression". Taught in
[value destruction](lifecycle/death.md).

**Transfer / transfer sigil (`^`)** — A postfix `^` that moves a value out of a
variable, leaving the variable uninitialized. The ownership transfer is checked:
using the name afterwards is a compile error. Taught in
[variables and mutability](basics/variables-and-mutability.md) and
[ownership and lifetimes](memory/ownership-and-lifetimes.md).

**Explicit destruction** — An opt-in mode in which the compiler disables
automatic destruction and requires a named cleanup method to be called before the
value goes out of scope. Declared with `Deinitable where False` plus
`@explicit_destroy("message")`. Taught in
[value destruction](lifecycle/death.md).

## Traits and copy behaviour

**Trait** — A named contract of required/provided methods, associated types and
compile-time values. A conforming type must satisfy every requirement; the
compiler verifies this at the type's definition. Taught in
[traits](types/traits.md).

**`conforms_to`** — A compile-time expression, `conforms_to(T, Trait)`, that
tests whether a type satisfies a trait. Used in `where` clauses and in
conditional conformance. Taught in [traits](types/traits.md) and
[parameters and generics](functions/parameters-and-generics.md).

**`AnyType`** — The implicit root trait: every trait refines it, and it places no
behavioral requirements on a type. Taught in [traits](types/traits.md).

**`Deinitable`** — The trait for a type that can be destroyed automatically with
`__deinit__()`. The compiler conforms a struct to `Deinitable` when all its
members are `Deinitable`; the destructor may be a synthesized no-op. Taught in
[traits](types/traits.md) and [value destruction](lifecycle/death.md).

**`Movable`** — The trait for a type that can be moved. Structs are `Movable` by
default in 1.x; opt out with `Movable where False` or make it conditional. Taught
in [types overview](types/overview.md).

**`Copyable`** — The trait for a type that can be copied **explicitly**, via
`.copy()` or the copy constructor. It implies `Movable`. Structs are not copyable
by default. Taught in [types overview](types/overview.md) and
[structs](types/structs.md).

**`ImplicitlyCopyable`** — The trait that additionally permits **implicit**
copies (`var b = a`). It implies `Copyable` and `Movable`. The official guidance
is strict: a type should be implicitly copyable only if copying it is inexpensive
and has no side effects. Taught in [types overview](types/overview.md).

**Copy constructor** — `__init__(out self, *, copy: Self)`. Synthesized for a
`Copyable` type unless you write one; a custom one must perform a deep copy, which
the compiler does not enforce. Taught in [structs](types/structs.md).

**Move constructor** — `__init__(out self, *, move: Self)`, with a `deinit`
argument. Synthesized for a `Movable` type unless you write one. Taught in
[structs](types/structs.md).

**Destructor** — `def __deinit__(deinit self):`. Override it to free memory or
release resources; the compiler synthesizes a no-op otherwise. Taught in
[value destruction](lifecycle/death.md).

## Generic programming

**Parameterization** — The compile-time side of Mojo's generics: a declaration
can take type parameters and value parameters in square brackets, and the
compiler specializes a concrete version for each distinct parameter value. Taught
in [parameters and generics](functions/parameters-and-generics.md).

**Parameter** — A compile-time value, written in square brackets `[]` after a
name. Distinguished from an **argument**, a run-time value in parentheses `()`.
Taught in
[parameters and generics](functions/parameters-and-generics.md).

**Argument** — A run-time value passed in parentheses. See parameter. Taught in
[parameters and generics](functions/parameters-and-generics.md).

**Infer-only parameter** — A parameter that is always inferred from context or
passed by keyword; it may not be passed positionally. Declared before a `//`
marker at the start of the parameter list. Taught in
[parameters and generics](functions/parameters-and-generics.md).

**`Some[Trait]`** — Shorthand that puts a trait constraint directly on an
argument (or function type, or variadic pack via `SomeTypeList`) instead of
declaring a named type parameter. Not usable for a struct field. Taught in
[traits](types/traits.md).

**`where` clause** — A constraint at the end of a declaration, after the return
type or argument list, that must hold for the declaration to be usable. It may
carry an optional string-literal message: `where (cond, "message")`. Taught in
[parameters and generics](functions/parameters-and-generics.md).

**Conditional conformance** — A conformance that applies only when a condition
holds, e.g. `struct Wrapper[T](Writable where conforms_to(T, Writable))`. The
standard pattern for containers. Taught in
[parameters and generics](functions/parameters-and-generics.md).

**Overload set** — The collection of same-named function declarations a compiler
considers at a call site. Resolution ignores return type and `raises`. Taught in
[overloads](functions/overloads.md).

**`comptime`** — A compile-time binding or a compile-time execution marker: a
`comptime` declaration names a compile-time value; `comptime if` and `comptime
for` select and unroll at compile time. Taught in
[decorators and metaprogramming](functions/decorators-and-metaprogramming.md)
and [compile-time evaluation](functions/decorators-and-metaprogramming.md).

**`alias`** — A pre-1.0 spelling for a compile-time binding, now deprecated in
favour of `comptime`. `alias` is used pervasively yet does **not** appear on the
official keyword list, a documentation gap this buch mirrors. Taught in
[alias](keyword-conventions/alias.md).

## Numeric and memory types

**`SIMD`** — The core vector type, `SIMD[dtype, length]`, a fixed-size vector of
`length` elements of kind `dtype`. It must map to vector registers, is
type-safe, zero-cost and portable. Taught in
[vectorization and SIMD](concurrency/vectorization-and-simd.md).

**`DType`** — A compile-time value naming the element kind of a `SIMD` vector
(`DType.float32`, `DType.int8`, …). A `DType` stores no data; it tells `SIMD` how
to interpret each element. Taught in
[vectorization and SIMD](concurrency/vectorization-and-simd.md).

**`Scalar`** — A one-element `SIMD`, written `Scalar[DType]`. Every fixed-width
numeric name is a `Scalar` alias: `Float32` is `Scalar[DType.float32]`, and
`Int` is `Scalar[DType.int]`. Taught in
[integers and floats](types/integers-and-floats.md).

**`SIMDLength`** — The type of a `SIMD` vector's `length` parameter. Use it when
inferring a width from a `SIMD` argument; use `Int` everywhere else. Taught in
[vectorization and SIMD](concurrency/vectorization-and-simd.md).

**`Pointer`** — Mojo's single pointer type, `Pointer[T, origin]`. The 1.x
unification merged `Pointer` and `UnsafePointer`; unsafety is marked per
operation with an `unsafe_` prefix rather than on the type. Taught in
[pointers and references](types/pointers-and-references.md).

**`Span`** — A non-owning view of contiguous data, parameterized on the origin of
the data it points to. A contiguous slice of a `List` yields a `Span`; a strided
slice yields a new `List`. Taught in [collections](types/collections.md).

**`StringSpan`** — The text equivalent of `Span`, a non-owning view of string
data. Renamed from `StringSlice` in 1.0. Taught in
[bool and strings](types/bool-and-strings.md).

**`OwnedPointer` / `ArcPointer`** — Smart pointers that own their pointee:
`OwnedPointer` is move-only, single-ownership; `ArcPointer` is reference-counted
and copyable. Prefer them before raw `alloc()`. Taught in
[allocators](memory/allocators.md).

**`Allocation` / `ThinAllocation`** — The explicitly-destroyed handles returned
by `alloc()`; they must be consumed with `dealloc()` before going out of scope.
`ThinAllocation` omits the layout data. Taught in
[allocators](memory/allocators.md).

**`Allocator`** — The abstraction that provides memory; `alloc()`/`dealloc()` and
`Layout` are the layout-aware API. Taught in [allocators](memory/allocators.md).

**`Optional`** — The type-safe nullable: it holds either a `T` or `None`, and it
is an `Iterable` of zero or one elements. Use it instead of a null sentinel.
Taught in [optionals and nullability](types/optionals-and-nullability.md).

**`Array`** — The fixed-size, inline-storage array, `Array[T, length]`. Since 1.0
a list expression builds an `Array` by default, eliminating an implicit heap
allocation. Taught in [collections](types/collections.md).

**`List`** — The dynamically sized, heap-allocated sequence. Taught in
[collections](types/collections.md).

**`Variant`** — A closed union that holds one value from a fixed set of types at
a time; imported from `std.utils`. Taught in
[collections](types/collections.md).

## Errors

**`raises`** — The declaration word marking a function as able to propagate an
error; optionally followed by one error type. Functions are non-raising by
default. Taught in [error model](errors/error-model.md) and
[raising and propagation](errors/raising-and-propagation.md).

**`Error`** — The built-in default error type, carrying a text message and an
optional stack trace; the right choice for most application code. Taught in
[error model](errors/error-model.md).

**Typed error** — A user struct used as an error type after `raises`. Any struct
can serve; implementing `Writable` is recommended. At most one per function.
Taught in [error model](errors/error-model.md).

**`Never`** — A type with no constructors. `raises E -> Never` means the function
always raises; `raises Never -> T` means it never raises and is equivalent to
omitting `raises`. Taught in [error model](errors/error-model.md).

**Context manager** — An object with `__enter__()` and optionally `__exit__()`,
used with the `with` statement so cleanup runs even on the error path. Taught in
[raising and propagation](errors/raising-and-propagation.md).

## Version scheme

**1.x series** — The current stable line, beginning with Mojo 1.0.0 on
2026-08-11. The content tree of this buch always documents the current 1.x
release; the change record is [`versions/`](versions/index.md).

**SemVer / semantic versioning** — From 1.0, Mojo follows semantic versioning for
the core language and the stable parts of the standard library. Major versions
may break source compatibility, minor versions add backwards-compatible
functionality, patch versions fix bugs. Taught in [stability](intro/stability.md).

**Source-only stability** — Stability guarantees apply to source code only; the
Mojo ABI is not stable. Taught in [stability](intro/stability.md).

**CalVer era** — The 2024–2025 period when Mojo was bundled with MAX and used
`YY.MAJOR.MINOR` calendar versioning (`24.1`–`25.5`). Taught in
[version history](intro/version-history.md).

**Channel ambiguity** — The consequence of the version-scheme history that the
same release can appear under two numbers depending on the distribution channel:
for example conda `25.5` and PyPI `0.25.5`. Taught in
[version history](intro/version-history.md).

**Nightly** — An unstable build published almost every night, versus stable
releases every six weeks. Taught in [version history](intro/version-history.md).

## Sources

- Mojo manual — Value semantics: <https://mojolang.org/docs/manual/values/value-semantics/>
- Mojo manual — Ownership: <https://mojolang.org/docs/manual/values/ownership/>
- Mojo manual — Lifetimes, origins and references: <https://mojolang.org/docs/manual/values/lifetimes/>
- Mojo manual — Value lifecycle and destruction: <https://mojolang.org/docs/manual/lifecycle/> ; <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo manual — Structs and traits: <https://mojolang.org/docs/manual/structs/> ; <https://mojolang.org/docs/manual/traits/>
- Mojo manual — Parameters and generics: <https://mojolang.org/docs/manual/parameters/> ; <https://mojolang.org/docs/manual/generics/>
- Mojo manual — Errors: <https://mojolang.org/docs/manual/errors/>
- Mojo reference — Keywords and conventions: <https://mojolang.org/docs/reference/keywords/>
- Mojo reference — Numeric types: <https://mojolang.org/docs/reference/numeric-types/>
- Mojo reference — Types: <https://mojolang.org/docs/reference/types/>
- Mojo manual — Using pointers: <https://mojolang.org/docs/manual/pointers/using-pointers/>
- Mojo manual — Modules and packages: <https://mojolang.org/docs/manual/packages/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo FAQ (versioning): <https://mojolang.org/docs/faq/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
- Mojo release archive (version eras): <https://mojolang.org/releases/archive/>
