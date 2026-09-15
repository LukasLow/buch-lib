# complex

`complex` provides complex-number arithmetic, including SIMD vectors of complex
values.

> Complex numbers: SIMD types, scalar types, and operations.

> The `complex` package provides types and operations for complex number
> arithmetic in Mojo. It supports both scalar complex values and SIMD vectors of
> complex numbers, enabling efficient vectorized complex arithmetic. The package
> implements standard complex operations including arithmetic, conjugation,
> magnitude calculation, and exponential functions.

> Use this package for numerical computing with complex numbers, signal
> processing, Fourier transforms, or any algorithm requiring complex arithmetic.

Source: <https://mojolang.org/docs/std/complex/>.

## `ComplexSIMD`

The package's type is `ComplexSIMD`, exported from the `complex` module:

> Represents a complex SIMD value.

Source: <https://mojolang.org/docs/std/complex/complex/ComplexSIMD/>.

The module description adds the key detail: "Implements the Complex dtype." So a
complex value is built on the same `DType`/`SIMD` machinery as the numeric types
in [`builtin`](builtin.md): a complex number at width `w` is a vector of `w`
complex elements.

`ComplexSIMD` provides `abs`, which "Performs elementwise abs (norm) on each
element of the complex value". Source:
<https://mojolang.org/docs/std/complex/complex/abs/>.

## A runnable example

```mojo
from std.complex.complex import ComplexSIMD

def main():
    # A complex number has a real and an imaginary component.
    var z = ComplexSIMD[DType.float64, 1](1.0, 2.0)

    # Arithmetic behaves elementwise.
    var w = ComplexSIMD[DType.float64, 1](3.0, -1.0)
    print(z + w)        # 4.0 + 1.0j

    # abs() is the magnitude (norm).
    print(z.abs())      # 2.23606797749979

    # A width-4 complex vector processes four complex numbers at once.
    var vz = ComplexSIMD[DType.float64, 4](1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0)
    print(vz.abs())
```

Sources: <https://mojolang.org/docs/std/complex/>,
<https://mojolang.org/docs/std/complex/complex/>,
<https://mojolang.org/docs/std/complex/complex/ComplexSIMD/>.

## Idioms

- **Think in SIMD widths, like every other numeric type.** `ComplexSIMD[dtype, w]`
  is the general form; a scalar complex value is the `w == 1` case. This is the
  same model as `Scalar` for the real numeric types (see
  [`builtin`](builtin.md)).
- **Use `abs()` for magnitude.** It is the documented norm operation.
- **Parameterize on `DType`** so the same code works for `float32` and
  `float64`.
- **Keep complex data in SIMD form** when doing signal processing or FFT-style
  work; that is what the package's SIMD support is for.

## Pitfalls

- **Expecting a separate scalar `Complex` type.** The package documents
  `ComplexSIMD`; the scalar case is a width-1 vector. Source:
  <https://mojolang.org/docs/std/complex/complex/ComplexSIMD/>.
- **Mixing complex and real SIMD types without conversion.** Convert explicitly,
  as with the real numeric types.
- **Assuming `abs` returns a real `Float64` in every overload.** On a SIMD
  complex value it is an *elementwise* operation, so it returns a vector of
  magnitudes. Source:
  <https://mojolang.org/docs/std/complex/complex/abs/>.
- **Using `complex` as a keyword or built-in name.** It is a library package;
  import `ComplexSIMD` explicitly.

> **Open question:** the package page promises "arithmetic, conjugation,
> magnitude calculation, and exponential functions", but the package-level
> Markdown lists only `ComplexSIMD` and `abs` as documented symbols. The exact
> names of the conjugation and exponential entry points are not shown there;
> read the `complex` module page
> (<https://mojolang.org/docs/std/complex/complex/>) before relying on a
> specific spelling.

## Stability

The `complex` package page and its module page show **no `@stable(since=...)`
marker** and no stability badges. Under the standard-library rule — "We consider
standard library APIs unstable unless specifically marked stable" — these APIs
are **unstable by default**. Sources:
<https://mojolang.org/docs/std/complex/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `complex` package: <https://mojolang.org/docs/std/complex/>
- Mojo `complex` module: <https://mojolang.org/docs/std/complex/complex/>
- Mojo `ComplexSIMD` struct: <https://mojolang.org/docs/std/complex/complex/ComplexSIMD/>
- Mojo `abs` (complex): <https://mojolang.org/docs/std/complex/complex/abs/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
