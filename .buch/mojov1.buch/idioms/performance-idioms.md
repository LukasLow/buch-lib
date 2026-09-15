# Performance idioms

This page is about when Mojo is fast, when it is not, and how to tell the
difference. It deliberately starts with the honest statement rather than the
tricks, because the most common performance mistake in Mojo is optimizing code
that the compiler would have handled — or that did not matter.

## The honest rule: do not optimize first

Mojo's design makes straightforward code fast by default. Several properties do
the work for you:

- **Static typing specializes at compile time.** "The compiler uses them to
  generate fast, specialized machine code." Source:
  <https://mojolang.org/docs/manual/python-to-mojo/>.
- **AOT compilation, not interpretation.** "`mojo build` and `mojo run` both
  perform ahead-of-time (AOT) compilation." Source:
  <https://mojolang.org/docs/faq/>.
- **Value semantics avoids hidden reference-count traffic.** The default
  argument is a reference with no copy constructor or destructor call. Source:
  <https://mojolang.org/docs/manual/values/ownership/>.
- **ASAP destruction has no drop flags.** "The Mojo approach eliminates this
  overhead entirely, making the generated code faster and avoiding ambiguity."
  Source: <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Numbers are SIMD by default.** "Mojo implements its primitive numeric types
  as SIMD values under the hood." Source:
  <https://mojolang.org/docs/manual/python-to-mojo/>.

So: **write the clear version, measure it, and change only what the measurement
identifies.** The compiler is at `-O3` by default for `mojo run` and `mojo
build`:

> `--optimization-level <LEVEL>`, `-O`, `--no-optimization (LEVEL=0)` — Sets the
> level of optimization to use at compilation. The value must be a number between
> 0 and 3. The default is 3.

Source: <https://mojolang.org/docs/cli/run/>.

The rest of this page is what to reach for *after* you have a reason.

> **Open question:** the official docs state the properties above but do not give
> a single page of end-to-end optimization guidance. The closest official
> material is the `vectorize` API reference, the `SIMD` reference, the
> `@always_inline`/`@no_inline` decorator pages, and the FAQ's statement that
> "any AI-related benchmarks rely heavily upon other framework components" —
> i.e. Mojo does not publish language-level benchmark numbers. Treat the
> patterns below as documented mechanics, not as a published optimization
> checklist.

## SIMD and vectorization

### The model: a scalar is a width-1 vector

`DType` names a data kind; `SIMD[DType, length]` is a vector; a length-1 vector
is a `Scalar`, and every fixed-width numeric name is a `Scalar` alias:

```mojo
comptime Scalar = SIMD[length=1]
comptime Int = Scalar[DType.int]
comptime Float32 = Scalar[DType.float32]
```

> "This means that whether you're working with a single `Float32` value or a
> vector of float32 values, the math operations go through exactly the same code
> path."

Source: <https://mojolang.org/docs/manual/types/> and
<https://mojolang.org/docs/reference/numeric-types/>.

**Idiom:** write the elementwise operation once, on the vector type, and let the
same code serve any width. The official `vectorize` example stores full-width
groups with a width-aware load/store:

```mojo
from std.algorithm.functional import vectorize
from std.memory.alloc import alloc, dealloc, Layout
from std.sys import simd_width_of

comptime size = 10
comptime simd_width = simd_width_of[DType.int32]()

def main():
    var allocation = alloc(Layout[Int32](count=size))

    def fill[width: Int](i: Int) {mut}:
        print("storing", width, "els at pos", i)
        allocation.unsafe_ptr().unsafe_store[width=width](i, Int32(i))

    vectorize[simd_width](size, fill)
    dealloc(allocation^)
```

```output
storing 4 els at pos 0
storing 4 els at pos 4
storing 1 els at pos 8
storing 1 els at pos 9
```

Source for the example shape:
<https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>. The
official example spells the store `store[…]`, which is the deprecated pre-1.0
pointer-operation name; the 1.x spelling above is `unsafe_store[…]`, where the
`unsafe_` prefix marks the individual unsafe operation. Sources:
<https://mojolang.org/docs/manual/pointers/using-pointers/> and
<https://mojolang.org/releases/v1.0.0/>.

### `vectorize` is the entry point, and its index is a group offset

> "Simplifies SIMD optimized loops by mapping a function across a range from 0 to
> `size`, incrementing by `simd_width` at each step. The remainder of
> `size % simd_width` will run in separate iterations."

Source: <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>.

