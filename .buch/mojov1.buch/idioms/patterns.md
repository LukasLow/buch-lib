# Idiomatic patterns

This page collects patterns that an agent writing real Mojo 1.x code will reach
for repeatedly. Every pattern has the same four parts: the **situation** that
calls for it, the **idiomatic** 1.x code, **why** it is idiomatic — tied to a
documented language property such as value semantics, ownership, ASAP
destruction, `raises`, or static typing — and the **wrong** version to avoid.

Where a pattern is official guidance, the source is cited. Where the docs state
the pieces but no page assembles them into this exact pattern, that is said
plainly rather than presented as official advice.

## Resource cleanup with `with`

### Situation

You acquire something that must be released — a file handle, a lock, a
temporary directory — and the release must happen even if the body raises.

### Idiomatic

Define `__enter__()` and `__exit__()`, then use the `with` statement:

```mojo
@fieldwise_init
struct Transaction(Copyable):
    """A resource that must be released when the block ends."""

    var name: String

    def __enter__(self) -> Self:
        print("begin", self.name)
        return self

    def __exit__(self):
        print("release", self.name)

def withdraw() raises:
    with Transaction("withdraw"):
        transfer()
        # __exit__ runs here, even if transfer() raises
```

For standard resources, use the library context manager:

```mojo
with open(input_file, "r") as f_in, open(output_file, "w") as f_out:
    var input_text = f_in.read()
    f_out.write(input_text.upper())
```

Sources: <https://mojolang.org/docs/manual/errors/> and
<https://mojolang.org/docs/reference/compound-statements/>.

### Why

The `with` statement's contract is a guarantee, not a convention:

> The cleanup always runs when the block exits, even if an error occurs.

Source: <https://mojolang.org/docs/reference/compound-statements/>. And from the
errors page: "When used with Mojo's `with` statement, a context manager ensures
that the resources it manages are properly released at the end of the block,
even if an error occurs." Source: <https://mojolang.org/docs/manual/errors/>.

This is stronger than wrapping the body in `try`/`finally` by hand, because the
compiler knows the object's lifecycle: Mojo's ASAP destruction plus the
`with`-statement call to `__exit__()` together mean the release does not depend
on the author remembering it. The docs list `FileHandle`,
`NamedTemporaryFile`, `TemporaryDirectory`, `BlockingScopedLock` and
`assert_raises` as library context managers. Source:
<https://mojolang.org/docs/manual/errors/>.

### The conditional form

When the context manager must react to an error rather than just clean up,
implement the error-taking overload. It receives the error and returns a `Bool`:

```mojo
def __exit__(mut self, e: Error) -> Bool:
    if String(e) == "just a warning":
        return True    # suppress
    return False       # propagate
```

> Return `True` to suppress the error. Return `False` to re-raise the error.
> Raise a new error.

Source: <https://mojolang.org/docs/manual/errors/>. For typed errors, use the
parameterized `__exit__[ErrType: AnyType](self, err: ErrType) -> Bool` form.
Source: <https://mojolang.org/docs/manual/errors/>.

### Wrong

```mojo
# Wrong: cleanup only on the success path.
var f = open(path, "r")
var content = f.read()   # if this raises, f.close() never runs
f.close()

# Wrong: a context manager that copies instead of returning self.
def __enter__(self) -> Self:
    return self.copy()   # the `as` target is not the manager being exited
```

**Why it is wrong:** the first form leaks the handle on the error path — exactly
what the errors page describes as the problem the `with` statement solves. The
second breaks the documented contract that "`__enter__` returns `self` so the `as`
target binds to the manager"; if it returns a different value, `__exit__` runs on
the manager while the reader operates on a copy. Source:
<https://mojolang.org/docs/manual/errors/>.

## Error-return idioms

### Situation

You are designing a function that can fail, and you must choose between raising
an error and encoding absence in the return type.

### Pattern: raise for exceptional failure, `Optional` for expected absence

