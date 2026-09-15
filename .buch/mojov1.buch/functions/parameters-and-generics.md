# Parameters and generics

Mojo separates the two kinds of input a callable can take, and it does so in
the syntax itself: **parameters** are compile-time values, written in square
brackets `[]`; **arguments** are run-time values, written in parentheses `()`.

This page covers parameterized functions and types, constraints and `where`
clauses, automatic parameterization, `comptime` members, and the `where`-based
conditional conformance that makes a parameterized type's capabilities depend
on its parameters. Overload resolution has its own page,
[overloads](overloads.md); closures have
[closures and lambdas](closures-and-lambdas.md).

## Parameters versus arguments

The official function page states the terminology as a rule:

> In Mojo, "parameter" and "parameter expression" refer to compile-time values,
> and "argument" and "expression" refer to run-time values.

Source: <https://mojolang.org/docs/manual/functions/>.

The parameterization page explains why the distinction exists and where you see
it:

> Mojo makes this distinction visible in syntax: use `[]` for parameters and
> `()` for arguments.

> A parameter is a compile-time input to a struct or function. Parameters appear
> in square brackets after the struct or function name.

Source: <https://mojolang.org/docs/manual/parameters/>.

A parameter can be a **type** or a **value**. A function parameterized on a type
is *type-parameterized*; one parameterized on a value is *value-parameterized*.
Both use `[]`:

```mojo
def multiplier[factor: Int](x: Int) -> Int:
    return x * factor

def main():
    comptime times_ten = multiplier[10]
    var x10 = times_ten(3)
    print(x10)   # 30
```

Source for the shape: <https://mojolang.org/docs/manual/parameters/>.

Both kinds of parameter are resolved when the program is compiled. The compiler
produces a *concrete* (specialized) version of the callable for each distinct
parameter value:

> The compiler resolves the parameter values during compilation, and creates a
> concrete version of the `repeat[]()` function for each unique parameter value.

Source: <https://mojolang.org/docs/manual/parameters/>.

> If the compiler can't resolve all parameter values to constant values,
> compilation fails.

Source: <https://mojolang.org/docs/manual/parameters/>.

## Parameterized functions

Add parameters in square brackets ahead of the argument list. Each parameter is
written like an argument — a name, a colon, and a type:

```mojo
def repeat[count: Int](msg: String):
    comptime for i in range(count):
        print(msg)

def main():
    repeat[3]("Hello")
```

```output
Hello
Hello
Hello
```

The `comptime for` loop is fully unrolled at compile time, which is only possible
because `count` is a parameter, so `range(count)` is known at compile time.
Source: <https://mojolang.org/docs/manual/parameters/>.

Parameters always require type annotations, and a parameter can depend only on
parameters that appear **before** it in the list, because the signature is
processed left to right:

```mojo
def dependent_type[dtype: DType, value: Scalar[dtype]]():
    print("Value: ", value)
    print("Value is floating-point: ", dtype.is_floating_point())

def main():
    dependent_type[DType.float64, Float64(2.2)]()
```

```output
Value:  2.2000000000000002
Value is floating-point:  True
```

You cannot reverse `dtype` and `value`, because `value` depends on `dtype`.
Source: <https://mojolang.org/docs/manual/parameters/>.

## Parameters at a glance: the markers

A parameter list can use the same marker characters as an argument list.
From the official page:

- **Double slash (`//`)** — parameters declared before the double slash are
  *infer-only parameters*.
- **Slash (`/`)** — parameters declared before a slash are *positional-only*.
- **`*Type`** — a parameter name prefixed with a star is a *variadic
  parameter*; any parameters after it are keyword-only.
- **`*`** — in a list with no variadic parameter, a bare star makes the
  following parameters keyword-only.
- **`= value`** — introduces a default value for an *optional parameter*.

Source: <https://mojolang.org/docs/manual/parameters/>.

```mojo
def my_sort[
    dtype: DType,
    width: SIMDLength,
    //,                              # infer-only parameters above
    values: SIMD[dtype, width],      # positional-only
    /,
    compare: def(Scalar[dtype], Scalar[dtype]) thin -> Int,  # positional-or-keyword
    *,
    reverse: Bool = False,           # keyword-only, optional
]() -> SIMD[dtype, width]:
    ...
```

`compare` is a *function-typed* parameter. Because the comparator is a
noncapturing function value, the type explicitly uses `thin`.
Source: <https://mojolang.org/docs/manual/parameters/>.

