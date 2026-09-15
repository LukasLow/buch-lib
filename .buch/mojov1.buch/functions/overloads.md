# Overloads

A *function overload* is one of two or more function declarations that share a
name but differ in their signature. The compiler picks one of them at each call
site. This is *static dispatch*: there is no runtime lookup, and the choice is
fixed when the call is type-checked.

This page covers where overload sets form, what the compiler considers, the
resolution rules in order, what it deliberately ignores, and when to overload
versus when to write one parameterized function. Parameterization is covered on
[parameters and generics](parameters-and-generics.md).

## The basic shape

```mojo
def add(x: Int, y: Int) -> Int:
    return x + y

def add(x: String, y: String) -> String:
    return x + y

def main():
    print(add(1, 2))            # 3
    print(add("Hi, ", "Mojo"))  # Hi, Mojo
```

> An *overload set* is the collection of overloads the compiler considers at a
> call site. It contains the declarations that share the same name in the same
> scope.

> Use overloads to give one operation more than one shape: different argument
> types, different argument counts, different keyword names, different `self`
> conventions, or different compile-time parameter signatures.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

If you pass a type that no overload accepts, you get a compiler error — unless
an accepted type can be reached by an implicit conversion. `String`, for
example, has an `@implicit` constructor from `StringLiteral`, so a
`StringLiteral` argument matches a `String` overload. Source:
<https://mojolang.org/docs/manual/functions/>.

## Where overload sets form

Each scope builds its own overload set:

- **Module scope.** Declarations with the same name in the same module form one
  overload set.
- **Struct scope.** Methods on a struct (including `@staticmethod`) form one
  overload set per method name.
- **Trait scope.** Required and provided methods on a trait form one overload
  set per method name.

> An overload set can't be extended across scopes. An import brings the name in
> as a non-function reference: you can't add another overload to it from your
> own module, and you can't redefine it. A local declaration that collides with
> an import produces an error.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

The workaround is an aliased import:

```mojo
from some_package import add as imported_add

def add(x: Float64, y: Float64) -> Float64:
    return x + y
```

`add` now resolves to the local definition and `imported_add` to the imported
one. Source: <https://mojolang.org/docs/reference/function-declarations/>.

> **Open question:** the function-declarations reference records that an old
> claim — that an import plus a local `def` of the same name silently shadows —
> is wrong; the compiler produces `invalid redefinition of '<name>': cannot
> overload with this non-function definition`, and "The aliased-import workaround
> was also confirmed to compile." The manual's own overload-set note still
> phrases it as avoiding "issues"; the reference is the sharper statement.

## What the compiler considers

Overload resolution looks at:

- The number, position, and keyword of each argument.
- The type of each argument and each compile-time parameter.
- The argument conventions on each argument.
- Whether the candidate is an instance method or `@staticmethod`.
- Whether a constructor is `@implicit`.

> Overload resolution doesn't look at the return type or any other context
> surrounding the call.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

The manual puts the same rule more sharply:

> Mojo does **not** look at the return type, the `raises` effect, or any context
> surrounding the call. Two functions that differ only in return type or in
> whether they `raises` are duplicate definitions — the compiler rejects the
> second declaration.

Source: <https://mojolang.org/docs/manual/functions/>.

## Resolution rules, in order

The compiler first discards every candidate whose signature cannot be satisfied
by the call. It then compares the survivors pairwise and applies these rules in
order until one wins:

1. **Fewest implicit conversions** between arguments and parameters. An empty
   match against an `*args` argument counts as an implicit conversion, so an
   exact match beats it.
2. **No non-empty variadic arguments.** A signature without `*args` beats one
   whose `*args` receives at least one value.
3. **Fewest mismatched argument conventions.**
4. **Shortest parameter list.** A function with no compile-time parameters beats
   one that declares a parameter. The parameter list also counts implicit
   parameters synthesized from argument types — for example, the unbound
   parameters of a `SIMD[...]` argument become implicit parameters.