```mojo
# Failure that the caller must handle: raise.
def open_file(path: String) raises -> String:
    if not path:
        raise "path cannot be empty"
    return "contents of " + path

# Absence that is an ordinary outcome: return Optional.
def find(items: List[String], target: String) -> Optional[Int]:
    for i in range(len(items)):
        if items[i] == target:
            return i
    return None
```

**Why:** the error model is explicitly a value model with an explicit cost
profile, and `Optional` is the type-safe nullable:

> Mojo represents errors as values—specifically, as alternate return values from
> functions. Unlike stack-unwinding exceptions ... their runtime overhead is as
> low as returning and checking an extra `Bool`.

Source: <https://mojolang.org/docs/manual/errors/>. For absence, `Optional` "can
be thought of as a type-safe nullable pattern. Your value can take on a value or
`None`, and you need to check and explicitly extract the value to get it out."
Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

The decision rule: if the failure means "this operation could not complete and
the caller must do something", `raises`. If the failure is one of the ordinary
results of a query (not found, empty, no match), `Optional[T]`.

### Pattern: name the error type

```mojo
# Wrong: bare `raises` erases the type at compile time.
def validate_bare(value: Int) raises -> Int:
    return validate_typed(value)

# Idiomatic: declare the concrete error type.
def validate(value: Int) raises ValidationError -> Int:
    return validate_typed(value)
```

> Always specify the error type in function signatures. Bare `raises` discards
> type information.

Source: <https://mojolang.org/docs/manual/errors/>. The mechanism is *type
erasure*: "the compiler forgets the specific error type, even though the runtime
preserves the error's identity", so the caller receives `Error` and loses field
access. Source: <https://mojolang.org/docs/manual/errors/>.

### Pattern: re-raise by transfer when the error is not copyable

```mojo
try:
    work()
except e:
    print("Logging:", e)
    raise e^     # transfer: no copy, required for a non-ImplicitlyCopyable error
```

> Re-raising copies the error, which is cheap because both its message and its
> optional stack trace are reference counted. To avoid the copy, transfer the
> error with the transfer sigil: `raise e^`. A custom error type that doesn't
> conform to `ImplicitlyCopyable` requires the transfer sigil to re-raise.

Source: <https://mojolang.org/docs/manual/errors/>.

### Wrong

```mojo
# Wrong: calling a raising function from a non-raising one.
def process(name: String):
    print(validate(name))   # Error: can't call raising function in a non-raising context
```

**Why:** functions are non-raising by default, so a raising call must either be
handled locally or be propagated by declaring `raises` on the caller. Source:
<https://mojolang.org/docs/reference/function-declarations/>. Also wrong:
mixing two error types in one `try` block, which the compiler rejects with
"cannot call function that may raise 'Error' in a context that supports an error
type of 'ValidationError'". Source:
<https://mojolang.org/docs/manual/errors/>.

## Struct and trait design

### Situation

You are defining a type and deciding what it should conform to, and how its
capabilities should propagate to generic code.

### Pattern: conform to the trait you need, keep constraints minimal

```mojo
trait Describable:
    def describe(self) -> String:
        ...

@fieldwise_init
struct Sensor(Copyable, Describable):
    var reading: Float64

    def describe(self) -> String:
        return "Sensor(" + String(self.reading) + ")"

def render[T: Describable](item: T):
    print(item.describe())
```

**Why:** conformance is explicit and verified at definition time, and a
trait-bounded parameter is specialized with no runtime lookup:

> Traits don't use duck typing. A struct that implements `fetch_reading()` but
> doesn't declare `DeflectionSensing` isn't a conforming type.

> Mojo verifies that every required method, associated type, and compile-time
> value is present, so your code can use them without runtime overhead or
> capability checks.

Source: <https://mojolang.org/docs/manual/traits/>. The official advice on
constraints is to "use the fewest constraints your code needs. This keeps your
function usable with more types", and that adding constraints "restricts which
types you accept, but expands what your code can do." Source:
<https://mojolang.org/docs/manual/generics/>.

### Pattern: conditional conformance for a wrapper