**The trap:** the closure receives the *group* start, not the lane index. The
official example processes `width` consecutive elements starting at `i` with a
width-aware load or store. Writing `results[i] = ...` inside the closure assigns
one element per group. Source:
<https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>. The
vectorization page in this buch covers the three overloads, the `evl`
predicated-tail form and unrolling in full; see
[vectorization and SIMD](../concurrency/vectorization-and-simd.md).

### Ask the hardware for its width

Do not hard-code 4 or 8:

```mojo
from std.sys import simd_width_of

comptime simd_width = simd_width_of[DType.int32]()
```

> "Returns the vector size of the type on the host system."

Source: <https://mojolang.org/docs/std/sys/info/simd_width_of/>.

### Do not choose a width larger than the register

A large width is not more speed:

> "If you declare a SIMD vector size larger than the vector registers of the
> target hardware, the compiler will break up the SIMD into multiple vector
> registers for compatibility. However, you should avoid using a vector that's
> more than 2x the hardware's vector register size because the resulting code
> will perform poorly."

Source: <https://mojolang.org/docs/std/builtin/simd/SIMD/>. The numeric-types
reference adds that "the usable width is much smaller and depends on the
hardware" and that you should "always benchmark to find the optimal width."
Source: <https://mojolang.org/docs/reference/numeric-types/>.

### Per-lane masks, not scalar comparisons

Vector comparisons that return `Bool` test the whole vector; `.eq()`, `.gt()`,
`.lt()` return a per-lane mask usable for selection:

```mojo
var values = SIMD[DType.int32, 4](1, -2, 3, -4)
var is_positive = values.gt(0)                    # a SIMD of booleans
var result = is_positive.select(values * 2, values * -1)
```

Source: <https://mojolang.org/docs/std/builtin/simd/SIMD/>.

**Anti-pattern:** converting a vector to scalars to branch per element, which
gives up the vectorization and introduces divergence.

## Avoiding copies

The default already avoids copies; the performance work is usually to **not
undo** the default.

### Keep the default convention for reads

> "In general, passing an immutable reference is much more efficient when
> handling large or expensive-to-copy values, because the copy constructor and
> destructor aren't invoked for a default (immutable reference) argument."

Source: <https://mojolang.org/docs/manual/values/ownership/>.

### Move instead of copy

```mojo
var second = first^   # transfer, not copy
list.append(name^)    # transfer into the container
```

The docs frame the move as an optimization the compiler also performs: "Mojo
optimizes away the move operation entirely, leaving the value in the same memory
location but updating its ownership." Source:
<https://mojolang.org/docs/manual/values/ownership/>. And the ASAP-destruction
page ties the two together: destroying at last use "composes nicely with the
'move' optimization, which transforms a 'copy+del' pair into a 'move'
operation." Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

### Do not add `ImplicitlyCopyable` to a resource-owning type

> "A type should be implicitly copyable only if copying the type is inexpensive
> and has no side effects. ... any type that dynamically allocates memory or
> manages other resources probably shouldn't be implicitly copyable."

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

### Choose inline storage for fixed sizes

A list expression builds an `Array`, which avoids a heap allocation:

> "Mojo now picks `Array` (instead of `List`) as the default type to construct
> from a list expression, eliminating implicit heap allocations."

Source: <https://mojolang.org/releases/v1.0.0/>. `Array`'s length must be a
positive integer constant, so this is a compile-time-determined size; use `List`
only when you need to grow. Sources:
<https://mojolang.org/docs/std/collections/array/Array/> and
<https://mojolang.org/docs/reference/types/>.

### Let ASAP destruction free early

Because destruction happens at last use, a large value can be released before the
block ends. When you need deterministic timing, use the documented explicit
last-use marker rather than restructuring:

```mojo
var big = load_expensive()
use(big)
_ = big        # explicit last-use marker: destroyed here
```

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

## AOT versus JIT, and what the compiler does

### Mojo is ahead-of-time compiled

> "Mojo is a compiled language. `mojo build` and `mojo run` both perform
> ahead-of-time (AOT) compilation."

Source: <https://mojolang.org/docs/faq/>. There is no general-purpose JIT for
ordinary Mojo programs; the documented "runtime compilation" surface is the
`compile` standard-library package, which handles assembly, IR, linkage and
metadata introspection. Source: <https://mojolang.org/docs/std/compile/>.

**Practical consequence:** compilation cost and binary size are real budgets, and
compile-time features trade them for runtime speed.

