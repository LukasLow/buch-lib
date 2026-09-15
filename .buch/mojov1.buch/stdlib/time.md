# time

`time` provides clocks, sleeps and a timing helper.

> Timing operations: monotonic clocks, performance counters, sleep,
> time_function.

> The `time` package provides utilities for measuring elapsed time, benchmarking
> code performance, and introducing delays. It offers monotonic clocks that are
> unaffected by system clock adjustments, making them suitable for measuring
> intervals and profiling execution time.

> Use this package for performance measurement, benchmarking, profiling, or when
> you need to introduce delays in your code.

Source: <https://mojolang.org/docs/std/time/>.

It has one module, `time`, whose documented example is simply
`from std.time import perf_counter_ns`. Source:
<https://mojolang.org/docs/std/time/time/>.

## The complete API

This package is small enough that the whole surface fits in one table:

| Function | Signature (documented) | Returns |
|----------|------------------------|---------|
| `perf_counter_ns` | `def perf_counter_ns() -> Int` | nanoseconds from the highest-resolution system-wide counter. |
| `perf_counter` | `def perf_counter() -> Float64` | the same counter in fractional seconds. |
| `monotonic` | `def monotonic() -> Int` | the platform's monotonic clock in nanoseconds. |
| `global_perf_counter_ns` | `def global_perf_counter_ns() -> Int` | "the current value in the global nanosecond resolution timer. This value is common across all SM's." |
| `sleep` | `def sleep(sec: Float64)` / `def sleep(sec: Int)` | suspends the current thread. |
| `time_function` | `def time_function[FuncType: def() -> None](func: FuncType) -> Int` / `def time_function[FuncType: def() raises -> None](func: FuncType) -> Int` | elapsed nanoseconds. |

Source: <https://mojolang.org/docs/std/time/time/>.

### `perf_counter_ns` and `perf_counter`

> Return the value (in nanoseconds) of a performance counter, i.e. a clock with
> the highest available resolution to measure a short duration. It does include
> time elapsed during sleep and is system-wide. The reference point of the
> returned value is undefined, so that only the difference between the results of
> two calls is valid.

Source: <https://mojolang.org/docs/std/time/time/perf_counter_ns/> (identical
wording for `perf_counter`, in seconds).

That "reference point … undefined" is the rule that matters: never interpret a
single value as a date. Subtract two readings.

```mojo
from std.time import perf_counter_ns

def main():
    var start = perf_counter_ns()
    # ... work ...
    var elapsed_ns = perf_counter_ns() - start
    print("elapsed:", elapsed_ns, "ns")
```

Source: <https://mojolang.org/docs/std/time/time/perf_counter_ns/>.

### `monotonic`

> Returns the current monotonic time time in nanoseconds. This function queries
> the current platform's monotonic clock, making it useful for measuring time
> differences, but the significance of the returned value varies depending on the
> underlying implementation.

Source: <https://mojolang.org/docs/std/time/time/monotonic/>.

`monotonic` is the right reading when wall-clock adjustments must not affect your
interval. It typically does **not** include time spent asleep on all platforms,
which is the difference from `perf_counter`; the docs do not state this
explicitly for `monotonic`, so treat the pair as "monotonic for intervals,
perf_counter for durations including sleeps."

### `global_perf_counter_ns`

> Returns the current value in the global nanosecond resolution timer. This value
> is common across all SM's.

Source: <https://mojolang.org/docs/std/time/time/global_perf_counter_ns/>. This
is the GPU-aware variant: the same timeline across streaming multiprocessors.
Use it when timings are taken on accelerators and must be compared to host
readings.

### `sleep`

```text
def sleep(sec: Float64)
def sleep(sec: Int)
```

> Suspends the current thread for the seconds specified.

Source: <https://mojolang.org/docs/std/time/time/sleep/>. The `Float64` overload
adds "Values <= 0 return immediately." Sleeping blocks the calling thread; it is
not an async yield. See [async and
parallelism](../concurrency/async-and-parallelism.md) for why that matters in
concurrent code.

```mojo
from std.time import sleep

def main():
    sleep(1)          # one second
    sleep(0.25)       # 250 ms
    sleep(-1.0)       # returns immediately
```

Source: <https://mojolang.org/docs/std/time/time/sleep/>.

### `time_function` — time a callable

```text
def time_function[FuncType: def() -> None](func: FuncType) -> Int
def time_function[FuncType: def() raises -> None](func: FuncType) -> Int
```

