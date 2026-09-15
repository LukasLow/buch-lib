# Value creation

The life of a value begins when a variable is initialized. This page describes
how every value in Mojo is created, copied, and moved.

All data types in Mojo — including `Bool`, `Int`, and `String` — are structs, so
"the creation and destruction of any piece of data follows the same lifecycle
rules, and you can define your own data types that work exactly the same way."
Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

> Mojo structs don't get any default lifecycle methods, such as a constructor,
> copy constructor, or move constructor. That means you can define a struct
> without a constructor, but then you can't instantiate it, and it would be useful
> only as a sort of namespace for static methods.

```mojo
struct NoInstances:
    var state: Int

    @staticmethod
    def print_hello():
        print("Hello world!")
```

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

**Mojo structs do not support default field values** — every field must be
initialized in a constructor. Source:
<https://mojolang.org/docs/manual/lifecycle/life/>.

## The constructor: `__init__()`

The constructor's main responsibility is to initialize all fields:

```mojo
struct MyPet:
    var name: String
    var age: Int

    def __init__(out self, name: String, age: Int):
        self.name = name
        self.age = age

def main():
    var mine = MyPet("Loki", 4)
```

An instance created this way can be read and destroyed, but it cannot yet be
copied or moved:

> We believe this is a good default starting point, because there are no built-in
> lifecycle events and no surprise behaviors. You — the type author — must
> explicitly decide whether and how the type can be copied or moved, by
> implementing the copy and move constructors.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

Mojo does not require a destructor to destroy an instance; it adds a no-op
destructor when a type doesn't define one. Source:
<https://mojolang.org/docs/manual/lifecycle/life/>.

> **Note on naming:** the docs clarify that in a Mojo struct there is no
> `__new__()` method, so `__init__()` is always called the *constructor* — unlike
> Python, where construction spans `__new__()` and `__init__()`. Source:
> <https://mojolang.org/docs/manual/lifecycle/life/>.

### The field-wise constructor and `@fieldwise_init`

The pattern of a constructor with one argument per field is common enough that
Mojo provides a decorator for it:

```mojo
@fieldwise_init
struct MyPetFields:
    var name: String
    var age: Int
```

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

### Overloading the constructor

Like any method, `__init__()` can be overloaded. Each constructor must declare
`self` with the `out` convention, and to call one constructor from another you
call it as you would externally — without passing `self`:

```mojo
struct MyPet2:
    var name: String
    var age: Int

    def __init__(out self):
        self.name = ""
        self.age = 0

    def __init__(out self, name: String):
        self = MyPet2()
        self.name = name
```

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

### Field initialization: the only requirement

By the end of each constructor, all fields must be initialized — that is the
constructor's only hard requirement. And the constructor is "smart enough to treat
the `self` object as fully initialized even before the constructor is finished, as
long as all fields are initialized":

```mojo
def use(arg: MyPet):
    pass

struct MyPet3:
    var name: String
    var age: Int

    def __init__(out self, name: String, age: Int, cond: Bool):
        self.name = name
        if cond:
            self.age = age
            use(self)   # Safe to use immediately!
        self.age = age
        use(self)
```

Source: <https://mojolang.org/docs/manual/lifecycle/life/>. The finer
logical-versus-field-wise distinction is the subject of
[initialization](initialization.md).

## Implicit conversion

Mojo supports implicit conversion from one type to another, in three situations:

- Assigning a value of one type to a variable of a different type.
- Passing a value of one type to a function requiring a different type.
- Returning a value of one type from a function declaring a different return type.

```mojo
var opt_greeting: Optional[String] = None   # empty Optional
opt_greeting = String("Salve!")             # converts String into Optional
```

> In general, types should only support implicit conversions when the conversion
> is: Safe, Zero-cost or low-cost, Semantically unambiguous. Implicit conversion is
> intended to reduce unnecessary boilerplate, not to weaken type safety.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

### Enabling implicit conversion

A constructor enables implicit conversion when it:

- Is declared with the `@implicit` decorator.
- Has a single required, non-keyword argument of the source type.

```mojo
struct Target:
    @implicit
    def __init__(out self, s: Source):
        pass
```

The constructor may also take optional arguments:

```mojo
struct Target2:
    @implicit
    def __init__(out self, s: Source, reverse: Bool = False): ...
```

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

Two limits:

- **At most one implicit conversion** is applied to a variable. A deeper chain
  fails: `var t: OverloadedTarget = Source()` is an error "because there's no
  direct conversion from `Source` to `OverloadedTarget`."
- **Ambiguity is an error.** If two intermediate types each convert from the
  source, the compiler reports "ambiguous call to `__init__`: each candidate
  requires 1 implicit conversion". Resolve by casting explicitly, e.g.
  `OverloadedTarget(A(Source()))`.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

For a struct with a single field, `@fieldwise_init("implicit")` generates the
implicit constructor:

```mojo
@fieldwise_init("implicit")
struct Counter:
    var count: Int

def main():
    var c: Counter = 5   # implicitly converts from Int
```

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

