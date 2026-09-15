# iter

`iter` defines Mojo's iteration protocol and the standard iteration utilities.

> Iteration traits and utilities: Iterable, IterableOwned, Iterator, enumerate,
> zip, map.

Source: <https://mojolang.org/docs/std/iter/>.

## The three traits

The package page states the protocol exactly:

> - `Iterable`: Types that can produce an iterator by borrowing (`ref self`). The
>   iterator borrows the collection and yields references or copies of elements
>   without consuming the source.
> - `IterableOwned`: Types that can produce an iterator by taking ownership (`var
>   self`). The iterator consumes the collection, taking ownership of its
>   elements.
> - `Iterator`: Types that can produce a sequence of values one at a time.

Source: <https://mojolang.org/docs/std/iter/>.

The relationship to `for` is direct: "Types that conform to these traits can be
used with `for` loops and iteration utilities like `enumerate()`, `zip()`, and
`map()`." That is the whole reason the traits exist.

| Trait | Its method | Selected by |
|-------|-----------|-------------|
| `Iterable` | `__iter__(ref self)` | `for x in collection` |
| `IterableOwned` | `__iter__(var self)` | `for x in collection^` |
| `Iterator` | `__next__()` / `next()` | the `for` machinery |

The distinction between the first two is exactly the `^` transfer sigil at the
loop: borrowing iteration does not consume, owned iteration does. The library
types implement both — for example `List` has
`__iter__(ref self)` and `__iter__(var self)`. Source:
<https://mojolang.org/docs/std/collections/list/List/>.

`StopIteration` is "A custom error type for Iterator's that run out of
elements." Source: <https://mojolang.org/docs/std/iter/StopIteration/>.

## The functions

| Function | What it does |
|----------|--------------|
| `chain` | "Chain multiple iterables that return the same type." |
| `empty` | "Creates an iterator that yields nothing." |
| `enumerate` | "Returns an iterator that yields tuples of the index and the element of the original iterator." |
| `iter` | "Constructs an owned iterator from an iterable." |
| `map` | "Returns an iterator that applies `function` to each element of the input iterable." |
| `next` | "Advances the iterator and returns the next element." |
| `once` | "Creates an iterator that yields an element exactly once." |
| `peekable` | "Returns a peekable iterator that can use the `peek` method to look ahead at the next element without advancing the iterator." |
| `zip` | "Returns an iterator that yields tuples of the elements of the original iterables." |

Source: <https://mojolang.org/docs/std/iter/>.

## The runnable example

The package page's own example covers the three most-used functions:

```mojo
from std.iter import enumerate, zip, map

# Enumerate with index
var items = ["a", "b", "c"]
for index, value in enumerate(items):
    print(index, value)

# Zip multiple iterables
var numbers = [1, 2, 3]
var letters = ["x", "y", "z"]
for num, letter in zip(numbers, letters):
    print(num, letter)

# Map a function over an iterable
var values = [1, 2, 3, 4]
for squared in map[lambda (x: Int) -> Int: x * x](values):
    print(squared)
```

Source: <https://mojolang.org/docs/std/iter/>.

Three things to notice:

- `enumerate` and `zip` yield **tuples**, and `for` unpacks them directly.
- `map` takes its function as a **parameter** (`map[lambda ...]`), consistent
  with Mojo's parameter/argument split.
- The lambda is 1.x syntax: `lambda (x: Int) -> Int: x * x`. See
  [closures and lambdas](../functions/closures-and-lambdas.md).

## `peekable` and `once`

```mojo
from std.iter import peekable, once

def main():
    var it = peekable([1, 2, 3])
    print(it.peek())        # 1, without advancing
    print(next(it))         # 1
    print(next(it))         # 2

    for x in once(42):
        print(x)            # 42
```

Sources: <https://mojolang.org/docs/std/iter/peekable/>,
<https://mojolang.org/docs/std/iter/once/>.

