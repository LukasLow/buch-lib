# Closures and lambdas

A *closure* is a function bundled together with values from its surrounding
scope. You define it in one place and pass it somewhere else to run; the closure
carries captured data with it. A *lambda* is an anonymous, single-expression
function, and a lambda that captures becomes a closure too.

This page covers nested functions and capture lists, the capture conventions
(`imm`, `mut`, `var`, `ref`, move capture, `{var^}`), the `^` move operator in
captures, closure effects, thin lambdas versus lambda closures, and the
restrictions that remain in 1.x. It merges the manual's closures and lambda
pages with the two language-reference pages.

## What a closure is

> A *closure* is a function bundled together with values from its surrounding
> scope. You define it in one place and pass it somewhere else to run. The
> closure carries captured data with it. The compiler transforms it to a type
> with both behavior and storage.

Source: <https://mojolang.org/docs/manual/functions/closures/>.

The defining syntax is the **capture list**: curly braces after the argument
list that declare which outer values the closure captures and how it interacts
with them.

```mojo
def main():
    var multiplier = 3

    def scale(x: Int) {imm multiplier} -> Int:
        return x * multiplier

    print(scale(5))   # 15
```

> Without a capture list, the inner function can't see anything outside its own
> arguments.

Source: <https://mojolang.org/docs/manual/functions/closures/>.

Mojo requires captures to be explicit because, in a systems language, "knowing
exactly which values a closure holds, and whether it reads, copies, or takes
ownership of them, matters for both performance and correctness." Source:
<https://mojolang.org/docs/manual/functions/closures/>.

A closure is created when its enclosing `def` runs and exists only for the
lifetime of that enclosing scope. The reference states the restriction plainly:

> Mojo doesn't support escaping closures or async execution.

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

The manual makes the same point and describes the underlying model:

> Mojo doesn't yet support async execution or escaping closures (closures that
> outlive their enclosing scope), but the underlying model is the same: closures
> define what should happen, while something else decides when and where it runs.

Source: <https://mojolang.org/docs/manual/functions/closures/>.

The pre-1.0 `escaping` function effect no longer exists:

> The `escaping` function effect is no longer supported.

Source: <https://mojolang.org/releases/v1.0.0b1/>. The old→new mapping is
recorded in [`versions/1.0.0`](../versions/1.0.0.md). There is no 1.x replacement
effect: a closure simply cannot escape its declaring scope.

## Closure syntax

```text
def name(argument-list) {capture-list} -> ReturnType:
    body

def name[parameter-list](argument-list) {capture-list}
    -> ReturnType:
    body

def name(argument-list) raises {capture-list} -> ReturnType:
    body
```

> Effects (`raises`) go between the argument list and the capture list. The
> capture list appears immediately before the return arrow. It can be empty
> (`{}`) or omitted entirely; both forms prohibit references to outer values.

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

The argument list, parameter list, effects, return type and `where` clauses
follow the same rules as top-level functions. The full declaration grammar is in
[function declarations](../reference/function-declarations.md).

## Capture list grammar

A capture list is a brace-enclosed, comma-separated sequence of entries:

| Form | Meaning |
|------|---------|
| `<conv> name` | Capture `name` with convention `<conv>` |
| `<conv>` | Default convention for all free variables |
| `name` | Capture `name` with convention `imm` |
| `<conv> name^` | Move-capture (only with `var` or no `<conv>`) |

`<conv>` is one of `imm`, `mut`, `var`, `ref`. Position within the list is not
significant: `{mut, var z}` and `{var z, mut}` are equivalent. Trailing commas
are accepted.

> At most one entry can omit a name (the default-convention entry). A second
> produces: `error: default capture convention was already specified; remove the
> duplicate`.

> The `^` marker is only legal on `var` entries or entries with no convention
> keyword.

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

## Capture conventions

The six documented forms and their storage:

| Convention | Form | Storage in closure | Lifetime tie to outer |
|------------|------|--------------------|-----------------------|
| `imm` | `{imm name}` / `{imm}` | Immutable reference | Live |
| `mut` | `{mut name}` / `{mut}` | Mutable reference | Live |
| `ref` | `{ref name}` / `{ref}` | Reference, mutability from origin | Live |
| `var` | `{var name}` / `{var}` | Owned copy | Independent |
| Move | `{var name^}` | Owned, consumed from outer | Consumes outer |
| Copyable | `{var^}` | Owned, closure is `Copyable` | Independent |

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

