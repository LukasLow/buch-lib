# collections

`collections` is where Mojo's container types live.

> Core data types: List, Dict, Set, Optional, String, and other collections.

> The `collections` package provides fundamental data structures for organizing
> and managing data in Mojo programs. It includes general-purpose collections
> like dynamic arrays, hash maps, and sets, along with specialized structures for
> specific use cases. These types form the foundation for most data manipulation
> in Mojo and integrate seamlessly with the language's iteration and memory
> management systems.

Source: <https://mojolang.org/docs/std/collections/>.

The type-level treatment of these containers, including how they are chosen and
how interior origins work, is in the types chapter:
[Collections](../types/collections.md) and
[Optionals and nullability](../types/optionals-and-nullability.md). This page is
the package-level API reference: what each module exports, what an agent
actually uses, and what the stability situation is.

## Modules and types

| Module | Main type | Import |
|--------|-----------|--------|
| `list` | `List` | prelude (no import) |
| `array` | `Array` | prelude (no import) |
| `string` (subpackage) | `String`, `StringSpan` | prelude (no import) |
| `optional` | `Optional` | prelude (no import) |
| `dict` | `Dict` | prelude (no import) |
| `set` | `Set` | `from std.collections import Set` |
| `span` | `Span` | prelude (no import) |
| `binary_heap` | `BinaryHeap` | `from std.collections.binary_heap import BinaryHeap` |
| `bitset` | `BitSet` | `from std.collections.bitset import BitSet` |
| `counter` | `Counter` | `from std.collections.counter import Counter` |
| `deque` | `Deque` | `from std.collections.deque import Deque` |
| `interval` | `Interval`, `IntervalTree` | `from std.collections.interval import ...` |
| `linked_list` | `LinkedList` | `from std.collections.linked_list import LinkedList` |
| `type_dict` | `TypeDict` | `from std.collections.type_dict import TypeDict` |
| `check_bounds` | `check_bounds`, `check_slice_bounds` | internal bounds-check helpers |

Source: <https://mojolang.org/docs/std/collections/>.

`List`, `Array`, `Dict`, `Optional`, `String` and `Span` are in the
[`prelude`](prelude.md); the rest need an import. `Set` is the classic trap: the
**display** `{1, 2, 3}` is core syntax, but the **type** `Set[Int]` must be
imported.

## `List` — dynamic sequence

`List` is a growable, heap-backed sequence, parameterized as
`List[T: Movable, /]`.

```mojo
def main():
    var numbers = List[Int]()
    numbers.append(1)
    numbers.append(2)

    var filled = List[Float64](length=3, fill=0.0)
    var preallocated = List[String](capacity=100)

    print(len(numbers))       # 2
    print(numbers.pop())      # 2
    print(numbers.capacity()) # current allocated capacity
```

The characteristics that matter:

- **Value semantics.** Assignment is a deep copy, and `List` is not implicitly
  copyable — write `.copy()` explicitly.
  ```mojo
  var a = List[Int](1, 2, 3)
  var b = a.copy()          # deep copy
  b.append(4)
  print(a, b)               # [1, 2, 3] [1, 2, 3, 4]
  ```
- **Reference iteration is immutable unless you ask for `ref`.**
  ```mojo
  var nums = [10, 20, 30]   # an Array; annotate as List[Int] for a List
  for ref n in nums:
      n += 1
  ```
- **Out-of-bounds access aborts**: the docs show `my_list[5]` aborting with
  "index 5 is out of bounds, valid range is 0 to 2".

Source: <https://mojolang.org/docs/std/collections/list/List/>.

Methods worth knowing: `append`, `insert(i, value)`, `extend`, `pop()`/`pop(i)`,
`reserve`, `resize(length, fill)`, `shrink(new_length)`, `reverse`, `count`,
`index`, `try_index`, `clear`, `capacity()`, `swap_elements`. Source:
<https://mojolang.org/docs/std/collections/list/List/>.

> **1.x sharp edge:** a list expression `[1, 2, 3]` constructs an **`Array`**,
> not a `List`. Annotate the declaration (`var numbers: List[Int] = [1, 2, 3]`)
> when you need a growable list. Source:
> <https://mojolang.org/releases/v1.0.0/>.

## `Array` — fixed-size, inline

`Array[T: AnyType, length: Int]` is compiled to inline storage with a
compile-time length. It is the default container for `[1, 2, 3]`.

