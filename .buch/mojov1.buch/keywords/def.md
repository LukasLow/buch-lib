# def

`def` declares a function. It is Mojo's single function-declaration keyword and
the unified replacement for the former `fn` spelling.

## Purpose

The official keywords reference defines `def` in one line:

> `def` — Function declaration

Source: <https://mojolang.org/docs/reference/keywords/>.

The function-declarations reference expands it:

> A *function declaration* introduces a named, callable unit of code. Every
> function in Mojo starts with the `def` keyword.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

```mojo
def greet(name: String) -> String:
    return "Hello, " + name
```

A function declared inside a `struct` is called a *method*, but it has all the
same qualities as a free function:

> Mojo uses the `def` keyword to define functions. Functions declared inside a
> `struct` are called "methods," but they have all the same qualities as
> "functions" described here.

Source: <https://mojolang.org/docs/manual/functions/>.

## def replaced fn in 1.0 — fn is deprecated

`def` is the current keyword. The `fn` spelling is deprecated and is no longer
usable:

> The `fn` keyword for function declarations is deprecated. Mojo now emits a
> compiler warning on uses of `fn`; this will become a compilation error in the
> next release.

Source: <https://mojolang.org/releases/v1.0.0b1/>.

That next release arrived:

> The legacy `fn` keyword now produces an error instead of a warning. Please
> move to `def`.

Source: <https://mojolang.org/releases/v1.0.0b2/>.

Write `def` everywhere. The only thing you need to know about `fn` is that this
book's [`fn`](fn.md) page is a stub pointing back here. When `def` replaced
`fn`, the semantics were unified too:

> `def` is now Mojo's standard function declaration keyword. `def` functions no
> longer implicitly raise and now have the same semantics as `fn`: they are
> non-raising by default, accept a `raises` specifier, and support typed
> errors.

Source: <https://mojolang.org/releases/v0.26.2/>.

## The shape of a signature

The official grammar for a function signature:

```text
def name(argument-list) -> ReturnType:
    body

def name[parameter-list](argument-list) -> ReturnType:
    body

def name(argument-list) raises -> ReturnType:
    body

def name[parameter-list](argument-list)
    -> ReturnType where constraint:
    body

def name[parameter-list](argument-list) raises
    -> ReturnType where constraint:
    body
```

> A signature can include a name, a parameter list, an argument list, effects, a
> return type, and a `where` clause. Only the parentheses and the colon are
> required.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

A complete, runnable example that exercises most of the parts at once:

```mojo
def clamp[T: Comparable & ImplicitlyCopyable](val: T, lo: T, hi: T) -> T:
    if val < lo:
        return lo
    if val > hi:
        return hi
    return val

def main():
    print(clamp(5, 1, 10))      # 5
    print(clamp(-3, 1, 10))     # 1
    print(clamp(99, 1, 10))     # 10
    print(clamp("Z", "A", "M")) # M
```

The square brackets hold **parameters** (compile-time values); the parentheses
hold **arguments** (run-time values). The manual distinguishes the two
explicitly:

> In Mojo, "parameter" and "parameter expression" refer to compile-time values,
> and "argument" and "expression" refer to run-time values.

Source: <https://mojolang.org/docs/manual/functions/>.

The minimal function is:

```mojo
def do_nothing():
    pass
```

If a function takes no parameters you may omit the square brackets, but the
parentheses are always required, and a body is always required (`pass` provides
an empty one). Source: <https://mojolang.org/docs/manual/functions/>.

## Return types: `->`

`->` introduces the return type. It appears after any effects, and without it
the function returns `None`:

> `->` introduces the return type. It appears after any effects: ... Without
> `->`, the function returns `None`.

Source: <https://mojolang.org/docs/reference/function-declarations/>.

```mojo
def square(x: Int) -> Int:
    return x * x

def log_it(msg: String):        # no return annotation: returns None
    print(msg)
```

Declaring `-> None` is equivalent to omitting the return type:

```mojo
def greet(name: String):
    print("Hello,", name)

def greet(name: String) -> None:
    print("Hello,", name)
```

A function returns its value with `return`, which ends the function. A function
without an explicit `return` implicitly returns `None`. Source:
<https://mojolang.org/docs/manual/functions/>.

## Argument conventions in signatures

