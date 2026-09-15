# itertools

`itertools` is the collection of lazy iterator combinators.

> Iterator tools for lazy sequence generation and transformation.

> The `itertools` package provides utilities for creating and composing iterators
> for efficient lazy evaluation. It offers building blocks for:
>
> - Generating infinite sequences (`count`, `cycle`, `repeat`)
> - Computing Cartesian products (`product`)
> - Slicing iterators by count (`take`, `drop`)
> - Filtering elements conditionally (`take_while`, `drop_while`)

Source: <https://mojolang.org/docs/std/itertools/>.

The package's own summary of the value proposition: "These tools enable
functional programming patterns and memory-efficient iteration over large or
infinite sequences without materializing entire collections in memory."

## The functions

| Function | What it does |
|----------|--------------|
| `count` | "Constructs an iterator that starts at the value `start` with a stride of `step`." |
| `cycle` | "Creates an iterator that cycles through an iterable indefinitely." |
| `repeat` | "Constructs an iterator that repeats the given element a specified number of times." |
| `product` | "Returns an iterator that yields tuples of the elements of the outer product of the iterables." |
| `take` | "Creates an iterator that yields the first `count` elements." |
| `drop` | "Creates an iterator that drops the first `count` elements." |
| `take_while` | "Creates an iterator that yields elements while predicate returns True." |
| `drop_while` | "Creates an iterator that drops elements while predicate returns True." |

Sources: <https://mojolang.org/docs/std/itertools/>,
<https://mojolang.org/docs/std/itertools/itertools/>.

`product` explicitly supports two, three or four iterables: "Computes the
Cartesian product of two, three, or four iterables." Source:
<https://mojolang.org/docs/std/itertools/itertools/>.

## A runnable example

```mojo
from std.itertools import count, take, drop, repeat, cycle, product

def main():
    # Infinite counter, cut to the first five values.
    for i in take(count(), 5):
        print(i)                     # 0 1 2 3 4

    # Step by 10 instead of 1.
    for i in take(count(step=10), 3):
        print(i)                     # 0 10 20

    # Skip and keep.
    for i in drop(take(count(), 10), 7):
        print(i)                     # 7 8 9

    # Repeat a value.
    for s in repeat("x", 3):
        print(s)                     # x x x

    # Cycle forever (bounded here).
    for v in take(cycle([1, 2]), 5):
        print(v)                     # 1 2 1 2 1

    # Cartesian product of two iterables.
    for a, b in product([1, 2], ["a", "b"]):
        print(a, b)                  # 1 a, 1 b, 2 a, 2 b
```

## Why laziness matters

Every function on this page returns an iterator, so nothing is computed until it
is consumed. That is what makes infinite sources (`count`, `cycle`) usable: they
only terminate because a bounded consumer (`take`, `take_while`, a `break`) stops
them.

Combined with [`iter`](iter.md)'s `map` and `zip`, this gives a small lazy
pipeline vocabulary:

```mojo
from std.itertools import count, take
from std.iter import map

def main():
    for squared in take(map[lambda (x: Int) -> Int: x * x](count()), 4):
        print(squared)     # 0 1 4 9
```

## Idioms

- **Lead with a bound.** Any pipeline that starts at `count()` or `cycle()` must
  contain `take`, `take_while`, or a `break`.
- **Prefer combinators to index arithmetic.** `take`/`drop` state the intent;
  `range` offsets hide it.
- **Chain lazily** with [`iter.map`](iter.md) and [`iter.zip`](iter.md) to avoid
  intermediate collections.
- **Use `product` for nested loops** over a fixed set of dimensions — it replaces
  an N-deep loop nest with one flat loop.
- **Remember only 2–4 iterables are supported by `product`.** Source:
  <https://mojolang.org/docs/std/itertools/itertools/>.

## Pitfalls

- **Consuming an unbounded iterator.** `for x in count()` never ends; bound it.
- **Expecting eager evaluation.** An unused `itertools` result computes nothing.
- **Reusing an exhausted iterator.** Iterators are single-pass; re-create the
  pipeline instead.
- **Assuming `repeat` without a count is bounded.** The docs describe repeating "a
  specified number of times"; the unbounded form, if used, must be bounded by the
  consumer.
- **Passing more than four iterables to `product`.** The documented support is
  two, three or four.
- **Confusing these with `algorithm`'s tiling helpers.** `count`/`cycle`/`take`
  are sequence combinators, not loop transformations; see
  [`algorithm`](algorithm.md).

> **Open question:** the `itertools` module page lists the functions with
> one-line descriptions but not their signatures, so the exact parameter names
> (for example `count`'s `start`/`step`, `repeat`'s count argument) are not
> reproduced here beyond the documented `step=10` usage. Read the individual
> pages (for example <https://mojolang.org/docs/std/itertools/itertools/count/>)
> before relying on a keyword.

## Stability

The `itertools` package page and the `itertools` module page show **no
`@stable(since=...)` marker** and no stability badges. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/itertools/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `itertools` package: <https://mojolang.org/docs/std/itertools/>
- Mojo `itertools` module: <https://mojolang.org/docs/std/itertools/itertools/>
- Mojo `count`: <https://mojolang.org/docs/std/itertools/itertools/count/>
- Mojo `cycle`: <https://mojolang.org/docs/std/itertools/itertools/cycle/>
- Mojo `repeat`: <https://mojolang.org/docs/std/itertools/itertools/repeat/>
- Mojo `product`: <https://mojolang.org/docs/std/itertools/itertools/product/>
- Mojo `take`: <https://mojolang.org/docs/std/itertools/itertools/take/>
- Mojo `drop`: <https://mojolang.org/docs/std/itertools/itertools/drop/>
- Mojo `take_while`: <https://mojolang.org/docs/std/itertools/itertools/take_while/>
- Mojo `drop_while`: <https://mojolang.org/docs/std/itertools/itertools/drop_while/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
