# comptime

`comptime` forces compile-time evaluation. It declares compile-time constants,
selects compile-time branches and loops, feeds the constraint system, and
declares type-level members of structs and traits.

## Purpose

The official keywords reference defines `comptime` in one line:

> `comptime` — Forces compile-time evaluation

Source: <https://mojolang.org/docs/reference/keywords/>.

The expression reference:

> `comptime` forces an expression to evaluate at compile time. Parentheses are
> required:

```mojo
var x = comptime(heavy_calculation())  # O(1) at runtime
print(x)  # 499999500000
```

> The loop runs once during compilation. At runtime, `x` is a constant. If the
> expression can't be evaluated at compile time, the compiler reports an error.

Source: <https://mojolang.org/docs/reference/expressions/>.

## The forms of `comptime`

| Form | Meaning |
|------|---------|
| `comptime NAME = value` | A named compile-time constant (or type alias). |
| `comptime(expression)` | Force an expression to be evaluated at compile time. |
| `comptime if … / elif … / else …` | Compile-time branch; only the live branch is compiled. |
| `comptime for …` | Compile-time loop unrolling. |
| `comptime assert cond, "msg"` | Compile-time assertion. |
| `comptime NAME[params] : Type = …` | Parameterized `comptime` value. |
| `comptime name = value` in a struct/trait | A type-level member (constant or associated type). |

## `comptime` values

The metaprogramming manual frames the whole feature around the compile-time
execution triggers:

> Several things can trigger compile-time code execution: assigning an
> expression to a `comptime` value; evaluating a `comptime` conditional or loop;
> assigning an expression to a compile-time parameter; and a few less common
> cases, all identified with the `comptime` keyword.

```mojo
comptime SIZE = 1024 // 32
```

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

A `comptime` value can be a type, which makes it a type alias:

```mojo
comptime Float16 = SIMD[DType.float16, 1]
comptime UInt8 = SIMD[DType.uint8, 1]

var x: Float16 = 0  # Float16 works like a "typedef"
```

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

Unlike `var` variables, `comptime` values can be defined at module level:

> Like `var` variables, `comptime` values obey scope, and you can use local
> `comptime` values within functions as you'd expect. Unlike `var` variables,
> `comptime` values can be defined at the module level, outside of any function.

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

And a name can only be assigned once per scope:

```mojo
comptime VALUE = 10

def scope_me():
    print(VALUE)  # prints 10
    comptime VALUE = 20
    # comptime VALUE = 30  # error: invalid redeclaration of VALUE
    comptime if True:
        comptime VALUE = 40
        print(VALUE)  # prints 40
    print(VALUE)  # prints 20
```

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

The simple-statements reference gives the declaration form and a type-alias use:

```mojo
comptime SIZE = 256
comptime MAX = SIZE * 2
```

```mojo
comptime Permissive = ImplicitlyCopyable & Deinitable
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## Parameterized `comptime` values

A parameterized `comptime` value is a compile-time-only function that returns a
compile-time value:

```mojo
comptime AddOne[a: Int] : Int = a + 1

comptime nine = AddOne[8]
```

> A major difference between a function and a parameterized `comptime` value is
> that the value of a `comptime` expression can be a type, while a function can't
> return a type as a value.

```mojo
comptime TwoOfAKind[dt: DType] = SIMD[dt, 2]
var twoFloats = TwoOfAKind[DType.float32](1.0, 2.0)
```

Source: <https://mojolang.org/docs/manual/parameters/>.

A `where` clause can constrain the parameters:

```mojo
comptime AscendingMidpoint[lo: Int, hi: Int]: Int where lo < hi = (lo + hi) / 2

def main():
    comptime mid = AscendingMidpoint[2, 10]    # 6
    # comptime bad = AscendingMidpoint[10, 2]  # Error: lo < hi not satisfied
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## `comptime if`

```mojo
from std.sys import size_of

comptime if size_of[Int]() == 8:
    print("64-bit")
else:
    print("Probably 32-bit")
```

> `comptime if` selects a branch at compile time, pruning the unselected
> branches. Only the selected branch appears in the compiled program.

> `comptime if` supports `elif` and `else` like the regular `if` statement.

Source: <https://mojolang.org/docs/reference/compound-statements/>.

The condition must be a compile-time expression:

```mojo
comptime if runtime_value > 0:   # Error because 'comptime if' requires
    pass                         # compile-time evaluation
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

A `comptime if` can also introduce knowledge into the constraint system:

> Inside a `comptime if`, the `if` condition is known, because the code within the
> body is only instantiated if the condition is true.

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

## `comptime for`

```mojo
comptime for i in range(3):
    print(i)   # Compiled as: print(0); print(1); print(2)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

> You should generally use this only for loops with small loop bodies and low
> iteration counts. ... The `comptime for` construct unrolls at the beginning of
> compilation, which can greatly expand both the code size and the compilation
> time.

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

## `comptime assert`

```mojo
comptime assert x > 0, "x must be greater than 0."
```

> The message is optional. If the condition evaluates to false at compile time,
> compilation fails and the compiler shows the message (or a default message if
> none is specified).

> Mojo adds the asserted condition to the list of "known true" propositions for
> any code following the assertion.

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

The tools page frames it as a precondition mechanism:

```mojo
def gpu_kernel():
    comptime assert is_gpu(), "this function requires a GPU target"
```

```output
note: constraint failed: this function requires a GPU target
```

Source: <https://mojolang.org/docs/tools/feature-toggles/>.

## `comptime` members in structs and traits