### `comptime` trades compile time for runtime speed

```mojo
def repeat[count: Int](msg: String):
    comptime for i in range(count):
        print(msg)
```

> "The compiler fully unrolls the loop by replacing the `for` loop with `LIMIT`
> copies of the loop body. The induction variable is replaced with a
> compile-time constant value for each 'iteration'."

> "The `comptime for` construct unrolls at the beginning of compilation, which
> can greatly expand both the code size and the compilation time."

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.
Use it for "small loop bodies and low iteration counts."

`comptime if` is the cheaper sibling: it prunes the dead branch entirely.

> "This ensures that only the live branch of the `if` statement is compiled into
> the program, which can reduce your final binary size."

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

**Idiom:** prefer `comptime if` for platform or dtype selection; reserve
`comptime for` for genuinely small unrolls and for variadic-pack iteration, where
it is required because the compiler must know each element's type. Source:
<https://mojolang.org/docs/reference/function-declarations/>.

### `@always_inline` and `@no_inline`

> "Normally, the compiler will do this automatically where it can improve
> performance, but this decorator forces it to do so. The downside is that it can
> increase the binary size by duplicating the function at every call site."

Source: <https://mojolang.org/docs/reference/decorators/always-inline/>.

> "Too many inlined functions can slow compilation and substantially increase the
> binary size of the compiled program. In particular, large or complex functions
> may not benefit as much from inlining."

Source: <https://mojolang.org/docs/reference/decorators/no-inline/>.

**Idiom:** leave inlining to the compiler. Reach for `@always_inline` only on a
tiny wrapper on a hot path, and `@no_inline` on a large function whose inlining
bloats the binary.

The `"nodebug"` argument of `@always_inline` is a debugging aid, not a further
speed lever: "the same effect to inline the function, but without debug
information", for low-level library wrappers so users do not step into
non-Mojo code. Source:
<https://mojolang.org/docs/reference/decorators/always-inline/>. The
`"builtin"` argument is explicitly not for general use outside the standard
library. Source: <https://mojolang.org/docs/reference/decorators/always-inline/>.

## When Mojo is not fast

These are the documented cases where the straightforward version is not the fast
version, and where a change is justified.

### When you cross into dynamic Python

Python interop is first-class but it is a boundary, and the values crossing it
are `PythonObject`s. The 1.0 notes describe the hot-path improvement — "`Mojo`
made `PythonObject` operators dispatch through CPython abstract protocols
(~12x faster on the interop hot path)" — which implies the earlier cost was
real. Source: <https://mojolang.org/releases/v1.0.0/>. Keep hot loops on Mojo
types and cross the boundary in batches. The boundary itself is the subject of
[calling Python from Mojo](../interop/calling-python.md).

### When you allocate

`alloc()` is documented as terminating the program on failure and returning
uninitialized memory, so it is a manual, deliberate cost:

> "Allocation failure terminates the program; you can't catch this failure with a
> `try/except` block."

Source: <https://mojolang.org/docs/manual/pointers/using-pointers/>. Prefer the
library containers with inline or amortized storage (`Array`, preallocated
`List[T](capacity=...)`) before dropping to raw `alloc()`. See
[allocators](../memory/allocators.md).

### When the width is wrong

Covered above: exceeding 2× the register width makes the code perform poorly
because the compiler splits the vector. Source:
<https://mojolang.org/docs/std/builtin/simd/SIMD/>.

### When you fight the aliasing rules

Wildcard origins do not only remove safety; they remove the compiler's ability to
optimize. "Using a pointer with a wildcard origin into a scope effectively
disables Mojo's ASAP destruction for any values in that scope, as long as the
pointer is live. It also prevents Mojo from enforcing argument exclusivity."
Source: <https://mojolang.org/docs/manual/values/lifetimes/>. Argument
exclusivity, by contrast, "also lets the compiler optimize." Source:
<https://mojolang.org/docs/manual/values/ownership/>.

### When the compiler is not told enough

`comptime` facts let the compiler specialize. A value parameter that the caller
knows produces a specialized function; the same value as a runtime argument does
not:

> "The compiler specializes code for each distinct value. It can remove dead
> branches (`comptime if`), unroll loops (`comptime for`), replace inline
> constants, and optimize aggressively with no runtime cost."

Source: <https://mojolang.org/docs/manual/generics/>.

## A short performance checklist

Use this only after a measurement shows a problem.