### `imm` — immutable reference

Use `imm` when the closure needs to see a value but not change it. Because it is
a reference, the closure observes the outer value's current state at each call:

```mojo
def main():
    var limit = 10

    def check(x: Int) {imm limit} -> Bool:
        return x < limit

    print(check(5))   # True
    limit = 3
    print(check(5))   # False  (sees updated limit)
```

`{imm}` (no name) applies `imm` to every free variable in the body, and a bare
name also defaults to `imm`: `{x}` is equivalent to `{imm x}`. Source:
<https://mojolang.org/docs/manual/functions/closures/>.

### `mut` — mutable reference

Use `mut` when the closure must modify a captured value and make the change
visible in the enclosing scope:

```mojo
def main():
    var total = 0

    def accumulate(x: Int) {mut total}:
        total += x

    accumulate(10)
    accumulate(20)
    print(total)   # 30
```

`{mut}` captures every free variable by mutable reference. Source:
<https://mojolang.org/docs/manual/functions/closures/>.

### `var` — owned copy

Use `var` when the closure needs its own independent copy. The copy constructor
runs at the point where the closure is **declared**:

```mojo
def main():
    var snapshot_val = 42

    def frozen() {var snapshot_val} -> Int:
        return snapshot_val

    snapshot_val = 999
    print(frozen())   # 42  (captured the value at definition time)
```

> Copy captures call the value's copy constructor at the point where the closure
> is defined. For types with expensive copies (large lists, strings with
> allocations), prefer `imm` or `mut` when you don't need an independent copy.

Source: <https://mojolang.org/docs/manual/functions/closures/>.

### Move capture: `var name^`

Use `var name^` to transfer ownership of a value into the closure. The closure
consumes the outer binding, which cannot be used afterwards:

```mojo
def main():
    var data: List[Int] = [1, 2, 3]

    def take_data() {var data^}:
        print(data)

    take_data()   # [1, 2, 3]
    # print(data)  # Error: 'data' is uninitialized after move
```

> Move capture avoids a copy entirely. The value moves into the closure's
> storage. This is useful for types that are expensive to copy or for
> transferring unique ownership.

Movement is written with the transfer operator `^`, and its legal forms are
restricted:

> The `^` transfer operator only works with `var` or a bare name in capture
> lists. `{mut name^}`, `{ref name^}`, and `{imm name^}` are compiler errors.

Source: <https://mojolang.org/docs/manual/functions/closures/>.

The reference repeats the constraint with its diagnostic:

```text
error: '^' requires 'var' convention; write 'var x^' to move a capture
```

and notes that a bare `name^` is equivalent to `var name^`. Source:
<https://mojolang.org/docs/reference/closure-declarations/>.

> **Open question:** the closure reference lists `{ref name^}` among the
> rejected forms but describes the `^` restriction generally as "only legal on
> `var` entries or entries with no convention keyword". Because `ref` is a
> convention keyword, `{ref name^}` is rejected; verify this combination against
> the compiler if you rely on it.

### Copyable closures: `var^`

`{var^}` applies move capture as the default for every free variable. When every
captured type is `Copyable`, the resulting closure value is also `Copyable`,
which lets the closure itself be assigned or passed by value:

```mojo
def main():
    var label = "sensor-1"

    def tag() {var^} -> String:
        return label

    var also_tag = tag   # copies the closure (and its captures)
    print(tag())         # sensor-1
    print(also_tag())    # sensor-1
```

> When you copy a closure created with `{var^}`, each captured value is copied
> again through its copy constructor. For closures that capture large or
> expensive values, be aware of the cost.

Source: <https://mojolang.org/docs/manual/functions/closures/>.

> Without `{var^}`, closures can't be assigned to new variables or copied.

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

The comparison the reference draws:

| Form | Captured names | Closure value |
|------|----------------|---------------|
| `{var name^}` | Only `name`, by move | Not `Copyable` by default |
| `{var^}` | All referenced names, by move | `Copyable` if captures are `Copyable` |

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

### `ref` — caller-determined mutability

`{ref name}` shares the captured name's existing origin; the closure does not
pick a mutability, it forwards whatever the origin already carries. This is for
parameterized code that must work across mutability contexts:

```mojo
def show_mutability(ref items: List[Int]):
    def report() {ref items}:
        comptime if origin_of(items).mut:
            print("mut")
        else:
            print("immut")
    report()

def from_imm(xs: List[Int]):
    show_mutability(xs)

def from_mut(mut xs: List[Int]):
    show_mutability(xs)

def main():
    var nums: List[Int] = [10, 20, 30]
    from_imm(nums)   # immut
    from_mut(nums)   # mut
```