## Copying

A value can be copied explicitly or implicitly:

```mojo
# Explicit copy
var s = "Test string"
var s2 = s.copy()

# Implicit copy
var i = 15
var i2 = i
```

To make a struct explicitly copyable:

- Add the `Copyable` trait.
- Optionally define a custom copy constructor: `def __init__(out self, *, copy: Self)`.

> By adding the `Copyable` trait, Mojo can generate a default copy constructor for
> you unless you've written one yourself. This default method copies each field of
> the `copy` value into the new value. The `Copyable` trait also defines a default
> `copy()` method.

```mojo
@fieldwise_init
struct MyPetCopy(Copyable):
    var name: String
    var age: Int
```

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

The generated constructor is equivalent to:

```mojo
def __init__(out self, *, copy: Self):
    self.name = copy.name
    self.age = copy.age
```

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

> **Pitfall:** you *could* write a copy constructor without adding `Copyable`,
> but it is "not recommended. Mojo would be able to copy the value, but you
> couldn't use the struct with any parameterized containers or functions that
> require the `Copyable` trait."

### When you need a custom copy constructor

- One or more of the struct's fields is not `Copyable`.
- The struct includes a non-owning type (like a pointer) and you want a deep copy.
- The struct holds other resources (file descriptors, network sockets).

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

The distinguishing property of Mojo's copy behavior is that the constructor is
*designed* to deep-copy, but the compiler does not enforce it:

> What makes Mojo's copy behavior different, compared to other languages, is that
> copy constructor is designed to perform a deep copy of all fields in the type (as
> per value semantics). That is, it copies heap-allocated values, rather than just
> copying the pointer. However, the Mojo compiler doesn't enforce this, so it's the
> type author's responsibility to implement copy constructor with value semantics.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

Two more details from the documentation of a custom copy constructor:

- The `copy` argument is typed `Self` (capital "S"), which is "an alias for the
  current type name" and is a best practice to avoid mistakes.
- The `copy` argument is immutable because the default argument convention is an
  immutable reference — "a good thing because this function shouldn't modify the
  contents of the value being copied."

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

The manual's `HeapArray` example shows the deep-copy shape:

```mojo
def __init__(out self, *, copy: Self):
    # Deep-copy the existing value
    self.size = copy.size
    self.cap = copy.cap
    self.data = alloc[Int](self.cap)
    for i in range(self.size):
        (self.data + i).unsafe_write(copy.data[i])
```

Source: <https://mojolang.org/docs/manual/lifecycle/life/>. (Note: this upstream
example uses the pre-1.0 pointer idioms — `UnsafePointer` and `ptr + i` — which
are deprecated; see [`versions/1.0.0`](../versions/1.0.0.md). The current
`unsafe_offset(i)` / `unsafe_write` forms are on
[allocators](../memory/allocators.md).)

### Implicitly-copyable types

`ImplicitlyCopyable` refines `Copyable` and signals that the compiler may insert
copies as needed:

```mojo
@fieldwise_init
struct MyPair(ImplicitlyCopyable):
    var first: Int
    var second: Int

def main():
    var pair = MyPair(3, 4)
    var copy = pair
    print(pair.first, copy.second)   # 3 4
```

The trait defines no methods of its own; it "serves as a signal to the compiler
that it can insert calls to copy constructor as needed." Adding it also gives
automatic `Movable` conformance. Source:
<https://mojolang.org/docs/manual/lifecycle/life/>.

> **Pitfall:** "A type should be implicitly copyable only if copying the type is
> inexpensive and has no side effects. ... In particular, any type that
> dynamically allocates memory or manages other resources probably shouldn't be
> implicitly copyable."

## Moving

Copying is predictable but can be expensive. The move constructor transfers
ownership *without* copying fields; a copyable type without a move constructor can
still be transferred by copy-and-discard, so the move constructor is an
optimization. Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

To make a type movable: add the `Movable` trait (or conform to `Copyable`), and
optionally implement a custom move constructor.

```mojo
def moves():
    var a = MyPet("Bobo", 2)
    print(a.name)
    var b = a^               # the lifetime of `a` ends here
    print(b.name)
    # print(a.name)          # ERROR: use of uninitialized value 'a'
```

The generated move constructor is equivalent to:

```mojo
def __init__(out self, *, deinit move: Self):
    self.name = move.name^
    self.age = move.age
```

> The move constructor takes its `move` argument using the `deinit` argument
> convention, which grants exclusive ownership of the value and marks it as
> destroyed at the end of the function.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

For trivial register-passable types like `Int`, omit the transfer sigil: "Trivial
types are always movable. Since they can't define custom move constructors or
destructors, there's no special logic required to move." Source:
<https://mojolang.org/docs/manual/lifecycle/life/>.

At the end of the move constructor, Mojo immediately invalidates the original
variable; because the argument is `deinit`, it does *not* call the destructor,
since that would destroy resources that have been transferred. Source:
<https://mojolang.org/docs/manual/lifecycle/life/>.