- [ ] Is the value being copied unnecessarily? Check the argument conventions:
      default (`imm`) for reads, `var` only when ownership is needed.
- [ ] Is there a `.copy()` or `ImplicitlyCopyable` on a hot path? Remove it or
      make it explicit and rare.
- [ ] Is a fixed-size collection an `Array` rather than a `List`?
- [ ] Is the loop hot enough to vectorize, and is it written so `vectorize` can
      be used with a width-aware body?
- [ ] Is the SIMD width taken from `simd_width_of[dtype]()` and no more than
      ~2× the register width?
- [ ] Is a `var` argument used where `imm` would do?
- [ ] Is a wildcard/untracked origin used where a tracked one would work?
- [ ] Is inlining forced where the compiler's own decision would be better?
- [ ] Is a large `comptime for` bloating the binary for no measurable gain?
- [ ] Is the hot loop crossing into Python per element?

Sources for the checklist items are the official pages cited under each heading
above.

## Pitfalls

- **Optimizing before measuring.** The compiler already runs at `-O3` and the
  defaults are copy-avoiding and SIMD-backed. Verified above.
- **Assuming a bigger SIMD width is faster.** Beyond ~2× the register width the
  compiler splits the vector and performance degrades. Verified above.
- **Indexing lanes inside a `vectorize` closure.** The index is a group start;
  use width-aware load/store. Verified above.
- **Ignoring `evl` in the predicated `vectorize` overload.** It writes out of
  bounds. Verified above.
- **Hard-coding the SIMD width.** Query it with `simd_width_of[dtype]()`. Verified
  above.
- **Using `.eq()` when you want one `Bool`, or `__eq__` when you want a mask.**
  They are different operations. Verified above.
- **Adding `ImplicitlyCopyable` for convenience.** It is a documented performance
  hazard. Verified above.
- **Unrolling a large `comptime for`.** It expands code size and compile time.
  Verified above.
- **Forcing `@always_inline` everywhere.** It bloats the binary; the compiler
  inlines where it helps. Verified above.
- **Crossing into Python per element in a hot loop.** Keep the hot loop in Mojo.
  Verified above.
- **Reaching for raw `alloc()` first.** Prefer the containers; allocation is a
  manual cost with no catchable failure. Verified above.
- **Reaching for wildcard origins to silence the checker.** They also remove
  optimization headroom. Verified above.
- **Leaving a hot value runtime-determined when it could be a parameter.**
  Parameters specialize; arguments do not. Verified above.

## Sources

- Mojo FAQ (AOT compilation): <https://mojolang.org/docs/faq/>
- Mojo manual — Python-to-Mojo (execution model): <https://mojolang.org/docs/manual/python-to-mojo/>
- Mojo manual — Ownership: <https://mojolang.org/docs/manual/values/ownership/>
- Mojo manual — Lifetimes, origins and references: <https://mojolang.org/docs/manual/values/lifetimes/>
- Mojo manual — Value creation: <https://mojolang.org/docs/manual/lifecycle/life/>
- Mojo manual — Value destruction (ASAP, move optimization): <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo manual — Compile-time evaluation (unrolling cost): <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>
- Mojo manual — Parameters and generics (specialization): <https://mojolang.org/docs/manual/generics/>
- Mojo manual — Types (SIMD as the numeric model): <https://mojolang.org/docs/manual/types/>
- Mojo manual — Using pointers (`alloc` failure): <https://mojolang.org/docs/manual/pointers/using-pointers/>
- Mojo reference — Numeric types: <https://mojolang.org/docs/reference/numeric-types/>
- Mojo reference — Function declarations (variadic packs): <https://mojolang.org/docs/reference/function-declarations/>
- Mojo reference — `@always_inline`: <https://mojolang.org/docs/reference/decorators/always-inline/>
- Mojo reference — `@no_inline`: <https://mojolang.org/docs/reference/decorators/no-inline/>
- Mojo standard library — `SIMD`: <https://mojolang.org/docs/std/builtin/simd/SIMD/>
- Mojo standard library — `vectorize`: <https://mojolang.org/docs/std/algorithm/backend/vectorize/vectorize/>
- Mojo standard library — `simd_width_of`: <https://mojolang.org/docs/std/sys/info/simd_width_of/>
- Mojo standard library — `Array`: <https://mojolang.org/docs/std/collections/array/Array/>
- Mojo standard library — `compile` package: <https://mojolang.org/docs/std/compile/>
- `mojo run` (optimization level): <https://mojolang.org/docs/cli/run/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