```mojo
def main():
    var arr: Array[Int, 3] = [1, 2, 3]
    print(arr[0])                 # 1
    print(len(arr))               # 3 (compile-time constant)

    var filled = Array[Int, 5](fill=42)
    print(filled[4])              # 42

    print(3 in arr)               # True
```

`Array` is stable since 1.0.0 ("Stable since 1.0.0"). It conforms to `Copyable`
but **not** `ImplicitlyCopyable`; copy with `.copy()`. Its `length` parameter
replaced the old `size`, and the type itself replaced `InlineArray`. Sources:
<https://mojolang.org/docs/std/collections/array/Array/>,
<https://mojolang.org/docs/std/collections/array/>.

## `Dict` — key-value mapping

> Dict provides an efficient, O(1) amortized average-time complexity for insert,
> lookup, and removal of dictionary elements. It uses a Swiss Table
> implementation with SIMD group probing for fast lookups... Insertion order is
> implicitly preserved.

Source: <https://mojolang.org/docs/std/collections/dict/>.

The bounds are important:

> Key elements only need to be `Movable & Hashable & Equatable`. Methods that
> fundamentally need to copy keys (`copy`, `update`, `__or__`, `fromkeys`,
> iteration, ...) are conditionally available via
> `where conforms_to(K, Copyable)` clauses.

> Value elements only need to be `Movable & Deinitable`.

Source: <https://mojolang.org/docs/std/collections/dict/>. The shorthand for the
key bound is exported as `KeyElement = Equatable & Hashable & Movable`.

```mojo
def main():
    var scores = {"Alice": 95, "Bob": 87}

    scores["Charlie"] = 92                 # insert
    scores["Alice"] = 99                   # update
    print(scores["Alice"])                 # 99

    # Safe access — `[]` raises DictKeyError on a missing key.
    print(scores.get("Dave", 0))           # 0

    # Membership
    print("Bob" in scores)                 # True

    # Iteration
    for key in scores.keys():
        print(key)
    for value in scores.values():
        print(value)
    for item in scores.items():
        print(item.key, "=>", item.value)
```

Source: <https://mojolang.org/docs/std/collections/dict/Dict/>.

`Dict` is not implicitly copyable: use `dict.copy()`. Sources:
<https://mojolang.org/docs/std/collections/dict/Dict/>.

## `Set` — unique values

> O(1) average-case amortized add, remove, and membership check.

Source: <https://mojolang.org/docs/std/collections/set/Set/>.

```mojo
from std.collections import Set

def main():
    var s = Set[Int](1, 2, 3)
    s.add(4)
    print(4 in s)                                    # True
    print(s.union(Set[Int](5)))                      # {1, 2, 3, 4, 5}
    print(s.intersection(Set[Int](2, 3, 9)))         # {2, 3}
    print(s.difference(Set[Int](1)))                 # {2, 3, 4}
    print(s.issubset(Set[Int](1, 2, 3, 4, 5)))       # True
    print(s.isdisjoint(Set[Int](7, 8)))              # True
```

`Set` implements the full set algebra as both methods and operators: `|`, `&`,
`-`, `^` with the in-place forms `|=`, `&=`, `-=`, `^=`, plus the subset/superset
comparisons `<`, `<=`, `>`, `>=`. Source:
<https://mojolang.org/docs/std/collections/set/Set/>.

## `Optional` — a value that may be absent

`Optional[T]` is Mojo's type-safe nullable. It is **stable since 1.0.0**.

```mojo
def main():
    var a = Optional(1)
    var b = Optional[Int](None)

    if a:
        print(a.value())        # 1
    if b:                       # Bool(b) is False → no print
        print(b.value())

    print(a.or_else(2))         # 1
    print(b.or_else(2))         # 2

    print(b is None)            # True
    print(a.take())             # 1; `a` is now None
```

Source: <https://mojolang.org/docs/std/collections/optional/Optional/>.

`Optional` is also iterable as a collection of size 0 or 1, and provides
`map()`, `and_then()`, `take()`/`unsafe_take()`, `unsafe_value()` and
`bounds()`. Its **layout is explicitly not guaranteed** — niche optimizations
may change it — so do not depend on `size_of[Optional[T]]()`.

## `String` and `StringSpan`

The `string` **subpackage** holds `String` (owning, mutable, UTF-8),
`StringSpan` (non-owning view) and `StaticString` (compile-time constant view).