5. **Instance method over `@staticmethod`** with the same name.
6. **Non-`@implicit` constructor over an `@implicit` one.**

> If two candidates are equally good after these steps, the call is ambiguous.
> The compiler rejects it.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

A consequence of rule 4 the reference calls out explicitly: **a concrete function
wins over a parameterized one.** `def foo(a: Int)` beats
`def foo[T: AnyType](a: T)` for an `Int` argument, even though both signatures
match. Source: <https://mojolang.org/docs/reference/function-declarations/>.

```mojo
def take(x: Int):
    print("take(x: Int)")

def take(*xs: Int):
    print("take(*xs: Int)")

def main():
    take(1)        # take(x: Int)
    take(1, 2, 3)  # take(*xs: Int): the only match
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

### Overloading on parameters

Functions overload on compile-time parameter signatures as well as on arguments:

```mojo
def take_param[a: Int, b: Int]():
    print("take_param[a: Int, b: Int]")

def take_param[a: Int, b: String]():
    print("take_param[a: Int, b: String]")

def main():
    take_param[1, 2]()      # take_param[a: Int, b: Int]
    take_param[1, "hi"]()   # take_param[a: Int, b: String]
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## Overloading the `self` convention

A method can be overloaded by its `self` convention. The default call site uses
an immutable reference, so `ref self` wins; to reach a `var self` overload, the
caller transfers with `^`:

```mojo
@fieldwise_init
struct Counter(Copyable):
    var n: Int

    def which(ref self) -> Int:
        return 1

    def which(var self) -> Int where not conforms_to(
        Self, TrivialRegisterPassable
    ):
        return 2

def main():
    var c1 = Counter(0)
    print(c1.which())      # 1: default call uses an immutable self reference
    var c2 = Counter(0)
    print((c2^).which())   # 2: caller transfers self
```

The `where` clause is not cosmetic. The reference calls the case a "sharp edge":

> For `TrivialRegisterPassable` types, the transfer operator `^` is a no-op.
> When using a trivial register type like `Int`, `Float64`, or similar,
> `(c^).which()` becomes `c.which()`. The compiler will warn you but won't reject
> your code. The compile-time conformance check in the `where` clause above makes
> a non-trivial constraint explicit. It filters the `var self` overload out for
> trivial register types instead of leaving it silently unreachable.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## Instance methods beat static methods

When an instance method and a `@staticmethod` share a name, a method-call
expression selects the instance method (rule 5):

```mojo
struct StaticOverload:
    def __init__(out self):
        pass

    def foo(mut self):
        print("instance method")

    @staticmethod
    def foo():
        print("static method")

def main():
    var a = StaticOverload()
    a.foo()                  # instance method
    StaticOverload.foo()     # static method
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## What cannot disambiguate

### Return type

Two overloads that differ only in return type are indistinguishable:

```mojo
def parse(s: String) -> Int:
    return 0

# Error because `parse` cannot overload on return type only;
# the differing return type doesn't form a new overload
def parse(s: String) -> Float64:
    return 0.0
```

> Use different argument types, an extra parameter, or a different function name
> instead.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

### `raises`

`raises` is not part of the signature for overload-set purposes:

```mojo
def maybe_raise(x: Int) -> Int:
    return x

# Error because `maybe_raise` already has this signature;
# `raises` isn't part of the signature for overload purposes
def maybe_raise(x: Int) raises -> Int:
    raise Error("nope")
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

### Argument convention alone

Overloads that differ **only** in argument convention (`imm` vs `mut`) are
rejected in 1.0. Source: <https://mojolang.org/releases/v1.0.0/>.

## Ambiguous calls

When two candidates are equally good, the call fails. The classic case is two
`@implicit` constructors reachable from the same source type:

