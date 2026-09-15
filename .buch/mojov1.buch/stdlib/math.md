# math

`math` is Mojo's mathematical function and constant library.

> Math functions and constants: trig, exponential, logarithmic, and special
> functions.

> The `math` package provides mathematical functions and constants for numerical
> computation. It includes standard mathematical operations from trigonometry,
> exponential and logarithmic functions, special functions, and numerical
> utilities. This package implements both precise mathematical operations and fast
> approximations for performance-critical code, along with support for rounding,
> clamping, and IEEE 754 floating-point behavior.

Source: <https://mojolang.org/docs/std/math/>.

## Modules

| Module | What it provides |
|--------|------------------|
| `constants` | `pi`, `e`, `tau`, `log2e` |
| `math` | The bulk of the functions (trig, exp, log, special, rounding, integer math) |
| `fast` | "Fast math approximation utilities" |
| `polynomial` | "Two implementations for evaluating polynomials" (`polynomial_evaluate`) |
| `uutils` | "Utilities for doing unsigned division and modulo operations on `Int`" |

Source: <https://mojolang.org/docs/std/math/>.

## Constants

```mojo
from std.math import pi, e, tau, log2e
```

| Constant | Value (from the docs) |
|----------|-----------------------|
| `pi` | `3.1415926535897931` — π |
| `e` | `2.7182818284590451` — Euler's constant |
| `tau` | `6.2831853071795862` — 2π |
| `log2e` | `1.4426950408889634` — log₂(e) |

Source: <https://mojolang.org/docs/std/math/constants/>.

## Functions — curated

The `math` module has around 60 functions. These are the ones an agent reaches
for.

### Rounding and integer math

| Function | What it does |
|----------|--------------|
| `abs(x)` | Absolute value. |
| `floor(x)` / `ceil(x)` / `round(x)` / `trunc(x)` | Rounding. |
| `divmod(a, b)` | "Performs division and returns the quotient and the remainder." |
| `ceildiv(num, den)` | "Return the rounded-up result of dividing numerator by denominator." |
| `clamp(v, lo, hi)` | "Clamps the integer value vector to be in a certain range." |
| `align_up(v, alignment)` / `align_down(v, alignment)` | Nearest multiple of `alignment`. |
| `gcd(a, b)` / `lcm(a, b)` | Greatest common divisor / least common multiple. |
| `factorial(n)` | The factorial of the integer. |
| `comb(n, k)` | Binomial coefficient. |
| `perm(n, k)` | Permutations. |
| `max(x, y)` / `min(x, y)` | Elementwise maximum / minimum. |

### Trigonometry

`sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `sinh`, `cosh`, `tanh`,
`asinh`, `acosh`, `atanh`, `hypot`.

### Exponential and logarithmic

`exp`, `exp2`, `expm1`, `log`, `log2`, `log10`, `log1p`, `logb`, `frexp`,
`ldexp`, `scalb`, `sqrt`, `cbrt`, `rsqrt`, `recip`, `pow(base, exp)`.

### Special functions and floating point

`erf`, `erfc`, `gamma`, `lgamma`, `j0`, `j1`, `y0`, `y1`, `copysign`, `fma`,
`remainder`, `modf`, `ulp`, `isclose`, `iota`.

Sources: <https://mojolang.org/docs/std/math/math/>,
<https://mojolang.org/docs/std/math/>.

## A runnable example

```mojo
from std.math import pi, sqrt, pow, gcd, lcm, clamp, divmod, isclose, iota

def main():
    print(pi)                          # 3.141592653589793
    print(sqrt(16.0))                  # 4.0
    print(pow(2.0, 10.0))              # 1024.0
    print(gcd(12, 18))                 # 6
    print(lcm(4, 6))                   # 12

    print(clamp(15, 0, 10))            # 10

    var (q, r) = divmod(17, 5)
    print(q, r)                        # 3 2

    print(isclose(0.1 + 0.2, 0.3))     # True (tolerance-based)

    # iota builds an increasing SIMD sequence.
    print(iota[DType.int32, 4]())      # [0, 1, 2, 3]
    print(iota[DType.int32, 4](offset=10))  # [10, 11, 12, 13]
