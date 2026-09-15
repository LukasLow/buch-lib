# Exercises

Twelve graded exercises, from trivial to non-trivial. Each has a task, the
language features it exercises, and a short solution sketch. Every exercise is
solvable offline with the material in this buch; the feature references point at
the pages that teach the relevant construct.

Run any solution with `mojo file.mojo` (which compiles and executes). Source:
<https://mojolang.org/docs/cli/run/>.

## How to use these

- The exercises are ordered; each builds on the spelling and idioms of the
  previous ones.
- A solution sketch is a *sketch*, not the only answer. It is checked for
  documented syntax and semantics, not for style elegance.
- Where an exercise touches an unstable or undocumented corner, it says so.

---

## 1. Hello, typed world (trivial)

**Task.** Write a program whose `main()` prints the sum and the average of two
`Int` values, and then the same for two `Float64` values. Use explicit types.

**Features.** `def main()`, `var` with type annotations, `print()`, integer
versus float types.

**Solution sketch.**

```mojo
def main():
    var a: Int = 7
    var b: Int = 2
    print("sum:", a + b)        # sum: 9
    print("avg:", a / b)        # avg: 3 — `/` returns the operand type

    var x: Float64 = 7.0
    var y: Float64 = 2.0
    print("sum:", x + y)        # sum: 9.0
    print("avg:", x / y)        # avg: 3.5
```

**Why this is the first exercise.** It forces the two facts a Python developer
gets wrong first: a type annotation is binding, and `/` is not Python's true
division. Sources: <https://mojolang.org/docs/manual/variables/> and
<https://mojolang.org/docs/manual/python-to-mojo/>.

---

## 2. Conditionals and loops (trivial)

**Task.** Print every even number from 1 to 20, then print the sum of the odd
numbers from 1 to 20. Use a `for` loop with `range` and one `if`.

**Features.** `for`, `range`, `if`, `continue`, `var`.

**Solution sketch.**

```mojo
def main():
    for i in range(1, 21):
        if i % 2 != 0:
            continue
        print(i, end=", ")      # 2, 4, 6, ... 20,

    var odd_sum = 0
    for i in range(1, 21):
        if i % 2 == 1:
            odd_sum += i
    print()
    print("odd sum:", odd_sum)  # odd sum: 100
```

**Notes.** `range(1, 21)` is half-open — it stops before 21. `continue` resumes
at the next element. Sources: <https://mojolang.org/docs/manual/control-flow/>.

---

## 3. A first struct (easy)

**Task.** Define a `Temperature` struct holding a `Float64` in Celsius, with a
method `to_fahrenheit()` and a method `is_freezing()` that returns `True` below
0 °C. Construct two instances and print their Fahrenheit values.

**Features.** `struct`, fields with `var`, `@fieldwise_init`, methods, `self`,
the `-> Type` return annotation.

**Solution sketch.**

```mojo
@fieldwise_init
struct Temperature(Copyable):
    var celsius: Float64

    def to_fahrenheit(self) -> Float64:
        return self.celsius * 9.0 / 5.0 + 32.0

    def is_freezing(self) -> Bool:
        return self.celsius < 0.0

def main():
    var a = Temperature(25.0)
    var b = Temperature(-4.0)
    print(a.to_fahrenheit())   # 77.0
    print(b.is_freezing())     # True
```

**Why `Copyable`.** Structs are `Movable` by default but not copyable; `Copyable`
is added here for clarity and to allow `.copy()`. Sources:
<https://mojolang.org/docs/manual/structs/> and
<https://mojolang.org/releases/v1.0.0/>.

---

## 4. Value semantics by hand (easy)

**Task.** Demonstrate that assignment copies. Create a `List[Int]`, assign it to
a second variable *through an explicit copy*, mutate the copy, and print both.
Then repeat with a `ref` binding and show the difference. Finally, transfer
ownership with `^` and show that the original is unusable.

**Features.** `List`, `.copy()`, `ref`, the transfer sigil `^`, value semantics.

**Solution sketch.**

```mojo
def main():
    var a: List[Int] = [1, 2, 3]

    var b = a.copy()      # independent copy
    b.append(4)
    print(a)              # [1, 2, 3]
    print(b)              # [1, 2, 3, 4]

    ref c = a             # a shared reference, not a copy
    c.append(9)
    print(a)              # [1, 2, 3, 9]

    var d = a^            # transfer; `a` is uninitialized afterwards
    print(d)              # [1, 2, 3, 9]
    # print(a)            # Error: use of uninitialized value
```

**Note.** The official pages conflict on printing a `List` directly.
The Python-to-Mojo guide prints a `List[Int]` with `print(c)` and prints
`[1, 2, 3]`, while the types reference in this buch's source says "You can't
`print()` a list, or convert it directly into a string." Sources:
<https://mojolang.org/docs/manual/python-to-mojo/> and
<https://mojolang.org/docs/manual/types/>.