## Type parameters and constraints

A type parameter is a placeholder for a type. You must always constrain or
explicitly type parameter names; the most permissive constraint is `AnyType`,
and `Deinitable` is the usual baseline for code that stores or owns values:

> A trait defines what a type must do, and parameterized code declares which
> traits it requires.

> The most permissive constraint is `AnyType`. It places no behavioral
> requirements on a type.

> `Deinitable` is a common baseline for types with lifetimes. Parameterized code
> that stores or owns values often requires it.

Source: <https://mojolang.org/docs/manual/generics/>.

The ampersand (`&`) composes traits, and the official advice is to keep the set
minimal:

```mojo
def all_equal[T: Equatable & Copyable & Deinitable](
    ref lhs: List[T], ref rhs: List[T]
) -> Bool:
    if len(lhs) != len(rhs):
        return False
    for left, right in zip(lhs, rhs):
        if left != right:
            return False
    return True
```

`T` is inferred from the call site. `Equatable` is required for `!=`,
`Copyable` for the copies `zip()` makes, and `Deinitable` so the tuple `zip()`
yields each iteration can be destroyed at the end of the loop. Dropping any one
of them is a compile error, and the compiler calls the type *underspecified*.
Source: <https://mojolang.org/docs/manual/generics/>.

Adding constraints narrows which types are accepted but expands what the body
may do:

> Adding constraints restricts which types you accept, but expands what your
> code can do.

Source: <https://mojolang.org/docs/manual/generics/>.

### Naming conventions

> Type parameter names use PascalCase, short (`T`, `E`) or descriptive
> (`ErrorType`, `Element`). By convention, `T`, `U`, `V` are general types;
> `K`/`V` for key-value pairs; `E` for errors; `H` for hashers. Value parameter
> names use lower_snake_case and should be descriptive (`capacity`, `hasher`,
> `tile_x`).

Source: <https://mojolang.org/docs/manual/generics/>.

## Value parameters and how to choose

A value parameter lets a value shape structure or behavior at compile time.
The official list of common cases:

- *Fixed sizes:* buffer lengths, array dimensions, matrix shapes.
- *Thresholds and limits:* capacity caps, retry counts, precision levels.
- *Feature selection:* algorithm variants, debug flags, mode switches.
- *Numeric configuration:* SIMD widths, stride lengths, unroll factors.

Source: <https://mojolang.org/docs/manual/generics/>.

A function can mix both kinds:

```mojo
comptime MyCollectionElement = ImplicitlyCopyable & Deinitable

def make_filled[T: MyCollectionElement, size: Int](splat_value: T) -> List[T]:
    var result = List[T](capacity=size)
    for _ in range(size):
        result.append(splat_value)
    return result^

def main():
    var three_zeros = make_filled[Int, 3](0)
    var five_hellos = make_filled[String, 5]("hello")
    print(three_zeros)   # [0, 0, 0]
    print(five_hellos)   # [hello, hello, hello, hello, hello]
```

Source for the pattern: <https://mojolang.org/docs/manual/generics/>.

The decision rule the official page gives:

> Ask yourself: does the caller know this value when writing the code? If yes,
> use a parameter. If it depends on input, files, or runtime state, use an
> argument.

Source: <https://mojolang.org/docs/manual/generics/>.

```mojo
# size is compile-time: the compiler specializes
def fixed[size: Int]():
    var buf = Array[Int, size](fill=0)

def main():
    fixed[4]()
```

Because value parameters drive specialization, the compiler can remove dead
branches (`comptime if`), unroll loops (`comptime for`), and inline constants
with no run-time cost. Source: <https://mojolang.org/docs/manual/generics/>.

## Optional, keyword, and variadic parameters

Parameters support defaults and keyword passing, exactly like arguments:

```mojo
def speak[a: Int = 3, msg: String = "woof"]():
    print(msg, a)

def use_defaults():
    speak()               # woof 3
    speak[5]()            # woof 5
    speak[7, "meow"]()    # meow 7
    speak[msg="baaa"]()   # baaa 3
```

Source: <https://mojolang.org/docs/manual/parameters/>.

If a parameterized function also has a default value, **an inferred parameter
value takes precedence over the default**:

```mojo
@fieldwise_init
struct Bar[v: Int]:
    pass

def speak2[a: Int = 3, msg: String = "woof"](bar: Bar[a]):
    print(msg, a)

def use_inferred():
    speak2(Bar[9]())   # woof 9 — inferred `a` wins over the default 3
```