```mojo
struct MyString:
    @implicit
    def __init__(out self, s: String):
        pass

struct YourString:
    @implicit
    def __init__(out self, s: String):
        pass

def foo(name: MyString):
    print("MyString")

def foo(name: YourString):
    print("YourString")

def main():
    # Error: the call is ambiguous — both overloads need exactly one
    # implicit conversion from `String`
    # foo("Hello")

    foo(MyString("Hello"))    # MyString
    foo(YourString("Hello"))  # YourString
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

Literals can cause the same problem. An `IntLiteral` converts to both `Int` and
`Float64` at equal cost:

```mojo
def take_p[a: Int, b: Int]():
    pass

def take_p[a: Int, b: Float64]():
    pass

def main():
    # Error: `IntLiteral` converts to both `Int` and `Float64` at equal cost
    # take_p[1, 2]()
    take_p[1, 2.0]()   # unambiguously the Float64 version
```

To resolve an ambiguity, remove it or rename one version. Source:
<https://mojolang.org/docs/reference/function-declarations/>.

## Overload versus parameterize

The official best practices make the boundary explicit:

- "Use overloads when each version implements the same operation on a different
  shape of input. Don't overload to mean different things under the same name."
- "Prefer overloading on argument *type* over overloading on convention.
  Convention-based overloads work, but they're easy to misread."
- "When an overload set should accept many types, write one parameterized
  function constrained with `where` instead of many near-duplicates. The
  compiler picks the concrete signature when both are present (rule 4)."
- "Don't rely on two `@implicit` constructors being reachable from the same
  source type. Cast at the call site or make one constructor non-`@implicit`."
- "Don't define a function with the same name as one you imported. The compiler
  rejects it. Import under an alias when you need both names."

Source: <https://mojolang.org/docs/reference/function-declarations/>.

The practical rule: **overload when the shapes genuinely differ** (different
argument types or counts); **parameterize when one algorithm serves many types**,
and let a `where` clause express the requirements. Rule 4 then keeps the
specialized concrete overload available when it exists.

## Pitfalls

- **Overloading on return type.** Rejected as a duplicate definition. Verified
  above.
- **Overloading on `raises` alone.** Same signature for overload purposes.
  Verified above.
- **Overloading on argument convention alone.** Rejected in 1.0. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Defining a function with the same name as an import.** The compiler rejects
  it; import under an alias instead. Source:
  <https://mojolang.org/docs/reference/function-declarations/>.
- **Two reachable `@implicit` constructors.** The call becomes ambiguous; cast
  at the call site or drop one `@implicit`. Verified above.
- **`IntLiteral` against `Int` and `Float64` overloads.** Equally good
  conversions make the call ambiguous. Verified above.
- **Expecting `(c^)` to reach a `var self` overload for a trivial type.** For
  `TrivialRegisterPassable` types `^` is a no-op, so the `var self` overload can
  be silently unreachable; gate it with a `where` clause. Source:
  <https://mojolang.org/docs/reference/function-declarations/>.
- **Assuming a parameterized overload is chosen over a concrete one.** Rule 4
  picks the concrete signature. Source:
  <https://mojolang.org/docs/reference/function-declarations/>.

## Open questions

> **Open question:** the manual's overload-set note says an aliased import
> avoids "issues with local functions using the same name as an imported one",
> while the reference states the compiler rejects the collision outright with
> `invalid redefinition ... cannot overload with this non-function definition`.
> This book follows the reference. Verify with the current compiler whether the
> diagnostic or the silent-shadowing description is authoritative.

> **Open question:** the resolution rules are stated in prose; the reference does
> not give worked examples for rules 3 and 6. Do not assume a tie-break order
> beyond the printed sequence.

## Sources

- Mojo reference — Function declarations (overloads, resolution rules): <https://mojolang.org/docs/reference/function-declarations/>
- Mojo manual — Functions (overloaded functions, ambiguity): <https://mojolang.org/docs/manual/functions/>
- Mojo manual — Parameterization (overloading on parameters): <https://mojolang.org/docs/manual/parameters/>
- Mojo v1.0.0 release notes (no convention-only overloads): <https://mojolang.org/releases/v1.0.0/>