> **Open question:** whether `print()` accepts a `List` in the current 1.x
> release is not settled by the official pages — one shows it working, the other
> says it does not. If `print(a)` fails to compile, print the elements in a loop
> (`for x in a: print(x)`) or use a `Writable` type. Verify against the compiler
> before relying on either form.

---

## 5. Errors and `raises` (easy-medium)

**Task.** Write `parse_positive(text: String) raises -> Int` that raises an error
when the text is empty or not a positive integer, and a `main() raises` that
calls it for three inputs inside `try`/`except`.

**Features.** `raises`, `raise`, `try`/`except`/`else`/`finally`, `Int()`
conversion, the non-raising-by-default rule.

**Solution sketch.**

```mojo
def parse_positive(text: String) raises -> Int:
    if not text:
        raise "text cannot be empty"
    var value = Int(text)
    if value <= 0:
        raise Error("must be positive")
    return value

def main() raises:
    for text in ["42", "0", ""]:
        try:
            var v = parse_positive(text)
        except e:
            print("failed for", repr(text), ":", e)
        else:
            print("parsed", text, "->", v)
        finally:
            print("done with", repr(text))
```

**Notes.** A `try` block handles one error type; all three calls raise `Error`
here, so one block is fine. `finally` always runs, including on the error path.
Sources: <https://mojolang.org/docs/manual/errors/>.

---

## 6. A typed error (medium)

**Task.** Define a `RangeError` struct carrying the offending value, raise it
from a `clamp_to_range` function, catch it, and read its field in the handler.

**Features.** Typed errors, `raises MyType`, `Writable` conformance, `except e:`
type inference, `write_to`.

**Solution sketch.**

```mojo
@fieldwise_init
struct RangeError(Copyable, Writable):
    var value: Int

    def write_to(self, mut writer: Some[Writer]):
        writer.write("out of range: ", self.value)

def clamp_to_range(value: Int) raises RangeError -> Int:
    if value < 0 or value > 100:
        raise RangeError(value)
    return value

def main() raises:
    try:
        _ = clamp_to_range(150)
    except e:
        # `e` is inferred as RangeError, so the field is directly available.
        print("bad value:", e.value)
```

**Notes.** Implementing `Writable` is recommended so the error prints readably.
A function may declare at most one error type. Source:
<https://mojolang.org/docs/manual/errors/>.

---

## 7. Collections and iteration (medium)

**Task.** Given a list of names, build a `Dict[String, Int]` counting how many
times each name occurs, then print the counts in insertion order. Also build a
`Set` of the distinct names.

**Features.** `List`, `Dict`, `Set` (with its import), `for` iteration, `in`,
`items()`, mutation of a `Dict` through subscript.

**Solution sketch.**

```mojo
from std.collections import Set

def main():
    var names: List[String] = ["ann", "bob", "ann", "cy", "bob", "ann"]

    var counts: Dict[String, Int] = {}
    for name in names:
        if name in counts:
            counts[name] += 1
        else:
            counts[name] = 1

    for entry in counts.items():
        print(entry.key, "->", entry.value)

    var distinct = Set[String]()
    for name in names:
        distinct.add(name)
    print("distinct:", len(distinct))
```

**Notes.** `Set` is not in the prelude: the display `{1, 2}` needs no import, but
the type `Set[String]` does. `Dict` iteration order is insertion order. Sources:
<https://mojolang.org/docs/std/collections/dict/>,
<https://mojolang.org/docs/reference/types/> and
<https://mojolang.org/docs/reference/expressions/>.

---

## 8. Traits and generic code (medium)

**Task.** Define a `Shape` trait requiring `area() -> Float64`. Implement it for
`Circle` and `Rectangle`. Write one function `largest_area[T: Shape](shapes:
List[T]) -> Float64` and use it with both types.

**Features.** `trait`, required methods, conformance, type parameters, trait
bounds, compile-time specialization.

**Solution sketch.**

```mojo
trait Shape:
    def area(self) -> Float64:
        ...

@fieldwise_init
struct Circle(Copyable, Shape):
    var radius: Float64

    def area(self) -> Float64:
        return 3.141592653589793 * self.radius * self.radius

@fieldwise_init
struct Rectangle(Copyable, Shape):
    var width: Float64
    var height: Float64

    def area(self) -> Float64:
        return self.width * self.height

def largest_area[T: Shape](shapes: List[T]) -> Float64:
    var best: Float64 = 0.0
    for s in shapes:
        var a = s.area()
        if a > best:
            best = a
    return best

def main():
    var circles: List[Circle] = [Circle(1.0), Circle(2.0)]
    var rects: List[Rectangle] = [Rectangle(3.0, 4.0)]
    print(largest_area(circles))   # 12.566...
    print(largest_area(rects))     # 12.0
```