```mojo
def main():
    var text = "Hello"
    text += " World"                        # in-place concatenation
    print(text)                             # Hello World
    print(text.byte_length())               # 11
    print("World" in text)                  # True
    print(text.find("World"))               # 6
    print(text.replace("Hello", "Hi"))      # Hi World
    print("{} is {}".format("Mojo", "fun")) # Mojo is fun
```

> String stores data using UTF-8, and all operations (unless clearly noted) are
> intended to be fully Unicode compliant and maintain correct UTF-8 encoded data.

Source: <https://mojolang.org/docs/std/collections/string/>. `String` is
**stable since 1.0.0**.

The iteration rule: iterating a `String` yields **grapheme clusters**; use
`.codepoints()` or `.bytes()` to iterate at other granularities. Byte versus
character counts differ: `"café".byte_length()` is 5 while
`"café".count_codepoints()` is 4. Source:
<https://mojolang.org/docs/std/collections/string/string/String/>.

## `Span` — non-owning view

`Span` is "A non-owning view of contiguous data." It is **stable since 1.0.0**
and is parameterized on the origin of the data it views:

```text
struct Span[mut: Bool, //, T: AnyType, origin: Origin[mut=mut], *, address_space: AddressSpace = AddressSpace.GENERIC]
```

Source: <https://mojolang.org/docs/std/collections/span/Span/>. A contiguous
`List` slice yields a `Span`; a strided slice yields a new `List`. Source:
<https://mojolang.org/docs/reference/types/>.

```mojo
def main():
    var items = [0, 1, 2, 3, 4, 5]
    var middle = items[1:4]        # Span view: [1, 2, 3]
    print(len(middle))             # 3
```

`Span` provides `fill`, `copy_from`, `swap_elements`, `reverse`, `apply`,
`count`, `binary_search_by` and `unsafe_*` accessors. Note that `apply` and
`count` are the SIMD-batched forms: `apply` maps a width-parametric closure over
the span in place.

## The other containers

- **`BinaryHeap[T: Comparable & Copyable & Deinitable]`** — "A List-backed binary
  max-heap." `push`, `pop`, `peek`; `O(log n)`.
  ```mojo
  from std.collections.binary_heap import BinaryHeap
  var heap = BinaryHeap[Int]()
  heap.push(5); heap.push(10); heap.push(3)
  print(heap.peek())   # 10
  print(heap.pop())    # 10
  ```
  Source: <https://mojolang.org/docs/std/collections/binary_heap/BinaryHeap/>.
- **`Deque[ElementType: Movable]`** — "a double-ended queue ... pushing and
  popping from both ends in O(1)". `append`/`appendleft`, `pop`/`popleft`,
  `peek`/`peekleft`, `rotate`, `extendleft`, plus a `maxlen` bound. Source:
  <https://mojolang.org/docs/std/collections/deque/Deque/>.
- **`BitSet`** — "A grow-only set storing non-negative integers efficiently
  using bits." Source: <https://mojolang.org/docs/std/collections/bitset/>.
- **`Counter`** — "A container for counting hashable items"; `CountTuple` pairs a
  value with its count. Source:
  <https://mojolang.org/docs/std/collections/counter/>.
- **`LinkedList[Node]`** — "A doubly-linked list implementation." Source:
  <https://mojolang.org/docs/std/collections/linked_list/>.
- **`Interval` / `IntervalTree`** — a half-open `[start, end)` interval and "a
  self-balancing interval tree ... for efficient range queries." Source:
  <https://mojolang.org/docs/std/collections/interval/>.
- **`TypeDict`** — "A compile-time map from a value of type `T` to a type."
  Source: <https://mojolang.org/docs/std/collections/type_dict/>.
- **`check_bounds` / `check_slice_bounds`** — "Bounds check which is on by
  default for CPU, and off by default for GPU." Source:
  <https://mojolang.org/docs/std/collections/check_bounds/>.

## Idioms

- **Annotate the container you mean.** `var x = [1, 2, 3]` is an `Array`; write
  `var x: List[Int] = [1, 2, 3]` for a growable list.
- **Copy explicitly.** `Array`, `List`, `Dict` and `Set` are not implicitly
  copyable.
- **Use `get()` rather than `[]` when a `Dict` key may be absent.**
- **Use a `Span` to pass a view without copying**; use `StringSpan` for text.
- **Store heterogeneous values in a `Variant`** (from [`utils`](utils.md)), not
  a `List` — a `List`'s element type is fixed at compile time.