> Measures the time spent in the function.
>
> **Args:** `func` (`FuncType`) — The closure carrying the captured state of the
> timed function.
>
> **Returns:** `Int` — The time elapsed in the function in ns.

Source: <https://mojolang.org/docs/std/time/time/time_function/>.

Two overloads exist: one for a non-raising `def() -> None` and one for a
`def() raises -> None`. The raising form raises "[i]f the operation fails."

```mojo
from std.time import time_function

def main():
    var work = 0
    def busy():
        for i in range(100_000):
            work += i

    var elapsed_ns = time_function(busy)
    print("busy() took", elapsed_ns, "ns")
```

Source: <https://mojolang.org/docs/std/time/time/time_function/>. Note that the
timed function is a closure, so it can capture and mutate surrounding state — the
docs describe `func` as "the closure carrying the captured state of the timed
function."

## Time versus benchmarking

`time` measures **wall time of a call**. For a statistical benchmark — mean,
minimum, maximum and iteration counts — use the [`benchmark`](benchmark.md)
package instead, which reports a `Report` with those statistics. Source:
<https://mojolang.org/docs/std/benchmark/>.

The rule of thumb: `time_function`/`perf_counter_ns` for a quick check,
`benchmark` for a number you intend to report or compare.

## Idioms

- **Subtract two readings.** A raw `perf_counter_ns()` value has no absolute
  meaning.
- **Use `monotonic()` for intervals that must survive a clock adjustment**, and
  `perf_counter_ns()`/`perf_counter()` when sleeps should count toward the
  duration.
- **Use `time_function(clos)` to time a closure** rather than hand-rolling a
  start/stop pair around a call.
- **Use `global_perf_counter_ns()` when timing spans host and accelerator.**
- **Warm up before timing** if the first call does lazy initialization; run the
  measured work more than once.
- **Use `sleep(0.0)` as a yield-like pause only if you understand it blocks the
  thread** — the docs say values `<= 0` return immediately.
- **Prefer `benchmark` when the result will be published.**

## Pitfalls

- **Treating `perf_counter_ns()` as a timestamp.** The reference point is
  undefined.
- **Assuming `perf_counter` and `monotonic` measure the same thing.** Only
  `perf_counter*` is documented to include time elapsed during sleep.
- **Calling `sleep` as an async yield.** It suspends the thread, not a coroutine.
- **Assuming `sleep(Float64)` is exact.** It is a minimum delay; the OS scheduler
  can sleep longer.
- **Timing a single, cold call.** Initialization and cache effects dominate; use
  repeated runs or `benchmark`.
- **Ignoring the raise path of `time_function`.** The `raises` overload can
  raise; call it from a `raises` function.
- **Confusing `global_perf_counter_ns` with `perf_counter_ns`.** The former is
  the cross-SM timeline; the latter is the ordinary host counter.
- **Assuming a stable API.** See below.

> **Open question:** the `time` package description mentions "benchmarking code
> performance", but the `time.time` module contains no benchmark runner; that
> lives in the separate `benchmark` package. It is also unclear whether
> `monotonic()` includes time elapsed during sleep on every supported platform —
> the docs say only that its significance "varies depending on the underlying
> implementation", while `perf_counter*` explicitly includes sleep. Verify
> per platform before relying on either for a duration that spans a sleep.
> Sources: <https://mojolang.org/docs/std/time/>,
> <https://mojolang.org/docs/std/time/time/monotonic/>,
> <https://mojolang.org/docs/std/time/time/perf_counter_ns/>,
> <https://mojolang.org/docs/std/benchmark/>.

## Stability

The `time` package page, the `time.time` module page and the function pages show
**no `@stable(since=...)` marker** and no stability badges. Under the
standard-library rule — "We consider standard library APIs unstable unless
specifically marked stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/time/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `time` package: <https://mojolang.org/docs/std/time/>
- Mojo `time.time` module: <https://mojolang.org/docs/std/time/time/>
- Mojo `perf_counter_ns`: <https://mojolang.org/docs/std/time/time/perf_counter_ns/>
- Mojo `monotonic`: <https://mojolang.org/docs/std/time/time/monotonic/>
- Mojo `sleep`: <https://mojolang.org/docs/std/time/time/sleep/>
- Mojo `time_function`: <https://mojolang.org/docs/std/time/time/time_function/>
- Mojo `benchmark` package: <https://mojolang.org/docs/std/benchmark/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
