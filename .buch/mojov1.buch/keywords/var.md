# var

`var` declares a scoped, mutable variable that owns its value. It is the
declaration keyword for locals, for struct fields, and — in function signatures —
an argument convention that takes ownership of a copy.

## Purpose

The official keywords reference defines `var` in one line:

> `var` — Scoped variable binding

Source: <https://mojolang.org/docs/reference/keywords/>.

The keywords reference also lists `var` as a **convention** — "Argument or
variable: Independent mutable owned copy of the value" — and notes that `var` and
`ref` "also appear in variable declarations, where `var` creates a scoped
mutable variable and `ref` creates a scoped reference binding". Source:
<https://mojolang.org/docs/reference/keywords/>.

## `var` as a declaration

```mojo
var greeting: String = "Hello World"
```

> A `var` declaration does three things:
>
> - It declares a logical storage location, which is tied to a particular type.
> - It binds the name `greeting` to this logical storage location.
> - It *initializes* the storage space with a newly created `String` value...
>   The new value is *owned by* the variable.

Source: <https://mojolang.org/docs/manual/variables/>.

The simple-statements reference gives the three legal shapes and the illegal
one:

```mojo
var x        # Error: declaration must have either a type or an initializer
var x: Int   # OK: type provided, value uninitialized
var x = 42   # OK: type inferred from initializer
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

A variable's type never changes:

```mojo
var count = 8 # count is type Int
count = "Nine?" # Error: can't implicitly convert 'StringLiteral' to 'Int'
```

Source: <https://mojolang.org/docs/manual/variables/>.

A variable is scoped to its enclosing block:

> A variable is scoped to the block in which it is declared. Its value is
> destroyed at last use.

Source: <https://mojolang.org/docs/manual/variables/>.

## Multiple and destructuring assignment

> Assign the same value to multiple names. This is right-associative. `z` is
> assigned first, then `y`, then `x`. If the RHS has side effects, they run once:

```mojo
var x = var y = var z = "Hello"
print(x, y, z) # Hello Hello Hello

# Mixing conventions
ref a = var b = var c = "Hello"
```

```mojo
var a, b = 1, 2          # Destructuring assignment
var (c, d) = (1, 2)      # Equivalent destructuring
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

Simple swaps are also legal:

```mojo
var a, b, c = 1, 2, 3
a, b, c = c, a, b
print(a, b, c)  # 3 1 2
```

Source: <https://mojolang.org/docs/reference/simple-statements/>.

## `var` is required — implicit declarations are deprecated

Since 1.0, every first assignment to a name should be spelled with `var`:

```mojo
x = 0  # implicit declaration of 'x' is deprecated; add 'var' before the name
var x = 0  # Fixed; no warning
```

> Every first assignment to a name warns, `:=` walrus targets and a bare `x: T`
> annotation included. Binding forms that already spell out how they bind are
> unaffected: `for` targets, `with ... as`, `except ... as`, comprehension
> targets, and the `_` discard.

Source: <https://mojolang.org/releases/v1.0.0/>.

## `var` as a struct field

Every struct field must be declared with `var` and a type annotation:

```mojo
struct MyStruct:
    value: Int # Error. Missing `var` keyword
    var count: Int # Yes
```

> Unlike local variables in functions, this requirement lets Mojo reason about a
> struct's layout and guarantees that its memory is safe and predictable.

Source: <https://mojolang.org/docs/manual/structs/>.

## `var` as an argument convention (signature use)

In a signature, `var` before an argument name means the function receives an
owned value:

> `var`: The function takes **ownership** of a value. ... The caller might choose
> to transfer ownership of an existing value to this function, but that's not
> always what happens. The callee might receive a newly-created value, or a copy
> of an existing value.

Source: <https://mojolang.org/docs/manual/values/ownership/>.

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

There are three ways the callee gets ownership:

> - **Value transfer**: The caller uses the `^` transfer sigil. ... The function
>   argument receives ownership.
> - **Copying**: Without the transfer sigil, Mojo copies the value. If the type
>   isn't `Copyable`, this produces a compile-time error.
> - **Newly created value**: The caller passes a newly created value, such as the
>   result of a function call.

Source: <https://mojolang.org/docs/manual/values/ownership/>.

Because the value is owned, it is destroyed when the function exits unless it is
transferred onward:

> Regardless of how it receives the value, when the function declares an argument
> as `var`, it's certain that it has unique mutable access to that value. Because
> the value is owned, the value is destroyed when the function exits—unless the
> function transfers the value elsewhere.

