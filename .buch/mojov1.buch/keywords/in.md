# in

`in` is the membership operator. It tests whether a container, string, or other
collection contains a value, and it is also the separator in a `for` loop header.

## Purpose

The official keywords reference defines `in` in one line:

> `in` — Membership test

Source: <https://mojolang.org/docs/reference/keywords/>.

`in` is one of the five keyword operators: "Five operators are spelled as words
rather than symbols." Source:
<https://mojolang.org/docs/reference/keywords/>.

> The `in` operator checks whether a collection contains a value.

Source: <https://mojolang.org/docs/manual/operators/>.

```mojo
var colors = ["red", "green", "blue"]
print("red" in colors)         # True
print("yellow" not in colors)  # True
```

> It also works with strings to check for substrings:

```mojo
var food = "peanut butter"
if "nut" in food:
    print("Contains a nut")  # prints
```

Source: <https://mojolang.org/docs/manual/operators/>.

## `in` is container-defined

`in` is not a fixed language operation; it dispatches to a method on the
**container**, with the searched value as the argument:

> `x in collection` calls `collection.__contains__(x)`. The method is on the
> **container**, not the element. `not in` calls the same method and negates the
> result.

Source: <https://mojolang.org/docs/reference/operators/>.

The operator reference lists the operator-to-method mapping:

| Operator | Method | Trait | Default? |
|----------|--------|-------|----------|
| `in` | `__contains__()` | — | No |
| `not in` | `__contains__()` | — | No |

Source: <https://mojolang.org/docs/reference/operators/>.

So any type can support `in` by implementing `__contains__()`. There is no
`Contains` trait listed in the operator reference — the mapping is by method
name.

## Negation: `not in`

The negated spelling is a single operator at comparison precedence:

```mojo
print("yellow" not in colors)  # True
```

Source: <https://mojolang.org/docs/manual/operators/>.

The operator reference lists `in` and `not in` together in the precedence table
at precedence 10, "Membership, chainable". Source:
<https://mojolang.org/docs/reference/operators/>.

## Precedence and chaining

From the operator reference (higher binds tighter):

| Precedence | Operators | Notes |
|------------|-----------|-------|
| 10 | `==` `!=` `<` `<=` `>` `>=` | Comparisons, chainable |
| 10 | `in` `not in` | Membership, chainable |
| 10 | `is` `is not` | Identity, chainable |
| 11 | `not` | Boolean NOT, prefix |

Source: <https://mojolang.org/docs/reference/operators/>.

Membership shares precedence with comparison and identity operators, and the
three kinds **chain together**:

> Comparison, membership, and identity operators share the same precedence and
> chain together. `5 != a < b in c` is valid and evaluates as
> `(5 != a) and (a < b) and (b in c)`.

Source: <https://mojolang.org/docs/reference/operators/>.

The operators manual gives the same rule with the longer hypothetical chain
`5 != a < b in c is d`, and notes that "Each intermediate value is evaluated
once." Source: <https://mojolang.org/docs/manual/operators/>.

Because `in` binds tighter than `not`, the negation `not x in y` parses as
`not (x in y)` — but the idiomatic spelling remains `x not in y`.

## `in` in the `for` header

The same token separates the loop target from the iterable:

```mojo
for item in items:
    process(item)

for i in range(10):   # [0, 10)
    print(i)
```

Source: <https://mojolang.org/docs/reference/compound-statements/>.

This is a syntactic position, not the membership operator: the `for` header needs
something iterable, whereas `in` as an operator needs a container whose
`__contains__()` can be called. The official keywords page describes `in` only as
a membership test; the `for` usage is defined by the compound-statements
grammar. Source:
<https://mojolang.org/docs/reference/compound-statements/>.

## Interaction with related keywords

| Related keyword | Relationship |
|-----------------|--------------|
| `for` | Uses `in` as the header separator for iteration. |
| `not` | `not in` is the negated membership operator. |
| `is` | Same precedence, chains with `in`. |
| `and`, `or` | Looser than `in`; a membership test binds first. |
| `True`, `False` | The result type of a membership test is `Bool`. |
| `assert` | Membership is a common assertion condition. |

## Signature vs. body

`in` never appears in a signature. It is an expression operator (usable in
bodies, conditions, `comptime` expressions, `where` clauses) and a `for`-header
token.

## Pitfalls

- **Assuming `in` means "subsequence".** For a `List` it is element containment
  via `__contains__()`, not a contiguous-subsequence search. For a `String` it
  is substring search, per the manual's example.
- **Defining `__contains__` on the element.** The method belongs on the
  container; `x in collection` never calls anything on `x`. Source:
  <https://mojolang.org/docs/reference/operators/>.
- **Slow membership in a `List`.** `List.__contains__()` is a linear scan;
  repeated membership tests over a large list are O(n) each. Use a `Set`/`Dict`
  when the collection is used mainly for membership.
- **Confusing the operator with the `for` separator.** `for x in y` compiles even
  though `y` has no `__contains__()`, because that `in` is grammar, not an
  operator.
- **Negative indices are gone.** Element checks that used `x[-1]` must be
  rewritten; Mojo collections reject negative indexing. Source:
  <https://mojolang.org/releases/v1.0.0b1/>.
- **Expecting `not in` to be `not (… in …)` spelled together.** It is one
  operator token, with its own precedence slot; mixing it with comparisons can
  still be surprising, so parenthesize complex chains.
- **`in` on `Optional`.** `Optional` is an `Iterable` of 0 or 1 elements, so
  iterating works, but membership tests should not be used to test for presence;
  use `is not None` or a truthiness check. Source:
  <https://mojolang.org/releases/v1.0.0/>.

## See also

[`def`](def.md), the deprecated [`fn`](fn.md), and [`index`](index.md).
Related pages: [`is`](is.md), [`not`](not.md), [`for`](for.md),
[`and`](and.md), [`or`](or.md), [`operators`](../basics/operators.md).
`reference/operators` (planned) stays a plain code span; the operator reference
is covered by [`basics/operators.md`](../basics/operators.md).

## Sources

- Mojo identifiers, keywords, and conventions reference:
  <https://mojolang.org/docs/reference/keywords/>
- Mojo operator reference:
  <https://mojolang.org/docs/reference/operators/>
- Operators (manual): <https://mojolang.org/docs/manual/operators/>
- Mojo compound statements reference:
  <https://mojolang.org/docs/reference/compound-statements/>
- Mojo v1.0.0b1 release notes: <https://mojolang.org/releases/v1.0.0b1/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
