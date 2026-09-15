# imm

`imm` is an **argument convention**: it declares that a function receives an
*immutable reference* to an existing value. It is the explicit spelling of the
default convention — an argument written without any convention behaves exactly
like an `imm` argument.

`imm` is **not a reserved keyword**. It has fixed meaning only at the start of
an argument declaration (or in a closure capture list). See
[the chapter index](index.md) for the official wording.

## What it means

The official reference defines it as the default argument behaviour:

> Immutable reference to an existing value (default behavior)

Source: <https://mojolang.org/docs/reference/keywords/>.

The manual explains the *reason* the default is an immutable reference: it is
the efficient choice for values that are expensive to copy.

> The default convention is an immutable read-only reference. The callee
> receives an immutable reference to the argument value.

> In general, passing an immutable reference is much more efficient when
> handling large or expensive-to-copy values, because the copy constructor and
> destructor aren't invoked for a default (immutable reference) argument.

Source: <https://mojolang.org/docs/manual/values/ownership/>.

The important consequence: the function sees the caller's value, not a copy.
Reading is allowed; mutation is not.

## Explicit `imm`

Writing the convention out is optional, but legal, and makes the read-only
intent visible:

```mojo
def show(imm value: Int):
    print(value)

def main():
    var n = 42
    show(n)     # 42
```

`imm value: Int` and `value: Int` are the same convention. The reference lists
`imm` in parentheses `(imm)` precisely because it is what you get when you
write nothing.

Reading a large value without copying is the point:

```mojo
def total(values: List[Int]) -> Int:
    var sum = 0
    for v in values:
        sum += v
    return sum

def main():
    var data: List[Int] = [1, 2, 3, 4]
    print(total(data))   # 10; `data` is borrowed, never copied
    print(data)          # [1, 2, 3, 4]
```

Source for the borrowed list pattern: <https://mojolang.org/docs/manual/values/ownership/>.

## `imm` on `self`

A method's `self` argument follows the same rule. A bare `self` is an immutable
reference, so mutating it is a compile error:

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

A `self` that only reads needs no annotation; add `mut` (or `out`/`deinit`) when
the method must change or consume the instance.

## `imm` captures in closures

`imm` is also the default *capture convention* for closures. A closure whose
capture list names no convention captures by immutable reference, and the
closure observes the outer binding's current value at each call:

```mojo
def main():
    var limit = 10

    def check(x: Int) {imm limit} -> Bool:
        return x < limit

    print(check(5))   # True
    limit = 3
    print(check(5))   # False  (sees the updated limit)
```

Source: <https://mojolang.org/docs/manual/functions/closures/>.

`{imm}` with no name applies the immutable-reference capture to every free
variable in the body. A bare name in a capture list also defaults to `imm`, so
`{x}` means `{imm x}`. Source:
<https://mojolang.org/docs/manual/functions/closures/>.

## `imm` replaced `read`

Older Mojo code writes `read` for the same convention. In 1.x the preferred
spelling is `imm`:

> `imm` is now the preferred spelling for the `read` argument and
> closure-capture convention. `read` still works but will soon be deprecated.

Source: <https://mojolang.org/releases/v1.0.0/>.

Write `imm`. The old→new mapping is recorded in
[`versions/1.0.0`](../versions/1.0.0.md); the old spelling is not taught as
valid 1.x syntax anywhere in this book.

## Relationship to `borrowed`

The rename chain is two separate moves, and conflating them is wrong:

1. The legacy argument conventions `borrowed`, `inout` and `owned` were replaced
   by today's convention set — `imm`, `mut`, `out`, `deinit`, `var` and `ref`.
   `borrowed` (immutable reference) maps to `imm`, `inout` (mutable reference)
   to `mut`, and `owned` (owned value) to `var`.
2. Separately, in 1.0 the argument-and-closure-capture convention `read` was
   renamed to `imm`: "`imm` is now the preferred spelling for the `read`
   argument and closure-capture convention."

So `borrowed` → `imm` and `read` → `imm` are **different renames with different
origins**, not one chain. Sources: <https://mojolang.org/releases/v1.0.0/>
(`read` → `imm`) and the pre-1.0 convention set
([`versions/1.0.0`](../versions/1.0.0.md)). Never write `borrowed`, `inout`,
`owned` or `read` in 1.x code; see
[`versions/1.0.0`](../versions/1.0.0.md) for the full rename table.

## Pitfalls

- **Assuming the default is a copy.** It is a reference. Mutating the parameter
  is an error, and the caller's value is never duplicated. Verified above.
- **Forgetting `mut` on `self`.** `self.value += 1` in a method declared with a
  bare `self` fails to compile. Add `mut self`. Verified above.
- **Writing `read` or `borrowed`.** Both are pre-1.0 spellings. Use `imm`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Treating `imm` as reserved.** It is not on the keyword list; `var imm = 1`
  in an ordinary position is legal. Source:
  <https://mojolang.org/docs/reference/keywords/>.
- **Expecting `imm` to keep a value alive forever.** An immutable reference is
  still checked by the lifetime checker: it may not outlive the value it borrows.
  Source: <https://mojolang.org/docs/manual/values/ownership/>.
- **Passing an immutable reference where `mut` is required.** Mojo cannot form
  a mutable reference from an immutable one; the call is a compile error.
  Source: <https://mojolang.org/docs/manual/values/ownership/>.

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Ownership (manual): <https://mojolang.org/docs/manual/values/ownership/>
- Closures (manual): <https://mojolang.org/docs/manual/functions/closures/>
- Mojo v1.0.0 release notes (`read` → `imm`):
  <https://mojolang.org/releases/v1.0.0/>