Inside a struct or trait, `comptime` declares a type-level member:

```mojo
struct Circle[radius: Float64]:
    comptime pi = 3.14159265359
    comptime circumference = 2 * Self.pi * Self.radius
```

> The difference between parameters and `comptime` members is that parameter
> values are specified by the user, but `comptime` members represent either
> constant values or values derived from the input parameters.

Source: <https://mojolang.org/docs/manual/parameters/>.

In a trait, a `comptime` member without an initializer is an associated type or a
required value, and **only traits** may use that form:

```mojo
trait Boxable:
    comptime Associated: Writable & Copyable & Deinitable
```

```mojo
struct Unsupported:
    comptime X: Int
    # Error: only traits may contain a comptime member without an initializer
```

Source: <https://mojolang.org/docs/reference/trait-declarations/>.

`comptime` members are also how the standard library expresses enumerations:

```mojo
@fieldwise_init
struct Sentiment(Equatable, ImplicitlyCopyable):
    var _value: Int

    comptime NEGATIVE = Sentiment(0)
    comptime NEUTRAL = Sentiment(1)
    comptime POSITIVE = Sentiment(2)
```

Source: <https://mojolang.org/docs/manual/parameters/>.

## `comptime` and the constraint system

`comptime` is the tool that supplies missing proof. Three ways to satisfy a
`where` constraint:

> If a caller gets a "lacking evidence" error, they can:
> 1. Add a constraint to push the requirement onto their own callers.
> 2. Branch on the condition (`comptime if`).
> 3. Assert an invariant (`comptime assert`).

Source: <https://mojolang.org/docs/manual/metaprogramming/constraints/>.

## Compiling a parameterized `comptime` value

The parser accepts standard-library builtins in parameter contexts (constant
folding); the elaborator runs the interpreter for anything that can't be folded.
Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

Code that Mojo will **not** run at compile time:

> - File I/O.
> - Foreign function calls (for example, to external libraries).
> - Functions that can raise errors.

Source: <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `if` | `comptime if` is the compile-time branch form. |
| `for` | `comptime for` unrolls at compile time. |
| `assert` | `comptime assert` is the compile-time assertion form. |
| `var` | The runtime variable; `comptime` is its compile-time counterpart. |
| `struct`, `trait` | Host `comptime` members; only traits may omit the initializer. |
| `Self` | Refers to the enclosing type inside a `comptime` member. |
| `alias` (not a keyword) | The pervasive legacy spelling for what 1.x calls `comptime`. |

## Signature vs. body

`comptime` appears in three positions:

- **Statements/bodies**: `comptime NAME = …`, `comptime if`, `comptime for`,
  `comptime assert`, `comptime(expr)`.
- **Declarations**: `comptime` members inside a struct or trait body.
- **Parameter expressions**: a `comptime` value is usable anywhere a parameter or
  a compile-time expression is expected, and can itself be parameterized.

It never appears in a `def` signature; compile-time inputs to functions are
declared as **parameters** in square brackets. Source:
<https://mojolang.org/docs/manual/parameters/>.

## Pitfalls

- **Using `comptime(expr)` without parentheses.** The expression reference notes
  the parentheses are required: `var x = comptime heavy_calculation()` is an
  error. Source: <https://mojolang.org/docs/reference/expressions/>.
- **Runtime values in `comptime` contexts.** Only parameter-evaluable
  expressions are allowed; a runtime value in a `comptime if` is a compile error.
  Source: <https://mojolang.org/docs/reference/compound-statements/>.
- **Redeclaring a `comptime` name in the same scope.** An error; each name is
  assignable once per scope. Source:
  <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.
- **Assuming `comptime` is `const`.** It is a compile-time evaluated value; there
  is no runtime storage to mutate.
- **`comptime for` with large bodies.** Unrolling can explode code size and
  compile time. Source:
  <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.
- **Expecting all code to run at compile time.** File I/O, FFI and raising
  functions are excluded. Source:
  <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>.
- **`comptime` member without an initializer in a struct.** Rejected; only traits
  may declare associated types or required values that way. Source:
  <https://mojolang.org/docs/reference/trait-declarations/>.
- **`where` inside a parameter list.** No longer supported; put `where` after the
  signature. Source: <https://mojolang.org/releases/v1.0.0/>.
- **Confusing `alias` with `comptime`.** `alias` is the pre-1.0 spelling and is
  **not** on the official keyword list; 1.x uses `comptime`. Source:
  <https://mojolang.org/docs/reference/keywords/>.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`if`](if.md), [`for`](for.md), [`assert`](assert.md),
[`var`](var.md), [`struct`](struct.md), [`trait`](trait.md), [`Self`](self.md),
[`simple-statements`](../reference/simple-statements.md),
[`compound-statements`](../reference/compound-statements.md),
[`decorators-and-metaprogramming`](../functions/decorators-and-metaprogramming.md),
[`alias`](../keyword-conventions/alias.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Mojo expression reference:
  <https://mojolang.org/docs/reference/expressions/>
- Mojo trait declarations reference:
  <https://mojolang.org/docs/reference/trait-declarations/>
- Compile-time evaluation (manual):
  <https://mojolang.org/docs/manual/metaprogramming/comptime-evaluation/>
- Parameterization (manual): <https://mojolang.org/docs/manual/parameters/>
- Comptime constraints and assertions (manual):
  <https://mojolang.org/docs/manual/metaprogramming/constraints/>
- Compilation feature toggles (tools):
  <https://mojolang.org/docs/tools/feature-toggles/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