A container-like type should be `Writable` only when its element is:

```mojo
comptime ElementTraits = Copyable & Deinitable & Writable

@fieldwise_init
struct Wrapper[T: ElementTraits](Writable where conforms_to(T, Writable)):
    var value: Self.T
```

> This pattern is standard for single-type containers like `Optional[T]`,
> `Box[T]`, `Lazy[T]`, and `List[T]`. It says: "This type can do X if its inner
> type can do X."

Source: <https://mojolang.org/docs/manual/generics/>. If the conformance is
conditional, gate the method with the **same** condition so they cannot drift:

```mojo
def __bool__(self) -> Bool where conforms_to(Self.T, Boolable):
    return self.value.__bool__()
```

> Since the method and the conformance use the same condition, they stay aligned.
> You won't end up with a conformance but no method, or a method without the
> corresponding conformance.

Source: <https://mojolang.org/docs/manual/generics/>.

### Pattern: generate the constructor and lifecycle methods

```mojo
# Idiomatic: let the compiler write the boilerplate.
@fieldwise_init
struct Pair(Copyable):
    var first: Int
    var second: Int

# Wrong: hand-writing a fieldwise __init__, a copy constructor and a move
# constructor when no custom logic is needed.
struct Pair(Copyable):
    var first: Int
    var second: Int

    def __init__(out self, first: Int, second: Int):
        self.first = first
        self.second = second

    def __init__(out self, *, copy: Self):
        self.first = copy.first
        self.second = copy.second
```

**Why:** `@fieldwise_init` "generates a field-wise constructor for the struct",
and trait conformance synthesizes the rest: "Mojo will generate a copy
constructor ... You don't need to write your own unless you need custom logic."
Source: <https://mojolang.org/docs/manual/structs/>. The manual's own
`MyPair` example says the fieldwise-initializer version is the simplifier.
Source: <https://mojolang.org/docs/manual/basics/>.

### Pattern: use a `comptime` member enumeration instead of a hand-rolled `enum`

```mojo
@fieldwise_init
struct Sentiment(Equatable, ImplicitlyCopyable):
    var _value: Int

    comptime NEGATIVE = Sentiment(0)
    comptime NEUTRAL = Sentiment(1)
    comptime POSITIVE = Sentiment(2)

    def __eq__(self, other: Self) -> Bool:
        return self._value == other._value
```

> This pattern provides a type-safe enumeration.

Source: <https://mojolang.org/docs/manual/parameters/>. Mojo 1.x has no `enum`
keyword, so this is the documented way to get one.

### Wrong

```mojo
# Wrong: a struct field constrained with Some[].
@fieldwise_init
struct Struct(Writable):
    var x: Some[Copyable & Deinitable & Writable]
    # Error: a `Some` struct field has no concrete type to infer
```

**Why:** a field has no call site to infer a concrete type from, so the compiler
cannot make it concrete; use an explicit parameterized type parameter. Source:
<https://mojolang.org/docs/manual/generics/>. Also wrong: expecting inheritance.
"Mojo structs do not support inheritance (`sub-classing`), but a struct can
implement traits." Source: <https://mojolang.org/docs/manual/structs/>.

## Parameterization over generics

### Situation

You have an algorithm that does not care about the concrete type, only about the
operations it uses.

### Pattern: constrain on the operations, name the type once

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

**Why:** the constraints are exactly the operations the body uses, and each
missing one is a named error:

> The type parameter `T` is declared in square brackets before the function
> arguments. ... When you call `all_equal()`, the compiler infers `T` from the
> call site.

> If you remove `Equatable` from `all_equal()`, the code won't compile because
> the compiler can't guarantee that `!=` exists for all `T`. Dropping
> `Deinitable` fails for a subtler reason: `zip()` yields each pair as a tuple,
> and the loop can only destroy that temporary tuple if `T` is implicitly
> destructible.

Source: <https://mojolang.org/docs/manual/generics/>.

### Pattern: `Some[Trait]` when the type is used once