An *argument convention* controls how an argument value passes to a function.
It appears before the argument name. These words are **not reserved keywords** —
the reference states plainly that "Convention names aren't reserved" — but in a
Mojo signature they have fixed meaning. They are documented under
`keyword-conventions/`, not in the keyword tables of
[`keywords/index`](index.md).

Source: <https://mojolang.org/docs/reference/keywords/>.

### Default convention: no annotation = immutable reference

Without a convention, the argument is an immutable read-only reference and the
caller keeps ownership:

```mojo
def length[T: Copyable](s: List[T]) -> Int:
    return len(s)
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

### `imm` — explicit immutable reference

`imm` is the explicit spelling of the default. The official reference lists it
as "Immutable reference to an existing value (default behavior)":

```mojo
def show(imm value: Int):
    print(value)   # read-only; caller keeps the value
```

Source: <https://mojolang.org/docs/reference/keywords/>.

### `mut` — mutable reference

The caller's value is passed by mutable reference; changes inside the function
are visible to the caller:

```mojo
def double_it(mut x: Int):
    x *= 2

def main():
    var n = 21
    double_it(n)
    print(n)   # 42
```

`mut` arguments may not have defaults: "Error because 'mut' arguments may not
have defaults". Source:
<https://mojolang.org/docs/reference/function-declarations/>.

### `var` — owned copy

The function receives an owned copy. If the caller transfers ownership with
`^`, the original becomes inaccessible:

```mojo
def consume(var s: String):
    s += "!"
    print(s)

def main():
    var greeting = "Hello"
    consume(greeting)   # Hello! (copied)
    print(greeting)     # Hello

    consume(greeting^)  # Hello! (moved)
    # print(greeting)   # Error because uninitialized after move
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

### `out` — the return slot

An `out` argument is the function's return slot. Only one is allowed, and it
replaces the `->` return type:

```mojo
def make_int(out result: Int):
    result = 42

def main():
    var x = make_int()
    print(x)   # 42
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

### `deinit` — destructive transfer

The function takes ownership and destroys the value. Required for `self` in
`__deinit__` and for the argument in a move constructor:

```mojo
struct Resource:
    var handle: Int

    def __deinit__(deinit self):
        _release(self.handle)
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

### `ref` — reference with an explicit origin

Passes a reference with an explicit origin specifier, tracking where the
reference came from:

```mojo
def get_first[T: Copyable](ref data: List[T]) -> ref[data[0]] T:
    return data[0]
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## `out` versus `->`, and why they cannot be combined

A function can declare only one return value, whether it uses an `out` argument
or the `->` type syntax. Using both is an error. The official reference gives
the diagnostic wording:

> `out` declares the return value by name. It can't be combined with `->`:

```mojo
def make_point(out result: Point):        # OK
    result = Point(0, 0)

def make_point(out result: Point) -> Point:  # Error: function cannot have
    result = Point(0, 0)                     # both an 'out' argument and
                                             # an explicit result type
```

Source: <https://mojolang.org/docs/reference/keywords/>.

The function-declarations reference repeats the same rule with its own error
comment:

```mojo
# Error because function cannot have both an 'out' argument
#        and an explicit result type
def wrong(out result: Int) -> Int:
    result = 0
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

The manual adds that the two forms are interchangeable *to the caller* and that
a function with a named result needs no explicit `return`:

> A function with a named result argument doesn't need to include an explicit
> `return` statement... If the function terminates without a `return`, or at a
> `return` statement with no value, the value of the `out` argument is returned
> to the caller.

Source: <https://mojolang.org/docs/manual/functions/>.

```mojo
def get_name_tag(var name: String) -> NameTag:
    ...

def get_name_tag(var name: String, out name_tag: NameTag):
    ...

# Both are called the same way:
var tag = get_name_tag("Judith")
```

## `raises` and `where` have fixed meaning in declarations

Neither `raises` nor `where` is a keyword, but both have fixed meaning in a
declaration. Source: <https://mojolang.org/docs/reference/keywords/>.

### `raises`

Functions are **non-raising by default**. `raises` declares that the function
can propagate an error to its caller, and an optional error type may follow it:

```mojo
def parse(text: String) raises -> Int:
    # ...
    return 0

def validate(value: Int) raises ValidationError -> Int:
    # ...
    return value
```

A non-raising function that calls a raising function must handle the error:

```mojo
def raises_error() raises:
    raise Error("There was an error.")

# This function will not compile
def unhandled_error():
    raises_error()   # Error: can't call raising function in a non-raising context

# Explicitly handle the error
def handle_error():
    try:
        raises_error()
    except e:
        print("Handled an error:", e)

# Explicitly propagate the error
def propagate_error() raises:
    raises_error()
```

Sources: <https://mojolang.org/docs/reference/function-declarations/>,
<https://mojolang.org/docs/manual/functions/>.

A function can specify at most one error type after `raises`. Source:
<https://mojolang.org/docs/reference/function-declarations/>.

### `where`

A `where` clause constrains compile-time parameters. It appears at the end of
the declaration, after the return type (or after the argument list if there is
no return type). The official example:

```mojo
comptime LESS_THAN: Int32 = -1
comptime EQUAL: Int32 = 0
comptime GREATER_THAN: Int32 = 1

def compare[T: AnyType](x: T, y: T) -> Int32 where conforms_to(T, Comparable):
    if x < y:
        return LESS_THAN
    elif x > y:
        return GREATER_THAN
    else:
        return EQUAL

def main():
    print(compare(5, 10))     # -1 (LESS_THAN)
    print(compare(7, 7))      # 0 (EQUAL)
    print(compare("Z", "A"))  # 1 (GREATER_THAN)
```

A `where` clause inside a parameter list, or in an argument list, is invalid in
1.x:

```mojo
# Wrong: `where` is not allowed inside a parameter list.
def wrong[n: Int where n > 0]():
    pass

# Wrong: `where` clauses can only be used with compile-time parameters.
def wrong(x: Int where x > 0):
    pass
```

Sources: <https://mojolang.org/docs/reference/function-declarations/>,
<https://mojolang.org/releases/v1.0.0/>.

## Overloads

A *function overload* is one of two or more declarations that share a name but
differ in their signature. The compiler picks one at each call site — this is
static dispatch, with no runtime lookup. Source:
<https://mojolang.org/docs/reference/function-declarations/>.

```mojo
def add(x: Int, y: Int) -> Int:
    return x + y

def add(x: String, y: String) -> String:
    return x + y

def main():
    print(add(1, 2))            # 3
    print(add("Hi, ", "Mojo"))  # Hi, Mojo
```

An *overload set* is the collection of overloads the compiler considers at a
call site. Each scope builds its own set (module scope, struct scope, trait
scope). An import brings the name in as a non-function reference, so you cannot
extend it; a local declaration that collides with an import is an error. Use an
alias to keep both:

```mojo
from some_package import add as imported_add

def add(x: Float64, y: Float64) -> Float64:
    return x + y
```

Two things overload resolution deliberately **doesn't** look at:

- **Return types.** "Error because `parse` cannot overload on return type only;
  the differing return type doesn't form a new overload."
- **`raises`.** "Two functions that differ only in whether they `raises` have
  the same signature for overload-set purposes."

```mojo
def parse(s: String) -> Int:
    return 0

# Error because `parse` cannot overload on return type only
def parse(s: String) -> Float64:
    return 0.0

def maybe_raise(x: Int) -> Int:
    return x

# Error because `maybe_raise` already has this signature;
# `raises` isn't part of the signature for overload purposes
def maybe_raise(x: Int) raises -> Int:
    raise Error("nope")
```

Also rejected in 1.0: overloads that differ only in argument convention
(`imm` vs `mut`). Source: <https://mojolang.org/releases/v1.0.0/>.

For the full resolution order (fewest implicit conversions, no variadic, fewest
mismatched conventions, shortest parameter list, instance method over static,
non-implicit constructor over implicit), see the function-declarations
reference. Source: <https://mojolang.org/docs/reference/function-declarations/>.

## How `self` behaves

The first argument of a method is the instance; by convention it is named
`self`. A `self` argument **without a convention is an immutable reference**, so
modifying it is an error. The official example:

```mojo
struct CountingTool:
    var value: Int

    def __init__(out self):       # out: self is the return value
        self.value = 0

    def increment(mut self):      # mut: modifies self in place
        self.value += 1
```

```mojo
struct CountingTool:
    # continuing from above...

    def get(self) -> Int:
        self.value += 1      # Error: self is immutable
        return self.value
```

Source: <https://mojolang.org/docs/reference/keywords/>.

