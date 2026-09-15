# runtime

`runtime` is the standard library's runtime-services package: explicit runtime
initialization and the low-level async task machinery.

> Runtime services: async execution and program tracing.

> The `runtime` package provides infrastructure for asynchronous task execution
> and program profiling. It includes low-level concurrency primitives for
> managing async coroutines, task groups, and parallel execution. The package
> also offers tracing utilities for performance analysis and debugging through
> various profiling backends.

> Use this package for implementing async patterns, managing concurrent
> execution, or when you need detailed profiling and performance analysis of your
> Mojo programs. It also provides `initialize_runtime()` for initializing the
> runtime explicitly when Mojo code built as a shared library is called from a
> non-Mojo host program.

Source: <https://mojolang.org/docs/std/runtime/>.

It has one module, `asyncrt`, described as "the low level concurrency library."
Source: <https://mojolang.org/docs/std/runtime/asyncrt/>.

**Read the concept page first.** [Async and
parallelism](../concurrency/async-and-parallelism.md) explains the whole picture:
`parallelize` lives in `max.algorithm`, `async`/`await` are explicitly unstable
and absent from the language reference, and this package provides the
infrastructure underneath. This page is the package-level API reference.

## `initialize_runtime()` — the one function most programs need

```text
def initialize_runtime()
```

> Initializes the global Mojo runtime if it is not already initialized. The Mojo
> runtime manages the thread pool used by parallel and asynchronous APIs such as
> `parallelize()` and `TaskGroup`. Programs with a Mojo `main()` function
> initialize the runtime automatically at startup, so most programs never need
> to call this function.

> However, when Mojo code is compiled into a shared library (with
> `mojo build --emit shared-lib`) and called from a non-Mojo host program (such
> as C or C++), no Mojo `main()` function runs and the runtime is never
> initialized. In that case, call this function before using any API that
> depends on the runtime — for example, at the start of each function exported
> with `@export`. This function is idempotent and inexpensive when the runtime is
> already initialized.

Source: <https://mojolang.org/docs/std/runtime/asyncrt/initialize_runtime/>.

The 1.0.0 release notes describe the failure it fixes:

> In that situation no Mojo `main()` runs, so the runtime was never initialized
> and parallel or asynchronous APIs such as `parallelize()` crashed.

Source: <https://mojolang.org/releases/v1.0.0/>.

```mojo
from max.algorithm import parallelize
from std.runtime import initialize_runtime

@export("fill_squares")
def fill_squares(data: Pointer[Int64, MutUntrackedOrigin], len: Int) abi("C"):
    initialize_runtime()

    @parameter
    def fill(i: Int):
        data.unsafe_store(i, Int64(i * i))

    parallelize(fill, len)
```

Source: <https://mojolang.org/docs/std/runtime/asyncrt/initialize_runtime/>.

### `parallelism_level()`

```text
def parallelism_level() -> Int
```

> Gets the parallelism level of the Runtime. … The number of worker threads
> available in the async runtime.

Source: <https://mojolang.org/docs/std/runtime/asyncrt/parallelism_level/>.

Use it to size work yourself rather than hardcoding a thread count.

## The async task API

| Item | Purpose |
|------|---------|
| `Task[type: Deinitable, origins: OriginSet]` | "Represents an asynchronous task that will produce a value of the specified type." |
| `RaisingTask[type: Movable, origins: OriginSet]` | A task that "may raise an error upon completion." |
| `TaskGroup` | "A group of tasks that can be executed concurrently." |
| `TaskGroupContext` | "Context structure for task group operations." |
| `create_task(handle, out task)` | "Run the coroutine as a task on the AsyncRT Runtime." |
| `create_raising_task(handle, out task)` | Run a raising coroutine as a task. |
| `initialize_runtime()` | Initialize the global runtime. |
| `parallelism_level()` | Worker-thread count. |

Source: <https://mojolang.org/docs/std/runtime/asyncrt/>.

### `Task`

```text
struct Task[type: Deinitable, origins: OriginSet]
    def __init__(out self, var handle: Coroutine[type, origins])
    def __await__(self) -> ref[self._result] type
    def get(self) -> ref[self._result] type
    def wait(self) -> ref[self._result] type
```

Source: <https://mojolang.org/docs/std/runtime/asyncrt/Task/>.

The distinction that matters is blocking versus suspending:

> **`wait`**: Block the current thread until the future value becomes available.
> … Unlike `__await__`, this method does not suspend the current coroutine but
> instead blocks the entire thread.

And the sharp edge on `get()`: "Calling this on an incomplete task is undefined
behavior." `__await__` "must be force inlined into the calling async function."
Source: <https://mojolang.org/docs/std/runtime/asyncrt/Task/>.

`create_task` returns through an `out` parameter:

```text
def create_task(var handle: Coroutine, out task: Task[handle.type, handle.origins])
```

Source: <https://mojolang.org/docs/std/runtime/asyncrt/create_task/>.

### `RaisingTask`

