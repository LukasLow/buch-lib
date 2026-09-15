# lambda

`lambda` declares an anonymous, single-expression function. It is Mojo's
function-literal keyword: the body is one expression, it has no name, and it is
most often passed directly to another function.

## Purpose

The official keywords reference defines `lambda` in one line:

> `lambda` — Anonymous single-expression function

Source: <https://mojolang.org/docs/reference/keywords/>.

> A `lambda` is an anonymous, single-expression function. Its arguments are
> parenthesized and typed, like a function declaration, and its body is a single
> expression with no `return`.

Source: <https://mojolang.org/docs/reference/expressions/>.

```mojo
def main():
    var inc = lambda (x: Int) -> Int: x + 1
    print(inc(4))  # 5
```

> This lambda is equivalent to the following function declaration:
>
> ```mojo
> def inc(x: Int) -> Int:
>     return x + 1
> ```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

## Syntax

```text
lambda [[parameter-list]] [(argument-list)] [effects]
       [{capture-list}] [-> ResultType] : expression
```

> The simplest lambda takes no arguments, captures nothing, and returns `None`:
>
> ```text
> lambda: None
> ```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

A fuller set of variations, quoted from the reference:

```mojo
def main():
    # Fully explicit. Uses an empty "no-capture" capture list `{}`
    var a = lambda (x: Int) {} -> Int: x + 1

    # Parameterized
    var b = lambda [T: Intable](x: T) -> Int: Int(x) + 1

    var y = 1
    # Capture list omitted. `y` defaults to `imm`
    var c = lambda (x: Int) -> Int: x * 2 + y

    # Return type omitted (`None`)
    var list: List[Int] = [1]
    var d = lambda (x: Int) {mut list}: list.append(x)

    # Arguments and return type omitted. Mutable capture
    var e = lambda {mut list}: list.append(0)
    print(a(4), b(4))  # 5 8
```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

## Arguments

> Each argument must appear in parentheses and have a type. Types can be
> concrete (`String`) or parameterized (`T`, `Self.U`):

```mojo
# Concrete argument
var hello = lambda (x: String) {} -> String: "Hello, " + x

# Parameterized argument
var inc = lambda [T: Intable](x: T) -> Int: Int(x) + 1
```

> Omit the argument list for lambdas that don't take arguments:
>
> ```mojo
> var no_args = lambda -> Int: 42
> ```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

There is **no argument-type inference**: "Arguments need types: There's no
argument-type inference from the use site." Source:
<https://mojolang.org/docs/reference/lambda-expressions/>.

Arguments use the same conventions as functions, with `imm` as the default:

```mojo
var read_arg = lambda (x: Int) {} -> Int: x + 1
# Same as: var read_arg = lambda (imm x: Int) {} -> Int: x + 1
var own_arg = lambda (var x: Int) {} -> Int: x + 1
var mut_arg = lambda (mut x: Int) {}: x.__iadd__(1)
```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

Variadics are supported, and `var **kwargs` is required for keyword variadics:

```mojo
var count = lambda (*args: Int) {} -> Int: len(args)
var named = lambda (var **kwargs: Int) {} -> Int: len(kwargs)
print(count(10, 20, 30))  # 3
print(named(a=1, b=2))    # 2
```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

## Return types — the biggest trap

Return-type **inference is not implemented**. An omitted return type means
`None`, not "figure it out":

> :::caution
> Lambda expressions are under active development.
>
> Return-type inference isn't implemented. If you omit the return type, the
> lambda returns `None`, even when its body produces a value.
> :::

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

```mojo
lambda: 5                     # Error: can't convert IntLiteral to None
lambda (x: Int) {}: x + 1     # Error: can't convert Int to None
```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

The 1.0 release notes confirm these are "fixed defaults, not inference":

> You can elide the capture list `{…}` and the return type: an omitted capture
> list imm-captures the body's free variables (and is thin when there are none),
> and an omitted return type defaults to `None`—so the bare `lambda: expr` is
> valid when `expr` is `None`-typed. These are fixed defaults, not inference (a
> non-`None` body still needs an explicit `-> T`).

Source: <https://mojolang.org/releases/v1.0.0/>.

## Closures and capture lists

A lambda becomes a *closure* when it carries state from the enclosing scope or
declares its own parameters:

> A lambda becomes a closure under these circumstances:
>
> - The lambda body references a value from the enclosing scope.
> - The lambda body uses an explicit capture convention.
> - The lambda declares its own parameter list.

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

```mojo
var z = 10
var f = lambda (x: Int) -> Int: x + z  # `z` is captured; default is `imm`
print(f(5))  # 15
```

```mojo
var list: List[Int] = [1, 2, 3]
var f = lambda (x: Int) {mut list}: list.append(x)  # mut capture
f(10)
print(list)  # [1, 2, 3, 10]
```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

An empty capture list means "capture nothing", and referencing an outer value
then becomes an error:

```mojo
var z = 10
var f = lambda (x: Int) {} -> Int: x + z  # Error: z isn't captured
```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