The manual's tutorial reaches the same conclusion when implementing
`__setitem__()`:

> More notable is that we've added the `mut` argument convention to the `self`
> argument to explicitly tell the Mojo compiler that we want to mutate the state
> of the current instance. If we were to omit `mut`, we would get an error
> because the compiler would default to immutable access for the argument.

Source: <https://mojolang.org/docs/manual/get-started/>.

In 1.0 a method's `self` must also have type `Self`. A custom `self` type must
instead be expressed as a `where` clause:

```mojo
struct Foo[T: AnyType]:
    # ERROR: def foo(self: Foo[Int]):
    def foo(self) where Self.T == Int:
        ...
```

Source: <https://mojolang.org/releases/v1.0.0/>.

Special methods have enforced `self` conventions: `__init__` must take
`out self`; the destructor is `def __deinit__(deinit self)`; a move
constructor takes `def __init__(out self, *, deinit move: Self)`. Source:
<https://mojolang.org/docs/reference/function-declarations/>.

## Methods versus free functions

- A function declared at module scope is a *free function*; a function declared
  inside a `struct` is a *method* and receives the instance as its first
  argument.
- A method is called with dot syntax (`instance.method(args)`); a free function
  is called by name (`method(instance, args)`).
- `@staticmethod` makes a method callable without an instance; it takes no
  `self`.
- At the call site, an instance method beats a `@staticmethod` of the same name;
  call the static one explicitly through the type name.

```mojo
struct MathUtils:
    comptime pi: Float64 = 3.141592653589793

    @staticmethod
    def square(x: Int) -> Int:
        return x * x

def main():
    print(MathUtils.square(5))  # 25
    print(MathUtils.pi)         # 3.141592653589793
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

A struct can also be callable by declaring `__call__()` and explicitly
declaring the closure-trait conformance — duck typing was removed in 1.0:

```mojo
struct Double(def(Int) -> Int):  # previously: `struct Double:`
    def __call__(self, x: Int) capturing -> Int:
        return x * 2
```

Source: <https://mojolang.org/releases/v1.0.0/>.

## Pitfalls

- **Missing `mut` on `self`.** An unannotated `self` is an immutable reference.
  `self.value += 1` in such a method is a compile error. Add `mut self` (or
  `out self` in an initializer). Verified above.
- **Combining `out` with `->`.** A function with an `out` argument cannot also
  declare `-> Type`: "function cannot have both an 'out' argument and an
  explicit result type". Pick one. Verified above.
- **Assuming `fn` still works.** In 1.0.0b2 the legacy `fn` keyword became an
  error. Use [`def`](def.md); see [`fn`](fn.md). Source:
  <https://mojolang.org/releases/v1.0.0b2/>.
- **Treating a convention name as reserved.** `imm`, `mut`, `out`, `deinit`,
  `raises` and `where` can be used as ordinary identifiers; only in a signature
  or declaration do they carry fixed meaning. Conversely, `var` and `ref` *are*
  reserved when used as declarations. Source:
  <https://mojolang.org/docs/reference/keywords/>.
- **Bare `**kwargs`.** A bare `**kwargs` is an error in 1.x — write
  `var **kwargs`. `var` was already the only supported convention for it.
  Source: <https://mojolang.org/releases/v1.0.0/>.
- **Trying to overload on return type or on `raises`.** Both are duplicate
  definitions; give the versions different names or argument shapes. Verified
  above.
- **Overloading on convention alone.** Rejected in 1.0. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Using a reserved word as a free-function name.** `class`, `del`, `match`,
  `yield` and friends now error at the declaration. Use an escaped identifier
  if you truly need the name. Source:
  <https://mojolang.org/releases/v1.0.0/>.

## Sources

- Mojo function declarations reference: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo identifiers, keywords, and conventions reference: <https://mojolang.org/docs/reference/keywords/>
- Functions (manual): <https://mojolang.org/docs/manual/functions/>
- Get started with Mojo (manual): <https://mojolang.org/docs/manual/get-started/>
- Mojo v0.26.2 release notes: <https://mojolang.org/releases/v0.26.2/>
- Mojo v1.0.0b1 release notes: <https://mojolang.org/releases/v1.0.0b1/>
- Mojo v1.0.0b2 release notes: <https://mojolang.org/releases/v1.0.0b2/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
