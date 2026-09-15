# benchmark

`benchmark` measures and analyzes the performance of Mojo code.

> Performance benchmarking: statistical analysis and detailed reports.

> The `benchmark` package provides tools for measuring and analyzing the
> performance of Mojo code. It enables statistical benchmarking with automatic
> warmup, batch execution, and comprehensive reporting including mean, min, max,
> and total time statistics across multiple runs.

Source: <https://mojolang.org/docs/std/benchmark/>.

## `run`: the primary API

Pass any function to `run()` and get back a `Report`:

```mojo
from std.benchmark import run
from std.time import sleep

def sleeper():
    sleep(.01)

var report = run(sleeper)
print(report.mean())
```

```output
0.012256487394957985
```

Source: <https://mojolang.org/docs/std/benchmark/>.

`run` is parameterized by the work it measures and takes four numeric arguments
that control the run. The documented defaults are automatic warmup and batches;
the arguments are, in order:

```mojo
var r = run(sleeper, 5)          # warmup iterations = 5
var r2 = run(sleeper, 1, 2, 3, 4) # warmup=1, max iters=2, min total time=3s, max total time=4s
```

The official note on precedence: "Note that the min total time will take
precedence over max iterations."

Source: <https://mojolang.org/docs/std/benchmark/>.

## `Report`

`Report` "Contains the average execution time, iterations, min and max of each
batch." It has three reporting methods:

| Method | What it prints |
|--------|----------------|
| `report.print()` | The summary report. |
| `report.print_full()` | The summary **plus every batch**. |
| `report.mean(unit)` | A single number — the mean in the requested unit. |

Source: <https://mojolang.org/docs/std/benchmark/>.

```mojo
from std.benchmark import run
from std.time import sleep

def sleeper():
    sleep(.01)

var report = run(sleeper)
report.print()
```

```output
---------------------
Benchmark Report (s)
---------------------
Mean: 0.012265747899159664
Total: 1.459624
Iters: 119
Warmup Mean: 0.01251
Warmup Total: 0.025020000000000001
Warmup Iters: 2
Fastest Mean: 0.0121578
Slowest Mean: 0.012321428571428572
```

`print_full()` adds one block per batch:

```output
Batch: 1
Iterations: 20
Mean: 0.012508099999999999
Duration: 0.250162
...
```

Source: <https://mojolang.org/docs/std/benchmark/>.

## Units

The `Unit` type selects the time unit. `Unit.s` is the default; `Unit.ms` is the
documented alternative:

```mojo
from std.benchmark import run, Unit
from std.time import sleep

def sleeper():
    sleep(.01)

var report = run(sleeper)
report.print(Unit.ms)
```

```output
---------------------
Benchmark Report (ms)
---------------------
...
```

The units are "just aliases for string constants", so passing a plain string
works too:

```mojo
print(report.mean("ms"))   # 12.199145299145298
```

Source: <https://mojolang.org/docs/std/benchmark/>.

## Modules in the package

| Module | What it provides |
|--------|------------------|
| `bencher` | "Comprehensive benchmarking infrastructure with statistical analysis" — `Bencher`, `Bench`, `BenchConfig`, `BenchId`, `BenchMetric`, `BenchmarkInfo`, `Format`, `Mode`, `ThroughputMeasure`. |
| `benchmark` | "The benchmark module for runtime benchmarking" — `Batch`, `Report`, `Unit`, `run`. |
| `compiler` | `black_box` and `keep`: hints that prevent the compiler from optimizing the measured work away. |
| `memory` | `clobber_memory`: forces pending memory writes to memory. |
| `quick_bench` | `QuickBench`: "a struct to facilitate benchmarking and avoiding `Bencher` boilerplate." |

Source: <https://mojolang.org/docs/std/benchmark/>.

`black_box` is the one to remember. It "Prevents the compiler from optimizing
away computations or values" — without it, a benchmark of a pure computation can
measure an empty loop. Source:
<https://mojolang.org/docs/std/benchmark/compiler/black_box/>.

This page is a **curated selection**: `bencher` has a large surface
(`BenchConfig`, `ThroughputMeasure`, report formats, modes) that most code never
needs. Start with `run`/`Report` and reach into `bencher` only for custom
throughput metrics.

## Idioms

- **Benchmark a function that does real work.** `run(sleeper)` is the documented
  example precisely because it is unambiguous.
- **Let `run` decide the iteration count.** The defaults do warmup and batch
  sizing; override only when you need a time bound.
- **Report the unit you care about.** Seconds for a summary, milliseconds for a
  human eyeballing a small difference.
- **Feed `black_box` a value whose computation must not be optimized away.**

## Pitfalls

- **Benchmarking something the compiler eliminates.** Use `black_box`/`keep` from
  `std.benchmark.compiler`. Source:
  <https://mojolang.org/docs/std/benchmark/compiler/black_box/>.
- **Overriding iterations without understanding precedence.** "the min total time
  will take precedence over max iterations." Source:
  <https://mojolang.org/docs/std/benchmark/>.
- **Comparing means from very different iteration counts.** Read `Fastest Mean`
  and `Slowest Mean`, and use `print_full()` to see the batch spread.
- **Using `benchmark` as a micro-optimization oracle.** Timings are noisy; change
  one thing at a time.
- **Confusing `benchmark` (this package) with the `Bench`/`Bencher` types.** The
  package has a module also named `benchmark`; imports are explicit
  (`from std.benchmark import run`).

## Stability

The `benchmark` package page shows **no `@stable(since=...)` marker** and no
stability badge on any of its modules. Under the standard-library rule — "We
consider standard library APIs unstable unless specifically marked stable" —
these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/benchmark/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `benchmark` package: <https://mojolang.org/docs/std/benchmark/>
- Mojo `benchmark.run`: <https://mojolang.org/docs/std/benchmark/benchmark/run/>
- Mojo `benchmark.bencher` module: <https://mojolang.org/docs/std/benchmark/bencher/>
- Mojo `black_box`: <https://mojolang.org/docs/std/benchmark/compiler/black_box/>
- Mojo `quick_bench` module: <https://mojolang.org/docs/std/benchmark/quick_bench/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
