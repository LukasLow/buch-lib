# Ownership and lifetimes

Mojo has no garbage collector and no reference counting. Instead it uses
**ownership**: rules that ensure every value has one owner at a time, and a
compile-time lifetime checker that inserts destructor calls at the right point.

This page covers the ownership rules, the argument conventions that share
references safely, argument exclusivity, ownership transfer with `var` and `^`,
and lifecycle methods. The default-behavior background is on
[value semantics](value-semantics.md); reference validity tracking is on
[origin and borrowing](origin-and-borrowing.md). The lifecycle chapter goes
deeper: [life](../lifecycle/life.md), [initialization](../lifecycle/initialization.md),
and [death](../lifecycle/death.md).

## Why ownership

> Mojo uses a third approach called "ownership" that relies on a collection of
> rules that programmers must follow when passing values. The rules ensure there
> is only one "owner" for a given value at a time. When a value's lifetime ends,
> Mojo calls its destructor, which is responsible for deallocating any heap
> memory that needs to be deallocated.

> In this way, Mojo helps ensure memory is freed, but it does so in a way that's
> deterministic and safe from errors such as use-after-free, double-free and
> memory leaks. Plus, it does so with a very low performance overhead.

Source: <https://mojolang.org/docs/manual/values/>.

## The rules

> - Every value has only one owner at a time.
> - When the lifetime of the owner ends, Mojo destroys the value.
> - If there are existing references to a value, Mojo extends the lifetime of the
>   owner.

Source: <https://mojolang.org/docs/manual/values/ownership/>.

Two definitions support the rules: a variable *owns* its value, and a struct
owns its fields; a *reference* gives mutable or immutable access to a value owned
elsewhere. Mojo references are created when you call a function, because
arguments are passed as references, and a function can return a reference:

```mojo
ref value_ref = list[0]
```

Source: <https://mojolang.org/docs/manual/values/ownership/>.

## Argument conventions

An *argument convention* specifies whether an argument is mutable or immutable,
and whether the function owns the value. It is written at the beginning of an
argument declaration. The six conventions the manual lists:

| Convention | Meaning |
|------------|---------|
| default | The function receives an **immutable reference**; it can read the original value (not a copy) but not mutate it. |
| `mut` | The function receives a **mutable reference**; it can read and mutate the original value (not a copy). |
| `var` | The function takes **ownership** of a value; it has exclusive ownership. |
| `ref` | A reference with **parametric mutability**: it follows the mutability of the referenced value. |
| `out` | Used for `self` in constructors and for named results; uninitialized on entry, initialized before return, never passed by the caller. |
| `deinit` | Used in the destructor and consuming-move lifecycle methods; initialized on entry, uninitialized on return. |

Source: <https://mojolang.org/docs/manual/values/ownership/>.

```mojo
def add(mut x: Int, y: Int):
    x += y

def main():
    var a = 1
    var b = 2
    add(a, b)
    print(a)   # 3
```

Source: <https://mojolang.org/docs/manual/values/ownership/>.

### Default (`imm`): immutable reference

> In general, passing an immutable reference is much more efficient when handling
> large or expensive-to-copy values, because the copy constructor and destructor
> aren't invoked for a default (immutable reference) argument.

Two properties distinguish it from C++ `const&`:

> - The Mojo compiler implements a lifetime checker that ensures that values are
>   not destroyed when there are outstanding references to those values.
> - Small values like `Int`, `Float`, and `SIMD` are always passed in machine
>   registers.

And from Rust: "Mojo doesn't require a sigil on the caller side to pass by
immutable reference." Source:
<https://mojolang.org/docs/manual/values/ownership/>.

### `mut`: mutable reference

`mut` means changes *inside* the function are visible *outside* it:

```mojo
def mutate(mut l: List[Int]):
    l.append(5)

def main():
    var values = [1, 2, 3, 4]
    mutate(values)
    print(values)   # [1, 2, 3, 4, 5]
```

Two constraints apply:

> You can't define default values for `mut` arguments.

and the value passed as `mut` must already be mutable; taking an immutable
reference and passing it as `mut` is a compiler error. Source:
<https://mojolang.org/docs/manual/values/ownership/>.