## `iter` versus `algorithm.map`

The [`algorithm`](algorithm.md) package also has a `map`. They are different
things:

| Call | Kind | What it maps over |
|------|------|-------------------|
| `algorithm.map` | Eager, index-based | the integer range `[0, size)` |
| `iter.map` | Lazy iterator | the elements of an iterable |

The `algorithm.map` reference calls the distinction out explicitly: "Don't
confuse `algorithm.map` (this eager, index-based helper) with `iter.map`, which
returns a lazy iterator that applies a function to each element." Source:
<https://mojolang.org/docs/std/algorithm/backend/cpu/map/map/>.

## Idioms

- **Implement `Iterable` on your own container** and it works with `for`,
  `enumerate`, `zip`, `map`, comprehensions and the `itertools` combinators.
- **Use `enumerate` instead of `range(len(x))`.** It is clearer and yields the
  element directly.
- **Use `zip` for parallel iteration** over two or more sequences.
- **Use `for x in container^` when the container is dead afterwards.** That
  selects `IterableOwned` and avoids copies.
- **Use `peekable` when you need one-token lookahead** on a stream.
- **Chain lazy operations** (`map`, `zip`, `take`, `drop`) for pipelines; see
  [`itertools`](itertools.md).

## Pitfalls

- **Consuming an owned iterator twice.** `for x in c^` takes ownership; the
  container is unusable afterwards. Verified from the protocol description at
  <https://mojolang.org/docs/std/iter/>.
- **Expecting `map` to be eager.** It returns an iterator; nothing runs until it
  is consumed.
- **Forgetting that `map`'s function is a parameter.** Write `map[f](xs)`, not
  `map(f, xs)`.
- **Assuming an iterator is re-iterable.** An `Iterator` produces values "one at
  a time"; re-iterate the *iterable*, not the iterator.
- **Confusing `iter.map` with `algorithm.map`.**
- **Mutating a borrowed collection during by-reference iteration.** The origin
  rules forbid it; see
  [Collections](../types/collections.md).

> **Open question:** the `iter` package page does not show signatures for the
> functions it lists (`chain`, `zip`, `map`, `next`, `once`, `peekable`,
> `empty`), only one-line descriptions. Read the individual pages (for example
> <https://mojolang.org/docs/std/iter/zip/>) for exact parameter lists and the
> number of iterable arguments each accepts.

## Stability

The `iter` package page and the `Iterable`, `IterableOwned`, `Iterator` and
`StopIteration` pages show **no `@stable(since=...)` markers** and no stability
badges. Under the standard-library rule — "We consider standard library APIs
unstable unless specifically marked stable" — these APIs are **unstable by
default**. Sources: <https://mojolang.org/docs/std/iter/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `iter` package: <https://mojolang.org/docs/std/iter/>
- Mojo `Iterable` trait: <https://mojolang.org/docs/std/iter/Iterable/>
- Mojo `IterableOwned` trait: <https://mojolang.org/docs/std/iter/IterableOwned/>
- Mojo `Iterator` trait: <https://mojolang.org/docs/std/iter/Iterator/>
- Mojo `StopIteration`: <https://mojolang.org/docs/std/iter/StopIteration/>
- Mojo `enumerate`: <https://mojolang.org/docs/std/iter/enumerate/>
- Mojo `zip`: <https://mojolang.org/docs/std/iter/zip/>
- Mojo `map`: <https://mojolang.org/docs/std/iter/map/>
- Mojo `peekable`: <https://mojolang.org/docs/std/iter/peekable/>
- Mojo `once`: <https://mojolang.org/docs/std/iter/once/>
- Mojo `iter` function: <https://mojolang.org/docs/std/iter/iter/>
- Mojo `next`: <https://mojolang.org/docs/std/iter/next/>
- Mojo `algorithm.map` reference: <https://mojolang.org/docs/std/algorithm/backend/cpu/map/map/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
