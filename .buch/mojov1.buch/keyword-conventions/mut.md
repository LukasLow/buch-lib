# mut

`mut` is an **argument convention**: it declares that a function receives a
*mutable reference* to an existing value. Changes the function makes through a
`mut` argument are visible to the caller.

`mut` is **not a reserved keyword**. It has fixed meaning only at the start of
an argument declaration (or in a closure capture list). See
[the chapter index](index.md) for the official wording.

## What it means

The official definition:

> Mutable reference to an existing value

Source: <https://mojolang.org/docs/reference/keywords/>.

The manual gives the mnemonic:

> You can think of `mut` like this: it means any changes to the value *in*side
> the function are visible *out*side the function.

And explains why it exists: `mut` is an optimized replacement for the
copy-and-return pattern, because it does not copy the value.

```mojo
def double_it(mut x: Int):
    x *= 2

def main():
    var n = 21
    double_it(n)
    print(n)   # 42
```

Source: <https://mojolang.org/docs/manual/values/ownership/>.

The same rule applies to collections — mutating a `mut` list mutates the
caller's list in place:

```mojo
def print_list(list: List[Int]):
    print(list.__str__())

def mutate(mut l: List[Int]):
    l.append(5)

def main():
    var values = [1, 2, 3, 4]
    mutate(values)
    print_list(values)   # [1, 2, 3, 4, 5]
```

Source: <https://mojolang.org/docs/manual/values/ownership/>.

## The argument must already be mutable

`mut` cannot manufacture mutability. Passing something that is only available
as an immutable reference into a `mut` argument is an error:

> However, remember that the values passed as `mut` must already be mutable. For
> example, if you try to take an immutable reference and pass it to another
> function as `mut`, you'll get a compiler error because Mojo can't form a
> mutable reference from an immutable reference.

Source: <https://mojolang.org/docs/manual/values/ownership/>.

A local `var` is mutable, so the common case works. A function parameter that
arrived as a bare (immutable-reference) argument is not mutable:

```mojo
def takes_mut(mut x: Int):
    x += 1

def passes_imm(x: Int):     # bare `x` is an immutable reference
    takes_mut(x)            # Error: cannot form a mutable reference
```

## Argument exclusivity

A mutable reference may not alias any other reference to the same value. Mojo
enforces this:

> Mojo enforces *argument exclusivity* for mutable references. This means that
> if a function receives a mutable reference to a value (such as an `mut`
> argument), it can't receive any other references to the same value—mutable or
> immutable.

This is a correctness rule, not a mere optimization: without it, a function
that both reads and mutates the same value would produce surprising results.

```mojo
def append_twice(mut s: String, other: String):
   s += other
   s += other

def invalid_access():
  var my_string = "o"
  # error: passing `my_string` mut is invalid since it's also passed
  # as an immutable reference
  append_twice(my_string, my_string)
```

Source: <https://mojolang.org/docs/manual/values/ownership/>.

The workaround is to make a copy of one argument so the two references are
distinct. Trivial register-passable types such as `Int` and `Bool` are exempt,
because they are always passed by copy. Source:
<https://mojolang.org/docs/manual/values/ownership/>.

## `mut` arguments cannot have defaults

The official reference states the restriction with its diagnostic:

```mojo
# Error because 'mut' arguments may not have defaults
def wrong(mut x: Int = 0):
    pass
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

If a caller must be able to omit the argument, use a `var` argument (owned copy,
defaults allowed) or a plain immutable reference with a default.

## `mut` on `self`

`mut self` is how a method declares that it modifies the instance. The default
`self` is an immutable reference, so without `mut` a mutation is an error:

```mojo
struct CountingTool:
    var value: Int

    def __init__(out self):
        self.value = 0

    def increment(mut self):      # mut: modifies self in place
        self.value += 1
```

Source: <https://mojolang.org/docs/reference/keywords/>.

You cannot overload a method on the `self` convention alone in the naive way —
and 1.0 explicitly rejects overloads that differ only in an argument convention:

> Mojo now rejects function overloads that differ only in argument convention
> (`imm` vs `mut`), as the compiler doesn't allow resolving overloads based on
> this.

Source: <https://mojolang.org/releases/v1.0.0/>. Distinguish overloads by
argument type or shape instead.

## `mut` captures in closures

`mut` is also a closure *capture convention*: a `{mut name}` capture lets the
closure modify the outer binding, and the change is visible outside.

```mojo
def main():
    var total = 0

    def accumulate(x: Int) {mut total}:
        total += x

    accumulate(10)
    accumulate(20)
    print(total)  # 30
```

Source: <https://mojolang.org/docs/manual/functions/closures/>.

`{mut}` with no name applies a mutable-reference capture to every free
variable in the body. Source:
<https://mojolang.org/docs/manual/functions/closures/>.

## Relationship to `inout`

The pre-1.0 convention name `inout` was replaced by `mut`. Source:
<https://mojolang.org/releases/v1.0.0/>. Never write `inout` in 1.x code; the
rename table is in [`versions/1.0.0`](../versions/1.0.0.md).

## Pitfalls

- **Passing an immutable reference as `mut`.** Mojo cannot form a mutable
  reference from an immutable one; the call fails to compile. Verified above.
- **Aliasing a `mut` argument.** Passing the same value to a `mut` and any
  other reference argument is rejected by argument exclusivity. Verified above.
- **Giving a `mut` argument a default.** `mut` arguments may not have defaults.
  Verified above.
- **Forgetting `mut self`.** A method that mutates the instance without `mut
  self` is a compile error. Verified above.
- **Overloading on convention.** Overloads that differ only in `imm` vs `mut`
  are rejected in 1.0. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Writing `inout`.** It is a pre-1.0 spelling; use `mut`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Treating `mut` as reserved.** It is not on the keyword list; `var mut = 2`
  in an ordinary position is legal. Source:
  <https://mojolang.org/docs/reference/keywords/>.

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Ownership (manual): <https://mojolang.org/docs/manual/values/ownership/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Closures (manual): <https://mojolang.org/docs/manual/functions/closures/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