```

Sources: <https://mojolang.org/docs/std/math/math/>,
<https://mojolang.org/docs/std/math/math/iota/>,
<https://mojolang.org/docs/std/math/math/gcd/>,
<https://mojolang.org/docs/std/math/math/isclose/>.

## Traits

The module also defines traits for types that support a math operation, so your
own type can plug into generic numeric code: `Absable`, `Ceilable`, `CeilDivable`,
`CeilDivableRaising`, `DivModable`, `Floorable`, `Powable`, `Roundable`,
`Truncable`. Source: <https://mojolang.org/docs/std/math/math/>.

```mojo
struct Fixed(Absable):
    var value: Float64

    def __abs__(self) -> Self:
        return Fixed(abs(self.value))
```

## Fast approximations

The `fast` module is for code that trades precision for speed. The `math` module
also exports `exp_approx_f32`: "Computes a fast approximate e^x for SIMD vectors
of 32-bit floats using the base-2 approximation as a backend." Source:
<https://mojolang.org/docs/std/math/math/>.

## Unsigned integer utilities

`uutils` targets the common pattern of treating a signed `Int` as unsigned:
`ufloordiv`, `umod`, `udivmod`, `uceildiv`, `ualign_up`, `ualign_down`, plus the
`udiv_unchecked`/`udivmod_unchecked` variants. Source:
<https://mojolang.org/docs/std/math/uutils/>.

## Polynomial evaluation

`polynomial_evaluate` "Evaluates the polynomial." The module provides "two
implementations for evaluating polynomials" (for example Horner versus Estrin).
Source: <https://mojolang.org/docs/std/math/polynomial/>.

## Idioms

- **Import the constants from `std.math`.** `from std.math import pi` is the
  documented path.
- **Use `isclose` for float comparison, never `==`.** Floating-point addition is
  not associative; `0.1 + 0.2 == 0.3` is not guaranteed, `isclose` handles the
  tolerance.
- **Use `gcd`/`lcm`/`comb`/`perm` rather than loops.** They are exact integer
  algorithms.
- **Reach for `fast` only after measuring.** Precision loss is a real trade.
- **Use `uutils` when the sign bit is semantically noise**, for example when
  hashing or doing modular arithmetic on `Int`.

## Pitfalls

- **Comparing floats with `==`.** Use `isclose`. Source:
  <https://mojolang.org/docs/std/math/math/isclose/>.
- **Confusing `clamp` (a method on `SIMD`) with `min`/`max` (free functions).**
  The numeric-types reference calls this out explicitly.
- **Expecting one `log`.** There are `log` (natural), `log2`, `log10`, `log1p`
  and `logb` — pick the base you mean.
- **Assuming `fast` functions are drop-in.** They are approximations by design.
- **Forgetting `divmod` returns a tuple.** Unpack it: `var (q, r) = divmod(a, b)`.
- **Using `math` for bit tricks.** That is [`bit`](bit.md).
- **Assuming a stable API.** See below.

## Stability

The `math` package page, the `constants`, `math`, `fast`, `polynomial` and
`uutils` module pages, and the `Absable`-family trait pages show **no
`@stable(since=...)` markers** and no stability badges. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/math/>,
<https://mojolang.org/docs/api-docs/stability/>.

This page is a **curated selection** of roughly 60 functions.

## Sources

- Mojo `math` package: <https://mojolang.org/docs/std/math/>
- Mojo `math` module: <https://mojolang.org/docs/std/math/math/>
- Mojo `constants` module: <https://mojolang.org/docs/std/math/constants/>
- Mojo `fast` module: <https://mojolang.org/docs/std/math/fast/>
- Mojo `polynomial` module: <https://mojolang.org/docs/std/math/polynomial/>
- Mojo `uutils` module: <https://mojolang.org/docs/std/math/uutils/>
- Mojo `isclose`: <https://mojolang.org/docs/std/math/math/isclose/>
- Mojo `gcd`: <https://mojolang.org/docs/std/math/math/gcd/>
- Mojo `iota`: <https://mojolang.org/docs/std/math/math/iota/>
- Mojo `clamp`: <https://mojolang.org/docs/std/math/math/clamp/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
