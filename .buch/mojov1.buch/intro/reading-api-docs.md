# Reading API docs and signatures

This page exists so that any Mojo signature you meet in this buch — or in the
official standard-library reference — can be read correctly. Mojo signatures are
compact on purpose: they encode compile-time parameters, runtime arguments,
ownership, mutability and calling conventions in one line. Read them wrong and
you will call functions wrong.

The primary source is the official page
[How to read the standard library API documentation](https://mojolang.org/docs/api-docs/).

## The two words have distinct meanings

Most languages use *parameter* and *argument* interchangeably. Mojo does not:

> "**Parameter** refers to compile-time entities. **Argument** refers to runtime
> values and references."
> — [api-docs](https://mojolang.org/docs/api-docs/)

That single distinction explains the bracket/parenthesis layout:

> "In declarations, compile-time parameters appear in square brackets (`[]`),
> followed by runtime arguments in parentheses (`()`)."

So in `def foo[T: AnyType](x: T) -> T:`, `T` is a **parameter** (compile time)
and `x` is an **argument** (runtime). The official rationale: "Mojo uses one
language for both compile-time and runtime programming, rather than separating
them into a language plus a macro or template system."

**Practical reading rule:** brackets bind the generic/compile-time part of a
call; parentheses carry the runtime values. In a call, `foo[Int](3)` passes
`Int` as a parameter and `3` as an argument.

## `Self` (capital) vs `self` (lowercase)

Both appear in signatures and mean different things:

> "`Self` (capital S) is a keyword that refers to an enclosing struct or, when
> used in a trait definition, the type that implements the trait."
>
> "`self` (lowercase) refers to an instance of the enclosing type. Instance
> methods declare `self` as their first argument. Callers do not pass it
> explicitly."
> — [api-docs](https://mojolang.org/docs/api-docs/)

Two more facts from the same page:

- Inside a type or trait definition, `Self.` identifies compile-time parameters
  and other `comptime` declarations. For example, `Self.T` refers to the
  parameter `T` defined by the enclosing type.
- Static methods do not have a `self` argument.

So when a signature shows `def append(mut self, codepoint: Codepoint)`, you call
it as `instance.append(cp)` — the receiver is implicit.

## Argument conventions: the words before argument names

Argument conventions "describe the contract between caller and callee". They
indicate both **ownership** (`var`, `ref`, unmarked) and **what the function may
do with an argument** (`mut`, `out`, `deinit`).

| Convention | Meaning (official wording, abridged) | Example |
|------------|--------------------------------------|---------|
| *(unmarked)* | "A reference to an existing value with read-only `imm` access." | `def abs[T: Absable](value: T) -> T` |
| `mut` | "A reference to an existing value. The function can modify the value if it is mutable." | `def append(mut self, codepoint: Codepoint)` |
| `ref` | "A reference to an existing value. The function inherits the value's mutability." | `def __getitem__(ref self, idx: Int)` |
| `var` | "The function owns its own value. The caller keeps the original unless ownership is transferred." | `def insert(mut self, var key: Self.K, var value: Self.V)` |
| `out` | "An uninitialized slot that the function must initialize before it returns. Used for type initialization." | `def __init__(out self, *, capacity: Int)` |
| `deinit` | "The function takes ownership and destroys the value." | `def __deinit__(deinit self)` |

Source: [api-docs](https://mojolang.org/docs/api-docs/).

**Pitfall:** the unmarked convention is read-only `imm` access, not "copy". A
plain `value: T` in a signature borrows; it does not imply ownership, and using
it does not copy. When you need ownership, the signature will say `var`.

**Pitfall:** `ref` preserves the caller's mutability rather than forcing one.
A `ref self` method works on both mutable and immutable receivers, whereas
`mut self` requires a mutable receiver.

## The three markers in parameter and argument lists

"Three markers divide parameter and argument lists into zones that control how
callers pass values":

| Marker | Arguments | Parameters |
|--------|-----------|------------|
| `//` | No | Infer-only |
| `/` | Positional-only | Positional-only |
| `*` | Keyword-only | Keyword-only |

Rules from the same table's prose:

- `//` separates infer-only parameters from named parameters.
- "Everything before `/` is positional-only. Callers must pass these values by
  position, not by name."
- "Everything after `*` is keyword-only. Callers must pass these values by
  name."

Source: [api-docs](https://mojolang.org/docs/api-docs/).

### Reading `[T: Movable, //, A: Allocator = DefaultAllocator]`

- `T: Movable` — a parameter with a trait bound.
- `//` — everything before it is **infer-only**. You cannot pass `T=...` by name;
  the compiler infers it. This is why the stability page's `List[Int, ...]` trap
  matters: `...` unbinds whatever follows.
- `A: Allocator = DefaultAllocator` — a named parameter with a default.

### Reading `def insert(mut self, *, key: K, value: V)`

- `mut self` — mutating receiver, implicit at the call site.
- `*` — everything after it is **keyword-only**, so the call must be
  `d.insert(key=..., value=...)`.

## Variadics: why some types are prefixed with `*`

From the api-docs page:

- "`*` before the argument name accepts any number of positional arguments of
  the same type."
- "`*` before both the name and the type annotation creates a *variadic pack*
  that accepts arguments of different types (heterogeneous arguments)."

Compare:

- `*args: Int` — homogeneous variadic: many `Int`s.
- `*args: *Ts` — variadic **pack**: each element may have its own type listed in
  the pack parameter `Ts`.

## `def` used as a type

Function pointers and closures have their own type syntax:

> "The simplest is `def()`, a function with no arguments and no return value.
> When used as a type, `def` specifies argument and return types but not
> argument names. For example, `def(Int, Int) -> Int` is a function that takes
> two `Int` arguments and returns an `Int`."
> — [api-docs](https://mojolang.org/docs/api-docs/)

So whenever `def(...)` appears in an argument position, it is a function type,
not a declaration.

## Parameter naming conventions

The docs describe the conventions used across the reference:

- **Type parameters** use PascalCase — short (`T`, `E`) or descriptive
  (`ErrorType`, `Element`). By convention `T`, `U`, `V` are general types; `K`/`V`
  for key-value pairs; `E` for errors; `H` for hashers.
- **Value parameters** use lower_snake_case and should be descriptive
  (`capacity`, `hasher`, `tile_x`).

This is why `T` in a signature means "some general type" and `H` means a hasher:
the names carry meaning.

## How to tell stable from unstable

A signature alone does not tell you whether an API is stable — the stability
model does. The mechanics:

- The standard library is **unstable by default**: "We consider standard library
  APIs unstable unless specifically marked stable" ([stability](https://mojolang.org/docs/api-docs/stability/)).
- The marker is `@stable(since="<version>")` in source, and in the rendered API
  reference it appears as a "Stable since *version*" label under a struct/trait
  name, or a *version* badge in the right margin for other members.
- A stable **struct** guarantees only its signature, not its members: "Marking a
  struct stable means that the struct's *signature* is stable. It **doesn't**
  guarantee that any member APIs are stable."

So the reading procedure is: check the member's own badge, not just the
containing type's. Full details are on the [stability](stability.md) page.

## A worked example

Taken together, a signature like:

```mojo
def __init__(out self, *, capacity: Int = 0)
```

reads as:

- `__init__` — a constructor, so the `self` is implicit and `out`-initialized.
- `out self` — an uninitialized slot the function must initialize before it
  returns.
- `*` — everything after is keyword-only.
- `capacity: Int = 0` — a keyword-only runtime argument with a default.

A call therefore looks like `T(capacity=8)`, not `T(8)`.

## Sources

- https://mojolang.org/docs/api-docs/
- https://mojolang.org/docs/api-docs/stability/
