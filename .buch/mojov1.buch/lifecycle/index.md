# The value lifecycle

Mojo has no garbage collector and no reference counter. Instead, every value
follows a lifecycle defined by the struct it belongs to, and the compiler uses
that lifecycle to create, copy, move and destroy values deterministically.

> To be clear, Mojo has no reference counter and no garbage collector.

> Mojo also has no built-in data types with special privileges. All data types in
> the standard library (such as `Bool`, `Int`, and `String`) are implemented as
> structs.

Source: <https://mojolang.org/docs/manual/lifecycle/>.

This chapter makes that lifecycle explicit. It is an arc with three parts:

| Stage | Page | Question it answers |
|-------|------|---------------------|
| Life | [life](life.md) | When and how is a value created, copied or moved? |
| Initialization | [initialization](initialization.md) | When is an instance *usable*, and when are its fields just filled in? |
| Death | [death](death.md) | When and how is a value destroyed? |

## Lifecycles and lifetimes

Two terms that sound interchangeable but are not:

> - The "lifecycle" of a value is defined by various dunder methods in a struct.
>   Each lifecycle event is handled by a different method, such as the constructor
>   (`__init__()`), the destructor (`__deinit__()`), the copy constructor
>   (`__init__(copy=)`), and the move constructor (`__init__(take=)`). All values
>   that are declared with the same type have the same lifecycle.
> - The "lifetime" of a variable is defined by the span of time during program
>   execution in which the variable is considered valid. The life of a variable
>   begins when its value is initialized (via `__init__()`) and ends when the value
>   is destroyed (`__deinit__()`), or consumed in some other way (for example, as
>   part of a `__init__(take=)` call).

Source: <https://mojolang.org/docs/manual/lifecycle/>.

> No two values have the exact same lifetime, because every value is created and
> destroyed at a different point in time (even if the difference is
> imperceptible).

Source: <https://mojolang.org/docs/manual/lifecycle/>.

So the *lifecycle* is a property of the **type**; the *lifetime* is a property of
each **value**. The compiler tracks lifetimes with the lifetime checker and
origins — see [origin and borrowing](../memory/origin-and-borrowing.md).

> **Open question:** the lifecycle intro's own text writes `__del__()` and
> `__init__(take=)`, which are pre-1.0 spellings for the destructor and the move
> constructor. The 1.0.0 rename table gives the current forms as `__deinit__()`
> and `__init__(out self, *, deinit move: Self)`; the destruction page uses
> `__deinit__()` consistently. This book teaches `__deinit__`/`move` and treats
> the intro's spellings as documentation lag. See
> [`versions/1.0.0`](../versions/1.0.0.md).

## What the type author is responsible for

> In summary, it's the responsibility of the type author to manage the memory and
> resources for each value type, by implementing specific lifecycle methods, such
> as the constructor, copy constructor, move constructor, and destructor, as
> necessary. Mojo doesn't create any constructors by default, although it does
> add a trivial, no-op destructor for types that don't define their own.

Source: <https://mojolang.org/docs/manual/lifecycle/>.

That is the whole contract. The language supplies the framework — unique
ownership, ASAP destruction, the lifetime checker — and the type author supplies
the per-type methods that make the type play nicely with it.

## The destruction policy in one sentence

> The life of a value in Mojo begins when a variable is initialized and continues
> up until the value is last used, at which point Mojo destroys it. Mojo destroys
> every value/object as soon as it's no longer used, using an "as soon as
> possible" (ASAP) destruction policy that runs after every sub-expression.

Source: <https://mojolang.org/docs/manual/lifecycle/>.

This is the fact that surprises people most often, and it is covered in full on
[death](death.md): destruction is not at end of scope, it is at last use, and it
can happen in the middle of an expression.

## Where to go next

- [Life](life.md) — constructors, copy and move constructors, field-wise
  initialization and implicit conversion.
- [Initialization](initialization.md) — the logical/field-wise distinction, the
  deep dive.
- [Death](death.md) — `__deinit__`, ASAP destruction, `Deinitable`,
  `@explicit_destroy`, field lifetimes.
- [Ownership and lifetimes](../memory/ownership-and-lifetimes.md) — the rules that
  make the lifecycle safe.
- [Value semantics](../memory/value-semantics.md) — why copies are the default,
  and what the compiler does not enforce.

## Sources

- Mojo manual — Intro to value lifecycle: <https://mojolang.org/docs/manual/lifecycle/>
- Mojo manual — Value creation: <https://mojolang.org/docs/manual/lifecycle/life/>
- Mojo manual — Deep dive — Instance initialization: <https://mojolang.org/docs/manual/lifecycle/initialization/>
- Mojo manual — Value destruction: <https://mojolang.org/docs/manual/lifecycle/death/>
- Mojo manual — Ownership: <https://mojolang.org/docs/manual/values/ownership/>