> **Pitfall:** a move constructor is not *required* to transfer ownership. Mojo
> can copy the value and invalidate the original instance. If copying is
> expensive, defining the move constructor matters.

### Custom move constructors

> In practice, structs very rarely require a custom move constructor. A type might
> require a custom implementation if it has a pointer to itself or one of its
> fields, for example, since the struct's location in memory changes when it's
> moved.

A move constructor "takes the incoming value as a `deinit` argument, meaning this
method gets unique ownership of the value", and because it is a dunder Mojo calls
only when performing a move, the `move` argument "is guaranteed to be a mutable
reference to the original value, *not a copy*". Source:
<https://mojolang.org/docs/manual/lifecycle/life/>.

## Move-only and immovable types

- **Move-only**: `Movable` but not `Copyable`. You must use `^` to end the
  lifetime when assigning or passing as a `var` argument. `OwnedPointer` is the
  documented example: "designed to provide clear single ownership of a stored
  value, the `OwnedPointer` can be moved, but not copied."
- **Immovable**: neither copyable nor movable. `Atomic` is the documented example.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

## Trivial types and their lifecycle aliases

> Trivial types like `Int`, `Bool`, or `Float64` are the most common types in
> systems programming. Mojo doesn't need special support for these. They have no
> ownership semantics, no destructors, and are always passed in CPU registers.

The use of a decorator to identify trivial types "will be phased out in favour of
a more granular set of aliases, which are boolean flags set by the compiler":

| Alias | Trait | Hint |
|-------|-------|------|
| `__copy_ctor_is_trivial` | `Copyable` | Value can be copied bitwise with no side effects. |
| `__move_ctor_is_trivial` | `Movable` | Value can be moved bitwise with no side effects. |
| `__del__is_trivial` | `AnyType` | The destructor is a no-op. |

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

> **Open question:** the third alias is spelled `__del__is_trivial` on the
> lifecycle page, using the pre-1.0 destructor name. Under the 1.0.0 rename
> (`__del__()` → `__deinit__()`), the current name is `__deinit__is_trivial`.
> This book reports the upstream spelling and flags it rather than silently
> rewriting an alias name. See [`versions/1.0.0`](../versions/1.0.0.md).

## Pitfalls

- **Defining a struct with fields but no constructor.** It cannot be
  instantiated and only serves as a namespace; fields can never be initialized.
  Source: <https://mojolang.org/docs/manual/lifecycle/life/>.
- **Expecting default field values.** Mojo structs do not support them; every
  field must be set in a constructor. Source:
  <https://mojolang.org/docs/manual/lifecycle/life/>.
- **Adding `Copyable` to a huge struct.** A default copy constructor copies each
  field; for heap-owning types you need a custom deep copy. Source:
  <https://mojolang.org/docs/manual/lifecycle/life/>.
- **Writing a shallow copy constructor.** The compiler does not enforce the deep
  copy that value semantics calls for. Source:
  <https://mojolang.org/docs/manual/lifecycle/life/>.
- **Marking an allocating type `ImplicitlyCopyable`.** Implicit copies are a
  documented performance and correctness hazard. Source:
  <https://mojolang.org/docs/manual/lifecycle/life/>.
- **Forgetting `out self` on a constructor.** An initializer must have an
  `out self` result. Source:
  <https://mojolang.org/docs/reference/function-declarations/>.
- **Relying on a move constructor existing implicitly.** A type without the
  `Movable` trait (or `Copyable`) cannot be moved. Source:
  <https://mojolang.org/docs/manual/lifecycle/life/>.

## Open questions

> **Open question:** the creation page still shows pre-1.0 pointer idioms in its
> `HeapArray` copy-constructor example (`UnsafePointer`, `ptr + i`) and the
> `__del__is_trivial` alias. Both are treated here as documentation lag; the
> current spellings are `Pointer` with `unsafe_offset()`, `__deinit__`, and the
> `__deinit__is_trivial` naming pattern.

> **Open question:** the page mentions `@register_passable`/`@register_passable
> ("trivial")` only indirectly, via the "decorator ... phased out" note. The 1.0.0
> notes say both decorators are removed in favour of the `RegisterPassable` /
> `TrivialRegisterPassable` traits. See [`versions/1.0.0`](../versions/1.0.0.md).

## Sources

- Mojo manual — Value creation: <https://mojolang.org/docs/manual/lifecycle/life/>
- Mojo manual — Intro to value lifecycle: <https://mojolang.org/docs/manual/lifecycle/>
- Mojo manual — Ownership: <https://mojolang.org/docs/manual/values/ownership/>
- Mojo manual — Value semantics: <https://mojolang.org/docs/manual/values/value-semantics/>
- Mojo reference — Function declarations (special methods): <https://mojolang.org/docs/reference/function-declarations/>
- Mojo reference — Decorators (`@fieldwise_init`, `@implicit`): <https://mojolang.org/docs/reference/decorators/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