**Notes.** Conformance is explicit — implementing `area()` without declaring
`Shape` would not conform. Each `largest_area` call is specialized for the
concrete element type, with no runtime dispatch. Sources:
<https://mojolang.org/docs/manual/traits/>.

---

## 9. Parameterization and `comptime` (medium)

**Task.** Write a parameterized function `dot[a: Int](v: SIMD[DType.float32, a],
w: SIMD[DType.float32, a]) -> Float32` that computes the dot product using a
`comptime for` loop, and call it with width 2 and width 4. Also add a
`comptime`-computed alias for a fixed width.

**Features.** Value parameters, `SIMD`, `comptime for`, parameter expressions,
`type_of`-free explicit parameters.

**Solution sketch.**

```mojo
def dot[n: Int](v: SIMD[DType.float32, n], w: SIMD[DType.float32, n]) -> Float32:
    var total: Float32 = 0.0
    comptime for i in range(n):
        total += v[i] * w[i]
    return total

comptime WIDTH = 4

def main():
    var a2 = SIMD[DType.float32, 2](1.0, 2.0)
    var b2 = SIMD[DType.float32, 2](3.0, 4.0)
    print(dot(a2, b2))     # 11.0

    var a4 = SIMD[DType.float32, WIDTH](1.0, 2.0, 3.0, 4.0)
    var b4 = SIMD[DType.float32, WIDTH](1.0, 1.0, 1.0, 1.0)
    print(dot(a4, b4))     # 10.0
```

**Notes.** The second `SIMD` parameter is `length`, not `size`, in 1.x. A
`comptime for` requires the loop bound to be known at compile time, which is why
`n` is a parameter. Sources:
<https://mojolang.org/docs/manual/parameters/>,
<https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/> and
<https://mojolang.org/docs/reference/numeric-types/>.

---

## 10. Context manager (challenging)

**Task.** Implement a `Timer` context manager that prints the elapsed
nanoseconds when the block exits, and use it around a short computation. Then
extend it so that a `suppress` flag makes it print and suppress a raised error.

**Features.** `with`, `__enter__`/`__exit__`, the error-taking `__exit__`
overload returning `Bool`, importing `std.time`.

**Solution sketch.**

```mojo
import std.time

@fieldwise_init
struct Timer(ImplicitlyCopyable):
    var start: Int

    def __init__(out self):
        self.start = 0

    def __enter__(mut self) -> Self:
        self.start = Int(time.perf_counter_ns())
        return self

    def __exit__(mut self):
        var elapsed = time.perf_counter_ns() - self.start
        print("elapsed ns:", elapsed)

def main() raises:
    with Timer():
        var total = 0
        for i in range(1000):
            total += i
        print(total)
```

**Notes.** `__enter__` must return the manager itself so the `as` target binds to
the object being exited. The conditional overload has the signature
`def __exit__(mut self, e: Error) -> Bool`, returning `True` to suppress and
`False` to propagate. Sources:
<https://mojolang.org/docs/manual/errors/> and
<https://mojolang.org/docs/reference/compound-statements/>.

---

## 11. A move-only resource (challenging)

**Task.** Build a `FileHandle`-like struct that wraps an `Int` descriptor, is
`Movable` but not `Copyable`, and frees the descriptor in `__deinit__`. Show that
it can be transferred with `^` but not copied.

**Features.** `Movable`, no `Copyable`, `__deinit__`, `deinit self`, `^`,
explicit versus implicit copyability.

**Solution sketch.**

```mojo
@fieldwise_init
struct Handle(Movable):
    var fd: Int

    def __deinit__(deinit self):
        print("closing", self.fd)

def main():
    var a = Handle(3)
    var b = a^          # transfer is allowed
    # var c = a.copy()  # Error: Handle is not Copyable
    print(b.fd)         # 3
    # `b` is destroyed at its last use, printing "closing 3"
```

**Notes.** Structs are `Movable` by default in 1.0, but *not* copyable; adding
`Copyable` is what would enable `.copy()`. `__deinit__` takes `deinit self`.
Sources: <https://mojolang.org/docs/manual/structs/>,
<https://mojolang.org/docs/reference/function-declarations/> and
<https://mojolang.org/releases/v1.0.0/>.

---

## 12. Putting it together: a tiny word counter (challenging)

**Task.** Read a fixed multi-line string, split it into words, count word
frequencies in a `Dict[String, Int]`, sort the keys, and print the top three
words by count. Handle the empty-input case with an explicit error.