Capture conventions are the same set as nested `def` closures — `imm`, `mut`,
`ref`, `var` — documented in
[closure declarations](../reference/closure-declarations.md). Source:
<https://mojolang.org/docs/reference/lambda-expressions/>.

## Thin versus capturing lambdas

A lambda that captures nothing, uses no explicit capture convention, and
declares no parameters is **thin**, and a thin lambda is a plain function value:

> A lambda that isn't a closure is `thin`. To be thin, a lambda captures
> nothing, uses no explicit capture conventions, and doesn't declare its own
> parameters.

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

The 1.0 release notes put the distinction sharply: "A thin (capture-free)
`lambda` is a function value, exactly like a `def` referenced by name; any other
`lambda` is a closure instance, a runtime value with no function type." Source:
<https://mojolang.org/releases/v1.0.0/>.

Thin lambdas can be used as thin function pointers (including `abi("C")`
callbacks), passed to thin function-type parameters, bound with `comptime`,
returned from a function, stored in a struct field, and used as default values:

```mojo
var fp = lambda (a: Int32, b: Int32) abi("C") -> Int32: a + b
print(fp(1, 2))  # 3
```

> The `abi("C")` effect must appear on the lambda declaration. It's not enough to
> type the variable. If you choose to use explicit typing, the type must *also*
> carry the `abi("C")` effect.

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

A thin lambda can be executed at compile time:

```mojo
def main():
    comptime whole = (lambda (x: Int) {} -> Int: x * 2)(21)
    print(whole)  # 42
```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

## Effects

Effects go after the argument list and before the capture list:

```mojo
def apply_raising(f: def(x: Int) raises thin -> Int, arg: Int) raises
    -> Int:
    return f(arg)

def main() raises:
    print(apply_raising(lambda (x: Int) raises -> Int: x + 1, 2))  # 3
```

> Every lambda body is a single expression and can't contain a `raise`
> statement. Lambdas only raise by calling something else that raises.
> Declaring `raises` allows the lambda to propagate exceptions, not raise them.

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

## Restrictions

Quoted in full from the reference:

- **Single expression**: The body is one expression. There's no `return`, no
  statement body, and no multi-statement form.
- **No return-type inference**: An omitted return type is `None`, not a solved
  type.
- **Arguments need types**: There's no argument-type inference from the use site.
- **No `thin` in the signature**: `thin` applies to function *types*, not to
  lambda declarations.

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

## What a lambda desugars to

The 1.0 release notes state that lambdas "desugar to a nested `def`". Source:
<https://mojolang.org/releases/v1.0.0/>. The reference frames them as part of
the function-declaration family: "In Mojo, lambda expressions are part of the
function declaration family." Source:
<https://mojolang.org/docs/reference/lambda-expressions/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `def` | The named counterpart; a lambda is an anonymous expression form. |
| `return` | Not allowed in a lambda body; the body is one expression. |
| `and`, `or`, `not` | Build the single body expression. |
| `if`/`else` | The conditional expression can be a lambda body. |
| `var`, `ref` | Argument and capture conventions usable on lambda arguments and captures. |
| `Self` | Valid in a parameterized argument type such as `Self.U`. |

## Signature vs. body

`lambda` *is* a signature plus a body in one expression, but it never appears in
a `def` signature. A lambda's *type* (`def(Int) -> Int`, with effects) is a
function type usable in parameter and argument positions. Capturing lambdas have
no function type.

## Pitfalls

- **Omitting `-> T`.** The lambda then returns `None`, and a value-producing body
  fails to compile. This is the single most common lambda mistake. Verified
  above.
- **Expecting argument-type inference.** Every argument needs a type.
- **`return` inside a lambda.** Not allowed; write the value as the expression.
- **Capturing accidentally.** An omitted capture list silently captures free
  variables by `imm`. Name captures explicitly to turn accidental references
  into errors. Source: <https://mojolang.org/docs/reference/lambda-expressions/>.
- **Passing a closure where a thin function is required.** The compiler reports
  a thin-conversion error; only capture-free lambdas qualify.
- **`comptime` with a capturing lambda.** A closure cannot be bound to a
  `comptime` name, used as a type parameter, or used as a default parameter
  value. Source: <https://mojolang.org/docs/reference/lambda-expressions/>.
- **Mutating through an `imm` capture.** Produces "Mutating method on an
  immutable value"; use `{mut name}`.
- **`abi("C")` + `raises`.** Rejected by the compiler. Source:
  <https://mojolang.org/docs/reference/closure-declarations/>.
- **Lambdas are under active development.** Treat the details on this page as
  current behavior, per the reference's own caution.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`return`](return.md), [`var`](var.md), [`ref`](ref.md),
[`closures-and-lambdas`](../functions/closures-and-lambdas.md),
[`closure-declarations`](../reference/closure-declarations.md),
[`function-declarations`](../reference/function-declarations.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo lambda expressions reference:
  <https://mojolang.org/docs/reference/lambda-expressions/>
- Mojo expression reference:
  <https://mojolang.org/docs/reference/expressions/>
- Mojo closure declarations reference:
  <https://mojolang.org/docs/reference/closure-declarations/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
