# Async and parallelism

This page describes what concurrency in Mojo 1.x **actually is**, not what it is
planned to be. The honest summary is:

- **`parallelize` is a library function, not a keyword.** It is called like any
  other function, and in 1.x it lives in the `max.algorithm` package (the Mojo
  side of MAX), not in the Mojo standard library.
- **`async`/`await` exist but are UNSTABLE and the async system is not fully
  built out.** Do not present them as finished.
- **The runtime infrastructure is real** — a thread pool, tasks, task groups,
  atomics and locks — and the pieces of it that live in `std.runtime`,
  `std.atomic` and `std.utils` are documented and usable.
- **First-class async is a roadmap item, not a shipped feature.** The roadmap
  still lists it as not started.

Everything below is either quoted from or grounded in the official docs, with
the source named.

## `parallelize` is a library function

There is no `parallelize` keyword. The 34 true keywords do not include it, and
the docs list library and builtin names "often mistaken for keywords" including
`parallelize` and `vectorize`
(<https://mojolang.org/docs/reference/keywords/>).

The manual compiles a parallel Mojo library in
[compiler and flags](../tooling/compiler-and-flags.md) using this import:

```mojo
from max.algorithm import parallelize
from std.runtime import initialize_runtime
```

And the closures chapter describes the call shape:

```mojo
from max.algorithm import parallelize

def main():
    var results = List[Int](length=8, fill=0)

    def work(i: Int) {mut results}:
        results[i] = i * i

    parallelize(work, 8)
    print(results)  # [0, 1, 4, 9, 16, 25, 36, 49]
```

> "You define `work` with the logic for a single element. `parallelize` calls it
> across available threads. Each call to `work` accesses the same `results`
> through mutable capture."
> — <https://mojolang.org/docs/manual/functions/closures/>

Two facts that follow:

- **It is a callback-driven API.** `parallelize` takes a function (the body for
  one index) and a count; it decides the thread distribution. That is why the
  closures chapter groups it with `vectorize` and `elementwise`:
  "You describe the work; the library decides how to distribute it across SIMD
  lanes, threads, or cores."
  (<https://mojolang.org/docs/manual/functions/closures/>)
- **It is synchronous.** "Each call to `work` accesses the same `results` …
  ready to use after `parallelize` finishes." There is no `await`; the call
  returns when the work is done.

### A caution from the 1.0.0 boundary change

Accelerator APIs moved to MAX, and one stdlib name survives in a specific form:

> "`parallelize()` and `parallelize_over_rows()` (in
> `std.algorithm.backend.cpu.parallelize`) … now accept an optional trailing
> `ctx: Optional[DeviceContext] = None`."
> — <https://mojolang.org/releases/v1.0.0/>

That release note refers to the internal path; the user-facing import in the
current manual is `from max.algorithm import parallelize`. Treat the `std.`
spelling as an implementation path, and `max.algorithm` as the documented
import. This is exactly the kind of split the 1.0.0 "clearer boundary between
Mojo and MAX" change created:

> "Most standard library APIs related to accelerator programming have moved to a
> new `max` Mojo package."
> — <https://mojolang.org/releases/v1.0.0/>

> **Open question:** the official manual page that shows
> `from max.algorithm import parallelize`
> (<https://mojolang.org/docs/tools/compilation/>) and the 1.0.0 release note
> that names `std.algorithm.backend.cpu.parallelize` disagree on where the API
> is imported from. The manual is the user-facing source and the release note
> describes the internal package layout; verify against the installed toolchain
> before pinning an import path.

## The runtime: a thread pool you usually do not start yourself

`std.runtime` is documented as the runtime services package:

> "The `runtime` package provides infrastructure for asynchronous task execution
> and program profiling. It includes low-level concurrency primitives for
> managing async coroutines, task groups, and parallel execution."
> — <https://mojolang.org/docs/std/runtime/>

The key function is `initialize_runtime()`:

> "Initializes the global Mojo runtime if it is not already initialized. The Mojo
> runtime manages the thread pool used by parallel and asynchronous APIs such as
> `parallelize()` and `TaskGroup`. Programs with a Mojo `main()` function
> initialize the runtime automatically at startup, so most programs never need to
> call this function."
> — <https://mojolang.org/docs/std/runtime/asyncrt/initialize_runtime/>

The one case where you *do* need it is when Mojo code runs inside a host that
is not Mojo:

> "However, when Mojo code is compiled into a shared library (with `mojo build
> --emit shared-lib`) and called from a non-Mojo host program (such as C or C++),
> no Mojo `main()` function runs and the runtime is never initialized. In that
> case, call this function before using any API that depends on the runtime …
> This function is idempotent and inexpensive when the runtime is already
> initialized."
> — <https://mojolang.org/docs/std/runtime/asyncrt/initialize_runtime/>

**Pitfall:** calling a runtime-dependent API from an exported function without
`initialize_runtime()` is a segmentation fault, not a Python exception or a Mojo
error. The 1.0.0 notes describe the failure exactly:

> "In that situation no Mojo `main()` runs, so the runtime was never initialized
> and parallel or asynchronous APIs such as `parallelize()` crashed."
> — <https://mojolang.org/releases/v1.0.0/>

The documented patterns are to call `initialize_runtime()` at the start of every
exported function, or to export a dedicated `mylib_init()` and require the host
to call it once (<https://mojolang.org/docs/tools/compilation/>).

### Querying the pool

```mojo
def parallelism_level() -> Int
```

> "Gets the parallelism level of the Runtime. … The number of worker threads
> available in the async runtime."
> — <https://mojolang.org/docs/std/runtime/asyncrt/parallelism_level/>

Use it to size work yourself instead of hard-coding a thread count.

### The runtime API surface (`std.runtime.asyncrt`)

From the module index (<https://mojolang.org/docs/std/runtime/asyncrt/>):

| Item | Purpose |
|---|---|
| `Coroutine[type, origins]` | "Represents a coroutine" that can pause and resume. A built-in, from `std.builtin.coroutine`. |
| `RaisingCoroutine[type, origins]` | "Represents a coroutine that can raise." |
| `create_task(handle)` | "Run the coroutine as a task on the AsyncRT Runtime." |
| `create_raising_task(handle)` | "Run a raising coroutine as a task." |
| `Task[type, origins]` | "Represents an asynchronous task that will produce a value of the specified type." |
| `RaisingTask[type, origins]` | A task that "may raise an error upon completion." |
| `TaskGroup` | "A group of tasks that can be executed concurrently." |
| `TaskGroupContext` | Internal context structure for task-group operations. |
| `initialize_runtime()` | Initialize the global runtime. |
| `parallelism_level()` | Worker-thread count. |

`Task` has both a blocking and a suspending path — a good illustration that the
async machinery is present but not the recommended entry point:

> "`__await__`: Suspend the current async function until the task completes and
> its result becomes available. …
>
> `wait`: Block the current thread until the future value becomes available. …
> Unlike `__await__`, this method does not suspend the current coroutine but
> instead blocks the entire thread."
> — <https://mojolang.org/docs/std/runtime/asyncrt/Task/>

`TaskGroup` adds `create_task()` and `wait()`, and an `__await__`:

> "`wait`: Wait for all tasks in the `TaskGroup` to complete. This is a blocking
> call that returns only when all tasks have finished."
>
> "`__await__`: Make TaskGroup awaitable in async contexts. This allows using
> 'await task_group' syntax in async functions."
> — <https://mojolang.org/docs/std/runtime/asyncrt/TaskGroup/>

Note the wording on `Task`: "Calling this on an incomplete task is undefined
behavior" (`get()`), and "This method must be force inlined into the calling
async function" (`__await__`). These are low-level primitives, not a polished
`asyncio`.

## `async`/`await` are unstable

This is the part to state plainly, and the stability page states it:

> "Lastly, Mojo's async system isn't fully built out. So although the `async` and
> `await` keywords aren't prefixed, consider them unstable as well. Any async
> behavior may be subject to change."
> — <https://mojolang.org/docs/api-docs/stability/>

Three facts qualify that quote, all from official pages:

1. **They are omitted from the keywords reference.** The keywords page has an
   *Identifiers* section, a *Keywords* section and a *Conventions* section, and
   contains no `async`/`await` entry anywhere. Yet the stability page calls them
   "keywords" and the 1.0.0 notes refer to syntax "between the `async` and `def`
   keywords" (<https://mojolang.org/releases/v1.0.0/>).
2. **First-class async is unstarted on the roadmap.** Phase 2 lists
   "⬜ **First-class `async` support**: Fully integrated with Mojo's type and
   memory models." with an empty box, meaning "not started"
   (<https://mojolang.org/docs/roadmap/>).
3. **There is no stable async library to build on.** `std.runtime.asyncrt` is
   documented, but it is part of a stdlib that is "unstable unless specifically
   marked stable" (<https://mojolang.org/docs/api-docs/stability/>), and none of
   the async types carries a documented stability marker.

The 1.0.0 notes also confirm the implementation detail changed recently — the
parser now rejects a newline "Between the `async` and `def` keywords on function
definitions" (<https://mojolang.org/releases/v1.0.0/>) — which is the kind of
churn you expect from unfinished syntax.

### A documented contradiction

The closures chapter says async is not available at all:

> "Mojo doesn't yet support async execution or escaping closures (closures that
> outlive their enclosing scope), but the underlying model is the same."
> — <https://mojolang.org/docs/manual/functions/closures/>

That is not compatible with the stability page calling `async`/`await` keywords
or with the existence of `Task`/`TaskGroup` and their `__await__` methods. Both
pages are official 1.x documentation.

> **Open question:** the stability page says `async`/`await` exist but are
> unstable; the closures page says Mojo "doesn't yet support async execution";
> the roadmap lists first-class async as not started. The most consistent reading
> is that low-level async primitives and unstable syntax exist, but there is no
> supported, stable async *programming model*. Verify against the installed
> release before writing async code, and prefer callback-based `parallelize`
> where possible.

**Bottom line for an agent: do not build a feature on `async`/`await` in 1.x.**
If a task needs concurrency today, use `parallelize` (library function) for data
parallelism, `Task`/`TaskGroup` only if you are prepared to track an unstable
API, and design so that the concurrency layer can be swapped.

## What can be relied on: atomics and locks

Concurrency primitives that are *documented* and independent of the async model
live in `std.atomic` and `std.utils.lock`.

### `std.atomic`

> "The `atomic` package provides the `Atomic` type for performing atomic
> read-modify-write operations on scalar values, along with the `Ordering` type
> for specifying the memory ordering of those operations. It also exposes the
> `fence` function to create standalone memory barriers."
> — <https://mojolang.org/docs/std/atomic/>

`Atomic[dtype]` provides (API reference:
<https://mojolang.org/docs/std/atomic/atomic/Atomic/>):

| Method | Semantics |
|---|---|
| `load[ordering=]`, `store[ordering=](value)` | atomic read / write |
| `fetch_add[ordering=](rhs)`, `fetch_sub[ordering=](rhs)` | read-modify-write, returns the **original** value |
| `__iadd__`, `__isub__` | atomic in-place add/sub |
| `compare_exchange[success_ordering=, failure_ordering=, weak=](expected, desired)` | compare-and-swap; on failure rewrites `expected` with the current value |
| `max[ordering=](rhs)`, `min[ordering=](rhs)` | atomic in-place max/min (integral or floating-point only) |

`Ordering` names the memory orderings: `NOT_ATOMIC`, `UNORDERED`, `RELAXED`,
`ACQUIRE`, `RELEASE`, `ACQUIRE_RELEASE`, `SEQUENTIAL`
(<https://mojolang.org/docs/std/atomic/atomic/Ordering/>).

**Pitfall:** the default ordering for `load`, `store`, `fetch_add`, and the other
read-modify-write operations is `Ordering.SEQUENTIAL`, which is the strongest
and most expensive choice. `fetch_add`, `fetch_sub`, `compare_exchange`, `max`
and `min` default to `RELAXED` on Apple GPUs, not on CPUs — check the default on
your target. Do **not** weaken the ordering without understanding the data
structure.

**Pitfall:** `compare_exchange` takes `mut expected` and *rewrites* it on
failure. The reference documents this: "Otherwise, False is returned and the
expected value is rewritten with the ptr value." A CAS retry loop must reload
`expected` from the return of the failed call; reusing the old variable is a
classic bug.

`fence[ordering=]()` creates a standalone barrier without a specific load or
store:

> "Fences create synchronization between themselves and atomic operations or
> fences in other thread without an explicit load or store to an atomic variable.
> The fence prevents reordering of certain types of memory operations around it
> as specified by the ordering parameter."
> — <https://mojolang.org/docs/std/atomic/atomic/fence/>

### `std.utils.lock`

> "This module provides low-level locking mechanisms for thread synchronization,
> including spin locks with blocking behavior and scoped lock guards for
> automatic lock management."
> — <https://mojolang.org/docs/std/utils/lock/>

| Type | Purpose |
|---|---|
| `BlockingSpinLock` | "A basic locking implementation that uses an integer to represent the owner of the lock." |
| `BlockingScopedLock[origin]` | "A scope adapter for BlockingSpinLock." |
| `SpinWaiter` | "A proxy for the C++ runtime's SpinWaiter type." |

`BlockingSpinLock` has `lock(owner)` and `unlock(owner) -> Bool`, where `owner`
is "usually an address". `BlockingScopedLock` acquires on `__enter__` and
releases on `__exit__`, which makes it usable with `with`:

```mojo
with BlockingScopedLock(lock):
    # critical section
    ...
```

(API references: <https://mojolang.org/docs/std/utils/lock/BlockingSpinLock/>,
<https://mojolang.org/docs/std/utils/lock/BlockingScopedLock/>.)

**Pitfall:** `BlockingSpinLock` is a spin lock, not a mutex. Under heavy
contention a spin lock burns CPU; use it for short critical sections. There is no
documented reentrancy or fairness guarantee either — do not hold it across a
`parallelize()` call.

### `std.utils` scope

The utils package lists "thread synchronization" among its responsibilities and
"fine-grained control over threading and indexing operations" as its use case
(<https://mojolang.org/docs/std/utils/>). It also contains `StaticTuple`,
`Variant`, `IndexList`, `Coord`, `fast_div` and `type_functions` — none of which
are concurrency features despite living in the same package.

## Synchronization across threads: what the docs do not say

There is no official page that gives a worked example of two Mojo threads sharing
data through `Atomic` and `BlockingSpinLock`, nor one that specifies a memory
model beyond the `Ordering` names. The building blocks are documented; the
patterns are not.

> **Open question:** the official docs document `Atomic` operations and
> `Ordering` constants but never state Mojo's language-level memory model or
> which orderings are guaranteed to behave as in C++/Rust. Treat `Ordering` as
> an LLVM-style memory-ordering enum and keep to `SEQUENTIAL` / `ACQUIRE_RELEASE`
> until you have evidence for weaker orderings on your target.

> **Open question:** `std.utils.lock` documents `BlockingSpinLock` and
> `BlockingScopedLock`, but there is no documented higher-level `Mutex` or
> condition variable in the 1.x stdlib. If you need blocking waits, you may have
> to build them from atomics, or use MAX/`DeviceContext` for the accelerator
> path.

## Practical guidance

| Need | Use | Why |
|---|---|---|
| Independent work over an index range | `parallelize` from `max.algorithm` | Documented, synchronous, callback-based |
| SIMD-level data parallelism in a loop | `vectorize` | Same callback model, no threads (see [vectorization and SIMD](vectorization-and-simd.md)) |
| A counter or flag shared across threads | `Atomic[DType.int]` | Documented read-modify-write operations |
| A short critical section | `BlockingSpinLock` (+ `BlockingScopedLock`) | Documented scoped acquire/release |
| A pool of concurrent tasks with results | `Task`/`TaskGroup` | Documented, but unstable and low-level |
| Async control flow | **Do not** | `async`/`await` are explicitly unstable |

Two hard rules for exported/library code:

1. **Call `initialize_runtime()` before any runtime-dependent API when there is
   no Mojo `main()`.** Otherwise the process segfaults.
2. **Re-check the import path and signature on upgrade.** The stdlib is unstable
   unless marked; `parallelize` moved from the Mojo stdlib into `max`, and the
   async API is explicitly allowed to change.

## Pitfalls

- **Calling `parallelize` a keyword.** It is a library function in
  `max.algorithm`. There is no `parallelize` keyword.
- **Forgetting `initialize_runtime()` in a shared library.** Segfault.
- **Assuming `async` is finished.** The stability page says "consider them
  unstable as well. Any async behavior may be subject to change."
- **Assuming async exists at all.** The closures page says "Mojo doesn't yet
  support async execution"; the roadmap lists first-class async as not started.
- **Weakening atomic orderings casually.** The defaults are sequential for a
  reason; weaker orderings need a proof.
- **Reusing `expected` after a failed `compare_exchange`.** It is rewritten; the
  retry loop must use the new value.
- **Holding a spin lock across a `parallelize()` call.** It is a spin lock for
  short sections, not a blocking mutex.
- **Expecting `Task.get()` to be safe on an incomplete task.** The reference
  calls that undefined behavior.
- **Writing a blocking `wait()` where a suspension was intended.** `Task.wait()`
  "does not suspend the current coroutine but instead blocks the entire thread."
- **Building on `std.algorithm.backend.cpu.parallelize` as a public import.**
  Use `from max.algorithm import parallelize`.

## Sources

- <https://mojolang.org/docs/api-docs/stability/>
- <https://mojolang.org/docs/roadmap/>
- <https://mojolang.org/docs/reference/keywords/>
- <https://mojolang.org/docs/manual/functions/closures/>
- <https://mojolang.org/docs/tools/compilation/>
- <https://mojolang.org/docs/std/runtime/>
- <https://mojolang.org/docs/std/runtime/asyncrt/>
- <https://mojolang.org/docs/std/runtime/asyncrt/initialize_runtime/>
- <https://mojolang.org/docs/std/runtime/asyncrt/parallelism_level/>
- <https://mojolang.org/docs/std/runtime/asyncrt/Task/>
- <https://mojolang.org/docs/std/runtime/asyncrt/RaisingTask/>
- <https://mojolang.org/docs/std/runtime/asyncrt/TaskGroup/>
- <https://mojolang.org/docs/std/builtin/coroutine/>
- <https://mojolang.org/docs/std/atomic/>
- <https://mojolang.org/docs/std/atomic/atomic/Atomic/>
- <https://mojolang.org/docs/std/atomic/atomic/Ordering/>
- <https://mojolang.org/docs/std/atomic/atomic/fence/>
- <https://mojolang.org/docs/std/utils/>
- <https://mojolang.org/docs/std/utils/lock/>
- <https://mojolang.org/docs/std/utils/lock/BlockingSpinLock/>
- <https://mojolang.org/docs/std/utils/lock/BlockingScopedLock/>
- <https://mojolang.org/releases/v1.0.0/>