Source: <https://mojolang.org/docs/manual/parameters/>.

Struct parameters also take defaults and keywords:

```mojo
struct KwParamStruct[greeting: String = "Hello", name: String = "mojo"]:
    def __init__(out self):
        print(Self.greeting, Self.name)

def use_kw_params():
    KwParamStruct[]()                       # Hello mojo
    KwParamStruct[name="World"]()           # Hello World
    KwParamStruct[greeting="Hola"]()        # Hola mojo
```

Source: <https://mojolang.org/docs/manual/parameters/>.

A **variadic parameter** is written `*name: Type` and accepts a variable number
of parameter values:

```mojo
struct MyTensor[*dimensions: Int]:
    pass
```

Two documented limits apply to variadic parameters that do not apply to
variadic arguments:

> - Variadic parameters must be homogeneous — that is, all the values must be
>   the same type.
> - The parameter type must be register-passable.

And: "Variadic keyword parameters (for example, `**kwparams`) are not supported
yet." Source: <https://mojolang.org/docs/manual/parameters/>.

## Infer-only parameters

An *infer-only parameter* is "always either inferred from context or specified by
keyword". It is placed at the beginning of the parameter list, set off by `//`:

```mojo
def dependent_type2[dtype: DType, //, value: Scalar[dtype]]():
    print("Value: ", value)
    print("Value is floating-point: ", dtype.is_floating_point())

def main():
    dependent_type2[Float64(2.2)]()   # dtype inferred from value
```

> Because infer-only parameters are declared at the beginning of the parameter
> list, other parameters can depend on them, and the compiler always attempts to
> infer the infer-only values from bound parameters or arguments.

Source: <https://mojolang.org/docs/manual/parameters/>.

Infer-only parameters **cannot be given positionally**. They can be bound by
keyword when needed:

```mojo
def mutate_span(span: Span[mut=True, Byte, _]):
    for i in range(0, len(span), 2):
        if i + 1 < len(span):
            span.swap_elements(i, i + 1)
```

The `mut` parameter of `Span` is infer-only; binding it by keyword is how you
require a mutable origin. Source: <https://mojolang.org/docs/manual/parameters/>.

```mojo
def inferred_type[T: Writable, //](value: T):
    print(value)

def main():
    inferred_type(5)              # T inferred
    # inferred_type[Int](5)       # Error: got a positional parameter, expected none
    inferred_type[T=Int](5)       # OK: keyword syntax bypasses the restriction
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## Parameter inference

The compiler infers parameter values from the statically known *types* of the
arguments:

> Parameter inference can seem a little confusing: it might seem like the
> compiler is inferring compile-time parameter values from run-time argument
> values. But in fact it's inferring parameters from the statically-known
> *types* of the arguments.

Source: <https://mojolang.org/docs/manual/parameters/>.

It can also infer a struct's parameters from constructor or static-method
arguments:

```mojo
struct One[Type: Writable & Copyable & Deinitable]:
    var value: Self.Type

    def __init__(out self, value: Self.Type):
        self.value = value.copy()

def use_one():
    var s1 = One(123)        # equivalent to One[Int](123)
    var s2 = One("Hello")    # equivalent to One[String]("Hello")
```

Passing two instances with different types to a function that requires the same
`Type` for both fails: "parameter inferred to two different values".
Source: <https://mojolang.org/docs/manual/parameters/>.

When inference fails, the compiler usually reports "failed to infer parameter
`param_name`", and the docs note it "also sometimes reports this error
incorrectly, for example, when the actual error is a type mismatch." Specifying
the missing parameter explicitly often surfaces the real error. Source:
<https://mojolang.org/docs/manual/parameters/>.

## Parameter expressions

A **parameter expression** is any expression that occurs where a parameter is
expected. It uses the same grammar and types as run-time code, so dependent-type
style relationships work:

```mojo
def concat[
    dtype: DType, ls_size: Int, rh_size: Int, //
](lhs: SIMD[dtype, ls_size], rhs: SIMD[dtype, rh_size]) -> SIMD[
    dtype, ls_size + rh_size
]:
    var result = SIMD[dtype, ls_size + rh_size]()
    comptime for i in range(ls_size):
        result[i] = lhs[i]
    comptime for j in range(rh_size):
        result[ls_size + j] = rhs[j]
    return result
