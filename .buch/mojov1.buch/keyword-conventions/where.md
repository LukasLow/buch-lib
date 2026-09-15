# where

`where` introduces a **constraint clause** at the end of a declaration. It
constrains compile-time parameters and gates conditional conformance. It appears
after the return type (or after the argument list when there is no return type).

`where` is **not a reserved keyword**. It is not in the official keyword
tables; the keywords reference describes it at the end of the *Conventions*
section, because it "has fixed meaning in declarations". See
[the chapter index](index.md).

## What it means

The official sentence:

> `where` introduces a constraint clause at the end of a declaration:

Source: <https://mojolang.org/docs/reference/keywords/>.

The function-declarations reference gives its exact position and purpose:

> A `where` clause constrains compile-time parameters. It appears at the end of
> the declaration, after the return type (or after the argument list if there's
> no return type):

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## A basic `where` clause

The official example:

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

Source: <https://mojolang.org/docs/reference/function-declarations/>.

The clause restricts which types `compare()` can be instantiated with: only
types that conform to `Comparable`.

## Position rules

`where` belongs at the **end** of a declaration. Two placements are invalid in
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

The second error is the important conceptual one: a `where` clause constrains
*compile-time* values (parameters), not run-time arguments. A run-time condition
belongs in the body as an ordinary `if` or in an `assert`.

The 1.0 release notes record the parameter-list form as removed:

> `where` clauses inside a parameter list (for example, `[x: Int where x > 0]`)
> are no longer supported, following a period of deprecation. Use a trailing
> `where` clause after the signature instead, as in `def foo[x: Int]() where x > 0:`.

Source: <https://mojolang.org/releases/v1.0.0/>.

## Complex constraints

A `where` clause can hold a compound expression:

```mojo
def process[
    n: Int,
](data: SIMD[DType.float32, n]) -> Float32 where (
    n == 1 or n == 2 or n == 4 or n == 8 or n == 16 or n == 32
):
    var sum: Float32 = 0.0
    for i in range(n):
        sum += data[i]
    return sum
```

Source: <https://mojolang.org/docs/reference/function-declarations/>.

## `where` with a diagnostic message

Since 1.0, a `where` clause accepts an optional string-literal message that the
compiler reports when the constraint fails:

```mojo
def foo[sc: Int]() where (sc > 1, "scaling factor must be greater than 1"):
    ...
```

Source: <https://mojolang.org/releases/v1.0.0/>.

The message form is supported everywhere a `where` clause is allowed: trailing
function and struct constraints, struct conditional-conformance clauses, and
`alias`/`comptime` declarations. Source:
<https://mojolang.org/releases/v1.0.0/>.

## `where` in conditional conformance

The same clause gates trait conformance on a struct, so a type conforms to a
trait only when its parameters do:

```mojo
@fieldwise_init
struct Pair[T: Copyable & Deinitable](
    Equatable where conforms_to(T, Equatable),
    Writable where conforms_to(T, Writable),
    Copyable
):
    var first: Self.T
    var second: Self.T
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

The condition may use trait conformance or any compile-time value that can be
resolved at compile time, for instance a platform check:

```mojo
@fieldwise_init
struct Mathematical(
    GPUComputable where is_gpu()
):
    # conforms only on GPU targets
```

Source: <https://mojolang.org/docs/reference/struct-declarations/>.

## `where` and custom `self` types

In 1.0 a method's `self` must have type `Self`. A custom `self` type is
expressed as a `where` clause instead:

```mojo
struct Foo[T: AnyType]:
    # ERROR: def foo(self: Foo[Int]):
    def foo(self) where Self.T == Int:
        ...
```

Source: <https://mojolang.org/releases/v1.0.0/>.

## `where` with type equality

1.0 added `==` and `!=` for type equality, usable in a `where` clause:

```mojo
comptime Storage = Int if cond else NoneType
```

Source: <https://mojolang.org/releases/v1.0.0/>.

## Pitfalls

- **Putting `where` inside the parameter list.** `def f[x: Int where x > 0]()`
  no longer compiles; move the clause after the signature. Verified above.
- **Constraining a run-time argument with `where`.** `where` only applies to
  compile-time parameters; a run-time condition is an ordinary `if`. Verified
  above.
- **Assuming `where` can gate anything.** Conditional conformance must depend
  only on compile-time information, and can't depend on a computed compile-time
  member (that would create a circular dependency). Source:
  <https://mojolang.org/docs/reference/struct-declarations/>.
- **Forgetting the return type's position.** The clause goes after `-> T`; if
  there is no return type, it goes after the argument list. Verified above.
- **Treating `where` as reserved.** It is not on the keyword list. Source:
  <https://mojolang.org/docs/reference/keywords/>.

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo function declarations reference:
  <https://mojolang.org/docs/reference/function-declarations/>
- Mojo struct declarations reference:
  <https://mojolang.org/docs/reference/struct-declarations/>
- Mojo v1.0.0 release notes (`where` message form, trailing position, type
  equality, `self` clause): <https://mojolang.org/releases/v1.0.0/>