- **Iterate with `enumerate`/`zip` from [`iter`](iter.md)** rather than manual
  index loops.

## Pitfalls

- **Assuming `[1, 2, 3]` is a `List`.** It is an `Array`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Assuming assignment copies implicitly.** It does not compile for
  `Array`/`List`/`Dict`/`Set`; use `.copy()`.
- **Negative indexing.** Removed in 1.0; write `x[len(x) - 1]`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Holding an element reference across a mutation.** The interior-origin
  checker rejects it; take the reference again after the mutation. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Reading `list.capacity` as a field.** It is `capacity()`. Source:
  <https://mojolang.org/releases/v1.0.0/>.
- **Forgetting to import `Set`.** The display needs no import; the type does.
- **`print()`-ing a `List`.** The manual notes you cannot `print()` a list or
  convert it directly to a string; print the elements or use a `Writable` type.
- **Relying on `Optional`'s or `Variant`'s layout.** Both are explicitly
  documented as not guaranteed.
- **Writing `InlineArray` or `StringSlice` in new code.** Those are
  migration aliases; the 1.x names are `Array` and `StringSpan`.

## Stability

The package mixes stable and unstable APIs, and the `collections` package page
itself carries no badge. What the official pages mark:

| API | Stability |
|-----|-----------|
| `Array` | Stable since 1.0.0 (struct). |
| `List` | Stable since 1.0.0 (struct); individual members are badged case by case (e.g. `capacity()` carries a 1.0.0 badge). |
| `Span` | Stable since 1.0.0 (struct). |
| `Optional` | Stable since 1.0.0 (struct). |
| `String` | Stable since 1.0.0 (struct). |
| Everything else on this page | **Unstable by default** — no marker on the package page or the module pages. |

Remember the member rule: a stable struct's *signature* is stable, not
necessarily its members. "Marking a struct stable means that the struct's
*signature* is stable. It **doesn't** guarantee that any member APIs are
stable." Sources: <https://mojolang.org/docs/std/collections/array/Array/>,
<https://mojolang.org/docs/std/collections/list/List/>,
<https://mojolang.org/docs/std/collections/span/Span/>,
<https://mojolang.org/docs/std/collections/optional/Optional/>,
<https://mojolang.org/docs/std/collections/string/string/String/>,
<https://mojolang.org/docs/api-docs/stability/>.

## Sources

- Mojo `collections` package: <https://mojolang.org/docs/std/collections/>
- Mojo `List` struct: <https://mojolang.org/docs/std/collections/list/List/>
- Mojo `Array` struct: <https://mojolang.org/docs/std/collections/array/Array/>
- Mojo `array` module: <https://mojolang.org/docs/std/collections/array/>
- Mojo `Dict` struct: <https://mojolang.org/docs/std/collections/dict/Dict/>
- Mojo `dict` module: <https://mojolang.org/docs/std/collections/dict/>
- Mojo `Set` struct: <https://mojolang.org/docs/std/collections/set/Set/>
- Mojo `Optional` struct: <https://mojolang.org/docs/std/collections/optional/Optional/>
- Mojo `Span` struct: <https://mojolang.org/docs/std/collections/span/Span/>
- Mojo `string` subpackage: <https://mojolang.org/docs/std/collections/string/>
- Mojo `String` struct: <https://mojolang.org/docs/std/collections/string/string/String/>
- Mojo `BinaryHeap` struct: <https://mojolang.org/docs/std/collections/binary_heap/BinaryHeap/>
- Mojo `Deque` struct: <https://mojolang.org/docs/std/collections/deque/Deque/>
- Mojo `bitset` module: <https://mojolang.org/docs/std/collections/bitset/>
- Mojo `counter` module: <https://mojolang.org/docs/std/collections/counter/>
- Mojo `linked_list` module: <https://mojolang.org/docs/std/collections/linked_list/>
- Mojo `interval` module: <https://mojolang.org/docs/std/collections/interval/>
- Mojo `type_dict` module: <https://mojolang.org/docs/std/collections/type_dict/>
- Mojo `check_bounds` module: <https://mojolang.org/docs/std/collections/check_bounds/>
- Mojo stability guarantees: <https://mojolang.org/docs/api-docs/stability/>
- Mojo v1.0.0 release notes: <https://mojolang.org/releases/v1.0.0/>