```

The result length is the sum of the input lengths, written as the simple
expression `ls_size + rh_size`. Source:
<https://mojolang.org/docs/manual/parameters/>.

Parameter expressions can drive imperative compile-time logic, including
recursion:

```mojo
def slice[
    dtype: DType, size: Int, //
](x: SIMD[dtype, size], offset: Int) -> SIMD[dtype, size // 2]:
    comptime new_size = size // 2
    var result = SIMD[dtype, new_size]()
    for i in range(new_size):
        result[i] = Scalar[dtype](x[i + offset])
    return result

def reduce_add(x: SIMD) -> Int:
    comptime if x.length == 1:
        return Int(x[0])
    elif x.length == 2:
        return Int(x[0]) + Int(x[1])

    comptime half_size = x.length // 2
    var lhs = slice(x, 0)
    var rhs = slice(x, half_size)
    return reduce_add(lhs + rhs)

def main():
    var x = SIMD[DType.int, 4](1, 2, 3, 4)
    print(x)                       # [1, 2, 3, 4]
    print("Elements sum:", reduce_add(x))   # Elements sum: 10
```

Source: <https://mojolang.org/docs/manual/parameters/>.

A *parameterized `comptime` value* is a compile-time expression that takes
parameters and returns a compile-time constant. Unlike a function, it can
return a **type**, which is what makes type aliases possible:

```mojo
comptime TwoOfAKind[dt: DType] = SIMD[dt, 2]
var twoFloats = TwoOfAKind[DType.float32](1.0, 2.0)

comptime StringKeyDict[ValueType: Copyable & Deinitable] = Dict[String, ValueType]
var b: StringKeyDict[UInt8] = {"answer": 42}
```

Source: <https://mojolang.org/docs/manual/parameters/>.

## Parameterized structs

A struct can be parameterized on types and values, and use them in its fields
and methods:

```mojo
comptime ComparableValue = Equatable & ImplicitlyCopyable & Deinitable

@fieldwise_init
struct Pair[T: ComparableValue](ComparableValue):
    var left: Self.T
    var right: Self.T

    def __eq__(self, other: Pair[Self.T]) -> Bool:
        return self.left == other.left and self.right == other.right
```

The two positions mean different things:

> - **Square brackets** — a requirement on callers: any value used with `Pair`
>   must have type `T`, and `T` must be a `ComparableValue`.
> - **Parentheses** — a promise from `Pair` itself: "I am a `ComparableValue`."

Source: <https://mojolang.org/docs/manual/generics/>.

### Referencing struct parameters and `comptime` members

Reference a struct parameter with dot syntax, `Self.T`, like a field or method.
This works on the type and on an instance:

```mojo
def on_type():
    print(SIMD[DType.float32, 2].length)   # 2

def on_instance():
    var x = SIMD[DType.int32, 2](4, 8)
    print(x.dtype)                          # int32
```

Source: <https://mojolang.org/docs/manual/parameters/>.

A `comptime` member is a constant or a value derived from the parameters,
rather than something the user supplies:

```mojo
struct Circle[radius: Float64]:
    comptime pi = 3.14159265359
    comptime circumference = 2 * Self.pi * Self.radius
```

> The difference between parameters and `comptime` members is that parameter
> values are specified by the user, but `comptime` members represent either
> constant values or values derived from the input parameters.

Source: <https://mojolang.org/docs/manual/parameters/>.

`comptime` members are also how Mojo expresses enumerations and associated
types:

```mojo
@fieldwise_init
struct Sentiment(Equatable, ImplicitlyCopyable):
    var _value: Int

    comptime NEGATIVE = Sentiment(0)
    comptime NEUTRAL = Sentiment(1)
    comptime POSITIVE = Sentiment(2)

    def __eq__(self, other: Self) -> Bool:
        return self._value == other._value

    def __ne__(self, other: Self) -> Bool:
        return not (self == other)
```

Source: <https://mojolang.org/docs/manual/parameters/>.

A required value — a `comptime` member without an initializer — must be provided
by each conforming type, which is how a trait requires a compile-time constant.
Source: <https://mojolang.org/docs/manual/parameters/>.

### Struct and lifecycle methods

A struct's method can declare its own parameters:

```mojo
def slice_demo():
    var m = SIMD[DType.int32, 4](1, 3, 5, 7)
    var n = m.slice[2]()
    print(n)   # [1, 3]
```

> A struct's lifecycle methods (`__init__()` and `__deinit__()`) are an exception
> to this rule — they can't take parameters.

Source: <https://mojolang.org/docs/manual/parameters/>.

## Partially-bound and unbound types

A type with all parameters bound is *fully-bound* (a *concrete type*), and only
a fully-bound type can be instantiated. You can still name a type with some
parameters unbound, in three ways:

- **Underscore `_`** — unbind one parameter explicitly:

  ```mojo
  comptime StringKeyDict = Dict[String, _]

  def take_floats(floats: SIMD[DType.float32, _]): pass
  ```

  Every parameter must be bound or explicitly unbound unless Mojo can infer it,
  so `comptime Bad = Dict[String]` is an error.

- **Ellipsis `...`** — unbind every remaining parameter, "including keyword
  parameters":

  ```mojo
  comptime PartiallyBound = SomeComplicatedType[String, ...]
  comptime Unbound = SomeComplicatedType[...]

  def take_simd(v: SIMD[...]): pass
  ```

- **Bare identifier** — no brackets at all:

  ```mojo
  def take_simd2(v: SIMD): pass
  ```

  The docs prefer `SIMD[...]` or `SIMD[_, _]` over bare `SIMD`, "as a visual cue
  to readers that they're looking at a parameterized type."

Source: <https://mojolang.org/docs/manual/parameters/>.

When an unbound type is used as a `comptime` value, default values on its
unbound parameters are retained until a concrete type is formed:

```mojo
@fieldwise_init
struct HasDefault[x: Int, y: Int = 0]:
    pass

comptime UseDefault = HasDefault[10]

def demo():
    var instance1 = UseDefault()   # HasDefault[10, 0]
```

Source: <https://mojolang.org/docs/manual/parameters/>.

## Automatic parameterization

Writing every parameter out by hand is repetitive. Instead, you can write an
unbound or partially bound type in the signature, and Mojo turns its unbound
parameters into infer-only parameters on the function:

```mojo
def take_simd(vec: SIMD[...]):
    print(vec.dtype)
    print(vec.length)

def main():
    var v = SIMD[DType.float64, 4](1.0, 2.0, 3.0, 4.0)
    take_simd(v)
```

```output
float64
4
```

> Mojo treats the unbound parameters on `vec` as infer-only parameters on the
> function.

Source: <https://mojolang.org/docs/manual/parameters/>.

The two differences between the manual and automatic forms:

- In the manual form you can use the parameters **by name**; in the automatic
  form you reach them through the argument via dot syntax (`vec.dtype`,
  `vec.length`).
- In the manual form the caller can pass parameter values directly; the
  automatic form's unbound parameters "are always inferred".

Source: <https://mojolang.org/docs/manual/parameters/>.

Automatic parameterization also works for partial binding, in the parameter
list, and in type expressions:

```mojo
@fieldwise_init
struct Fudge[sugar: Int, cream: Int, chocolate: Int = 7](Writable):
    pass

def eat(f: Fudge[5, ...]):
    print("Ate", f)

def devour(f: Fudge[_, 6, _]):
    print("Devoured", String(f))

def main():
    eat(Fudge[5, 5, 7]())    # Ate Fudge (5,5,7)
    eat(Fudge[5, 8, 9]())    # Ate Fudge (5,8,9)
    devour(Fudge[3, 6, 9]()) # Devoured Fudge (3,6,9)
```

The unbound parameters of `Fudge` become implicit parameters of `eat()` and
`devour()`. Source: <https://mojolang.org/docs/manual/parameters/>.

```mojo
def interleave(v1: SIMD[...], v2: type_of(v1)) -> SIMD[v1.dtype, v1.length * 2]:
    var result = SIMD[v1.dtype, v1.length * 2]()
    comptime for i in range(v1.length):
        result[i * 2] = v1[i]
        result[i * 2 + 1] = v2[i]
    return result
```

`type_of(x)` matches the type of an argument, and the parameters of an argument
can be used inside the signature. Source:
<https://mojolang.org/docs/manual/parameters/>.

## `Some[Trait]` — conformance on the argument

Instead of declaring a type parameter in one place and using it in another, you
can put the constraint directly on the argument with `Some[Trait]` (or
`SomeTypeList[Trait]` for variadic packs):

```mojo
# Before
def foo[T: Intable, //](x: T) -> Int:
    return x.__int__()

# After
def foo(x: Some[Intable]) -> Int:
    return x.__int__()
```

`Some` works with a single trait, a trait composition, function types, and
under any argument convention. For a variadic pack, use `*SomeTypeList`:

```mojo
# Before
def show[*Ts: Writable](*pack: *Ts):
    ...

# After
def show(*pack: *SomeTypeList[Writable]):
    ...
```

Source: <https://mojolang.org/docs/manual/generics/>.

`Some` cannot replace a type parameter everywhere. A **struct field** has no
call site to infer from, so the compiler reports that the field isn't concrete:

```mojo
@fieldwise_init
struct Struct(Writable):
    # Error: a `Some` struct field has no concrete type to infer
    var x: Some[Copyable & Deinitable & Writable]
```

Move the conformances back to a parameterized type parameter:

```mojo
@fieldwise_init
struct StructFixed[T: Copyable & Deinitable & Writable](Writable):
    var x: Self.T
```

Source: <https://mojolang.org/docs/manual/generics/>.

## `where` clauses and conditional availability

A `where` clause is a constraint that appears at the end of a declaration, after
the return type (or after the argument list when there is no return type). It is
how a parameterized declaration states a condition that must hold:

```mojo
def process(self, value: Self.T) where conforms_to(Self.T, Writable):
    print(value)
```

> Call `conforms_to(T, Trait)` to test whether `T` satisfies a trait. Combine
> multiple checks with `and` or `or` to express more complex conditions.

> Conditions are not limited to trait checks. They can also constrain
> compile-time facts, such as a data length being a power of two or a capacity
> being positive.

Source: <https://mojolang.org/docs/manual/generics/>.

A `where` clause can also test predicates on params (for example whether a
`DType` is floating-point). What it **cannot** do is evaluate target facts like
`is_64bit()` or `is_nvidia_gpu()`, or arbitrary compile-time functions:

> The compiler can't carry those as proof. For those cases, use `comptime if`
> instead.

Source: <https://mojolang.org/docs/manual/generics/>.

Full constraint semantics are on the metaprogramming page; see
[decorators and metaprogramming](decorators-and-metaprogramming.md). Two
mechanical rules are worth stating here, because they bite when you copy old
code:

> A `where` clause inside a parameter list is invalid.
> A `where` clause in an argument list is invalid.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

```mojo
# Wrong: `where` is not allowed inside a parameter list.
def wrong1[n: Int where n > 0]():
    pass

# Wrong: `where` clauses can only be used with compile-time parameters.
def wrong2(x: Int where x > 0):
    pass

# Correct: the `where` clause follows the signature.
def correct[n: Int]() where n > 0:
    pass
```

### Conditional trait conformance

A struct can declare that it conforms to a trait **only when** a condition is
met. This is the pattern behind `Optional[T]`, `List[T]`, `Pair[L, R]`,
`Dict[K, V]`, and most containers:

```mojo
comptime BaseTraits = Copyable & Deinitable & Writable

@fieldwise_init
struct Wrapper[T: BaseTraits](Writable where conforms_to(T, Writable)):
    var value: Self.T
```

When `T` is `Writable`, `Wrapper[T]` is `Writable` and the trait supplies the
default `write_to()`; when `T` is not, you can still build the struct but cannot
print it. Source: <https://mojolang.org/docs/manual/generics/>.

For types with multiple components, each part gets its own condition. `Pair`
becomes `Hashable` only when **both** elements are:

```mojo
comptime Base2 = Copyable & Deinitable

@fieldwise_init
struct Pair2[L: Base2, R: Base2](
    Hashable where conforms_to(L, Hashable) and conforms_to(R, Hashable)
):
    var left: Self.L
    var right: Self.R
```

Source: <https://mojolang.org/docs/manual/generics/>.

Trait conformance and the method implementations are gated by the *same*
condition, so they cannot drift apart:

```mojo
@fieldwise_init
struct Wrapper2[T: BaseTraits](
    Writable where conforms_to(T, Writable),
    Boolable where conforms_to(T, Boolable),
):
    var value: Self.T

    def __bool__(self) -> Bool where conforms_to(Self.T, Boolable):
        return self.value.__bool__()
```

Source: <https://mojolang.org/docs/manual/generics/>.

Conditions can be mixed and may include value parameters. `Sized` is
unconditional here, while `Writable` additionally requires a positive
`capacity`:

```mojo
comptime ElementTraits = Writable & Copyable & Deinitable

struct SizedListWrapper[capacity: Int, T: ElementTraits](
    Sized, Writable where conforms_to(T, Writable) and capacity > 0
):
    var data: List[Self.T]

    def __len__(self) -> Int:
        return len(self.data)

    def first(self) -> Self.T where Self.capacity > 0:
        return self.data[0].copy()
```

Source: <https://mojolang.org/docs/manual/generics/>.

## `rebind()` — asserting that two parameterized types are equal

Mojo does not instantiate parameterized functions in the parser, so it cannot
always prove that two parameterized types are equal in a static-dispatch
pattern:

```mojo
def take_simd8(x: SIMD[DType.float32, 8]):
    pass

def parameterized_simd[nelts: Int](x: SIMD[DType.float32, nelts]):
    comptime if nelts == 8:
        take_simd8(x)   # Error: cannot convert 'SIMD[f32, nelts]' to 'SIMD[f32, 8]'
```

The remedy is `rebind[Type](value)`, which "inserts a compile-time assertion that
the input and result types resolve to the same type after elaboration":

```mojo
def take_simd8b(x: SIMD[DType.float32, 8]):
    pass

def parameterized_simd2[nelts: Int](x: SIMD[DType.float32, nelts]):
    comptime if nelts == 8:
        take_simd8b(rebind[SIMD[DType.float32, 8]](x))
```

The official rules for when to reach for it:

> - **Do** use `rebind()` when you know that two parametric types will be
>   identical after elaboration.
> - **Don't** use `rebind()` to cast between arbitrary data types.

`rebind()` returns a reference; use `rebind_var()` if you need to transfer or
assign the rebound value. Source:
<https://mojolang.org/docs/manual/parameters/>.

## Pitfalls

- **Putting a run-time value in `[]`.** Parameters must resolve to constants;
  `range(count)` only works in `comptime for` because `count` is a parameter.
  Verified above.
- **Reversing a dependent parameter list.** A parameter can depend only on
  parameters earlier in the list. Make the depended-on one infer-only with `//`
  when you want to omit it. Verified above.
- **Trying to bind an infer-only parameter positionally.** Infer-only
  parameters are inferred or passed by keyword only. Source:
  <https://mojolang.org/docs/reference/function-declarations/>.
- **Using `Some[Trait]` for a struct field.** A field has no call site to infer
  from; the compiler reports that the field isn't concrete. Use a type parameter.
  Verified above.
- **Putting `where` inside `[]` or `()`.** Both are invalid; the clause goes at
  the end of the declaration. Source:
  <https://mojolang.org/docs/reference/function-declarations/>.
- **Expecting a default parameter to win over inference.** An inferred parameter
  value takes precedence over the parameter's default. Verified above.
- **Using `...` to unbind parameters on a type that may grow a parameter.**
  This is the documented `List[T, ...]` trap; see
  [stability](../intro/stability.md). Source:
  <https://mojolang.org/docs/api-docs/stability/>.
- **Calling a parameterized value with `len()`-style run-time checks.** For a
  `VariadicPack`, `args.__len__()` is what a `comptime for` needs, not
  `len(args)`. Source: <https://mojolang.org/docs/reference/function-declarations/>.

## Open questions

> **Open question:** the parameterization page shows `def repeat[count: Int]`
> with the note that the function is "roughly equivalent" to an unrolled body,
> but the exact specialization count is described as an implementation detail
> ("This doesn't represent actual code generated by the compiler"). Do not rely
> on a specific number of generated functions.

> **Open question:** the generics page says a `where` clause "can't do is
> evaluate target facts like `is_64bit()`", while its own examples use
> `dtype.is_floating_point()` in a condition. Which builtin predicates are
> evaluable in a `where` clause is explicitly not a fixed list: "there's no way
> to identify these builtin functions without looking at the source code, and
> whether a given function is builtin may change without notice." Prefer a
> parameterized `comptime` value when you need a predicate that always inlines.

## Sources

- Mojo manual — Parameterization: <https://mojolang.org/docs/manual/parameters/>
- Mojo manual — Parameterized declarations (generics): <https://mojolang.org/docs/manual/generics/>
- Mojo manual — Functions: <https://mojolang.org/docs/manual/functions/>
- Mojo reference — Function declarations: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo identifiers, keywords, and conventions reference: <https://mojolang.org/docs/reference/keywords/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