### Argument exclusivity

> Mojo enforces *argument exclusivity* for mutable references. This means that if
> a function receives a mutable reference to a value (such as an `mut` argument),
> it can't receive any other references to the same value — mutable or
> immutable. That is, a mutable reference can't have any other references that
> *alias* it.

```mojo
def append_twice(mut s: String, other: String):
   # Mojo knows 's' and 'other' can't be the same string.
   s += other
   s += other

def invalid_access():
  var my_string = "o"
  # Error: passing `my_string` mut is invalid since it's also passed
  # as an immutable reference
  # append_twice(my_string, my_string)
```

The docs note the code would otherwise be confusing (the actual output would be
`oooo`), and that exclusivity also lets the compiler optimize. The documented
workaround is to make a copy:

```mojo
def valid_access():
  var my_string = "o"
  var other_string = my_string
  append_twice(my_string, other_string)
  print(my_string)
```

> Note that argument exclusivity isn't enforced for register-passable trivial
> types (like `Int` and `Bool`) as they're always passed by copy.

Source: <https://mojolang.org/docs/manual/values/ownership/>.

## Transfer: `var` and `^`

`var` takes ownership. Critically, it does **not** guarantee the function
receives the original value; it guarantees ownership of *a* value, arriving in
one of three ways:

- **Value transfer** — the caller uses `^`, leaving the original variable
  uninitialized.
- **Copying** — without `^`, Mojo copies; a non-`Copyable` type makes this a
  compile error.
- **Newly created value** — the caller passes the result of a call, so no
  variable owns it and ownership transfers directly.

Source: <https://mojolang.org/docs/manual/values/ownership/>.

```mojo
def take_text(var text: String):
    text += "!"
    print(text)

def main():
    var message = "Hello"
    take_text(message)   # copied: prints "Hello!"
    print(message)       # still "Hello"
```

With the transfer sigil the original becomes unusable:

```mojo
def main():
    var message = "Hello"
    take_text(message^)
    print(message)   # error: use of uninitialized value 'message'
```

> This is a critical feature of Mojo's lifetime checker, because it ensures that
> no two variables have ownership of the same value.

Source: <https://mojolang.org/docs/manual/values/ownership/>.

An owned `var` value is destroyed when the function exits unless the function
transfers it elsewhere:

```mojo
def add_to_list(var name: String, mut list: List[String]):
    list.append(name^)
    # name is uninitialized, nothing to destroy

def consume_string(var s: String):
    print(s)
    # s is destroyed here
```

Source: <https://mojolang.org/docs/manual/values/ownership/>.

### Ownership transfer is not the same as a move

> In Mojo, you shouldn't conflate "ownership transfer" with a "move operation" —
> these aren't strictly the same thing.

There are multiple ways ownership transfers:

- Mojo may invoke the move constructor `__init__(take=)` if a value of that type
  is transferred into a function as a `var` argument **and** the original
  variable's lifetime ends at the same point (with or without `^`).
- "In some cases, Mojo optimizes away the move operation entirely, leaving the
  value in the same memory location but updating its ownership." Then neither the
  copy nor the move constructor runs.

For a `var` argument to work **without** `^`, the type must be copyable (via
`__init__(out self, *, copy: Self)`). Source:
<https://mojolang.org/docs/manual/values/ownership/>.

> **Open question:** the manual's ownership page writes the move constructor as
> `__init__(take=)`, while the lifecycle and function-declaration references use
> the current name `__init__(out self, *, deinit move: Self)` and the 1.0.0 table
> records `take` → `move` as a beta rename. Treat `move` as the current
> parameter name.

### `ref`: parametric mutability

`ref` arguments follow the mutability of the value passed in, so one function
works for both mutable and immutable callers. They are covered in detail on
[origin and borrowing](origin-and-borrowing.md).

## Lifecycle methods and destruction

The lifetime checker "analyzes dataflow through your program", identifies when
variables are valid, and "inserts destructor calls when a variable's lifetime
ends." Source: <https://mojolang.org/docs/manual/values/lifetimes/>.

