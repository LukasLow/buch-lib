# random

`random` provides pseudorandom numbers: a convenient global generator with
package-level functions, plus explicit generator types for reproducible
sequences.

> Pseudorandom number generation with uniform and normal distributions.

> The `random` package provides pseudorandom number generation for simulations,
> games, and statistical applications. It offers both a convenient global PRNG
> state accessed through package-level functions and explicit generator types for
> reproducible sequences. The package supports uniform and normal (Gaussian)
> distributions for various numeric types.

> Use this package for Monte Carlo simulations, stochastic algorithms, random
> sampling, or testing with randomized inputs. This package's functionality is
> not cryptographically secure and should not be used for security-sensitive
> applications.

Source: <https://mojolang.org/docs/std/random/>.

## Not for security

The warning is repeated at the module level and is the first thing to know:

> **Warning:** NOT cryptographically secure. This PRNG is suitable for
> simulations, games, and general statistical purposes, but shouldn't be used for
> security-sensitive applications such as generating passwords, authentication
> tokens, or encryption keys.

Source: <https://mojolang.org/docs/std/random/random/>.

For passwords, tokens or keys, this package is the wrong tool. The official docs
do not name a cryptographic alternative in the standard library; see the open
question below.

## Modules and types

| Module | Contents |
|--------|----------|
| `random` | Package-level functions over a shared global PRNG state. |
| `philox` | `Random` and `NormalRandom` — counter-based Philox generators. |

Source: <https://mojolang.org/docs/std/random/>.

## The global-state functions

> These functions use a shared, global pseudorandom number generator (PRNG)
> state. The global random state is shared across threads and concurrent access
> can cause race conditions and undefined behavior.

Source: <https://mojolang.org/docs/std/random/random/>.

That makes the convenience functions single-threaded tools. In parallel code,
use one `philox.Random` per thread with distinct `subsequence` values.

| Function | Signature (documented) | Range |
|----------|------------------------|-------|
| `seed()` / `seed(a)` | `def seed()` / `def seed(a: Int)` | seed from time / from a value. |
| `random_float64` | `def random_float64(min: Float64 = 0, max: Float64 = 1) -> Float64` | `[min, max)`. |
| `random_si64` | `def random_si64(min: Int64, max: Int64) -> Int64` | `[min, max]` (inclusive). |
| `random_ui64` | `def random_ui64(min: UInt64, max: UInt64) -> UInt64` | `[min, max]` (inclusive). |
| `randn_float64` | `def randn_float64(mean: Float64 = 0, standard_deviation: Float64 = 1) -> Float64` | Normal(mean, stddev). |
| `rand[dtype]` | `def rand[dtype: DType](span: Span[Scalar[dtype]], /, *, min: Float64 = 0, max: Float64 = 1, int_scale: Optional[Int] = None)` | fills a span. |
| `randint[dtype]` | `def randint[dtype: DType](span: Span[Scalar[dtype]], low: Int, high: Int) where dtype.is_integral()` | fills a span with integers in `[low, high]`. |
| `randn[dtype]` | fills memory from a normal distribution. | |
| `shuffle[T: Copyable]` | `def shuffle(mut list: List[T])` | in-place Fisher-Yates. |

Sources: <https://mojolang.org/docs/std/random/random/seed/>,
<https://mojolang.org/docs/std/random/random/random_float64/>,
<https://mojolang.org/docs/std/random/random/random_si64/>,
<https://mojolang.org/docs/std/random/random/random_ui64/>,
<https://mojolang.org/docs/std/random/random/randn_float64/>,
<https://mojolang.org/docs/std/random/random/rand/>,
<https://mojolang.org/docs/std/random/random/randint/>,
<https://mojolang.org/docs/std/random/random/shuffle/>.

Watch the interval convention: `random_float64` excludes `max`, while
`random_si64`/`random_ui64` include it. A caller that assumes a half-open range
everywhere gets `max` occasionally.

### A runnable example