Source: <https://mojolang.org/docs/manual/values/ownership/>.

## `var` as a loop binding

The `for` statement accepts `var` on the loop target to create a mutable copy of
each element:

```mojo
var list: List[String] = ["a", "b", "c", "d"]

for var item in list:
    item = item + "x" # works. item is mutable copy of list element
print(list) # unchanged
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

## `var **kwargs`

Variadic keyword arguments require the `var` convention, and the bare form is an
error in 1.x:

```mojo
def print_nicely(var **kwargs: Int):
    for item in kwargs.items():
        print(item.key, "=", item.value)
```

> A bare `**kwargs` is now an error; write `var **kwargs` (a fix-it inserts it)
> in function declarations and function types alike.

Source: <https://mojolang.org/releases/v1.0.0/>.

Other conventions are not supported for `**kwargs`:

> Variadic keyword arguments must be declared with the `var` argument convention
> ... no other convention is supported.

Source: <https://mojolang.org/docs/manual/functions/>.

## `var` is not `let` or `const`

> All variables in Mojo are mutable by default. Their value can change. If you
> want to define a constant value that can't change at runtime, see the
> `comptime` keyword or pass the value as a non-mutable function argument.

Source: <https://mojolang.org/docs/manual/variables/>.

There is no `let` in Mojo 1.x. Immutability comes from `comptime` (compile-time
constants) or from an immutable reference (the default argument convention).

## `var` versus `ref`

Both are declaration keywords, but they bind differently:

- `var` creates an **owned** value. Assignment copies or transfers, and the name
  owns the result.
- `ref` creates a **reference** to an existing value. No copy is made, and writes
  go to the referenced storage.

```mojo
var item = items[1]      # item is a copy
ref item_ref = items[1]  # item_ref references the element
```

Source: <https://mojolang.org/docs/manual/variables/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `ref` | The reference binding; the other declaration keyword. |
| `comptime` | The compile-time constant declaration; the immutable counterpart. |
| `struct` | Fields must be declared with `var` plus a type. |
| `for` | `for var x in …` binds a mutable copy per iteration. |
| `lambda` | `var` is a valid lambda argument and capture convention. |
| `def` | Declares the signatures in which `var` is an argument convention. |

## Signature vs. body

`var` appears in **both** positions:

- In a **body** (and at module scope) it is a declaration statement creating a
  variable, or a `for`/comprehension binding.
- In a **signature** it is an argument convention (owned value) — and it is on
  both lists, keyword and convention. Source:
  <https://mojolang.org/docs/reference/keywords/>.

## Pitfalls

- **Omitting `var` on a declaration.** Deprecated in 1.0 and warns with a fix-it;
  write `var` from the start. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **`var x` with neither type nor initializer.** An error: "declaration must have
  either a type or an initializer". Source:
  <https://mojolang.org/docs/reference/simple-statements/>.
- **Assuming `var` is immutable.** It is not; use `comptime` for constants.
  Source: <https://mojolang.org/docs/manual/variables/>.
- **Reassigning a different type.** A variable's type is fixed.
- **A `var` argument without a copyable type.** Without `^`, the call needs a
  copy; a non-`Copyable` argument then fails to compile. Source:
  <https://mojolang.org/docs/manual/values/ownership/>.
- **Using a variable after a transfer.** `consume(x^)` leaves `x` uninitialized;
  reading it is an error until it is reassigned. Source:
  <https://mojolang.org/docs/manual/values/ownership/>.
- **Bare `**kwargs`.** An error in 1.x; spell it `var **kwargs`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **`var` field defaults.** Fields cannot be initialized at declaration; use
  `__init__` or `@fieldwise_init`. Source:
  <https://mojolang.org/docs/manual/structs/>.
- **`mut` arguments and defaults.** `mut` arguments cannot have default values;
  `var` arguments can.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`ref`](ref.md), [`comptime`](comptime.md), [`struct`](struct.md),
[`for`](for.md), [`imm`](../keyword-conventions/imm.md),
[`variables-and-mutability`](../basics/variables-and-mutability.md),
[`value-semantics`](../memory/value-semantics.md),
[`ownership-and-lifetimes`](../memory/ownership-and-lifetimes.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo simple statements reference:
  <https://mojolang.org/docs/reference/simple-statements/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Variables (manual): <https://mojolang.org/docs/manual/variables/>
- Ownership (manual): <https://mojolang.org/docs/manual/values/ownership/>
- Structs (manual): <https://mojolang.org/docs/manual/structs/>
- Functions (manual): <https://mojolang.org/docs/manual/functions/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