```mojo
# Named type parameter used once: the constraint can live on the argument.
def foo(x: Some[Intable]) -> Int:
    return x.__int__()

# Named form when the type must appear twice (same type for both args).
def compare_readings[T: DeflectionSensing](a: T, b: T) -> Float64:
    return a.fetch_reading() - b.fetch_reading()
```

> `Some[Trait(s)]` is shorthand for a type parameter constrained to that trait or
> composition. It's syntax sugar, not a new mechanism.

Source: <https://mojolang.org/docs/reference/trait-declarations/>. Use the named
form when you need "to require two arguments of the *same* conforming type."
Source: <https://mojolang.org/docs/manual/traits/>.

### Pattern: automatic parameterization for a single parameterized argument

```mojo
# Instead of naming dtype and length:
def take_simd(vec: SIMD[...]):
    print(vec.dtype)
    print(vec.length)

def take_floats(floats: SIMD[DType.float32, _]): pass
```

> Mojo treats the unbound parameters on `vec` as infer-only parameters on the
> function.

Source: <https://mojolang.org/docs/manual/parameters/>. The trade-off is stated:
with automatic parameterization you reach parameters through the argument
(`vec.dtype`) and cannot pass them directly. Source:
<https://mojolang.org/docs/manual/parameters/>.

### Pattern: value parameters for compile-time specialization

```mojo
def make_filled[T: ImplicitlyCopyable & Deinitable, size: Int](
    splat_value: T
) -> List[T]:
    var result = List[T](capacity=size)
    for _ in range(size):
        result.append(splat_value)
    return result^
```

**Why:** the official decision rule is a question about what the *caller* knows:

> Ask yourself: does the caller know this value when writing the code? If yes,
> use a parameter. If it depends on input, files, or runtime state, use an
> argument.

Source: <https://mojolang.org/docs/manual/generics/>. A `size` parameter lets the
compiler unroll and remove branches; a runtime `size` argument cannot.

### Wrong

```mojo
# Wrong: over-constrained. `Writable` is not used by the body, so every
# non-Writable type is needlessly rejected.
def count_items[T: Writable & Copyable & Deinitable](items: List[T]) -> Int:
    return len(items)

# Wrong: unconstrained parameter.
def handle[T](value: T):       # Error: must constrain or explicitly type
    pass
```

**Why:** constraints narrow what the caller may pass; every unused constraint is
a capability the function demands for no reason. "Adding constraints restricts
which types you accept, but expands what your code can do" — so adding one the
body does not need only costs flexibility. Source:
<https://mojolang.org/docs/manual/generics/>. Parameter names must always be
"constrained or explicitly typed"; the most permissive is `AnyType`. Source:
<https://mojolang.org/docs/manual/generics/>.

## Ownership-friendly function signatures

### Situation

You are choosing argument conventions for a function, and the choice determines
whether callers pay for a copy, whether you can mutate, and whether the value is
consumed.

### The decision table

| You need to | Convention | Caller pays | Caller keeps the value? |
|-------------|-----------|-------------|-------------------------|
| Read a large value, no copy | `imm` (default) | no copy | yes |
| Read small values (`Int`, `SIMD`) | `imm` (default) | register pass | yes |
| Mutate the caller's value | `mut` | no copy | yes |
| Own a value, may copy it | `var` | a copy unless the caller uses `^` | yes (if copied) |
| Consume a value | `var` + caller `^` | no copy | **no** |
| Return by name, no move | `out` | no move or copy | n/a |
| Follow the caller's mutability | `ref` | no copy | yes |

Sources: <https://mojolang.org/docs/manual/values/ownership/> and
<https://mojolang.org/docs/reference/function-declarations/>.

### Pattern: default to `imm`; opt into mutation

```mojo
# Idiomatic: reads a large value with no copy.
def total(records: List[Record]) -> Int:
    var sum = 0
    for r in records:
        sum += r.amount
    return sum

# Explicit mutation, visible in the signature.
def append_record(mut records: List[Record], r: Record):
    records.append(r)
```