```mojo
from std.random import (
    random_float64,
    random_si64,
    random_ui64,
    randn_float64,
    seed,
    shuffle,
)

def main():
    seed()                       # time-based; use seed(123456) for a fixed run
    print(random_float64())      # in [0.0, 1.0)
    print(random_float64(10.0, 20.0))
    print(random_si64(-100, 100))   # inclusive
    print(random_ui64(0, 100))      # inclusive
    print(randn_float64(0.0, 1.0))  # Normal(0, 1)

    var items: List[Int] = [0, 1, 2, 3, 4, 5]
    shuffle(items)               # in-place
    print(items)
```

Sources: <https://mojolang.org/docs/std/random/random/random_float64/>,
<https://mojolang.org/docs/std/random/random/random_si64/>,
<https://mojolang.org/docs/std/random/random/random_ui64/>,
<https://mojolang.org/docs/std/random/random/randn_float64/>,
<https://mojolang.org/docs/std/random/random/shuffle/>.

### Filling a span

The bulk form writes into a `Span`, and the documented example passes a `List`
directly because a `List` converts to a `Span` of its elements:

```mojo
from std.random import randint, seed

def main():
    seed()
    var size = 10
    var data = List[Int32](length=size, fill=0)
    randint(data, -50, 50)
    for i in range(size):
        print(data[i])   # random Int32 between -50 and 50
```

Source: <https://mojolang.org/docs/std/random/random/randint/>.

`rand` behaves differently by dtype — "Floating-point types sample values
uniformly from `[min, max)`. Integral types sample values uniformly from
`[min, max]`, clamped to the representable range of the dtype" — and accepts an
optional `int_scale` for quantizing floats to increments of `2^(-int_scale)`.
Source: <https://mojolang.org/docs/std/random/random/rand/>.

## The Philox generators

For reproducibility and parallel safety, construct a generator explicitly:

```text
struct Random[rounds: Int = Int(10)]
    def __init__(out self, *, seed: UInt64 = UInt64(67280421310721), subsequence: UInt64 = UInt64(0), offset: UInt64 = UInt64(0))
    def step(mut self) -> SIMD[DType.uint32, SIMDLength(4)]
    def step_uniform(mut self) -> SIMD[DType.float32, SIMDLength(4)]
    def step_uniform_unbiased(mut self) -> SIMD[DType.float32, SIMDLength(4)]
```

Source: <https://mojolang.org/docs/std/random/philox/Random/>. The docs describe
the design as "a counter-based random number generator designed for parallel
computing" that "works efficiently on both CPU and GPU", and list its support
for "[s]eeding for reproducible sequences", "[m]ultiple independent
subsequences", "configurable number of rounds" and "vectorized operations".
Source: <https://mojolang.org/docs/std/random/philox/>.

Each `step()` produces four 32-bit words; `step_uniform()` maps them to four
`float32` values in `[0,1)`; `step_uniform_unbiased()` produces values in
`(0, 1)` bounded away from zero so that `log(u)` in a Box-Muller transform needs
no guard. Source: <https://mojolang.org/docs/std/random/philox/Random/>.

```mojo
from std.random.philox import Random

def main():
    var rng = Random(seed=42)
    var uniform = rng.step_uniform()   # 4 float32 values in [0,1)
    var raw = rng.step()               # 4 uint32 values
    print(uniform)
    print(raw)
```

Source: <https://mojolang.org/docs/std/random/philox/>.

### NormalRandom

```text
struct NormalRandom[rounds: Int = Int(10)]
    def __init__(out self, *, seed: UInt64 = UInt64(67280421310721), subsequence: UInt64 = UInt64(0), offset: UInt64 = UInt64(0))
    def step_normal(mut self, mean: Float32 = 0, stddev: Float32 = 1) -> SIMD[DType.float32, SIMDLength(8)]
    def step_normal_4(mut self, mean: Float32 = 0, stddev: Float32 = 1) -> SIMD[DType.float32, SIMDLength(4)]
```

`NormalRandom` uses "the Box-Muller transform … a method for generating pairs of
independent standard normal random variables." Source:
<https://mojolang.org/docs/std/random/philox/NormalRandom/>. `step_normal`
yields 8 lanes; `step_normal_4` yields 4 from a single Philox step.