> `ref` is the only convention that forwards origin information unchanged. `imm`
> and `mut` create references with a fixed mutability; `var` removes the origin
> relationship entirely.

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

The manual adds that for most closures "`imm` or `mut` is the right choice."
Source: <https://mojolang.org/docs/manual/functions/closures/>.

## Empty and omitted capture lists

`{}` and no capture list at all produce the same result: any reference to an
outer value is rejected.

```mojo
def main():
    def doubled(x: Int) {} -> Int:
        return x * 2

    print(doubled(5))   # 10
```

```mojo
# This example doesn't compile
def wrong():
    var a = 42

    def bad() {}:
        print(a)   # error: Could not infer capture convention of `a`
```

> `{}` is preferred when the absence of captures is intentional; the explicit
> braces make the constraint visible at the declaration.

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

## Mixing conventions and setting a default

Each entry carries its own convention; conventions do not carry over:

```mojo
def main():
    var config = "prod"
    var count = 0
    var label = "run-1"

    def process() {imm config, mut count, var label}:
        count += 1
        print(config, count, label)

    process()        # prod 1 run-1
    label = "run-2"
    process()        # prod 2 run-1  (label was copied at definition time)
```

A convention keyword without a name sets the **default** for every free variable
not named explicitly. You may use at most one such entry, and entries can appear
in any order:

```mojo
def main():
    var a = 1
    var b = 2
    var z = "snapshot"

    def mixed() {mut, var z}:
        a += 10
        b += 20
        print(a, b, z)

    mixed()          # 11 22 snapshot
    z = "changed"
    mixed()          # 21 42 snapshot  (z was copied at def-time)
```

> The default doesn't apply to names covered by an explicit entry. In
> `{mut, var z}`, the explicit `var z` overrides the default for `z`.

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

## Parametric closures and nesting

A closure can declare its own compile-time parameter list:

```mojo
def main():
    def double[T: Intable](x: T) {} -> Int:
        return Int(x) * 2

    print(double[Int](5))         # 10
    print(double[Float64](3.4))   # 6
```

> The parameter list, capture list, effects, and return type appear in the same
> order as on top-level functions:
> `name[parameters](arguments) effects {captures} -> ReturnType`.

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

Closures nest inside closures. Each level has its own capture list, and a name
captured at one level is visible to inner levels through their own lists:

```mojo
def main():
    var y = 4

    def outer() {var y} -> Int:
        def inner() {var y} -> Int:
            return y
        return inner() + y

    print(outer())   # 8
```

Closures are values, so an inner closure can capture an outer closure by name:

```mojo
def main():
    def make_adder(n: Int):
        def add(x: Int) {var n} -> Int:
            return x + n

        def twice(x: Int) {var add} -> Int:
            return add(add(x))

        print(twice(5))   # 11
    make_adder(3)
```

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

## Effects on closures

Effects appear between the argument list and the capture list:

| Effect | Form | Type example |
|--------|------|--------------|
| `raises` | `(args) raises {captures} -> T` | `def (String) raises -> Int` |
| `thin` | `(args) thin -> T` | `def (T) thin -> U` |
| `abi(language)` | `(args) abi(language) -> T` | `def (Float64) thin abi("C") -> Float64` |

```mojo
def main() raises:
    var y = 2

    def divide(x: Int) raises {var y} -> Int:
        if y == 0:
            raise Error("divide by zero")
        return x // y

    print(divide(10))   # 5
```

Two restrictions come with these effects:

> `thin` and `abi("C")` apply only to closure *types* used as function
> parameters, not to closure declarations. `thin` describes a non-capturing
> function type, which is incompatible with a closure that captures.

> You may not combine non-Mojo `abi()` effects with raising functions. ... The
> Mojo compiler accepts `def (String) abi("Mojo") raises` and rejects
> `def (String) abi("C") raises`.

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

## Capture-list errors

| Compiler complaint | Trigger |
|--------------------|---------|
| Transfer sigil `^` without `var` convention | `^` after `mut`, `imm`, or `ref` |
| Duplicate default convention | Two bare convention keywords in one list |
| Unrecognized token in capture position | Token that isn't a convention keyword or name |
| Missing comma between entries | Identifier followed by an unrecognized token |
| Unterminated capture list | Missing closing `}` |
| Outer name not covered by capture list | Body references an outer name the capture list doesn't cover |
| Use after move capture | Reference to a name after `{var name^}` consumed it |

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