**Why:** the default is an immutable reference and is the documented
performance-friendly choice:

> In general, passing an immutable reference is much more efficient when handling
> large or expensive-to-copy values, because the copy constructor and destructor
> aren't invoked for a default (immutable reference) argument.

Source: <https://mojolang.org/docs/manual/values/ownership/>. The manual also
notes "small values like `Int`, `Float`, and `SIMD` are always passed in machine
registers." Source: <https://mojolang.org/docs/manual/values/ownership/>.

### Pattern: return by name when the value cannot be moved

```mojo
def create_immovable_object(var name: String, out obj: ImmovableObject):
    obj = ImmovableObject(name^)
    obj.name += "!"
    # obj is implicitly returned
```

> Because the return value is assigned to this special `out` variable, it doesn't
> need to be moved or copied when it's returned to the caller. This means that
> you can create a function that returns a type that can't be moved or copied,
> and which takes several steps to initialize:

Source: <https://mojolang.org/docs/manual/functions/>. The `->` version of the
same function fails: "Error: ImmovableObject is not copyable or movable."
Source: <https://mojolang.org/docs/manual/functions/>.

### Pattern: take `var` and let the caller choose copy or move

```mojo
def add_to_list(var name: String, mut list: List[String]):
    list.append(name^)   # transfer; no copy, nothing left to destroy

def main():
    var message = "Hello"
    add_to_list(message, names)   # copied; `message` still usable
    add_to_list(message^, names)  # moved; `message` unusable afterwards
```

**Why:** `var` is documented as ownership of *a* value arriving three possible
ways — "Value transfer", "Copying", or "Newly created value" — so one signature
serves both call styles. Source:
<https://mojolang.org/docs/manual/values/ownership/>. Transfers are checked:
the transfer sigil "leaves `source` uninitialized, and you can't use it again
until you assign it a new value." Source:
<https://mojolang.org/docs/manual/variables/>.

### Wrong

```mojo
# Wrong: `mut` cannot have a default value.
def bump(mut x: Int = 0):     # Error: 'mut' arguments may not have defaults
    x += 1

# Wrong: taking `var` and then still relying on the caller's value.
def take(var data: List[Int]):
    consume(data)
    data.append(1)            # fine locally...
```

**Why it is wrong:** `mut` defaults are rejected outright. Source:
<https://mojolang.org/docs/reference/function-declarations/>. And `var` does not
mean "the original value": it "guarantees ownership of *a* value", which may be a
copy unless the caller transfers with `^`. Source:
<https://mojolang.org/docs/manual/values/ownership/>. A related trap is argument
exclusivity: passing the same value as `mut` and as another argument is rejected
— "a mutable reference can't have any other references that *alias* it." Source:
<https://mojolang.org/docs/manual/values/ownership/>.

## Iteration idioms

### Situation

You are looping, and you must pick the binding that matches whether you read,
mutate, copy, or consume the elements.

### Pattern: choose the loop binding deliberately

```mojo
var values = [1, 4, 7, 3, 6, 11]

# Read only: the default is an immutable reference.
for value in values:
    print(value)

# Mutate the elements in place.
for ref value in values:
    value -= 1

# Work on a mutable copy; the container is unchanged.
for var value in values:
    value += 100

# Consume the container.
for x in values^:
    print(x^)
```

**Why:** the reference states the rule as a single sentence:

> Use `var` and `ref` conventions to control ownership, copying, and mutability
> behavior in loop variables. By default, loop variables are immutable references
> to the iterated items (`imm`). To create a mutable copy, use `var`. To maintain
> value mutability, use `ref`:

Source: <https://mojolang.org/docs/reference/compound-statements/>. The manual
demonstrates the practical difference: with `var` the list is unchanged, with
`ref` it is changed. Source:
<https://mojolang.org/docs/manual/control-flow/>.

### Pattern: search with `for ... else`

```mojo
var found = False
for item in items:
    if item == target:
        found = True
        break
else:
    print("not found")   # only runs if break was never hit
```