## Idioms

- **Call `seed(value)` (or `seed()`) once at startup.** Without seeding, the
  global state starts at a fixed value; `seed()` uses a time-based value.
- **Use `seed(<fixed>)` in tests** so a failing random case is reproducible.
- **Use the bulk `rand`/`randint`/`randn` span forms** when filling arrays; they
  amortize per-value call overhead.
- **Use `philox.Random` with distinct `subsequence` values per thread** instead
  of the global state in parallel code.
- **Use `step_uniform_unbiased()` before `log()`** in custom math transforms.
- **Use `shuffle()` for in-place permutation** of a `List[T: Copyable]`.
- **Remember the inclusive/exclusive split** between `random_float64` and
  `random_si64`/`random_ui64`.
- **Test with a boundary value.** A `random_si64(0, 1)` can legitimately return
  `1`; do not write `if random_si64(0, 1):` as a coin flip.

## Pitfalls

- **Using `random` for secrets.** It is "NOT cryptographically secure" and must
  not generate passwords, tokens or keys. Source:
  <https://mojolang.org/docs/std/random/random/>.
- **Sharing the global PRNG across threads.** "The global random state is shared
  across threads and concurrent access can cause race conditions and undefined
  behavior." Source: <https://mojolang.org/docs/std/random/random/>.
- **Forgetting to seed.** Reproducibility is opt-in via `seed(a)`.
- **Assuming all ranges are half-open.** `random_si64`/`random_ui64` include
  `max`.
- **Calling `randint` on a floating-point span.** It is constrained
  `where dtype.is_integral()`. Source:
  <https://mojolang.org/docs/std/random/random/randint/>.
- **Assuming `shuffle` works on any list.** The element type must be
  `Copyable`. Source: <https://mojolang.org/docs/std/random/random/shuffle/>.
- **Expecting `step()` to return one value.** It returns a 4-lane SIMD vector.
- **Using the `philox` default seed believing it is random.** It is a fixed
  constant (`67280421310721`); pass your own `seed=` for a distinct stream.
- **Assuming a stable API.** See below.

> **Open question:** the package states it is not cryptographically secure but
> does not point at a cryptographic alternative in the Mojo standard library.
> Whether one exists (for example in `hashlib`) is not documented as a CSPRNG;
> verify against the current stdlib before relying on any stdlib API for
> security-sensitive randomness. Sources:
> <https://mojolang.org/docs/std/random/>,
> <https://mojolang.org/docs/std/random/random/>,
> <https://mojolang.org/docs/std/hashlib/>.

## Stability

The `random` package page, the `random.random` module page and the `philox`
pages show **no `@stable(since=...)` marker** and no stability badges. Under the
standard-library rule — "We consider standard library APIs unstable unless
specifically marked stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/random/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `random` package: <https://mojolang.org/docs/std/random/>
- Mojo `random.random` module: <https://mojolang.org/docs/std/random/random/>
- Mojo `philox` module: <https://mojolang.org/docs/std/random/philox/>
- Mojo `Random` struct: <https://mojolang.org/docs/std/random/philox/Random/>
- Mojo `NormalRandom` struct: <https://mojolang.org/docs/std/random/philox/NormalRandom/>
- Mojo `seed` function: <https://mojolang.org/docs/std/random/random/seed/>
- Mojo `random_float64` function: <https://mojolang.org/docs/std/random/random/random_float64/>
- Mojo `random_si64` function: <https://mojolang.org/docs/std/random/random/random_si64/>
- Mojo `random_ui64` function: <https://mojolang.org/docs/std/random/random/random_ui64/>
- Mojo `randn_float64` function: <https://mojolang.org/docs/std/random/random/randn_float64/>
- Mojo `rand` function: <https://mojolang.org/docs/std/random/random/rand/>
- Mojo `randint` function: <https://mojolang.org/docs/std/random/random/randint/>
- Mojo `shuffle` function: <https://mojolang.org/docs/std/random/random/shuffle/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