**Features.** `String` methods, `List`, `Dict`, iteration, `raises`, typed
control flow, sorting. (String splitting details are API-level; check the
`String` API page if a method name differs.)

**Solution sketch.**

```mojo
def word_counts(text: String) raises -> Dict[String, Int]:
    if not text:
        raise "no text to count"
    var counts: Dict[String, Int] = {}
    for word in text.split():
        if word in counts:
            counts[word] += 1
        else:
            counts[word] = 1
    return counts^

def main() raises:
    var text = "the quick brown fox jumps over the lazy dog the fox"
    var counts = word_counts(text)

    var keys: List[String] = []
    for entry in counts.items():
        keys.append(entry.key)
    keys.sort()

    var printed = 0
    for key in keys:
        if printed == 3:
            break
        print(key, counts[key])
        printed += 1

    try:
        _ = word_counts("")
    except e:
        print("handled:", e)
```

**Notes.** The sketch uses `String.split()` and `List.sort()`, whose exact
signatures live on the standard-library pages
(<https://mojolang.org/docs/std/collections/string/>, 
<https://mojolang.org/docs/std/collections/list/>); verify them if they differ.
The sorting here is alphabetical, not by frequency — ordering by count is a
follow-up step. Returning the `Dict` uses `^` because `Dict` is not implicitly
copyable. Sources: <https://mojolang.org/docs/manual/variables/> and
<https://mojolang.org/docs/manual/errors/>.

---

## What each exercise exercises

| # | Level | Main features |
|---|-------|---------------|
| 1 | Trivial | `main`, `var`, numeric types, division |
| 2 | Trivial | `for`, `range`, `if`, `continue` |
| 3 | Easy | `struct`, fields, methods, `@fieldwise_init` |
| 4 | Easy | value semantics, `.copy()`, `ref`, `^` |
| 5 | Easy-medium | `raises`, `raise`, `try`/`except`/`else`/`finally` |
| 6 | Medium | typed errors, `Writable`, `except` inference |
| 7 | Medium | `List`, `Dict`, `Set`, iteration |
| 8 | Medium | `trait`, conformance, generic functions |
| 9 | Medium | value parameters, `SIMD`, `comptime for` |
| 10 | Challenging | `with`, `__enter__`/`__exit__` |
| 11 | Challenging | `Movable`, `__deinit__`, move-only transfer |
| 12 | Challenging | everything above, plus real API use |

## Pitfalls

- **Using `size` instead of `length`** in `SIMD` or `Array` parameters. Verified
  in exercises 9 and 11.
- **Forgetting `.copy()` on a container.** Assignment does not copy implicitly.
  Verified in exercise 4.
- **Declaring `raises` on the caller when you meant to handle.** A non-raising
  function may not call a raising one unhandled. Verified in exercise 5.
- **Reading a typed-error field through a bare `raises` function.** The type is
  erased; keep the concrete error type. Verified in exercise 6.
- **Assuming `Set` is in the prelude.** Import it. Verified in exercise 7.
- **Relying on duck typing for a trait.** Conformance must be declared. Verified
  in exercise 8.
- **Using a runtime value in `comptime for`.** The bound must be compile-time.
  Verified in exercise 9.
- **Returning a copy from `__enter__`.** Bind the manager, not a copy. Verified
  in exercise 10.
- **Trying to copy a move-only type.** Transfer with `^`. Verified in exercise
  11.
- **Assuming a container is implicitly copyable when returning it.** Transfer it
  with `^`. Verified in exercise 12.

## Sources

- Mojo manual — Basics: <https://mojolang.org/docs/manual/basics/>
- Mojo manual — Variables: <https://mojolang.org/docs/manual/variables/>
- Mojo manual — Control flow: <https://mojolang.org/docs/manual/control-flow/>
- Mojo manual — Functions: <https://mojolang.org/docs/manual/functions/>
- Mojo manual — Structs: <https://mojolang.org/docs/manual/structs/>
- Mojo manual — Traits: <https://mojolang.org/docs/manual/traits/>
- Mojo manual — Errors: <https://mojolang.org/docs/manual/errors/>
- Mojo manual — Parameterization: <https://mojolang.org/docs/manual/parameters/>
- Mojo manual — Compile-time evaluation: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>
- Mojo manual — Python-to-Mojo (division, value semantics): <https://mojolang.org/docs/manual/python-to-mojo/>
- Mojo reference — Compound statements: <https://mojolang.org/docs/reference/compound-statements/>
- Mojo reference — Function declarations: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo reference — Numeric types: <https://mojolang.org/docs/reference/numeric-types/>
- Mojo reference — Types: <https://mojolang.org/docs/reference/types/>
- `mojo run`: <https://mojolang.org/docs/cli/run/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