A value's lifecycle is defined by dunder methods on its struct — constructor,
copy constructor, move constructor, and destructor — and all values of the same
type share one lifecycle. A variable's *lifetime* is "the span of time during
program execution in which the variable is considered valid." It begins when the
value is initialized and ends when it is destroyed or consumed. Source:
<https://mojolang.org/docs/manual/lifecycle/>.

> The Mojo compiler takes care of releasing resources after last use when needed.

Source: <https://mojolang.org/docs/manual/lifecycle/>.

Destruction is **ASAP** — as soon as possible after last use, not at end of
scope, and even inside an expression:

> As soon as a value/object is no longer used, Mojo destroys it. Mojo does *not*
> wait until the end of a code block — or even until the end of an expression —
> to destroy an unused value. It destroys values using an "as soon as possible"
> (ASAP) destruction policy that runs after every sub-expression.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

The details — `Deinitable`, `__deinit__`, `@explicit_destroy`, and explicit
lifetime extension — are on [death](../lifecycle/death.md).

### `Deinitable` and `__deinit__`

- `Deinitable` provides a default no-op destructor `__deinit__()` which you can
  override.
- Override `__deinit__()` when a type allocates memory or holds long-lived
  resources; a type that is a simple collection of other types usually does not
  need to.
- A pointer does not own the values it points to, so destroying a pointer does
  not call destructors on them. Use `unsafe_deinit_pointee()` for that.

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

```mojo
@fieldwise_init
struct Balloon(Writable):
    var color: String

    def write_to(self, mut writer: Some[Writer]):
        writer.write(String("a ", self.color, " balloon"))

    def __deinit__(deinit self):
        print("Destroyed", String(self))
```

Source: <https://mojolang.org/docs/manual/lifecycle/death/>.

> **Pitfall:** `__deinit__()` takes `deinit self`; the pre-1.0 spelling was
> `__del__(owned self)`. See [`versions/1.0.0`](../versions/1.0.0.md).

## Pitfalls

- **Assuming `var` means "the original value".** `var` guarantees ownership of a
  value, which may be a copy unless you use `^`. Source:
  <https://mojolang.org/docs/manual/values/ownership/>.
- **Using a variable after `^`.** The transfer ends the original's lifetime; any
  later use is a compile error. Source:
  <https://mojolang.org/docs/manual/values/ownership/>.
- **Passing the same value as `mut` and also as another argument.** Argument
  exclusivity rejects it; copy first if you need both. Source:
  <https://mojolang.org/docs/manual/values/ownership/>.
- **Giving a `mut` argument a default.** Not allowed. Source:
  <https://mojolang.org/docs/manual/values/ownership/>.
- **Expecting destruction at end of scope.** Mojo destroys at last use (ASAP),
  which can be earlier than you expect — and inside an expression. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Assuming dropping a pointer destroys its pointees.** It does not; call the
  pointee's destructor explicitly. Source:
  <https://mojolang.org/docs/manual/lifecycle/death/>.
- **Forgetting that a reference extends the owner's lifetime.** Mojo keeps the
  owner alive while references exist; do not design around early destruction
  when you hold a reference. Source:
  <https://mojolang.org/docs/manual/values/ownership/>.

## Open questions

> **Open question:** the ownership page still writes the move constructor as
> `__init__(take=)` while the rest of the current docs use `deinit move`. This
> book uses `move`, per the 1.0.0 rename table.

> **Open question:** the lifecycle intro and creation pages still use `__del__()`
> in places while the destruction page uses `__deinit__()`. Treat the latter as
> current and the former as documentation lag.

## Sources

- Mojo manual — Intro to value ownership: <https://mojolang.org/docs/manual/values/>
- Mojo manual — Ownership: <https://mojolang.org/docs/manual/values/ownership/>
- Mojo manual — Lifetimes, origins, and references: <https://mojolang.org/docs/manual/values/lifetimes/>
- Mojo manual — Value semantics: <https://mojolang.org/docs/manual/values/value-semantics/>
- Mojo manual — Intro to value lifecycle: <https://mojolang.org/docs/manual/lifecycle/>
- Mojo manual — Value destruction: <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo manual — Value creation: <https://mojolang.org/docs/manual/lifecycle/life/>