## Closures in practice

### Configurable behavior

A parameterized function can accept any callable with the expected signature, and
the closure carries the configuration:

```mojo
def greet_all[G: def(String) -> None](names: List[String], greet: G):
    for n in names:
        greet(n)

def main():
    var names: List[String] = ["Alice", "Bob"]
    var greeting = "Hello"

    def greeter(name: String) {imm greeting}:
        print(greeting + ", " + name + "!")

    greet_all(names, greeter)
    greeting = "Hi"
    greet_all(names, greeter)   # reflects the updated greeting
```

`greet_all` knows only how to call a `def(String) -> None`; because `greeter`
captures `greeting` by reference, changes between calls are visible. Source:
<https://mojolang.org/docs/manual/functions/closures/>.

### Accumulating and separating logic from execution

```mojo
def main():
    var log = List[String]()

    def record(event: String) {mut log}:
        log.append(event)

    record("started")
    record("processed item")
    record("finished")
    for entry in log:
        print(entry)
```

The standard library uses closures the same way: you supply the logic for one
element, and the library decides how to run it in parallel or across SIMD lanes.

```mojo
from max.algorithm import parallelize

def main():
    var results = List[Int](length=8, fill=0)

    def work(i: Int) {mut results}:
        results[i] = i * i

    parallelize(work, 8)
    print(results)   # [0, 1, 4, 9, 16, 25, 36, 49]
```

Source: <https://mojolang.org/docs/manual/functions/closures/>.

## Lambdas

A lambda expression looks like a function declaration without a name, and its
body is always a single expression:

```mojo
var inc = lambda (x: Int) -> Int: x + 1

def main():
    print(inc(4))   # 5
```

Full grammar:

```text
lambda [[parameter-list]] [(argument-list)] [effects]
       [{capture-list}] [-> ResultType] : expression
```

> Every lambda includes the `lambda` keyword, a body expression, and the `:` that
> introduces it.

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

The simplest lambda takes no arguments, captures nothing, and returns `None`:
`lambda: None`.

### Arguments, types, and return types

Each argument must appear in parentheses and have a type, concrete or
parameterized. Argument conventions are the same as for functions, with `imm`
as the default:

```mojo
def main():
    var read_arg = lambda (x: Int) {} -> Int: x + 1
    var own_arg = lambda (var x: Int) {} -> Int: x + 1
    var mut_arg = lambda (mut x: Int) {}: x.__iadd__(1)

    var list: List[Int] = [1, 2, 3]
    mut_arg(list[0])
    print(list)   # [2, 2, 3]
```

Lambdas support `*args` and `**kwargs` (the latter packs into a dictionary and
must be declared with `var`). Source:
<https://mojolang.org/docs/reference/lambda-expressions/>.

Return types are optional, but **return-type inference is not implemented**:

> If you omit the return type, the lambda returns `None`, even when its body
> produces a value.

```mojo
lambda: 5                     # Error: can't convert IntLiteral to None
lambda (x: Int) {}: x + 1     # Error: can't convert Int to None
```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

> **Open question:** the manual's lambda page shows a "side effects" lambda with
> no return type, and the reference marks lambda support as being under active
> development. Treat return-type inference as absent in 1.x; always write the
> `-> Type` when the lambda's value is used.

## Lambda closures versus thin lambdas

A lambda becomes a **closure** in any of these three cases:

- Its body references a value from the enclosing scope.
- Its body uses an explicit capture convention.
- It declares its own parameter list.

```mojo
def main():
    var z = 10
    var f = lambda (x: Int) -> Int: x + z   # `z` captured; `imm` by default
    print(f(5))   # 15

    var list: List[Int] = [1, 2, 3]
    var g = lambda (x: Int) {mut list}: list.append(x)
    g(10)
    print(list)   # [1, 2, 3, 10]

    var h = lambda [N: Int](x: Int) {} -> Int: x + N
    print(h[5](3))   # 8
```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

Lambda capture lists use the same conventions as nested `def` closures. An
explicit capture convention makes a lambda a closure **even if it captures
nothing**:

> For example, `lambda (x: Int) {imm} -> Int: x + 1` is a closure, while the same
> lambda with the capture list omitted is *thin*.

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

