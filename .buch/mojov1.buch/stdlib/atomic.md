# atomic

`atomic` is Mojo's low-level concurrency foundation: atomic values and memory
orderings.

> Atomic operations and memory orderings.

> The `atomic` package provides the `Atomic` type for performing atomic
> read-modify-write operations on scalar values, along with the `Ordering` type
> for specifying the memory ordering of those operations. It also exposes the
> `fence` function to create standalone memory barriers.

> Use this package when implementing lock-free data structures, reference
> counting, or any other synchronization primitive that requires fine-grained
> control over memory ordering between threads.

Source: <https://mojolang.org/docs/std/atomic/>.

## `Atomic`

The `Atomic` struct wraps one scalar value and exposes atomic operations on it:

```text
struct Atomic[dtype: DType, *, scope: StringSpan[ImmStaticOrigin] = StringSpan("")]
```

Sources: <https://mojolang.org/docs/std/atomic/atomic/Atomic/>,
<https://mojolang.org/docs/std/atomic/>.

Its `scope` parameter is "The memory synchronization scope"; its `value` field is
a `Scalar[dtype]`, and the documentation is explicit that access goes through
atomic operations: "This is the underlying value of the atomic. Access to the
value can only occur through atomic primitive operations."

### Construction

```mojo
def __init__(out self, value: Scalar[dtype])
```

### Operations

Every operation takes an `ordering` **compile-time parameter** with a default of
`Ordering.SEQUENTIAL` (or `Ordering.RELAXED` on Apple GPU). There are instance
methods and matching `static` pointer-based forms.

| Operation | Signature shape | Returns |
|-----------|-----------------|---------|
| Load | `load[*, ordering]()` | The current value. |
| Store | `store[*, ordering](value)` | Nothing. |
| Fetch-add | `fetch_add[*, ordering](rhs)` | The value **before** addition. |
| Fetch-sub | `fetch_sub[*, ordering](rhs)` | The value **before** subtraction. |
| Add in place | `__iadd__(rhs)` | Nothing; semantically `+=`. |
| Sub in place | `__isub__(rhs)` | Nothing; semantically `-=`. |
| Compare-exchange | `compare_exchange[*, success_ordering, failure_ordering, weak](expected, desired)` | `Bool`; on failure `expected` is rewritten with the current value. |
| Max | `max[*, ordering](rhs)` | Nothing. |
| Min | `min[*, ordering](rhs)` | Nothing. |

The pointer forms are `static` methods, for example
`Atomic.load[ordering=...](ptr)` and
`Atomic.fetch_add[ordering=...](ptr, rhs)`.

Source: <https://mojolang.org/docs/std/atomic/atomic/Atomic/>.

A runnable counter example:

```mojo
from std.atomic import Atomic

def main():
    var counter = Atomic[DType.int64](0)

    # Read the current value.
    print(counter.load())                 # 0

    # Atomic read-modify-write: fetch_add returns the OLD value.
    var old = counter.fetch_add(5)
    print(old, counter.load())            # 5 5

    # The in-place operators are the idiomatic shorthand.
    counter += 3
    counter -= 1
    print(counter.load())                 # 7

    # Store with an explicit weaker ordering.
    counter.store[ordering=Ordering.RELAXED](10)
    print(counter.load[ordering=Ordering.ACQUIRE]())  # 10

    # Compare-exchange loop.
    var expected: Int64 = 10
    var swapped = counter.compare_exchange(expected, 42)
    print(swapped, counter.load())        # True 42
```

The doc comments for `fetch_add` spell out its semantics precisely: it "Atomically
replaces the current value with the result of arithmetic addition of the value
and arg. That is, it performs atomic post-increment." — which is why it returns
the original value.

### `compare_exchange` in detail

The official description is the contract to remember:

> Atomically compares the value in ptr with that of the expected value. If the
> values are equal, then the ptr value is replaced with the desired value and
> True is returned. Otherwise, False is returned and the expected value is
> rewritten with the ptr value.

The `weak` parameter "Allows the comparison to fail spuriously even when `ptr`
equals `expected`. Only safe inside a retry loop." That makes the canonical
lock-free pattern:

```mojo
from std.atomic import Atomic

def main():
    var counter = Atomic[DType.int64](0)

    # Retry loop: `expected` is refreshed on every failed attempt.
    var expected = counter.load()
    while not counter.compare_exchange[weak=True](expected, expected + 1):
        pass
    print(counter.load())  # 1
```

## `Ordering`

`Ordering` is a struct of constants, not an enum keyword. It has exactly these
members:

| Constant | Meaning |
|----------|---------|
| `Ordering.NOT_ATOMIC` | Not atomic. |
| `Ordering.UNORDERED` | Unordered. |
| `Ordering.RELAXED` | Relaxed. |
| `Ordering.ACQUIRE` | Acquire. |
| `Ordering.RELEASE` | Release. |
| `Ordering.ACQUIRE_RELEASE` | Acquire-release. |
| `Ordering.SEQUENTIAL` | Sequentially consistent. |

Source: <https://mojolang.org/docs/std/atomic/atomic/Ordering/>.

The ordering is passed as a **parameter**, using `ordering=`:

```mojo
counter.store[ordering=Ordering.RELEASE](1)
var seen = counter.load[ordering=Ordering.ACQUIRE]()
```

`Ordering` conforms to `Equatable` and `Writable`, and provides
`as_string_slice() -> StaticString` plus the `write_to`/`write_repr_to` pair.
Source: <https://mojolang.org/docs/std/atomic/atomic/Ordering/>.

## `fence`

The package page names a `fence` function: "Creates an atomic fence." Source:
<https://mojolang.org/docs/std/atomic/atomic/fence/>. It is a standalone memory
barrier, used when ordering is needed between operations that are not themselves
atomic.

## Idioms

- **Pick the weakest ordering that is correct.** Default to `Ordering.SEQUENTIAL`
  while reasoning, then relax to `ACQUIRE`/`RELEASE` or `RELAXED` once the
  happens-before argument is explicit.
- **Use `fetch_add` when you need the previous value** (reference counting) and
  `+=` when you do not.
- **Always wrap a `weak=True` compare-exchange in a retry loop**, rereading
  `expected` from the failed call.
- **Prefer the instance methods**; the `static` pointer forms exist for code
  that already holds a `Pointer`.

## Pitfalls

- **Expecting `fetch_add` to return the new value.** It returns the value
  *before* the operation. Verified above.
- **Ignoring the `expected` rewrite on compare-exchange failure.** The failed
  call overwrites `expected` with the current value; treating it as unchanged
  breaks the retry loop. Verified above.
- **Using a relaxed ordering without a synchronization argument.** Sequential
  consistency is the documented default for a reason.
- **Passing an ordering as a runtime argument.** `ordering` is a parameter
  (`[ordering=...]`), not a positional argument. Verified above.
- **Using `Atomic` where a plain `var` suffices.** Atomics cost more; they are
  for values shared across threads.
- **Assuming a stable API.** See below.

## Stability

Neither the `atomic` package page nor the `Atomic` and `Ordering` pages show a
`@stable(since=...)` marker or a stability badge. Under the standard-library
rule — "We consider standard library APIs unstable unless specifically marked
stable" — these APIs are **unstable by default**. Sources:
<https://mojolang.org/docs/std/atomic/>,
<https://mojolang.org/docs/std/atomic/atomic/Atomic/>,
<https://mojolang.org/docs/api-docs/stability/>.

> **Open question:** the `atomic` package page names `fence` as part of the
> package ("It also exposes the `fence` function"), but the package page's module
> list shows only `atomic`, and the `fence` page carries no signature in the
> package-level Markdown. Read the symbol page
> (<https://mojolang.org/docs/std/atomic/atomic/fence/>) before relying on its
> exact parameters.

## Sources

- Mojo `atomic` package: <https://mojolang.org/docs/std/atomic/>
- Mojo `Atomic` struct: <https://mojolang.org/docs/std/atomic/atomic/Atomic/>
- Mojo `Ordering` struct: <https://mojolang.org/docs/std/atomic/atomic/Ordering/>
- Mojo `fence` function: <https://mojolang.org/docs/std/atomic/atomic/fence/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