> The `else` clause does *not* execute if a `break` or `return` statement
> terminates the loop.

Source: <https://mojolang.org/docs/reference/compound-statements/>. The `else`
clause runs even for an empty collection, which makes it the right shape for the
"search failed" default. Source:
<https://mojolang.org/docs/manual/control-flow/>.

### Pattern: destructure in the loop target

```mojo
for key, value in pairs:      # e.g. [(1, "one"), (2, "two")]
    print(key, value)

for item in capitals.items():  # Dict entries carry `key` and `value` fields
    print(item.value, item.key)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

### Wrong

```mojo
# Wrong: mutating through the default binding.
for value in values:
    value -= 1        # Error: the default loop variable is immutable

# Wrong: holding an element reference across a mutation of the container.
ref elem = values[0]
values.append(99)
print(elem)           # error: use of invalidated interior reference
```

**Why:** the default loop binding is an immutable reference, so assignment cannot
compile. Source: <https://mojolang.org/docs/reference/compound-statements/>. The
second is the interior-origin check, a 1.0 safety feature: "`List` ... now
returns element references bound to an *interior origin* of the list ... so
mutating the list ... invalidates an element reference. The lifetime checker now
correctly rejects code that holds an element reference across such a mutation,
instead of letting it silently dangle after a reallocation." Source:
<https://mojolang.org/releases/v1.0.0/>.

## Value-semantics patterns

### Situation

You need a second name for a value, and you must decide whether you want an
independent copy or a shared reference.

### Pattern: `var` for ownership, `ref` for a shared view, `.copy()` for explicit duplication

```mojo
var a: List[Int] = [1, 2, 3]

var b = a.copy()   # an independent copy
b.append(4)
print(a)           # [1, 2, 3] — unchanged

ref c = a          # a shared view; no copy
c.append(5)
print(a)           # [1, 2, 3, 5] — changed through the reference
```

> To use Python-like reference behavior, declare `b` with `ref` instead of `var`.

Source: <https://mojolang.org/docs/manual/python-to-mojo/>. The container rule is
stated in the collections reference: containers are explicitly copyable only, so
you must call `.copy()`; assignment of an existing `List` without `.copy()` will
not compile: "`List[Int]` is not implicitly copyable because it doesn't conform
to `ImplicitlyCopyable`". Source:
<https://mojolang.org/docs/manual/variables/>.

### Pattern: move instead of copy with `^`

```mojo
var second = first^   # transfer; `first` is uninitialized afterwards
```

**Why:** the transfer sigil exists precisely to avoid a copy while keeping one
owner: "This is a critical feature of Mojo's lifetime checker, because it ensures
that no two variables have ownership of the same value." Source:
<https://mojolang.org/docs/manual/values/ownership/>.

### Wrong

```mojo
# Wrong: assuming assignment shares state (the Python habit).
var a: List[Int] = [1, 2, 3]
var b = a             # Error: List is not implicitly copyable
b.append(4)

# Wrong: copying a large value "just in case".
def report(var data: List[Record]):
    print(len(data))  # takes an owned copy; use `imm` instead
```

**Why:** Mojo's argument behavior "defaults to value semantics" and "requires no
copies unless we explicitly make the copies ourselves", while a `var` argument
copies unless the caller transfers. Sources:
<https://mojolang.org/docs/manual/values/value-semantics/> and
<https://mojolang.org/docs/manual/values/ownership/>.

### Situation: returning something that may be absent

### Pattern: use `Optional`, never a magic sentinel

```mojo
def find_index(items: List[String], target: String) -> Optional[Int]:
    ...

def main():
    var idx = find_index(names, "bob")
    if idx:
        print(idx.value())      # guarded access
    print(idx.or_else(-1))      # default