An empty capture list (`{}`) means "capture nothing", so using any outer value
is an error.

### What "thin" buys you

A **thin** lambda captures nothing, uses no explicit capture conventions, and
declares no parameters. A thin lambda can be:

- Used as a thin function pointer, including `abi("C")` callbacks.
- Passed as a thin function-type parameter.
- Bound to a symbol with `comptime`.
- Returned from a function.
- Stored in a struct field.
- Used as a default argument or parameter value.

> Thin matters when a lambda must outlive the scope that created it or is needed
> at compile time.

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

Because thin lambdas carry no run-time state, they can cross a C ABI boundary:

```mojo
var fp = lambda (a: Int32, b: Int32) abi("C") -> Int32: a + b
```

> The `abi("C")` effect must appear on the lambda declaration. It's not enough to
> type the variable.

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

### Compile-time parameters accept thin lambdas only

A lambda passed to a **compile-time parameter** must be thin (either explicitly
typed `thin` or non-capturing). A capturing lambda fails:

```mojo
def inplace_transform[
    T: ImplicitlyCopyable & Deinitable, //, f: def(T) thin -> T
](mut list: List[T]):
    for index in range(len(list)):
        list[index] = f(list[index])

def main():
    var numbers: List[Int] = [1, 2, 3, 4, 5]
    inplace_transform[lambda (x: Int) -> Int: x * 2](numbers)   # OK: thin

    var factor = 3
    # inplace_transform[lambda (x: Int) -> Int: x ** factor](numbers)
    # Error: this lambda captures `factor`, so it is a closure, and a closure
    # can't be used as a compile-time function-pointer parameter.
```

Source: <https://mojolang.org/docs/manual/functions/lambda/>.

The fix is to pass the capturing lambda as a **runtime argument** with a
function-shaped infer-only parameter type:

```mojo
def transform[
    T: Copyable, U: Copyable, F: def(T) -> U, //
](f: F, list: List[T]) -> List[U]:
    return [f(item) for item in list]

def main():
    var numbers: List[Int] = [2, 4, 6, 8, 10]
    var factor = 3
    var transformed = transform(lambda (x: Int) -> Int: x ** factor, numbers)
    print(transformed)   # [8, 64, 216, 512, 1000]
```

Source: <https://mojolang.org/docs/manual/functions/lambda/>.

You can also execute a thin lambda at compile time:

```mojo
def main():
    comptime whole = (lambda (x: Int) {} -> Int: x * 2)(21)
    print(whole)   # 42
```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

### Lambdas, higher-order functions, and side effects

```mojo
def bubble_sort[
    T: ImplicitlyCopyable & Deinitable, F: def(T, T) -> Bool, //
](compare_fn: F, mut values: List[T]):
    for end in reversed(range(len(values))):
        for i in range(end):
            if compare_fn(values[i], values[i + 1]):
                values[i], values[i + 1] = values[i + 1], values[i]

def ascending(x: Int, y: Int) -> Bool:
    return x > y

def main():
    var values: List[Int] = [3, 1, 4, 1, 5, 9]
    bubble_sort(lambda (a: Int, b: Int) -> Bool: a > b, values)
    print(values)   # [1, 1, 3, 4, 5, 9]
```

Source: <https://mojolang.org/docs/manual/functions/lambda/>.

A lambda can capture mutable state and update it for its side effects:

```mojo
var histogram: Dict[Int, Int] = {}
var collector = lambda (n: Int) {mut histogram}: increment(histogram, n)
apply(collector, counts)
```

Source: <https://mojolang.org/docs/manual/functions/lambda/>.

### Nesting

Each lambda body can contain another lambda. The inner one captures the outer
one's arguments through its own capture list and references the outer one's
parameters directly:

```mojo
def main():
    var f = lambda (x: Int) {} -> Int: (
        lambda (y: Int) {imm x} -> Int: y + x
    )(3)
    print(f(6))   # 9
```

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

### Lambda restrictions

| Restriction | Detail |
|-------------|--------|
| Single expression | The body is one expression. There is no `return`, no statement body, and no multi-statement form. |
| No return-type inference | An omitted return type is `None`, not a solved type. |
| Arguments need types | There is no argument-type inference from the use site. |
| No `thin` in the signature | `thin` applies to function *types*; adding `{}` ensures a lambda is thin. |

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

Every lambda body is a single expression and cannot contain a `raise`
statement; a lambda only raises by calling something that raises, so declaring
`raises` lets it propagate, not raise. Source:
<https://mojolang.org/docs/reference/lambda-expressions/>.

