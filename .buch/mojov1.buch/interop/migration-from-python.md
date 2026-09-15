# Migration from Python

This page is for a Python developer who is about to write Mojo. It maps each
habit that must be unlearned to the Mojo form that replaces it, always as a
before/after pair: Python on the left, Mojo on the right. Every claim and example
below is from the official *Mojo tips for Python devs* guide
(<https://mojolang.org/docs/manual/python-to-mojo/>) unless another source is
named.

The guide's own framing is the right starting point:

> "Mojo is designed with Python programmers in mind, but it isn't "just Python,
> only faster." Mojo introduces a type system, ownership-aware semantics, and
> low-level control that, as a Python developer, you may not have had to reason
> about to make your code work.
>
> This guide offers a practical resource for Python developers. It shows how
> familiar Python patterns translate into Mojo, where your instincts still apply
> and where Mojo asks you to build a new mental model.
>
> This isn't a tutorial. It's a core set of language migration tips and patterns
> to support you as you migrate to Mojo."
>
> — <https://mojolang.org/docs/manual/python-to-mojo/>

And the execution model, in the guide's own words:

> "Mojo looks like Python but its execution model is closer to Rust, Swift, C++,
> and other systems languages."
>
> — <https://mojolang.org/docs/manual/python-to-mojo/>

See [what Mojo is](../intro/what-is-mojo.md) for why that matters and
[Python interoperability](python-interop.md) for the boundary itself.

## The five differences in one list

The guide names them directly:

1. **Mojo is statically typed.** "In Python, types are optional hints that the
   interpreter *mostly* ignores at runtime. In Mojo, types are first-class. The
   compiler uses them to generate fast, specialized machine code."
2. **Mojo compiles to machine code.** "Python runs through an interpreter that
   translates your code at runtime, adding overhead to every operation. Mojo
   compiles directly to native machine code."
3. **Mojo prefers value semantics and explicit mutability.** "In Python, most
   objects are mutable references, so assigning a list doesn't copy it. In Mojo,
   assigning or passing a value typically creates an independent copy."
4. **Modern ownership, no GC.** "The compiler tracks which variables and fields
   control a value's lifetime. That lets Mojo manage memory effectively, without
   a garbage collector or reference counting."
5. **Ideas from Rust, C++ and Python together.** "It combines Python's
   readability with a performance model inspired by systems languages like Rust
   and C++."

Everything below is a concrete consequence of one of those five.

## 1. Value semantics: assignment copies

The number-one surprise. In Python, assignment binds a second name to the *same*
object. In Mojo, assignment gives the new name its own value.

**Python**

```python
a = [1, 2, 3]
b = a
b.append(4)
print(a)  # [1, 2, 3, 4]
# a changed because b and a both point to the same list
```

**Mojo**

```mojo
var a = "hello"  # hello
var b = a        # hello, implicit copy
b = b + " world" # hello world
print(a)         # hello
print(b)         # hello world

var c: List[Int] = [1, 2, 3]
var d = c.copy() # d is an independent copy
d.append(4)      # [1, 2, 3, 4]
print(c)         # [1, 2, 3]  c is unchanged
```

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

The guide explains the two copy categories:

> "If you're not working with trivial types (like `Int` or `Bool`) or types with
> built-in copy semantics (like `String`), you may need to use an explicit copy
> call. You can also use and create types that are implicitly copyable."
>
> — <https://mojolang.org/docs/manual/python-to-mojo/>

| Category | Meaning | Examples |
|---|---|---|
| **Implicitly copyable** | Assignment copies without a call | `Int`, `Bool`, `String` |
| **Explicitly copyable** | You must call `.copy()` | `List`, `Dict`, `Set`, `Array` |

The `List` copy in the example is deliberately explicit: "In contrast, a `List`
might occupy megabytes of memory, and unintentionally copying it could be a
significant performance hit. Therefore, the `List` type supports only explicit
copying to prevent accidental copying."
(<https://mojolang.org/docs/manual/python-to-mojo/>)

### Getting Python's reference behavior back

**Mojo**

```mojo
var a: List[Int] = [1, 2, 3]
ref b = a # b is a reference to the same value
b.append(4) # The list updates. a still owns the list.
print(a) # [1, 2, 3, 4]
```

> "To use Python-like reference behavior, declare `b` with `ref` instead of
> `var`."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

**Pitfall:** `var` *always* means "new owner"; `ref` *always* means "another name
for an existing value". The keyword you pick is the semantics you get.

## 2. Mutability: variables are mutable, arguments are not

**Python**

```python
a = 10       # 10
b = a        # 10
b = b + 10   # 20
print(a, b)  # 10 20
```

**Mojo**

```mojo
var x = 10 # 10
x = 20     # 20, with a warning that x's previous assignment
            # to 10 was never used

def foo(value: Int):
    value += 1 # Error, expression must be mutable

var y = 20
foo(y)
```

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

> "All variables are mutable by default. Function arguments aren't mutable by
> default. … Default immutability in the function gives the compiler more room to
> optimize. Using the `mut` keyword in the argument declaration makes it
> mutable."

**Mojo**

```mojo
def foo(mut value: Int):
    value += 1 # This works
```

> "Explicit mutability makes code easier to reason about because mutability is
> visible. You can look at a function signature and immediately see which values
> can change and which can't."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

**Pitfall:** an unannotated parameter is an **immutable reference**, not a copy
and not a mutable binding. To mutate the caller's value, write `mut`; to take an
owned copy, write `var`; to consume it, use `var` and transfer with `^`.

## 3. Numbers: fixed width, explicit types

Python gives you arbitrary-precision `int` and a single 64-bit `float`. Mojo
gives you fixed-width types and no default float.

**Mojo's integer types** (from the numeric-types reference,
<https://mojolang.org/docs/reference/numeric-types/>):

| Signed | Width | Unsigned | Width |
|---|---|---|---|
| `Int8` | 8-bit | `UInt8` | 8-bit |
| `Int16` | 16-bit | `UInt16` | 16-bit |
| `Int32` | 32-bit | `UInt32` | 32-bit |
| `Int64` | 64-bit | `UInt64` | 64-bit |
| `Int128` | 128-bit | `UInt128` | 128-bit |
| `Int256` | 256-bit | `UInt256` | 256-bit |
| `Int` | machine word | `UInt` | machine word |

> "Mojo provides concrete numeric types like `Int`, `Int8`, `Int16`, `Int32`,
> `Int64`, `Float16`, `Float32`, and `Float64`. Fixed width isn't a limitation in
> Mojo, it's a feature that lets the compiler pack numbers with known sizes into
> memory."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

### The general `Int`

**Mojo**

```mojo
from std.sys import size_of

def main():
    var a: Int = 5
    var bytes = size_of[Int]()
    print(bytes)  # 8 on a 64-bit system
```

> "The general `Int` type maps to your machine's native word size. This is
> typically 64 bits on a 64-bit system."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

The numeric reference adds the warning: "`Int` is 64-bit on most platforms today,
but that isn't guaranteed. Code that depends on a specific width should use a
sized type." (<https://mojolang.org/docs/reference/numeric-types/>)

### No default float type

> "Mojo floating point types *aren't* arbitrary precision. Mojo doesn't provide a
> default floating point type, the way it does with integers. That means there's
> no built-in `Float` type.
>
> When you're just starting with Mojo, stick to `Float32` or `Float64`."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

**Pitfall:** `var x = 3.14` infers `Float64` (the literal's default
materialization), but there is no `Float` name to fall back on.

### Division: the biggest numeric trap

> "In Python, dividing two integers always produces a float."

**Python**

```python
a = 7
b = 2

print(7 / 2)   # 3.5 — always float
```

**Mojo**

```mojo
var a: Int = 7
var b: Int = 2

print(Float64(a) / Float64(b))     # 3.5 — explicit float division
```

> "In Mojo, if you want integer division to return a floating-point result, you
> must use explicit casting."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

And the two operators diverge in *rounding direction*, not just type:

```mojo
var a: Int = 7
var b: Int = 2

print(a / b)   # 3, result type matches operand type
```

> "Python programmers may be a bit surprised that `/` isn't "true division." It
> returns a truncated result, but the result is biased towards zero:"

```mojo
var c = -7
var d = 2
print(c / d)  # -3, not -4, truncates towards zero
```

> "`//` performs floored division, in the direction of negative infinity:"

```mojo
print(c // d) # -4, not -3, truncates towards negative infinity
```

```mojo
var e: Float64 = 7.0
var f: Float64 = 2.0
print(e // f) # 3.0, floors toward negative infinity
print(e / f)  # 3.5

var g: Float64 = -7.0
print(g // f) # -4.0, floors toward negative infinity
print(g / f)  # -3.5
```

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

| Expression | Python | Mojo |
|---|---|---|
| `7 / 2` | `3.5` (float) | `3` (`Int`, truncates toward zero) |
| `-7 / 2` | `-3.5` (float) | `-3` (`Int`, truncates toward zero) |
| `-7 // 2` | `-4` | `-4` (floors toward −∞) |
| `Float64(7) / Float64(2)` | n/a | `3.5` |

**Pitfall:** Mojo's `/` is not Python's "true division". If a ported function
divides and the result is expected to be fractional, the code silently truncates
unless one operand is cast to a float.

### SIMD types

> "In many languages, SIMD shows up later as a specialized tool for advanced
> users. In Mojo, SIMD is part of the core compute model. Mojo implements its
> primitive numeric types as SIMD values under the hood.
>
> That lets the compiler operate on multiple values with a single hardware
> instruction. When you choose the right numeric type, you give the compiler more
> room to generate faster code."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

`Int` is `Scalar[DType.int]`, which is `SIMD[DType.int, 1]`. The full model is on
[vectorization and SIMD](../concurrency/vectorization-and-simd.md).

## 4. Collections: one element type

**Python**

```python
nums = ["one", 2.0, 3]
nums.append(4) # ['one', 2.0, 3, 4]
```

**Mojo**

```mojo
var nums: List[Int] = [1, 2, 3]
nums.append(4) # [1, 2, 3, 4]
```

> "A typed list holds only one element type. In this example, that type is Int.
> This allows the list implementation to pack data efficiently, using less space
> and improving performance. Mojo uses packed data rather than indirect
> references."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

### Mixed types via `Variant`

```mojo
from std.utils import Variant

comptime MixedType = Variant[Int, Float64, String, Bool]

var mixed_list = List[MixedType]()
mixed_list.append(MixedType(42))
mixed_list.append(MixedType(3.14))
mixed_list.append(MixedType("hello"))
mixed_list.append(MixedType(True))

for item in mixed_list:
    print(item) # Output lines: 42, 3.14, hello, and True
```

> "`Variant` tells the Mojo compiler which types are used, so it can allocate and
> manage memory correctly."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

**Pitfall:** `Variant` is a closed union. It enumerates the permitted types at
compile time, so it does not reproduce Python's "anything goes" list; it makes
the set of possible types explicit.

### Dicts

**Python**

```python
counts = {"a": 1, "b": "two"}
counts["c"] = 3.0 # {'a': 1, 'b': 'two', 'c': 3.0}
```

**Mojo**

```mojo
var counts: Dict[String, Int] = {"a": 1, "b": 2}
counts["c"] = 3 # {a: 1, b: 2, c: 3}
```

> "A typed declaration like `Dict[String, Int]` tells the compiler exactly what
> element types to expect for keys and values. This enables tighter, faster code.
> As with other Mojo collections, you can use `Variant` to broaden the range of
> permitted element types."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

**Pitfall:** the `Dict` value display is `{a: 1, b: 2, c: 3}` — keys are not
quoted, unlike Python. Do not pattern-match on Python's `repr` format.

## 5. Comprehensions: almost identical

**Mojo**

```mojo
var list_squares = [x * x for x in [0, 1, 2, 3, 4] if x % 2 == 0]
# [0, 4, 16], list

var positive_numbers = [x for x in range(-3, 3) if x > 0]
# [1, 2], list

var dict_squares = {x: x * x for x in range(3)}
#  {0: 0, 1: 1, 2: 4}, dict

var upper_case = {k: v.upper() for k, v in [(1, "one"), (2, "two")]}
# {1: ONE, 2: TWO}, dict

var number_set = {x for x in range(5)}
# {0, 1, 2, 3, 4}, set
```

> "Python's comprehensions have direct Mojo analogs. The syntax is essentially
> identical."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

**Pitfall:** a list expression now builds an `Array` by default in 1.x, not a
`List`:

> "Mojo now picks `Array` (instead of `List`) as the default type to construct
> from a list expression, eliminating implicit heap allocations. For example:
> `var x = [1, 2, 3]` — `type_of(x) = Array[Int, 3]`"
> — <https://mojolang.org/releases/v1.0.0/>

Annotate the variable when you need a `List` (`var xs: List[Int] = [...]`).

## 6. Iteration

**Mojo, typed for-loop**

```mojo
var nums = [0, 1, 2, 3, 4]
var squares2: List[Int] = []

for x in nums:
    if x % 2 == 0:
        squares2.append(x * x)

print(squares2) # [0, 4, 16]
```

**Mojo, while loop**

```mojo
var squares3: List[Int] = []
var idx = 0

while idx < 3:
    squares3.append(idx * idx)
    idx += 1

print(squares3)  # [0, 1, 4]
```

> "In terms of syntax, Mojo's `for` and `while` loops align with Python. Use
> `break` and `continue` for control flow."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

**Pitfall:** the loop variable is an immutable reference by default. To mutate
the element in place, declare `for ref item in list:`. The reference confirms:

> "By default, loop variables are immutable references to the iterated items
> (`imm`). To create a mutable copy, use `var`. To maintain value mutability, use
> `ref`."
> — <https://mojolang.org/docs/reference/compound-statements/>

## 7. Functions: types are not optional

**Python**

```python
def add(a, b):
    return a + b
```

**Mojo**

```mojo
def add(a: Int, b: Int) -> Int:
    return a + b
```

> "In Python, you can write a function without specifying the types of its
> arguments or return value. In Mojo, you must declare types explicitly. … The
> optional `->` syntax declares the return type."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

**Pitfall:** the return annotation is optional to *write* but its absence has
meaning: "Without `->`, the function returns `None`."
(<https://mojolang.org/docs/reference/function-declarations/>)

**Pitfall:** `def` is the only function keyword in 1.x. The old `fn` spelling
"now produces an error instead of a warning."
(<https://mojolang.org/releases/v1.0.0b2/>) See
[`def`](../keywords/def.md) and [`fn`](../keywords/fn.md).

## 8. Error handling: by return value, not by convention

Mojo's error model is a value model. The manual page on errors puts it in one
sentence: "Mojo represents errors as values—specifically, as alternate return
values from" functions
(<https://mojolang.org/docs/manual/errors/>). The Python-to-Mojo guide states the
practical rules:

> "Error handling in Mojo looks very similar to Python. You raise and catch
> exceptions. … The `raises` keyword in function and method declarations
> indicates that a function may generate or propagate errors."

**Python**

```python
try:
    raise ValueError("bad input")
except ValueError as e:
    print(e)  # bad input
```

**Mojo**

```mojo
try:
    raise Error("bad input")
except e:
    print(e)  # bad input
```

> "You can specify error types by adding a type name after the `raises` keyword.
> This lets you catch the error and use the type instance directly in your
> `except` clause:"

```mojo
@fieldwise_init
struct MyCustomError(Writable):
    var message: String

def test_typed_error() raises MyCustomError: # Typed error
    raise MyCustomError("custom error occurred")

try:
    test_typed_error()
except e:
    print(e.message) # custom error occurred
```

```mojo
def another_raising_function() raises:
    raise Error("Message")     # Error raised here

def raising_function() raises:
    another_raising_function() # Error continues to pass

def handles_errors():
    try:
        raising_function()     # Error handled in this non-raising function
    except e:
        # handle error here
```

> "Functions that don't handle the errors they raise automatically delegate error
> handling to their caller. You must declare these functions with the `raises`
> keyword."
>
> "Note that in Mojo, each `try/except` statement can handle a single error type."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

The differences a Python developer must internalise:

| Python | Mojo |
|---|---|
| Any function may raise; nothing marks it | Functions are **non-raising by default**; a raising call requires `raises` on the caller or a `try` |
| `try/except` can catch many types in one block | "each `try/except` statement can handle a single error type" |
| Every exception is a class | Mojo errors are values; a function may declare at most one error type after `raises` |
| `raise` inside `except` re-raises | `raise e` re-raises; `e` is `ImplicitlyCopyable` since 1.0.0 |

**Pitfall:** calling a `raises` function from a non-raising function is a
compile error, not a runtime one: "Error: can't call raising function in a
non-raising context." (<https://mojolang.org/docs/reference/function-declarations/>)

**Pitfall:** the error model is deliberately limited for performance. The
Python-from-Mojo page notes the stdlib "limits their use for performance
reasons." (<https://mojolang.org/docs/manual/python/python-from-mojo/>)

## 9. Types: `struct` is not `class`

> "Python classes are flexible and dynamic. You can add attributes at runtime,
> mix types, and override behavior freely. Mojo uses `struct`, a statically typed
> alternative that the compiler can optimize aggressively.
>
> Mojo structs are stack-allocated. The value lives in a fast, fixed-size region
> of memory rather than on the heap, where a garbage collector must track and
> clean it up."

**Python**

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

**Mojo**

```mojo
struct Point:
    var x: Int
    var y: Int

    def __init__(out self, x: Int, y: Int):
        self.x = x
        self.y = y
```

```mojo
def main():
    var point = Point(5, 3)
    print(point.x, point.y) # 5, 3
```

> "Mojo initializers require `out self`. The `out` keyword indicates that the
> method returns a value through an argument. In initializers, that argument is
> `self`, and the instance's fields are guaranteed to be fully initialized."
>
> "Structs deliver performance and predictability."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

The manual is blunt about inheritance:

> "Mojo structs are similar to classes. However, Mojo structs do *not* support
> inheritance. Mojo doesn't support classes at this time."
> — <https://mojolang.org/docs/manual/get-started/>

**Pitfall:** all fields must be declared with types. "Mojo requires you to
declare all fields in the struct definition. You can't add fields dynamically at
run-time." (<https://mojolang.org/docs/manual/get-started/>)

**Pitfall:** methods that mutate use `mut self`. The `__setitem__` example in the
tutorial makes the reason explicit: "If we were to omit `mut`, we would get an
error because the compiler would default to immutable access for the argument."
(<https://mojolang.org/docs/manual/get-started/>)

### `@fieldwise_init`

The boilerplate constructor above can be generated:

```mojo
@fieldwise_init
struct Point(Copyable):
    var x: Int
    var y: Int
```

> "To reduce the amount of boilerplate code you need to write, Mojo provides a
> decorator called `@fieldwise_init` that automatically generates a constructor
> for you that performs "field-wise" initialization. The constructor's arguments
> have the same names and types as the struct's fields and appear in the same
> order."
> — <https://mojolang.org/docs/manual/get-started/>

See [`@fieldwise_init`](../decorators/fieldwise-init.md) and
[struct declarations](../reference/struct-declarations.md).

## 10. Static typing: a name has one type

**Python**

```python
a = "x" # String
a = 10  # Not an error
```

**Mojo**

```mojo
var a = 1    # Int
a = "string" # Error: can't implicitly convert String to Int
```

> "In Mojo, once a name is bound in a scope, its type is fixed and can't be
> rebound to a different type."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

### Rebinding across types with `Variant`

```mojo
from std.utils import Variant
from std.testing import *

comptime StringOrInt = Variant[String, Int]

var a: StringOrInt = 1 # Initial value, 1
assert_true(a.unsafe_get[Int]() == 1)

a = "string" # Not an error, "string"
assert_true(a.unsafe_get[String]() == "string")
```

> "When you use `Variant`, you can switch between the types it enumerates. The
> variable itself remains statically typed as a `Variant`, even though the
> concrete value it holds may change."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

**Pitfall:** `unsafe_get[T]()` is on the *unsafe* side of the API: it assumes you
know the active alternative. Check the variant before unwrapping when the type is
not guaranteed by construction.

## 11. Polymorphism: duck typing → traits

> "In Python, duck typing means you don't declare what interface an object must
> have. If it has the method you call, it works at runtime. This is flexible, but
> it gives you no safety net.
>
> Mojo uses traits to solve the same problem explicitly. A trait defines the
> methods a type must implement or provides a default implementation. The
> compiler verifies that any type used in that role actually provides those
> methods, so mistakes surface before your code runs."

**Python duck typing**

```python
def sketch(shape):
    shape.draw()  # Works if shape has draw(), fails at runtime if not
```

**Mojo traits**

```mojo
trait Drawable:
    def draw(self):
        ... # required method

def sketch[T: Drawable](shape: T):
    shape.draw()  # Compiler guarantees shape has `draw()`
```

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

**Pitfall:** 1.0 removed duck typing for callables. A struct with a compatible
`__call__()` no longer satisfies a function type implicitly; it must declare the
conformance:

```mojo
struct Double(def(Int) -> Int):  # previously: `struct Double:`
    def __call__(self, x: Int) capturing -> Int:
        return x * 2
```

> "User-written structs must now explicitly declare closure-trait conformance in
> their inheritance list to satisfy a `def(...) -> ...` closure trait. Previously,
> Mojo accepted a struct with a compatible `__call__()` implicitly (duck typing)."
> — <https://mojolang.org/releases/v1.0.0/>

Also note there is **no dynamic dispatch** in 1.x: overloads are resolved at
compile time ("This is static dispatch: there's no runtime lookup"), and
"existentials / dynamic traits" is an unstarted phase-2 roadmap item. Sources:
<https://mojolang.org/docs/reference/function-declarations/>;
<https://mojolang.org/docs/roadmap/>.

## 12. Memory: ownership instead of GC

> "Python manages memory automatically using reference counting and a garbage
> collector. … This removes the need to manage memory manually, but it also means
> you have no control over when collection happens.
>
> Mojo uses ownership semantics with ASAP ("as soon as possible") destruction.
> The compiler knows exactly when a value is used for the last time and its
> lifetime ends. Memory is freed at that point, without waiting for a garbage
> collector to run.
>
> If you need manual memory control, Mojo offers a suite of pointer and
> allocation options. You get convenience by default, and precise `alloc()` and
> `free()` control when you reach for it."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

The mechanics — copies, moves and the `^` transfer sigil — are on
[ownership and lifetimes](../memory/ownership-and-lifetimes.md). The migration
point is the mental shift: **a reference in Mojo is something the compiler
tracks, and a value is destroyed at its last use, not at scope exit and not by a
collector.**

**Pitfall:** because destruction is at the last use, a destructor can run earlier
than a Python developer expects. See [destruction](../lifecycle/death.md) for
the timing and [what Mojo is](../intro/what-is-mojo.md) for the worked example.

## 13. The six instincts that will mislead you

The guide ends with a list of Python habits that are wrong in Mojo. Verbatim:

**"I don't need types."**

> "In Python, that's often fine. In Mojo, types are how the compiler generates
> fast, optimized code. Untyped code works in dynamic languages like Python, but
> it can leave performance, correctness, readability, and maintainability on the
> table."

**"Everything is mutable."**

> "In Mojo, variables are mutable by default, but function and method arguments
> may not be."

**"I can mix types in a list."**

> "Mojo collections use static types and benefit from the performance that
> brings."

**"Threads are how I parallelize."**

> "Python threads are limited by the GIL. Mojo supports parallelism at multiple
> levels, from data-parallel SIMD operations to multi-threaded GPU execution.
> This isn't limited to threads. Mojo enables low-level SIMD parallelism and
> higher-level parallelism across GPUs."

**"Classes are the natural way to structure things."**

> "Mojo's `struct` value type and its traits offer a better fit for
> performance-sensitive code."

Source: <https://mojolang.org/docs/manual/python-to-mojo/>.

## 14. Use AI assistants with the interop skill

The guide's final section is practical advice for agent-assisted migration:

> "If you're using an AI coding assistant to help translate Python code to Mojo,
> install Mojo agent skills. The `mojo-python-interop` skill handles the patterns
> that trip models up like `PythonObject` wrapping, `import` conventions, and type
> conversions between the two languages."

```bash
npx skills add modular/skills
```

> "This installs all four Mojo agent skills, including `mojo-syntax` for general
> language accuracy."
> — <https://mojolang.org/docs/manual/python-to-mojo/>

See [Mojo AI skills](../intro/ai-agent-skills.md) for what the skills are and how
they relate to this buch.

## A migration checklist

Run this against every ported file:

- [ ] Every variable uses `var` (implicit declarations are deprecated).
- [ ] Every function has argument types and, when it returns a value, `-> T`.
- [ ] No `fn`; `def` only.
- [ ] Every non-raising caller of a `raises` function either handles the error or
      is itself `raises`.
- [ ] Assignment is assumed to copy; use `.copy()` for explicit-copy types and
      `ref` when a reference was intended.
- [ ] Function arguments that must be mutated are declared `mut`.
- [ ] Integer division uses the intended operator (`/` truncates toward zero;
      `//` floors) and casts when a float result is wanted.
- [ ] Collections have one declared element type; `Variant` is used where Python
      mixed types.
- [ ] List expressions that must be `List` are annotated (`Array` is the
      literal's default).
- [ ] Classes became `struct`s with declared fields, `out self` initializers, and
      `mut self` where state changes.
- [ ] Duck-typed callables declare their closure-trait conformance explicitly.
- [ ] No `__del__`; the destructor is `__deinit__`.
- [ ] Python interop, if used, follows [calling Python](calling-python.md) or
      [calling Mojo from Python](mojo-from-python.md) deliberately.

## Open questions

> **Open question:** the guide says "`try`/`except` can handle a single error
> type", while the compound-statements reference says "A `try` block handles one
> error type. The compiler raises an error if code in the `try` block can raise
> more than one error type." The two agree on the limit but differ in emphasis;
> verify with the compiler whether chained `except` clauses are rejected or
> whether a single `except` simply binds one type.

> **Open question:** the guide's memory-management section mentions "precise
> `alloc()` and `free()` control", but `free()` is the low-level pointer API, not
> the layout-aware `memory.alloc` API that 1.0 recommends. 1.0.0 changed the
> pointer free spelling to `unsafe_free()` and points new allocations at
> `memory.alloc`. Treat the guide's wording as illustrative, not as a current API
> recommendation.

## Sources

- <https://mojolang.org/docs/manual/python-to-mojo/>
- <https://mojolang.org/docs/manual/get-started/>
- <https://mojolang.org/docs/manual/errors/>
- <https://mojolang.org/docs/manual/python/>
- <https://mojolang.org/docs/manual/python/python-from-mojo/>
- <https://mojolang.org/docs/reference/numeric-types/>
- <https://mojolang.org/docs/reference/function-declarations/>
- <https://mojolang.org/docs/reference/compound-statements/>
- <https://mojolang.org/docs/roadmap/>
- <https://mojolang.org/releases/v1.0.0/>
- <https://mojolang.org/releases/v1.0.0b2/>
