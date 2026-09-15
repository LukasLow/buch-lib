# is

`is` is the identity operator. It tests whether two values are the *same
object*, not whether they are equal. Its dominant use in Mojo is checking an
`Optional` against `None`.

## Purpose

The official keywords reference defines `is` in one line:

> `is` — Identity test

Source: <https://mojolang.org/docs/reference/keywords/>.

`is` is one of the five keyword operators: "Five operators are spelled as words
rather than symbols." Source:
<https://mojolang.org/docs/reference/keywords/>.

> Identity operators check whether two values refer to the same object, not just
> whether they are equal. The most common use is checking `Optional` values
> against `None`:

```mojo
var opt: Optional[Int] = None
if opt is None:
    print("No value")  # prints

opt = 42
if opt is not None:
    print("Has a value")  # prints
```

Source: <https://mojolang.org/docs/manual/operators/>.

## `is` versus `==`

The distinction is the whole point of the operator:

| Operator | Question it answers |
|----------|---------------------|
| `==` | Do the two values compare equal? |
| `is` | Are the two values the same object? |

The operator reference states it directly: "`is` tests object identity, not
equality." Source: <https://mojolang.org/docs/reference/operators/>.

The reference also names the standard-library types that implement it: "Stdlib
types that implement it include `ArcPointer`, `PythonObject`, and `Optional` (for
`is None` checks)." Source:
<https://mojolang.org/docs/reference/operators/>.

## `is` is type-defined

Like `in`, `is` dispatches to a method, and a type must opt in by implementing
it:

| Operator | Method | Trait | Default? |
|----------|--------|-------|----------|
| `is` | `__is__()` | `Identifiable` | No |
| `is not` | `__isnot__()` | `Identifiable` | Yes |

> `Identifiable` requires `__is__()`. `__isnot__()` is provided (calls
> `not (self is rhs)`).

Source: <https://mojolang.org/docs/reference/operators/>.

There is **no default** for `is`: a type that does not conform to `Identifiable`
(or otherwise implement `__is__()`) cannot be used with `is`. The negated form
`is not` does have a default, derived from `is`.

## Negation: `is not`

```mojo
opt = 42
if opt is not None:
    print("Has a value")
```

Source: <https://mojolang.org/docs/manual/operators/>.

`is not` is implemented as `not (self is rhs)`. Source:
<https://mojolang.org/docs/reference/operators/>.

## Precedence and chaining

| Precedence | Operators | Notes |
|------------|-----------|-------|
| 10 | `==` `!=` `<` `<=` `>` `>=` | Comparisons, chainable |
| 10 | `in` `not in` | Membership, chainable |
| 10 | `is` `is not` | Identity, chainable |
| 11 | `not` | Boolean NOT, prefix |

Source: <https://mojolang.org/docs/reference/operators/>.

Identity shares precedence with comparison and membership, and the three kinds
chain:

> Comparison, membership, and identity operators share the same precedence and
> chain together. `5 != a < b in c` is valid and evaluates as
> `(5 != a) and (a < b) and (b in c)`.

Source: <https://mojolang.org/docs/reference/operators/>.

The operators manual extends the same chain with `is`: `5 != a < b in c is d`
"evaluates as `(5 != a) and (a < b) and (b in c) and (c is d)`". Source:
<https://mojolang.org/docs/manual/operators/>.

Because `is` binds tighter than `not`, `not x is y` parses as `not (x is y)`;
write `x is not y` for the idiomatic negation.

## `is None` and `Optional`

The dominant use is the null check, and it appears throughout the official
documentation:

```mojo
while True:
    var item = get_next()
    if item is None:
        break       # Exit loop if no more items
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

You can also test `Optional` truthiness (`if opt:`) or call `value()`, but
`is None` is the explicit spelling:

> An `Optional` evaluates as `True` when it holds a value, `False` otherwise.
> ... calling `value()` on an `Optional` with no value results in undefined
> behavior, so you should always guard a call to `value()` inside a conditional
> that checks whether a value exists.

Source: <https://mojolang.org/docs/manual/types/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `None` | The value `is` is most often compared against. |
| `in` | Same precedence; chains with `is`. |
| `not` | `is not` is the negated identity spelling. |
| `and`, `or` | Looser; identity tests bind first. |
| `True`, `False` | The result type of an identity test is `Bool`. |
| `Optional` (type) | The type that makes `is` useful for null checks. |

## Signature vs. body

`is` never appears in a signature. It is an expression operator usable in bodies,
conditions, `comptime` expressions and `where` clauses, provided the operands'
types implement `__is__()`.

## Pitfalls

- **Using `is` to compare numbers or strings.** `is` is identity, not equality;
  use `==` (or `isclose()` for floats). A type without `__is__()` will not
  compile with `is` at all.
- **Assuming `is` works for every type.** `Identifiable` has no default
  conformance; only types that implement `__is__()` support it. Source:
  <https://mojolang.org/docs/reference/operators/>.
- **Calling `value()` without a check.** Reading an empty `Optional` is undefined
  behavior; guard with `is not None` or truthiness. Source:
  <https://mojolang.org/docs/manual/types/>.
- **`==` against `None`.** Prefer `is None` / `is not None`, which is the
  documented idiom and is what `Optional` implements.
- **Precedence with `not`.** `not a is b` groups as `not (a is b)`; write
  `a is not b` for clarity.
- **Chaining identity across unrelated types.** The chain evaluation short-
  circuits, but mixing `is` with comparisons in one expression is hard to read;
  split it into separate conditions.
- **`nan` and identity.** Identity is not equality, but note that `nan == nan` is
  `False`; do not substitute `is` for equality to work around float semantics.
  Source: <https://mojolang.org/docs/reference/numeric-types/>.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`None`](none.md), [`in`](in.md), [`not`](not.md),
[`True`](true.md), [`False`](false.md), [`and`](and.md),
[`operators`](../basics/operators.md),
[`optionals-and-nullability`](../types/optionals-and-nullability.md).
`reference/operators` (planned) stays a plain code span.

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo operator reference:
  <https://mojolang.org/docs/reference/operators/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Types (manual): <https://mojolang.org/docs/manual/types/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Mojo numeric types reference:
  <https://mojolang.org/docs/reference/numeric-types/>