```

**Why:** `value()` aborts on an empty `Optional`, so the type makes the check
mandatory in practice:

> If the `Optional` holds a value, you can retrieve a reference to the value
> using the `value()` method. But calling `value()` on an `Optional` with no
> value results in undefined behavior, so you should always guard a call to
> `value()` inside a conditional.

Source: <https://mojolang.org/docs/manual/types/>. `or_else()` supplies a default
in one expression. Source:
<https://mojolang.org/docs/std/collections/optional/Optional/>.

### Wrong

```mojo
# Wrong: modeling absence with a special integer value.
def find_index(items: List[String], target: String) -> Int:
    ...
    return -1   # a caller that forgets to check reads items[-1]
```

**Why:** negative indexing is removed in 1.x, so a `-1` sentinel is not even a
working sentinel for indexing; and the type does not force the caller to check.
Source: <https://mojolang.org/releases/v1.0.0/>. Use `Optional[Int]` so the
check is part of the type.

## Pitfalls

- **Writing cleanup without `with`.** The success path closes the handle; the
  error path leaks it. Use a context manager. Verified above.
- **Returning a copy from `__enter__`.** The `as` target must be the manager, so
  that `__exit__` runs on the object the body uses. Verified above.
- **Bare `raises` on a typed-error API.** It erases the compile-time type and the
  caller loses field access. Verified above.
- **Copying an error on re-raise.** `raise e` copies; `raise e^` transfers, and a
  non-`ImplicitlyCopyable` error requires the transfer. Verified above.
- **Constraining on a trait the body never uses.** It narrows the acceptable
  types for no benefit. Verified above.
- **Using `Some[Trait]` for a struct field.** No call site to infer from; use an
  explicit type parameter. Verified above.
- **Hand-writing lifecycle methods when nothing is custom.** `@fieldwise_init`
  and trait conformance synthesize them. Verified above.
- **`mut` with a default.** Rejected. Verified above.
- **Expecting `var` to be "the original value".** It is ownership of a value,
  which may be a copy without `^`. Verified above.
- **Passing one value as both `mut` and another argument.** Argument exclusivity
  rejects the alias. Verified above.
- **Assuming the default loop binding is mutable.** It is an immutable reference.
  Verified above.
- **Holding an element reference across a mutation.** The interior-origin checker
  rejects it. Verified above.
- **Assuming assignment shares state.** Containers are explicitly copyable only.
  Verified above.
- **Modeling absence with a sentinel.** Use `Optional[T]`. Verified above.

## Sources

- Mojo manual — Errors, error handling, and context managers: <https://mojolang.org/docs/manual/errors/>
- Mojo manual — Ownership: <https://mojolang.org/docs/manual/values/ownership/>
- Mojo manual — Value semantics: <https://mojolang.org/docs/manual/values/value-semantics/>
- Mojo manual — Functions (named results, effects): <https://mojolang.org/docs/manual/functions/>
- Mojo manual — Parameters and generics: <https://mojolang.org/docs/manual/generics/>
- Mojo manual — Parameterization: <https://mojolang.org/docs/manual/parameters/>
- Mojo manual — Structs: <https://mojolang.org/docs/manual/structs/>
- Mojo manual — Traits: <https://mojolang.org/docs/manual/traits/>
- Mojo manual — Variables (copying and moving): <https://mojolang.org/docs/manual/variables/>
- Mojo manual — Types (`Optional`, `value()`): <https://mojolang.org/docs/manual/types/>
- Mojo manual — Control flow (loop bindings, `else`): <https://mojolang.org/docs/manual/control-flow/>
- Mojo manual — Python-to-Mojo (`ref` for reference behavior): <https://mojolang.org/docs/manual/python-to-mojo/>
- Mojo reference — Function declarations: <https://mojolang.org/docs/reference/function-declarations/>
- Mojo reference — Compound statements: <https://mojolang.org/docs/reference/compound-statements/>
- Mojo reference — Trait declarations: <https://mojolang.org/docs/reference/trait-declarations/>
- Mojo standard library — `Optional` API: <https://mojolang.org/docs/std/collections/optional/Optional/>
- Mojo v1.0.0 release notes (interior origins, negative indexing): <https://mojolang.org/releases/v1.0.0/>
