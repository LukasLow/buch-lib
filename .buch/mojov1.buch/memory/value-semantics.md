# Value semantics

Mojo is designed so that its defaults follow **value semantics**: each variable
has unique access to a value, and code outside that variable's scope cannot
modify it. But the official statement is more precise than "Mojo has value
semantics", and it matters:

> Mojo doesn't enforce value semantics or reference semantics. It supports them
> both and allows each type to define how it is created, copied, and moved (if at
> all). So, if you're building your own type, you can implement it to support
> value semantics, reference semantics, or a bit of both. That said, Mojo is
> designed with argument behaviors that default to value semantics, and it
> provides tight controls for reference semantics that avoid memory errors.

Source: <https://mojolang.org/docs/manual/values/value-semantics/>.

This page explains the default, what enforces it, and what a type author must do
for the promise to hold. Ownership and argument conventions are on
[ownership and lifetimes](ownership-and-lifetimes.md); origins are on
[origin and borrowing](origin-and-borrowing.md).

## The default: unique access

Value semantics means that sharing a value-semantic type means creating a copy —
"pass by value":

```mojo
def main():
    var x = 1
    var y = x
    y += 1

    print("x:", x)
    print("y:", y)
```

```output
x: 1
y: 2
```

Assigning `x` to `y` creates `y`'s value by copying `x`; incrementing `y` leaves
`x` untouched. Each variable has exclusive ownership of a value. If the type
instead used reference semantics, `y` would point at the same value as `x`, and
mutating either would affect both. Source:
<https://mojolang.org/docs/manual/values/value-semantics/>.

Numeric values are value-semantic because they are *trivial* types, cheap to
copy. Source: <https://mojolang.org/docs/manual/values/value-semantics/>.

## The default is not "enforced" — it is the default behavior

The opening statement is the key qualification: **the compiler does not make
your type value-semantic.** What Mojo enforces is a related but different
property — unique *ownership*:

> The way we do that in Mojo is, instead of enforcing that every variable have
> "exclusive access" to a value, we ensure that every value has an "exclusive
> owner," and destroy each value when the lifetime of its owner ends.

Source: <https://mojolang.org/docs/manual/values/value-semantics/>.

So the model is:

- **Argument behavior defaults to value semantics.** By default a function
  receives an immutable reference and cannot mutate the caller's value; the
  default "requires no copies unless we explicitly make the copies ourselves."
- **The type author decides what a copy *means*.** Mojo provides tight controls
  for reference semantics, but it does not stop a type from being
  reference-semantic if that is how it is written.

The official caveat about deep copies makes the division of responsibility
explicit:

> What makes Mojo's copy behavior different, compared to other languages, is that
> copy constructor is designed to perform a deep copy of all fields in the type
> (as per value semantics). ... However, the Mojo compiler doesn't enforce this,
> so it's the type author's responsibility to implement copy constructor with
> value semantics.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

## Value semantics in function arguments

The default argument convention is a read-only reference, which the manual calls
a "look but don't touch" approach:

```mojo
def add_two(y: Int):
    # y += 2  # Error: `y` is immutable
    var z = y
    z += 2
    print("z:", z)

def main():
    var x = 1
    add_two(x)
    print("x:", x)
```

```output
z: 3
x: 1
```

> Thus, the default behavior for function arguments is fully value semantic:
> arguments are immutable references, and any living variable from the caller is
> not affected by the function.

Source: <https://mojolang.org/docs/manual/values/value-semantics/>.

The efficiency point matters: the default avoids the copy constructor and
destructor "for a default (immutable reference) argument", so passing a large
value costs no copy. Source:
<https://mojolang.org/docs/manual/values/ownership/>.

Mutable access is opt-in with `mut` (see
[ownership and lifetimes](ownership-and-lifetimes.md)); that is how Mojo
reintroduces reference semantics without losing memory safety.

## Copies, moves, and the traits that govern them

A type's copy and move behavior comes from traits and lifecycle methods, not
from the language silently. The core vocabulary:

| Trait / method | Meaning |
|----------------|---------|
| `Copyable` | The type can be copied explicitly, via `.copy()` or the copy constructor. |
| `ImplicitlyCopyable` | The type refines `Copyable` and may be copied implicitly (assignment, argument passing). |
| `Movable` | The type can be moved; `Copyable` implies it. |
| `__init__(out self, *, copy: Self)` | The copy constructor. |
| `__init__(out self, *, deinit move: Self)` | The move constructor. |

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

A value can be copied explicitly or implicitly:

```mojo
# Explicit copy
var s = "Test string"
var s2 = s.copy()

# Implicit copy
var i = 15
var i2 = i
```

To make a struct explicitly copyable, add the `Copyable` trait; Mojo then
generates a default copy constructor unless you write one. Adding
`ImplicitlyCopyable` (which refines `Copyable`) additionally allows implicit
copies:

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

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

The official guidance on when implicit copying is acceptable is strict:

> A type should be implicitly copyable only if copying the type is inexpensive and
> has no side effects. ... In particular, any type that dynamically allocates
> memory or manages other resources probably shouldn't be implicitly copyable.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

> **Pitfall:** in 1.x the default flipped. `Copyable` means *explicitly* copyable;
> you opt in to implicit copies with `ImplicitlyCopyable`. This is why `Array`,
> `List` and the other containers are not implicitly copyable. See
> [`versions/1.0.0`](../versions/1.0.0.md) for the rename table.

## Move-only and immovable types

Value semantics does not require copyability. A type can be **move-only** —
`Movable` but not `Copyable` — and a rare type can be neither:

- Move-only: `OwnedPointer` is the documented example. You must use the `^`
  transfer sigil to end the lifetime of a move-only value when assigning it or
  passing it as a `var` argument.
- Neither copyable nor movable: `Atomic` is the documented example.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

## Trivial types

> Trivial types like `Int`, `Bool`, or `Float64` are the most common types in
> systems programming. Mojo doesn't need special support for these. They have no
> ownership semantics, no destructors, and are always passed in CPU
> registers.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

Triviality is exposed to the compiler as boolean aliases rather than a
decorator:

- `Copyable.__copy_ctor_is_trivial` — the value can be copied bitwise with no
  side effects.
- `Movable.__move_ctor_is_trivial` — the value can be moved bitwise with no side
  effects.
- `AnyType.__del__is_trivial` — the destructor (`__deinit__`) is a no-op.

Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

> **Open question:** the lifecycle page names these aliases using the
> pre-1.0 destructor spelling `__del__is_trivial`, and the same page elsewhere
> uses `__del__()`. The 1.0.0 rename table says `__del__()` → `__deinit__()`;
> the `death` page consistently uses `__deinit__()`. Treat `__deinit__()` as the
> current destructor name and the `__del__` spellings on the lifecycle page as
> documentation lag. See [`versions/1.0.0`](../versions/1.0.0.md).

## Pitfalls

- **Believing "value semantics" means "no aliasing ever".** Mojo does not
  enforce value semantics; a type can be written reference-semantic, and
  closures and references deliberately share access safely. Source:
  <https://mojolang.org/docs/manual/values/value-semantics/>.
- **Expecting a default argument to be a copy.** The default is an immutable
  reference; no copy is made. Source:
  <https://mojolang.org/docs/manual/values/ownership/>.
- **Writing a shallow copy constructor.** The compiler won't stop you from
  copying a pointer field instead of the pointed-to data; a deep copy is the
  type author's job. Source: <https://mojolang.org/docs/manual/lifecycle/life/>.
- **Marking a heap-allocating type `ImplicitlyCopyable`.** Implicit copies of an
  expensive type are a documented performance hazard. Source:
  <https://mojolang.org/docs/manual/lifecycle/life/>.
- **Trying to copy a move-only type.** `OwnedPointer` cannot be copied, only
  moved with `^`. Source: <https://mojolang.org/docs/manual/lifecycle/life/>.

## Sources

- Mojo manual — Value semantics: <https://mojolang.org/docs/manual/values/value-semantics/>
- Mojo manual — Intro to value ownership: <https://mojolang.org/docs/manual/values/>
- Mojo manual — Ownership: <https://mojolang.org/docs/manual/values/ownership/>
- Mojo manual — Value creation: <https://mojolang.org/docs/manual/lifecycle/life/>
- Mojo manual — Value destruction: <https://mojolang.org/docs/manual/lifecycle/death/>