### Lambda error strings

| Compiler complaint | Trigger |
|--------------------|---------|
| Can't convert value to `None` in return value | Returns a value from a lambda with no return type |
| Could not infer capture convention | Excludes capture conventions (`{}`) but references an enclosing value |
| Mutating method on an immutable value | Mutation through an `imm` capture |
| Capturing lambda in comptime initializer | A lambda closure bound to a `comptime` name |
| Capturing lambda in type parameter | A lambda closure passed to a type parameter |
| Capturing lambda in default parameter | A lambda closure used as a default parameter value |
| Can't implicitly convert to a `thin` type | A lambda closure passed where a thin function is required |

Source: <https://mojolang.org/docs/reference/lambda-expressions/>.

## Closure restrictions in 1.x

- **No escape.** "A closure can't outlive its enclosing scope. Returning a
  closure from its declaring function or storing it past the enclosing scope's
  end isn't supported."
- **No `thin` or `abi("C")` on declarations.** These apply only to closure
  *types* used as function parameters.
- **Trait conformance through captures.** A struct can hold a closure-typed
  field and conform to a trait through it, but "every method of that trait must
  be declared `capturing` until the capturing effect is removed."

Source: <https://mojolang.org/docs/reference/closure-declarations/>.

On `Copyable`: "A closure is `Copyable` when every value it captures is
`Copyable`. In theory, you could allocate heap memory and copy a closure into it
manually. Mojo doesn't provide a built-in mechanism for heap-allocated or
existential closures." Source:
<https://mojolang.org/docs/reference/closure-declarations/>.

## Pitfalls

- **Omitting the capture list and expecting to see outer values.** Without a
  capture list (or with `{}`), any outer reference is a compile error. Verified
  above.
- **Assuming `imm`/`mut` captured a snapshot.** Both are references; the closure
  sees later changes to the outer binding. Use `var` for a snapshot. Verified
  above.
- **Writing `{imm x^}` / `{mut x^}` / `{ref x^}`.** The `^` move operator is
  legal only with `var` or a bare name. Source:
  <https://mojolang.org/docs/reference/closure-declarations/>.
- **Two default-convention entries in one list.** At most one is allowed.
  Source: <https://mojolang.org/docs/reference/closure-declarations/>.
- **Cheap-looking `var` capture of a large value.** `{var big}` runs the copy
  constructor at declaration time and can allocate. Prefer `imm` or `mut`.
  Source: <https://mojolang.org/docs/manual/functions/closures/>.
- **Trying to escape a closure.** Not supported in 1.x; the old `escaping`
  effect was removed. Source:
  <https://mojolang.org/releases/v1.0.0b1/>.
- **Passing a capturing lambda to a compile-time parameter.** It must be thin.
  Pass it as a runtime argument instead. Verified above.
- **Omitting a lambda's return type.** It then returns `None`, so returning a
  value is an error. Source:
  <https://mojolang.org/docs/reference/lambda-expressions/>.
- **Using the old `@parameter` / `@__copy_capture` closures.** Both are
  deprecated legacy closure support; use capture lists. Source:
  <https://mojolang.org/docs/api-docs/stability/>.

## Open questions

> **Open question:** the closure manual says closures are "a longstanding part of
> Mojo" and that "Mojo's updated capture-list syntax is now available", while the
> reference describes capture lists as the current grammar and the stability page
> lists `@parameter`/`@__copy_capture` as legacy. The book teaches the capture
> syntax; verify the deprecation timeline against the next upstream release.

> **Open question:** the manual states "Mojo doesn't yet support async execution
> or escaping closures", while the reference states flatly that escaping closures
> are not supported. Whether a future 1.x release adds either is not documented;
> treat both as unavailable in 1.x.

## Sources

- Mojo manual — Closures: <https://mojolang.org/docs/manual/functions/closures/>
- Mojo manual — Lambda expressions: <https://mojolang.org/docs/manual/functions/lambda/>
- Mojo reference — Closure declarations: <https://mojolang.org/docs/reference/closure-declarations/>
- Mojo reference — Lambda expressions: <https://mojolang.org/docs/reference/lambda-expressions/>
- Mojo reference — Function declarations: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo stability guarantees (legacy closures): <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
- Mojo v1.0.0b1 release notes (`escaping` removed): <https://mojolang.org/releases/v1.0.0b1/>