```text
struct RaisingTask[type: Movable, origins: OriginSet]
    def wait(deinit self, out result: type)
    def __await__(deinit self, out result: type)
```

> This type does not conform to `Deinitable` because only one of the result or
> error slots is valid after completion. The caller must call `wait()` to consume
> the task.

Source: <https://mojolang.org/docs/std/runtime/asyncrt/RaisingTask/>. Because it
consumes the task, the call site transfers ownership: `task^.wait(...)`.

### `TaskGroup`

```text
struct TaskGroup
    def __init__(out self)
    def create_task(mut self, var task: Coroutine[None])
    def wait[origins: OriginSet = {}](mut self)
    def __await__(mut self)
```

> **`wait`**: Wait for all tasks in the `TaskGroup` to complete. This is a
> blocking call that returns only when all tasks have finished.
>
> **`__await__`**: Make TaskGroup awaitable in async contexts. This allows using
> `await task_group` syntax in async functions.

Source: <https://mojolang.org/docs/std/runtime/asyncrt/TaskGroup/>.

## A runnable example

```mojo
from std.runtime import initialize_runtime, parallelism_level

def main():
    # With a Mojo main() this is automatic; the call is idempotent and cheap.
    initialize_runtime()
    print("worker threads:", parallelism_level())
```

Source: <https://mojolang.org/docs/std/runtime/asyncrt/parallelism_level/>.

For the supported, synchronous data-parallelism route, use `parallelize` from
`max.algorithm`; see [Async and
parallelism](../concurrency/async-and-parallelism.md) for a full example.

## Idioms

- **Call `initialize_runtime()` at the top of every `@export`ed function in a
  shared library.** It is idempotent, so there is no need to guard it.
- **Ignore it in a normal program.** A `main()` initializes the runtime for you.
- **Size work by `parallelism_level()`** instead of a literal thread count.
- **Use `parallelize` for data parallelism** and reach for `Task`/`TaskGroup`
  only when you genuinely need the async primitives.
- **Prefer `wait()` in synchronous code and `__await__` in async code**, keeping
  in mind that `wait()` blocks the whole thread.
- **Transfer ownership explicitly.** `TaskGroup.run`-style consumers and
  `RaisingTask` take `deinit self`, so pass `^`.

## Pitfalls

- **Calling a runtime-dependent API in a shared library without
  `initialize_runtime()`.** The documented symptom is a crash, not a Mojo error.
- **Building on `async`/`await`.** The stability page says "consider them
  unstable as well. Any async behavior may be subject to change," and the
  roadmap lists first-class async as not started. Source:
  <https://mojolang.org/docs/api-docs/stability/>.
- **Calling `Task.get()` before the task completes.** Documented undefined
  behavior.
- **Expecting `wait()` to yield.** It blocks the entire thread.
- **Copying a `RaisingTask`.** It is only `Movable`, not `Deinitable`, and
  `wait`/`__await__` consume it.
- **Assuming the profiling/tracing API surface is documented here.** The package
  description mentions "tracing utilities … through various profiling backends",
  but the only module listed is `asyncrt`; see the open question.
- **Reading `parallelize` as a keyword or a stdlib function.** It is a library
  function in `max.algorithm`. Source:
  <https://mojolang.org/docs/reference/keywords/>.
- **Assuming a stable API.** See below.

> **Open question:** the `runtime` package description promises "tracing
> utilities for performance analysis and debugging through various profiling
> backends", but the package page lists **only** the `asyncrt` module, and the
> module index contains no tracing or profiling symbols. It is unclear whether
> tracing lives in another package, is undocumented, or was moved. Verify before
> planning on a `std.runtime` tracing API. Sources:
> <https://mojolang.org/docs/std/runtime/>,
> <https://mojolang.org/docs/std/runtime/asyncrt/>.

## Stability

The `runtime` package page, the `asyncrt` module page and its member pages show
**no `@stable(since=...)` marker** and no stability badges. Under the
standard-library rule — "We consider standard library APIs unstable unless
specifically marked stable" — these APIs are **unstable by default**. The async
*syntax* is additionally called out as unstable. Sources:
<https://mojolang.org/docs/std/runtime/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `runtime` package: <https://mojolang.org/docs/std/runtime/>
- Mojo `asyncrt` module: <https://mojolang.org/docs/std/runtime/asyncrt/>
- Mojo `initialize_runtime`: <https://mojolang.org/docs/std/runtime/asyncrt/initialize_runtime/>
- Mojo `parallelism_level`: <https://mojolang.org/docs/std/runtime/asyncrt/parallelism_level/>
- Mojo `create_task`: <https://mojolang.org/docs/std/runtime/asyncrt/create_task/>
- Mojo `Task` struct: <https://mojolang.org/docs/std/runtime/asyncrt/Task/>
- Mojo `RaisingTask` struct: <https://mojolang.org/docs/std/runtime/asyncrt/RaisingTask/>
- Mojo `TaskGroup` struct: <https://mojolang.org/docs/std/runtime/asyncrt/TaskGroup/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
